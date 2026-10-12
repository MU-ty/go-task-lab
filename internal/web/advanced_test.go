package web

import (
	"fmt"
	"strings"
	"sync"
	"testing"
)

func TestAdvancedParameterBoundaries(t *testing.T) {
	for _, n := range []int{1, 3, 6, 9} {
		cases := map[string]string{
			"closures":     fmt.Sprintf("%d\n%d\n", n+3, n+10),
			"defer":        fmt.Sprintf("恢复: 演示异常\n捕获参数: %d\n最后执行\n继续运行\n", n),
			"slice-memory": fmt.Sprintf("共享: [%d 2 3]\n原切片: [%d 2 3]\n新切片: [8 2 99]\n复制: [0 2 3]\n", n, n),
			"error-chain":  fmt.Sprintf("错误参数: %d\n保存失败: 参数 %d 不合法\n", n, n),
			"json":         fmt.Sprintf("{\"name\":\"Gopher\",\"level\":%d}\nGopher %d\n", n, n),
			"generics":     fmt.Sprintf("整数: %d\n小数: 4\n自定义类型: %d\n", n+5, n+2),
			"select":       fmt.Sprintf("收到: %d\n暂无任务\n关闭后: 0 false\n", n),
			"context":      fmt.Sprintf("计划任务: %d\n取消原因: context canceled\n", n),
			"mutex":        fmt.Sprintf("安全计数: %d\n", n),
		}
		for id, want := range cases {
			t.Run(fmt.Sprintf("%s/n=%d", id, n), func(t *testing.T) {
				got, ok := ExampleOutput(id, n)
				if !ok || got != want {
					t.Fatalf("got=%q want=%q", got, want)
				}
			})
		}
	}
}

func TestConcurrentAdvancedRuns(t *testing.T) {
	var wg sync.WaitGroup
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for _, id := range []string{"mutex", "context", "defer"} {
				got, ok := ExampleOutput(id, 9)
				if !ok || strings.TrimSpace(got) == "" {
					t.Errorf("invalid output for %s: %q", id, got)
				}
			}
		}()
	}
	wg.Wait()
}
