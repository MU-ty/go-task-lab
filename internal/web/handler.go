// Package web 把 HTTP 请求转换为业务操作，静态资源通过 embed 打包。
package web

import (
	"embed"
	"encoding/json"
	"errors"
	"io"
	"io/fs"
	"log"
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/MU-ty/go-task-lab/internal/task"
)

//go:embed static/*
var assets embed.FS

type handler struct{ service *task.Service }

func New(service *task.Service) http.Handler {
	h := &handler{service: service}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/lessons/{id}/run", runLesson)
	// Go 1.22 的路由语法同时指定 HTTP 方法和路径参数。
	mux.HandleFunc("GET /api/tasks", h.list)
	mux.HandleFunc("POST /api/tasks", h.add)
	mux.HandleFunc("PATCH /api/tasks/{id}", h.update)
	mux.HandleFunc("DELETE /api/tasks/{id}", h.delete)
	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "API 路径不存在"})
	})
	static, err := fs.Sub(assets, "static")
	if err != nil {
		panic(err)
	}
	mux.Handle("/", http.FileServer(http.FS(static)))
	// Go 1.22+ 标准库同源校验：通过浏览器 Fetch Metadata 防止跨站修改。
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			if r.Header.Get("Sec-Fetch-Site") == "cross-site" {
				writeJSON(w, http.StatusForbidden, map[string]string{"error": "不允许跨站修改"})
				return
			}
			if origin := r.Header.Get("Origin"); origin != "" {
				scheme := "http"
				if r.TLS != nil {
					scheme = "https"
				}
				if origin != scheme+"://"+r.Host {
					writeJSON(w, http.StatusForbidden, map[string]string{"error": "请求来源不匹配"})
					return
				}
			}
		}
		mux.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("写入响应: %v", err)
	}
}

func decode(w http.ResponseWriter, r *http.Request, value any) bool {
	if strings.Split(r.Header.Get("Content-Type"), ";")[0] != "application/json" {
		writeJSON(w, http.StatusUnsupportedMediaType, map[string]string{"error": "请使用 application/json"})
		return false
	}
	// 限制请求大小，拒绝未知字段及多段 JSON。
	r.Body = http.MaxBytesReader(w, r.Body, 4096)
	defer r.Body.Close()
	d := json.NewDecoder(r.Body)
	d.DisallowUnknownFields()
	if err := d.Decode(value); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON 内容无效或过大"})
		return false
	}
	if err := d.Decode(&struct{}{}); err != io.EOF {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "仅允许一个 JSON 对象"})
		return false
	}
	return true
}

func (h *handler) failure(w http.ResponseWriter, err error) {
	if errors.Is(err, task.ErrNotFound) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "任务不存在，请刷新列表"})
		return
	}
	log.Printf("存储操作失败: %v", err)
	writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "数据保存或读取失败，请检查服务器日志"})
}

func (h *handler) list(w http.ResponseWriter, r *http.Request) {
	tasks, err := h.service.List("all")
	if err != nil {
		h.failure(w, err)
		return
	}
	writeJSON(w, http.StatusOK, tasks)
}

func (h *handler) add(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Title string `json:"title"`
	}
	if !decode(w, r, &body) {
		return
	}
	body.Title = strings.TrimSpace(body.Title)
	if body.Title == "" || utf8.RuneCountInString(body.Title) > 120 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "标题需要包含 1–120 个字符"})
		return
	}
	t, err := h.service.Add(body.Title)
	if err != nil {
		h.failure(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, t)
}

func taskID(w http.ResponseWriter, r *http.Request) (int, bool) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "任务 ID 必须是正整数"})
		return 0, false
	}
	return id, true
}

func (h *handler) update(w http.ResponseWriter, r *http.Request) {
	id, ok := taskID(w, r)
	if !ok {
		return
	}
	// *bool 区分“字段缺失”和“传入 false”。
	var body struct {
		Done *bool `json:"done"`
	}
	if !decode(w, r, &body) {
		return
	}
	if body.Done == nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "缺少 done 布尔字段"})
		return
	}
	if err := h.service.SetDone(id, *body.Done); err != nil {
		h.failure(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *handler) delete(w http.ResponseWriter, r *http.Request) {
	id, ok := taskID(w, r)
	if !ok {
		return
	}
	if err := h.service.Delete(id); err != nil {
		h.failure(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
