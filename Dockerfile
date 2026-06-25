# ============================================
# 多阶段构建 Dockerfile
# @description 优化镜像体积和构建效率
#   - frontend-builder: 构建前端静态资源
#   - backend-builder: 编译后端 TypeScript
#   - production: 最小化生产镜像
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

# 复制生产环境依赖（仅 package.json 中 dependencies）
COPY --from=backend-builder /app/server/package*.json ./server/
COPY --from=backend-builder /app/server/node_modules ./server/node_modules

# 复制编译后的后端代码
COPY --from=backend-builder /app/server/dist ./server/dist

# 复制前端构建产物
COPY --from=frontend-builder /app/dist ./dist

# 创建数据目录并设置权限
RUN mkdir -p /app/server/data /app/logs && \
    chown -R nodejs:nodejs /app

# 切换到非 root 用户运行，提升安全性
USER nodejs

# 设置环境变量
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

# 启动命令：直接运行编译后的 JS（无需 entrypoint 脚本）
CMD ["node", "server/dist/index.js"]
