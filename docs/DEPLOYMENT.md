# 毕业项目运行、发布和恢复演练

先完成 [项目 README](../examples/task-api/README.md) 的本地 Compose 与验收。以下是 Linux 服务器上的发布练习模板；域名、DNS、证书、生产数据库和机器需要你提供并配置。不会向未知公网环境自动部署服务。

## 发布前

1. 在 CI 通过 Go、race、真实 PostgreSQL 和镜像检查，给当前 commit/镜像一个明确版本标记。
2. 备份数据库，并在一个独立恢复库实际恢复，确认用户、任务与迁移版本可读。
3. 阅读迁移是否与旧应用兼容；先迁移再启动新版本，新版本 readyz 通过后接入流量。
4. 配置 `APP_ENV=production`、`LISTEN_ADDR=0.0.0.0:8090`、`ALLOWED_ORIGIN=https://api.example.com`。将 `DATABASE_URL` 与 CA 证书通过受控配置注入；外部生产数据库启用并验证 TLS，不使用开发的 `sslmode=disable`。

## 构建与本机监听

在 `examples/task-api` 目录构建版本镜像。`.env.production` 是服务器上的私有文件，不提交、不进构建上下文；内容可由服务器秘密管理机制生成。示例假定数据库服务已可连接且 DSN 使用正确的 TLS 校验配置。

```sh
docker build -t backend-lab:release .
docker run --rm --env-file .env.production backend-lab:release migrate
docker run -d --name backend-lab-api \
  --restart unless-stopped \
  --env-file .env.production \
  -p 127.0.0.1:8090:8090 \
  backend-lab:release
curl --fail http://127.0.0.1:8090/readyz
```

若 DSN 引用容器内的 CA 路径，需要额外只读挂载相应证书。日志输出到标准输出，运行环境负责访问控制和保留。日志不包含 token 或密码。不要将数据库端口开放公网。

## HTTPS 反向代理

一种实现是官方 Caddy。先按 [官方安装与 HTTPS 文档](https://caddyserver.com/docs/quick-starts/https) 安装服务器服务，将域名解析到该服务器，并确保 80/443 可达。配置示例：

```caddyfile
api.example.com {
    reverse_proxy 127.0.0.1:8090
}
```

将 `api.example.com` 换成真实域名，应用的 `ALLOWED_ORIGIN` 也要使用确切 HTTPS 源。Caddy 的自动 HTTPS 依赖有效域名、DNS 和验证所需网络；不能在占位域名上宣称证书可用。若前端来自另一个域，按第 37 章设计明确的 CORS/预检与凭证策略，不能默认开放所有源。项目当前没有信任任意转发 IP 头；代理后的多用户限流策略应显式设计可信代理与共享预算。

## 备份与恢复：本地演练

进入开发 Compose 所在目录，用 pg_dump 生成备份。重定向应使用 shell 的原始字节机制；PowerShell 旧版本的文本管道可能改变二进制，以下容器内命令将备份写成文件再复制出来，跨系统更稳定。

```sh
docker compose exec db pg_dump -U learner -d backend_lab -Fc -f /tmp/backend_lab.dump
docker compose cp db:/tmp/backend_lab.dump ./backend_lab.dump
docker compose exec db createdb -U learner backend_restore
docker compose exec db pg_restore -U learner -d backend_restore /tmp/backend_lab.dump
docker compose exec db psql -U learner -d backend_restore -c 'SELECT count(*) FROM tasks;'
docker compose exec db psql -U learner -d backend_restore -c 'SELECT version FROM schema_migrations;'
```

恢复到新建的独立库，不能覆盖原库。备份包含账号/任务等数据，应按敏感数据保护，不提交到源码。演练后自行确认临时恢复库和备份可移除；清理前确认目标与数据价值。生产备份还应有加密、访问控制、异地/版本保留和定期恢复测试，策略由实际业务要求确定。

## 故障与回滚

- **数据库不可用**：请求应有界失败，readyz=503；修复依赖后再次观察，不用无限重启掩盖错误。
- **新版本错误**：将流量或进程切回经过验证的旧镜像，但先确认新 schema 与旧应用兼容。
- **迁移破坏数据**：停止进一步写入，按事先演练的备份/恢复方案处理；不能默认执行破坏性的 down SQL。
- **关闭演练**：在开发环境发起请求后执行正常停止，观察 `shutdown complete`。API 最长等待 10 秒关闭请求，Compose 给出 15 秒进程停止窗口。
- **排错**：收集响应 X-Request-ID，用它查状态、路径和耗时日志。不要让用户提供密码、token 或完整 DSN 来排错。

## 发布验收

通过真实 HTTPS 请求验证注册、登录、创建/读取/修改/删除、两用户隔离、注销失效；确认重启数据仍在、探针和日志正确、备份已恢复过，再记录镜像版本和回滚方式。毕业项目不包含真实域名或服务器，所以本仓库验证的是 Go/API、数据库与容器路径，公网证书和外部生产环境需按这里的步骤实测。
