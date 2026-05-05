# 前端构建阶段
FROM node:22-alpine AS frontend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 后端构建阶段
FROM node:22-alpine AS backend-builder

WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/ ./

# 生产阶段
FROM node:22-alpine AS production

WORKDIR /app

# 安装 wget 用于健康检查
RUN apk add --no-cache wget

# 复制后端代码
COPY --from=backend-builder /app/server ./server

# 复制前端构建产物
COPY --from=frontend-builder /app/dist ./dist

# 创建数据目录
RUN mkdir -p /app/server/data

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001
ENV STATIC_FILES_PATH=/app/dist

# 暴露端口（后端 API）
EXPOSE 3001

# 启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]
