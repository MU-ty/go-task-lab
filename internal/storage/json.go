package storage

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/MU-ty/go-task-lab/internal/task"
	"os"
)

type JSONFile struct{ Path string }

// 编译时检查接口实现；类型不满足接口时会编译失败。
var _ task.Repository = (*JSONFile)(nil)

func (f *JSONFile) Load() ([]task.Task, error) {
	data, err := os.ReadFile(f.Path)
	if errors.Is(err, os.ErrNotExist) {
		return []task.Task{}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("读取文件: %w", err)
	}
	var tasks []task.Task
	if err := json.Unmarshal(data, &tasks); err != nil {
		return nil, fmt.Errorf("解析 JSON: %w", err)
	}
	// 拒绝损坏数据，避免重复 ID 产生歧义。
	seen := make(map[int]bool)
	for _, t := range tasks {
		if t.ID <= 0 || seen[t.ID] {
			return nil, fmt.Errorf("无效或重复的任务 ID: %d", t.ID)
		}
		seen[t.ID] = true
	}
	return tasks, nil
}

func (f *JSONFile) Save(tasks []task.Task) error {
	data, err := json.MarshalIndent(tasks, "", "  ")
	if err != nil {
		return fmt.Errorf("编码 JSON: %w", err)
	}
	if err := os.WriteFile(f.Path, data, 0600); err != nil {
		return fmt.Errorf("保存文件: %w", err)
	}
	return nil
}
