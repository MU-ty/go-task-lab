package main

import (
	"flag"
	"fmt"
	"github.com/MU-ty/go-task-lab/internal/storage"
	"github.com/MU-ty/go-task-lab/internal/task"
	"io"
	"os"
	"strconv"
	"strings"
)

const usage = `Go Task Lab — Go 语法学习项目
用法: task [-file tasks.json] 命令 [参数]
  add 标题         新增任务
  list [all|open|done]  列出任务
  done ID          完成任务
  delete ID        删除任务
  stats            统计任务
  help             显示帮助
注意: -file 必须放在命令前面。
`

func main() {
	if err := run(os.Args[1:], os.Stdout); err != nil {
		fmt.Fprintln(os.Stderr, "错误:", err)
		os.Exit(1)
	}
}

// 接收 io.Writer 让程序输出可以在测试中被捕获。
func run(args []string, out io.Writer) error {
	flags := flag.NewFlagSet("task", flag.ContinueOnError)
	flags.SetOutput(out)
	file := flags.String("file", "tasks.json", "数据文件路径")
	if err := flags.Parse(args); err != nil {
		if err == flag.ErrHelp {
			return nil
		}
		return err
	}
	args = flags.Args()
	if len(args) == 0 {
		fmt.Fprint(out, usage)
		return nil
	}
	s := task.New(&storage.JSONFile{Path: *file})
	switch args[0] {
	case "help":
		fmt.Fprint(out, usage)
	case "add":
		t, err := s.Add(strings.Join(args[1:], " "))
		if err != nil {
			return err
		}
		fmt.Fprintf(out, "已添加 #%d: %s\n", t.ID, t.Title)
	case "list":
		if len(args) > 2 {
			return fmt.Errorf("用法: list [all|open|done]")
		}
		status := "all"
		if len(args) == 2 {
			status = args[1]
		}
		tasks, err := s.List(status)
		if err != nil {
			return err
		}
		if len(tasks) == 0 {
			fmt.Fprintln(out, "暂无任务")
		}
		for _, t := range tasks {
			mark := " "
			if t.Done {
				mark = "x"
			}
			fmt.Fprintf(out, "[%s] #%d %s\n", mark, t.ID, t.Title)
		}
	case "done", "delete":
		if len(args) != 2 {
			return fmt.Errorf("用法: %s ID", args[0])
		}
		id, err := strconv.Atoi(args[1])
		if err != nil || id <= 0 {
			return fmt.Errorf("ID 必须是正整数")
		}
		if args[0] == "done" {
			err = s.Complete(id)
		} else {
			err = s.Delete(id)
		}
		if err != nil {
			return err
		}
		fmt.Fprintf(out, "%s #%d 成功\n", args[0], id)
	case "stats":
		if len(args) != 1 {
			return fmt.Errorf("用法: stats")
		}
		counts, err := s.Stats()
		if err != nil {
			return err
		}
		fmt.Fprintf(out, "总计 %d，未完成 %d，已完成 %d\n", counts["total"], counts["open"], counts["done"])
	default:
		return fmt.Errorf("未知命令 %q；使用 help 查看帮助", args[0])
	}
	return nil
}
