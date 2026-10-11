# Go Task Lab

通过一个可以实际运行的交互式网站和命令行待办清单学习 Go。中文注释、分步教程、练习和测试齐全；只使用标准库，无需数据库或第三方依赖。

## 交互式网站

在项目根目录启动 Go 服务：

```sh
go run ./cmd/web
```

然后打开 **http://127.0.0.1:8080**。网站支持新增、完成/恢复、删除确认、状态筛选、搜索、统计和可展开的学习章节。真实数据保存在服务端 `tasks.json`，刷新页面仍然存在；首次打开为空清单。

前端 HTML/CSS/JavaScript 通过 `go:embed` 打包进 Go 程序，无需 Node.js、前端打包或 CDN。学习请求流程见 [网站学习说明](docs/WEB.md)。

自定义地址和数据文件：`go run ./cmd/web -addr 127.0.0.1:8081 -file web-tasks.json`。额外的数据文件请自行加入 `.gitignore`，避免提交个人任务。

Windows 可运行 `go build -o bin/go-task-web.exe ./cmd/web` 生成程序，或在项目目录双击 `start-web.cmd`。运行中保持终端开启，按 Ctrl+C 关闭服务。

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
cmd/web/              Go HTTP 服务入口
internal/web/         API、网页资源和 HTTP 测试
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

这是单服务学习工具：一个网页服务内的并发操作通过 Mutex 串行保存，但不要同时启动多个服务或用命令行修改同一数据文件。当前直接写入 JSON，不提供跨进程文件锁或断电恢复；删除最大 ID 后，该 ID 可能被再次使用。可将原子写入、持久化 ID 序列、跨进程并发访问支持作为进阶练习。

网站默认仅监听本机，没有账号与用户隔离。若要部署到公网，需要另外配置 HTTPS、身份验证及持久化存储；GitHub 保存源码，GitHub Pages 无法运行 Go 后端。

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
