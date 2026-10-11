# Go 学习实验室

一个中文交互式 Go 语法学习网站。核心流程是 **阅读讲解 → 运行示例 → 完成练习 → 查看解析**。

## 启动网站

安装 [Go](https://go.dev/dl/) 1.22 或更高版本，在项目目录运行：

```sh
go run ./cmd/web
```

打开 **http://127.0.0.1:8080**，保持终端开启，按 Ctrl+C 停止服务。也可双击 Windows 的 `start-web.cmd`。

## 学习内容

| 章节 | 主题 |
| --- | --- |
| 01–04 | 程序入口、变量与类型、条件判断、for 循环 |
| 05–08 | 函数与错误处理、切片与 range、map、结构体与指针 |
| 09–10 | 方法与接口、goroutine 与 channel |

每章包含三段中文讲解、常见误区、完整可复制代码、代码阅读提示、一道选择题和一道填空题。选择题和填空题提供即时校验与参考解析。支持课程搜索、章节切换、键盘切换标签页和手机布局。

## 示例如何运行

点击“运行示例”调用 Go 后端，实际执行预先编译的教学函数；可将参数 n 调整为 1–9，页面代码与输出同步变化。入门程序和接口示例没有参数。

这里提供固定示例的参数实验，不执行用户提交的任意 Go 代码。需要自由修改时，复制完整示例到本机 `main.go`，执行 `go run main.go`。不依赖外部在线编译服务。

## 项目结构

```text
cmd/web/                       HTTP 服务入口
internal/web/lessons.go         Go 教学示例执行
internal/web/static/courses.js  10 章课程与 20 道练习
internal/web/static/app.js      课程切换、运行、答案反馈
internal/web/static/            HTML 和响应式 CSS
internal/web/*_test.go          API、参数和并发测试
cmd/task/                      独立命令行实战示例
internal/task/                 实战业务逻辑
internal/storage/              实战 JSON 存储
examples/concurrency/          独立并发示例
docs/                          网站架构与实战学习指南
```

前端资源通过 `go:embed` 嵌入 Go 程序，无第三方依赖、无需 Node.js 构建。网站架构说明见 [WEB.md](docs/WEB.md)，实战学习见 [LEARNING.md](docs/LEARNING.md)。

## 验证与编译

```sh
go fmt ./...
go vet ./...
go test -cover ./...
go build -o bin/go-learning-web ./cmd/web
```

Windows 可改用 `go build -o bin/go-learning-web.exe ./cmd/web`。GitHub Actions 自动进行格式检查、静态检查、竞态测试和编译。

自定义端口：`go run ./cmd/web -addr 127.0.0.1:8081`。网站默认仅监听本机。GitHub 保存源码；GitHub Pages 不运行 Go 后端，目前没有公网网站部署。

## 命令行实战

学完基础后，可以用原有命令行示例练习包、结构体、接口、切片和文件读写：

```sh
go run ./cmd/task add "练习结构体"
go run ./cmd/task list
go run ./examples/concurrency
```

`tasks.json` 是实战数据，已被 Git 忽略，不作为网站的学习内容。实战 API 仍作为 HTTP 测试素材保留，不在学习页面展示。

## 贡献与开源

本项目采用 [MIT License](LICENSE)，欢迎提交 Issue 和 Pull Request。新增课程时修改 `courses.js`、添加对应 Go 示例与测试，确保网页代码和后端输出保持一致。不要提交个人数据或工具链目录。

## 官方资料

- [A Tour of Go](https://go.dev/tour/)
- [Go 语言规范](https://go.dev/ref/spec)
- [标准库文档](https://pkg.go.dev/std)
