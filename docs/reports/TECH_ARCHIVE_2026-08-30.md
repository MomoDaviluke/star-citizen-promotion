# 模块补齐技术档案（2026-08-30 审计）

> **依据**: 2026-08-30 全量审计（git 工作树干净，最新提交 `2f800e0` v1.6.4）
> **日期**: 2026-08-30
> **原则**: 每步先档案后开发；串行执行；每步完成后运行验证命令确认；TDD（测试先于实现）
> **对应计划**: [EXECUTION_PLAN_TECHDEBT.md](../EXECUTION_PLAN_TECHDEBT.md)

---

## 审计结论总览

| # | 模块/任务 | 优先级 | 类别 | 状态 | 档案章节 |
|:--|:--|:--|:--|:--|:--|
| M0 | MembersAdmin 成员 CRUD 补齐 | P0 | 功能缺陷 | 🔴 半成品 | §1 |
| M1 | AI-DEP-1/2 部署验证 | P1 | 待验证 | 🟠 待验证 | §2 |
| M2 | 生产部署准备 | P0 | 上线缺口 | 🟠 未启用 | §3 |
| M3 | E2E 扩展（fleet/admin） | P2 | 测试覆盖 | 📋 待实施 | §4 |
| M4 | 前端覆盖率 50.3% → 70% | P2 | 质量门禁 | 📋 待实施 | §5 |
| M5 | AI Phase 2: GEO 优化 | P2 | 功能规划 | 📋 待启动 | §6 |
| M6 | AI Phase 3: 选舰助手 | P2 | 功能规划 | 📋 待启动 | §7 |
| M7 | 远期演进（MON-F / 软删除 / i18n 等） | P3 | 缓行 | ⚪ 远期 | §8 |

---

## §1 M0 — Admin CRUD 新增/编辑系统性补齐（P0，本期开发）

### 1.1 背景与实测证据（含系统性死链发现）

审计发现 **「新增」入口全部是死链**——指向不存在的 `/admin/*/new` 路由（`src/router/index.js` 中无任何该模式路由）：

| 文件 | 死链 | 编辑弹窗 | 新增功能 | 判定 |
|:--|:--|:--|:--|:--|
| `MembersAdmin.vue` | `members/new`（L18） | ❌ 半成品（editMember 只填表单，模板无 modal，CSS 已备） | ❌ 无 | **最残缺，本期核心** |
| `ProjectsAdmin.vue` | `projects/new`（L19） | ✅ 完整（saveEdit → updateProject） | ❌ 无 | 缺新增 |
| `PilotsAdmin.vue` | `pilots/new`（L19） | ✅ 完整（saveEdit → updatePilot） | ❌ 无 | 缺新增 |
| `Dashboard.vue` | `members/new`/`projects/new`/`pilots/new`（L65~73） | — | — | 快捷操作 3 死链 |

- 后端 API **全部就绪**：members（GET/POST/PUT/DELETE）、projects（含 createProject）、pilots（含 createPilot）均有路由 + 校验 + Service
- 前端 Service **全部就绪**：`dataService.createMember/updateMember/deleteMember`、`createProject/updateProject`、`createPilot/updatePilot`
- MembersAdmin 表结构（schema.ts）：`id/name/role/intro/avatar/join_date/status(active|inactive|retired)/created_at/updated_at`
- 现有测试：MembersAdmin.test.js 仅 2 个冒烟用例且 mock 缺 `createMember`

### 1.2 技术方案

**统一模式：弹窗式 create+edit 二合一**（对齐 ProjectsAdmin/PilotsAdmin 既有编辑弹窗，不新增路由）——

| 文件 | 改动 |
|:--|:--|
| `MembersAdmin.vue` | 补完整弹窗模板（name/role 必填，intro/avatar/status）；`modalMode`（create/edit）+ `openCreateModal/editMember/closeModal/saveForm`；保存按 mode 调 createMember/updateMember，成功后关弹窗 + 重载列表；删除死链 RouterLink |
| `ProjectsAdmin.vue` | 「创建项目」RouterLink → 按钮打开空表单弹窗（mode=create 复用 saveEdit 分流 createProject/updateProject）；标题按 mode 显示 |
| `PilotsAdmin.vue` | 「添加飞行员」RouterLink → 按钮打开空表单弹窗（mode=create 复用 saveEdit 分流 createPilot/updatePilot） |
| `Dashboard.vue` | 3 个死链快捷操作 → 指向各自管理列表页（`/admin/members`、`/admin/projects`、`/admin/pilots`），保留"快速到达"语义 |
| `tests/views/admin/MembersAdmin.test.js` | mock 补 createMember；新增：编辑打开弹窗回填、提交调 updateMember、新建调 createMember、保存后刷新、失败路径 |
| `tests/views/admin/ProjectsAdmin.test.js` / `PilotsAdmin.test.js` / `Dashboard.test.js` | 视现有断言补创建模式用例（先读现状） |

**否决方案 B**（为每个模块新建 `/admin/*/new` 独立页面 + 路由）：与现有 admin CRUD 全用弹窗模式不一致，4 个新页面 + 4 条路由，改动面 2 倍以上，收益为零。

### 1.3 验证标准

- `npm run lint` / `npm run typecheck` 0 错误
- `npm test` 全绿（前端基线 404/404，新增用例后 ≥）
- `npm run build` 生产构建通过
- 手动验证（可选）：dev 环境 admin 登录后 3 模块新增/编辑/删除往返 + Dashboard 快捷操作跳转正常

### 1.4 风险

- 弹窗样式复用既有 CSS 变量（--color-border/--color-text-body/--color-accent），不新增变量
- `join_date` 字段后端 POST 校验用 `joinDate` 驼峰——本期表单不含该字段（默认 NULL），无此风险
- Dashboard 快捷操作改为跳列表页后语义从"快速新建"变"快速到达"，符合现状（新建本就不可用）

---

## §2 M1 — AI-DEP-1/2 部署验证（P1，待验证）

### 2.1 现状

- AI-DEP-1：`server/src/scripts/ingest.ts`（`npm run ai:ingest`）+ `pgMigrate.ts` 代码就绪，但**从未用真实 Provider key 跑通** 5 类知识源入库
- AI-DEP-2：docker-compose 生产环境未注入 `PGVECTOR_URL / REDIS_URL / LLM API keys`
- 开发环境无 LLM key（DOUBAO/DEEPSEEK/ANTHROPIC_API_KEY 未配置）→ AI 聊天流必报"AI 服务暂时不可用"，属预期配置缺失，非 bug

### 2.2 验证步骤（需用户提供 key 后执行）

1. 配置 `DOUBAO_API_KEY`（或 DEEPSEEK/ANTHROPIC）到 `server/.env`
2. `docker start sc-redis-dev` + pgvector 容器确认 Up
3. `cd server && npm run ai:migrate`（建 pgvector 表）
4. `cd server && npm run ai:ingest`（5 类知识源入库，验证幂等）
5. curl 验证 `/api/v1/ai/health` 与 `/api/v1/ai/retrieve`
6. 前端首页 AI 终端发消息，验证 SSE 流式返回

### 2.3 风险

- 需真实 key 才能验证；无 key 时保持现状（降级链自动 disabled，不阻断启动）

---

## §3 M2 — 生产部署准备（P0，上线缺口）

### 3.1 现状

- nginx + certbot **production profile 未启用**（Dockerfile.nginx / nginx.conf.tmpl / certbot/ 已就绪但未配置上线）
- 生产 MySQL/Redis/WS 拓扑未实测；`MONITOR_WEBHOOK_URL` 等告警配置需按生产环境填写

### 3.2 待办

| 项 | 说明 |
|:--|:--|
| M2-1 | `docker-compose.yml` production profile 检查与激活（backend 127.0.0.1 收紧保留） |
| M2-2 | nginx.conf.tmpl 域名/SSL 证书路径核对 |
| M2-3 | 生产环境变量清单（JWT_SECRET ≥32 字符、DB_*、REDIS_URL、PGVECTOR_URL、LLM keys、MONITOR_WEBHOOK_URL） |
| M2-4 | 备份恢复流程正式演练（OPS-1 已在隔离栈演练过，上线前复演一次） |

### 3.3 风险

- 需服务器/域名权限；属运维动作，代码层无需改动

---

## §4 M3 — E2E 扩展（P2）

### 4.1 现状

- 7 个 spec（navigation/home/join/apply/auth/real-backend/recruiter），仅 `auth.spec.js` 触达 admin 登录
- 无 fleet / admin 管理链路（members/projects/applications 审核）E2E

### 4.2 待办

| 项 | 说明 |
|:--|:--|
| M3-1 | `fleet.spec.js`：船队列表渲染 + 筛选 + 详情跳转 |
| M3-2 | `admin.spec.js`：登录 → 成员管理新增/编辑往返（与 M0 联动验收） |

### 4.3 风险

- E2E 需 dev 服务运行；admin 需真实凭据（测试账号策略待定）

---

## §5 M4 — 前端覆盖率提升（P2）

### 5.1 现状

- 前端语句覆盖率 ~50.3%（2026-08-27 实测），门禁 49% 已生效（vitest `--coverage` 门禁 lines/funcs/branches/stmts = 49/42/42/47）
- 44 套件 / 404 用例已覆盖 Service/Store/Router/核心 View/AI 组件/监控面板

### 5.2 待办

| 项 | 说明 |
|:--|:--|
| M4-1 | 未覆盖高逻辑密度文件排查（vitest --coverage 报告按文件排序） |
| M4-2 | 优先补 Store/Service 分支，其次 View 交互（UI 纯渲染 ROI 低） |
| M4-3 | 覆盖率每提升 ~10% 上调一次门禁，最终目标 70% |

### 5.3 风险

- 覆盖率提升与 ROI 平衡：单人开发 70% 够用，UI 纯渲染不追求 100%

---

## §6 M5 — AI Phase 2: GEO 生成式 AI 搜索优化（P2，规划中）

### 6.1 现状

- SEO 基础已交付（sitemap.xml / robots.txt / 预渲染 / OG-canonical，2026-08-24）
- **GEO 全套未开发**：`public/` 无 `llms.txt`；无 Schema.org JSON-LD 注入；无 FAQ 入库；无知识图谱 API

### 6.2 待办

| # | 动作 | 交付物 |
|:--|:--|:--|
| 1 | `public/llms.txt` | AI 爬虫友好的公会信息声明 |
| 2 | `robots.txt` 放行 AI 爬虫 | 显式允许 GPTBot / ClaudeBot / Bytespider |
| 3 | Schema.org JSON-LD | Organization / VideoGame / Event / FAQPage 注入关键页面 |
| 4 | FAQ 内容入库 | 复用 Phase 0 知识库，服务 RAG 与 GEO |
| 5 | 知识图谱 JSON-LD | `/api/v1/geo/graph` 动态生成 |
| 6 | 站长平台提交 | 豆包 / DeepSeek / Bing Webmaster |

### 6.3 风险

- RICE 0.17 缓办项：播种性、确定性低；建议在 M1 验证通过后择机启动

---

## §7 M6 — AI Phase 3: 选舰助手（P2，规划中）

### 7.1 现状

- RAG 基建（Phase 0）就绪：LLMProvider 降级链 + pgvector + Redis 缓存 + `ai:retrieve`
- **推荐服务未实现**：无 `POST /api/v1/ai/recommend/ships`

### 7.2 待办

| # | 动作 |
|:--|:--|
| 1 | 推荐服务：3-5 问题 → 画像向量 → pgvector 检索 ships → 规则过滤 → LLM 流式推荐理由 |
| 2 | 前端选舰问卷组件 + 结果流式展示 |
| 3 | 测试：后端服务单测 + 前端组件测试 + E2E |

### 7.3 风险

- 依赖 M1（LLM key 验证通过）；动态首页个性化已砍（RICE 0.10），不做

---

## §8 M7 — 远期演进（P3，缓行）

| 项 | 说明 |
|:--|:--|
| MON-F1~F3 | 多实例聚合 / 告警静默 / 趋势报表（仅设计预留） |
| 软删除 | 核心表 `deleted_at` + Service 过滤（用户误删反馈后启动） |
| 前端 TS 迁移 | 第二开发者加入 / 代码量到维护困难时 |
| i18n 国际化 | 面向国际玩家时 |
| Grafana 监控 | 生产部署后（Prometheus 指标已就绪） |
| RUM 深化 | 用户量起来后 |

---

## 质量基线（2026-08-30 实测）

| 指标 | 当前值 |
|:--|:--|
| 后端测试 | 58 套件 / 656 用例 100% 通过 |
| 前端测试 | 44 套件 / 404 用例 100% 通过 |
| typecheck | 0 错误（前后端） |
| 覆盖率门禁 | 前端 49/42/42/47；后端语句 ≥60%（实测 75.35%） |
| E2E | 7 spec |
| CSS 变量 lint | 0 断裂 / 0 deprecated |
| git | 工作树干净（v1.6.4） |
