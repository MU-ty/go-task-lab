// 启动：go run ./cmd/sitegen -out _site。需从仓库根目录执行。
package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func main() {
	out := flag.String("out", "_site", "Pages 构建输出目录")
	flag.Parse()
	if err := build(*out); err != nil {
		log.Fatal(err)
	}
	fmt.Println("Pages 网站构建完成:", *out)
}

func build(out string) error {
	if err := os.MkdirAll(out, 0755); err != nil {
		return err
	}
	for _, name := range []string{"index.html", "app.js", "courses.js", "style.css"} {
		data, err := os.ReadFile(filepath.Join("internal", "web", "static", name))
		if err != nil {
			return err
		}
		if name == "index.html" {
			html := string(data)
			for _, asset := range []string{"style.css", "courses.js", "app.js"} {
				html = strings.ReplaceAll(html, `"/`+asset+`"`, `"./`+asset+`"`)
			}
			html = strings.Replace(html, `<script src="./courses.js"`, `<script src="./wasm_exec.js" defer></script><script src="./pages-runtime.js" defer></script><script src="./courses.js"`, 1)
			html = strings.ReplaceAll(html, "Go 后端运行示例", "浏览器运行 Go 示例")
			html = strings.ReplaceAll(html, "固定教学示例，由 Go 后端执行。", "固定教学示例，由浏览器中的 Go 执行。")
			data = []byte(html)
		}
		if err := os.WriteFile(filepath.Join(out, name), data, 0644); err != nil {
			return err
		}
	}
	data, err := os.ReadFile(filepath.Join("scripts", "pages-runtime.js"))
	if err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(out, "pages-runtime.js"), data, 0644); err != nil {
		return err
	}
	root, err := exec.Command("go", "env", "GOROOT").Output()
	if err != nil {
		return fmt.Errorf("查询 Go 工具链: %w", err)
	}
	goRoot := strings.TrimSpace(string(root))
	// Go 1.24+ 位于 lib/wasm，较早版本位于 misc/wasm。
	runtime, err := os.ReadFile(filepath.Join(goRoot, "lib", "wasm", "wasm_exec.js"))
	if os.IsNotExist(err) {
		runtime, err = os.ReadFile(filepath.Join(goRoot, "misc", "wasm", "wasm_exec.js"))
	}
	if err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(out, "wasm_exec.js"), runtime, 0644); err != nil {
		return err
	}
	cmd := exec.Command("go", "build", "-trimpath", "-ldflags=-s -w", "-o", filepath.Join(out, "examples.wasm"), "./cmd/playground")
	for _, entry := range os.Environ() {
		key := strings.ToUpper(strings.SplitN(entry, "=", 2)[0])
		if key != "GOOS" && key != "GOARCH" {
			cmd.Env = append(cmd.Env, entry)
		}
	}
	cmd.Env = append(cmd.Env, "GOOS=js", "GOARCH=wasm")
	cmd.Stdout, cmd.Stderr = os.Stdout, os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("编译 WebAssembly: %w", err)
	}
	return os.WriteFile(filepath.Join(out, ".nojekyll"), nil, 0644)
}
