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
