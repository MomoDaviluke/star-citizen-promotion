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

# 安装 serve 用于静态文件服务
RUN npm install -g serve

# 复制前端构建产物
COPY --from=frontend-builder /app/dist ./dist

# 复制后端代码
COPY --from=backend-builder /app/server ./server

# 创建数据目录
RUN mkdir -p /app/server/data

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 暴露端口
EXPOSE 3001 3000

# 启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]
