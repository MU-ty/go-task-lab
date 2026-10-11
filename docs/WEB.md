# 从命令行到交互式网站

## 启动与阅读顺序

运行 `go run ./cmd/web`，打开 http://127.0.0.1:8080。终端负责运行服务器，浏览器负责展示页面。

1. `cmd/web/main.go`：flag 读取参数，创建 Service 和 http.Server。
2. `internal/web/handler.go`：注册路由，读取请求，调用业务方法并返回 JSON。
3. `internal/web/static/app.js`：事件监听、fetch、更新页面。
4. `internal/task/task.go`：复用原来的业务规则，并用 Mutex 防止并发读写覆盖。
5. `internal/web/handler_test.go`：通过 httptest 验证 API，不必手动开启服务器。

## 一次新增任务如何发生

用户提交表单 → JavaScript 的 submit 事件 → fetch 发送 POST /api/tasks → Go 路由调用 add → Decoder 将 JSON 读取进结构体 → Service.Add 读取和保存 JSON 文件 → 返回 201 与任务数据 → 页面重新读取列表并更新 DOM。

请求内容示例：`{"title":"学习 Go HTTP"}`。响应内容示例：`{"id":1,"title":"学习 Go HTTP","done":false}`。

## API 对照

| 方法 | 路径 | 请求内容 | 成功响应 |
| --- | --- | --- | --- |
| GET | `/api/tasks` | 无 | 200，任务数组 |
| POST | `/api/tasks` | `{"title":"学习 Go"}` | 201，新增任务 |
| PATCH | `/api/tasks/1` | `{"done":true}` 或 `{"done":false}` | 204，无内容 |
| DELETE | `/api/tasks/1` | 无 | 204，无内容 |

发送 JSON 的请求必须带 `Content-Type: application/json`。无效内容返回 400，不存在的任务返回 404，存储失败返回 500。标题限制 1–120 个 Unicode 字符，请求体限制 4 KB。错误响应使用 `{"error":"说明"}`。

## Go 语法重点

### net/http 与方法路由

`mux.HandleFunc("PATCH /api/tasks/{id}", h.update)` 使用 Go 1.22 的方法路由和路径参数。`r.PathValue("id")` 获取字符串，再用 `strconv.Atoi` 转成整数。

Handler 接收 `http.ResponseWriter` 和 `*http.Request`。前者写响应，后者读取请求。先设置响应头，再写状态码，最后编码数据；204 不写 JSON。

### 指针字段的意义

`Done *bool` 允许辨别：nil 表示用户没传字段或传了 null，`&false` 表示明确恢复未完成。普通 bool 无法区分缺失值和 false。

### embed 与文件系统接口

`//go:embed static/*` 在编译时把网页资源嵌入程序。`fs.Sub` 取出 static 子目录，`http.FileServer` 通过文件系统接口提供资源。因此生成的可执行程序不依赖旁边再放一个 static 文件夹。

### Mutex 与事务范围

Go 会并发处理 HTTP 请求。只保护 Save 不够：两个请求可能同时 Load 相同列表，各自添加后覆盖彼此。这里锁住整个 Load → 修改 → Save 过程，并用 defer 解锁。锁只协调同一个 Service 实例，不跨进程。

### httptest

`httptest.NewRequest` 构造请求，`httptest.NewRecorder` 捕获响应，然后直接调用 Handler。测试覆盖新增、完成和恢复、删除、输入校验、静态资源、跨站拒绝，以及 20 个同时新增请求。

## 前端阅读重点

- `addEventListener` 连接按钮与处理函数。
- `async/await` 等待网络请求，try/catch 显示错误。
- `fetch` 调用 Go API，`JSON.stringify` 将对象转换为请求内容。
- `textContent` 展示用户标题，避免当作 HTML 执行。
- state 保存当前筛选和搜索；真正的任务数据来自服务器。
- 写入后重新查询服务器；如果写入成功但查询失败，页面明确提示刷新，避免重复提交。

## 练习

1. 增加编辑标题：实现 Service.Edit，再补一个 PATCH 字段和编辑表单。
2. 增加优先级：结构体字段、服务端校验、网页选择器、排序。
3. 给存储写入失败添加 HTTP 测试，验证返回 500 且不泄露文件路径。
4. 将任务统计改为 GET /api/stats，比较服务端计算与浏览器计算。
5. 用数据库替换 JSONFile，保持 Repository 接口，理解为什么界面不必重写。

## 部署边界

本项目提供可运行的本地 Go 网站和 GitHub 源码。GitHub Pages 只托管静态资源，不能启动 Go 服务。部署到服务器或支持 Go 容器的平台时，设置监听地址，例如 `-addr 0.0.0.0:8080`，并配置 HTTPS、登录及可持久化的数据目录。

当前请求来源检查适用于直接访问本机的同源网页。若通过反向代理部署 HTTPS，需要让代理与服务约定可信的外部来源校验方式；不要直接信任任意客户端传入的代理请求头。
