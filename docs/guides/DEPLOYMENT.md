# 部署指南

> **项目**: Star Citizen 战队宣传网站
> **更新日期**: 2026-05-31
> **版本**: v1.3.1

---

## 部署方式概览

| 方式 | 适用场景 | 复杂度 | 推荐度 |
|:---|:---|:---|:---|
| Docker Compose | 生产环境、一键部署 | 低 | ⭐⭐⭐ |
| 手动部署 | 本地开发、调试 | 中 | ⭐⭐ |
| VPS 全手动 | 无 Docker 环境的服务器 | 高 | ⭐ |

---

## 方式一：Docker Compose 部署（推荐）

### 前置条件

| 依赖 | 最低版本 |
|:---|:---|
| Docker | 20.10+ |
| Docker Compose | 2.0+ |
| 可用内存 | ≥ 2GB |

### 快速启动（开发环境）

```bash
# 1. 克隆项目
git clone https://github.com/MomoDaviluke/star-citizen-promotion.git
cd star-citizen-promotion

# 2. 创建环境变量文件
cat > .env << 'EOF'
JWT_SECRET=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)
DB_ROOT_PASSWORD=$(openssl rand -hex 16)
DB_USER=app_user
DB_NAME=star_citizen_promotion
EOF

# 3. 启动服务（仅后端 + MySQL）
docker-compose up -d

# 4. 验证
curl http://localhost:3001/health
```

### 生产环境部署（含 Nginx + SSL）

```bash
# 1. 准备 SSL 证书
mkdir -p ssl certbot/www

# 方案 A：Let's Encrypt 免费证书
# 先临时使用 HTTP 配置启动 Nginx，再申请证书
docker run --rm -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot -d your-domain.com \
  --email your-email@example.com --agree-tos --no-eff-email

# 将证书复制到 ssl/ 目录
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/

# 方案 B：自签名证书（仅测试用）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem -out ssl/fullchain.pem \
  -subj "/CN=localhost"

# 2. 创建 .env 文件（务必使用强密钥）
cat > .env << EOF
JWT_SECRET=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)
DB_ROOT_PASSWORD=$(openssl rand -hex 16)
DB_USER=app_user
DB_NAME=star_citizen_promotion
EOF

# 3. 启动全部服务（含 Nginx）
docker-compose --profile production up -d

# 4. 验证
curl -k https://your-domain.com/health
```

### Docker Compose 服务说明

| 服务 | 端口 | Profile | 说明 |
|:---|:---|:---|:---|
| `backend` | 3001 | 默认 | 后端 API + 前端静态文件服务 |
| `mysql` | 127.0.0.1:3306 | 默认 | MySQL 8.0（仅本地访问） |
| `nginx` | 80, 443 | production | 反向代理 + SSL 终止 |
| `backup` | — | production | 数据库每日自动备份（保留 30 天） |
| `certbot` | — | production | SSL 证书自动续期（每 12 小时检查） |

### 数据持久化

| 卷 | 挂载路径 | 用途 |
|:---|:---|:---|
| `mysql_data` | `/var/lib/mysql` | 数据库数据 |
| `./server/data` | `/app/server/data` | 应用数据 |
| `./logs` | `/app/logs` | 应用日志 |

### 环境变量清单

**必填变量**（不设置则容器拒绝启动）：

| 变量 | 说明 |
|:---|:---|
| `JWT_SECRET` | JWT 签名密钥，至少 32 字符 |
| `DB_PASSWORD` | 数据库密码 |

**可选变量**（有默认值）：

| 变量 | 默认值 | 说明 |
|:---|:---|:---|
| `DB_HOST` | `mysql` | 数据库主机 |
| `DB_PORT` | `3306` | 数据库端口 |
| `DB_USER` | `app_user` | 数据库用户 |
| `DB_NAME` | `star_citizen_promotion` | 数据库名 |
| `DB_ROOT_PASSWORD` | 同 `DB_PASSWORD` | MySQL root 密码 |
| `DB_NAME` | `star_citizen_promotion` | 数据库名 |

### 数据库备份与恢复

生产环境自动备份服务每天凌晨 3 点执行，备份文件保存在 `backups/` 目录。

```bash
# 查看备份文件
ls -la backups/

# 恢复指定备份
gunzip < backups/backup_20260531_030000.sql.gz | \
  docker-compose exec -T mysql mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_NAME"

# 手动触发备份（不等待定时任务）
docker-compose exec backup sh -c 'mysqldump -h mysql -u root -p"$DB_ROOT_PASSWORD" --single-transaction --all-databases | gzip > /backups/manual_$(date +%Y%m%d_%H%M%S).sql.gz'
```

备份策略：单文件最大无限制，保留 30 天，超期自动清理。

### SSL 证书管理

**首次申请证书**：

```bash
# 确保 Nginx 已启动且 80 端口可访问
docker-compose --profile production up -d nginx

# 申请 Let's Encrypt 证书
docker-compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d your-domain.com \
  --email your@email.com \
  --agree-tos --no-eff-email

# 将证书复制到 Nginx 期望的路径
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/

# 重载 Nginx
docker-compose exec nginx nginx -s reload
```

证书续期由 certbot 容器自动处理（每 12 小时检查一次）。

---

## 方式二：手动部署

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
npm install
cd server && npm install && cd ..

# 2. 配置环境变量
cp .env.example .env.development
cp server/.env.example server/.env.development
# 编辑 server/.env.development，填入数据库连接信息和 JWT 密钥

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

手动部署时，需要自行配置 Nginx。核心配置参考项目内置的 `nginx.conf`：

```nginx
upstream backend {
    server 127.0.0.1:3001;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # 前端静态文件
    location / {
        root /path/to/star-citizen-promotion/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 代理
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400s;
    }

    # 健康检查
    location /health {
        proxy_pass http://backend/health;
    }
}
```

---

## 健康检查

项目提供三个健康检查端点：

| 端点 | 用途 | 响应 |
|:---|:---|:---|
| `GET /health/live` | 存活探针（Kubernetes liveness） | `{ "status": "ok" }` |
| `GET /health/ready` | 就绪探针（Kubernetes readiness） | 200 就绪 / 503 未就绪 |
| `GET /health` | 综合健康检查 | 数据库连接 + 内存使用 + 连接池状态 |

**综合健康检查响应示例**：

```json
{
  "status": "ok",
  "timestamp": "2026-05-31T10:00:00.000Z",
  "uptime": 86400,
  "checks": {
    "database": true,
    "memory": true,
    "poolStatus": {
      "active": 5,
      "idle": 15,
      "total": 20
    }
  }
}
```

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

## 证书续期（Let's Encrypt）

Let's Encrypt 证书有效期 90 天，需定期续期：

```bash
# 手动续期
docker run --rm -v $(pwd)/certbot/www:/var/www/certbot \
  -v $(pwd)/ssl:/etc/nginx/ssl \
  certbot/certbot renew

# 重载 Nginx 使新证书生效
docker-compose exec nginx nginx -s reload
```

建议配置 crontab 自动续期：

```bash
# 每月 1 号凌晨 3 点续期
0 3 1 * * cd /path/to/project && docker run --rm -v $(pwd)/certbot/www:/var/www/certbot certbot/certbot renew && docker-compose exec nginx nginx -s reload
```

---

## 常见部署问题

### Q: 容器启动后数据库连接失败？

MySQL 容器的健康检查通过后，后端才会启动（`depends_on: condition: service_healthy`）。如果仍然失败：

1. 检查 `.env` 中 `DB_PASSWORD` 是否正确
2. 确认 MySQL 容器日志：`docker-compose logs mysql`
3. 确认网络连通：`docker-compose exec backend wget -qO- http://mysql:3306`

### Q: Nginx 返回 502 Bad Gateway？

后端服务尚未就绪或已崩溃：

1. 检查后端日志：`docker-compose logs backend`
2. 确认健康检查：`curl http://localhost:3001/health`
3. 检查端口占用：`netstat -tlnp | grep 3001`

### Q: 前端页面刷新后 404？

Nginx 需要配置 SPA 路由回退。确认 `nginx.conf` 中有：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Q: WebSocket 连接不上？

确认 Nginx 配置了 WebSocket 代理头：

```nginx
location /ws {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```
