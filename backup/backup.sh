#!/bin/sh
# ============================================
# MySQL 数据库备份脚本
# @description 执行 mysqldump，gzip 压缩，保留 30 天
# @usage 由 crond 每天 03:00 自动调用
# ============================================

set -e
set -o pipefail

# 环境变量校验
: "${DB_HOST:?DB_HOST must be set}"
: "${DB_USER:?DB_USER must be set}"
: "${DB_PASSWORD:?DB_PASSWORD must be set}"
: "${DB_NAME:?DB_NAME must be set}"
DB_PORT="${DB_PORT:-3306}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql.gz"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔄 开始备份数据库 $DB_NAME..."

# 执行 mysqldump 并 gzip 压缩
# --single-transaction: InnoDB 一致性快照，不锁表
# --routines --triggers: 包含存储过程和触发器
# 注：alpine mysql-client 实际为 mariadb-client，不支持 --set-gtid-purged=OFF
if mysqldump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password="$DB_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    "$DB_NAME" 2>/tmp/mysqldump_error.log | gzip > "$BACKUP_FILE"; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 备份成功: $BACKUP_FILE ($SIZE)"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ 备份失败:"
    cat /tmp/mysqldump_error.log >&2
    rm -f "$BACKUP_FILE"
    exit 1
fi

# 清理过期备份
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🧹 清理 $RETENTION_DAYS 天前的备份..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
REMAINING=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | wc -l)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📊 当前保留备份文件数: $REMAINING"
