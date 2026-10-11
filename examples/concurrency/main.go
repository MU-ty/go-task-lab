// 独立示例：go run ./examples/concurrency
package main

import (
	"fmt"
	"sync"
)

func main() {
	jobs := make(chan int)
	results := make(chan int)
	var wg sync.WaitGroup
	for worker := 0; worker < 2; worker++ {
		wg.Add(1)
		go func() {
			defer wg.Done() // 函数返回前执行，保证计数归零。
			for n := range jobs {
				results <- n * n
			}
		}()
	}
	go func() {
		defer close(jobs) // 发送者关闭 channel，通知消费者退出 range。
		for n := 1; n <= 5; n++ {
			jobs <- n
		}
	}()
	go func() { wg.Wait(); close(results) }()
	total := 0
	for result := range results {
		total += result
	}
	fmt.Println("平方和:", total) // 固定为 55；单个结果到达顺序不保证。
}
