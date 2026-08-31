# 项目待办任务清单

> **项目**: Star Citizen 战队宣传网站
> **更新日期**: 2026-08-31
> **版本**: v1.7.1

---

## 任务优先级说明

- **P1 (高优先级)**: 影响核心功能，需近期解决
- **P2 (中优先级)**: 功能推进，按计划排期
- **P3 (低优先级)**: 技术债缓行项 / 远期优化

---

## 未完成任务

### M0 — Admin CRUD 系统性补齐（2026-08-30）

| 编号 | 任务 | 状态 | 备注 |
|:--|:--|:--|:--|
| M0-1 | MembersAdmin 测试先行（7 新用例 TDD 红） | ✅ 已完成 | 2026-08-30 |
| M0-2 | MembersAdmin 新增/编辑弹窗实现（TDD 绿） | ✅ 已完成 | 修复 editMember 半成品 |
| M0-3 | Projects/Pilots/Dashboard 死链修复 | ✅ 已完成 | `/admin/*/new` 系统性死链清零 |
| M0-4 | 验证与提交 | ✅ 已完成 | 411/411、typecheck 0、build 通过 |
| M3-1 | `e2e/fleet.spec.js`（列表/筛选/详情跳转） | ✅ 已完成 | 7 用例（2026-08-30） |
| M3-2 | `e2e/admin.spec.js`（登录→成员 CRUD 往返） | ✅ 已完成 | 5 用例，端到端验收 M0（2026-08-30） |
| TD-25 | 路由守卫未等待 auth 初始化，刷新/直访 /admin 被误踢登录页 | ✅ 已完成 | beforeEach 改 async + await initializeAuth |
| TD-26 | 6 个 admin 子页面双重 AdminLayout 包裹（无 slot）致内容不渲染 | ✅ 已完成 | 移除子页面 AdminLayout 包装 |
| TD-27 | ApplicationsAdmin pagination 未兜底，响应无该字段时模板崩溃 | ✅ 已完成 | 赋值兜底 + 模板可选链 |
| E2E-SW-01 | PWA Service Worker 绕过 page.route，二次请求直连后端 502 | ✅ 已完成 | playwright `serviceWorkers: 'block'` |

### P1 — 上线前缺口

| 编号 | 任务 | 影响范围 | 状态 | 备注 |
|:---|:---|:---|:---|:---|
| TD-14 | AI 前端组件/Composable 无单元测试 | `useAiRecruiter.js` + 5 个 `components/ai/*.vue` | ✅ 已完成 | +53 用例（2026-08-27）；AI 文件行覆盖 94.2% / composable 97.4%，≥80% 达标 |
| TD-15 | AI 招募官无 E2E spec | `e2e/` | ✅ 已完成 | 新增 `recruiter.spec.js` 3 用例：会话初始化 / 对话→预填链路 / 普通建议（2026-08-27） |
| TD-19 | Home.vue 挂载触发 AI 会话请求，测试无隔离 | `views/Home.vue` + `Home.test.js` | ✅ 已完成 | `Home.test.js` mock RecruiterTerminal 隔离 AI 请求，15 用例通过（2026-08-27） |
| AI-DEP-1 | `ai:ingest` 真实知识库种子验证 | `server/scripts/` | ✅ 已完成 | 2026-08-30 实测：入库 7/7 幂等（二次运行无膨胀）、RAG 检索带 similarity、DeepSeek 真实回答、SSE 125 token 流式 |
| AI-DEP-2 | 生产环境 AI 环境变量注入 | docker-compose | 📋 待实施 | 归入 M2-3：PGVECTOR_URL / REDIS_URL / LLM keys / MONITOR_WEBHOOK_URL 生产清单 |
| OPS-1 | 数据库备份恢复流程演练 | `backups/` | ✅ 已完成 | 2026-08-27 隔离栈演练：mysqldump 备份 → 临时库恢复 → COUNT(*) 全表行数一致（含 --single-transaction --routines --triggers，与 backup.sh 核心命令等价） |

### P2 — 功能推进

| 编号 | 任务 | 状态 | 备注 |
|:---|:---|:---|:---|
| AI-P2 | Phase 2: GEO 搜索优化（llms.txt / JSON-LD / FAQ 入库 / 知识图谱） | ⛔ 已搁置 | 2026-08 项目方向转向，不再推进；SEO 基础（sitemap/robots/预渲染/OG）已于 2026-08-24 交付 |
| AI-P3 | Phase 3: AI 飞船推荐助手（精简版） | ⛔ 已搁置 | 2026-08 项目方向转向，不再推进；RAG 基建已由 AI-DEP-1 验证可用 |
| FE-COV | 前端覆盖率 → ≥70% | 🔄 进行中 | 门禁 49→55→60→65 逐级上调（G4：实测≥目标才上调）；2026-08-31 实测见质量门禁表 |
| E2E-EXT | E2E spec 扩展（fleet / admin） | ✅ 已完成 | spec 7→9（2026-08-30），60 passed / 1 skipped |

### P3 — 缓行技术债 / 远期

| 编号 | 任务 | 状态 | 备注 |
|:---|:---|:---|:---|
| TD-8 | sanitizeBody 重复实现 | ✅ 已完成 | 抽 `utils/sanitizeBody.ts` 统一导出（敏感词合并+递归脱敏），auditLogger/requestLogger 改 import，+13 单测（2026-08-27） |
| TD-9 | 双滚动动画系统并存 | ✅ 已完成 | `useScrollReveal.js`（IntersectionObserver）已不存在，代码已统一为 GSAP ScrollTrigger（Home.vue 注释明示），TODO 记录过时 |
| TD-10 | Sentry 动态导入 ×4 | ✅ 已完成 | 懒加载单例 `loadSentry()`（缓存 promise 消除重复 import）+ SENTRY_ENABLED 守卫；移除 vite `external: ['@sentry/vue']`（静态导入与 external 冲突被 E2E 捕获 → 裸 specifier 运行时崩溃） |
| P1-16 | DDL 重复 ~200 行 | ✅ 已完成 | 抽 `database/schema.ts`（TABLE_SCHEMAS 11 表），init.ts/migrate.ts 消费，消除重复（2026-08-27） |
| TD-13 | CSS 变量迁移②③④组 | ✅ 已完成 | deprecated 引用 109→0（2026-08-27）；映射见下方计划表，全部组标 ✅ |
| TD-2 | 部分测试依赖执行顺序 | 🔄 待观察 | 覆盖率已达标，后续迭代关注 |
| P3-1 | i18n 国际化 | 📋 远期 | 等国际玩家需求 |
| P3-4 | RUM 性能监控 | 📋 远期 | 等用户量起来 |

> TD-8/9/10 + P1-16 技术方案见 [TECH_ARCHIVE_2026-08-26 §6/§7](reports/TECH_ARCHIVE_2026-08-26.md)，单步独立、风险低，择期串行实施。

### TD-13 CSS 变量迁移计划

**执行方式**：每组开 feature branch，改完 `node scripts/css-var-lint.mjs . --strict` 全过 + dev 视觉确认后 merge。

| 组 | 组件 | 引用数 | 风险 | 状态 |
|:---|:---|:---|:---|:---|
| ① 基础组件 | BaseButton/BaseCard/BaseModal/BaseTooltip/BaseBadge | ~55 | 高（全站复用） | ✅ 已完成 |
| ② UI组件 | TechButton(5), MFDPanel(7), StatusIndicator(6)（ShipCard/DataDisplay/HoloCard 已无 deprecated 引用） | ~18 | 中（首页可见） | ✅ 已完成（2026-08-27） |
| ③ Admin页面 | ApplicationsAdmin/AdminLayout/Dashboard/PilotsAdmin/ProjectsAdmin/Settings/MembersAdmin | ~50 | 低（后台页面） | ✅ 已完成（2026-08-27） |
| ④ 用户页面+杂项 | Calendar/Profile/Offline/PwaUpdateToast/PageTitle/LoadingIndicator/ThemeToggle/SiteHeader/StarfieldBg/ErrorBoundary/Home/HeroSection/base.css 等 | ~41 | 低 | ✅ 已完成（2026-08-27） |

**变量名映射**（旧→新，长名优先原则）：
- `--text-muted` → `--color-text-dim` (20处)
- `--text` → `--color-text` (11处)
- `--accent` → `--color-accent` (11处)
- `--text-primary` → `--color-text-heading` (10处)
- `--danger` → `--color-status-danger` (10处)
- `--line` → `--color-border` (10处)
- 其余映射关系见 `variables.css` 别名块

---

## 质量门禁

| 指标 | 当前值 | 目标值 | 状态 |
|:---|:---|:---|:---|
| 后端测试通过率 | 656/656（2026-08-31 实测） | 100% | ✅ |
| 后端语句覆盖率 | 75.35%（整体）/ AI 模块 88.94% | ≥ 60% | ✅ |
| 前端测试通过率 | 616/616（2026-08-31 实测） | 100% | ✅ |
| 前端语句覆盖率 | 69.35%（2026-08-31 实测） | ≥ 65% 门禁（G4：实测≥目标才上调） | ✅ 门禁生效 |
| 前端行 / 分支 / 函数覆盖率 | 70.41% / 69.55% / 68.00%（2026-08-31 实测） | ≥ 65% ×4 项 | ✅ 四项过线 |
| E2E spec | 9 个（fleet/admin/recruiter，含 real-backend 真实往返） | ≥ 5 | ✅ |
| ESLint / TypeScript 错误 | 0 | 0 | ✅ |
| 高危安全漏洞 | 0 | 0 | ✅ |
| CSS 变量断裂引用 | 0 | 0 | ✅（lint CI 集成） |
| CSS deprecated 引用 | 0（2026-08-27 迁移完成） | 0 | ✅ |

---

## 监控模块后续任务（MON）

> 来源：监控模块评审报告（docs/reports/MONITOR_MODULE_REVIEW_2026-08-29.md）+ 模块化执行计划（docs/EXECUTION_PLAN_MONITORING.md）。按 A→B→C→D→E 串行推进。

| 编号 | 任务 | 优先级 | 状态 | 备注 |
|:---|:---|:---|:---|:---|
| MON-A1 | 82 个未提交文件分批审查提交 | P0 | ✅ 已完成 | 6 commit 分组落库（2026-08-29） |
| MON-A2 | alertEngine 类声明格式修复 | P0 | ✅ 已完成 | 评审 M4（2026-08-29） |
| MON-A3 | alertRepository 过时注释修复 | P0 | ✅ 已完成 | 评审 M5（2026-08-29） |
| MON-B1 | Monitor.vue 组件测试 | P0 | ✅ 已完成 | 10 用例，行覆盖 94.15%（2026-08-29） |
| MON-B2 | 设计文档测试基线同步 | P0 | ✅ 已完成 | 本表 + specs 文档（2026-08-29） |
| MON-C1 | Notifier 接口 + NullNotifier | P1 | ✅ 已完成 | 告警外部通知系统（2026-08-30） |
| MON-C2 | WebhookNotifier 四格式实现 | P1 | ✅ 已完成 | 企微/钉钉/飞书/generic（2026-08-30） |
| MON-C3 | 告警引擎接入通知触发 | P1 | ✅ 已完成 | opened/resolved/escalated 三事件（2026-08-30） |
| MON-C4 | 通知链路测试 | P1 | ✅ 已完成 | webhook 12 + 引擎 8 用例（2026-08-30） |
| MON-D1 | monitor_reports 保留期清理 | P1 | ✅ 已完成 | 默认 90 天，对齐 alerts（2026-08-30） |
| MON-D2 | /metrics 历史降采样 | P1 | ✅ 已完成 | 300→60 点（2026-08-30） |
| MON-E1 | browser 字段限长 | P2 | ✅ 已完成 | 评审 L1（2026-08-30） |
| MON-E2 | 回报列表分页 | P2 | ✅ 已完成 | 评审 L2（2026-08-30） |
| MON-E3 | hitAgain 时间戳统一 | P2 | ✅ 已完成 | 评审 L3（2026-08-30） |
| MON-E4 | searchByRequest 滚动定位 | P2 | ✅ 已完成 | 评审 L4（2026-08-30） |
| MON-F1~F3 | 多实例聚合/告警静默/趋势报表 | P3 | 📋 远期 | 仅设计预留 |

---

## 近期里程碑

| 里程碑 | 日期 | 状态 |
|:---|:---|:---|
| v1.5.0 AI 基础设施 + 招募官 Agent | 2026-08-03 | ✅ |
| v1.6.0 转化埋点 + 安全架构 | 2026-08-10 | ✅ |
| v1.6.1 技术债快修 TD-7/11/12 | 2026-08-10 | ✅ |
| v1.6.2 上线前评审修复 | 2026-08-24 | ✅ |
| 收尾批次（覆盖加固/E2E 真实链路/端口收紧） | 2026-08-26 | ✅ |
| v1.6.4 监控模块评审闭环 | 2026-08-30 | ✅ |
| v1.6.5 版本对齐 + 文档失真修正 | 2026-08-30 | ✅ |
| v1.7.0 M1 AI 部署验证 + AI-SLOT 通用槽位制 | 2026-08-30 | ✅ |
| v1.7.1 M4 转化流补测 + 门禁 60 + CI 红灯修复 | 2026-08-30 | ✅ |
| ~~v1.7.0 AI Phase 2 GEO~~ | — | ⛔ 已搁置（项目方向转向） |
| ~~v1.8.0 AI Phase 3 选舰助手~~ | — | ⛔ 已搁置（项目方向转向） |

> 完整版本历史见 [CHANGELOG.md](../CHANGELOG.md)；执行路线见 [TECH_ROADMAP_2026-08-30.md](TECH_ROADMAP_2026-08-30.md)（ROADMAP.md 已归档）。

---

## 已完成归档（2026-08-27 精简）

以下任务已全部完成，明细（约 200 行）随本次文档精简移除，git 历史可查：

- **P0 ×8**（2026-06 深度审查）：缓存键查询参数、申请路由认证、auth store 变量遮蔽、Login 绕过 store、后端测试失败、admin 路由测试、依赖版本、覆盖率达标
- **P1 ×14**：console.log 清理、site.config 占位值、package.json 元信息、API 限流、请求日志关联 ID、速率限制、requireRole 查库、SELECT 泄露、WebSocket O(n²)、gracefulShutdown、vite loadEnv、manualChunks、App.vue provide、metrics catch
- **URG ×3**：Git 工作区清理、前端测试修复、生产构建验证
- **TD 已解决 ×26**：TD-1/3/4/5/6/7/8/9/10/11/12/13/14/15/16/17/18/19/20/21/22/23/24 + P1-16（含 ICS 转义、knexfile 工厂、冗余 SELECT、覆盖率门禁、E2E 恒真断言、admin 分层、转化埋点、sanitizeBody 抽取、GSAP 动画统一、Sentry 懒加载、DDL 共享化、CSS 变量迁移、AI 前端单测、AI 招募官 E2E、Home 测试隔离、依赖漏洞等）
- **P3 已实现**：亮色主题切换、PWA、自动化安全扫描

详细修复记录见 [CHANGELOG.md](../CHANGELOG.md) 与 [reports/TECH_ARCHIVE_2026-08-26.md](reports/TECH_ARCHIVE_2026-08-26.md)。
