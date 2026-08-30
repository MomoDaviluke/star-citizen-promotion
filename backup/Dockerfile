# ============================================
# MySQL 备份服务镜像
# @description alpine + busybox crond + mysqldump
# 每天定时备份并清理过期文件
# ============================================

FROM alpine:3.19

LABEL maintainer="star-citizen-team"
LABEL description="MySQL automated backup service"

# 安装依赖
# - mysql-client: 提供 mysqldump
# - busybox-suid: 提供 crond（需要 suid 权限切换用户）
# - gzip: 压缩备份文件
# - findutils: find 命令的完整版（支持 -mtime）
# - tzdata: 时区数据，确保 cron 按正确时区执行
RUN apk add --no-cache \
    mysql-client \
    busybox-suid \
    gzip \
    findutils \
    tzdata

# 设置时区（默认 Asia/Shanghai，可通过 TZ 环境变量覆盖）
ENV TZ=Asia/Shanghai
RUN cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 复制备份脚本与 cron 配置
COPY backup.sh /backup/backup.sh
COPY crontab /etc/crontabs/root

# 创建日志目录与备份目录（备份目录由 volume 挂载，此处仅占位）
RUN mkdir -p /backup /var/log && \
    chmod +x /backup/backup.sh && \
    chmod 600 /etc/crontabs/root

# 启动 crond（前台运行，-l 8 输出 INFO 级日志到 stderr）
CMD ["crond", "-f", "-l", "8"]
