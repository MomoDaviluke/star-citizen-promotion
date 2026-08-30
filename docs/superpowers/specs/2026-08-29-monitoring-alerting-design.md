# 后端资源监控与告警回报系统设计

> 日期: 2026-08-29
> 状态: 已批准，待实现
> 范围: 后端资源采集、告警引擎、告警持久化、admin 监控面板、前端问题回报

## 1. 目标与非目标

### 目标

1. 持续采集后端进程与依赖资源指标，无需额外运维组件。
2. 指标越过阈值时自动生成告警，并附带可定位问题的上下文快照。
3. 前端可查看实时指标与告警，并可回传浏览器侧证据。
4. 通过 `requestId` 将后端错误与前端回报串成一条链路，解决「前后端各说各话」的定位困境。

### 非目标

- 不引入 Prometheus / Grafana 等外部运维组件（复用现有 prom-client 导出即可，不新增容器）。
- 不做外部推送渠道（钉钉 / 飞书 / 邮件），告警仅在 admin 面板呈现。
- 不做分布式链路追踪（单进程部署，requestId 即可满足）。

## 2. 架构

三层单向依赖，每层职责单一、可独立测试。

```
采集层 collector  ──▶  告警引擎 alertEngine  ──▶  API 层 routes/monitor  ──▶  admin 面板
   (5s 采样)           (阈值判定 + 快照)          (只读暴露 + 写回报)
       │                      │
  内存环形缓冲            MySQL 落库
  (最近 300 点)        (monitor_alerts / monitor_reports)
```

## 3. 采集层 `server/src/monitoring/collector.ts`

### 采样周期

5 秒。通过 `setInterval` 驱动，暴露 `start()` / `stop()` 供测试与优雅关闭使用。

### 采集项

| 指标 | 来源 | 单位 |
|------|------|------|
| `cpuPercent` | `process.cpuUsage()` 前后差值 / 采样间隔 / 核数 | % |
| `rssMb` / `heapUsedMb` / `heapTotalMb` / `externalMb` | `process.memoryUsage()` | MB |
| `rssPercent` | `rssMb / os.totalmem()` | % |
| `systemMemUsedPercent` | `(os.totalmem() - os.freemem()) / os.totalmem()` | % |
| `eventLoopLagMs` (mean / p95 / max) | `perf_hooks.monitorEventLoopDelay()` | ms |
| `dbPool` (total / active / idle / waiting / limit) | knex pool | 个 |
| `redisLatencyMs` / `redisUp` | ioredis `ping()` 计时 | ms / 布尔 |
| `errorRate5xx` / `p95LatencyMs` / `rpm` | 请求滑动窗口 | 比例 / ms / 次 |

### 为什么用 `monitorEventLoopDelay`

`setTimeout` 打点法本身会被事件循环阻塞所影响，测出的延迟偏低且不稳定。
`monitorEventLoopDelay()` 由 libuv 在独立线程采样，能如实反映阻塞，且自带直方图可直接取 p95。

### 环形缓冲

- 容量 300 点（约 25 分钟），超出后覆盖最旧数据。
- 理由：采样是高频时序数据，全量落库每天 1.7 万行属过度设计；排查问题时只需近期趋势。
- 实现上用定长数组 + 写指针，避免 `Array.shift()` 的 O(n) 拷贝。

### 请求滑动窗口

由 `metricsMiddleware` 在请求结束时写入：保留最近 60 秒的
`{ requestId, method, route, statusCode, durationMs, timestamp }`。
窗口内 5xx 占比即 `errorRate5xx`，最近错误明细用于告警快照。

## 4. 告警引擎 `server/src/monitoring/alertEngine.ts`

### 规则表

| 规则 | warn | critical | 持续要求 |
|------|------|----------|----------|
| `cpu_percent` | 70% | 90% | 连续 2 个采样点 |
| `rss_percent` | 70% | 85% | 连续 2 个采样点 |
| `event_loop_p95_ms` | 100ms | 300ms | 单次即触发 |
| `error_rate_5xx` | 5% | 15% | 单次即触发 |
| `db_pool_waiting` | 3 | 8 | 连续 2 个采样点 |
| `redis_down` | — | 连续 2 次 ping 失败 | 连续 2 个采样点 |

> **为什么不使用 `heap_used_percent`？** V8 会把堆内存用到接近上限才触发 GC，健康 Node 进程瞬时堆占用长期处在 90% 以上。用 `heap_used_percent` 做固定阈值会持续误报。因此改为 **RSS 占系统内存比例**，这才是真实的 OOM 风险指标。堆内存使用率仍作为面板观测项保留。

「连续 2 个采样点」的要求用于抑制瞬时毛刺，事件循环与错误率因后果严重而例外。

### 状态机

```
ok ──越阈值──▶ active ──回落至 warn 以下──▶ resolved
                  │
                  └──管理员认领──▶ acked ──回落──▶ resolved
```

### 冷却去重

同一规则 5 分钟内只产生一条 active 告警，期间重复越阈值仅累加 `hitCount` 与更新
`lastValue`，避免告警风暴淹没有效信息。

### 上下文快照

告警触发瞬间抓取并随告警一起落库：

- 触发时刻的完整采样点
- 窗口内最近 10 条 5xx 请求（requestId / method / route / status / 耗时）
- 依赖状态（DB 池、Redis）
- 最近 5 条前端 RUM 指标

这份快照是「定位前后端问题」的核心：它让告警从「CPU 高了」变成「CPU 高了，且同一窗口内 `/api/v1/applications` 有 3 次 500，requestId 分别是 X / Y / Z」。

## 5. 数据模型

新增两张表，写入 `server/src/database/schema.ts` 的 `TABLE_SCHEMAS`，
同时在 `server/migrations/` 新增迁移，并对存量库执行建表（DBG-17 教训：两步缺一不可）。

### `monitor_alerts`

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) PK | UUID |
| `rule` | VARCHAR(50) | 规则名，如 `cpu_percent` |
| `severity` | ENUM('warn','critical') | 级别 |
| `metric_value` | DECIMAL(12,4) | 触发时实测值 |
| `threshold` | DECIMAL(12,4) | 触发阈值 |
| `status` | ENUM('active','acked','resolved') | 默认 `active` |
| `hit_count` | INT | 冷却期内重复命中次数 |
| `snapshot` | JSON | 上下文快照 |
| `message` | VARCHAR(255) | 人读摘要 |
| `ack_by` | VARCHAR(36) | 认领人，可空 |
| `created_at` / `updated_at` / `resolved_at` | TIMESTAMP | |

索引：`(status, created_at)` 支撑面板按状态查最近告警；`(rule, created_at)` 支撑冷却查询。

### `monitor_reports`

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) PK | UUID |
| `request_id` | VARCHAR(64) | 关联后端请求 ID，可空 |
| `category` | ENUM('frontend_error','slow_page','api_failure','manual') | 回报类型 |
| `message` | TEXT | 用户描述 |
| `browser` | JSON | UA / URL / 视口 / 语言 |
| `payload` | JSON | 控制台错误、RUM 指标、失败请求明细 |
| `created_at` | TIMESTAMP | |

索引：`(request_id)`、`(created_at)`。

## 6. API `server/src/routes/monitor.ts`

挂载于 `/api/v1/monitor`。

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/metrics` | admin | 当前快照 + 历史采样序列 |
| GET | `/alerts` | admin | 告警列表，支持 `status` / `severity` 过滤与分页 |
| POST | `/alerts/:id/ack` | admin | 认领告警 |
| POST | `/reports` | 匿名可报，限流 10/分钟 | 前端回报，兼容 sendBeacon |
| GET | `/reports` | admin | 回报列表，支持按 `requestId` 查询 |

### sendBeacon 兼容性

`POST /reports` 必须同时接受 `application/json` 与 `text/plain`。
浏览器 `sendBeacon` 直传字符串时 Content-Type 被强制为 `text/plain`，
前端必须包装为 `application/json` 的 Blob（QUAL-05 / 本次修复的 RUM 同类问题）。
后端额外挂载 `express.text()` 作为兜底，避免第三方或旧版本前端重蹈覆辙。

## 7. 前端

### `src/views/admin/Monitor.vue`（新增）

- 资源概览卡片：CPU、堆内存、事件循环 p95，实时数值 + 近 25 分钟折线（chart.js 已有依赖）。
- 依赖健康：DB 池与 Redis 状态灯。
- 告警列表：级别、规则、实测值 / 阈值、持续时间、认领按钮、快照展开。
- 回报列表：按 requestId 检索，与告警快照并排展示。

### `src/services/monitorService.js`（新增）

封装上述接口的调用，`reportIssue()` 使用 Blob 包装的 sendBeacon，
自动采集 `navigator.userAgent`、当前 URL、视口尺寸与最近控制台错误。

### 路由与入口

- `src/router/index.js` 的 `/admin` 子路由新增 `monitor` 项。
- `AdminLayout.vue` 导航新增「系统监控」入口。

## 8. 测试策略（TDD）

| 层 | 文件 | 覆盖点 |
|----|------|--------|
| 采集 | `server/tests/monitoring/collector.test.ts` | CPU 百分比计算、环形缓冲容量与覆盖顺序、事件循环直方图读取 |
| 告警 | `server/tests/monitoring/alertEngine.test.ts` | 各级阈值判定、连续点数要求、冷却去重、回落 resolved、快照内容 |
| 调度 | `server/tests/monitoring/scheduler.test.ts` | tick 健康统计、连续失败自警、保留期清理 |
| 存储 | `server/tests/database/monitorStore.test.ts` | 时间戳换算、行映射、容错降级、过期清理 |
| 路由 | `server/tests/routes/monitor.test.ts` | 权限拦截、分页过滤、认领状态流转、text/plain 兜底解析 |
| 前端 | `tests/services/monitorService.test.js` | sendBeacon 使用 Blob、降级 fetch、静默失败 |
| 前端 | `tests/views/admin/Monitor.test.js` | 轮询启停、筛选联动、认领、快照展开、回报弹窗、自检灯（10 用例，Monitor.vue 行覆盖 94.15%，2026-08-29） |

测试命令：后端 `npm test`（`node --import tsx --experimental-vm-modules jest.js`），
**不可用 `npx jest`**（会导致 30/46 套件加载失败）。前端 `npx vitest run`。

> 基线（2026-08-29）：后端 621/621、前端 401/401（含 Monitor.vue 组件测试）。

## 9. 风险与对策

| 风险 | 对策 |
|------|------|
| 采集本身消耗资源 | 5s 周期、环形缓冲定长、Redis ping 带 1s 超时，失败不重试 |
| 告警风暴 | 5 分钟冷却 + 连续点数要求 |
| 时间戳换算重复除 1000 导致冷却失效 | 统一 `toUnixSeconds(ms)` 函数：SQL 用 `FROM_UNIXTIME(?)`、参数传秒；并加单测锁死时间量级 |
| 堆内存阈值误报 | 不采用 `heap_used_percent`；改用 `rss_percent`（RSS 占系统内存） |
| 存量库缺表导致 500 | schema.ts + migration + 存量库执行三步，测试环境用 `CREATE TABLE IF NOT EXISTS` 兜底 |
| 匿名回报接口被刷 | 限流 10/分钟 + payload 大小上限 64KB |

## 10. 稳定性与可维护性设计（2026-08-29 加固）

### 容错降级

- **仓储层全部读写容错**：读故障（DB 不可达）降级为 `null` / 空数组，写故障静默 + 日志。
  `findActiveByRule` 故障时按「无活跃告警」处理，评估链路不会瘫痪，DB 恢复后状态自动收敛。
- **规则取值隔离**：单个规则的 `extract` 抛错只跳过该规则；非有限值（undefined/NaN/Infinity）
  视为本次不适用，不完整采样不会让整轮评估崩溃（ENG-07）。

### 谁来监控监控者

- **调度器健康追踪**：每次 tick 记录成功/失败时间、连续失败数与最后错误。
- **内存自警**：连续失败 ≥ 3 次进入自警状态（不依赖 DB），恢复成功后自动解除。
- **自检端点** `GET /api/v1/monitor/health`（admin）：暴露调度器健康快照、采集器缓冲占用
  与请求窗口统计，让外部探活能发现监控系统自身瘫痪；`/metrics` 同步携带调度器摘要。
- 面板顶部显示「监控自检」状态灯与连续失败数。

### 数据保留

- 已恢复告警默认保留 **30 天**，调度器每小时调用 `purgeResolvedBefore` 清理一次；
  `active` / `acked` 状态永不清理。清理失败只记录、不影响采样健康。

### 阈值可配置

- `MONITOR_THRESHOLDS` 环境变量以 JSON 覆盖默认阈值
  （`{"cpu_percent":{"warn":50,"critical":80}}`），只允许覆盖 warn / critical，
  连续点数与取值函数固定在代码中；非法配置整体回退默认并记日志。

