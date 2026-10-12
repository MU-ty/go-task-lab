package taskapi

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"
)

func newTestAPI(t *testing.T, store Store) (http.Handler, *bytes.Buffer) {
	t.Helper()
	var logs bytes.Buffer
	h, err := New(store, slog.New(slog.NewJSONHandler(&logs, nil)), Options{AllowedOrigin: "http://127.0.0.1:8090"})
	if err != nil {
		t.Fatal(err)
	}
	return h, &logs
}
func call(h http.Handler, method, path, body, token string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}
func requireStatus(t *testing.T, rec *httptest.ResponseRecorder, want int) {
	t.Helper()
	if rec.Code != want {
		t.Fatalf("status=%d want=%d body=%s", rec.Code, want, rec.Body.String())
	}
}
func seedIdentity(t *testing.T, store Store, email string) (int64, string) {
	t.Helper()
	u, err := store.CreateUser(context.Background(), email, "test-only-placeholder")
	if err != nil {
		t.Fatal(err)
	}
	token, err := randomToken()
	if err != nil {
		t.Fatal(err)
	}
	if err = store.CreateSession(context.Background(), tokenDigest(token), u.ID, time.Now().Add(time.Hour)); err != nil {
		t.Fatal(err)
	}
	return u.ID, token
}
func testCRUDContract(t *testing.T, store Store) {
	t.Helper()
	h, _ := newTestAPI(t, store)
	_, a := seedIdentity(t, store, "a@example.test")
	_, b := seedIdentity(t, store, "b@example.test")
	created := call(h, "POST", "/tasks", `{"title":"学习 'SQL' 与 Go"}`, a)
	requireStatus(t, created, 201)
	var task Task
	if err := json.Unmarshal(created.Body.Bytes(), &task); err != nil {
		t.Fatal(err)
	}
	path := fmt.Sprintf("/tasks/%d", task.ID)
	if created.Header().Get("Location") != path {
		t.Fatal("missing Location")
	}
	requireStatus(t, call(h, "GET", path, "", a), 200)
	for _, method := range []string{"GET", "PATCH", "DELETE"} {
		body := ""
		if method == "PATCH" {
			body = `{"done":true}`
		}
		requireStatus(t, call(h, method, path, body, b), 404)
	}
	list := call(h, "GET", "/tasks", "", b)
	requireStatus(t, list, 200)
	if !strings.Contains(list.Body.String(), `"items":[]`) {
		t.Fatal("cross-user list leak")
	}
	for _, done := range []bool{true, false} {
		updated := call(h, "PATCH", path, fmt.Sprintf(`{"done":%t}`, done), a)
		requireStatus(t, updated, 200)
		var got Task
		json.Unmarshal(updated.Body.Bytes(), &got)
		if got.Done != done {
			t.Fatal("missing versus false update broken")
		}
	}
	requireStatus(t, call(h, "DELETE", path, "", a), 204)
	requireStatus(t, call(h, "GET", path, "", a), 404)
	requireStatus(t, call(h, "GET", "/tasks", "", ""), 401)
}
func TestAPIContract(t *testing.T) { testCRUDContract(t, NewMemoryStore()) }
func TestAPIInputFailures(t *testing.T) {
	store := NewMemoryStore()
	h, _ := newTestAPI(t, store)
	_, token := seedIdentity(t, store, "input@example.test")
	cases := []struct {
		method, path, body string
		status             int
	}{
		{"POST", "/tasks", `{"title":"ok","owner_id":2}`, 400},
		{"POST", "/tasks", `{"title":"ok"}{"title":"again"}`, 400},
		{"POST", "/tasks", `{"title":" "}`, 400},
		{"POST", "/tasks", `{"title":5}`, 400},
		{"POST", "/tasks", `{"title":"` + strings.Repeat("x", 121) + `"}`, 400},
		{"POST", "/tasks", strings.Repeat(" ", 1<<20) + `{}`, 413},
		{"POST", "/tasks", "", 415},
		{"GET", "/tasks?limit=101", "", 400},
		{"GET", "/tasks?offset=-1", "", 400},
		{"GET", "/tasks?limit=1&limit=2", "", 400},
		{"GET", "/tasks?limit=", "", 400},
		{"GET", "/tasks/abc", "", 400},
		{"GET", "/tasks/0", "", 400},
		{"PATCH", "/tasks/1", `{}`, 400},
		{"PATCH", "/tasks/1", `{"done":null}`, 400},
		{"PUT", "/tasks/1", `{"done":true}`, 405},
	}
	for i, tc := range cases {
		t.Run(fmt.Sprint(i), func(t *testing.T) {
			rec := call(h, tc.method, tc.path, tc.body, token)
			requireStatus(t, rec, tc.status)
			if !strings.HasPrefix(rec.Header().Get("Content-Type"), "application/json") {
				t.Fatal("non JSON error")
			}
		})
	}
	items, err := store.ListTasks(context.Background(), 1, 100, 0)
	if err != nil || len(items) != 0 {
		t.Fatal("failed request modified state")
	}
}
func testRegistrationLoginLogout(t *testing.T, store Store) {
	h, logs := newTestAPI(t, store)
	password := "Strong-learning-password-1"
	input := fmt.Sprintf(`{"email":"Learner@example.test","password":%q}`, password)
	registered := call(h, "POST", "/auth/register", input, "")
	requireStatus(t, registered, 201)
	if strings.Contains(registered.Body.String(), "password") {
		t.Fatal("password hash exposed")
	}
	requireStatus(t, call(h, "POST", "/auth/register", input, ""), 409)
	logged := call(h, "POST", "/auth/login", input, "")
	requireStatus(t, logged, 200)
	var session struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal(logged.Body.Bytes(), &session); err != nil {
		t.Fatal(err)
	}
	if len(session.Token) != 43 {
		t.Fatal("invalid token entropy")
	}
	requireStatus(t, call(h, "GET", "/tasks", "", session.Token), 200)
	requireStatus(t, call(h, "POST", "/auth/logout", "", session.Token), 204)
	requireStatus(t, call(h, "GET", "/tasks", "", session.Token), 401)
	wrong := call(h, "POST", "/auth/login", `{"email":"learner@example.test","password":"Different-password-123"}`, "")
	missing := call(h, "POST", "/auth/login", `{"email":"unknown@example.test","password":"Different-password-123"}`, "")
	requireStatus(t, wrong, 401)
	requireStatus(t, missing, 401)
	if wrong.Body.String() != missing.Body.String() {
		t.Fatal("login leaks account existence")
	}
	if strings.Contains(logs.String(), password) || strings.Contains(logs.String(), session.Token) {
		t.Fatal("credentials leaked to logs")
	}
	u, err := store.FindUser(context.Background(), "learner@example.test")
	if err != nil || u.PasswordHash == password {
		t.Fatal("password not hashed")
	}
}
func TestRegistrationLoginLogout(t *testing.T) { testRegistrationLoginLogout(t, NewMemoryStore()) }
func TestSessionExpiry(t *testing.T) {
	s := NewMemoryStore()
	h, _ := newTestAPI(t, s)
	id, token := seedIdentity(t, s, "expired@example.test")
	if err := s.CreateSession(context.Background(), tokenDigest(token), id, time.Now().Add(-time.Second)); err != nil {
		t.Fatal(err)
	}
	requireStatus(t, call(h, "GET", "/tasks", "", token), 401)
}
func TestOriginAndAuthLimits(t *testing.T) {
	h, _ := newTestAPI(t, NewMemoryStore())
	req := httptest.NewRequest("POST", "/tasks", nil)
	req.Header.Set("Origin", "https://evil.example.test")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	requireStatus(t, rec, 403)
	limiter := newLimiter(2)
	now := time.Now()
	if !limiter.allow("127.0.0.1:1", now) || !limiter.allow("127.0.0.1:2", now) || limiter.allow("127.0.0.1:3", now) {
		t.Fatal("IP rate budget broken")
	}
	if !limiter.allow("127.0.0.1:1", now.Add(time.Minute)) {
		t.Fatal("window not reset")
	}
	h, err := New(NewMemoryStore(), nil, Options{AuthBudget: 1})
	if err != nil {
		t.Fatal(err)
	}
	requireStatus(t, call(h, "POST", "/auth/login", `{}`, ""), 401)
	limited := call(h, "POST", "/auth/login", `{}`, "")
	requireStatus(t, limited, 429)
	if limited.Header().Get("Retry-After") == "" {
		t.Fatal("missing retry hint")
	}
}

type unavailableStore struct{ Store }

func (unavailableStore) Ping(context.Context) error { return errors.New("database unavailable") }
func TestReadiness(t *testing.T) {
	h, _ := newTestAPI(t, unavailableStore{NewMemoryStore()})
	requireStatus(t, call(h, "GET", "/healthz", "", ""), 200)
	requireStatus(t, call(h, "GET", "/readyz", "", ""), 503)
}

type panickingStore struct{ Store }

func (panickingStore) CreateTask(context.Context, int64, string) (Task, error) {
	panic("private panic detail")
}
func TestPanicBoundary(t *testing.T) {
	s := panickingStore{NewMemoryStore()}
	h, logs := newTestAPI(t, s)
	_, token := seedIdentity(t, s, "panic@example.test")
	rec := call(h, "POST", "/tasks", `{"title":"trigger"}`, token)
	requireStatus(t, rec, 500)
	if strings.Contains(rec.Body.String()+logs.String(), "private panic detail") {
		t.Fatal("panic detail leaked")
	}
}
func TestMemoryConcurrentWrites(t *testing.T) {
	s := NewMemoryStore()
	var wg sync.WaitGroup
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if _, err := s.CreateTask(context.Background(), 1, "task"); err != nil {
				t.Error(err)
			}
		}()
	}
	wg.Wait()
	items, err := s.ListTasks(context.Background(), 1, 100, 0)
	if err != nil || len(items) != 50 {
		t.Fatal("lost concurrent writes")
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := s.CreateTask(ctx, 1, "no"); !errors.Is(err, context.Canceled) {
		t.Fatal("ignored cancellation")
	}
}
func TestPasswordStorage(t *testing.T) {
	password := "a-long-learning-password"
	a, err := HashPassword(password)
	if err != nil {
		t.Fatal(err)
	}
	b, err := HashPassword(password)
	if err != nil {
		t.Fatal(err)
	}
	if a == b || !VerifyPassword(a, password) || VerifyPassword(a, "wrong-learning-password") || VerifyPassword("malformed", password) {
		t.Fatal("password contract broken")
	}
	for _, bad := range []string{"short", strings.Repeat("a", 129)} {
		if _, err := HashPassword(bad); err == nil {
			t.Fatal("invalid password accepted")
		}
	}
}
