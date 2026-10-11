# Go Task Lab

通过一个可以实际运行的命令行待办清单学习 Go。中文注释、分步教程、练习和测试齐全；只使用标准库，无需数据库或第三方依赖。

## 快速开始

安装 [Go 官方工具链](https://go.dev/dl/)（Go 1.22 或更高），在项目根目录运行：

```sh
go run ./cmd/task add "学习 Go 的结构体"
go run ./cmd/task add "完成第一道练习"
go run ./cmd/task list
go run ./cmd/task done 1
go run ./cmd/task list open
go run ./cmd/task stats
go run ./cmd/task delete 2
go run ./examples/concurrency
go test ./...
```

`tasks.json` 自动保存在当前目录，已加入 `.gitignore`。更换文件使用 `go run ./cmd/task -file demo.json add "练习"`，全局参数必须位于命令前。不存在的 ID、空标题、损坏的 JSON 会返回错误，命令失败时退出码为 1。

编译：`go build -o bin/task.exe ./cmd/task`（Windows）；macOS/Linux 使用 `go build -o bin/task ./cmd/task`。

## 从哪里开始读

| 顺序 | 文件 | 学到的语法 |
| --- | --- | --- |
| 1 | `cmd/task/main.go` | package/import、main、变量、指针解引用、if、switch、函数、多返回值 |
| 2 | `internal/task/task.go` | struct、方法、指针接收者、切片、range、append、map、interface |
| 3 | `internal/storage/json.go` | JSON 标签、接口实现、错误包装、文件读写 |
| 4 | `internal/task/task_test.go` | testing、表驱动思路、内存替身、errors.Is |
| 5 | `examples/concurrency/main.go` | goroutine、channel、defer、闭包、WaitGroup |

完整说明见 [中文学习路线](docs/LEARNING.md)。建议每读完一个函数，就改一处行为并运行测试。

## 项目结构

```text
cmd/task/             命令解析与输出
internal/task/        业务规则及 Repository 接口
internal/storage/     JSON 文件存储
examples/concurrency/ 独立并发示例
docs/LEARNING.md      语法讲解和进阶练习
.github/workflows/   自动格式检查、静态检查、测试、编译
```

调用流程：命令行 → Service → Repository → JSONFile。替换存储只需实现接口，不用修改业务逻辑。

## 验证

```sh
go fmt ./...
go vet ./...
go test -cover ./...
go build ./...
```

安装支持的 C 编译器后可在 Windows 运行 `go test -race ./...`；GitHub Actions 的 Linux 环境自动进行竞态检查。

## 范围与练习

这是单进程学习工具：不要同时启动多个命令修改同一文件。当前直接写入 JSON，不提供文件锁或断电恢复；删除最大 ID 后，该 ID 可能被再次使用。可将原子写入、持久化 ID 序列、并发访问支持作为进阶练习。

## 上传到自己的 GitHub

若使用 ZIP，请解压后在目录内执行以下命令。先在 GitHub 创建空仓库 `go-task-lab`，不要勾选生成 README；将用户名替换为自己的账号。

```sh
git init -b main
git add .
git commit -m "feat: add Go learning task CLI"
git remote add origin https://github.com/YOUR_USERNAME/go-task-lab.git
git push -u origin main
```

## 官方学习资料

- [A Tour of Go](https://go.dev/tour/)：交互式语法入门。
- [Go 语言规范](https://go.dev/ref/spec)：查询语法细节。
- [标准库文档](https://pkg.go.dev/std)：查询本项目使用的包。
