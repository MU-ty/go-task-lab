package web

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"sync"
	"testing"

	"github.com/MU-ty/go-task-lab/internal/storage"
	"github.com/MU-ty/go-task-lab/internal/task"
)

func testHandler(t *testing.T) http.Handler {
	t.Helper()
	return New(task.New(&storage.JSONFile{Path: filepath.Join(t.TempDir(), "tasks.json")}))
}

func request(h http.Handler, method, path, body string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, path, strings.NewReader(body))
	if body != "" {
		r.Header.Set("Content-Type", "application/json")
	}
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	return w
}

func TestHTTPTaskLifecycle(t *testing.T) {
	h := testHandler(t)
	created := request(h, "POST", "/api/tasks", `{"title":"学习 HTTP"}`)
	if created.Code != 201 {
		t.Fatalf("新增: %d %s", created.Code, created.Body.String())
	}
	var item task.Task
	if err := json.Unmarshal(created.Body.Bytes(), &item); err != nil {
		t.Fatal(err)
	}
	for _, done := range []bool{true, false} {
		w := request(h, "PATCH", fmt.Sprintf("/api/tasks/%d", item.ID), fmt.Sprintf(`{"done":%t}`, done))
		if w.Code != 204 {
			t.Fatalf("修改: %d %s", w.Code, w.Body.String())
		}
		list := request(h, "GET", "/api/tasks", "")
		var items []task.Task
		if err := json.Unmarshal(list.Body.Bytes(), &items); err != nil {
			t.Fatal(err)
		}
		if len(items) != 1 || items[0].Done != done || items[0].Title != "学习 HTTP" {
			t.Fatalf("列表: %+v", items)
		}
	}
	if w := request(h, "DELETE", fmt.Sprintf("/api/tasks/%d", item.ID), ""); w.Code != 204 {
		t.Fatalf("删除: %d", w.Code)
	}
	if w := request(h, "GET", "/api/tasks", ""); strings.TrimSpace(w.Body.String()) != "[]" {
		t.Fatalf("空列表: %s", w.Body.String())
	}
}

func TestHTTPValidation(t *testing.T) {
	h := testHandler(t)
	cases := []struct {
		method, path, body string
		status             int
	}{
		{"POST", "/api/tasks", `{"title":"  "}`, 400},
		{"POST", "/api/tasks", `{"title":"` + strings.Repeat("学", 121) + `"}`, 400},
		{"POST", "/api/tasks", `{"title":"a","extra":1}`, 400},
		{"POST", "/api/tasks", `{"title":"a"} {"title":"b"}`, 400},
		{"POST", "/api/tasks", `{broken`, 400},
		{"POST", "/api/tasks", `{"title":"` + strings.Repeat("x", 5000) + `"}`, 400},
		{"POST", "/api/tasks", "", 415},
		{"PATCH", "/api/tasks/1", `{}`, 400},
		{"PATCH", "/api/tasks/1", `{"done":null}`, 400},
		{"PATCH", "/api/tasks/1", `{"done":"true"}`, 400},
		{"PATCH", "/api/tasks/999", `{"done":true}`, 404},
		{"DELETE", "/api/tasks/nope", "", 400},
		{"DELETE", "/api/tasks/0", "", 400},
		{"DELETE", "/api/tasks/999", "", 404},
		{"GET", "/api/missing", "", 404},
	}
	for _, tc := range cases {
		w := request(h, tc.method, tc.path, tc.body)
		if w.Code != tc.status {
			t.Errorf("%s %s: want %d got %d: %s", tc.method, tc.path, tc.status, w.Code, w.Body.String())
		}
	}
}

func TestCrossSiteRejected(t *testing.T) {
	h := testHandler(t)
	for _, header := range []string{"Origin", "Sec-Fetch-Site"} {
		r := httptest.NewRequest("POST", "http://example.com/api/tasks", strings.NewReader(`{"title":"test"}`))
		r.Header.Set("Content-Type", "application/json")
		if header == "Origin" {
			r.Header.Set(header, "https://other.example")
		} else {
			r.Header.Set(header, "cross-site")
		}
		w := httptest.NewRecorder()
		h.ServeHTTP(w, r)
		if w.Code != 403 {
			t.Fatalf("跨站请求未拒绝: %s %d", header, w.Code)
		}
	}
}

func TestConcurrentAdds(t *testing.T) {
	h := testHandler(t)
	var wg sync.WaitGroup
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			w := request(h, "POST", "/api/tasks", fmt.Sprintf(`{"title":"任务 %d"}`, i))
			if w.Code != 201 {
				t.Errorf("并发新增: %d %s", w.Code, w.Body.String())
			}
		}(i)
	}
	wg.Wait()
	w := request(h, "GET", "/api/tasks", "")
	var items []task.Task
	if err := json.Unmarshal(w.Body.Bytes(), &items); err != nil {
		t.Fatal(err)
	}
	if len(items) != 20 {
		t.Fatalf("丢失任务: %d", len(items))
	}
	seen := make(map[int]bool)
	for _, item := range items {
		if seen[item.ID] {
			t.Fatalf("重复 ID: %d", item.ID)
		}
		seen[item.ID] = true
	}
}

func TestEmbeddedPage(t *testing.T) {
	h := testHandler(t)
	for _, path := range []string{"/", "/app.js", "/style.css"} {
		w := request(h, "GET", path, "")
		if w.Code != 200 || w.Body.Len() == 0 {
			t.Fatalf("静态资源 %s: %d", path, w.Code)
		}
		if w.Header().Get("Content-Security-Policy") == "" {
			t.Fatal("缺少 CSP")
		}
	}
}
