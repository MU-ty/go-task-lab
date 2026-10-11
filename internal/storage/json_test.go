package storage

import (
	"github.com/MU-ty/go-task-lab/internal/task"
	"os"
	"path/filepath"
	"testing"
)

func TestRoundTrip(t *testing.T) {
	f := &JSONFile{Path: filepath.Join(t.TempDir(), "tasks.json")}
	tasks, err := f.Load()
	if err != nil || len(tasks) != 0 {
		t.Fatalf("首次读取: %v", err)
	}
	if err := f.Save([]task.Task{{ID: 1, Title: "中文任务", Done: true}}); err != nil {
		t.Fatal(err)
	}
	tasks, err = f.Load()
	if err != nil || len(tasks) != 1 || tasks[0].Title != "中文任务" || !tasks[0].Done {
		t.Fatalf("回读失败: %+v %v", tasks, err)
	}
}

func TestInvalidData(t *testing.T) {
	for _, data := range []string{"broken", `[{"id":1},{"id":1}]`, `[{"id":0}]`} {
		f := &JSONFile{Path: filepath.Join(t.TempDir(), "tasks.json")}
		if err := os.WriteFile(f.Path, []byte(data), 0600); err != nil {
			t.Fatal(err)
		}
		if _, err := f.Load(); err == nil {
			t.Fatalf("应拒绝数据: %s", data)
		}
	}
}
