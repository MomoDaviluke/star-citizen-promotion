#!/bin/sh
set -e

# ============================================
# Docker 容器启动入口脚本
# @description 启动后端服务，提供健康检查与优雅关闭
#              与 Dockerfile 的多阶段构建流程保持一致
# ============================================

# 信号处理：优雅关闭
BACKEND_PID=""

cleanup() {
  echo "🛑 收到终止信号，正在优雅关闭..."

  if [ -n "$BACKEND_PID" ]; then
    kill -TERM "$BACKEND_PID" 2>/dev/null || true

    # 等待进程退出，最多 30 秒
    timeout=30
    while [ $timeout -gt 0 ] && kill -0 "$BACKEND_PID" 2>/dev/null; do
      sleep 1
      timeout=$((timeout - 1))
    done

    # 超时后强制终止
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
      echo "⚠️ 进程未在超时内退出，强制终止"
      kill -KILL "$BACKEND_PID" 2>/dev/null || true
    fi
  fi

  echo "✅ 服务已关闭"
  exit 0
}

trap cleanup TERM INT QUIT

# 运行数据库迁移（使用编译后的产物）
if [ -f /app/server/dist/database/migrate.js ]; then
  echo "🔄 运行数据库迁移..."
  cd /app/server
  node dist/database/migrate.js || echo "⚠️ 数据库迁移失败，继续启动"
fi

# 启动后端服务（使用编译后的产物）
echo "🚀 启动后端服务..."
cd /app/server
node dist/index.js &
BACKEND_PID=$!

# 等待后端进程结束
wait "$BACKEND_PID"
