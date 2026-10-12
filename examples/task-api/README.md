# 毕业项目：多用户任务 API

这是可独立运行的 Go 后端模块。先完成网站的第 21–44 章，再从空目录尝试实现同一合同，最后用本目录对照。完整学习路线与评分条件见 [BACKEND.md](../../docs/BACKEND.md)。

## 先跑通内存版

安装本目录 `go.mod` 指定的 Go 版本或更新版本。在仓库根目录进入本目录：

```sh
cd examples/task-api
go mod download
go test ./...
go run ./cmd/api
```

另开终端请求 `http://127.0.0.1:8090/healthz`，应该返回 200 与 `{"status":"ok"}`。此模式有真实 HTTP、密码哈希、会话与用户隔离，但重启会丢失数据，仅用于学习 API。没有 `TEST_DATABASE_URL` 时，SQL 集成测试明确跳过；不能将跳过视作数据库验证通过。

## 在 PowerShell 跑完整请求链

以下账号和密码只作为**本地学习数据**。真实密码不要写进脚本、仓库或终端历史。PowerShell 直接使用 `Invoke-RestMethod`，命令中的 token 仅保留在变量里：

```powershell
$base = 'http://127.0.0.1:8090'
$credentials = @{email='learner@example.test';password='Go-backend-learning-2026!'} | ConvertTo-Json
Invoke-RestMethod "$base/auth/register" -Method Post -ContentType 'application/json' -Body $credentials
$session = Invoke-RestMethod "$base/auth/login" -Method Post -ContentType 'application/json' -Body $credentials
$headers = @{Authorization='Bearer '+$session.token}
$task = Invoke-RestMethod "$base/tasks" -Method Post -Headers $headers -ContentType 'application/json' -Body '{"title":"完成 Go 后端项目"}'
Invoke-RestMethod "$base/tasks/$($task.id)" -Headers $headers
Invoke-RestMethod "$base/tasks/$($task.id)" -Method Patch -Headers $headers -ContentType 'application/json' -Body '{"done":true}'
Invoke-RestMethod "$base/tasks?limit=2&offset=0" -Headers $headers
Invoke-RestMethod "$base/tasks/$($task.id)" -Method Delete -Headers $headers
Invoke-RestMethod "$base/auth/logout" -Method Post -Headers $headers
# 再使用同一个 token 请求 /tasks，应该收到 401。
```

macOS/Linux 可以用 curl 请求相同方法和路径。Windows PowerShell 中 `curl` 可能是别名，使用 `curl.exe -i ...` 查看原始状态与响应头。账号重复注册返回 409；重新实验请换邮箱。

## 接入 PostgreSQL 和 Docker

先安装并启动 Docker。复制配置并替换本地密码；示例密码建议只使用字母、数字与连字符，特殊字符必须按 URL 规则编码到 DSN。不要将 `.env` 提交到 Git。

```sh
# macOS/Linux：cp .env.example .env
# Windows PowerShell：Copy-Item .env.example .env
# 编辑 .env，将 DB_PASSWORD 替换为你自己的本地开发密码。
docker compose up -d db
docker compose run --rm api migrate
docker compose up -d api
```

API 绑定宿主机 `127.0.0.1:8090`，数据库仅绑定 `127.0.0.1:5433`；这些是本地开发地址。数据写入 Docker 卷，`docker compose restart api` 后仍应保留。若已有内存版占用 8090，先 Ctrl+C 停止它。不会自动删卷；需要清空学习数据库时，应先确认数据可丢弃再自行操作。

也可以只用容器数据库，在本机运行 Go 服务。PowerShell：

```powershell
$env:DATABASE_URL='postgres://learner:你的URL编码后密码@127.0.0.1:5433/backend_lab?sslmode=disable'
go run ./cmd/api migrate
go run ./cmd/api
```

生产数据库应验证 TLS 证书，`sslmode=disable` 仅用于上述隔离的开发网络。生产 API 经受信反向代理使用 HTTPS，设置 `APP_ENV=production`、`DATABASE_URL` 和确切的 `ALLOWED_ORIGIN=https://你的域名`，并单独提供秘密；项目会拒绝缺少数据库、HTTPS 外部源，或 PostgreSQL URL 未使用 `sslmode=verify-full` 的生产配置。不要将开发 Compose 直接暴露公网。

## 读代码的顺序

| 文件 | 职责 |
| --- | --- |
| `store.go` | 用户、任务与仓储接口；稳定的领域错误 |
| `api.go` | 方法路由、严格 JSON、权限、状态码、中间件、日志 |
| `memory.go` | 有锁的内存实现，方便学习和 HTTP 单元测试 |
| `password.go` | Argon2id、随机盐、有界参数与恒定时间结果比较 |
| `auth.go` | 32 字节随机会话、摘要、按对端地址限流 |
| `sqlstore.go` | PostgreSQL 查询、连接池与创建任务/审计事务 |
| `migrations.go` + `migrations/` | 有锁、显式执行的迁移与约束 |
| `cmd/api/main.go` | 配置、依赖装配、超时、维护任务、信号与优雅退出 |
| `api_test.go` / `sqlstore_test.go` | 合同、输入、撤销、越权、并发、事务与持久化测试 |
| `openapi.yaml` | HTTP 合同，供客户端与后续文档工具使用 |

## HTTP 合同

| 方法与路径 | 身份 | 成功 | 失败要点 |
| --- | --- | --- | --- |
| GET `/healthz` | 无 | 200 | 进程存活 |
| GET `/readyz` | 无 | 200 | 必需依赖不可用时 503 |
| POST `/auth/register` | 无 | 201 | 400 输入、409 邮箱重复、429 认证预算 |
| POST `/auth/login` | 无 | 200 token/expires_at | 401 统一凭据失败、429 预算 |
| POST `/auth/logout` | Bearer | 204 | 401 无效/过期会话 |
| GET `/tasks?limit=20&offset=0` | Bearer | 200 items/limit/offset | limit 1–100，offset 0–100000；非法为 400 |
| POST `/tasks` | Bearer | 201 + Location | 标题 1–120 字符，未知字段或伪造 owner_id 为 400 |
| GET `/tasks/{id}` | Bearer | 200 | 无此资源或属于他人统一 404 |
| PATCH `/tasks/{id}` | Bearer | 200 | 至少提交 title 或 done；done=false 与未提交不同 |
| DELETE `/tasks/{id}` | Bearer | 204 | 不存在/不属于当前用户为 404 |

写入 JSON 要求 `Content-Type: application/json`；请求体最大 1 MiB。应用错误统一 JSON `{"error":"..."}`。无效方法返回 405 与 Allow；204 无正文。身份由服务端会话派生，不接收用户指定的 owner_id。

## 测试与验证

```sh
go test ./...
go vet ./...
# race 需要 Go 支持的系统和 C 工具链；GitHub CI 已配置 Linux 环境：
go test -race -cover ./...
```

SQL 测试需设置 `TEST_DATABASE_URL`，指向**专用开发/测试数据库**。测试仅创建名称为 `go_lab_test_...` 的临时 schema，结束时清理该 schema，不修改其他 schema。账号需要 CREATE SCHEMA 权限。不要连接生产数据库。

```powershell
$env:TEST_DATABASE_URL=$env:DATABASE_URL
go test -run SQL -v ./...
```

GitHub Actions 自动启 PostgreSQL，验证迁移、唯一/外键约束、参数化输入、跨用户 CRUD、数据库重开后的持久化、会话过期清理、取消与**审计失败导致的事务回滚**；随后构建非 root Docker 镜像，执行 migrate 并请求真实容器的健康端点。

## 完成后再扩展

Linux 服务器上的 HTTPS 发布、备份恢复和回滚演练见 [部署运行手册](../../docs/DEPLOYMENT.md)。

当前项目是一条可以解释和测试的教学基线。独立实现本合同后，再添加游标分页、幂等键、密码重置、邮件验证、共享限流、指标、缓存与队列；每项先写失败路径和验收用例。此项目没有实现密码重置、邮件验证或多节点共享限流，生产采用这些能力时应另做设计和测试。
