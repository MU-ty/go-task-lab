# Go 学习网站：架构与练习

## 从哪里读代码

1. `cmd/web/main.go` 创建 HTTP 服务，默认监听 127.0.0.1:8080。
2. `internal/web/handler.go` 注册 Go 1.22 方法路由，提供静态资源和 JSON 响应。
3. `internal/web/static/courses.js` 定义课程讲解、示例代码、题目、答案与解析。
4. `internal/web/static/app.js` 管理章节切换、标签页、示例参数和练习校验。
5. `internal/web/lessons.go` 提供两种运行环境共用的 Go 教学函数。
6. `cmd/playground/main_js_wasm.go` 通过 syscall/js 暴露 Go 函数。
7. `cmd/sitegen/main.go` 打包 GitHub Pages 静态资源和 WebAssembly。

## 一次“运行示例”的数据流

调整 n → 页面更新代码中的参数 → 点击按钮 → fetch 发送 GET /api/lessons/loops/run?n=3 → Go 校验课程与参数 → 执行 for 循环累加 → JSON 返回输出 → 前端写入输出区。

请求参数限定 1–9，未知课程返回 404，非法参数返回 400。后端不执行任意文本，不使用 shell，也不依赖在线编译服务。页面显示的是教学函数对应的完整独立程序。

## Go 语法在网站实现中的应用

- `http.HandlerFunc`：函数适配为 HTTP 处理器。
- `r.PathValue("id")`：获取路由路径参数。
- `strconv.Atoi`：字符串转整数，同时返回错误。
- `switch`：选择课程对应的函数。
- `bytes.Buffer`：收集 fmt 输出，再编码成 JSON。
- `embed.FS` 与 `fs.Sub`：将静态文件嵌入可执行程序。
- `httptest`：不启动网络端口，也能测试 HTTP 状态和响应。
- `sync.WaitGroup` 与 channel：并发计算平方，再汇总结果。

## 前端如何提供反馈

选择题用 radio 和 FormData 获取答案；填空题匹配课程定义的合法答案。前端使用 textContent 输出讲解、代码和用户反馈。请求期间禁用按钮；课程或参数切换后，旧响应不会覆盖新的课程。

练习只校验选择或填空内容，并给出解释，不编译用户任意填写的代码。希望自由编辑时，使用 OneCompiler 页签；真实网络与数据库实战通过后端实战页签在本机完成。

## 新增一章

1. 在 COURSES 添加唯一 id、标题、讲解、误区、完整代码和两个练习。
2. 在 ExampleOutput 添加对应 Go 计算逻辑；后端课程则修改 curriculum/backend.cjs 并生成。
3. 在 lessons_test.go 验证默认参数和边界参数。
4. 将网页显示的代码复制出来运行，核对它与 API 输出一致。
5. 运行 go test ./... 和 go vet ./...。

## 部署

源码在 GitHub 开源，在线网站发布在 https://mu-ty.github.io/go-task-lab/ 。main 分支更新会触发 Pages 工作流。

Pages 版本不依赖 HTTP 后端：构建程序编译 GOOS=js、GOARCH=wasm 目标，复制同版本 Go JavaScript 运行时，并注入 pages-runtime.js。加载后，前端调用 GoLearningRun，仍执行真实 Go 教学逻辑，包括 goroutine 和 channel。

本地 HTTP 模式和在线 WebAssembly 模式共用 ExampleOutput，避免课程输出出现两个不同实现。站点资源使用相对路径，支持 GitHub Pages 的仓库子目录。

## 进阶课程验证

第 11–20 章覆盖语言细节、标准库、并发协作与测试。`go test ./...` 检查服务与教学函数；`node scripts/check-courses.cjs` 在已安装 Go 的环境中逐一编译网页展示的完整程序，校验全部 44 章、88 道练习的定义与多个参数输出。测试章节的实际子测试可通过 `go test ./examples/testing -v` 查看。

第 21–44 章由 curriculum/backend.cjs 生成 backend-courses.js 与 internal/backendlesson。页面追加后端实战目标和阶段路线；独立毕业项目在 examples/task-api，由单独 CI 验证 PostgreSQL 和 Docker。

## 前端设计与导航

界面采用深绿导航与暖白阅读区，分组目录可折叠，搜索区独立固定在目录上方。手机使用展开式目录，打开时让正文 inert，选择章节或 Escape 后关闭。切换章节将阅读位置与焦点移动到章节标题；CSS 尊重 prefers-reduced-motion。

代码配色只通过创建 span/text 节点完成，完整 source 的 textContent 保持原样，复制与 OneCompiler 载入读取该原文。行号为独立 aria-hidden 区域，不进入复制或编译内容。
Pages 构建为 CSS 与 app.js 添加内容哈希版本，确保改版后浏览器获取对应资源，避免旧缓存与新页面结构混用。
