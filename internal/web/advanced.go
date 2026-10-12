package web

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
)

type lessonInputError struct{ Value int }

func (e *lessonInputError) Error() string { return fmt.Sprintf("参数 %d 不合法", e.Value) }

type lessonProfile struct {
	Name  string `json:"name"`
	Level int    `json:"level"`
}

type lessonNumber interface{ ~int | ~float64 }

func lessonSum[T lessonNumber](values []T) T {
	var total T
	for _, value := range values {
		total += value
	}
	return total
}

// advancedOutput 执行与进阶课程完整代码相同的算法。
// 并发示例使用确定性的取消与汇总，避免依赖调度顺序或真实网络。
func advancedOutput(id string, n int) (string, bool) {
	var out bytes.Buffer
	switch id {
	case "closures":
		counter := func(start int) func(...int) int {
			total := start
			return func(values ...int) int {
				for _, value := range values {
					total += value
				}
				return total
			}
		}
		add := counter(n)
		fmt.Fprintln(&out, add(1, 2))
		fmt.Fprintln(&out, add([]int{3, 4}...))
	case "defer":
		func() {
			defer fmt.Fprintln(&out, "最后执行")
			defer fmt.Fprintln(&out, "捕获参数:", n)
			defer func() {
				if value := recover(); value != nil {
					fmt.Fprintln(&out, "恢复:", value)
				}
			}()
			n++
			panic("演示异常")
		}()
		fmt.Fprintln(&out, "继续运行")
	case "slice-memory":
		base := []int{1, 2, 3}
		shared := base[:2]
		shared[0] = n
		fmt.Fprintln(&out, "共享:", base)
		isolated := append(base[:2:2], 99)
		isolated[0] = 8
		fmt.Fprintln(&out, "原切片:", base)
		fmt.Fprintln(&out, "新切片:", isolated)
		copied := make([]int, len(base))
		copy(copied, base)
		copied[0] = 0
		fmt.Fprintln(&out, "复制:", copied)
	case "error-chain":
		err := fmt.Errorf("保存失败: %w", &lessonInputError{Value: n})
		var input *lessonInputError
		if errors.As(err, &input) {
			fmt.Fprintln(&out, "错误参数:", input.Value)
		}
		fmt.Fprintln(&out, err)
	case "json":
		data, err := json.Marshal(lessonProfile{Name: "Gopher", Level: n})
		if err != nil {
			fmt.Fprintln(&out, err)
			break
		}
		fmt.Fprintln(&out, string(data))
		var decoded lessonProfile
		if err := json.Unmarshal(data, &decoded); err != nil {
			fmt.Fprintln(&out, err)
			break
		}
		fmt.Fprintln(&out, decoded.Name, decoded.Level)
	case "generics":
		type points int
		fmt.Fprintln(&out, "整数:", lessonSum([]int{n, 2, 3}))
		fmt.Fprintln(&out, "小数:", lessonSum([]float64{1.5, 2.5}))
		fmt.Fprintln(&out, "自定义类型:", lessonSum([]points{points(n), 2}))
	case "select":
		jobs := make(chan int, 1)
		jobs <- n
		select {
		case value := <-jobs:
			fmt.Fprintln(&out, "收到:", value)
		default:
			fmt.Fprintln(&out, "暂无任务")
		}
		select {
		case value := <-jobs:
			fmt.Fprintln(&out, "收到:", value)
		default:
			fmt.Fprintln(&out, "暂无任务")
		}
		close(jobs)
		value, ok := <-jobs
		fmt.Fprintln(&out, "关闭后:", value, ok)
	case "context":
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()
		results := make(chan int)
		go func() {
			defer close(results)
			<-ctx.Done()
		}()
		fmt.Fprintln(&out, "计划任务:", n)
		cancel()
		for value := range results {
			fmt.Fprintln(&out, value)
		}
		fmt.Fprintln(&out, "取消原因:", ctx.Err())
	case "mutex":
		var mu sync.Mutex
		var wg sync.WaitGroup
		count := 0
		for i := 0; i < n; i++ {
			wg.Add(1)
			go func() {
				defer wg.Done()
				mu.Lock()
				defer mu.Unlock()
				count++
			}()
		}
		wg.Wait()
		fmt.Fprintln(&out, "安全计数:", count)
	case "testing":
		cases := []struct {
			name       string
			a, b, want int
		}{
			{"普通值", n, 2, n + 2},
			{"零值", 0, 0, 0},
			{"负数", -1, 1, 0},
		}
		add := func(a, b int) int { return a + b }
		for _, tc := range cases {
			got := add(tc.a, tc.b)
			fmt.Fprintln(&out, tc.name, got == tc.want)
		}
	default:
		return "", false
	}
	return out.String(), true
}
