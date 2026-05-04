#!/bin/sh
set -e

# ============================================
# Docker 容器启动入口脚本
# @description 启动后端服务，提供健康检查与优雅关闭
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

# 运行数据库迁移（如果后端代码存在）
if [ -f /app/server/src/database/migrate.js ]; then
  echo "🔄 运行数据库迁移..."
  cd /app/server
  node src/database/migrate.js || echo "⚠️ 数据库迁移失败，继续启动"
fi

# 启动后端服务
echo "🚀 启动后端服务..."
cd /app/server
node src/index.js &
BACKEND_PID=$!

# 健康检查：等待后端就绪
echo "⏳ 等待后端服务就绪..."
max_retries=30
retry=0
while [ $retry -lt $max_retries ]; do
  if wget -q -O /dev/null "http://localhost:3001/health/live" 2>/dev/null; then
    echo "✅ 后端服务已就绪"
    break
  fi
  sleep 1
  retry=$((retry + 1))
done

if [ $retry -eq $max_retries ]; then
  echo "⚠️ 后端服务未在预期时间内就绪"
fi

echo "🎉 所有服务已启动"

# 等待后端进程（前端由 nginx 服务，不在此启动）
wait "$BACKEND_PID"
