# 部署指南

> **项目**: Star Citizen 战队宣传网站
> **更新日期**: 2026-08-26
> **版本**: v1.6.2

---

## 部署架构概览

```
┌──────────────────────────────────────────────────────────────┐
│  docker compose --profile production up -d                   │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────────┐   │
│  │  mysql   │ ←─ │ migrate  │    │  nginx (自构建前端) │   │
│  │  8.0     │    │ (一次性) │    │  - multi-stage       │   │
│  └────┬─────┘    └────┬─────┘    │  - envsubst 模板化   │   │
│       │               │          │  - SSL 终止          │   │
│       │               ↓          └──────────┬───────────┘   │
│       │          ┌──────────┐               │               │
│       └────────→ │ backend  │ ←─────────────┘               │
│                  │ (prod)   │                               │
│                  └────┬─────┘                               │
│                       │                                     │
│      ┌──────────┐  ┌──┴─────────┐                           │
│      │ postgres │  │   redis    │   (v1.5.0 AI 依赖)        │
│      │ pgvector │  │  7-alpine  │                           │
│      └──────────┘  └────────────┘                           │
│                                                              │
│  ┌──────────┐    ┌──────────┐                               │
│  │ backup   │    │ certbot  │                               │
│  │ crond    │    │ renew    │                               │
│  └──────────┘    └──────────┘                               │
└──────────────────────────────────────────────────────────────┘
```

### 服务说明

| 服务 | 端口 | Profile | 说明 |
|:---|:---|:---|:---|
| `migrate` | — | 默认 + production | 一次性数据库迁移服务，backend 依赖其成功退出 |
| `backend` | 3001 | 默认 + production | 后端 API（生产镜像，仅 dependencies） |
| `mysql` | 127.0.0.1:3306 | 默认 + production | MySQL 8.0（仅本地访问） |
| `postgres` | 127.0.0.1:5432 | 默认 + production | pgvector/pg16（AI 向量知识库，v1.5.0 新增） |
| `redis` | 127.0.0.1:6379 | 默认 + production | Redis 7（LLM 响应缓存 + AI 会话，v1.5.0 新增） |
| `nginx` | 80, 443 | production | 反向代理 + SSL 终止 + 前端静态文件 |
| `backup` | — | production | 数据库自动备份（每天 03:00，保留 30 天） |
| `certbot` | — | production | Let's Encrypt 证书自动续期（每 12 小时检查） |

---

## 前置条件

| 依赖 | 最低版本 |
|:---|:---|
| Docker | 20.10+ |
| Docker Compose | 2.0+ |
| 可用内存 | ≥ 2GB |
| openssl（生成密钥与自签名证书） | 任意版本 |

---

## 部署方式一：Docker Compose（推荐）

### 1. 准备环境变量

```bash
# 复制模板
cp .env.production.example .env

# 生成强密钥并写入 .env
JWT_SECRET=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)
DB_ROOT_PASSWORD=$(openssl rand -hex 16)

# 在 .env 中填入（Windows PowerShell 用户需手动编辑）
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|" .env
sed -i "s|^DB_ROOT_PASSWORD=.*|DB_ROOT_PASSWORD=$DB_ROOT_PASSWORD|" .env

# 设置域名（本地验证用 localhost，生产环境填真实域名）
sed -i "s|^SERVER_NAME=.*|SERVER_NAME=localhost|" .env
sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=https://localhost|" .env
sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://localhost|" .env
```

### 2. 准备 SSL 证书

#### 方案 A：自签名证书（本地验证）

```bash
# 生成本地验证用自签名证书
./scripts/generate-self-signed-cert.sh localhost

# 证书会被放到 ./ssl/ 目录
ls ssl/
# fullchain.pem  privkey.pem
```

#### 方案 B：Let's Encrypt 免费证书（生产环境）

```bash
# 1. 创建 certbot 所需目录
mkdir -p ssl certbot/www certbot/conf

# 2. 临时启动 nginx（仅 HTTP 模式申请证书）
# 编辑 .env 将 SERVER_NAME 改为真实域名，并先用 HTTP-only 启动
docker compose --profile production up -d nginx

# 3. 申请证书
docker compose run --rm certbot certonly \
    --webroot -w /var/www/certbot \
    -d your-domain.com \
    --email your@email.com \
    --agree-tos --no-eff-email

# 4. 同步证书到 nginx 读取的路径
./scripts/sync-letsencrypt-certs.sh your-domain.com

# 5. 重载 nginx
docker compose exec nginx nginx -s reload
```

### 3. 启动服务

#### 完整生产栈（含 nginx + backup + certbot）

```bash
docker compose --profile production up -d
```

#### 仅后端 + 数据库（开发调试）

```bash
docker compose up -d
```

### 4. 验证部署

```bash
# 查看所有服务状态（应全部 Up (healthy)，migrate 应为 exited (0)）
docker compose --profile production ps

# 健康检查（自签名证书用 -k 跳过校验）
curl -k https://localhost/health/live
# 期望: {"status":"ok"}

curl -k https://localhost/health
# 期望: {"status":"ok","checks":{"database":true,...}}

# API 冒烟
curl -k https://localhost/api/fleet
curl -k https://localhost/api/stats

# HTTPS 重定向验证
curl -I http://localhost
# 期望: 301 → https://localhost/

# 前端首页
curl -k https://localhost/
# 期望: 200 + HTML
```

---

## 环境变量清单

### 必填变量（不设置则容器拒绝启动）

| 变量 | 说明 |
|:---|:---|
| `JWT_SECRET` | JWT 签名密钥，至少 32 字符 |
| `DB_PASSWORD` | 数据库密码 |
| `DB_ROOT_PASSWORD` | MySQL root 密码（用于备份服务） |
| `PG_PASSWORD` | pgvector 数据库密码（v1.5.0 AI 依赖，未设置容器拒绝启动） |

### 可选变量（有默认值）

| 变量 | 默认值 | 说明 |
|:---|:---|:---|
| `SERVER_NAME` | `localhost` | nginx server_name，生产环境填真实域名 |
| `USE_HTTPS` | `true` | 是否启用 HTTPS |
| `DB_HOST` | `mysql` | 数据库主机（Docker 服务名） |
| `DB_PORT` | `3306` | 数据库端口 |
| `DB_USER` | `app_user` | 数据库用户 |
| `DB_NAME` | `star_citizen_promotion` | 数据库名 |
| `DB_CONNECTION_LIMIT` | `20` | 连接池大小 |
| `JWT_EXPIRES_IN` | `30d` | JWT 过期时间 |
| `BCRYPT_SALT_ROUNDS` | `12` | bcrypt 加盐轮数 |
| `RATE_LIMIT_WINDOW_MS` | `900000` | 限流窗口（15 分钟） |
| `RATE_LIMIT_MAX` | `100` | 窗口内最大请求数 |
| `ALLOWED_ORIGINS` | `https://localhost` | CORS 允许来源 |
| `FRONTEND_URL` | `https://localhost` | 前端 URL（用于 CORS） |
| `METRICS_ENABLED` | `true` | 是否启用 /metrics 端点 |
| `METRICS_ALLOWED_IPS` | `127.0.0.1,::1` | /metrics 访问白名单 |
| `WS_PORT` | `3001` | WebSocket 端口 |
| `LOG_LEVEL` | `info` | 日志级别 |
| `LOG_FILE_ENABLED` | `true` | 是否启用文件日志 |
| `PG_USER` | `app_user` | pgvector 数据库用户（v1.5.0） |
| `PG_DB` | `star_citizen_ai` | pgvector 数据库名（v1.5.0） |
| `PGVECTOR_URL` | `postgres://app_user:${PG_PASSWORD}@postgres:5432/star_citizen_ai` | 向量库连接串（Docker 内用服务名 `postgres`） |
| `REDIS_URL` | `redis://redis:6379` | Redis 连接串（Docker 内用服务名 `redis`） |
| `DOUBAO_API_KEY` | - | 豆包 API Key（LLM Provider，至少配置一个） |
| `DEEPSEEK_API_KEY` | - | DeepSeek API Key（LLM Provider） |
| `ANTHROPIC_API_KEY` | - | Claude API Key（LLM Provider） |
| `LLM_CHAT_MODEL` | `doubao-pro-32k-241215` | chat 主模型 |
| `LLM_CHAT_STREAM_MODEL` | `deepseek-chat` | 流式对话模型 |
| `LLM_EMBEDDING_MODEL` | `doubao-embedding-text-240715` | 向量模型 |
| `EMBEDDING_DIM` | `1024` | 向量维度 |
| `LLM_CACHE_TTL` | `86400` | LLM 响应缓存 TTL（秒） |
| `LLM_REQUEST_TIMEOUT_MS` | `30000` | LLM 请求超时（毫秒） |

完整变量列表见 [.env.production.example](../../.env.production.example)。

---

## 数据持久化

| 卷 | 挂载路径 | 用途 |
|:---|:---|:---|
| `mysql_data` (Docker volume) | `/var/lib/mysql` | 数据库数据 |
| `./server/data` (bind mount) | `/app/server/data` | 应用数据 |
| `./backups` (bind mount) | `/backups` | 数据库备份文件 |
| `./ssl` (bind mount, ro) | `/etc/nginx/ssl` | SSL 证书 |
| `./certbot/conf` (bind mount) | `/etc/letsencrypt` | Let's Encrypt 证书归档 |
| `./certbot/www` (bind mount) | `/var/www/certbot` | ACME 挑战路径 |

---

## 数据库迁移

迁移由独立的 `migrate` 服务执行：

```bash
# 查看迁移日志
docker compose logs migrate

# 手动重新执行迁移（会先停止依赖它的 backend）
docker compose stop backend
docker compose up migrate
docker compose start backend

# 迁移服务使用 server/src/database/migrate.ts 编译后的 dist/database/migrate.js
# 该脚本会创建数据库（若不存在）和所有表（CREATE TABLE IF NOT EXISTS，幂等）
```

---

## 数据库备份与恢复

### 自动备份

`backup` 服务使用 alpine + busybox crond，每天 03:00（Asia/Shanghai）自动执行：

```bash
# 查看备份服务日志
docker compose logs backup

# 查看已生成的备份文件
ls -la backups/
# backup_20260725_030000.sql.gz  backup_20260726_030000.sql.gz  ...

# 备份策略：
# - 每天 03:00 执行
# - mysqldump --single-transaction（InnoDB 一致性快照，不锁表）
# - gzip 压缩
# - 保留 30 天，过期自动清理
```

### 手动备份

```bash
# 触发一次手动备份
docker compose exec backup /backup/backup.sh

# 或在宿主机直接执行
docker compose run --rm backup /backup/backup.sh
```

### 恢复备份

```bash
# 解压并恢复
gunzip < backups/backup_20260725_030000.sql.gz | \
    docker compose exec -T mysql mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_NAME"
```

---

## SSL 证书管理

### 证书续期（Let's Encrypt）

Let's Encrypt 证书有效期 90 天，certbot 容器每 12 小时自动检查续期：

```bash
# 查看 certbot 日志
docker compose logs certbot

# 续期后需同步证书到 nginx 路径并重载
./scripts/sync-letsencrypt-certs.sh your-domain.com
docker compose exec nginx nginx -s reload
```

> **提示**：可配置 certbot 的 `--deploy-hook` 自动调用 sync 脚本，避免手动操作。

### 自签名证书重新生成

```bash
./scripts/generate-self-signed-cert.sh localhost
docker compose exec nginx nginx -s reload
```

---

## 健康检查

项目提供三个健康检查端点：

| 端点 | 用途 | 响应 |
|:---|:---|:---|
| `GET /health/live` | 存活探针 | `{ "status": "ok" }` |
| `GET /health/ready` | 就绪探针 | 200 就绪 / 503 未就绪 |
| `GET /health` | 综合健康检查 | 数据库连接 + 内存使用 + 连接池状态 |

Docker 健康检查配置已内置在 `Dockerfile` 和 `docker-compose.yml` 中，间隔 15~30 秒自动探测。

---

## 优雅关闭

后端服务支持优雅关闭，关闭顺序：

1. 停止接受新连接
2. 关闭 WebSocket 连接
3. 等待进行中的请求完成（最多 30 秒）
4. 关闭数据库连接池
5. 退出进程

Docker 环境中，`docker stop` 会发送 SIGTERM 信号触发优雅关闭。超时 30 秒后 Docker 发送 SIGKILL 强制终止。

---

## 日志管理

所有服务已配置日志大小限制：

```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"      # 单个日志文件最大 10MB
    max-file: "3"        # 保留 3 个日志文件
```

```bash
# 查看实时日志
docker compose logs -f backend

# 查看最近 100 行
docker compose logs --tail 100 nginx

# 应用层日志（winston）保存在容器内 /app/logs/
docker compose exec backend ls /app/logs/
```

---

## 监控接入

后端暴露 Prometheus 格式的 `/metrics` 端点，接入方式见 [METRICS.md](../observability/METRICS.md)。

---

## 常见部署问题

### Q: 容器启动后数据库连接失败？

1. 检查 `.env` 中 `DB_PASSWORD` 与 `DB_ROOT_PASSWORD` 是否正确
2. 确认 MySQL 容器健康：`docker compose ps mysql`
3. 查看 migrate 日志：`docker compose logs migrate`
4. 查看 backend 日志：`docker compose logs backend`

### Q: backend 容器一直处于 `starting` 状态？

backend 依赖 migrate 服务成功退出。如果 migrate 失败：

```bash
docker compose logs migrate
# 修复问题后重启
docker compose up migrate
docker compose start backend
```

### Q: Nginx 返回 502 Bad Gateway？

1. 检查后端是否健康：`curl http://localhost:3001/health/live`
2. 查看 nginx 日志：`docker compose logs nginx`
3. 确认 nginx 配置语法：`docker compose exec nginx nginx -t`

### Q: 前端页面刷新后 404？

确认 nginx.conf 中有 SPA 路由回退（已在 `nginx.conf.tmpl` 中配置）：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Q: WebSocket 连接不上？

确认 nginx 配置了 WebSocket 代理头（已在 `nginx.conf.tmpl` 中配置）：

```nginx
location /ws {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Q: HTTPS 浏览器提示证书不可信？

自签名证书仅供本地验证。生产环境请使用 Let's Encrypt 或商业证书。

### Q: 日志文件占用磁盘过大？

所有服务已限制单文件 10MB × 3 个文件。如需更激进的限制，修改 `docker-compose.yml` 中 `logging.options`。

---

## 部署方式二：手动部署（无 Docker）

### 环境要求

| 依赖 | 版本 |
|:---|:---|
| Node.js | ^20.19.0 或 >=22.12.0 |
| npm | ≥9.0.0 |
| MySQL | ≥8.0 |

### 步骤

```bash
# 1. 克隆并安装依赖
git clone https://github.com/star-citizen-team/star-citizen-promotion.git
cd star-citizen-promotion
npm ci
cd server && npm ci && cd ..

# 2. 配置环境变量
cp server/.env.production.example server/.env.production
# 编辑 server/.env.production，填入数据库连接信息和 JWT 密钥

# 3. 初始化数据库
cd server && npm run db:init && cd ..

# 4. 构建前端
npm run build
# 产物输出到 dist/ 目录

# 5. 启动后端（生产模式）
cd server
NODE_ENV=production node dist/index.js
```

### Nginx 反向代理配置

手动部署时，参考 `nginx.conf.tmpl` 配置宿主机 nginx，将 `${SERVER_NAME}` 替换为实际域名。
