# 部署就绪度修复设计

> **日期**: 2026-07-25
> **状态**: 待审查
> **范围**: P0 阻塞 + P1 重要 + P2 优化（全量修复）

---

## 1. 背景

部署前就绪度审查发现 13 项问题：4 项阻塞上线（target 错误、迁移缺失、nginx 架构混乱、backup 空循环），5 项重要（nginx.conf 安全/性能、logging driver、env 同步、SSL 路径），4 项优化（文档不一致、监控接入说明）。

当前 `docker compose --profile production up -d` 无法跑通：backend 镜像包含 dev 依赖、数据库无 schema、nginx 找不到前端产物、backup 不执行真实备份。

## 2. 目标

- `docker compose --profile production up -d` 一键启动完整生产栈（nginx + backend + mysql + migrate + backup + certbot）
- 自签名证书可跑通 HTTPS 全链路
- 健康检查通过、关键 API 返回正常
- 文档与实际架构一致

## 3. 不在本次范围

- L3 浸泡压测 / L5 端到端压测（已记入 project_memory）
- Playwright e2e 实际运行（保留为后续验证）
- Prometheus 实际部署与告警规则（仅文档化接入方式）
- 真实域名 + Let's Encrypt 实际申请（文档化流程，验证用自签名）

## 4. 架构决策

| ID | 决策 | 备选 | 理由 |
|---|---|---|---|
| D1 | backend 服务删除 `target` 字段，使用 production 阶段 | 用 backend-builder | production 阶段镜像最小化，且通过重新 `npm ci --omit=dev` 确保无 dev 依赖 |
| D2 | 新增独立 `migrate` 一次性服务，backend `depends_on: migrate: service_completed_successfully` | entrypoint.sh 内联迁移 | 隔离清晰，迁移失败不会让 backend 反复崩溃重启，日志可独立查看 |
| D3 | nginx 服务通过 multi-stage build 自带前端 dist 产物，删除本地 `./dist` 挂载 | 保持本地挂载 | 容器自包含，无需宿主机预构建，避免本地 dist 过时 |
| D4 | backup 服务用 `alpine:3.19` + busybox crond + mysqldump 脚本 | mysql:8.0 + cron / databack/mysql-backup | 镜像轻量（~10MB），完全可控，无第三方依赖 |
| D5 | nginx.conf 用 envsubst 在 entrypoint 替换 `${SERVER_NAME}` / `${USE_HTTPS}` | 硬编码 localhost / 复杂模板渲染 | 支持本地自签名验证 + 生产域名参数化，单一机制覆盖两种场景 |
| D6 | SSL 验证用自签名证书，DEPLOYMENT.md 文档化 Let's Encrypt 流程 | envsubst HTTP-only 模式 | 验证完整 HTTPS 链路；生产接入仅按文档操作 |

## 5. 详细修复清单

### P0 阻塞项

#### P0-1 backend target 修正 + Dockerfile 重构

**Dockerfile** 调整 production 阶段：

```dockerfile
FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache wget ca-certificates && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 仅复制 package.json，重新安装生产依赖（避免拷贝 builder 的 dev deps）
COPY --from=backend-builder /app/server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev --ignore-scripts
WORKDIR /app

# 复制编译产物
COPY --from=backend-builder /app/server/dist ./server/dist
COPY --from=backend-builder /app/server/migrations ./server/migrations
COPY --from=backend-builder /app/server/knexfile.js ./server/knexfile.js

# 前端构建产物（供 nginx 服务通过 multi-stage 引用，也支持 backend 直接 serve）
COPY --from=frontend-builder /app/dist ./dist

RUN mkdir -p /app/server/data /app/logs && \
    chown -R nodejs:nodejs /app

USER nodejs
ENV NODE_ENV=production PORT=3001 STATIC_FILES_PATH=/app/dist
ENV LOG_FILE_ENABLED=true LOG_FILE_ERROR=/app/logs/error.log LOG_FILE_COMBINED=/app/logs/combined.log

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://localhost:3001/health/live || exit 1
CMD ["node", "server/dist/index.js"]
```

**docker-compose.yml** backend 服务删除 `target` 字段。

#### P0-2 独立 migrate 服务

```yaml
migrate:
  build:
    context: .
    dockerfile: Dockerfile
    target: backend-builder   # 用 builder 阶段（含 tsx 临时迁移工具）
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
  command: ["node", "dist/database/migrate.js"]
  restart: "no"
  profiles: ["default", "production"]
```

backend 服务添加：

```yaml
depends_on:
  mysql:
    condition: service_healthy
  migrate:
    condition: service_completed_successfully
```

#### P0-3 nginx 服务 multi-stage 自构建

新增 `Dockerfile.nginx`（独立 Dockerfile，专用 nginx 镜像）：

```dockerfile
# 阶段 1：复用主 Dockerfile 的 frontend-builder 阶段产物
FROM frontend-builder AS frontend

# 阶段 2：nginx + 前端产物 + 模板
FROM nginx:alpine

# nginx:alpine 已内置 20-envsubst-on-templates.sh，会自动渲染 /etc/nginx/templates/*.template
# 但我们的模板是完整 nginx.conf（含 events/http），需覆盖默认主配置
# 通过自定义 entrypoint 脚本渲染到 /etc/nginx/nginx.conf
COPY nginx-entrypoint.sh /docker-entrypoint.d/40-render-nginx-conf.sh
COPY nginx.conf.tmpl /etc/nginx/templates/nginx.conf.tmpl

# 从 frontend-builder 阶段复制前端构建产物
COPY --from=frontend /app/dist /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.d/40-render-nginx-conf.sh
```

> **注**：`COPY --from=frontend-builder` 要求 frontend-builder 是主 `Dockerfile` 中已命名的构建阶段。Docker Compose 构建时同上下文的 Dockerfile 共享构建缓存，frontend-builder 阶段会被复用，不会重复构建。

**docker-compose.yml** nginx 服务：

```yaml
nginx:
  build:
    context: .
    dockerfile: Dockerfile.nginx
  ports:
    - "80:80"
    - "443:443"
  environment:
    - SERVER_NAME=${SERVER_NAME:-localhost}
    - USE_HTTPS=${USE_HTTPS:-true}
  volumes:
    - ./ssl:/etc/nginx/ssl:ro
    - ./certbot/www:/var/www/certbot:ro
    - ./certbot/conf:/etc/letsencrypt:ro
  depends_on:
    backend:
      condition: service_healthy
  profiles: ["production"]
```

#### P0-4 backup 服务实现

新增 `backup/` 目录：

```
backup/
├── Dockerfile              # 基于 alpine:3.19 + mysql-client + busybox crond
├── backup.sh               # mysqldump + gzip + 30 天清理
└── crontab                 # 0 3 * * * /backup/backup.sh
```

`backup/Dockerfile`：

```dockerfile
FROM alpine:3.19
RUN apk add --no-cache mysql-client busybox-suid gzip findutils
COPY backup.sh /backup/backup.sh
COPY crontab /etc/crontabs/root
RUN chmod +x /backup/backup.sh
CMD ["crond", "-f", "-l", "8"]
```

`backup/backup.sh`：mysqldump --single-transaction → gzip → /backups/backup_YYYYMMDD_HHMMSS.sql.gz → find -mtime +30 -delete。

**docker-compose.yml** backup 服务：

```yaml
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
  volumes:
    - ./backups:/backups
  depends_on:
    mysql:
      condition: service_healthy
  profiles: ["production"]
```

### P1 重要项

#### P1-1 nginx.conf 增强

```nginx
worker_processes auto;
worker_rlimit_nofile 65535;
events { worker_connections 4096; }

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    server_tokens off;                    # 隐藏版本号
    client_max_body_size 16m;             # 允许上传
    sendfile on; tcp_nopush on; tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # gzip 配置（保持现有，增加 application/wasm）
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml application/wasm;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" rt=$request_time';
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    upstream backend { server backend:3001; keepalive 32; }

    # envsubst 替换变量：${SERVER_NAME}, ${USE_HTTPS}
    server {
        listen 80;
        server_name ${SERVER_NAME};
        location /.well-known/acme-challenge/ { root /var/www/certbot; }
        location / { return 301 https://$host$request_uri; }
    }

    server {
        listen 443 ssl http2;
        server_name ${SERVER_NAME};

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_ecdh_curve X25519:secp384r1;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;
        ssl_session_tickets off;

        # 完整安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
        add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' ws: wss:; frame-src 'none'; object-src 'none'" always;

        # 前端
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
        }

        # API
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }

        # 健康检查（live/ready/综合）
        location = /health { proxy_pass http://backend/health; }
        location = /health/live { proxy_pass http://backend/health/live; }
        location = /health/ready { proxy_pass http://backend/health/ready; }

        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|avif|webp)$ {
            expires 1y;
            add_header Cache-Control "public, immutable" always;
            # 重复安全头防丢失
            add_header X-Frame-Options "SAMEORIGIN" always;
            add_header X-Content-Type-Options "nosniff" always;
            add_header Referrer-Policy "strict-origin-when-cross-origin" always;
            add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
            add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' ws: wss:; frame-src 'none'; object-src 'none'" always;
        }
    }
}
```

nginx 服务新增 entrypoint 脚本 `nginx-entrypoint.sh`，用 envsubst 渲染模板（覆盖默认主配置）：

```sh
#!/bin/sh
set -e
# 显式指定替换变量列表，避免 $host/$remote_addr 等 nginx 内置变量被误替换
envsubst '${SERVER_NAME} ${USE_HTTPS}' \
    < /etc/nginx/templates/nginx.conf.tmpl \
    > /etc/nginx/nginx.conf
# 不 exec nginx，让 nginx 官方镜像的 entrypoint 继续执行后续 30-tune-worker-processes.sh 等
```

> **注**：脚本放在 `/docker-entrypoint.d/` 会被 nginx 官方 entrypoint 自动调用（在主进程启动前）。这样既渲染了模板，又保留了 nginx 镜像的自动调优脚本。

#### P1-2 logging driver 限制

所有服务添加：

```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"
```

#### P1-3 环境变量同步

backend 服务完整透传：

```yaml
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
```

#### P1-4 SSL 路径统一

- `./ssl:/etc/nginx/ssl:ro` —— nginx 读自签名或预放证书
- `./certbot/conf:/etc/letsencrypt:ro` —— Let's Encrypt 续期后通过额外脚本同步到 `./ssl/`
- 新增 `scripts/sync-letsencrypt-certs.sh`，certbot renew hook 调用，复制 `./certbot/conf/live/$DOMAIN/*` → `./ssl/`
- DEPLOYMENT.md 文档化两条路径

### P2 优化项

#### P2-1 文档同步

- 更新 [DEPLOYMENT.md](file:///c:/Users/Administrator/Desktop/star-citizen-promotion/docs/guides/DEPLOYMENT.md)：架构图、migrate 服务说明、新 backup 命令、envsubst 用法
- 删除文档中"backup 服务每天凌晨 3 点执行"等与旧空 loop 不符的描述，替换为实际实现

#### P2-2 监控接入说明

新增 `docs/observability/METRICS.md`：

- `/metrics` 端点格式（Prometheus exposition）
- `METRICS_ALLOWED_IPS` 配置说明
- Prometheus scrape_config 示例
- Grafana dashboard 推荐面板（node_exporter + mysql_exporter + 自定义 RUM 面板）

## 6. 验收标准

部署验证（按用户选择的"构建 + 健康检查 + API 冒烟"级别）：

1. **镜像构建**
   - `docker compose --profile production build` 全部成功
   - backend 镜像 `node_modules` 不含 dev 依赖：
     ```bash
     docker run --rm star-citizen-promotion-backend sh -c \
       "cd /app/server && npm ls --omit=dev --all 2>&1 | grep -E '^(├──|└──).*(typescript|jest|supertest|tsx|eslint|@types)' && exit 1 || exit 0"
     ```
     （输出为空表示无 dev 依赖残留）
   - nginx 镜像包含 `/usr/share/nginx/html/index.html`
   - backup 镜像包含 `/backup/backup.sh` 与 `/etc/crontabs/root`

2. **服务启动**
   - `docker compose --profile production up -d` 全部 `Up (healthy)`
   - migrate 容器 exited 0
   - 自签名证书存在 `./ssl/fullchain.pem` + `./ssl/privkey.pem`

3. **健康检查**
   - `curl -k https://localhost/health/live` → 200 `{"status":"ok"}`
   - `curl -k https://localhost/health/ready` → 200
   - `curl -k https://localhost/health` → 200 含 database: true

4. **API 冒烟**
   - `curl -k https://localhost/api/fleet` → 200 + JSON
   - `curl -k https://localhost/api/stats` → 200 + JSON
   - `curl -k https://localhost/api/members` → 200 + JSON
   - `curl -k https://localhost/` → 200 + HTML（首页）

5. **HTTPS 重定向**
   - `curl -I http://localhost` → 301 → https://localhost/

6. **静态资源缓存头**
   - `curl -k -I https://localhost/index.html` → 200
   - `curl -k -I https://localhost/assets/*.js` → 200 + `Cache-Control: public, immutable`

7. **CORS / 安全头**
   - 响应包含 X-Frame-Options / X-Content-Type-Options / Strict-Transport-Security / Content-Security-Policy

8. **前后端单测不退化**
   - 前端 `npm run build` 通过
   - 后端 `npm run typecheck` + `npm test` 通过

## 7. 风险与缓解

| 风险 | 缓解 |
|---|---|
| migrate 服务失败导致整个栈无法启动 | `restart: "no"` + 日志可独立查看 + backend 不会反复崩溃 |
| 自签名证书浏览器告警 | 文档说明，验证用 `curl -k` 跳过校验 |
| backup 镜像首次构建慢 | alpine 基础镜像小，mysql-client 包不大，<30s |
| envsubst 语法与 nginx 变量冲突 | 显式指定替换变量列表 `envsubst '${SERVER_NAME} ${USE_HTTPS}'`，不影响 `$host` `$remote_addr` 等 |
| Dockerfile 重构导致构建产物路径变化 | 严格按多阶段引用路径，构建后立即验证镜像内文件存在 |

## 8. 提交策略

按 scope 分批 commit（遵循 [commit_convention.md](file:///c:/Users/Administrator/Desktop/star-citizen-promotion/.trae/rules/commit_convention.md)）：

1. `fix(config): 修正 Dockerfile production 阶段依赖裁剪` — Dockerfile
2. `feat(config): 新增独立 migrate 服务与 backup 服务实现` — docker-compose.yml + backup/
3. `feat(config): nginx multi-stage 自构建前端产物` — Dockerfile.nginx + nginx-entrypoint.sh
4. `refactor(config): nginx.conf 增强安全/性能参数与 envsubst 模板化` — nginx.conf + .tmpl
5. `fix(config): docker-compose 透传完整环境变量与 logging driver 限制` — docker-compose.yml
6. `docs: 同步 DEPLOYMENT.md 与新增 METRICS.md 监控接入说明` — docs/

每个 commit 后跑 `docker compose config` 验证配置语法。
