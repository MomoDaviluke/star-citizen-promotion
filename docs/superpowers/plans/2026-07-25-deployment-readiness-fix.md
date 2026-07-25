# 部署就绪度修复实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 修复 13 项部署就绪度问题（4 P0 + 5 P1 + 4 P2），使 `docker compose --profile production up -d` 一键启动完整生产栈并通过健康检查与 API 冒烟。

**架构：** backend 使用 production 阶段（重装 `--omit=dev` 依赖）；新增独立 migrate 一次性服务（`depends_on: service_completed_successfully`）；nginx 通过独立 Dockerfile.nginx 多阶段构建自带前端产物；backup 用 alpine + busybox crond 实现真实备份；nginx.conf 用 envsubst 模板化支持域名参数化；自签名证书验证完整 HTTPS 链路。

**技术栈：** Docker multi-stage build / docker-compose profiles / nginx:alpine / alpine:3.19 + busybox crond / mysql:8.0 / envsubst / mysqldump

**规格：** [docs/superpowers/specs/2026-07-25-deployment-readiness-fix-design.md](file:///c:/Users/Administrator/Desktop/star-citizen-promotion/docs/superpowers/specs/2026-07-25-deployment-readiness-fix-design.md)

---

## 文件结构清单

### 新增文件

| 路径 | 职责 |
|---|---|
| `.dockerignore` | 减少 Docker build context 体积（排除 node_modules/dist/tests/docs 等） |
| `.env.production.example` | 根目录顶层 env 模板（与 docker-compose.yml 变量对齐） |
| `Dockerfile.nginx` | nginx 多阶段构建：复用 frontend-builder 产物 + 自定义模板 |
| `nginx.conf.tmpl` | nginx 主配置模板（含 `${SERVER_NAME}` 占位符） |
| `nginx-entrypoint.sh` | envsubst 渲染脚本（放在 `/docker-entrypoint.d/`） |
| `backup/Dockerfile` | backup 镜像（alpine:3.19 + mysql-client + busybox-suid） |
| `backup/backup.sh` | mysqldump + gzip + 30 天清理脚本（含日志与错误处理） |
| `backup/crontab` | cron 定时任务配置（每天 03:00 执行） |
| `scripts/generate-self-signed-cert.sh` | 自签名证书生成脚本（验证用） |
| `scripts/sync-letsencrypt-certs.sh` | Let's Encrypt 续期后同步证书到 nginx 路径 |
| `docs/observability/METRICS.md` | Prometheus /metrics 接入文档 |

### 修改文件

| 路径 | 修改内容 |
|---|---|
| `Dockerfile` | production 阶段重构：重装 `--omit=dev`、复制 migrations/knexfile |
| `docker-compose.yml` | 新增 migrate/backup 服务、删除 nginx 本地 dist 挂载、env 透传、logging driver |
| `docs/guides/DEPLOYMENT.md` | 同步架构图、migrate 服务说明、新 backup 命令、envsubst 用法 |

### 删除文件

| 路径 | 原因 |
|---|---|
| `nginx.conf` | 重命名为 `nginx.conf.tmpl`（模板化） |
| `docker-entrypoint.sh` | 改用独立 migrate 服务，entrypoint 不再需要 |

---

## 任务 1：基础准备 — .dockerignore 与 env 模板

**文件：**
- 创建：`.dockerignore`
- 创建：`.env.production.example`

- [ ] **步骤 1：创建 .dockerignore**

```
# 版本控制
.git
.gitignore
.githooks
.github

# 依赖与构建产物（构建时重新生成）
node_modules
server/node_modules
dist
server/dist
coverage
server/coverage

# 测试与文档（生产镜像不需要）
tests
server/tests
e2e
load-tests
playwright-report
test-results
docs
screenshots
*.md
!server/README.md

# 环境与配置（构建时通过环境变量注入）
.env
.env.local
.env.development
.env.production
.env.*.local

# 临时与缓存
*.log
*.tmp
*.temp
.cache
.eslintcache
*.tsbuildinfo
.worktrees
.trae
.claude
.claude-crap
.agents
.vscode
.idea

# Docker 卷与备份
docker-volumes
backups
ssl
certbot

# 压测报告
load-tests/reports

# 设计参考与脚本
docs/design-ref
scripts/generate-ship-images.md
patches

# 子项目目录（避免上下文污染）
backup
```

- [ ] **步骤 2：创建 .env.production.example（根目录顶层）**

```bash
# ===========================================
# Docker Compose 生产环境配置模板
# @description 顶层 env 文件，供 docker-compose.yml 读取
# @usage 复制为 .env 并填入真实值
# ===========================================

# ---------- 域名与 SSL ----------
# nginx server_name，支持多域名逗号分隔
SERVER_NAME=localhost
# 是否启用 HTTPS（自签名验证时也保持 true，仅 HTTP-only 模式设为 false）
USE_HTTPS=true

# ---------- JWT 配置（必填） ----------
# 至少 32 字符强随机字符串（生成命令：openssl rand -hex 32）
JWT_SECRET=
JWT_EXPIRES_IN=30d

# ---------- 数据库配置 ----------
DB_HOST=mysql
DB_PORT=3306
DB_USER=app_user
# 必填：强密码（生成命令：openssl rand -hex 16）
DB_PASSWORD=
DB_ROOT_PASSWORD=
DB_NAME=star_citizen_promotion
DB_CONNECTION_LIMIT=20

# ---------- 后端应用 ----------
FRONTEND_URL=https://localhost
# CORS 允许的来源，多域名逗号分隔
ALLOWED_ORIGINS=https://localhost
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
WS_PORT=3003

# ---------- 日志 ----------
LOG_LEVEL=info
LOG_FILE_ENABLED=true
LOG_FILE_ERROR=/app/logs/error.log
LOG_FILE_COMBINED=/app/logs/combined.log

# ---------- Prometheus 指标 ----------
METRICS_ENABLED=true
# 允许访问 /metrics 的 IP 白名单（CIDR 支持）
METRICS_ALLOWED_IPS=127.0.0.1,::1
```

- [ ] **步骤 3：Commit**

```bash
git add .dockerignore .env.production.example
git commit -m "chore(config): 新增 .dockerignore 与生产环境 env 模板

- .dockerignore 排除 node_modules/tests/docs 等减少构建上下文
- .env.production.example 与 docker-compose.yml 变量对齐"
```

---

## 任务 2：Dockerfile 重构（P0-1）

**文件：**
- 修改：`Dockerfile`

**目标：** production 阶段重装 `--omit=dev` 依赖，消除 dev 依赖残留；复制 migrations 与 knexfile 供 migrate 服务复用。

- [ ] **步骤 1：读取现有 Dockerfile**

运行：`Read Dockerfile`
预期：能看到当前 production 阶段第 54-55 行直接 `COPY --from=backend-builder /app/server/node_modules`（包含 dev deps）。

- [ ] **步骤 2：替换 Dockerfile 全部内容**

```dockerfile
# ============================================
# 多阶段构建 Dockerfile
# @description 优化镜像体积和构建效率
#   - frontend-builder: 构建前端静态资源
#   - backend-builder: 编译后端 TypeScript（含 dev deps 用于编译）
#   - production: 最小化生产镜像（仅 dependencies）
# ============================================

# --------------------------------------------
# 前端构建阶段
# --------------------------------------------
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# 利用 Docker 缓存：先复制依赖文件
COPY package*.json ./
# 前端构建需要 vite 等开发依赖，不能使用 --omit=dev
RUN npm ci --ignore-scripts

# 复制源代码并构建
COPY . .
RUN npm run build

# --------------------------------------------
# 后端构建阶段
# --------------------------------------------
FROM node:22-alpine AS backend-builder

WORKDIR /app/server

# 复制后端依赖文件
COPY server/package*.json ./
# 后端构建需要 TypeScript 等开发依赖进行编译
RUN npm ci --ignore-scripts

# 复制后端源码并编译
COPY server/ ./
RUN npm run build

# --------------------------------------------
# 生产阶段 — 最小化镜像
# --------------------------------------------
FROM node:22-alpine AS production

WORKDIR /app

# 安装 wget 用于健康检查，创建非 root 用户
RUN apk add --no-cache wget ca-certificates && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 复制 package.json 后重新安装生产依赖（仅 dependencies，不含 devDependencies）
# 关键：不能直接 COPY builder 的 node_modules，否则会带入 typescript/jest 等 dev 依赖
COPY --from=backend-builder /app/server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
WORKDIR /app

# 复制编译后的后端代码、迁移文件与 knex 配置（供独立 migrate 服务复用）
COPY --from=backend-builder /app/server/dist ./server/dist
COPY --from=backend-builder /app/server/migrations ./server/migrations
COPY --from=backend-builder /app/server/knexfile.js ./server/knexfile.js

# 前端构建产物（供 backend 直接 serve 兜底；nginx 服务通过 Dockerfile.nginx 单独引用）
COPY --from=frontend-builder /app/dist ./dist

# 创建数据目录并设置权限
RUN mkdir -p /app/server/data /app/logs && \
    chown -R nodejs:nodejs /app

# 切换到非 root 用户运行，提升安全性
USER nodejs

# 环境变量
ENV NODE_ENV=production
ENV PORT=3001
ENV STATIC_FILES_PATH=/app/dist
ENV LOG_FILE_ENABLED=true
ENV LOG_FILE_ERROR=/app/logs/error.log
ENV LOG_FILE_COMBINED=/app/logs/combined.log

# 暴露端口（后端 API）
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://localhost:3001/health/live || exit 1

# 启动命令：直接运行编译后的 JS
CMD ["node", "server/dist/index.js"]
```

- [ ] **步骤 3：构建 backend 镜像验证**

运行：
```bash
docker build --target production -t scp-backend-test .
```
预期：构建成功，无报错。

- [ ] **步骤 4：验证镜像内无 dev 依赖**

运行：
```bash
docker run --rm scp-backend-test sh -c "cd /app/server && npm ls --omit=dev --all 2>&1 | grep -E 'typescript|jest|supertest|tsx|eslint|@types|ts-jest|@swc' && echo 'FAIL: 发现 dev 依赖残留' || echo 'PASS: 无 dev 依赖残留'"
```
预期：输出 `PASS: 无 dev 依赖残留`。

- [ ] **步骤 5：验证关键文件存在**

运行：
```bash
docker run --rm scp-backend-test sh -c "ls -la /app/server/dist/index.js /app/server/dist/database/migrate.js /app/server/migrations/ /app/dist/index.html"
```
预期：所有文件路径存在，无 `No such file` 错误。

- [ ] **步骤 6：清理测试镜像**

运行：
```bash
docker rmi scp-backend-test
```

- [ ] **步骤 7：Commit**

```bash
git add Dockerfile
git commit -m "fix(config): 修正 Dockerfile production 阶段依赖裁剪

- production 阶段重装 npm ci --omit=dev，避免从 builder 复制 dev 依赖
- 新增 migrations 与 knexfile.js 复制，供独立 migrate 服务复用
- 清理 npm cache 减小镜像体积"
```

---

## 任务 3：backup 服务实现（P0-4）

**文件：**
- 创建：`backup/Dockerfile`
- 创建：`backup/backup.sh`
- 创建：`backup/crontab`

**目标：** 用 alpine + busybox crond 实现真实 mysqldump 备份，每天 03:00 执行，gzip 压缩，保留 30 天。

- [ ] **步骤 1：创建 backup/backup.sh**

```bash
#!/bin/sh
# ============================================
# MySQL 数据库备份脚本
# @description 执行 mysqldump，gzip 压缩，保留 30 天
# @usage 由 crond 每天 03:00 自动调用
# ============================================

set -e

# 环境变量校验
: "${DB_HOST:?DB_HOST must be set}"
: "${DB_USER:?DB_USER must be set}"
: "${DB_PASSWORD:?DB_PASSWORD must be set}"
: "${DB_NAME:?DB_NAME must be set}"
DB_PORT="${DB_PORT:-3306}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql.gz"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔄 开始备份数据库 $DB_NAME..."

# 执行 mysqldump 并 gzip 压缩
# --single-transaction: InnoDB 一致性快照，不锁表
# --routines --triggers: 包含存储过程和触发器
# --set-gtid-purged=OFF: 避免 GTID 冲突（单机部署）
if mysqldump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password="$DB_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --set-gtid-purged=OFF \
    "$DB_NAME" 2>/tmp/mysqldump_error.log | gzip > "$BACKUP_FILE"; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 备份成功: $BACKUP_FILE ($SIZE)"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ 备份失败:"
    cat /tmp/mysqldump_error.log >&2
    rm -f "$BACKUP_FILE"
    exit 1
fi

# 清理过期备份
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🧹 清理 $RETENTION_DAYS 天前的备份..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
REMAINING=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | wc -l)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📊 当前保留备份文件数: $REMAINING"
```

- [ ] **步骤 2：创建 backup/crontab**

```
# 每天 03:00 执行数据库备份
# 格式: minute hour day month dayofweek command
0 3 * * * /backup/backup.sh >> /var/log/backup.log 2>&1
```

- [ ] **步骤 3：创建 backup/Dockerfile**

```dockerfile
# ============================================
# MySQL 备份服务镜像
# @description alpine + busybox crond + mysqldump
# 每天定时备份并清理过期文件
# ============================================

FROM alpine:3.19

LABEL maintainer="star-citizen-team"
LABEL description="MySQL automated backup service"

# 安装依赖
# - mysql-client: 提供 mysqldump
# - busybox-suid: 提供 crond（需要 suid 权限切换用户）
# - gzip: 压缩备份文件
# - findutils: find 命令的完整版（支持 -mtime）
# - tzdata: 时区数据，确保 cron 按正确时区执行
RUN apk add --no-cache \
    mysql-client \
    busybox-suid \
    gzip \
    findutils \
    tzdata

# 设置时区（默认 Asia/Shanghai，可通过 TZ 环境变量覆盖）
ENV TZ=Asia/Shanghai
RUN cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 复制备份脚本与 cron 配置
COPY backup.sh /backup/backup.sh
COPY crontab /etc/crontabs/root

# 创建日志目录与备份目录（备份目录由 volume 挂载，此处仅占位）
RUN mkdir -p /backup /var/log && \
    chmod +x /backup/backup.sh && \
    chmod 600 /etc/crontabs/root

# 启动 crond（前台运行，-l 8 输出 INFO 级日志到 stderr）
CMD ["crond", "-f", "-l", "8"]
```

- [ ] **步骤 4：本地构建测试 backup 镜像**

运行：
```bash
cd backup
docker build -t scp-backup-test .
cd ..
```
预期：构建成功。

- [ ] **步骤 5：验证镜像内文件与权限**

运行：
```bash
docker run --rm scp-backup-test sh -c "ls -la /backup/backup.sh /etc/crontabs/root && cat /etc/crontabs/root"
```
预期：
- `/backup/backup.sh` 存在且 `-rwxr-xr-x`
- `/etc/crontabs/root` 存在且 `-rw-------`
- 输出包含 `0 3 * * * /backup/backup.sh`

- [ ] **步骤 6：验证脚本能识别缺失环境变量**

运行：
```bash
docker run --rm scp-backup-test /backup/backup.sh
```
预期：输出 `DB_HOST must be set` 并退出码非 0。

- [ ] **步骤 7：清理测试镜像**

运行：
```bash
docker rmi scp-backup-test
```

- [ ] **步骤 8：Commit**

```bash
git add backup/
git commit -m "feat(config): 新增 backup 服务实现 alpine+crond+mysqldump

- backup/Dockerfile: alpine:3.19 + mysql-client + busybox-suid + tzdata
- backup/backup.sh: mysqldump --single-transaction + gzip + 30 天清理
- backup/crontab: 每天 03:00 执行（Asia/Shanghai 时区）
- 脚本含完整环境变量校验、错误日志、保留文件数统计"
```

---

## 任务 4：nginx 多阶段构建与配置增强（P0-3 + P1-1）

**文件：**
- 创建：`Dockerfile.nginx`
- 创建：`nginx.conf.tmpl`
- 创建：`nginx-entrypoint.sh`
- 删除：`nginx.conf`（迁移为 .tmpl）

**目标：** nginx 服务通过独立 Dockerfile.nginx 自带前端产物；nginx.conf 增强安全/性能参数并用 envsubst 模板化支持 `${SERVER_NAME}` 替换。

- [ ] **步骤 1：创建 nginx.conf.tmpl**

```nginx
# ============================================
# nginx 主配置模板
# @description 通过 envsubst 渲染 ${SERVER_NAME} 后输出到 /etc/nginx/nginx.conf
# @usage 由 /docker-entrypoint.d/40-render-nginx-conf.sh 调用 envsubst
# ============================================

worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 隐藏 nginx 版本号（安全）
    server_tokens off;
    # 允许上传的最大请求体（如头像、文件附件）
    client_max_body_size 16m;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml application/wasm;

    # 日志格式（含请求耗时 rt）
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" rt=$request_time';
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # 上游后端服务（启用 keepalive 连接复用）
    upstream backend {
        server backend:3001;
        keepalive 32;
    }

    # ============================================
    # HTTP 80 端口：ACME 挑战 + 强制重定向 HTTPS
    # ============================================
    server {
        listen 80;
        server_name ${SERVER_NAME};

        # Let's Encrypt 证书验证路径
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        # 其他请求重定向到 HTTPS
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # ============================================
    # HTTPS 443 端口：主服务
    # ============================================
    server {
        listen 443 ssl http2;
        server_name ${SERVER_NAME};

        # SSL 证书
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL 安全协议与加密套件
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_ecdh_curve X25519:secp384r1;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;
        ssl_session_tickets off;

        # OCSP Stapling
        ssl_stapling on;
        ssl_stapling_verify on;

        # ============================================
        # 安全响应头（应用于所有响应）
        # ============================================
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        # HSTS：强制浏览器使用 HTTPS
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
        # CSP：收紧 connect-src，仅允许同源和 WebSocket
        add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' ws: wss:; frame-src 'none'; object-src 'none'" always;

        # ============================================
        # 前端静态文件
        # ============================================
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
        }

        # ============================================
        # API 代理
        # ============================================
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            # 清空 Connection 头以启用 keepalive 到后端
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # ============================================
        # WebSocket 代理
        # ============================================
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }

        # ============================================
        # 健康检查端点（精确匹配）
        # ============================================
        location = /health {
            proxy_pass http://backend/health;
        }
        location = /health/live {
            proxy_pass http://backend/health/live;
        }
        location = /health/ready {
            proxy_pass http://backend/health/ready;
        }

        # ============================================
        # 静态资源缓存（同时保留安全头，防止 add_header 继承规则丢失）
        # ============================================
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|avif|webp)$ {
            expires 1y;
            add_header Cache-Control "public, immutable" always;
            # 重复添加安全头，防止 Nginx 的 add_header 继承规则导致安全头丢失
            add_header X-Frame-Options "SAMEORIGIN" always;
            add_header X-Content-Type-Options "nosniff" always;
            add_header X-XSS-Protection "1; mode=block" always;
            add_header Referrer-Policy "strict-origin-when-cross-origin" always;
            add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
            add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' ws: wss:; frame-src 'none'; object-src 'none'" always;
        }
    }
}
```

- [ ] **步骤 2：创建 nginx-entrypoint.sh**

```sh
#!/bin/sh
# ============================================
# nginx 配置渲染脚本
# @description 通过 envsubst 渲染 nginx.conf 模板中的 ${SERVER_NAME} 等变量
# @usage 放在 /docker-entrypoint.d/ 由 nginx 官方 entrypoint 自动调用
# ============================================

set -e

# 显式指定替换变量列表
# 关键：不指定列表会导致 $host/$remote_addr 等 nginx 内置变量被错误替换为空
envsubst '${SERVER_NAME}' \
    < /etc/nginx/templates/nginx.conf.tmpl \
    > /etc/nginx/nginx.conf

# 不 exec nginx，让 nginx 官方 entrypoint 继续执行后续脚本
# （如 30-tune-worker-processes.sh 自动调优）
```

- [ ] **步骤 3：创建 Dockerfile.nginx**

```dockerfile
# ============================================
# nginx 镜像：多阶段构建自带前端产物
# @description
#   阶段 1: 复用主 Dockerfile 的 frontend-builder 阶段
#   阶段 2: nginx:alpine + 前端 dist + 配置模板
# @usage 由 docker-compose.yml 的 nginx 服务构建
# ============================================

# --------------------------------------------
# 阶段 1：复用主 Dockerfile 的 frontend-builder 阶段
# --------------------------------------------
# 注意：frontend-builder 必须是主 Dockerfile 中已命名的构建阶段
# Docker Compose 构建时同上下文的 Dockerfile 共享构建缓存，frontend-builder 会被复用
FROM frontend-builder AS frontend

# --------------------------------------------
# 阶段 2：nginx + 前端产物 + 配置模板
# --------------------------------------------
FROM nginx:alpine

LABEL maintainer="star-citizen-team"
LABEL description="nginx with built frontend assets"

# 复制前端构建产物到 nginx 静态文件目录
COPY --from=frontend /app/dist /usr/share/nginx/html

# 复制 nginx 配置模板与渲染脚本
# 模板放在 /etc/nginx/templates/，渲染脚本放在 /docker-entrypoint.d/
# nginx:alpine 官方镜像会自动执行 /docker-entrypoint.d/*.sh
COPY nginx.conf.tmpl /etc/nginx/templates/nginx.conf.tmpl
COPY nginx-entrypoint.sh /docker-entrypoint.d/40-render-nginx-conf.sh

# 删除默认配置（避免与渲染后的主配置冲突）
RUN rm -f /etc/nginx/conf.d/default.conf && \
    chmod +x /docker-entrypoint.d/40-render-nginx-conf.sh

# 健康检查：nginx 自身的 80 端口会 301 重定向到 HTTPS
# 用 -k 忽略自签名证书校验，跟随重定向后检查最终响应
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null --spider http://localhost/ || exit 1

EXPOSE 80 443
```

- [ ] **步骤 4：删除旧 nginx.conf**

运行：
```bash
git rm nginx.conf
```
预期：文件被删除并暂存。

- [ ] **步骤 5：本地构建测试 nginx 镜像**

运行：
```bash
docker build -f Dockerfile.nginx -t scp-nginx-test .
```
预期：构建成功。

- [ ] **步骤 6：验证镜像内文件存在**

运行：
```bash
docker run --rm scp-nginx-test sh -c "ls -la /usr/share/nginx/html/index.html /etc/nginx/templates/nginx.conf.tmpl /docker-entrypoint.d/40-render-nginx-conf.sh && echo '---' && head -5 /etc/nginx/templates/nginx.conf.tmpl"
```
预期：所有文件存在，模板头部为 `worker_processes auto;` 等。

- [ ] **步骤 7：验证 envsubst 渲染逻辑**

运行：
```bash
docker run --rm -e SERVER_NAME=test.example.com scp-nginx-test sh -c "cat /etc/nginx/nginx.conf | grep server_name | head -2"
```
预期：输出包含 `server_name test.example.com;`（说明 envsubst 已正确执行）。

- [ ] **步骤 8：验证 nginx 配置语法**

运行：
```bash
docker run --rm -e SERVER_NAME=localhost scp-nginx-test nginx -t
```
预期：输出 `nginx: configuration file /etc/nginx/nginx.conf test is successful`。

- [ ] **步骤 9：清理测试镜像**

运行：
```bash
docker rmi scp-nginx-test
```

- [ ] **步骤 10：Commit**

```bash
git add Dockerfile.nginx nginx.conf.tmpl nginx-entrypoint.sh
git rm nginx.conf
git commit -m "feat(config): nginx multi-stage 自构建前端产物与配置增强

- 新增 Dockerfile.nginx: 复用 frontend-builder 阶段，自带 dist 产物
- nginx.conf 迁移为 nginx.conf.tmpl 模板，支持 \${SERVER_NAME} 参数化
- nginx-entrypoint.sh: envsubst 渲染脚本，放在 /docker-entrypoint.d/
- 增强: worker_processes auto / server_tokens off / client_max_body_size 16m
- 增强: ssl_ecdh_curve X25519:secp384r1 / upstream keepalive 32
- 增强: 健康检查路径精确匹配 /health/live /health/ready"
```

---

## 任务 5：docker-compose.yml 全面重构（P0-2 + P0-3 集成 + P1-2 + P1-3 + P1-4）

**文件：**
- 修改：`docker-compose.yml`

**目标：** 集成 migrate 服务、nginx 自构建、backup 实现；透传完整环境变量；添加 logging driver 限制；统一 SSL 路径。

- [ ] **步骤 1：替换 docker-compose.yml 全部内容**

```yaml
# ============================================
# Docker Compose 生产环境编排
# @description
#   - 默认 profile: backend + mysql + migrate（开发调试用）
#   - production profile: 完整生产栈（含 nginx + backup + certbot）
# @usage
#   开发: docker compose up -d
#   生产: docker compose --profile production up -d
# ============================================

services:
  # ============================================
  # 数据库迁移服务（一次性运行）
  # ============================================
  migrate:
    build:
      context: .
      dockerfile: Dockerfile
      target: backend-builder
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      - NODE_ENV=production
      - DB_HOST=${DB_HOST:-mysql}
      - DB_PORT=${DB_PORT:-3306}
      - DB_USER=${DB_USER:-app_user}
      - DB_PASSWORD=${DB_PASSWORD:?DB_PASSWORD must be set}
      - DB_NAME=${DB_NAME:-star_citizen_promotion}
    # 执行迁移脚本后退出
    command: ["node", "dist/database/migrate.js"]
    restart: "no"
    profiles: ["default", "production"]
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # ============================================
  # 后端 API 服务
  # ============================================
  backend:
    build:
      context: .
      dockerfile: Dockerfile
      # 默认使用 production 阶段（不指定 target 即用最终阶段）
    restart: unless-stopped
    ports:
      - "3001:3001"
    depends_on:
      mysql:
        condition: service_healthy
      migrate:
        condition: service_completed_successfully
    environment:
      - NODE_ENV=production
      - PORT=3001
      - JWT_SECRET=${JWT_SECRET:?JWT_SECRET must be set}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-30d}
      - DB_HOST=${DB_HOST:-mysql}
      - DB_PORT=${DB_PORT:-3306}
      - DB_USER=${DB_USER:-app_user}
      - DB_PASSWORD=${DB_PASSWORD:?DB_PASSWORD must be set}
      - DB_NAME=${DB_NAME:-star_citizen_promotion}
      - DB_CONNECTION_LIMIT=${DB_CONNECTION_LIMIT:-20}
      - BCRYPT_SALT_ROUNDS=${BCRYPT_SALT_ROUNDS:-12}
      - RATE_LIMIT_WINDOW_MS=${RATE_LIMIT_WINDOW_MS:-900000}
      - RATE_LIMIT_MAX=${RATE_LIMIT_MAX:-100}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-https://localhost}
      - FRONTEND_URL=${FRONTEND_URL:-https://localhost}
      - METRICS_ENABLED=${METRICS_ENABLED:-true}
      - METRICS_ALLOWED_IPS=${METRICS_ALLOWED_IPS:-127.0.0.1,::1}
      - WS_PORT=${WS_PORT:-3003}
      - LOG_LEVEL=${LOG_LEVEL:-info}
      - LOG_FILE_ENABLED=${LOG_FILE_ENABLED:-true}
      - LOG_FILE_ERROR=/app/logs/error.log
      - LOG_FILE_COMBINED=/app/logs/combined.log
    volumes:
      - ./server/data:/app/server/data
    healthcheck:
      test: ["CMD", "wget", "-q", "-O", "/dev/null", "http://localhost:3001/health/live"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 30s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # ============================================
  # MySQL 数据库
  # ============================================
  mysql:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-${DB_PASSWORD:?DB_PASSWORD must be set}}
      MYSQL_DATABASE: ${DB_NAME:-star_citizen_promotion}
      MYSQL_USER: ${DB_USER:-app_user}
      MYSQL_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD must be set}
    ports:
      - "127.0.0.1:3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # ============================================
  # nginx 反向代理 + SSL 终止（production profile）
  # ============================================
  nginx:
    build:
      context: .
      dockerfile: Dockerfile.nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    environment:
      - SERVER_NAME=${SERVER_NAME:-localhost}
    volumes:
      # SSL 证书（自签名或预放证书）
      - ./ssl:/etc/nginx/ssl:ro
      # Let's Encrypt webroot 挑战路径
      - ./certbot/www:/var/www/certbot:ro
      # Let's Encrypt 证书归档（供 sync 脚本同步到 ./ssl/）
      - ./certbot/conf:/etc/letsencrypt:ro
    depends_on:
      backend:
        condition: service_healthy
    profiles: ["production"]
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # ============================================
  # 数据库自动备份服务（production profile）
  # ============================================
  backup:
    build:
      context: ./backup
    restart: unless-stopped
    environment:
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_USER=root
      - DB_PASSWORD=${DB_ROOT_PASSWORD:-${DB_PASSWORD:?DB_PASSWORD must be set}}
      - DB_NAME=${DB_NAME:-star_citizen_promotion}
      - RETENTION_DAYS=30
      - TZ=Asia/Shanghai
    volumes:
      - ./backups:/backups
    depends_on:
      mysql:
        condition: service_healthy
    profiles: ["production"]
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # ============================================
  # Let's Encrypt 证书自动续期（production profile）
  # ============================================
  certbot:
    image: certbot/certbot:v2.6.0
    restart: unless-stopped
    volumes:
      - ./certbot/www:/var/www/certbot
      - ./certbot/conf:/etc/letsencrypt
    # 每 12 小时检查一次续期
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew --quiet; sleep 12h & wait $${!}; done'"
    profiles: ["production"]
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  mysql_data:
```

- [ ] **步骤 2：验证 docker-compose 配置语法**

运行：
```bash
docker compose config
```
预期：输出完整解析后的配置，无报错。检查 migrate/nginx/backup 服务均存在。

- [ ] **步骤 3：验证 production profile 配置**

运行：
```bash
docker compose --profile production config --services
```
预期：列出 `backend migrate mysql nginx backup certbot` 6 个服务。

- [ ] **步骤 4：验证环境变量必填校验**

运行：
```bash
docker compose config 2>&1 | head -5
```
预期：未设置 `DB_PASSWORD` 与 `JWT_SECRET` 时报错 `DB_PASSWORD must be set` 与 `JWT_SECRET must be set`。

- [ ] **步骤 5：Commit**

```bash
git add docker-compose.yml
git commit -m "feat(config): docker-compose 全面重构集成 migrate/backup/nginx 服务

P0-2: 新增独立 migrate 服务，backend 通过 service_completed_successfully 依赖
P0-3: nginx 服务改用 Dockerfile.nginx 自构建，删除本地 ./dist 挂载
P0-4: backup 服务集成 ./backup 镜像，含 RETENTION_DAYS 与 TZ 配置
P1-2: 所有服务添加 logging driver 限制（max-size 10m / max-file 3）
P1-3: backend 透传完整环境变量（JWT/DB/CORS/METRICS/WS/LOG）
P1-4: SSL 路径统一（./ssl + ./certbot/conf + ./certbot/www）"
```

---

## 任务 6：自签名证书生成与 Let's Encrypt 同步脚本

**文件：**
- 创建：`scripts/generate-self-signed-cert.sh`
- 创建：`scripts/sync-letsencrypt-certs.sh`

**目标：** 提供本地验证用的自签名证书生成脚本；提供 Let's Encrypt 续期后同步证书到 nginx 路径的脚本。

- [ ] **步骤 1：创建 scripts/generate-self-signed-cert.sh**

```bash
#!/usr/bin/env bash
# ============================================
# 自签名 SSL 证书生成脚本
# @description 生成本地验证用的自签名证书
# @usage ./scripts/generate-self-signed-cert.sh [domain]
# ============================================

set -e

DOMAIN="${1:-localhost}"
SSL_DIR="${SSL_DIR:-./ssl}"

mkdir -p "$SSL_DIR"

echo "🔐 为 $DOMAIN 生成自签名证书..."

# 生成自签名证书（365 天有效期）
# -nodes: 不加密私钥
# -newkey rsa:2048: 生成 2048 位 RSA 密钥
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/privkey.pem" \
    -out "$SSL_DIR/fullchain.pem" \
    -subj "/C=CN/ST=Shanghai/L=Shanghai/O=Stellar Nexus Dev/CN=$DOMAIN" \
    -addext "subjectAltName=DNS:$DOMAIN,DNS:*.$DOMAIN,IP:127.0.0.1"

echo "✅ 证书已生成:"
echo "   - $SSL_DIR/privkey.pem"
echo "   - $SSL_DIR/fullchain.pem"
echo ""
echo "⚠️  自签名证书仅供本地验证，生产环境请使用 Let's Encrypt 或商业证书"
echo "   浏览器访问会提示证书不可信，使用 curl -k 跳过校验"
```

- [ ] **步骤 2：创建 scripts/sync-letsencrypt-certs.sh**

```bash
#!/usr/bin/env bash
# ============================================
# Let's Encrypt 证书同步脚本
# @description 将 certbot 续期后的证书同步到 nginx 读取的 ./ssl/ 目录
# @usage 作为 certbot renew 的 --deploy-hook 调用
#   或在 certbot 容器续期后手动执行
# ============================================

set -e

DOMAIN="${1:?用法: sync-letsencrypt-certs.sh <domain>}"
CERTBOT_CONF="${CERTBOT_CONF:-./certbot/conf}"
SSL_DIR="${SSL_DIR:-./ssl}"

LIVE_DIR="$CERTBOT_CONF/live/$DOMAIN"

if [ ! -d "$LIVE_DIR" ]; then
    echo "❌ 错误: 证书目录 $LIVE_DIR 不存在"
    echo "   请先通过 certbot 申请 $DOMAIN 的证书"
    exit 1
fi

mkdir -p "$SSL_DIR"

echo "🔄 同步 $DOMAIN 证书到 $SSL_DIR..."

# 复制证书（cp 而非 ln，因为 Docker 挂载的软链可能跨文件系统失效）
cp -f "$LIVE_DIR/fullchain.pem" "$SSL_DIR/fullchain.pem"
cp -f "$LIVE_DIR/privkey.pem" "$SSL_DIR/privkey.pem"

# 设置权限（私钥仅 owner 可读）
chmod 644 "$SSL_DIR/fullchain.pem"
chmod 600 "$SSL_DIR/privkey.pem"

echo "✅ 证书已同步"
echo "   - $SSL_DIR/fullchain.pem"
echo "   - $SSL_DIR/privkey.pem"
echo ""
echo "👉 请重载 nginx 使新证书生效:"
echo "   docker compose exec nginx nginx -s reload"
```

- [ ] **步骤 3：设置脚本可执行权限**

运行：
```bash
chmod +x scripts/generate-self-signed-cert.sh scripts/sync-letsencrypt-certs.sh
```

- [ ] **步骤 4：验证自签名证书生成脚本（在 Git Bash 或 WSL 中）**

运行：
```bash
bash scripts/generate-self-signed-cert.sh localhost
ls -la ssl/
```
预期：
- `ssl/privkey.pem` 与 `ssl/fullchain.pem` 存在
- 输出包含 `✅ 证书已生成`

- [ ] **步骤 5：验证证书内容**

运行：
```bash
openssl x509 -in ssl/fullchain.pem -text -noout | head -20
```
预期：包含 `Subject: C=CN, ST=Shanghai, L=Shanghai, O=Stellar Nexus Dev, CN=localhost` 与 `Subject Alternative Name`。

- [ ] **步骤 6：Commit**

```bash
git add scripts/generate-self-signed-cert.sh scripts/sync-letsencrypt-certs.sh
git commit -m "feat(config): 新增 SSL 证书生成与同步脚本

- generate-self-signed-cert.sh: 本地验证用自签名证书生成（支持域名参数）
- sync-letsencrypt-certs.sh: Let's Encrypt 续期后同步证书到 nginx 路径
- 两脚本均含完整错误处理与使用说明"
```

---

## 任务 7：文档同步（P2-1 + P2-2）

**文件：**
- 修改：`docs/guides/DEPLOYMENT.md`
- 创建：`docs/observability/METRICS.md`
- 删除：`docker-entrypoint.sh`（不再使用）

**目标：** 同步部署文档与实际架构；新增 Prometheus 监控接入说明；清理过期的 entrypoint 脚本。

- [ ] **步骤 1：删除不再使用的 docker-entrypoint.sh**

运行：
```bash
git rm docker-entrypoint.sh
```

- [ ] **步骤 2：替换 docs/guides/DEPLOYMENT.md 全部内容**

```markdown
# 部署指南

> **项目**: Star Citizen 战队宣传网站
> **更新日期**: 2026-07-25
> **版本**: v1.3.1

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
│                  └──────────┘                               │
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
| `WS_PORT` | `3003` | WebSocket 端口 |
| `LOG_LEVEL` | `info` | 日志级别 |
| `LOG_FILE_ENABLED` | `true` | 是否启用文件日志 |

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
git clone https://github.com/MomoDaviluke/star-citizen-promotion.git
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
```

- [ ] **步骤 3：创建 docs/observability/METRICS.md**

```markdown
# Prometheus 指标接入

> **更新日期**: 2026-07-25
> **适用版本**: v1.3.1+

---

## 概述

后端通过 `prom-client` 暴露 Prometheus 格式的 `/metrics` 端点，提供 HTTP 请求、内存使用、连接池等指标。

## 端点信息

| 端点 | 用途 | 访问控制 |
|:---|:---|:---|
| `GET /metrics` | Prometheus exposition 格式 | IP 白名单（`METRICS_ALLOWED_IPS`） |

## 配置

通过环境变量控制：

| 变量 | 默认值 | 说明 |
|:---|:---|:---|
| `METRICS_ENABLED` | `true` | 是否启用 /metrics 端点 |
| `METRICS_ALLOWED_IPS` | `127.0.0.1,::1` | 允许访问的 IP，支持 CIDR，逗号分隔 |

### 启用远程访问

```bash
# 在 .env 中添加
METRICS_ENABLED=true
METRICS_ALLOWED_IPS=127.0.0.1,::1,10.0.0.0/8,172.16.0.0/12
```

## 暴露的指标

### HTTP 请求指标

| 指标 | 类型 | 标签 | 说明 |
|:---|:---|:---|:---|
| `http_requests_total` | Counter | `method`, `route`, `status` | HTTP 请求总数 |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status` | 请求耗时分布 |

### 系统指标（prom-client 默认）

| 指标 | 类型 | 说明 |
|:---|:---|:---|
| `process_cpu_seconds_total` | Counter | 进程 CPU 使用时间 |
| `process_resident_memory_bytes` | Gauge | 进程驻留内存 |
| `nodejs_eventloop_lag_seconds` | Gauge | 事件循环延迟 |
| `nodejs_active_handles_total` | Gauge | 活动句柄数 |
| `nodejs_active_requests_total` | Gauge | 活动请求数 |

### 自定义指标

| 指标 | 类型 | 标签 | 说明 |
|:---|:---|:---|:---|
| `db_pool_active_connections` | Gauge | — | 数据库活跃连接数 |
| `db_pool_idle_connections` | Gauge | — | 数据库空闲连接数 |
| `db_pool_total_connections` | Gauge | — | 数据库总连接数 |

## Prometheus 接入

### scrape_config 示例

```yaml
scrape_configs:
  - job_name: 'star-citizen-backend'
    scrape_interval: 15s
    scrape_timeout: 10s
    metrics_path: '/metrics'
    static_configs:
      - targets: ['backend:3001']
        # 如果 Prometheus 在 Docker 网络外，使用宿主机 IP
        # targets: ['host.docker.internal:3001']
```

### Docker Compose 中部署 Prometheus

```yaml
# 添加到 docker-compose.yml
prometheus:
  image: prom/prometheus:latest
  restart: unless-stopped
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
    - prometheus_data:/prometheus
  networks:
    - default
  profiles: ["production"]
```

### 验证指标输出

```bash
# 通过 nginx 访问（需在 METRICS_ALLOWED_IPS 中添加客户端 IP）
curl -k https://localhost/metrics

# 直接访问后端容器
docker compose exec backend wget -qO- http://localhost:3001/metrics | head -20
```

## Grafana Dashboard

推荐面板配置：

1. **HTTP 概览**：QPS、P95/P99 延迟、错误率（按路由分组）
2. **系统资源**：CPU、内存、事件循环延迟
3. **数据库连接池**：活跃/空闲/总连接数趋势
4. **RUM（前端）**：LCP/CLS/INP 分布（通过 `/api/rum/metrics` 聚合）

### 推荐 Grafana 面板 ID

- Node.js 应用概览：`11159`（官方 Node.js dashboard）
- MySQL 概览：`7362`（需额外部署 mysql_exporter）

## 安全注意事项

- **生产环境**：`METRICS_ALLOWED_IPS` 仅允许 Prometheus 服务器 IP
- **不要**将 `/metrics` 暴露到公网
- 如果通过 nginx 暴露，需在 nginx 配置中限制访问：

```nginx
location /metrics {
    proxy_pass http://backend/metrics;
    allow 10.0.0.0/8;  # Prometheus 服务器 IP 段
    deny all;
}
```
```

- [ ] **步骤 4：Commit**

```bash
git add docs/guides/DEPLOYMENT.md docs/observability/METRICS.md
git rm docker-entrypoint.sh
git commit -m "docs: 同步 DEPLOYMENT.md 架构变更与新增 METRICS.md 监控接入说明

- DEPLOYMENT.md: 新增架构图、migrate 服务说明、新 backup 命令、envsubst 用法
- DEPLOYMENT.md: 更新环境变量清单、SSL 证书管理、日志管理章节
- METRICS.md: Prometheus /metrics 端点说明、scrape_config 示例、Grafana 推荐面板
- 删除 docker-entrypoint.sh（改用独立 migrate 服务）"
```

---

## 任务 8：端到端验证

**文件：** 无（仅运行验证命令）

**目标：** 验证完整生产栈能一键启动并通过所有验收标准。

- [ ] **步骤 1：准备测试环境变量**

运行（PowerShell 兼容）：
```bash
# 复制模板
cp .env.production.example .env

# 生成强密钥
# Windows PowerShell 用户：
# $jwt = -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 64 | % {[char]$_})
# $dbpw = -join ((48..57)+(97..122) | Get-Random -Count 32 | % {[char]$_})
# 然后手动写入 .env

# Git Bash / WSL 用户：
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 32)|" .env
sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$(openssl rand -hex 16)|" .env
sed -i "s|^DB_ROOT_PASSWORD=.*|DB_ROOT_PASSWORD=$(openssl rand -hex 16)|" .env
```

- [ ] **步骤 2：生成自签名证书**

运行：
```bash
bash scripts/generate-self-signed-cert.sh localhost
```
预期：`ssl/fullchain.pem` 与 `ssl/privkey.pem` 生成。

- [ ] **步骤 3：构建所有镜像**

运行：
```bash
docker compose --profile production build
```
预期：4 个镜像（backend、migrate 复用 backend-builder、nginx、backup）全部构建成功。

- [ ] **步骤 4：验证镜像构建产物**

运行：
```bash
# 验证 backend 无 dev 依赖
docker run --rm star-citizen-promotion-backend sh -c \
    "cd /app/server && npm ls --omit=dev --all 2>&1 | grep -E 'typescript|jest|supertest|tsx|eslint|@types' && echo 'FAIL' || echo 'PASS'"

# 验证 nginx 包含前端产物
docker run --rm star-citizen-promotion-nginx ls /usr/share/nginx/html/index.html

# 验证 backup 包含脚本
docker run --rm star-citizen-promotion-backup ls -la /backup/backup.sh /etc/crontabs/root
```
预期：全部输出 PASS 或文件存在。

- [ ] **步骤 5：启动完整生产栈**

运行：
```bash
docker compose --profile production up -d
```
预期：6 个服务全部启动。

- [ ] **步骤 6：等待服务就绪**

运行：
```bash
# 等待 mysql 健康（约 20-30s）
docker compose ps
# 期望 mysql: Up (healthy), migrate: exited (0), backend: Up (healthy)
# nginx/backup/certbot: Up
```
预期：migrate 容器 `exited (0)`，backend 与 mysql `Up (healthy)`。

- [ ] **步骤 7：验证 migrate 执行成功**

运行：
```bash
docker compose logs migrate | tail -20
```
预期：包含 `✅ 数据库 'star_citizen_promotion' 已创建或已存在` 与表创建日志，无错误。

- [ ] **步骤 8：验证健康检查端点**

运行：
```bash
curl -k https://localhost/health/live
# 期望: {"status":"ok"}

curl -k https://localhost/health/ready
# 期望: 200 + 状态

curl -k https://localhost/health
# 期望: 200 + database: true
```
预期：三个端点均返回 200。

- [ ] **步骤 9：API 冒烟测试**

运行：
```bash
curl -k https://localhost/api/fleet
curl -k https://localhost/api/stats
curl -k https://localhost/api/members
```
预期：均返回 200 + JSON。

- [ ] **步骤 10：验证前端首页**

运行：
```bash
curl -k https://localhost/ | head -5
```
预期：返回 200 + HTML（包含 `<div id="app">` 或 Vue 标记）。

- [ ] **步骤 11：验证 HTTPS 重定向**

运行：
```bash
curl -I http://localhost/
```
预期：`301 Moved Permanently` + `Location: https://localhost/`。

- [ ] **步骤 12：验证静态资源缓存头**

运行：
```bash
# 获取一个哈希命名的 JS 文件
JS_FILE=$(curl -k https://localhost/ | grep -oE '/assets/[^"]+\.js' | head -1)
curl -k -I "https://localhost$JS_FILE" | grep -E "Cache-Control|expires"
```
预期：包含 `Cache-Control: public, immutable` 与 `expires` 头。

- [ ] **步骤 13：验证安全响应头**

运行：
```bash
curl -k -I https://localhost/ | grep -E "X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security|Content-Security-Policy|Referrer-Policy"
```
预期：5 个安全头均存在。

- [ ] **步骤 14：验证 backup 服务正常运行**

运行：
```bash
# 查看 backup 容器状态
docker compose ps backup

# 触发一次手动备份
docker compose exec backup /backup/backup.sh

# 验证备份文件生成
ls -la backups/
```
预期：`backups/` 下有 `backup_YYYYMMDD_HHMMSS.sql.gz` 文件。

- [ ] **步骤 15：前后端单测不退化验证**

运行（在另一个终端或宿主机）：
```bash
# 前端构建
npm run build

# 前端测试
npm test

# 后端类型检查与测试
cd server
npm run typecheck
npm test
cd ..
```
预期：全部通过，无新增错误。

- [ ] **步骤 16：清理测试环境**

运行：
```bash
# 停止并删除容器（保留 volumes）
docker compose --profile production down

# 如需彻底清理（含数据库数据）
# docker compose --profile production down -v
```

- [ ] **步骤 17：更新项目记忆**

更新 `project_memory.md`：
- 「当前阶段」改为「部署就绪度修复完成，已通过端到端验证」
- 「Architecture Decisions」表格新增 6 行（D1-D6）
- 「Change Log」表格新增本次所有变更

- [ ] **步骤 18：最终 Commit（记忆更新）**

```bash
git add docs/superpowers/plans/2026-07-25-deployment-readiness-fix.md
# 提交实现计划文档
git commit -m "docs: 新增部署就绪度修复实现计划

包含 8 个任务、细分步骤、验证命令与提交策略
对应规格: docs/superpowers/specs/2026-07-25-deployment-readiness-fix-design.md"
```

---

## 自检

### 1. 规格覆盖度检查

| 规格章节 | 对应任务 | 覆盖 |
|---|---|:---:|
| P0-1 backend target 修正 + Dockerfile 重构 | 任务 2 | ✅ |
| P0-2 独立 migrate 服务 | 任务 5 | ✅ |
| P0-3 nginx multi-stage 自构建 | 任务 4 | ✅ |
| P0-4 backup 服务实现 | 任务 3 | ✅ |
| P1-1 nginx.conf 增强 | 任务 4 | ✅ |
| P1-2 logging driver 限制 | 任务 5 | ✅ |
| P1-3 环境变量同步 | 任务 5 | ✅ |
| P1-4 SSL 路径统一 | 任务 5 + 任务 6 | ✅ |
| P2-1 文档同步 | 任务 7 | ✅ |
| P2-2 监控接入说明 | 任务 7 | ✅ |
| 验收标准 1-8 | 任务 8 | ✅ |

### 2. 占位符扫描

✅ 无 "TODO" / "待定" / "后续实现" 等占位符
✅ 所有代码步骤包含完整代码块
✅ 所有命令包含预期输出

### 3. 类型一致性

- `SERVER_NAME` 在 nginx.conf.tmpl / docker-compose.yml / .env.production.example 中一致
- `RETENTION_DAYS` 在 backup/backup.sh / docker-compose.yml 中一致
- `BACKUP_DIR` 在 backup/backup.sh 中一致
- migrate 服务 `command: ["node", "dist/database/migrate.js"]` 与 Dockerfile 复制路径一致
- nginx 服务 `Dockerfile.nginx` 与 docker-compose.yml `dockerfile: Dockerfile.nginx` 一致

### 4. 风险点

- **Windows PowerShell 环境**：`sed -i` 与 `bash` 命令可能不兼容，已在任务 8 步骤 1 提供 PowerShell 替代方案
- **envsubst 可用性**：`nginx:alpine` 镜像默认包含 envsubst，无需额外安装
- **migrate 失败传播**：`depends_on: service_completed_successfully` 确保 backend 不会在 migrate 失败时启动

---

## 执行交接

计划已完成并保存到 `docs/superpowers/plans/2026-07-25-deployment-readiness-fix.md`。两种执行方式：

**1. 子代理驱动（推荐）** - 每个任务调度一个新的子代理，任务间进行审查，快速迭代

**2. 内联执行** - 在当前会话中使用 executing-plans 执行任务，批量执行并设有检查点

选哪种方式？
