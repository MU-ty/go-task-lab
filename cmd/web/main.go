// 启动：go run ./cmd/web，然后打开 http://127.0.0.1:8080。
package main

import (
	"flag"
	"log"
	"net/http"
	"time"

	"github.com/MU-ty/go-task-lab/internal/storage"
	"github.com/MU-ty/go-task-lab/internal/task"
	"github.com/MU-ty/go-task-lab/internal/web"
)

func main() {
	addr := flag.String("addr", "127.0.0.1:8080", "监听地址")
	file := flag.String("file", "tasks.json", "JSON 数据文件")
	flag.Parse()
	s := task.New(&storage.JSONFile{Path: *file})
	server := &http.Server{
		Addr:              *addr,
		Handler:           web.New(s),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	log.Printf("Go Task Lab 已启动：http://%s", *addr)
	log.Fatal(server.ListenAndServe())
}
