# 技术债补齐执行计划（模块化）

> **项目**: Star Citizen 战队宣传网站
> **创建日期**: 2026-08-30
> **来源**: 《模块补齐技术档案》(docs/reports/TECH_ARCHIVE_2026-08-30.md)
> **执行模式**: 单人串行，每任务独立 commit，禁止并行推进多模块
> **编号体系**: M0~M7（独立于既有 TD/MON 编号）
> **当前进度**: M0 本期执行；M1~M4 按优先级排队；M5~M7 规划/远期

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
| C5 | commit 遵循 Conventional Commits；多行 body 用多个 `-m` |
| C6 | 测试基线不得回退：后端 **656/656**、前端 **404/404**（2026-08-30 实测） |
| C7 | M0 弹窗样式复用既有 CSS 变量与 ProjectsAdmin 模式，不新增变量、不新增路由（否决 `/admin/members/new` 方案） |

### 0.2 验证命令速查

```bash
# 前端（仓库根目录）
npm run lint                 # ESLint，期望 0 error
npm run typecheck            # tsc --noEmit -p jsconfig.json，期望 0 error
npm test                     # vitest run（全量单测，基线 404/404）

# 后端（server/ 目录）
cd server && npm test        # jest，基线 656/656
cd server && npm run typecheck

# 数据库结构同步（涉及新表/新列时）
cd server && npm run db:init
```

---

## 模块总览

| 模块 | 名称 | 优先级 | 预估规模 | 依赖 | 状态 |
|:--|:--|:--|:--|:--|:--|
| M0 | Admin CRUD 新增/编辑系统性补齐 | P0 | 小 | 无 | ✅ 已完成 2026-08-30 |
| M1 | AI-DEP-1/2 部署验证 | P1 | 中 | 需真实 LLM key | 📋 排队 |
| M2 | 生产部署准备 | P0 | 中 | 需服务器权限 | 📋 排队 |
| M3 | E2E 扩展（fleet/admin） | P2 | 中 | M0 完成（admin 链路联动） | 📋 排队 |
| M4 | 前端覆盖率 50.3% → 70% | P2 | 大 | 串行推进 | 📋 排队 |
| M5 | AI Phase 2: GEO 优化 | P2 | 3 天 | M1 验证通过后 | 📋 规划 |
| M6 | AI Phase 3: 选舰助手 | P2 | 1 周 | M1 | 📋 规划 |
| M7 | 远期演进 | P3 | — | 按需 | ⚪ 远期 |

**执行顺序：M0 → M1 → M2 → M3 → M4 →（M5/M6 择机）→ M7 按需。**

---

## 模块 M0：Admin CRUD 新增/编辑系统性补齐（P0，本期）

**目标**：修复审计发现的系统性死链（4 文件 6 处 `/admin/*/new` 指向不存在的路由），把成员管理半成品补成可用 CRUD，projects/pilots 补上缺失的「新增」能力。

**统一模式**：弹窗式 create+edit 二合一（对齐 ProjectsAdmin/PilotsAdmin 既有编辑弹窗，**不新增路由**）。

### M0-1 测试先行（TDD 红）

**位置**：`tests/views/admin/MembersAdmin.test.js`（现仅 2 个冒烟用例，mock 缺 createMember）

**改动**：
1. mock 补充 `createMember: vi.fn(() => Promise.resolve({ success: true, data: {} }))`
2. 新增用例：
   - 点击「编辑」→ 弹出 modal 且表单回填 member 字段
   - 提交编辑表单 → 调用 `updateMember(id, form)` 且参数正确
   - 点击「添加成员」→ 打开空表单（name/role 为空，status=active）
   - 提交新建表单 → 调用 `createMember(form)`
   - 保存成功后关闭弹窗并重新加载列表（`getMembers` 再次调用）
   - 保存失败 → 显示错误信息且弹窗不关闭

**验收**：`npm test` 中该文件新用例**先失败**（组件尚无对应行为）——TDD 红。

### M0-2 实现 MembersAdmin（TDD 绿）

**位置**：`src/views/admin/MembersAdmin.vue`

**改动**：
1. 「添加成员」按钮：`RouterLink to="/admin/members/new"` → `<button class="btn btn-primary" @click="openCreateModal">添加成员</button>`
2. 模板新增 modal（对齐 ProjectsAdmin 结构，复用现有 `.modal-overlay/.modal-content/.modal-header/.edit-form` CSS）：
   - 表单字段：name（required）、role（required）、intro（textarea）、avatar、status（select：active/inactive/retired，仅编辑模式显示；新建默认 active）
   - 标题随 mode 切换（「添加成员」/「编辑成员」）
   - 底部按钮：取消（关闭）+ 保存
3. script：
   - `const modalMode = ref('create')`（'create' | 'edit'）
   - `openCreateModal()`：清空表单、mode='create'、`showModal=true`
   - `editMember(member)`：回填表单、mode='edit'、`showModal=true`（保留原函数名）
   - `closeModal()`：`showModal=false`
   - `saveForm()`：mode 分流调用 `createMember` / `updateMember(editingId, form)`；成功 → closeModal + loadMembers；失败 → `formError` 显示
4. 删除死路由引用，不新增路由

**验收**：`npm test` 全绿（404/404 + 新增用例）；`npm run lint`、`npm run typecheck` 0 错误。

### M0-3 修复 ProjectsAdmin / PilotsAdmin / Dashboard 死链

**位置**：三个文件同批处理

**改动**：
1. `ProjectsAdmin.vue`：「创建项目」RouterLink → button 打开空表单（mode=create）；`saveEdit` 按 `editingProject` 是否为空分流 createProject/updateProject；标题按 mode 显示
2. `PilotsAdmin.vue`：「添加飞行员」RouterLink → button 打开空表单（mode=create）；`saveEdit` 分流 createPilot/updatePilot
3. `Dashboard.vue`：3 个 `/admin/*/new` 快捷操作 → 指向 `/admin/members`、`/admin/projects`、`/admin/pilots` 列表页

**验收**：`npm test` 全绿（含既有 Dashboard/Projects/Pilots 测试无回归）。

### M0-4 验证与提交

1. 全量验证：lint + typecheck + 前端测试 + `npm run build`
2. commit：`feat(admin): 补齐成员/项目/飞行员新增编辑弹窗，修复 /admin/*/new 系统性死链`
3. 更新 TODO.md 与 EXECUTION_PLAN_TECHDEBT.md 勾选

**验收**：工作树干净；测试全绿；构建通过。

---

## 模块 M1：AI-DEP-1/2 部署验证（P1，排队）

> 前置：用户提供任一 LLM Provider key（DOUBAO/DEEPSEEK/ANTHROPIC）。

| # | 任务 | 验证命令 |
|:--|:--|:--|
| M1-1 | 配置 LLM key 到 `server/.env` | — |
| M1-2 | 确认 Redis + pgvector 容器运行 | `docker ps` |
| M1-3 | pgvector 建表 | `cd server && npm run ai:migrate` |
| M1-4 | 5 类知识源入库（幂等） | `cd server && npm run ai:ingest` |
| M1-5 | AI 健康/检索验证 | `curl /api/v1/ai/health`、`curl /api/v1/ai/retrieve` |
| M1-6 | 前端 SSE 流式验证 | 首页 AI 终端发消息 |
| M1-7 | docker-compose 生产 env 注入 | `PGVECTOR_URL / REDIS_URL / LLM keys` |

**验收**：AI 聊天流真实返回；`ai:ingest` 二次运行幂等；生产 env 清单齐全。

---

## 模块 M2：生产部署准备（P0，排队）

> 前置：服务器/域名权限。

| # | 任务 |
|:--|:--|
| M2-1 | docker-compose production profile 激活（保留 backend 127.0.0.1 收紧） |
| M2-2 | nginx.conf.tmpl 域名/SSL 证书路径核对 |
| M2-3 | 生产环境变量清单填写（JWT_SECRET/DB_*/REDIS_URL/PGVECTOR_URL/LLM keys/MONITOR_WEBHOOK_URL） |
| M2-4 | 备份恢复流程上线前复演 |

**验收**：`docker-compose -f docker-compose.yml up -d` 全服务健康；https 访问正常；备份恢复演练成功。

---

## 模块 M3：E2E 扩展（P2，排队）

| # | 任务 | 内容 |
|:--|:--|:--|
| M3-1 | `e2e/fleet.spec.js` | 船队列表渲染 + 分类筛选 + 详情跳转 |
| M3-2 | `e2e/admin.spec.js` | 登录 → 成员新增/编辑/删除往返（验收 M0 成果） |

**验收**：E2E spec 7 → 9；`npm run test:e2e` 全绿。

---

## 模块 M4：前端覆盖率提升（P2，排队）

| # | 任务 |
|:--|:--|
| M4-1 | `npm run test:coverage` 生成报告，按文件排序找未覆盖高逻辑文件 |
| M4-2 | 优先补 Store/Service 分支，其次 View 交互 |
| M4-3 | 每提升 ~10% 上调门禁一次，最终目标 70% |

**验收**：前端语句覆盖率 ≥70%；门禁同步上调；测试无回归。

---

## 模块 M5/M6：AI Phase 2/3（P2，规划）

详见 [TECH_ARCHIVE_2026-08-30.md §6/§7](reports/TECH_ARCHIVE_2026-08-30.md)。前置：M1 验证通过。M6 动态首页个性化已砍（RICE 0.10），不做。

---

## 模块 M7：远期演进（P3）

| 项 | 触发条件 |
|:--|:--|
| MON-F1~F3 多实例聚合/告警静默/趋势报表 | 生产部署后评估 |
| 软删除 | 用户误删反馈 / 数据审计需要 |
| 前端 TS 迁移 | 第二开发者加入 / 代码量到维护困难 |
| i18n | 面向国际玩家 |
| Grafana | 生产部署后 |
| RUM 深化 | 用户量起来后 |
