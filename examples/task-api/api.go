package taskapi

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"mime"
	"net/http"
	"net/mail"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

type identityKey struct{}
type identity struct {
	user   int64
	digest string
}
type Options struct {
	AllowedOrigin string
	SessionTTL    time.Duration
	AuthBudget    int
}
type API struct {
	store     Store
	logger    *slog.Logger
	options   Options
	limiter   *authLimiter
	authSlots chan struct{}
	dummyHash string
}

func New(store Store, logger *slog.Logger, options Options) (http.Handler, error) {
	if store == nil {
		return nil, errors.New("store is required")
	}
	if logger == nil {
		logger = slog.New(slog.NewJSONHandler(io.Discard, nil))
	}
	if options.SessionTTL <= 0 {
		options.SessionTTL = 8 * time.Hour
	}
	if options.AuthBudget <= 0 {
		options.AuthBudget = 20
	}
	dummy, err := HashPassword("dummy-account-password")
	if err != nil {
		return nil, err
	}
	a := &API{store: store, logger: logger, options: options, limiter: newLimiter(options.AuthBudget), authSlots: make(chan struct{}, 2), dummyHash: dummy}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) { reply(w, 200, map[string]string{"status": "ok"}) })
	mux.HandleFunc("GET /readyz", a.ready)
	mux.Handle("POST /auth/register", a.authBudget(http.HandlerFunc(a.register)))
	mux.Handle("POST /auth/login", a.authBudget(http.HandlerFunc(a.login)))
	mux.Handle("POST /auth/logout", a.authenticate(http.HandlerFunc(a.logout)))
	mux.Handle("GET /tasks", a.authenticate(http.HandlerFunc(a.list)))
	mux.Handle("POST /tasks", a.authenticate(http.HandlerFunc(a.create)))
	mux.Handle("GET /tasks/{id}", a.authenticate(http.HandlerFunc(a.get)))
	mux.Handle("PATCH /tasks/{id}", a.authenticate(http.HandlerFunc(a.update)))
	mux.Handle("DELETE /tasks/{id}", a.authenticate(http.HandlerFunc(a.remove)))
	// 由应用给标准路由器的错误方法补充一致的 JSON 合同。
	for path, allow := range map[string]string{"/healthz": "GET, HEAD", "/readyz": "GET, HEAD", "/auth/register": "POST", "/auth/login": "POST", "/auth/logout": "POST", "/tasks": "GET, HEAD, POST", "/tasks/{id}": "GET, HEAD, PATCH, DELETE"} {
		mux.HandleFunc(path, func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Allow", allow)
			fail(w, 405, "method not allowed")
		})
	}
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) { fail(w, 404, "route not found") })
	return a.boundary(mux), nil
}

func reply(w http.ResponseWriter, status int, value any) {
	var data bytes.Buffer
	if err := json.NewEncoder(&data).Encode(value); err != nil {
		http.Error(w, "response encoding failed", 500)
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_, _ = w.Write(data.Bytes())
}
func fail(w http.ResponseWriter, status int, message string) {
	reply(w, status, map[string]string{"error": message})
}
func decodeJSON(w http.ResponseWriter, r *http.Request, value any) bool {
	typeName, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || typeName != "application/json" {
		fail(w, 415, "content type must be application/json")
		return false
	}
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	defer r.Body.Close()
	d := json.NewDecoder(r.Body)
	d.DisallowUnknownFields()
	if err = d.Decode(value); err != nil {
		var large *http.MaxBytesError
		if errors.As(err, &large) {
			fail(w, 413, "body too large")
		} else {
			fail(w, 400, "invalid JSON")
		}
		return false
	}
	var extra any
	if err = d.Decode(&extra); err != io.EOF {
		var large *http.MaxBytesError
		if errors.As(err, &large) {
			fail(w, 413, "body too large")
		} else {
			fail(w, 400, "exactly one JSON value is required")
		}
		return false
	}
	return true
}
func (a *API) storeFailure(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, ErrNotFound):
		fail(w, 404, "resource not found")
	case errors.Is(err, ErrConflict):
		fail(w, 409, "resource conflicts")
	case errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded):
		fail(w, 503, "operation unavailable")
	default:
		a.logger.Error("store operation failed", "request_id", w.Header().Get("X-Request-ID"), "error", err)
		fail(w, 500, "internal error")
	}
}

type responseLog struct {
	http.ResponseWriter
	status int
}

func (w *responseLog) WriteHeader(status int) {
	if w.status != 0 {
		return
	}
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}
func (w *responseLog) Write(p []byte) (int, error) {
	if w.status == 0 {
		w.WriteHeader(200)
	}
	return w.ResponseWriter.Write(p)
}
func (w *responseLog) Unwrap() http.ResponseWriter { return w.ResponseWriter }
func (a *API) boundary(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseLog{ResponseWriter: w}
		id, err := randomToken()
		if err != nil {
			fail(rw, 503, "request unavailable")
			return
		}
		rw.Header().Set("X-Request-ID", id)
		rw.Header().Set("X-Content-Type-Options", "nosniff")
		defer func() {
			if value := recover(); value != nil {
				a.logger.Error("handler panic", "request_id", id)
				if rw.status == 0 {
					fail(rw, 500, "internal error")
				}
			}
			status := rw.status
			if status == 0 {
				status = 200
			}
			a.logger.Info("request", "request_id", id, "method", r.Method, "path", r.URL.Path, "status", status, "duration_ms", time.Since(start).Milliseconds())
		}()
		if r.Method != "GET" && r.Method != "HEAD" {
			if r.Header.Get("Sec-Fetch-Site") == "cross-site" {
				fail(rw, 403, "origin denied")
				return
			}
			if origin := r.Header.Get("Origin"); origin != "" && origin != a.options.AllowedOrigin {
				fail(rw, 403, "origin denied")
				return
			}
		}
		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()
		next.ServeHTTP(rw, r.WithContext(ctx))
	})
}
func (a *API) authBudget(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !a.limiter.allow(r.RemoteAddr, time.Now()) {
			w.Header().Set("Retry-After", "60")
			fail(w, 429, "too many authentication attempts")
			return
		}
		select {
		case a.authSlots <- struct{}{}:
			defer func() { <-a.authSlots }()
			next.ServeHTTP(w, r)
		default:
			w.Header().Set("Retry-After", "1")
			fail(w, 429, "authentication capacity reached")
		}
	})
}
func (a *API) authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		parts := strings.Fields(r.Header.Get("Authorization"))
		if len(parts) != 2 || parts[0] != "Bearer" || len(parts[1]) != 43 {
			w.Header().Set("WWW-Authenticate", "Bearer")
			fail(w, 401, "authentication required")
			return
		}
		digest := tokenDigest(parts[1])
		user, err := a.store.SessionUser(r.Context(), digest, time.Now())
		if errors.Is(err, ErrNotFound) {
			w.Header().Set("WWW-Authenticate", "Bearer")
			fail(w, 401, "authentication required")
			return
		}
		if err != nil {
			a.storeFailure(w, r, err)
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), identityKey{}, identity{user, digest})))
	})
}

type credentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func validEmail(email string) bool {
	parsed, err := mail.ParseAddress(email)
	return err == nil && parsed.Address == email && len(email) <= 254
}
func (a *API) register(w http.ResponseWriter, r *http.Request) {
	var c credentials
	if !decodeJSON(w, r, &c) {
		return
	}
	c.Email = strings.ToLower(strings.TrimSpace(c.Email))
	if !validEmail(c.Email) || !validPassword(c.Password) {
		fail(w, 400, "valid email and password of 12+ characters, at most 128 bytes required")
		return
	}
	hash, err := HashPassword(c.Password)
	if err != nil {
		a.storeFailure(w, r, err)
		return
	}
	u, err := a.store.CreateUser(r.Context(), c.Email, hash)
	if err != nil {
		a.storeFailure(w, r, err)
		return
	}
	reply(w, 201, u)
}
func (a *API) login(w http.ResponseWriter, r *http.Request) {
	var c credentials
	if !decodeJSON(w, r, &c) {
		return
	}
	c.Email = strings.ToLower(strings.TrimSpace(c.Email))
	if !validEmail(c.Email) || !validPassword(c.Password) {
		fail(w, 401, "invalid credentials")
		return
	}
	u, err := a.store.FindUser(r.Context(), c.Email)
	if err != nil && !errors.Is(err, ErrNotFound) {
		a.storeFailure(w, r, err)
		return
	}
	hash := u.PasswordHash
	if errors.Is(err, ErrNotFound) {
		hash = a.dummyHash
	}
	valid := VerifyPassword(hash, c.Password)
	if err != nil || !valid {
		fail(w, 401, "invalid credentials")
		return
	}
	token, err := randomToken()
	if err != nil {
		a.storeFailure(w, r, err)
		return
	}
	expires := time.Now().UTC().Add(a.options.SessionTTL)
	if err = a.store.CreateSession(r.Context(), tokenDigest(token), u.ID, expires); err != nil {
		a.storeFailure(w, r, err)
		return
	}
	reply(w, 200, map[string]any{"token": token, "expires_at": expires, "token_type": "Bearer"})
}
func (a *API) logout(w http.ResponseWriter, r *http.Request) {
	id := r.Context().Value(identityKey{}).(identity)
	if err := a.store.DeleteSession(r.Context(), id.digest); err != nil {
		a.storeFailure(w, r, err)
		return
	}
	w.WriteHeader(204)
}
func currentUser(r *http.Request) int64 { return r.Context().Value(identityKey{}).(identity).user }
func validTitle(title string) bool {
	return utf8.ValidString(title) && utf8.RuneCountInString(title) >= 1 && utf8.RuneCountInString(title) <= 120
}
func pathID(w http.ResponseWriter, r *http.Request) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id < 1 {
		fail(w, 400, "invalid task id")
		return 0, false
	}
	return id, true
}
func (a *API) create(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Title string `json:"title"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}
	input.Title = strings.TrimSpace(input.Title)
	if !validTitle(input.Title) {
		fail(w, 400, "title must contain 1 to 120 characters")
		return
	}
	task, err := a.store.CreateTask(r.Context(), currentUser(r), input.Title)
	if err != nil {
		a.storeFailure(w, r, err)
		return
	}
	w.Header().Set("Location", "/tasks/"+strconv.FormatInt(task.ID, 10))
	reply(w, 201, task)
}
func paginationValue(r *http.Request, key string, defaultValue, minValue, maxValue int) (int, error) {
	values, present := r.URL.Query()[key]
	if !present {
		return defaultValue, nil
	}
	if len(values) != 1 {
		return 0, errors.New("repeated parameter")
	}
	n, err := strconv.Atoi(values[0])
	if err != nil || n < minValue || n > maxValue {
		return 0, errors.New("invalid pagination")
	}
	return n, nil
}
func (a *API) list(w http.ResponseWriter, r *http.Request) {
	limit, err := paginationValue(r, "limit", 20, 1, 100)
	if err != nil {
		fail(w, 400, "limit must be 1 to 100")
		return
	}
	offset, err := paginationValue(r, "offset", 0, 0, 100000)
	if err != nil {
		fail(w, 400, "offset must be 0 to 100000")
		return
	}
	items, err := a.store.ListTasks(r.Context(), currentUser(r), limit, offset)
	if err != nil {
		a.storeFailure(w, r, err)
		return
	}
	reply(w, 200, map[string]any{"items": items, "limit": limit, "offset": offset})
}
func (a *API) get(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	task, err := a.store.GetTask(r.Context(), currentUser(r), id)
	if err != nil {
		a.storeFailure(w, r, err)
		return
	}
	reply(w, 200, task)
}
func (a *API) update(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var input struct {
		Title *string `json:"title"`
		Done  *bool   `json:"done"`
	}
	if !decodeJSON(w, r, &input) {
		return
	}
	if input.Title == nil && input.Done == nil {
		fail(w, 400, "at least one update field is required")
		return
	}
	if input.Title != nil {
		*input.Title = strings.TrimSpace(*input.Title)
		if !validTitle(*input.Title) {
			fail(w, 400, "invalid title")
			return
		}
	}
	task, err := a.store.UpdateTask(r.Context(), currentUser(r), id, input.Title, input.Done)
	if err != nil {
		a.storeFailure(w, r, err)
		return
	}
	reply(w, 200, task)
}
func (a *API) remove(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	if err := a.store.DeleteTask(r.Context(), currentUser(r), id); err != nil {
		a.storeFailure(w, r, err)
		return
	}
	w.WriteHeader(204)
}
func (a *API) ready(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), time.Second)
	defer cancel()
	if err := a.store.Ping(ctx); err != nil {
		fail(w, 503, "dependency unavailable")
		return
	}
	reply(w, 200, map[string]string{"status": "ready"})
}
