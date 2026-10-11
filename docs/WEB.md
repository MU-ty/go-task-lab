# Go 学习网站：架构与练习

## 从哪里读代码

1. `cmd/web/main.go` 创建 HTTP 服务，默认监听 127.0.0.1:8080。
2. `internal/web/handler.go` 注册 Go 1.22 方法路由，提供静态资源和 JSON 响应。
3. `internal/web/static/courses.js` 定义课程讲解、示例代码、题目、答案与解析。
4. `internal/web/static/app.js` 管理章节切换、标签页、示例参数和练习校验。
5. `internal/web/lessons.go` 运行预先编译的 Go 教学函数。

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

练习只校验选择或填空内容，并给出解释，不编译用户任意填写的代码。希望自由编辑时，复制示例到本机 Go 环境。

## 新增一章

1. 在 COURSES 添加唯一 id、标题、讲解、误区、完整代码和两个练习。
2. 在 exampleOutput 添加对应 Go 计算逻辑。
3. 在 lessons_test.go 验证默认参数和边界参数。
4. 将网页显示的代码复制出来运行，核对它与 API 输出一致。
5. 运行 go test ./... 和 go vet ./...。

## 部署

源码在 GitHub 开源，网站当前本地运行。要部署 Go 服务，需要支持可执行程序或容器的平台。GitHub Pages 不能直接启动此 Go 后端。
