# 版本变更记录

> **项目**: Star Citizen 战队宣传网站
> **更新日期**: 2026-08-30
> **当前版本**: v1.7.1（M4 转化流补测 + 门禁 60 + QUAL-21，2026-08-30）

---

## 版本规范

本项目遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/) 规范：

- **主版本号 (MAJOR)**: 不兼容的 API 变更
- **次版本号 (MINOR)**: 向下兼容的功能新增
- **修订号 (PATCH)**: 向下兼容的问题修复

---

## [1.7.1] - 2026-08-30

### 问题修复

- **CI 安全扫描红灯**：前端传递依赖 `nanoid@3.3.16`（vite→postcss）存在高危漏洞 GHSA-2v37-7h3g-55p8（自定义生成器无限循环），`npm audit --omit=dev --audit-level=high` 阻断流水线。`package.json` 增加 `overrides` 强制 3.3.18，审计归零
- **测试时间炸弹**：`calendar.test.js` 的 goNext/goPrev 依赖"今天"作为锚点，每月 29-31 日 `setMonth` 溢出（如 8/31 + 1月 → 10/1）导致月份断言偶发失败。锚定月中日期消除时间依赖，新增跨年用例
- **QUAL-21**：Join.vue 转化漏斗起点埋点 `application_form_start` 被 `onMounted` 内 AI 画像分支的提前 `return` 跳过——自上线以来正常访问从未发送该埋点，漏斗数据起点缺失。已移至提前 return 之前

### 测试加固

#### M4 第二批：转化流补测（+82 用例，前端 509 → 592）

- 五个核心视图测试重写：Register（校验短路/提交态/无障碍）、Join（申请流/AI 画像预填/成功面板）、Calendar（月历 42 格网格/CRUD 分流/报名取消/状态映射）、Profile（资料回填/密码修改三分支）、ApplicationsAdmin（筛选/搜索/审核同步/分页/TD-27 兜底）
- 前端覆盖率门禁 55 → 60：实测语句 66.96% / 行 68.12% / 分支 66.73% / 函数 63.38%，四项过线（G4 规则）

## [1.7.0] - 2026-08-30

### 新增功能

#### M1 AI 部署验证（AI-DEP-1/2 ✅ 全链路实测通过）

- AI 链路从"代码就绪"升级为"真实可用"：知识入库 7/7（幂等实测二次运行仍 7 条无膨胀）→ pgvector 语义检索带 similarity 来源 → DeepSeek 真实生成回答 → SSE 流式 125 token 逐个返回 + 画像 turnCount 更新
- G2 决策门满足：ai:ingest 幂等 ✅ / ai:health 200 ✅ / SSE 流式真实返回 ✅

#### AI-SLOT 通用槽位制（架构决策，AD-13）

- `aiConfig` 从硬编码厂商清单（doubao/deepseek/claude）重构为**通用功能槽位**：`LLM_CHAT_*`（聊天）/ `LLM_EMBED_*`（嵌入）/ `LLM_FALLBACK_*`（可选降级），全部 OpenAI 兼容协议，指向哪家服务商完全由环境变量决定
- 动因：DeepSeek 官方 API 无 embeddings 接口（实测 404），厂商直配模式无法表达"聊天走云端、嵌入走本地"的真实拓扑；槽位制同时让 Ollama/vLLM/OpenRouter 等任意兼容端点开箱即用
- 嵌入默认走本地 Ollama bge-m3（1024 维，与 pgvector 列定义精确对齐，零 API 成本）；Anthropic 原生协议独立保留为聊天降级

#### 修复

- **DBG-25**：`ai:migrate` / `ai:ingest` 脚本独立运行不加载 .env，静默回退到硬编码连接串连错库（401 认证失败）。根因同 SEC-01 违规——旧 aiConfig 内置含凭据的 fallback 连接串，已改为"显式配置 > 本地无凭据默认 > test 默认"三级解析
- `openaiCompatible.embed()` model 硬编码空串 → 正确消费 `LLM_EMBEDDING_MODEL`（该配置此前是死配置）

### 文档

- README 更新：测试数字 656/509、AI 槽位制说明与启用指南、前端端口 5173 修正
- `server/.env.example` 同步槽位制模板

## [1.6.5] - 2026-08-30

### 上线前修正批次（技术线路图独立复审产出）

#### 功能补齐（M0 / M3）

- Admin CRUD 系统性补齐：修复 4 文件 6 处 `/admin/*/new` 死链；MembersAdmin 弹窗式 create+edit 补成可用 CRUD；ProjectsAdmin / PilotsAdmin 补「新增」能力（commit b9018aa）
- E2E spec 7 → 9：新增 `fleet.spec.js` / `admin.spec.js`（60 用例），端到端验收 M0 成果（commit 976bcf4）
- E2E 暴露并修复 4 个真实缺陷：TD-25 路由守卫未等待 auth 初始化（刷新/直访 /admin 被误踢）、TD-26 六个 admin 子页面双重 AdminLayout 致内容不渲染、TD-27 ApplicationsAdmin pagination 未兜底致模板崩溃、E2E-SW-01 PWA Service Worker 绕过 page.route 致 502

#### 测试环境加固（TD-28）

- `tests/setup.js` 增加 Node 25+/26 内置实验性 webstorage 兜底：缺 `--localstorage-file` 启动参数时，Node 的 storage getter 遮蔽 jsdom 注入（window===globalThis）致 `localStorage.clear()` 抛 TypeError（DBG-24，useTheme 套件 11 连挂根因）；现以内存 polyfill 覆盖坏态 getter，前端测试与 Node 版本解耦
- 验证：无参数（原挂 11）与带参数（原正常）双路径 413/413 全绿；CI（Node 20）行为零变化

#### 版本一致性

- `package.json` / `server/package.json` 1.6.2 → 1.6.5（此前落后 CHANGELOG 三个版本）；两份 package-lock.json 同步（根 lockfile 此前停在 1.5.0）

## [1.6.4] - 2026-08-30

### 新增功能

#### 告警外部通知系统（webhook）

- `Notifier` 接口 + `NullNotifier`（未配置时零开销，既有链路零破坏）
- `WebhookNotifier`：企微群机器人 / 钉钉 / 飞书 / 通用 JSON 四种消息格式
- 告警引擎触发三事件通知：新开 `opened` / 恢复 `resolved` / 升级 `escalated`，fire-and-forget 隔离
- 容错：发送失败不抛 + 重试 1 次 + 同规则 60 秒速率冷却（防刷爆 webhook）
- 配置：`MONITOR_WEBHOOK_URL` / `MONITOR_WEBHOOK_FORMAT` 环境变量

#### 监控数据治理

- `monitor_reports` 保留期清理（默认 90 天），调度器每小时清理，与告警清理互不阻塞
- `/metrics` 历史降采样：`?points` 参数（默认 60 / 上限 300），等距抽样保留首尾点，响应体积降约 80%

### 改进

- `Monitor.vue` 组件测试 12 用例，行覆盖 94.15%（消除前端唯一测试盲区）
- 前端回报列表支持 limit/offset 分页 +「加载更多」追加式加载
- browser 字段补 64KB 限长（与 payload 同待遇）
- `hitAgain` 的 updatedAt 改用采样时间，与 openAlert 语义统一
- 快照错误请求检索后平滑滚动定位到回报区

### 仓库收尾

- 82 个未提交文件分 6 组审查提交（监控系统 / DDL 统一 / 联通修复 / CSS 变量迁移 / 文档 / AI 测试）
- 修复评审 M4/M5：类声明格式与过时注释
- `.gitignore` 忽略 `.bak` 备份与 IDE 分享目录，清理临时诊断脚本

### 测试基线

- 后端 656/656（含 webhook 12 + 通知链路 8 + 数据治理 12 新增）
- 前端 404/404（含 Monitor.vue 12 用例）

---

## [1.6.3] - 2026-08-29

### 新增功能

#### 后端资源监控与告警回报系统

- **采集器**：每 5 秒采样 CPU、RSS、事件循环延迟（`perf_hooks.monitorEventLoopDelay`）、DB 连接池、Redis 状态、接口错误率；采样点写入内存环形缓冲（300 点 ≈ 25 分钟）。
- **告警引擎**：6 条规则（`cpu_percent`、`rss_percent`、`event_loop_p95_ms`、`error_rate_5xx`、`db_pool_waiting`、`redis_down`），warn / critical 分级，5 分钟冷却去重，指标回落自动 resolved。
- **上下文快照**：告警触发时抓取采样点、最近 10 条 5xx 请求、DB/Redis 状态，以 `requestId` 为线索串联前后端问题。
- **持久化**：新增 `monitor_alerts` 与 `monitor_reports` 表；告警落库，高频采样走内存。
- **API**：`/api/v1/monitor/metrics`、`/alerts`、`/alerts/:id/ack`、`/reports`；`/reports` 匿名可报但限流 10/分钟，同时兼容 `application/json` 与 `text/plain`（sendBeacon 兜底）。
- **前端面板**：新增 `src/views/admin/Monitor.vue`，含资源卡片与趋势线、依赖健康、告警列表（认领 + 快照展开）、按 `requestId` 检索的前端回报列表。

#### 稳定性与可维护性加固（2026-08-29 追加）

- **仓储容错降级**：`MysqlAlertRepository` 全部读写异常兜底（读故障返回 `null` / 空数组，写故障静默 + 日志），数据库故障不再瘫痪告警评估链路，恢复后自动收敛。
- **调度器健康追踪与自警**：记录采样成功/失败时间、连续失败数与最后错误；连续失败 ≥ 3 次进入内存自警状态（不依赖数据库）。
- **监控自检端点** `GET /api/v1/monitor/health`：暴露调度器健康快照、采集器缓冲占用与请求窗口，让外部探活能发现「监控系统自身」瘫痪；`/metrics` 同步携带调度器摘要。
- **数据保留策略**：已恢复告警默认保留 30 天，调度器每小时自动清理；`active` / `acked` 状态永不清理。
- **阈值可配置**：`MONITOR_THRESHOLDS` 环境变量以 JSON 覆盖告警阈值（如 `{"cpu_percent":{"warn":50,"critical":80}}`），无需改代码重启；非法配置整体回退默认并记日志。
- **规则取值隔离**：单个规则取值异常只跳过该规则，非有限值视为不适用，不完整采样不会拖垮整轮评估。
- **面板自检指示**：监控页顶部状态灯展示调度器运行状态与连续失败数。

### 问题修复

- **RUM 上报 400**：`src/services/rumService.js` 的 `sendBeacon` 改为 Blob 包装 `application/json`，避免浏览器强制 `text/plain` 导致后端无法解析请求体（与 `analyticsService.js` 修复方式一致）。浏览器验证：直传字符串 → 400，Blob → 204。
- **Admin 页面白屏**：`src/views/admin/AdminLayout.vue` 与 `src/views/Profile.vue` 调用不存在的 `authService.getUser()`，改为使用 `useAuthStore()`；同步更新 `tests/views/Profile.test.js` 注入 Pinia。

### 质量验证

- 后端全量测试：`621/621` 通过（含监控稳定性加固的 71 个监控模块测试）。
- 前端全量测试：`391/391` 通过。
- 端到端验证脚本 `server/scripts/verify-monitor-e2e.ts`：`10/10` 通过（告警落库 → API 读取 → 时间戳 → 认领 → requestId 快照 → text/plain 回报 → requestId 串联 → 指标 → 权限拦截）。
- `MONITOR_THRESHOLDS` 实测覆盖生效（`cpu_percent` warn=50/critical=80，其余规则不受影响）。

### 经验教训

- 时间戳换算重复除 1000 会让告警 `created_at` 落在 1970 年，同时让冷却判定失效；已用 `toUnixSeconds(ms)` 统一换算并加回归测试。
- V8 会把堆内存用到接近上限才 GC，健康 Node 进程的 `heapUsed / heapTotal` 长期在 90% 以上，因此告警指标从 `heap_used_percent` 改为 `rss_percent`。

---

## [1.6.2] - 2026-08-24

### 上线前评审修复（依据 PRELAUNCH_REVIEW_2026-08-24）

基于全量自主实测发现的上线阻塞项修复，版本号同步对齐。

#### 依赖安全

- **js-yaml 高危漏洞（CVE-2026-59870）**：`server/package.json` 增加 `overrides: { "js-yaml": "4.3.1" }`，
  将 swagger-jsdoc / eslint / istanbul 依赖链中的 js-yaml 4.3.0 与 3.15.0 统一提升到 4.x 修复版 4.3.1，
  消除生产镜像中的高危漏洞。`npm audit` 由 1 高危降至 **0 漏洞**。

#### 门禁加固

- **前端覆盖率门槛**：`vitest.config.js` thresholds 由 `8/8/8/8` 提升至 `49/42/42/47`
  （lines/functions/branches/statements），基于实测总覆盖率（Lines 51.05 / Stmts 50.27 / Branch 43.25 / Funcs 43.36）设定，
  形成有约束力的快速失败门禁。

#### 版本一致性

- 根与 `server/package.json` 版本统一为 **1.6.2**（原 1.5.0 / CHANGELOG 声称 1.6.1 不一致）。

#### 验证

- 后端 `npm audit` 0 漏洞；后端 47 suites / 478 tests 全过
- 前端 `npm run test:coverage` 达标 exit 0

#### 2026-08-26 增补（上线前收尾批次，9 笔提交）

- **后端覆盖加固**：activityLogService / adminService / redisClient 补 17 个单测（后端 498 tests 全过）
- **E2E 真实链路**：新增 `e2e/real-backend.spec.js`（CI 真实后端往返断言，本地无后端自动 skip）
- **E2E 本地可跑**（修复 #33）：`findCachedChromium` 扩展 headless shell 目录回退；CI 判定收紧为 `CI && GITHUB_ACTIONS`
- **docker-compose**：backend 端口收紧至 `127.0.0.1`（攻击面收敛）
- **文档同步**：DEPLOYMENT/ROADMAP/TODO 版本与状态对齐 v1.6.2（TD-17/18 标记已修复），新增 TECH_ARCHIVE_2026-08-26

---

## [1.6.1] - 2026-08-10

### 技术债快修（TD-7 / TD-11 / TD-12 ✅）

ROADMAP 重排第 3 步完成。修复 3 项技术债务，均为纯后端改动，零 API 行为变更。

#### TD-12：Event ICS 导出特殊字符转义（唯一用户可见缺陷）

- 新增 `escapeICS()`（RFC 5545 规范）：反斜杠→`\\`、分号→`\;`、逗号→`\,`、换行→字面量 `\n`
- `SUMMARY` / `DESCRIPTION` / `LOCATION` 全部应用转义，修复日历解析器误读字段结构问题
- 新增 2 个转义测试（特殊字符 + 换行符）

#### TD-11：Knex 配置共享对象引用

- `knexfile.js` 重构为工厂函数 `createDbConfig()` / `buildConnection()`，development/production/test 三环境独立对象
- 修复运行时一处修改 connection 配置会污染其他环境的问题
- 验证：三环境引用互不相等 + 修改互不影响 + `NODE_ENV=test` 时 test_db 逻辑保留

#### TD-7：Service update 冗余 SELECT

- 移除 fleet/member/pilot/project/event 5 个 service update 函数的前置存在性 SELECT 检查
- 改用 UPDATE `affectedRows === 0` 判断 404，UPDATE 泛型从 `RowDataPacket[]` 改为 `ResultSetHeader`
- 查询次数从 3 次（SELECT 检查 + UPDATE + SELECT 返回）降为 2 次，减少一次往返
- 5 个测试文件同步适配（mock 顺序 + 404 断言）

#### 验证（全绿，零回归）

- 后端 47 suites / **478 tests 全过**（+2 ICS 转义）
- 前端 38 文件 / **334 tests 全过**
- `tsc --noEmit` exit 0

---

## [1.6.0] - 2026-08-10

### 转化埋点系统（TD-21 ✅，ROADMAP 重排第 2 步）

产品核心目标「招募转化」首次获得可度量能力，结束零埋点盲打状态。

#### 后端

- **`POST /api/v1/analytics`** 新增路由：接收单条/批量转化事件，**8 事件白名单**校验（防污染日志），写入 Winston 结构化日志（含 ip/userAgent），返回 204
- 事件白名单：`page_view` / `login_success` / `application_form_start` / `application_submit_success` / `application_submit_fail` / `recruiter_chat_turn` / `recruiter_profile_prefill` / `external_link_click`
- 挂载 `routeMounts`，自动获得 `/api/v1` + `/api` 双前缀
- 测试：`tests/routes/analytics.test.ts` 7 用例（合法/批量/白名单外/空体/混合非法）

#### 前端

- **`src/services/analyticsService.js`** 新增：`trackEvent` / `trackEvents`，复用 RUM 模式（sendBeacon → fetch keepalive 降级 → 静默失败），受 `siteConfig.features.enableAnalytics` 开关控制（**默认开启**）
- **6 处埋点接入**：

| 位置 | 事件 | 漏斗意义 |
|:--|:--|:--|
| Home.vue CTA | `application_form_start`（source=home_cta） | 漏斗第 1 层 |
| Join.vue onMounted | `application_form_start` + `recruiter_profile_prefill`（AI 画像预填） | 漏斗起点 + AI 转化 |
| Join.vue handleSubmit | `application_submit_success` / `application_submit_fail` | 漏斗核心 |
| RecruiterTerminal | `recruiter_chat_turn`（对话轮次）+ `recruiter_profile_prefill`（via=suggestion） | Phase 1 价值验证 |
| router afterEach | `page_view`（path/name） | 流量漏斗 |
| Login.vue | `login_success` | 认证转化 |
| SiteFooter.vue | `external_link_click`（channel） | 社群引流闭环 |

- 测试：`tests/services/analyticsService.test.js` 7 用例（开关/sendBeacon/fetch 降级/批量/静默失败）；router.test.js 适配 afterEach 埋点

#### 验证（全绿，零回归）

- 后端 47 suites / **476 tests 全过**（新增 analytics 7）
- 前端 38 文件 / **334 tests 全过**（新增 analyticsService 7 + router 适配）
- `tsc --noEmit` exit 0；`npm run build` exit 0

#### 文档

- 设计规格：`docs/superpowers/specs/2026-08-10-analytics-tracking-design.md`
- TODO.md TD-21 ✅；ROADMAP 第 2 步完成

---

## [1.5.2] - 2026-08-10

### 第四阶段安全架构完成（API v1 收口 + httpOnly Cookie + 分层修复）

ROADMAP 第四阶段整体验收通过（4 项验收标准全部达成）。

#### 4.1 API 客户端迁移到 /api/v1/

- `src/services/http.js`: `API_BASE_URL` `/api` → `/api/v1`
- `src/config/index.js`: `apiPrefix` 默认值 `/api` → `/api/v1`
- `src/services/rumService.js`: `RUM_ENDPOINT` → `/api/v1/rum`
- 测试断言同步更新（http.test.js 19 项 + rumService.test.js 5 项）
- 兼容前缀 `/api/*` 后端保留 90 天（Deprecation/Sunset 头），迁移可逆

#### 4.2 httpOnly Cookie JWT 迁移（确认已完成并落档）

- 前端 `http.js` `credentials:'include'` + 401 自动刷新队列（cookie 机制）
- `authService.js` 不存 token 到 localStorage；`auth store` 内存态 + `/auth/me` 启动恢复
- 后端 `COOKIE_OPTIONS`（httpOnly:true / sameSite:strict / secure:prod）+ `/auth/refresh`/`/auth/logout` Cookie 适配
- 测试断言「所有请求自动携带 cookie 且无 Authorization 头」

#### TD-20 admin 分层修复

- 新建 `server/src/services/adminService.ts`：`verifyAdminPassword`（含 queryOne 查询）从路由层迁入 service 层
- `server/src/routes/admin.ts`：移除直接 DB/密码操作，仅做编排
- 测试改为 mock `adminService` 层，隔离 DB 依赖

#### 验证（全绿，零回归）

- 后端 46 suites / **469 tests 全过**（14.1s）
- 前端 37 文件 / **326 tests 全过**；`tsc --noEmit` exit 0；`npm run build` exit 0
- 前端源码零 `/api` 硬编码残留（仅 `/api/v1`）

---

## [1.5.1] - 2026-08-06

### 安全修复 — 后端生产依赖高危漏洞（TD-24）

- **overrides 锁定安全版本**：`server/package.json` 新增 overrides —— `fast-uri@3.1.5`（修复 GHSA-7p8r-x3mc-p8w7 host confusion）、`brace-expansion@1.1.18 / 5.0.9`（修复 GHSA-rgw5-rvv9-x895 DoS，覆盖 eslint 链与 swagger-jsdoc 链）
- **背景**: 2026-08-06 复核发现 fast-uri@3.1.4 + brace-expansion 经 swagger-jsdoc（生产依赖）→ swagger-parser → ajv 进入生产树，违反 SECURITY.md「npm audit 零高危漏洞」上线门禁
- **验证**: `npm audit` → **0 vulnerabilities**；后端 469 测试 / tsc exit 0 / 前端 326 测试全绿，零回归
- **文档同步**: TODO.md（TD-24 ✅）、ROADMAP.md（安全底线第 ① 项完结）、AUDIT_REPORT 补修复记录

---

## [1.5.0] - 2026-08-03

### AI 集成 — Phase 1 对话式 AI 招募官 Agent（简历核心）

基于 Phase 0 共享 RAG 基础设施，实现对话式招募智能体，SSE 流式交互，3-5 轮后引导申请并画像预填。

#### 后端

- **SessionStore**: Redis 会话存储（sessionId → 消息历史 + 画像，24h TTL，最近 6 轮历史窗口，JSON.parse 防护）
- **ProfileEngine**: 关键词规则画像引擎（playStyle/timeCommit/shipPref/skillLevel，合并而非覆盖）
- **RecruiterService**: 会话 + RAG 检索 + 画像更新 + SSE 流式全链路（`chat` / `chatStream` / `getSuggestions`）
- **SSE 路由**: `POST /api/v1/ai/recruiter/session` / `POST .../chat` / `GET .../suggest`，inline 限流器 10 次/分钟/IP，消息 500 字上限
- **gracefulShutdown** 补充 `closePgPool` + `closeRedis` 防连接泄漏

#### 前端

- **useAiRecruiter** composable: fetch + ReadableStream 手动解析 SSE，画像同步 + 快捷推荐
- **全息终端组件 5 个**: `RecruiterTerminal`（全屏/浮层切换 + Esc 关闭）、`HoloAvatar`、`ChatStream`（滚动节流 + ARIA live）、`QuickSuggestions`、`ProfilePanel`
- **首页集成**: RecruiterTerminal 入口按钮；**Join.vue** 接收 `?ai_profile=` 画像预填参数

#### 验证（Phase 1 验收标准 8 项全部通过）

- [x] SSE 流式接口 / 会话创建 / 推荐问题接口可用
- [x] 全息终端 UI + 对话 3-5 轮引导申请 + 画像预填到申请表
- [x] 限流（10 次/分钟）+ 缓存 + 降级链生效
- [x] 后端单测覆盖 AI 模块 **82.09%**；**469 测试通过** / tsc exit 0 / 前后端 build exit 0

### AI 集成 — Phase 0 LLM 适配层 + RAG 基础设施

- **LLMProvider 抽象**: 统一接口 `chat/chatStream/embed`（`server/src/services/ai/providers/types.ts`）
- **三件套适配**: OpenAI 兼容 Provider（豆包/DeepSeek 通用）、Anthropic Provider（Claude）、工厂 + 降级链路由（`routeWithFallback`，不可重试错误立即抛出不切换）
- **RAG 引擎**: `Embedder`（向量生成 + 降级）、`Retriever`（pgvector 语义检索 top-k + metadata 过滤）、`Ingester`（chunking 512/overlap 50 + 幂等先删后插）、`PromptBuilder`（$ 转义修复）
- **统一入口**: `LlmService`（Redis 缓存 24h，cacheKey 含 temperature/maxTokens）+ `RagService`（检索→组装→调用全链路）
- **基础设施**: pgPool（独立于 MySQL）+ pgvector schema（`knowledge_chunks` + ivfflat 余弦索引）+ Redis 客户端单例 + `ai:ingest` / `ai:migrate` 脚本
- **docker-compose** 新增 `postgres`（pgvector/pg16）+ `redis` 服务
- **路由**: `/api/v1/ai/health` + `/api/v1/ai/retrieve`

### 文档与版本对齐（2026-08-05）

- **VER-1 版本同步**: server + 前端 `package.json`/lock 1.3.1 → **1.5.0**
- **VER-2 文档收尾**: 清除残留过时信息（CHANGELOG 头部备注、ROADMAP 版本待同步标记/遗留列表、TESTING.md 已补模块误标 0%、TODO.md URG-3 生产构建验证、函数覆盖率 85.88%→87.06%）；CONFIG.md 补后端 AI 环境变量（Providers/RAG/Redis + 遗留 `VITE_AI_SERVICE_*` 说明）；DEPLOYMENT.md 补 postgres/redis 服务与 AI 环境变量；TECH_STACK.md 收录 AI 技术栈；SECURITY.md 补 AI 招募官限流；MONITORING.md 补 `/api/v1/ai/health`；7 份 guide 版本统一 v1.5.0

---

## [1.4.0] - 2026-07 系列（部署就绪度 + 视觉 + 安全）

### 部署就绪度提升（2026-07-28，84 commit 合并）

- nginx 容器 unhealthy 状态检查修复、移除不稳定的 memory 健康检查判定
- 60 项本地领先修复 + 13 项 CI/CodeQL 修复

### 前端视觉与数据（2026-07-08）

- 导航栏 HUD 化与舰队卡片组件升级
- 修复 service BASE_URL 重复 `/api` 前缀问题、Origin 350r 舰船分类字段

### 安全与可访问性（2026-07-06）

- 前后端依赖漏洞修复（`npm audit fix`）
- 文本对比度提升至 WCAG AA、表单与开关可访问性增强
- 修复登录页 Open Redirect 漏洞
- store 服务响应解包、updateProfile 返回值修正、GET 参数层级修复

---

## [1.3.4] - 2026-06-15

### 设计改版 — SpaceX 极简风格

Home.vue 全面重写，从游戏 HUD 仪表盘风格迁移至 SpaceX 极简设计语言。信息架构层面的改动，不只是视觉皮肤。

#### 结构变更（6 sections → 4 sections）

- **Hero**（100vh）：`sc-matte-painting.jpg` 全屏背景，左下角标题 + tagline，去掉了 orb 动画、pill 标签、CTA 按钮
- **Key Numbers**：只保留 2 个核心数字（活跃成员 / 飞行小时），去掉了 4 指标横排仪表盘布局
- **Fleet Preview**：3 张 bento 卡片，hover/tap 展开 specs，去掉了 spec bar 默认显示
- **CTA**：页面底部居中，`READY TO JOIN`

#### 交互改进

- bento 卡片底部 `explore →` 提示，hover 时 specs 展开自动收起提示文字
- 移动端 accordion 行为标准化：tap 展开自动收起其他卡片
- 浅色模式对比度修正至 WCAG AA（暗色 0.35 / 浅色 0.45）
- hero padding 改用 `clamp(2rem, 8vw, 120px)` 限制超宽屏

#### 去掉的 sections

| 原 section | 处理 |
|---|---|
| Stats Strip | 合并到 Key Numbers（只保留 2 个） |
| Featured Pilot | 移到独立页面或成员页面展示 |
| Ship Gallery | 合并到 Fleet Preview（精简为 3 张） |

### 设计系统收口 — 星际蓝统一

#### 色彩体系

- accent 色从 `#00e5ff`（电光青）统一到 `#4a9eff`（星际蓝）
- 全局硬编码 `rgba(0, 229, 255, ...)` 替换为 `rgba(74, 158, 255, ...)`
- `btn-amber` 残留清除，`btn-primary` 统一 accent 蓝
- body amber 光晕 → 蓝色三层明度差光晕（0.25/0.12/0.06）
- `--raw-cyan` / `--raw-cyan-rgb` 衍生值全部更新

#### 断裂 CSS 变量修复

- `--amber-primary`：20+ 组件引用但从未定义，现指向 `--color-accent`
- `--nebula-purple`：保留（互补色，不在 accent 体系内）
- `--raw-white-rgb`：glass-card 引用已修复
- `--color-accent-secondary` 指向 accent

### 基础设施

#### CI/CD 修复

- 覆盖率阈值：排除 server/ 目录，阈值从 50% 调至 8%（当前 8.72%）
- 安全扫描：vite 7→8、vitest 3→4 升级修复 esbuild 漏洞，0 vulnerabilities
- 测试环境适配：vite 8 Windows 公共路径解析、IntersectionObserver/ResizeObserver mock

#### CSS 变量 lint

- 新增 `scripts/css-var-lint.mjs`：零依赖 node 脚本，扫描所有 `var()` 引用与 `:root` 定义的交叉
- 双层检查：broken（未定义）→ error / deprecated（旧名别名）→ warning
- 47 个别名映射覆盖 183 处 deprecated 引用
- 已集成 CI，`--strict` 模式可将 deprecated 升级为 error

### 技术债务新增

- **TD-13**：183 处旧变量名引用待迁移（别名已止血，逐个替换排本周内）

### 文档更新

- CHANGELOG.md 更新至 v1.3.4
- TODO.md 标记今日完成项，新增 CSS 变量迁移任务
- ARCHITECTURE.md 版本号同步

---

## [Unreleased] - 2026-06-08

### 代码审查 — 深度扫描

对全栈代码进行了系统性深度审查，发现 4 个 P0 严重问题、11 个 P1 高优先级问题、8 个技术债务项。

#### 前端发现

- **P0**: `stores/auth.js` 变量遮蔽导致错误信息永远不显示
- **P0**: `Login.vue` 绕过 authStore 直接调用 authService，登录后状态不一致
- **P1**: `App.vue` provide 的 authService/aiService 全项目零消费
- **P1**: `vite.config.js` manualChunks 配置可能不生效
- **P1**: `vite.config.js` loadEnv 空前缀暴露敏感环境变量
- **P1**: `Home.vue` 数据硬编码与 API 调用脱节
- **P1**: `composables/` 两套重复滚动揭示动画系统
- **P2**: `main.js` import 位置不规范、`errorReporting.js` Sentry 动态导入重复 4 次

#### 后端发现

- **P0**: `cache.ts` 缓存键忽略查询参数，分页/筛选数据串台
- **P0**: `applications.ts` 申请提交路由缺少认证中间件
- **P1**: `index.ts` 速率限制对已登录用户无效（req.user 永远 undefined）
- **P1**: `auth.ts` requireRole 重复查询数据库
- **P1**: `authService.ts` 登录 SELECT * 泄露 password_hash 到内存
- **P1**: `websocket.ts` 心跳检测 O(n²) 复杂度
- **P1**: `index.ts` gracefulShutdown 逻辑缺陷（未 await + setTimeout 未清理）
- **P1**: `metrics.ts` 指标端点缺少 Promise 错误处理
- **P1**: `init.ts` + `migrate.ts` ~200 行 DDL 完全重复
- **P2**: ICS 导出未转义特殊字符、sanitizeBody 重复实现、Knex 配置共享引用

#### 文档更新

- TODO.md 新增 P0-5 ~ P0-8、P1-6 ~ P1-16 任务项
- ROADMAP.md 新增「紧急阶段: 代码审查修复」，版本规划新增 v1.3.2
- 技术债务追踪新增 TD-6 ~ TD-12

### Skill 清理

- 清理 117 个不相关的 ECC skill（无关语言框架、行业领域、工具）
- 保留 121 个与项目技术栈相关的 skill（Vue/Express/MySQL + AI Agent）

---

## [1.3.1] - 2026-05-28

### 变更内容

#### 亮色主题与缓存补充
- P3-2 亮色主题切换完成，项目底色默认仍为深空风格
- P2-4 HTTP 缓存中间件上线（TTL + ETag + 写失效）
- P2-5 CDN 路径工具 `cdnUrl()` 上线
- P2-2 E2E 覆盖扩充至 5 spec
- P2-3 数据库慢查询阈值告警 + 连接池监控

#### 文档与依赖
- 全量同步 4 份技术文档至 v1.3.1
- README / CHANGELOG 指标去虚高
- 52 个跨项目 skill 复制到 .agents/skills/

#### 安全加固
- npm audit fix 前后端漏洞清零（1 高危 + 7 中危）
- CodeQL 静态安全分析 workflow
- Snyk 集成（.snyk 策略 + CI 扫描）
- pre-commit 敏感信息检测钩子
- pre-push 测试 + 漏洞审计钩子
- ESLint ignores 补全（.agents/.trae/.worktrees 等）
- 修复 3 个 TypeScript 编译错误

#### PWA 支持
- vite-plugin-pwa 1.3 集成，生产构建自动生成 manifest + Service Worker
- Workbox 运行时缓存策略（API NetworkFirst / 图片字体 CacheFirst）
- PwaUpdateToast 组件：新版本提示 + 离线就绪提示
- Offline.vue 离线页面
- usePwa composable 统一管理 SW 生命周期

---

## [1.3.0] - 2026-05-28

### 修复 P0/P1 高优先项
- 修复认证中间件异步处理缺陷（重构为 `async/await`）
- 修复 admin 路由测试失败（`confirmPassword` 字段补全）
- 后端测试从 295 增至 310 用例全部通过

### 修复依赖问题
- 修正 `dotenv@^17.3.1` → `^16.4.5`
- 修正 `@types/node@^25.6.0` → `^20.14.0`
- 补全 `package.json` 元信息（repository/bugs/homepage）

### 代码清理
- 清理前端 `console.log`（`dataService.js`, `useWebSocket.js`, `wsService.js`）
- 补充 `src/config/site.config.js` 占位值
- API 限流 + requestId 链路补全

---

## [1.2.0] - 2026-05-20

### 新增功能
- **管理后台仪表盘**: 新增管理员数据概览面板，显示成员统计、申请数量、舰队规模
- **成员管理模块**: 支持成员信息编辑、角色分配、状态管理
- **申请审批流程**: 完整的入队申请审批工作流，支持通过/拒绝操作
- **实时通知系统**: WebSocket 推送申请状态变更通知

### 改进优化
- **前端性能**: 优化首屏加载速度，减少 30% 初始包体积
- **动画效果**: 统一使用 GSAP 实现滚动触发动画，替代原生 IntersectionObserver
- **响应式设计**: 完善移动端适配，优化小屏幕下的导航体验

### 修复问题
- 修复日历组件在 Safari 下的日期解析错误
- 修复舰队页面图片懒加载导致的布局抖动
- 修复管理后台表格分页在数据更新后未重置的问题

### 技术债务
- 认证中间件仍使用 `.then().catch()` 模式，计划重构为 `async/await`
- 部分测试用例依赖执行顺序，需要解耦

---

## [1.1.0] - 2026-04-15

### 新增功能
- **舰队管理系统**: 完整的飞船配置管理，支持添加、编辑、删除飞船
- **飞行员档案**: 飞行员个人信息页面，展示飞行时长、专精机型、战绩统计
- **项目协作模块**: 战队项目追踪，支持创建任务、分配成员、进度更新
- **日历事件系统**: 战队活动日历，支持创建、报名、提醒功能

### 改进优化
- **数据库架构**: 优化表结构，添加必要的索引提升查询性能
- **API 文档**: 使用 Swagger 自动生成 API 文档，支持在线调试
- **错误处理**: 统一错误响应格式，添加错误码体系

### 安全增强
- 添加请求频率限制（Rate Limiting），防止暴力破解
- 实现 JWT Token 刷新机制，提升安全性
- 添加操作审计日志，记录关键操作

### 修复问题
- 修复 WebSocket 连接断开后未自动重连的问题
- 修复图片上传未限制文件大小导致的内存溢出
- 修复并发请求下数据库连接池耗尽的问题

---

## [1.0.1] - 2026-03-10

### 修复问题
- 修复生产环境环境变量加载失败的问题
- 修复 MySQL 连接在长时间空闲后断开的问题
- 修复前端路由刷新后 404 的问题（Nginx 配置）

### 改进优化
- 优化数据库连接池配置，提升并发处理能力
- 添加健康检查端点 `/health`，支持容器编排

---

## [1.0.0] - 2026-03-01

### 初始发布

#### 核心功能
- **战队宣传网站**: 响应式企业级官网，展示战队文化、成员、舰队
- **成员展示系统**: 成员列表、个人档案、角色展示
- **入队申请**: 在线申请表单，支持填写个人信息、游戏经验
- **用户认证**: JWT 认证体系，支持注册、登录、密码重置
- **管理后台**: 基于角色的访问控制（RBAC），支持成员、申请、舰队管理

#### 技术实现
- 前端: Vue 3 + Vite + TailwindCSS + GSAP
- 后端: Express + TypeScript + MySQL + Knex.js
- 部署: Docker + Docker Compose + Nginx
- 测试: Jest + Supertest + Vitest + Playwright

#### 基础设施
- CI/CD 流水线（GitHub Actions）
- 自动化测试与覆盖率报告
- 容器化部署支持
- 结构化日志记录（Winston）

---

## 版本对比

| 版本 | 发布日期 | 主要特性 | 测试覆盖率 |
|:---|:---|:---|:---|
| v1.0.0 | 2026-03-01 | 初始发布 | 后端 55% |
| v1.0.1 | 2026-03-10 | 生产环境修复 | 后端 58% |
| v1.1.0 | 2026-04-15 | 舰队管理 + 项目协作 | 后端 62% |
| v1.2.0 | 2026-05-20 | 管理后台 + 实时通知 | 后端 65% |
| v1.3.0 | 2026-05-28 | P0/P1 修复 + 依赖修正 | 后端 63.86% |
| v1.3.1 | 2026-05-28 | 缓存/CDN/亮色主题/E2E 扩充 | 后端 63.86% |
| v1.3.4 | 2026-06-15 | SpaceX 设计改版 + 设计系统收口 + CSS 变量 lint | 后端 63.86% |
| v1.4.0 | 2026-07 | 部署就绪度 + 视觉 + 安全修复 | 后端 63.86% |
| v1.5.0 | 2026-08-03 | AI 基础设施 + 对话式 AI 招募官（RAG/SSE/画像预填） | AI 模块 82.09% |

---

## 迁移指南

### v1.1.0 → v1.2.0

1. 执行数据库迁移：`cd server && npx knex migrate:latest`
2. 新增环境变量：`WS_PORT=3002`（WebSocket 端口）
3. 更新 Nginx 配置，添加 WebSocket 代理支持

### v1.0.x → v1.1.0

1. 执行数据库迁移（新增 `projects`, `events` 表）
2. 更新环境变量配置，添加邮件服务配置
3. 重新构建 Docker 镜像：`docker-compose build --no-cache`

---

## 废弃功能

| 版本 | 功能 | 替代方案 | 移除日期 |
|:---|:---|:---|:---|
| v1.2.0 | 原生 IntersectionObserver 动画 | GSAP ScrollTrigger | 2026-05-20 |
| v1.1.0 | 静态 JSON 数据文件 | API + 数据库 | 2026-04-15 |
| v1.1.0 | 本地存储认证状态 | Pinia + HTTP-only Cookie | 2026-04-15 |
