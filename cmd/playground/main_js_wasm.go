//go:build js && wasm

// 将真实 Go 教学函数编译为 WebAssembly，供 GitHub Pages 在浏览器运行。
package main

import (
	"syscall/js"

	"github.com/MU-ty/go-task-lab/internal/web"
)

func main() {
	done := make(chan struct{})
	run := js.FuncOf(func(this js.Value, args []js.Value) any {
		if len(args) != 2 || args[0].Type() != js.TypeString || args[1].Type() != js.TypeNumber {
			return map[string]any{"error": "示例参数无效"}
		}
		n := args[1].Float()
		if n < 1 || n > 9 || n != float64(int(n)) {
			return map[string]any{"error": "参数必须是 1–9 的整数"}
		}
		output, ok := web.ExampleOutput(args[0].String(), int(n))
		if !ok {
			return map[string]any{"error": "课程不存在"}
		}
		return map[string]any{"output": output}
	})
	js.Global().Set("GoLearningRun", run)
	stop := js.FuncOf(func(this js.Value, args []js.Value) any {
		select {
		case <-done:
		default:
			close(done)
		}
		return nil
	})
	js.Global().Set("GoLearningStop", stop)
	defer run.Release()
	defer stop.Release()
	// 保持 Go 运行时存活，直到用户关闭页面。
	<-done
}
