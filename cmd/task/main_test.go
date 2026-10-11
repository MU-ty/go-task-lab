package main

import (
	"bytes"
	"path/filepath"
	"strings"
	"testing"
)

func TestCLI(t *testing.T) {
	path := filepath.Join(t.TempDir(), "tasks.json")
	cases := []struct {
		args []string
		want string
		fail bool
	}{
		{[]string{"add", "学习 Go"}, "已添加 #1", false},
		{[]string{"done", "1"}, "成功", false},
		{[]string{"list", "done"}, "[x] #1 学习 Go", false},
		{[]string{"stats"}, "总计 1，未完成 0，已完成 1", false},
		{[]string{"delete", "1"}, "成功", false},
		{[]string{"list"}, "暂无任务", false},
		{[]string{"done", "abc"}, "", true},
		{[]string{"done", "999"}, "", true},
		{[]string{"unknown"}, "", true},
	}
	for _, tc := range cases {
		var out bytes.Buffer
		err := run(append([]string{"-file", path}, tc.args...), &out)
		if (err != nil) != tc.fail || !strings.Contains(out.String(), tc.want) {
			t.Fatalf("%v: 输出 %q 错误 %v", tc.args, out.String(), err)
		}
	}
}
