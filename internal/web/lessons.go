package web

import (
	"bytes"
	"fmt"
	"net/http"
	"strconv"
	"sync"
)

// 示例在 Go 服务内部执行固定的教学函数；不执行浏览器提交的任意代码。
// n 是唯一可调整的参数，范围 1–9；页面显示的示例与这里的算法对应。
func runLesson(w http.ResponseWriter, r *http.Request) {
	n := 3
	if raw := r.URL.Query().Get("n"); raw != "" {
		value, err := strconv.Atoi(raw)
		if err != nil || value < 1 || value > 9 {
			writeJSON(w, 400, map[string]string{"error": "示例参数必须是 1–9 的整数"})
			return
		}
		n = value
	}
	output, ok := ExampleOutput(r.PathValue("id"), n)
	if !ok {
		writeJSON(w, 404, map[string]string{"error": "课程不存在"})
		return
	}
	writeJSON(w, 200, map[string]string{"output": output})
}

type learningUser struct {
	Name string
	Age  int
}

func (u learningUser) Greeting() string { return "你好，" + u.Name }

type speaker interface{ Greeting() string }

// ExampleOutput 在 HTTP 服务与 WebAssembly 中共用同一份 Go 教学逻辑。
func ExampleOutput(id string, n int) (string, bool) {
	var out bytes.Buffer
	switch id {
	case "hello":
		fmt.Fprintln(&out, "Hello, Go!")
	case "variables":
		count := n
		var language string = "Go"
		const target = 10
		fmt.Fprintln(&out, language, count, target-count)
	case "conditions":
		score := n * 10
		if score >= 60 {
			fmt.Fprintln(&out, "通过", score)
		} else {
			fmt.Fprintln(&out, "继续练习", score)
		}
	case "loops":
		sum := 0
		for i := 1; i <= n; i++ {
			sum += i
		}
		fmt.Fprintln(&out, "总和:", sum)
	case "functions":
		add := func(a, b int) (int, error) {
			if a < 0 || b < 0 {
				return 0, fmt.Errorf("不能为负数")
			}
			return a + b, nil
		}
		result, err := add(n, 2)
		if err != nil {
			fmt.Fprintln(&out, err)
		} else {
			fmt.Fprintln(&out, result)
		}
	case "slices":
		nums := []int{1, 2}
		nums = append(nums, n)
		for i, value := range nums {
			fmt.Fprintln(&out, i, value)
		}
	case "maps":
		scores := map[string]int{"Go": n, "SQL": 2}
		value, ok := scores["Go"]
		fmt.Fprintln(&out, value, ok)
		delete(scores, "SQL")
		fmt.Fprintln(&out, len(scores))
	case "structs":
		u := learningUser{Name: "小 Go", Age: n}
		p := &u
		p.Age++
		fmt.Fprintln(&out, u.Name, u.Age)
	case "interfaces":
		var s speaker = learningUser{Name: "小 Go"}
		fmt.Fprintln(&out, s.Greeting())
	case "concurrency":
		results := make(chan int)
		var wg sync.WaitGroup
		for i := 1; i <= n; i++ {
			wg.Add(1)
			go func(value int) { defer wg.Done(); results <- value * value }(i)
		}
		go func() { wg.Wait(); close(results) }()
		sum := 0
		for value := range results {
			sum += value
		}
		fmt.Fprintln(&out, "平方和:", sum)
	default:
		return "", false
	}
	return out.String(), true
}
