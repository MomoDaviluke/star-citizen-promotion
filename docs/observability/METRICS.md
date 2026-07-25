# Prometheus 指标接入

> **更新日期**: 2026-07-25
> **适用版本**: v1.3.1+

---

## 概述

后端通过 `prom-client` 暴露 Prometheus 格式的 `/metrics` 端点，提供 HTTP 请求、内存使用、连接池等指标。

## 端点信息

| 端点 | 用途 | 访问控制 |
|:---|:---|:---|
| `GET /metrics` | Prometheus exposition 格式 | IP 白名单（`METRICS_ALLOWED_IPS`） |

## 配置

通过环境变量控制：

| 变量 | 默认值 | 说明 |
|:---|:---|:---|
| `METRICS_ENABLED` | `true` | 是否启用 /metrics 端点 |
| `METRICS_ALLOWED_IPS` | `127.0.0.1,::1` | 允许访问的 IP，支持 CIDR，逗号分隔 |

### 启用远程访问

```bash
# 在 .env 中添加
METRICS_ENABLED=true
METRICS_ALLOWED_IPS=127.0.0.1,::1,10.0.0.0/8,172.16.0.0/12
```

## 暴露的指标

### HTTP 请求指标

| 指标 | 类型 | 标签 | 说明 |
|:---|:---|:---|:---|
| `http_requests_total` | Counter | `method`, `route`, `status` | HTTP 请求总数 |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status` | 请求耗时分布 |

### 系统指标（prom-client 默认）

| 指标 | 类型 | 说明 |
|:---|:---|:---|
| `process_cpu_seconds_total` | Counter | 进程 CPU 使用时间 |
| `process_resident_memory_bytes` | Gauge | 进程驻留内存 |
| `nodejs_eventloop_lag_seconds` | Gauge | 事件循环延迟 |
| `nodejs_active_handles_total` | Gauge | 活动句柄数 |
| `nodejs_active_requests_total` | Gauge | 活动请求数 |

### 自定义指标

| 指标 | 类型 | 标签 | 说明 |
|:---|:---|:---|:---|
| `db_pool_active_connections` | Gauge | — | 数据库活跃连接数 |
| `db_pool_idle_connections` | Gauge | — | 数据库空闲连接数 |
| `db_pool_total_connections` | Gauge | — | 数据库总连接数 |

## Prometheus 接入

### scrape_config 示例

```yaml
scrape_configs:
  - job_name: 'star-citizen-backend'
    scrape_interval: 15s
    scrape_timeout: 10s
    metrics_path: '/metrics'
    static_configs:
      - targets: ['backend:3001']
        # 如果 Prometheus 在 Docker 网络外，使用宿主机 IP
        # targets: ['host.docker.internal:3001']
```

### Docker Compose 中部署 Prometheus

```yaml
# 添加到 docker-compose.yml
prometheus:
  image: prom/prometheus:latest
  restart: unless-stopped
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
    - prometheus_data:/prometheus
  networks:
    - default
  profiles: ["production"]
```

### 验证指标输出

```bash
# 通过 nginx 访问（需在 METRICS_ALLOWED_IPS 中添加客户端 IP）
curl -k https://localhost/metrics

# 直接访问后端容器
docker compose exec backend wget -qO- http://localhost:3001/metrics | head -20
```

## Grafana Dashboard

推荐面板配置：

1. **HTTP 概览**：QPS、P95/P99 延迟、错误率（按路由分组）
2. **系统资源**：CPU、内存、事件循环延迟
3. **数据库连接池**：活跃/空闲/总连接数趋势
4. **RUM（前端）**：LCP/CLS/INP 分布（通过 `/api/rum/metrics` 聚合）

### 推荐 Grafana 面板 ID

- Node.js 应用概览：`11159`（官方 Node.js dashboard）
- MySQL 概览：`7362`（需额外部署 mysql_exporter）

## 安全注意事项

- **生产环境**：`METRICS_ALLOWED_IPS` 仅允许 Prometheus 服务器 IP
- **不要**将 `/metrics` 暴露到公网
- 如果通过 nginx 暴露，需在 nginx 配置中限制访问：

```nginx
location /metrics {
    proxy_pass http://backend/metrics;
    allow 10.0.0.0/8;  # Prometheus 服务器 IP 段
    deny all;
}
```
