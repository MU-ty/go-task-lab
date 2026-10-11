// Package task 包含任务领域逻辑，不依赖命令行或具体文件格式。
package task

import (
	"errors"
	"fmt"
	"strings"
	"sync"
)

var ErrNotFound = errors.New("任务不存在")

// Task 是结构体；大写字段可被其他包访问，标签控制 JSON 字段名。
type Task struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	Done  bool   `json:"done"`
}

// Repository 是接口：实现这两个方法的类型会自动满足接口。
type Repository interface {
	Load() ([]Task, error)
	Save([]Task) error
}

// HTTP 请求会并发调用 Service；锁覆盖整个读取、修改、保存过程。
type Service struct {
	repo Repository
	mu   sync.Mutex
}

func New(repo Repository) *Service { return &Service{repo: repo} }

// Add 展示指针接收者、多返回值、:=、range、append 和错误传播。
func (s *Service) Add(title string) (Task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	title = strings.TrimSpace(title)
	if title == "" {
		return Task{}, errors.New("标题不能为空")
	}
	tasks, err := s.repo.Load()
	if err != nil {
		return Task{}, err
	}
	next := 1
	for _, t := range tasks {
		if t.ID >= next {
			next = t.ID + 1
		}
	}
	t := Task{ID: next, Title: title}
	if err := s.repo.Save(append(tasks, t)); err != nil {
		return Task{}, err
	}
	return t, nil
}

func (s *Service) List(status string) ([]Task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if status != "all" && status != "open" && status != "done" {
		return nil, errors.New("状态必须为 all、open 或 done")
	}
	tasks, err := s.repo.Load()
	if err != nil {
		return nil, err
	}
	result := make([]Task, 0)
	for _, t := range tasks {
		if status == "all" || (status == "done" && t.Done) || (status == "open" && !t.Done) {
			result = append(result, t)
		}
	}
	return result, nil
}

func (s *Service) Complete(id int) error {
	return s.SetDone(id, true)
}

// SetDone 支持网页勾选完成和恢复未完成。
func (s *Service) SetDone(id int, done bool) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	tasks, err := s.repo.Load()
	if err != nil {
		return err
	}
	for i := range tasks {
		// 修改切片元素用索引；range 返回的结构体变量是副本。
		if tasks[i].ID == id {
			tasks[i].Done = done
			return s.repo.Save(tasks)
		}
	}
	return fmt.Errorf("%w: %d", ErrNotFound, id)
}

func (s *Service) Delete(id int) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	tasks, err := s.repo.Load()
	if err != nil {
		return err
	}
	for i, t := range tasks {
		if t.ID == id {
			return s.repo.Save(append(tasks[:i], tasks[i+1:]...))
		}
	}
	return fmt.Errorf("%w: %d", ErrNotFound, id)
}

func (s *Service) Stats() (map[string]int, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	tasks, err := s.repo.Load()
	if err != nil {
		return nil, err
	}
	counts := map[string]int{"total": len(tasks), "open": 0, "done": 0}
	for _, t := range tasks {
		if t.Done {
			counts["done"]++
		} else {
			counts["open"]++
		}
	}
	return counts, nil
}
