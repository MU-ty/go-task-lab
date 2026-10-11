package task

import (
	"errors"
	"testing"
)

type memoryRepo struct {
	tasks []Task
	err   error
}

func (m *memoryRepo) Load() ([]Task, error) { return append([]Task(nil), m.tasks...), m.err }
func (m *memoryRepo) Save(tasks []Task) error {
	if m.err != nil {
		return m.err
	}
	m.tasks = append([]Task(nil), tasks...)
	return nil
}

func TestLifecycle(t *testing.T) {
	s := New(&memoryRepo{})
	first, err := s.Add(" 学习 Go ")
	if err != nil || first.Title != "学习 Go" || first.ID != 1 {
		t.Fatalf("新增: %+v, %v", first, err)
	}
	if _, err := s.Add("写测试"); err != nil {
		t.Fatal(err)
	}
	if err := s.Complete(first.ID); err != nil {
		t.Fatal(err)
	}
	done, err := s.List("done")
	if err != nil || len(done) != 1 || !done[0].Done {
		t.Fatalf("完成列表: %+v, %v", done, err)
	}
	counts, err := s.Stats()
	if err != nil || counts["total"] != 2 || counts["done"] != 1 || counts["open"] != 1 {
		t.Fatalf("统计: %v, %v", counts, err)
	}
	if err := s.Delete(first.ID); err != nil {
		t.Fatal(err)
	}
	if err := s.Complete(first.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("应返回 ErrNotFound: %v", err)
	}
}

func TestValidation(t *testing.T) {
	for _, title := range []string{"", " ", "\t\n"} {
		t.Run("empty_"+title, func(t *testing.T) {
			if _, err := New(&memoryRepo{}).Add(title); err == nil {
				t.Fatal("空标题应失败")
			}
		})
	}
	if _, err := New(&memoryRepo{}).List("invalid"); err == nil {
		t.Fatal("无效筛选应失败")
	}
}

func TestRepositoryError(t *testing.T) {
	want := errors.New("存储不可用")
	s := New(&memoryRepo{err: want})
	if _, err := s.Add("测试"); !errors.Is(err, want) {
		t.Fatalf("错误未传播: %v", err)
	}
}
