# 监控与可观测性

> **项目**: Star Citizen 战队宣传网站
> **更新日期**: 2026-05-31
> **版本**: v1.3.1

---

## 可观测性架构

```
┌─────────────────────────────────────────────────────────┐
│                      应用层                              │
│  Express 请求 → metrics 中间件 → 业务逻辑 → 响应         │
├─────────────────────────────────────────────────────────┤
│                      采集层                              │
│  Prometheus 指标 · Winston 日志 · 健康检查端点            │
├─────────────────────────────────────────────────────────┤
│                      存储/展示层                         │
│  Prometheus Server · 日志文件 · Grafana 仪表盘（计划）    │
└─────────────────────────────────────────────────────────┘
```

---

## 健康检查端点

| 端点 | 方法 | 用途 | 生产环境行为 |
|:---|:---|:---|:---|
| `/health/live` | GET | 存活探针（Kubernetes liveness） | 始终返回 `{ status: "ok" }` |
| `/health/ready` | GET | 就绪探针（Kubernetes readiness） | 仅返回状态码，不暴露内部详情 |
| `/health` | GET | 综合健康检查 | 仅返回状态码，不暴露内部详情 |
| `/metrics` | GET | Prometheus 指标抓取 | IP 白名单限制，未启用时返回 404 |

### 综合健康检查内容

```json
{
  "status": "ok",
  "timestamp": "2026-05-31T10:00:00.000Z",
  "uptime": 86400,
  "checks": {
    "database": true,
    "memory": true,
    "poolStatus": {
      "activeConnections": 5,
      "idleConnections": 15,
      "waitingRequests": 0,
      "totalConnections": 20,
      "connectionLimit": 20
    }
  }
}
```

| 检查项 | 判定逻辑 |
|:---|:---|
| `database` | 执行 `SELECT 1` 查询成功 |
| `memory` | heapUsed < heapTotal × 90% |
| `poolStatus` | 连接池状态快照 |

状态值：`"ok"`（全部通过）或 `"degraded"`（任一检查失败），HTTP 状态码 200 或 503。

---

## Prometheus 指标

### 指标端点

`GET /metrics` 返回 Prometheus 文本格式指标。

**生产环境安全**：
- 默认开启（`METRICS_ENABLED` 默认 `true`）
- 仅允许白名单 IP 访问（`METRICS_ALLOWED_IPS`，默认 `127.0.0.1, ::1`），支持 CIDR 网段
- 未授权访问返回 403
- 可通过 `METRICS_ENABLED=false` 完全关闭端点

### 应用指标

| 指标名 | 类型 | 说明 |
|:---|:---|:---|
| `http_request_duration_seconds` | Histogram | HTTP 请求处理时间（秒） |
| `http_requests_total` | Counter | HTTP 请求总数 |
| `active_connections` | Gauge | 当前活跃连接数 |

**Histogram 标签**：`method`（GET/POST/...）、`route`（路由路径）、`status_code`（HTTP 状态码）

**Bucket 分布**：0.01s、0.05s、0.1s、0.5s、1s、2s、5s

### 数据库连接池指标

| 指标名 | 类型 | 说明 |
|:---|:---|:---|
| `db_pool_total_connections` | Gauge | 连接池总连接数 |
| `db_pool_active_connections` | Gauge | 活跃连接数 |
| `db_pool_idle_connections` | Gauge | 空闲连接数 |
| `db_pool_waiting_requests` | Gauge | 等待获取连接的请求数 |
| `db_pool_connection_limit` | Gauge | 连接池上限 |

### 系统默认指标

通过 `prom-client` 自动采集：

| 指标 | 说明 |
|:---|:---|
| `process_cpu_seconds_total` | 进程 CPU 使用时间 |
| `process_resident_memory_bytes` | 进程常驻内存 |
| `nodejs_heap_used_bytes` | V8 堆已用内存 |
| `nodejs_heap_total_bytes` | V8 堆总内存 |
| `nodejs_eventloop_lag_seconds` | 事件循环延迟 |

### Grafana 仪表盘建议

推荐配置以下面板：

1. **请求速率**：`rate(http_requests_total[5m])` 按 method/status_code 分组
2. **响应时间 P50/P95/P99**：`histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
3. **错误率**：`rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m])`
4. **数据库连接池使用率**：`db_pool_active_connections / db_pool_connection_limit`
5. **内存使用趋势**：`process_resident_memory_bytes`

---

## 结构化日志

### Winston 日志配置

```typescript
// server/src/utils/logger.ts
const logger = winston.createLogger({
  level: 'info',                    // 可通过 LOG_LEVEL 环境变量调整
  defaultMeta: { service: 'star-citizen-api' },
  transports: [
    new winston.transports.Console({
      format: production ? jsonFormat : consoleFormat  // 生产环境 JSON，开发环境彩色
    }),
    new winston.transports.File({   // 需 LOG_FILE_ENABLED=true
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
})
```

### 日志级别

| 级别 | 用途 |
|:---|:---|
| `error` | 未捕获异常、数据库连接失败、第三方服务不可用 |
| `warn` | 慢查询（>500ms）、速率限制触发、降级处理 |
| `info` | 请求日志、用户登录/登出、业务操作记录 |
| `debug` | SQL 查询详情、缓存命中/未命中、调试信息 |

### 环境变量

| 变量 | 默认值 | 说明 |
|:---|:---|:---|
| `LOG_LEVEL` | `info` | 日志级别 |
| `LOG_FILE_ENABLED` | `false` | 是否输出到文件 |
| `LOG_FILE_ERROR` | `logs/error-%DATE%.log` | 错误日志路径模板 |
| `LOG_FILE_COMBINED` | `logs/combined-%DATE%.log` | 综合日志路径模板 |

### 日志轮转策略

使用 `winston-daily-rotate-file` 实现自动轮转：

| 日志类型 | 单文件上限 | 保留时间 | 压缩 |
|:---|:---|:---|:---|
| 错误日志 | 20MB | 30 天 | ✅ gzip 归档 |
| 综合日志 | 20MB | 14 天 | ✅ gzip 归档 |

轮转行为：
- 每天生成新文件：`combined-2026-05-31.log`
- 单文件超过 20MB 时当天内也会轮转
- 超过保留时间的文件自动删除
- 归档文件格式：`combined-2026-05-31.log.gz`

### 请求日志格式

每个 API 请求自动生成两层日志：

1. **Morgan** — HTTP 访问日志（`combined` 格式，含 IP、User-Agent、响应时间）
2. **requestLogger** — Winston 结构化日志（含 requestId、业务上下文）

Winston 结构化日志示例：

```json
{
  "timestamp": "2026-05-31T10:30:00.000Z",
  "level": "info",
  "message": "GET /api/members",
  "service": "star-citizen-api",
  "requestId": "uuid-v4",
  "method": "GET",
  "path": "/api/members",
  "statusCode": 200,
  "duration": 45,
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

### 请求关联 ID

每个请求自动生成唯一 `requestId`（UUID v4），注入 `req.id`，贯穿整个请求链路：

```
请求进入 → requestId 生成 → 注入 req.id → 日志记录 → 响应头 X-Request-Id
```

排查问题时可通过 `requestId` 串联同一请求的所有日志。

---

## 慢查询监控

`queryWithTiming()` 函数自动记录超过阈值的 SQL 查询：

```typescript
// server/src/database/pool.ts
const rows = await queryWithTiming('SELECT * FROM members WHERE role = ?', ['admin'])
// 超过 500ms 自动输出 warn 级别日志
```

慢查询日志示例：

```json
{
  "level": "warn",
  "message": "Slow query detected",
  "sql": "SELECT * FROM members WHERE role = ?",
  "duration": 723,
  "threshold": 500
}
```

---

## 前端错误监控（Sentry）

前端集成 Sentry 进行生产环境错误追踪：

```bash
# .env.development
VITE_SENTRY_DSN=https://your-sentry-dsn@o0.ingest.sentry.io/0
```

| 功能 | 说明 |
|:---|:---|
| 错误捕获 | `app.config.errorHandler` 全局捕获组件渲染/生命周期错误 |
| 性能追踪 | 页面加载、路由切换耗时 |
| 用户上下文 | 已登录用户 ID 关联错误 |
| Source Map | 构建时上传，支持定位源码行号 |

---

## 告警建议

| 指标 | 阈值 | 告警方式 |
|:---|:---|:---|
| API 错误率 | > 1%（5 分钟窗口） | Prometheus Alertmanager |
| API P95 响应时间 | > 500ms | Prometheus Alertmanager |
| 数据库连接池使用率 | > 80% | Prometheus Alertmanager |
| 内存使用率 | > 85% | Prometheus Alertmanager |
| 磁盘使用率 | > 90% | 系统监控 |
| 健康检查失败 | 连续 3 次 | Docker/Kubernetes 自动重启 |
| 慢查询频率 | > 10 次/分钟 | 日志告警 |
