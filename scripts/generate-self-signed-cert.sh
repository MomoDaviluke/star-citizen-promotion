#!/usr/bin/env bash
# ============================================
# 自签名 SSL 证书生成脚本
# @description 生成本地验证用的自签名证书
# @usage ./scripts/generate-self-signed-cert.sh [domain]
# ============================================

set -e

DOMAIN="${1:-localhost}"
SSL_DIR="${SSL_DIR:-./ssl}"

mkdir -p "$SSL_DIR"

echo "🔐 为 $DOMAIN 生成自签名证书..."

# 生成自签名证书（365 天有效期）
# -nodes: 不加密私钥
# -newkey rsa:2048: 生成 2048 位 RSA 密钥
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/privkey.pem" \
    -out "$SSL_DIR/fullchain.pem" \
    -subj "/C=CN/ST=Shanghai/L=Shanghai/O=Stellar Nexus Dev/CN=$DOMAIN" \
    -addext "subjectAltName=DNS:$DOMAIN,DNS:*.$DOMAIN,IP:127.0.0.1"

echo "✅ 证书已生成:"
echo "   - $SSL_DIR/privkey.pem"
echo "   - $SSL_DIR/fullchain.pem"
echo ""
echo "⚠️  自签名证书仅供本地验证，生产环境请使用 Let's Encrypt 或商业证书"
echo "   浏览器访问会提示证书不可信，使用 curl -k 跳过校验"
