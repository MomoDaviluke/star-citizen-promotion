#!/bin/sh
set -e

# 启动后端服务
cd /app/server
node src/index.js &

# 启动前端服务
cd /app
serve -s dist -l 3000 &

# 等待所有后台进程
wait
