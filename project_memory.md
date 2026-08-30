# 项目记忆（project_memory.md）

> **最后更新**: 2026-08-30
> **当前版本**: v1.6.4
> **当前阶段**: 监控模块评审闭环完成（A-E 全落地）——告警外部通知上线、数据治理完成、前端测试盲区消除

---

## 项目概况

- **名称**: Star Citizen 战队宣传网站（Stellar Nexus）
- **架构**: Vue 3 + Vite 8 前端 / Express 4 + TypeScript 后端（三层 Routes→Services→DB）
- **存储**: MySQL 8.0（主库，11 张表）+ PostgreSQL/pgvector（AI 向量库）+ Redis（LLM 缓存）
- **AI**: 多 Provider 降级链（豆包/DeepSeek/Anthropic，无 key 自动 disabled 不阻断启动）
- **测试**: 后端 58 套件 / 656 tests；前端 45 套件 / 404 tests；前端覆盖率门禁 49/42/42/47（lines/funcs/branches/stmts）
- **安全**: JWT httpOnly cookie + helmet + 速率限制 + metrics IP 白名单

## 当前进度（2026-08-30 实测）

- [x] v1.6.2 上线前评审修复（js-yaml CVE、覆盖率门禁、版本对齐）
- [x] 本地连通性全链路实测通过（见下方验证记录）
- [x] 后端资源监控与告警回报系统（采集器/告警引擎/Admin 面板/前端回报）
- [x] 监控系统稳定性加固（仓储容错降级 / 调度器自警 / 数据保留清理 / 阈值环境变量覆盖 / 自检端点）
- [x] RUM sendBeacon Content-Type 修复（Blob 包装）
- [x] AdminLayout / Profile 登录态读取 bug 修复（authService.getUser 不存在）
- [x] 告警外部通知系统（Notifier + WebhookNotifier 四格式，opened/resolved/escalated）
- [x] 监控数据治理（reports 90 天清理 / /metrics 降采样 300→60）
- [x] Monitor.vue 组件测试（12 用例，行覆盖 94.15%，消除前端盲区）
- [x] 监控模块细节打磨（browser 限长 / reports 分页 / 时间戳统一 / 滚动定位）
- [x] 仓库收尾（84 个未提交文件分 6 组提交；临时诊断脚本清理；.gitignore 补 *.bak）
- [ ] 正式上线部署（nginx + certbot production profile 未启用）

## 本地运行环境拓扑（实测验证 2026-08-29）

| 服务 | 端口 | 说明 |
|------|------|------|
| Vite dev | 5173 | `npm run dev`，/api 代理→3001 |
| 后端 API | 3001 | `cd server && npx tsx src/index.ts`（dev 用 tsx，不用 dist） |
| MySQL | **3306** | ⚠️ **2026-08-29 起当前开发库是本机原生 MySQL80 服务（3306）**，users=10 条含 08-21 至今数据，当前后端实测连接此库 |
| MySQL 旧库 | 3307 | Docker 容器 `sc-mysql-dev`（数据停在 08-28 晚，users=7 条）—— **双库分叉**：勿再用 `DB_PORT=3307` 启动，会静默连旧库造成"数据丢失"错觉 |
| Redis | 6379 | Docker 容器 `sc-redis-dev`（后端需 REDIS_URL=redis://127.0.0.1:6379；AI recruiter 端点在 Redis 宕机时会挂起 ~16s 才 500） |
| WebSocket | 3001/ws | 与 HTTP 同端口，**3003 是死配置** |

### 启动命令（2026-08-29 实测有效）

```bash
docker start sc-redis-dev   # Redis 必须运行，否则 AI 链路挂 16s
cd server && npx tsx src/index.ts   # .env.development 现指向 3306 原生库
# 根目录另开终端
npm run dev
```

### 环境坑位

- ⚠️ **双 MySQL 库分叉（2026-08-29）**：3306 原生服务（当前开发库）与 3307 `sc-mysql-dev` 容器（08-28 前旧库）并存。08-28 记忆中的 3307 启动命令已过时
- `server/.env.development` 的 DB_PORT 在 3306/3307 间被反复改动过（存在 .bak），2026-08-29 实测定为 3306 并修正
- `npx tsx` 被 kill 后会残留孤儿 node 进程占住 3001（需 `netstat -ano | grep 3001` 找 PID 再 taskkill）
- 后端 config 加载时强制校验 JWT_SECRET（≥32 字符）；test 环境除外
- LLM provider key（DOUBAO/DEEPSEEK/ANTHROPIC_API_KEY）开发环境未配置 → AI 聊天流必报"AI 服务暂时不可用"，属预期配置缺失非 bug

### 验证记录（2026-08-29）

- `node scripts/real-write-test.mjs http://localhost:3001` → **5/5 通过**
- 写端点全量探测（scripts/write-endpoints-probe.mjs，admin cookie）→ **11/11 通过**
- Vite 代理 POST body 转发实测正常（注册/申请经 5173 代理 201 落库）
- AI session：Redis 恢复后 2ms/200（修复前 15.9s/500）
- 前端 vitest 378/378；server jest 511/511

## Hard Constraints（延续）

1. 任务串行，禁止并行推进多阶段
2. 测试先于实现（TDD）
3. 验证先于完成（声称完成前必须运行验证命令）
4. 设计先于编码（新功能先过 brainstorming）

## Engineering Conventions（延续）

- async/await 一律（ARCH-01）；三层 Routes→Services→DB
- CSS 变量 CI lint（ENG-04）；依赖版本锁定（ENG-05）
- 技术债务编号追踪 TD-N；教训标签化 SEC/ARCH/QUAL/DES/DBG/ENG/PM
- CHANGELOG 记录根因（PM-03）；质量门禁可量化（PM-04）

## Architecture Decisions

| 日期 | 决策 | 理由 |
|------|------|------|
| 2026-08 (v1.6.x) | knexfile 工厂函数化 | 修复三环境配置共享引用污染（TD-11） |
| 2026-08 (v1.6.1) | Service update 用 affectedRows 判 404 | 移除冗余前置 SELECT，3 次查询降 2 次（TD-7） |
| 2026-08-24 | server js-yaml override 4.3.1 | 修复 CVE-2026-59870 高危 |
| 2026-08-24 | 覆盖率门禁 49/42/42/47 | 基于实测覆盖率设定有约束力的门禁 |
| 2026-08-26 | backend 端口收紧 127.0.0.1 | 攻击面收敛 |
| 2026-08-28 | WS 挂主端口 /ws 路径（3003 死配置） | 前端无实际 WebSocket 调用，配置项保留未接线 |
| 2026-08-29 | 监控系统自研（采集器 + 告警引擎 + 内存环形缓冲 + MySQL 落库 + Admin 面板） | 零外部运维组件，紧密集成本项目技术栈 |
| 2026-08-29 | 告警内存指标从 `heap_used_percent` 改为 `rss_percent` | V8 常态堆占用 90%+，heap 阈值会持续误报；RSS 才是 OOM 风险真指标 |
| 2026-08-29 | `sendBeacon` 统一用 Blob 包装 `application/json` | 浏览器强制 text/plain 与后端 `express.json()` 不兼容，QUAL-05 同类问题 |
| 2026-08-29 | 仓储层全部读写容错降级（读故障→null/[]，写故障→静默+日志） | DB 故障不能让告警评估链路瘫痪，恢复后自动收敛 |
| 2026-08-29 | 调度器自带健康追踪与内存自警（连续失败 ≥3 次） | 「谁来监控监控者」：监控自身瘫痪必须能被 /monitor/health 探活发现 |
| 2026-08-29 | 已恢复告警默认保留 30 天，调度器每小时清理 | 防止 monitor_alerts 无限增长；active/acked 永不清理 |
| 2026-08-29 | 告警阈值支持 `MONITOR_THRESHOLDS` 环境变量覆盖 | 调阈值无需改代码重启；非法配置整体回退默认 |
| 2026-08-30 | 告警通知抽象为 `Notifier` 接口 + `NullNotifier` 默认实现 | 未配置 webhook 时零开销、既有测试零破坏；通知失败绝不影响告警主链路 |
| 2026-08-30 | webhook 通知器同规则 60s 速率冷却 + 失败重试 1 次 | 防止告警风暴刷爆外部 webhook；通知尽力而为 |
| 2026-08-30 | `purgeReportsBefore` 独立函数支持 deps 注入 | 与告警仓储解耦，且让 ts-jest ESM 测试无需 jest.mock 模块（避开 ESM mock 兼容坑） |
| 2026-08-30 | `/metrics` 历史降采样默认 60 点（`?points` 参数） | 300 点全量每 5s 轮询浪费带宽；等距抽样保留首尾，趋势不变 |

## Lessons Learned（本次新增）

- DBG-14: kill 带 npx 前缀的后台进程时，实际监听端口的 tsx/node 子进程可能残留，重启前必须检查端口占用
- ENV-01: 项目 .env 端口配置与实际容器拓扑漂移（3306 vs 3307、WS 3003 vs 实际 3001/ws），覆盖式启动参数优于改文件 → **2026-08-28 已修复；2026-08-29 再次漂移**（.env.development DB_PORT 被改回 3307 而实际库在 3306，已实测修正，见 DBG-19）
- DBG-15: pg0 内嵌 PostgreSQL 二进制（数据卷内）与更新后镜像的系统库 ABI 不匹配（libicuuc.so.70 vs 镜像 libicu 76）→ postgres 起不来、API 静默挂起 ~55s 后 ExitCode 0、无限重启循环且**无任何错误日志**。诊断抓手：卷内 `instances/*/data/` 的 start.log/postgresql-*.log 时间戳停在旧日期 + 手动跑 pg_ctl 报缺库。修复：拉最新镜像让 pg0 重装匹配的 postgres（数据卷同大版本可复用）
- DBG-16: `paginatedQuery` 的 countFrom 参数与带表别名的 WHERE 条件冲突——count SQL 用无别名的表名复用 `别名.` 前缀条件必报 Unknown column。多对一 JOIN 直接省略 countFrom 让 count 复用完整 from（2026-08-29 已修 applicationService + JSDoc 示例）
- DBG-17: Service 层字段（Application.note）与 schema.ts/建表 SQL 脱节，管理员审核申请从上线起一直 500——新加字段必须同步 DDL（schema.ts）并对存量库执行 ALTER，两步缺一不可（2026-08-29 已修）
- DBG-18: AI 链路排查看似"前端数据后端收不到"，实际是 ioredis 连接宕掉的 Redis 时 maxRetriesPerRequest=3 令请求挂 ~16s 才 500；前端 fetch 无超时放大为"没反应"。诊断抓手：curl 计时 + docker ps 看 sc-redis-dev 是否 Up
- DBG-19: 双 MySQL 库分叉（3306 原生 vs 3307 容器）+ .env 被反复改动（.bak 残留）导致"后端连错库"类故障的根因排查要从**运行中进程实际连接的端口**入手（mysql2 探测各端口库内容对比），而非盲信 env/记忆记录
- QUAL-05: 实现改用 Blob 包装 sendBeacon payload（修复 text/plain 导致后端 400 的老问题）时测试断言未同步——改协议的实现必须同步测试（2026-08-29 已补断言，vitest 全绿）
- DBG-20: 时间戳换算重复除 1000（SQL 用 `FROM_UNIXTIME(? / 1000)` 但参数已传秒）会让所有告警 `created_at` 落在 1970 年，同时让冷却判定 `sample.timestamp - createdAt` 差值巨大 → 冷却完全失效、每次采样都新建告警。回归保护：统一 `toUnixSeconds(ms)` 函数 + 单测锁死量级
- ENG-06: Node.js 堆占用率（`heapUsed / heapTotal`）不适合做固定阈值告警——V8 会把堆用到接近上限才触发 GC，健康进程长期 90%+。内存告警应改用 **RSS 占系统内存比例**
- SEC-02: 匿名可写的问题回报端点必须限流 + payload 大小上限，否则易被刷写
- QUAL-06: 前端 auth store 未做登录态持久化恢复，整页刷新后 admin 页面会被重定向到登录页；admin 布局组件还调用不存在的 `authService.getUser()` 导致所有 admin 页面白屏。修复后统一走 `useAuthStore()`
- ENG-07: 规则引擎的 extract 函数必须防御非有限值（undefined/NaN/Infinity）——不完整采样会让评估抛 TypeError，进而误触调度器自警；单规则取值异常也应 try/catch 隔离，不拖垮整轮评估
- DBG-21: **ts-jest ESM 下 `jest.mock` 模块 + 运行时 `import()` 会触发 'Unexpected token export' / 'import after Jest teardown'**（monitor.test.ts 动态导入、monitorStore.test.ts mock pool.js 均中招）。规避：动态 import 一律改顶部静态导入；需要替身的模块改为给生产函数加 `deps?` 注入参数而非 jest.mock（2026-08-30）
- DBG-22: 大函数编辑（如给 purgeReportsBefore 加注入参数）可能误删闭合括号，typecheck 报 TS1005——多文件改完必须跑一次 `npm run typecheck` 兜底，而不是只跑测试（测试套件加载失败即语法错误信号）
- DBG-23: vitest `--coverage` 会先删除已有 coverage/ 目录，沙箱拦截导致 Unhandled Error；用 `--coverage.reportsDirectory` 指向临时目录可绕过

## Change Log

| 日期 | 变更 |
|------|------|
| 2026-08-29 | 排查"前后端互联数据收不到"：实测证明 JSON body 转发链路（fetch/vite proxy/express.json）全程正常；定位并修复 3 个真实问题：① paginatedQuery countFrom 别名冲突（GET /applications?status 500→200）② applications 表缺 note 列（审核申请 500→200，schema.ts+3306/3307 双库 ALTER）③ Redis 容器未运行（AI 端点挂 16s→2ms）。修正 .env.development DB_PORT 3306。新增 scripts/write-endpoints-probe.mjs 全端点探测脚本 |
| 2026-08-29 | 同步 analyticsService Blob 实现的测试断言（2 个既有失败清零）；前端 vitest 378/378、server jest 511/511 全绿；AI 聊天待配置 LLM key（DOUBAO/DEEPSEEK/ANTHROPIC_API_KEY） |
| 2026-08-29 | **新增后端资源监控与告警回报系统**：5 秒采集 CPU/RSS/事件循环/DB/Redis/接口错误；告警引擎分级阈值 + 冷却去重 + requestId 快照；MySQL `monitor_alerts` / `monitor_reports` 表；Admin「系统监控」面板；端到端 10/10 验证通过。后端 593/593、前端 391/391 全绿 |
| 2026-08-29 | **修复 RUM sendBeacon 未包 Blob 导致后端 400**：`rumService.js` 现在用 `Blob([body], { type: 'application/json' })`，浏览器验证 text/plain→400、Blob→204 |
| 2026-08-29 | **修复 Admin 页面白屏**：AdminLayout.vue / Profile.vue 调用不存在的 `authService.getUser()`，改为 `useAuthStore()`。同时 Profile.test.js 注入 Pinia 适配新依赖 |
| 2026-08-29 | **监控系统稳定性加固**：仓储层读故障降级（null/[]）；调度器健康追踪 + 连续失败 3 次内存自警；`/monitor/health` 自检端点；过期告警 30 天保留期自动清理；`MONITOR_THRESHOLDS` 环境变量覆盖阈值；前端面板自检状态灯。后端 621/621、前端 391/391、端到端 10/10 全绿 |
| 2026-08-30 | **监控模块评审闭环（v1.6.4）**：A 仓库收尾（84 文件分 6 组提交 + M4/M5 修复）；B Monitor.vue 组件测试 12 用例（行覆盖 94.15%）；C 告警外部通知系统（Notifier + WebhookNotifier 四格式 + 三事件触发）；D 数据治理（reports 90 天清理 + /metrics 降采样）；E 细节打磨（browser 限长 / reports 分页 / 时间戳统一 / 滚动定位）。后端 656/656、前端 404/404、typecheck 0 错误，工作树干净 |
| 2026-08-28 | 全链路连通性实测通过（smoke 11/11 + write 5/5 + WS + 代理）；启动 Redis 容器 sc-redis-dev；重建本记忆文件 |
| 2026-08-28 | 修复 env 漂移（DB_PORT 3307、REDIS_URL、VITE_WS_URL 3001/ws）；修复 hindsight-local 崩溃循环（根因: pg0 instance.json 0字节损坏，移开即恢复）；LLM 最终定为用户主模型 glm-5.3-flash（opencode zen 端点，key 复用 OpenCode CLI 凭据），retain ~50s，70+ 条历史记忆完好 |
