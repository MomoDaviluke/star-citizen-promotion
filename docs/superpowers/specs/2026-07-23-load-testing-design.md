# 压力测试设计文档

> **项目**: Star Citizen 战队宣传网站
> **日期**: 2026-07-23
> **状态**: 已批准（用户授权全自动审查）
> **方案**: 方案 A — 分层递进式

---

## 1. 背景与目标

### 1.1 现状

项目已有完整的单元/集成/E2E 测试体系（Vitest 前端 + Jest 后端 310 用例 + Playwright E2E），但**完全没有负载/压力测试基础设施**。后端已具备三层限流、内存缓存（TTL+ETag）、Prometheus metrics、WebSocket（连接速率限制+心跳）、连接池、compression；前端已内置 `web-vitals` 采集、`useWebVitals` composable、`rumService` 上报。这些基础设施在高压下的实际行为尚未被验证。

### 1.2 目标

| 目标 | 衡量方式 |
|---|---|
| 找吞吐量上限 | 递增并发直到 P95 突增或错误率 > 1%，定位 QPS 峰值 |
| 找稳定性问题 | 30min 持续负载下监测 heap/rss/event loop/连接池，识别泄漏与 GC 抖动 |
| 找延迟瓶颈 | P50/P95/P99 层面归因瓶颈中间件（缓存/DB/compression/helmet）|
| 验证限流/缓存策略 | 主动冲击 API/auth/refresh/WS 限流阈值，验证 429 行为与缓存 HIT/MISS 切换 |

### 1.3 范围

- **后端 API**：所有 GET 读端点 + auth 流程 + 写端点
- **WebSocket 实时通道**：`/ws` 并发连接、心跳、认证
- **前端运行时性能**：关键页面 LCP/CLS/INP/动画 FPS
- **全栈端到端**：经 Nginx（HTTP/2、gzip、SSL、静态资源缓存）的完整链路

### 1.4 环境

Docker Compose 模拟生产拓扑（backend + mysql + nginx），独立数据卷隔离，`NODE_ENV=production`。

### 1.5 工具

- **autocannon**（HTTP/WebSocket 压测核心，~150KB）
- **Playwright + Lighthouse**（前端性能，复用已有依赖）
- 不引入 k6 / Artillery / 额外 prom-client（后端已有）

---

## 2. 架构与目录结构

```
load-tests/
├── scenarios/                  压测场景脚本
│   ├── l1-baseline/            L1 单端点基线
│   │   ├── readme-endpoints.mjs    公开读端点轮压
│   │   ├── auth-flow.mjs           登录+刷新+注册串压
│   │   └── write-endpoints.mjs     写端点低压压测
│   ├── l2-mixed/               L2 混合负载
│   │   └── 80-20-mixed.mjs         读:写=8:2 混合
│   ├── l3-soak/                L3 稳定性长跑
│   │   ├── soak-runner.mjs         30min 持续负载
│   │   └── monitor.mjs             heap/pool/eventloop 采集
│   ├── l4-policy/              L4 限流/缓存策略验证
│   │   ├── rate-limit-verify.mjs   429 行为断言
│   │   └── cache-hit-miss.mjs      缓存 HIT/MISS 切换验证
│   ├── l5-e2e/                 L5 全栈端到端
│   │   ├── ws-burst.mjs            WebSocket 并发连接/心跳
│   │   ├── through-nginx.mjs       经 Nginx HTTP/2 压测
│   │   ├── frontend-perf.mjs       Playwright+Lighthouse
│   │   └── lighthouse-runner.mjs   Lighthouse 调用封装
│   └── run-all.mjs             顶层编排器
├── lib/                        共享工具
│   ├── client.mjs             统一 autocannon 封装
│   ├── auth.mjs               登录拿 token，按 role 缓存
│   ├── seeds.mjs              初始化测试用户/数据
│   ├── monitor.mjs            prom-client pull + 采样
│   ├── report.mjs             汇总结果到 HTML/JSON/MD
│   └── probe.mjs              目标 URL 可达性探测
├── config/                    配置
│   ├── targets.mjs            各目标 URL（dev/prod 双模式）
│   └── thresholds.mjs         P95/错误率/缓存命中率阈值
├── reports/                   报告输出（gitignore）
└── docker-compose.loadtest.yml  压测专用 docker 栈
```

### 2.1 设计决策

1. **顶层独立目录** `load-tests/`，与 `tests/`（单元/E2E）隔离，npm scripts 加 `test:load:*` 入口
2. **ESM (`.mjs`)**：与项目 `"type": "module"` 一致；压测脚本不需 TS 类型开销
3. **专用 docker-compose**：继承生产配置但独立 MySQL volume `mysql_loadtest_data`，关闭 certbot/backup profile
4. **共享 lib**：所有脚本共用 autocannon 封装、token 获取、监控采集、报告生成
5. **配置外置**：URL/阈值放 `config/`，dev/prod 切换不改脚本

### 2.2 npm scripts 新增

```json
{
  "test:load": "node load-tests/scenarios/run-all.mjs",
  "test:load:l1": "node load-tests/scenarios/l1-baseline/",
  "test:load:l2": "node load-tests/scenarios/l2-mixed/80-20-mixed.mjs",
  "test:load:l3": "node load-tests/scenarios/l3-soak/soak-runner.mjs",
  "test:load:l4": "node load-tests/scenarios/l4-policy/",
  "test:load:l5": "node load-tests/scenarios/l5-e2e/",
  "load:up": "docker compose -f load-tests/docker-compose.loadtest.yml up -d --build",
  "load:down": "docker compose -f load-tests/docker-compose.loadtest.yml down -v"
}
```

### 2.3 新增依赖（仅 devDependencies）

| 包 | 用途 |
|---|---|
| `autocannon` | HTTP/WebSocket 压测核心 |
| `lighthouse` | 前端性能审计（dev only）|

`playwright` 已在 dependencies，复用。

### 2.4 .gitignore 新增

```
load-tests/reports/
load-tests/.env.local
```

---

## 3. L1-L3 场景设计

### 3.1 L1 单端点基线

逐端点递增并发，建立 P50/P95/P99/QPS 基线，每个端点跑 10s 暖身 + 30s 压测。

| 脚本 | 端点 | 方法 | 并发 | 说明 |
|---|---|---|---|---|
| `readme-endpoints.mjs` | `/api/stats` `/api/fleet` `/api/members` `/api/pilots` `/api/projects` `/api/events` `/api/settings` | GET | 1→10→50→100 | 公开读端点轮压，验证缓存层 |
| `auth-flow.mjs` | `/api/auth/login` `/api/auth/refresh` `/api/auth/register` | POST | 1→5→10 | auth 限流极严（10/15min），低压观察 bcrypt 12 轮开销 |
| `write-endpoints.mjs` | `/api/auth/profile` `/api/members/:id` (admin) | PUT | 1→5 | 写端点低压，避免污染数据 |

每个端点输出 JSON 到 `reports/l1/<endpoint>.json`，含 P50/P95/P99/QPS/错误率/`X-Cache` 头分布。

**共享封装** `lib/client.mjs`：
- `runScenario({ url, method, connections, duration, body, headers })` → 统一返回结构
- 自动重试连接 ECONNRESET
- 超时 30s 强制终止并标记 FAIL
- 支持 `--smoke` 参数（5s + 1 并发，用于 CI 验证）

**auth 限流注意**：`/api/auth/login` 限流 10 req/15min/IP，并发 10 必然触发 429。`auth-flow.mjs` 中：
- 并发上限设为 5
- 429 单独统计为 `rateLimited`，不计为错误
- 末尾输出提示：测试后需 `docker compose restart backend` 重置限流窗口

### 3.2 L2 混合负载

`80-20-mixed.mjs`：autocannon 多脚本模式，8 个虚拟用户跑 GET /api/stats|fleet|members（80% 流量），2 个虚拟用户跑 POST /api/auth/profile 更新（20% 流量）。持续 60s，验证：
- 写操作后缓存失效（X-Cache: MISS → 写 → HIT 恢复）
- 写竞争对读 P95 的影响
- DB 连接池在读写混合下的等待

### 3.3 L3 稳定性长跑

| 脚本 | 内容 |
|---|---|
| `soak-runner.mjs` | 持续 30min 中等并发。**并发数 = L1 基线中 `/api/stats` 达到 P95 < 200ms 时的最大并发 × 0.8**（默认 fallback 50）。每 10s 采样 `/metrics` + `/health`。L3 必须在 L1/L2 跑完后执行，从 `reports/l1/stats.json` 读取基线 |
| `monitor.mjs` | 旁路进程，每 5s 拉取 `/metrics` 解析 `nodejs_heap_size_used_bytes` `nodejs_eventloop_lag_seconds` `mysql_pool_active_connections`，写 `reports/l3/timeseries.json` |

**判定标准**：
- heap 增长曲线线性（疑似泄漏）vs 平台（健康）
- event loop lag P95 < 50ms
- 连接池活跃数稳定不溢出（< connectionLimit = 10）
- 错误率 < 0.1%

---

## 4. L4-L5 场景设计

### 4.1 L4 限流/缓存策略验证

**`rate-limit-verify.mjs`** — 主动冲击三个限流阈值，断言 429 行为：

| 场景 | 冲击目标 | 预期 | 断言 |
|---|---|---|---|
| 1 | 200 并发 → `/api/stats` 15s | 先 200 后持续 429 | 429 body 含 `请求过于频繁`；响应头含 `RateLimit-Remaining: 0` + `RateLimit-Reset` |
| 2 | 20 并发 → `/api/auth/login` 15s | 第 11 次起 429 | 429 body 含 `登录尝试过于频繁`；429 计数 = 总请求 - 10 |
| 3 | 70 并发 → `/api/auth/refresh` 60s | 第 61 次起 429 | 429 body 含 `令牌刷新过于频繁` |

每个场景输出 `pass/fail` + 实际 429 比例。末尾提示 `docker compose restart backend` 重置限流窗口。

**`cache-hit-miss.mjs`** — 验证缓存切换：
1. 首次 GET /api/stats → 断言 `X-Cache: MISS` + `ETag` 存在
2. 立即第二次 GET → 断言 `X-Cache: HIT`
3. 发 `If-None-Match: <etag>` → 断言 `304 Not Modified`
4. 执行一次写操作触发失效（admin PUT）→ 再 GET → 断言 `X-Cache: MISS`
5. 等 30s TTL 过期 → 再 GET → 断言 `MISS`（即使没写也过期）

### 4.2 L5 全栈端到端

**`ws-burst.mjs`** — WebSocket 压测：
- 50 并发连接 `/ws`，每连接每 5s 发 `{type:'ping'}` 持续 60s
- 断言：连接成功率（WS 限流 10/min/IP，单 IP 预期 ~10 成功 + ~40 拒绝，验证 1008 关闭码）
- 心跳：30s 内收到 server ping，client 回 pong，验证连接保持
- 内存：监测后端 `wss.clients.size` 不泄漏（连接关闭后归零）

**`through-nginx.mjs`** — 经 Nginx 压测对比直连：
- 同一端点分别压 `http://localhost:80/api/stats` vs `http://localhost:3001/api/stats`
- 对比 P95 延迟差（Nginx 转发开销应 < 5ms）
- 验证 HTTP/2 响应头、gzip 生效（`Content-Encoding: gzip`）
- 静态资源：压 `/hero-bg.jpg` 验证 `Cache-Control: public, immutable` + `expires 1y`

**`frontend-perf.mjs`** + **`lighthouse-runner.mjs`** — 前端性能：
- 对 `/` `/fleet` `/members` `/join` 4 个关键页面跑 Lighthouse
- 采集 LCP/CLS/INP/FCP/TTFB + 动画 FPS（Playwright `page.metrics` + `requestAnimationFrame` 计数器采集 60s 滚动动画帧率）
- 利用已有 `useWebVitals`：Playwright 拦截 `/api/rum` 请求，解析上报指标
- 阈值（参考 DBG-03 桌面更严）：LCP < 2.5s、CLS < 0.1、INP < 200ms、动画 FPS > 50

---

## 5. 监控、报告与配置

### 5.1 监控数据源

| 源 | 端点/方式 | 用途 |
|---|---|---|
| Prometheus metrics | `GET /metrics` | heap/eventloop/pool/HTTP 直方图 |
| 健康检查 | `GET /health` | database/memory/poolStatus 实时 |
| 缓存统计 | `GET /api/admin/cache/stats`（需 admin token）| HIT/MISS/容量 |
| MySQL | 后端新增 `GET /api/admin/db/status` 端点（admin 鉴权），返回 `Threads_connected`/`Threads_running`/`Max_used_connections`。压测期间由 `lib/monitor.mjs` 轮询。若不想新增端点，可降级为只读 `mysql_pool_active_connections`（prom-client 已暴露）|
| Node inspector | `node --inspect` + heapdump | L3 长跑泄漏定位（手动触发）|

`lib/monitor.mjs` 每 5s 轮询上述源，写时序 JSON。

### 5.2 报告生成

每层跑完生成：
- `reports/<layer>/<scenario>.json` — 原始 autocannon 结果
- `reports/<layer>/<scenario>.html` — 可视化（autocannon 自带 HTML reporter）
- `reports/summary.md` — 汇总表：各端点 P50/P95/P99/QPS/错误率 + 是否达标
- `reports/l3/timeseries.txt` — L3 时序图（ASCII sparkline，避免重依赖）

### 5.3 配置

**`config/targets.mjs`**：
```js
export const TARGETS = {
  backend:  process.env.LOADTEST_TARGET   || 'http://localhost:3001',
  nginx:    process.env.LOADTEST_NGINX    || 'http://localhost:80',
  frontend: process.env.LOADTEST_FRONTEND || 'http://localhost:3000',
  ws:       process.env.LOADTEST_WS       || 'ws://localhost:3001/ws'
}
```

**`config/thresholds.mjs`**：
```js
export const THRESHOLDS = {
  l1:     { p95Ms: 200, errorRate: 0.01, minQps: 50 },
  l1Auth: { p95Ms: 500, errorRate: 0.05 },
  l2:     { p95Ms: 300, cacheHitRate: 0.7 },
  l3:     { heapGrowthPct: 30, eventLoopLagP95Ms: 50 },
  l5:     { lcp: 2500, cls: 0.1, inp: 200, fps: 50 }
}
```

### 5.4 数据隔离

`docker-compose.loadtest.yml` 用独立 MySQL volume `mysql_loadtest_data`；`lib/seeds.mjs` 压测前 seed 测试用户（admin/member）+ 基础数据，`load:down` 自动 `-v` 清理。

---

## 6. 错误处理与测试验证

### 6.1 压测脚本错误处理

| 场景 | 处理 |
|---|---|
| 连接失败 | autocannon 启动前 `GET /health/live` 探活，失败跳过场景并记 SKIP |
| 429 限流 | L1/L2 中 429 单独统计为 `rateLimited`，不计错误；L4 主动验证 |
| 超时 | 单端点 30s 无响应强制终止，标记 TIMEOUT 并继续 |
| MySQL 连接耗尽 | L3 监测 pool active == connectionLimit 持续 10s → 自动降并发 50% 并告警 |
| 进程崩溃 | `run-all.mjs` 用 `child_process.spawn` 隔离，单场景崩溃不影响整体，写 `reports/crash.log` |

### 6.2 测试验证策略

按 verification-before-completion 原则，压测基础设施本身需验证：

| 验证项 | 命令 | 预期 |
|---|---|---|
| 依赖安装 | `npm install` | autocannon 装入 devDependencies |
| 脚本语法 | `node --check load-tests/scenarios/**/*.mjs` | 0 语法错误 |
| Docker 栈启动 | `npm run load:up` | backend+mysql+nginx healthy |
| L1 烟雾测试 | `node load-tests/scenarios/l1-baseline/readme-endpoints.mjs --smoke` | 跑 1 端点 5s，输出 JSON |
| 配置探测 | `node load-tests/lib/probe.mjs` | 所有目标 URL 可达 |
| 类型检查 | `tsc --noEmit`（后端）+ `vite build`（前端）| 0 错误 |

所有场景支持 `--smoke`（5s + 1 并发），用于 CI 验证脚本可用性。

---

## 7. 实施顺序

1. 基础设施：`load-tests/` 目录 + `lib/` + `config/` + `docker-compose.loadtest.yml` + npm scripts + 依赖
2. L1 场景 + 烟雾验证
3. L2 场景
4. L4 场景（限流/缓存验证，先于 L3 因 L3 需要 L1/L2 基线定并发）
5. L3 长跑 + 监控
6. L5 全栈端到端
7. `run-all.mjs` 编排 + 汇总报告
8. 文档更新（TESTING.md 增加压测章节）

---

## 8. 风险与缓解

| 风险 | 缓解 |
|---|---|
| 压测污染生产数据 | 独立 MySQL volume + `load:down -v` 清理 |
| 限流窗口跨场景污染 | L4 末尾提示 restart backend；`run-all.mjs` 在 L4 后自动等待 90s |
| L3 长跑压垮 Docker MySQL | 监测 pool 自动降并发；MySQL volume 无限制不会 OOM |
| Lighthouse 桌面评分受本地 HTTP/1.1 影响（DBG-03）| 记录 observed metrics + 标注"本地预览仅供参考" |
| bcrypt 12 轮导致 login 压测过慢 | L1 auth 并发上限 5，预期 P95 500ms 阈值已放宽 |

---

## 9. 非目标（YAGNI）

- **CI 性能门禁**：先有基线才能设门禁，留作 v1.4.0 后续工作
- **分布式压测**（多机压测）：单机 Docker 足以发现当前不足
- **k6/Artillery 备选**：autocannon 已满足需求，不引入额外工具链
- **生产环境真实压测**：当前阶段聚焦本地 Docker 模拟，避免影响真实用户
