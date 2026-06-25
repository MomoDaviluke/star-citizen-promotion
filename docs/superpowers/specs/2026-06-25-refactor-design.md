# 系统性技术栈重构与优化设计规格

> **项目**: Star Citizen 战队宣传网站
> **创建日期**: 2026-06-25
> **方案**: 方案 A — 风险分级递进
> **状态**: 已通过用户分节审查批准

---

## 1. 目标与范围

### 1.1 目标

对项目进行系统性的技术栈重构与优化，达成以下三项目标：

1. **精简项目结构与代码冗余**：消除"代码屎山"现象
2. **建立完整的逻辑闭环与测试闭环**：覆盖率达标 + 关键路径覆盖
3. **统一并提升代码行文风格与质量标准**：命名规范 + lint 收紧 + 注释补全

### 1.2 范围边界

**本次重构范围**：
- 工作区清理（.worktrees/ 残留、未合并分支、未提交修改）
- 死代码与残留清理（重复测试、过期 TD 项、未使用依赖）
- 重复实现消除（sanitizeBody、Sentry 导入、DDL）
- 架构耦合重构（Store 解耦、Service 冗余查询、Knex 配置、ICS 转义、CSS 变量迁移）
- 命名与规范统一（services/ camelCase、文件头注释、ESLint 收紧）
- 测试闭环建立（覆盖率门禁、关键路径测试、E2E 补齐）
- 4 维指标对比（代码质量、测试质量、性能、工程规范）

**本次重构不涉及**（属 production-launch.md 范围）：
- 生产部署、域名、HTTPS、Docker 生产配置
- API v1 前缀迁移
- 真实 MySQL 接入与数据源切换
- 内容生成（舰船图、文案）
- 新功能开发

### 1.3 成功标准

- 代码质量指标不退化（LOC、文件数、依赖数持平或下降）
- 测试质量指标提升（后端覆盖率 ≥70%，前端 ≥60%，E2E ≥7 spec）
- 工程规范指标提升（ESLint 零错误、文件头注释 100%、TODO/FIXME 数下降）
- 性能指标不退化（生产包体积增长 ≤10%）
- 所有重构前通过的测试在重构后仍通过

---

## 2. 方案选择

### 2.1 候选方案

| 方案 | 核心思路 | 优点 | 缺点 |
|---|---|---|---|
| **A. 风险分级递进** | 按风险递增分 5 阶段，每阶段独立可回滚 | 风险递增、前期快速见效、回滚粒度细 | P4 高风险期缺乏测试安全网 |
| B. 测试先行 | 先补特征测试再重构 | 回归风险最低 | 周期长 ~30%、部分测试一次性浪费 |
| C. 领域分块 | 按前端/后端/跨层分块 | 上下文切换少 | 跨领域技术债归属不清、回滚粒度粗 |

### 2.2 选择决策

**选择方案 A**，理由：
1. 符合"分阶段、可回滚"硬约束
2. 平衡效率与安全：P2 清理后现有测试（前端 408 用例 + 后端 310 用例）作为 P4 重构的安全网
3. 风险隔离：高风险重构集中在 P4，届时已有干净基线
4. 指标采集自然：P1 基线 → P5 验收，对比清晰

**对方案 A 缺点的缓解**：P4 重构前（任务 4.6），先为待重构模块补少量"锚点测试"（非完整特征测试），覆盖关键路径即可，投入产出比最优。

---

## 3. 分支策略与回滚机制

### 3.1 分支策略

```
main (HEAD: 6284648)
 │
 ├─ refactor/systematic-cleanup          ← 重构主分支（集成分支）
 │   ├─ refactor/p1-baseline             ← P1 基线（可能直接合 main）
 │   ├─ refactor/p2-cleanup              ← P2 低风险清理
 │   ├─ refactor/p3-unify                ← P3 中风险统一
 │   ├─ refactor/p4-debt                 ← P4 高风险重构
 │   │   ├─ refactor/p4-css-vars         ← TD-13 CSS 变量
 │   │   ├─ refactor/p4-store-decouple   ← Store-1 解耦
 │   │   ├─ refactor/p4-service-query    ← TD-7 冗余 SELECT
 │   │   ├─ refactor/p4-knex-config      ← TD-11 Knex 配置
 │   │   └─ refactor/p4-ics-escape       ← TD-12 ICS 转义
 │   └─ refactor/p5-verify               ← P5 测试闭环 + 验收
 │
 └─ (最终) refactor/systematic-cleanup → main (PR 形式，含对比报告)
```

### 3.2 回滚机制

- **阶段级回滚**：每阶段独立分支，失败可整体放弃该阶段分支
- **commit 级回滚**：阶段内按文件/模块细粒度提交，支持 `git revert` 单个 commit
- **关键检查点**：每阶段结束前必须通过 `npm run build && npm run typecheck && npm test`，否则不合并
- **P4 子任务级保护**：每个 TD 项独立子分支，独立测试通过后才合并到 `refactor/p4-debt`

### 3.3 与现有计划的关系

- **`docs/superpowers/plans/2026-06-25-production-launch.md`**：保留不动，本次重构不涉及部署
- **现有未合并分支**（feat/enterprise-improvement 等）：在 P2 阶段评估，有用改动 cherry-pick，无用则删除
- **现有未提交修改**（Fleet.vue / Home.vue）：P1 阶段先提交，作为基线一部分

---

## 4. 技术债务范围清单

### 4.1 工作区清理类（P2 阶段）

| 编号 | 问题 | 位置 | 处理方式 |
|---|---|---|---|
| W-1 | 3 个废弃工作树残留 | `.worktrees/enterprise-improvement/`、`.worktrees/websocket-refactor/`、`.worktrees/fix-cicd-security/` | 评估有用改动后整体删除 |
| W-2 | 未提交修改 | `src/views/Fleet.vue`、`src/views/Home.vue` | P1 阶段提交 |
| W-3 | 未跟踪文件 | `docs/superpowers/plans/2026-06-25-production-launch.md` | P1 阶段提交 |
| W-4 | 6 个未合并本地分支 | `feat/enterprise-improvement`、`feature/frontend-asset-optimization`、`fix-cicd-security`、`refactor/css-vars-group-2`、`refactor/websocket-message-handler` 等 | P2 阶段评估，cherry-pick 有用改动后删除 |

### 4.2 死代码与残留类（P2 阶段）

| 编号 | 问题 | 位置 | 处理方式 |
|---|---|---|---|
| D-1 | 重复测试文件 | `tests/router/router.test.js` 与 `tests/router/index.test.js` | 对比内容，保留更完整的，删除另一个 |
| D-2 | TD-9 描述过时 | TODO.md 记载"useScrollReveal.js 与 useGSAPReveal.js 重复"，但 `useScrollReveal.js` 已删除 | 验证无 IntersectionObserver 残留后，更新 TODO.md 关闭 TD-9 |
| D-3 | 未使用依赖排查 | `package.json` 中 `animejs`、`howler`、`swiper`、`chart.js` 是否仍被使用 | P2 阶段 grep 确认，未使用则移除 |

### 4.3 重复实现类（P3 阶段）

| 编号 | 问题 | 位置 | 处理方式 |
|---|---|---|---|
| TD-8 | sanitizeBody 重复实现 | `server/src/middleware/requestLogger.ts` + `auditLogger.ts` | 抽取到 `server/src/utils/sanitize.ts` |
| TD-10 | Sentry 动态导入重复 4 次 | `src/services/errorReporting.js` 第 20/58/71/83 行 | 抽取 `getSentry()` 单例，统一动态导入 |
| P1-16 | DDL 在 init.ts 和 migrate.ts 重复 ~200 行 | `server/src/database/init.ts` + `migrate.ts` | 抽取 `server/src/database/schema.ts` 共享模块 |

### 4.4 架构耦合类（P4 阶段）

| 编号 | 问题 | 位置 | 处理方式 |
|---|---|---|---|
| TD-13 | 183 处旧 CSS 变量名引用 | 全站（已别名止血，分 4 组迁移） | 按 TODO.md 既定 4 组计划推进 |
| Store-1 | calendar.js 直接依赖 useAuthStore | `src/stores/calendar.js` 的 `myEvents` computed | 改为参数注入，由调用方传入 userId |
| TD-7 | Service update 冗余 SELECT | 后端各 Service 的 update 方法 | 合并存在性检查与 UPDATE 为单查询 |
| TD-11 | Knex 配置共享同一对象引用 | `server/knexfile.js` | 各环境深拷贝 dbConfig |
| TD-12 | Event ICS 导出未转义特殊字符 | `server/src/services/eventService.ts` | 添加 `escapeIcsText()` 工具函数 |

### 4.5 命名与规范类（P3 阶段）

| 编号 | 问题 | 位置 | 处理方式 |
|---|---|---|---|
| N-1 | services/ 层 PascalCase/camelCase 混用 | `src/services/*.js` | 统一为 camelCase |
| N-2 | 文件头注释覆盖率 ~95% 但有缺口 | 部分 HUD 组件、新增文件 | 补全至 100% |
| N-3 | ESLint 规则未收紧 | `eslint.config.js` | 启用 `no-unused-vars: error`、`no-console: error`、`prefer-const: error` |

### 4.6 测试缺口类（P5 阶段）

| 编号 | 问题 | 位置 | 处理方式 |
|---|---|---|---|
| T-1 | 前端无覆盖率门禁 | `vitest.config.js` | 配置 coverage thresholds（语句 ≥60%） |
| T-2 | 前端关键路径测试缺口 | Store 异步错误分支、Service 降级逻辑、路由守卫 | 补齐关键路径测试 |
| T-3 | 后端覆盖率 63.86%，未达 70% 目标 | `server/tests/` | 补齐 Service 层边界测试 |
| T-4 | E2E 仅 5 spec，未达 7 目标 | `e2e/` | 补齐 Fleet 详情、Admin 流程 E2E |

---

## 5. 各阶段详细任务设计

### P1：基线建立（极低风险）

**目标**：采集重构前指标快照，提交未提交修改，建立干净基线。

| 任务 | 操作 | 验证标准 |
|---|---|---|
| 1.1 采集基线指标 | 运行指标采集脚本，记录 LOC/文件数/覆盖率/ESLint 错误数/包体积 | 生成 `docs/refactor/baseline-metrics.json` |
| 1.2 提交未提交修改 | `Fleet.vue`、`Home.vue` 提交到 main | `git status` 干净 |
| 1.3 提交未跟踪文件 | `production-launch.md` 提交到 main | `git status` 干净 |
| 1.4 切重构主分支 | `git checkout -b refactor/systematic-cleanup` | 分支存在 |

**产出**：基线指标文件 + 干净的 main 分支 + refactor 主分支

### P2：低风险清理（低风险）

**目标**：删除残留，清理过期内容，建立干净的工作区。

| 任务 | 操作 | 验证标准 |
|---|---|---|
| 2.1 评估并删除 `.worktrees/` | 先 grep 确认无有用改动，再删除 3 个工作树 | `.worktrees/` 不存在 |
| 2.2 评估未合并分支 | 逐个 `git log main..branch` 检查，有用改动 cherry-pick，无用则 `git branch -D` | 仅保留必要分支 |
| 2.3 清理重复测试 | 对比 `tests/router/router.test.js` 与 `index.test.js`，保留更完整的 | 仅保留 1 个 router 测试文件 |
| 2.4 排查未使用依赖 | grep `animejs`/`howler`/`swiper`/`chart.js` 在 src/ 的引用 | 未使用的从 package.json 移除 |
| 2.5 验证 TD-9 状态 | grep `IntersectionObserver` 确认无残留，更新 TODO.md 关闭 TD-9 | TODO.md 状态更新 |
| 2.6 构建验证 | `npm run build && npm run typecheck && npm test` | 全部通过 |

**产出**：干净的工作区 + 精简的依赖 + 更新的 TODO.md

### P3：中风险统一（中风险）

**目标**：消除重复实现，统一命名与规范，收紧 lint。

| 任务 | 操作 | 文件影响 | 验证标准 |
|---|---|---|---|
| 3.1 抽取 sanitizeBody | 创建 `server/src/utils/sanitize.ts`，两个 middleware 改为引用 | requestLogger.ts、auditLogger.ts | 构建通过 + 测试通过 |
| 3.2 抽取 Sentry 单例 | `errorReporting.js` 改为 `getSentry()` 单例模式，4 处导入统一 | errorReporting.js | 构建通过 + 测试通过 |
| 3.3 抽取 DDL 共享模块 | 创建 `server/src/database/schema.ts`，init.ts 和 migrate.ts 引用 | init.ts、migrate.ts | `npm run db:init` 正常 |
| 3.4 统一 services/ 命名 | 全部改为 camelCase（如已是则跳过） | src/services/*.js | ESLint 通过 |
| 3.5 补全文件头注释 | HUD 组件、新增文件补 `@file/@description/@module` | ~5 个文件 | 覆盖率 100% |
| 3.6 收紧 ESLint 规则 | 启用 `no-unused-vars: error`、`no-console: error`、`prefer-const: error` | eslint.config.js | `npm run lint` 零错误 |
| 3.7 构建验证 | 全套构建 + 测试 | - | 全部通过 |

**产出**：零重复实现 + 统一命名 + 收紧的 lint + 100% 文件头注释

### P4：高风险重构（高风险，按 TD 项切子分支）

**目标**：解决架构耦合与核心技术债。每个 TD 项独立子分支，独立验证。

| 子任务 | 操作 | 风险缓解 | 验证标准 |
|---|---|---|---|
| 4.1 TD-13 CSS 变量迁移 | 按 TODO.md 既定 4 组推进（基础组件→UI→Admin→用户页面） | 每组改完跑 `css-var-lint --strict` | 0 deprecated 引用 |
| 4.2 Store-1 解耦 | calendar.js 改为参数注入 userId，调用方组件传入 | 跑 calendar store 测试 | 测试通过 + 手动验证 |
| 4.3 TD-7 合并冗余 SELECT | Service update 方法合并存在性检查与 UPDATE | 跑 Service 测试 + 手动验证 CRUD | 测试通过 |
| 4.4 TD-11 Knex 配置深拷贝 | knexfile.js 各环境深拷贝 dbConfig | 跑 migrate 测试 | `db:migrate` 正常 |
| 4.5 TD-12 ICS 转义 | 添加 `escapeIcsText()` 工具，eventService 调用 | 跑 eventService 测试 | 测试通过 |
| 4.6 锚点测试补充 | P4 重构前，为待重构模块补少量关键路径测试（非完整特征测试） | 作为重构安全网 | 覆盖率不降 |
| 4.7 构建验证 | 每个子任务合并前 + P4 整体合并前 | - | 全部通过 |

**产出**：核心技术债清零 + Store 解耦 + CSS 变量统一

### P5：测试闭环 + 验收（中风险）

**目标**：补齐关键路径测试，建立覆盖率门禁，生成指标对比报告。

| 任务 | 操作 | 验证标准 |
|---|---|---|
| 5.1 前端覆盖率门禁 | 配置 vitest coverage thresholds（语句 ≥60%） | `npm run test:coverage` 通过门禁 |
| 5.2 前端关键路径测试 | 补 Store 异步错误分支、Service 降级、路由守卫测试 | 覆盖率达标 |
| 5.3 后端覆盖率提升 | 补 Service 层边界测试至 ≥70% | 覆盖率达标 |
| 5.4 E2E 补齐 | 补 Fleet 详情流程、Admin 基础流程 2 个 spec | E2E spec ≥7 |
| 5.5 采集重构后指标 | 同 P1.1 采集方式 | 生成 `after-metrics.json` |
| 5.6 生成对比报告 | 对比 baseline vs after，4 维指标 | 生成 `docs/refactor/refactor-report.md` |
| 5.7 更新项目记忆 | 更新 project_memory.md 进度、决策、经验 | 记忆已更新 |
| 5.8 最终合并 PR | `refactor/systematic-cleanup` → `main`（含对比报告） | PR 合并 |

**产出**：完整测试闭环 + 4 维指标对比报告 + 合并到 main

---

## 6. 指标体系与验收标准

### 6.1 指标采集脚本

**位置**：`scripts/collect-metrics.mjs`（新建）

**采集维度**：

| 维度 | 指标 | 采集方式 |
|---|---|---|
| 代码质量 | 前端/后端 LOC | 文件遍历 + 行数统计 |
| 代码质量 | 文件数 | glob 统计 |
| 代码质量 | 重复代码块 | `npx jscpd`（如未安装则 N/A） |
| 代码质量 | 依赖数 | 读取 package.json dependencies |
| 测试质量 | 语句/分支/函数覆盖率 | `npm run test:coverage` 输出解析 |
| 测试质量 | 测试用例总数 | 测试输出解析 |
| 测试质量 | E2E spec 数 | glob `e2e/*.spec.js` |
| 性能 | 生产包体积 | `vite build` 输出的 dist/assets 总大小 |
| 性能 | 首屏 chunk 大小 | `vite build` 输出的 entry chunk 大小 |
| 工程规范 | ESLint 错误/警告数 | `npm run lint` 输出解析 |
| 工程规范 | TypeScript 错误数 | `npm run typecheck` 输出解析 |
| 工程规范 | TODO/FIXME 数 | grep 统计 |
| 工程规范 | 文件头注释覆盖率 | grep `@file` 占比 |

**输出**：`docs/refactor/{baseline,after}-metrics.json`

### 6.2 验收标准（Definition of Done）

#### P1 验收
- `docs/refactor/baseline-metrics.json` 存在且字段完整
- `git status` 干净（无未提交、无未跟踪）
- `refactor/systematic-cleanup` 分支存在

#### P2 验收
- `.worktrees/` 目录不存在
- 未合并分支已评估处理（保留或删除有记录）
- `tests/router/` 仅 1 个测试文件
- `package.json` 无未使用依赖（animejs/howler/swiper/chart.js 已验证）
- TODO.md TD-9 状态更新
- `npm run build && npm run typecheck && npm test` 全部通过

#### P3 验收
- `server/src/utils/sanitize.ts` 存在，两个 middleware 引用之
- `errorReporting.js` 仅 1 处 Sentry 导入
- `server/src/database/schema.ts` 存在，init.ts/migrate.ts 引用之
- `src/services/*.js` 全部 camelCase
- 文件头注释覆盖率 100%
- `npm run lint` 零错误（含新启用的 `no-unused-vars`/`no-console`/`prefer-const`）
- 全套构建测试通过

#### P4 验收
- TD-13：CSS 变量 deprecated 引用 = 0（`css-var-lint --strict` 通过）
- TD-9：TODO.md 已关闭（在 P2 处理）
- Store-1：calendar.js 无 `useAuthStore` 直接依赖
- TD-7：Service update 方法无冗余 SELECT
- TD-11：knexfile.js 各环境独立配置
- TD-12：eventService ICS 导出含转义
- P1-16：init.ts/migrate.ts 无 DDL 重复（在 P3 处理）
- 全套构建测试通过

#### P5 验收（最终）
- 前端覆盖率门禁：语句 ≥60%（vitest thresholds 配置完成）
- 后端覆盖率：语句 ≥70%
- E2E spec ≥7
- `docs/refactor/after-metrics.json` 存在且字段完整
- `docs/refactor/refactor-report.md` 存在，含 4 维指标对比表
- 对比报告显示：代码质量指标不退化、测试质量指标提升、工程规范指标提升
- project_memory.md 已更新
- `refactor/systematic-cleanup` → `main` PR 已创建

### 6.3 退化红线（不可接受的结果）

以下情况视为重构失败，必须回滚或补救：
- 任何覆盖率指标下降超过 5 个百分点
- 生产包体积增长超过 10%
- ESLint 错误数从 0 变为 >0
- TypeScript 错误数从 0 变为 >0
- 任何已通过测试变为失败

---

## 7. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|---|---|---|
| P4 CSS 变量迁移影响视觉 | 视觉回归 | 每组改完手动视觉确认 + `css-var-lint --strict` |
| Store 解耦破坏 calendar 功能 | 功能回归 | 锚点测试 + 手动验证 myEvents |
| Service 冗余 SELECT 合并引入 bug | 数据完整性 | 锚点测试 + 手动 CRUD 验证 |
| ESLint 收紧导致大量现有代码报错 | 阻塞构建 | 渐进式启用：先 warning，再升级 error |
| .worktrees/ 误删有用改动 | 代码丢失 | 删除前 grep + git log 评估，有用改动 cherry-pick |

---

## 8. 与现有文档的关系

| 现有文档 | 关系 |
|---|---|
| `docs/TODO.md` | 本次重构处理 TD-7/8/9/10/11/12/13 + P1-16 + Store-1 + N-1/2/3 + T-1/2/3/4，完成后更新 TODO.md 状态 |
| `docs/ROADMAP.md` | 本次重构对应 v1.4.0/v1.5.0 路线图部分目标，完成后更新进度 |
| `docs/ARCHITECTURE.md` | 重构后架构变化（如新增 schema.ts、sanitize.ts）需同步更新 |
| `docs/superpowers/plans/2026-06-25-production-launch.md` | 保留不动，本次重构不涉及部署 |
