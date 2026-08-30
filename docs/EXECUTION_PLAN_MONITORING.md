# 监控模块后续任务执行计划（模块化）

> **项目**: Star Citizen 战队宣传网站
> **创建日期**: 2026-08-29
> **来源**: 《监控系统与告警回报模块评审报告》(docs/reports/MONITOR_MODULE_REVIEW_2026-08-29.md)
> **执行模式**: 单人串行，每任务独立 commit，禁止并行推进多模块
> **编号体系**: MON-xx（避免与既有 TD 编号冲突）

---

## 0. 执行者必读（全局约束）

**按模块顺序执行，模块内按任务编号顺序执行，不要跳步、不要并行。**

### 0.1 硬约束（违反会导致测试/构建失败）

| # | 约束 | 原因 |
|:--|:--|:--|
| C1 | 前端测试 `npm test`（vitest），测试放 `tests/` 镜像源码结构；后端测试 `cd server && npm test`（jest），**框架不可混用** |
| C2 | mock 模块一律用 `vi.mock`（hoisted），禁用 `vi.doMock`（共享 worker 实例分裂，历史教训 FE-08） |
| C3 | Vue 模板数字/布尔/Object prop 必须 `:` 动态绑定（QUAL-18） |
| C4 | 验证 = 实际运行命令并确认输出，禁止"应该能过"式断言 |
| C5 | commit 遵循 Conventional Commits；PowerShell 多行 body 用多个 `-m` |
| C6 | 监控相关后端测试基线：**621/621 通过**（2026-08-29 晚实测）；前端 **391/391**。任何改动后不得低于该基线 |
| C7 | 监控仓储容错设计必须保留：读写 try/catch 降级、scheduler 自警、ENG-07 规则隔离——这是评审认可的核心优点，不得为加功能破坏 |

### 0.2 验证命令速查

```powershell
# 前端（仓库根目录）
npm run lint && npm run typecheck && npm test

# 后端（server/ 目录）
cd server; npm test        # 基线 621/621
cd server; npm run typecheck

# 数据库结构同步（涉及新表/新列时）
cd server; npm run db:init
```

---

## 模块总览

| 模块 | 名称 | 优先级 | 任务数 | 预估规模 | 依赖 |
|:--|:--|:--|:--|:--|:--|
| A | 仓库收尾与代码卫生 | P0 | 3 | 小 | 无 |
| B | 监控测试补全 | P0 | 2 | 中 | A |
| C | 告警外部通知系统 | P1 | 4 | 大（核心价值） | B |
| D | 数据治理与负载优化 | P1 | 2 | 中 | A |
| E | 细节打磨 | P2 | 4 | 小 | D |
| F | 远期演进 | P3 | 3 | — | C+D 完成后评估 |

**执行顺序：A → B → C → D → E；F 为缓行项，仅做设计预留不实现。**

---

## 模块 A：仓库收尾与代码卫生（P0）

**目标**：把工作区的 82 个未提交文件安全落库，修复评审发现的 2 处代码卫生问题，让后续开发基于干净工作树。

### A1 分批审查并提交 82 个未提交文件

**现状**：`git status` 有 82 个文件改动，混有监控模块全部代码 + 24 个 VER-1/VER-2 文档变更 + 若干前端组件改动。

**实现要点**：
1. 先 `git diff --stat HEAD` 通览全部改动，按主题分组（建议分组：监控后端 / 监控前端 / 前后端联通修复（sendBeacon Blob、AI 代理、ships 数据）/ 文档与环境变量）
2. 逐组审查 diff 后分组提交，每组一个 Conventional Commit：
   - `feat(monitor): 后端资源监控与告警系统（采集/判定/调度/存储/路由）`
   - `feat(monitor): 前端监控面板与问题回报服务`
   - `fix(frontend): sendBeacon 包 Blob 修复埋点/回报 400；AI 模块走同源代理`
   - `docs: VER-1/VER-2 文档变更批次`
3. 提交前跑 0.2 全部验证命令确认基线

**验收标准**：`git status` 干净；后端 621/621、前端 391/391 仍全绿。

### A2 修复 alertEngine.ts 类声明格式错误

**位置**：`server/src/monitoring/alertEngine.ts:166`

```typescript
// 现状（双空格，格式错误）
export class AlertEngine {  private readonly repo: AlertRepository

// 修正为
export class AlertEngine {
  private readonly repo: AlertRepository
```

**验收标准**：`cd server && npm run lint && npm test` 全绿；该行格式与文件其余类声明一致。

### A3 修复 alertRepository.ts 过时注释

**位置**：`server/src/monitoring/alertRepository.ts:4`

```typescript
// 现状（指向不存在的文件）
// MySQL 实现见 database/alertStore.ts

// 修正为
// MySQL 实现见 database/monitorStore.ts
```

**验收标准**：注释与实际文件路径一致（与 A2 可合并为一个 `chore(monitor)` commit）。

---

## 模块 B：监控测试补全（P0）

**目标**：消除评审认定的唯一测试盲区——前端 Monitor.vue（24KB、976 行）零组件测试。

### B1 补 Monitor.vue 组件测试

**位置**：新建 `tests/views/admin/Monitor.test.js`（参照 `tests/views/admin/Dashboard.test.js` 与 `Home.test.js` 的既有模式）。

**实现要点**：
1. `vi.mock('@/services/monitorService.js')`（C2 约束：hoisted mock）
2. mock 数据参照后端 `/api/v1/monitor/metrics` 真实响应结构：`{ latest, history, rules, alerts: { active, critical, latest }, requests, scheduler }`（见 `server/src/routes/monitor.ts` 的 res.json 结构）
3. 必测用例清单：

| # | 用例 | 断言要点 |
|:--|:--|:--|
| 1 | 挂载即加载 | metrics/alerts/reports 三接口被调用，资源卡片渲染出 CPU 数值 |
| 2 | 自动刷新开关 | 关闭 autoRefresh 后 clearInterval（fake timers 验证不再轮询）；重新开启恢复轮询 |
| 3 | 状态/级别筛选联动 | 切换 alertStatus 后 getAlerts 携带新 params |
| 4 | 认领告警 | 点击「认领」→ ackAlert 调用 → 列表刷新 |
| 5 | 快照展开/收起 | 点击「查看快照」展开显示 message 与采样格式化文本，再点收起 |
| 6 | 回报弹窗提交 | 打开弹窗 → message 为空时提交按钮 disabled → 填写后提交 → reportIssue 调用 → 弹窗关闭 |
| 7 | 监控自检状态灯 | scheduler.selfAlert.active 为 true 时渲染「监控自检异常」红点 |
| 8 | 加载失败 | getMetrics reject 时显示 error-banner |

4. 组件卸载清理：断言定时器被清除（防泄漏回归）

**验收标准**：新增 ≥8 用例全绿；`npm test` 总数 ≥399（391+8）；`npm run test:coverage` 中 Monitor.vue 行覆盖 ≥80%。

### B2 同步更新监控设计文档测试基线

**位置**：`docs/superpowers/specs/2026-08-29-monitoring-alerting-design.md` 与 `docs/TODO.md`

**实现要点**：把测试覆盖数字更新为 B1 完成后的实际值；TODO.md 增加 MON 系列任务追踪表（把本计划的模块 A–E 登记为可勾选条目）。

---

## 模块 C：告警外部通知系统（P1 · 核心价值）

**目标**：补上「告警系统不会报警」的最大缺口——critical 告警即时推送到外部渠道（企微/钉钉/飞书通用 webhook），告警恢复也通知。这是监控模块从「可观测看板」升级为「真正报警系统」的一步。

**设计原则**：与现有「规则→判定→存储」解耦，通知器作为独立可注入依赖，失败绝不影响告警主链路（沿用 C7 容错哲学）。

### C1 新建通知器接口与内存空实现

**位置**：新建 `server/src/monitoring/notifier.ts`

**实现要点**：
```typescript
export interface AlertNotification {
  alert: AlertEvent
  event: 'opened' | 'resolved' | 'escalated'   // 新开 / 恢复 / 升级（severity 只升不降）
}

export interface Notifier {
  notify(notification: AlertNotification): Promise<void>
}

// 未配置 webhook 时的空实现（零开销）
export class NullNotifier implements Notifier { ... }
```

### C2 WebhookNotifier 实现（通用格式）

**位置**：`server/src/monitoring/webhookNotifier.ts`

**实现要点**：
1. 构造注入 `fetchFn`（默认全局 fetch，可测试）与 `url`
2. 支持三种消息格式模板（按 `WEBHOOK_FORMAT` 环境变量选择 `wecom` / `dingtalk` / `feishu` / `generic`）：
   - wecom（企业微信群机器人）：`{ "msgtype": "markdown", "markdown": { "content": "..." } }`
   - dingtalk：`{ "msgtype": "markdown", "title": "...", "text": { "content": "..." } }`
   - feishu：`{ "msg_type": "text", "content": { "text": "..." } }`
   - generic：自定义 JSON `{ event, rule, severity, value, threshold, message, alertId, occurredAt }`
3. 消息文案：`[critical] redis_down 实测 1，已达阈值 1 @ 2026-08-29 22:00` / 恢复：`[resolved] redis_down 已恢复（持续 12 分钟）`
4. **容错**：发送失败（超时 3s / 非 2xx）只记日志不抛出；单次通知重试 1 次；通知器自身故障绝不上抛
5. 速率自律：同 rule 通知间隔 ≥60s（内存冷却，防止 webhook 被自己刷爆）

### C3 告警引擎接入通知触发

**位置**：`server/src/monitoring/alertEngine.ts` + `server/src/index.ts`

**实现要点**：
1. `AlertEngineOptions` 增加 `notifier?: Notifier`（默认 `NullNotifier`，保持现有测试不破坏）
2. 触发点（fire-and-forget，`notify().catch(日志)`）：
   - `openAlert` → event: 'opened'
   - `resolveAlert` → event: 'resolved'
   - `hitAgain` 中 severity 升级时 → event: 'escalated'
3. `index.ts` 装配：读环境变量 `MONITOR_WEBHOOK_URL` / `MONITOR_WEBHOOK_FORMAT`，有 URL 建 WebhookNotifier，无 URL 保持 NullNotifier
4. `.env.example` / `server/.env.example` 补充上述变量注释说明

### C4 通知链路测试

**位置**：`server/tests/monitoring/webhookNotifier.test.ts` + 扩展 `alertEngine.test.ts`

**实现要点**：
1. webhookNotifier 单测：四种格式 payload 正确性 / 失败不抛 / 重试一次 / 速率冷却
2. alertEngine 集成：openAlert 触发 notify('opened')、resolveAlert 触发 notify('resolved')、升级触发 notify('escalated')、notifier 抛错不影响 evaluate 返回
3. **必测**：未注入 notifier（默认 NullNotifier）时全部既有用例不受影响

**验收标准**：配置真实 webhook URL 后手动触发一次 critical 告警（可用 `scripts/seed-monitor-alert.ts` 改造），外部群收到消息；后端测试全绿且新增 ≥12 用例；通知失败场景（错误 URL）不影响告警落库。

---

## 模块 D：数据治理与负载优化（P1）

**目标**：解决「表无限膨胀」与「轮询全量传输」两个长期运行隐患。

### D1 monitor_reports 保留期清理

**位置**：`server/src/database/monitorStore.ts` + `server/src/monitoring/scheduler.ts`

**实现要点**：
1. `monitorStore.ts` 新增 `purgeReportsBefore(timestampMs): Promise<number>`（参照 `purgeResolvedBefore` 的容错写法，返回 -1 表失败）
2. scheduler 的 `maybePurge` 扩展：清完 alerts 后也清 reports（保留期建议 90 天，`retentionDays` 拆成 `alertRetentionDays` / `reportRetentionDays` 两个选项，默认 30/90）
3. `SchedulerHealth` 增加 `lastPurgeReportsCount` 字段，/monitor/health 可见
4. 单测：清理成功 / 清理失败不影响采样 / 两表清理互不阻塞

### D2 /metrics 历史降采样

**位置**：`server/src/routes/monitor.ts` + `src/views/admin/Monitor.vue`

**实现要点**：
1. 路由支持 `?points=60`（默认 60，上限 300）：`history()` 全量取出后等距抽样（保留首尾点）
2. 前端 sparkline 只需趋势，60 点足够；`Monitor.vue` 请求加 `points: 60`
3. **不降采样 latest 与 requests**（实时数据保持原样）
4. 单测：points 参数边界（非法值回退默认、超上限截断、等距抽样首尾保留）

**验收标准**：`/metrics` 响应体从 ~全量 300 点降到 ≤60 点（体积约降 80%）；面板 sparkline 视觉无明显劣化（截图对比）；全量测试绿。

---

## 模块 E：细节打磨（P2）

**目标**：清掉评审 L 级问题，每个任务 ≤30 分钟，可穿插执行。

### E1 browser 字段限长（L1）

**位置**：`server/src/routes/monitor.ts` reports 路由
**要点**：`JSON.stringify(body.browser).length > MAX_PAYLOAD_BYTES` 时截断或拒绝（413），与 payload 同待遇。补 1 用例。

### E2 回报列表分页（L2）

**位置**：`routes/monitor.ts` GET /reports + `monitorStore.listReports` + `Monitor.vue`
**要点**：对齐 alerts 的 limit/offset 模式；前端回报区加「加载更多」按钮（追加式，不做完整分页器）。补 2 用例。

### E3 hitAgain 时间戳统一（L3）

**位置**：`server/src/monitoring/alertEngine.ts:287`
**要点**：`updatedAt: Date.now()` 改为接收 sample.timestamp（evaluate 传入）。补 1 用例断言 updatedAt 等于采样时间。

### E4 searchByRequest 滚动定位（L4）

**位置**：`src/views/admin/Monitor.vue:477`
**要点**：loadReports 完成后 `nextTick` 对回报区容器 `scrollIntoView({ behavior: 'smooth' })`；回报区加 `ref="reportSection"`。扩 B1 的测试用例。

---

## 模块 F：远期演进（P3 · 仅设计预留，不实现）

| # | 方向 | 预留点 |
|:--|:--|:--|
| F1 | 多实例指标聚合 | 单实例内存环形缓冲是当前限制；未来引入集中式存储（TimescaleDB/ClickHouse）时，collector 的 `MetricSample` 结构与环形缓冲解耦良好，可直接加 `Sink` 接口外发 |
| F2 | 告警静默/抑制规则 | Notifier 接口（C1）已把「告警事件流」抽象出来，静默规则可在 notify 前插入过滤器链 |
| F3 | 趋势报表 | monitor_alerts 已有 `idx_alerts_status_created` / `idx_alerts_rule_created` 两索引，周报/月报聚合查询无需改表 |

---

## 执行顺序与里程碑

| 阶段 | 内容 | 出口标准（全部满足才进下一阶段） |
|:--|:--|:--|
| 1 | 模块 A 全部 | 工作树干净；621/621 + 391/391 全绿 |
| 2 | 模块 B 全部 | Monitor.vue 覆盖 ≥80%；前端测试 ≥399 |
| 3 | 模块 C 全部 | webhook 真实通道收发验证通过；后端新增 ≥12 用例 |
| 4 | 模块 D 全部 | /metrics 体积降 ~80%；双表清理生效 |
| 5 | 模块 E 全部 | L 级问题清零；lint/typecheck/test 三绿 |
| — | 模块 F | 不排期，评审后再启动 |

> 每完成一个阶段，更新 `docs/TODO.md` 的 MON 任务追踪表勾选状态，并在 CHANGELOG.md 记一行。
