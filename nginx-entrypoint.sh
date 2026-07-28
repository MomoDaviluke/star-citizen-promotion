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
