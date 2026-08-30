# 监控系统与告警回报模块评审报告

- 评审日期：2026-08-29
- 评审对象：监控系统与告警回报系统（最新模块，v1.6.2 之后新增）
- 评审方式：代码走查（后端 6 文件 + 前端 2 文件 + schema + 挂载点）+ 测试覆盖核对

---

## 1. 模块范围

| 层 | 文件 | 职责 |
|---|---|---|
| 采集 | `server/src/monitoring/collector.ts` | CPU/内存/事件循环/DB 连接池/Redis 采样，环形缓冲 300 点，请求窗口统计 |
| 判定 | `server/src/monitoring/alertEngine.ts` | 6 条分级阈值规则，连续点数抑制毛刺，冷却去重，自动恢复，认领 |
| 调度 | `server/src/monitoring/scheduler.ts` | 5s 一次 tick 串起采集+评估，健康追踪 + 连续失败自警，过期告警清理 |
| 持久化 | `server/src/database/monitorStore.ts` | 告警落库（历史追溯）+ 前端回报落库，全读写容错降级 |
| 契约 | `server/src/monitoring/alertRepository.ts` | 仓储接口 + 内存实现（测试/降级用） |
| 路由 | `server/src/routes/monitor.ts` | /metrics /health /alerts /alerts/:id/ack /reports（admin 保护，reports 限流） |
| 表 | `monitor_alerts` / `monitor_reports` | 告警事件与前端回报（schema.ts） |
| 前端 | `src/views/admin/Monitor.vue` + `src/services/monitorService.js` | 监控面板 + 埋点回报（sendBeacon Blob） |

## 2. 总体评价

**架构质量高，可评为「生产就绪候选」级别。** 分层清晰（采集/判定/调度/存储各自独立），依赖注入完备（采集器与路由全部外部依赖可注入），容错设计是这个模块最突出的优点——从「监控系统自身故障」到「单条规则取值异常」都有明确兜底。测试覆盖在同类模块中属上游水准。

## 3. 亮点（值得保持）

1. **「谁来监控监控者」闭环**：scheduler 连续失败 ≥3 次进入内存自警，/monitor/health 对外暴露自检状态，/metrics 携带调度摘要——监控系统自身故障可被外部探活发现。
2. **容错降级分层**：仓储读写故障静默+日志；Redis ping 失败降级为 offline；单规则 extract 抛错只跳过该规则（ENG-07）；非有限值视为不适用。
3. **错误链路串联**：请求中间件（注册在全部业务路由之前）把 requestId/状态码/耗时写入采集器窗口，告警快照携带同期 5xx 请求，前端回报可按 requestId 检索——前后端证据可串成一条链路。
4. **告警阈值可热调**：`MONITOR_THRESHOLDS` 环境变量 JSON 覆盖，只允许改 warn/critical，非法配置整体回退，8 条单测覆盖。
5. **时间戳 bug 有回归防线**：`toUnixSeconds` 统一换算 + 回归测试，规避了「参数先除 1000、SQL 再除 1000」落 1970 年的历史坑。
6. **安全细节**：匿名回报端点限流 10/min/IP、payload 64KB、message 2000 字符、类别白名单校验、admin 权限保护全部读接口。

## 4. 测试覆盖核对

| 位置 | 文件 | 规模 | 状态 |
|---|---|---|---|
| 后端 | `monitoring/alertEngine.test.ts` | 402 行 | ✅ |
| 后端 | `monitoring/collector.test.ts` | 272 行 | ✅ |
| 后端 | `monitoring/scheduler.test.ts` | 225 行 | ✅ |
| 后端 | `database/monitorStore.test.ts` | — | ✅ |
| 后端 | `routes/monitor.test.ts` | 413 行 | ✅ |
| 前端 | `services/monitorService.test.js` | 183 行 | ✅ |
| 前端 | `views/admin/Monitor.vue` | **缺失** | ❌ 盲区 |

> 后端共 1495+ 行测试覆盖采集、判定、调度、存储、路由五个环节；**前端监控页面（24KB 组件）无任何组件测试**，是当前唯一明确盲区。

## 5. 问题清单

### 5.1 中等问题（建议近期修复）

| # | 问题 | 位置 | 影响 | 建议 |
|---|---|---|---|---|
| M1 | **前端 Monitor.vue 无组件测试** | `tests/views/admin/` 缺 Monitor.test.js | 面板逻辑（轮询、筛选、认领、快照展开、回报弹窗）无回归防线 | 参照 Dashboard.test.js 补组件测试，mock monitorService |
| M2 | **monitor_reports 表无数据保留清理** | `monitorStore.ts` | 前端回报只增不减，长期运行表无限膨胀 | 为 reports 增加与 alerts 相同的过期清理（如 90 天），或按数量上限清理 |
| M3 | **/metrics 每 5s 全量返回 300 点完整历史** | `routes/monitor.ts` + `Monitor.vue` | 每个 sample 含 eventLoop/dbPool/redis 嵌套对象，轮询带宽浪费；数据量大后拖慢面板 | 后端降采样（如每 5 点取 1）或前端仅拉 sparkline 所需字段；或加 ?points=60 参数 |
| M4 | **类声明行格式错误**：`export class AlertEngine {  private readonly...` 双空格 | `alertEngine.ts:166` | 风格不一致，lint 隐患 | 修正为换行或单空格 |
| M5 | **注释指向错误文件**：头注释写「MySQL 实现见 database/alertStore.ts」，实际在 `database/monitorStore.ts` | `alertRepository.ts:4` | 文档误导，后续维护者找错文件 | 修正注释 |

### 5.2 轻微问题（打磨项）

| # | 问题 | 位置 | 建议 |
|---|---|---|---|
| L1 | browser 字段无大小校验（payload 有 64KB 限制，browser 没有） | `routes/monitor.ts` | 对 browser JSON 序列化长度同样限 64KB |
| L2 | 回报列表无分页 offset（告警列表有 limit/offset） | `routes/monitor.ts` `/reports` | 对齐 alerts 的分页能力 |
| L3 | `hitAgain` 用 `Date.now()` 而 openAlert 用 `sample.timestamp`，updatedAt 语义不统一 | `alertEngine.ts:287` | 统一用 sample.timestamp |
| L4 | `searchByRequest` 注释声明「滚动定位」但未实现 | `Monitor.vue:477` | 补 scrollIntoView 或改注释 |
| L5 | `getRules()` 将 extract 内部函数原样暴露在 public API | `alertEngine.ts:327` | 仅返回可序列化字段（路由已解构丢弃，属防御性收尾） |
| L6 | Monitor.vue 硬编码颜色（#e24b4a/#ef9f27/#1d9e75）与 CSS 变量混用 | `Monitor.vue` | 纳入 CSS 变量迁移计划统一处理 |

### 5.3 潜在风险（架构演进方向）

| # | 风险 | 说明 |
|---|---|---|
| R1 | **单实例内存环形缓冲** | 多实例部署时各实例只有自己 5 分钟数据，无全局聚合；当前单实例场景可接受，需在架构文档中标注限制 |
| R2 | **告警无外部通知通道** | 告警仅落库 + 日志，需人工打开面板才能发现——「告警系统」缺最核心的「报警」能力 |
| R3 | **evaluate 与 ack 并发竞态** | 极低概率（5s tick vs 手动认领），当前可接受，无需处理 |

## 6. 下一步开发建议（按优先级）

### P0 —— 收尾（建议本周内）
1. **提交当前 82 个未提交文件**：监控模块代码 + 24 个 VER-1/VER-2 文档变更混在工作区，先审查 diff 再分批提交，避免一次性大提交掩盖问题。
2. **补 Monitor.vue 组件测试**（M1）：mock monitorService，覆盖轮询启停、状态/级别筛选、认领、快照展开收起、回报弹窗提交流程。
3. **修 M4/M5**：alertEngine 格式 + alertRepository 注释，2 分钟级改动。

### P1 —— 核心价值增强（下一步开发主攻）
4. **告警外部通知通道（最高价值）**：接入通用 webhook（企微/钉钉/飞书），critical 告警即时推送；设计上保持与现有「规则→判定→通知」解耦，新增 `Notifier` 接口 + `WebhookNotifier` 实现，告警引擎在 openAlert / resolveAlert 时触发。
5. **monitor_reports 清理机制**（M2）：对齐 alerts 的保留期清理，纳入 scheduler 的 maybePurge。
6. **/metrics 负载优化**（M3）：history 降采样或按需点数参数。

### P2 —— 体验与健壮性
7. 补 L1（browser 限长）、L2（reports 分页）、L3（时间戳统一）、L4（滚动定位）。
8. RUM 联动增强：前端 slow_page 回报与后端事件循环/5xx 告警在面板上交叉展示。
9. 告警面板增强：按规则聚合统计、告警趋势图、导出。

### P3 —— 远期
10. 多实例指标聚合（R1）：引入集中式采样存储（如 TimescaleDB/ClickHouse）支持长期趋势分析。
11. 告警静默/抑制规则、按 severity 路由不同通知通道、值班轮换。
12. 指标持久化 + 报表：周报/月报自动生成（资源水位、错误率、告警分布）。

---

## 7. 结论

监控模块**通过评审，可继续演进**。当前架构与质量足以支撑小规模生产，优先补上「前端组件测试」与「告警外部通知」两块，就能从「可观测看板」升级为「真正能报警的监控系统」。遗留的中等问题（M1–M5）均无架构性阻碍，属增量式完善。
