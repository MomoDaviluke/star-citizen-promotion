# 项目待办任务清单

> **项目**: Star Citizen 战队宣传网站
> **更新日期**: 2026-06-15
> **版本**: v1.3.4

---

## 任务优先级说明

- **P0 (阻断上线)**: 必须立即修复，影响系统可用性或安全性
- **P1 (高优先级)**: 影响核心功能，需要在近期解决
- **P2 (中优先级)**: 影响用户体验，按计划排期
- **P3 (低优先级)**: 优化改进，有空闲时处理

---

## P0 — 阻断上线（全部完成 ✅）

| 编号 | 任务 | 影响文件 | 当前状态 | 备注 |
|:---|:---|:---|:---|:---|
| P0-1 | **修复后端测试失败** | `server/tests/auth.test.ts` | ✅ 已修复 | `authenticate` 改为 async/await，测试补 `mockQueryOne.mockResolvedValue` |
| P0-2 | **修复 admin 路由测试** | `server/tests/routes/admin.test.ts` | ✅ 已修复 | 测试补 `confirmPassword` 请求体 + bcrypt mock，新增 403/400 安全场景 |
| P0-3 | **修复依赖版本错误** | `server/package.json` | ✅ 已修复 | `dotenv@^17.3.1` → `^16.4.5`；`@types/node@^25.6.0` → `^20.14.0` |
| P0-4 | **提升后端测试覆盖率** | `server/tests/**/*.test.ts` | ✅ CI 门禁达标 | 语句覆盖 63.86% ≥ 60% 门禁。新增 auth 中间件错误分支测试 3 条 |

### P0-1 修复详情

**根因**: `authenticate` 同步函数签名 + 内部 `.then().catch()` 导致测试 `await` 等到 `void`。同时测试未设 `mockQueryOne` 返回值，即使时序正确也会走 `!user` 分支。

**修复**:
```typescript
// server/src/middleware/auth.ts — 重构为 async/await，分离 jwt 验证和 DB 查询的错误处理
export async function authenticate(req, _res, next): Promise<void> {
  // jwt.verify 同步抛出 → 独立 try/catch
  // queryOne 异步 → await + 独立 try/catch
  // 保持原有错误语义：jwt 错误 → 401，DB 错误 → 500
}
```

**测试修复**:
- 补 `mockQueryOne.mockResolvedValue({ id: '1', role: 'member' })`
- 修正期望值类型 `{ id: 1 }` → `{ id: '1', role: 'member' }`
- 新增 3 条分支覆盖测试（用户不存在、DB 异常、角色查询异常）

### P0-2 修复详情

**根因**: 路由加了 `adminActionValidation`（要求请求体 `{ confirmPassword: '...' }`）和 `verifyAdminPassword`（bcrypt 密码比对），测试未同步更新。

**修复**: 重写测试文件，mock `bcryptjs.compare` + `database/pool.queryOne`，新增 2 个安全测试场景（确认密码错误 → 403、缺少确认密码 → 400），覆盖 reset-db 和 clear-cache 各 4 个场景。

---

## P1 — 高优先级（全部完成 ✅）

| 编号 | 任务 | 影响范围 | 状态 | 备注 |
|:---|:---|:---|:---|:---|
| P1-1 | 清理前端 console.log | `src/**/*.js` | ✅ 已完成 | 全量扫描 src/ 目录，零 `console.log` 残留 |
| P1-2 | 补充 site.config.js 占位值 | `src/config/site.config.js` | ✅ 已完成 | QQ群号、Discord/邮箱/社交链接、团队介绍文案全部补完 |
| P1-3 | 补充 package.json 元信息 | `package.json`, `server/package.json` | ✅ 已完成 | author, license, repository, bugs, homepage, keywords |
| P1-4 | API 限流中间件 | `server/src/index.ts` | ✅ 已实现 | `express-rate-limit` 分层：admin 1000/15min，普通 100/15min，按 userId 或 IP 做 key |
| P1-5 | 请求日志关联 ID | `middleware/requestId.ts` → `requestLogger.ts` | ✅ 已实现 | requestId 生成 UUID → 注入 req.id → requestLogger 读取并写入日志 |

---

## P0 — 代码审查发现的严重问题（2026-06-08 深度审查）

| 编号 | 任务 | 影响文件 | 状态 | 备注 |
|:---|:---|:---|:---|:---|
| P0-5 | **缓存键忽略查询参数，导致数据串台** | `server/src/middleware/cache.ts:166` | ✅ 已修复 | `buildCacheKey` 加入排序后的 query string |
| P0-6 | **申请提交路由缺少认证，任意用户可刷申请** | `server/src/routes/applications.ts:59` | ✅ 已修复 | 添加 `optionalAuth` 中间件，可选追踪提交者 |
| P0-7 | **前端 auth store 变量遮蔽，错误信息永远不显示** | `src/stores/auth.js:70,92,131,157` | ✅ 已修复 | catch 块改用 `errObj` 避免遮蔽 ref |
| P0-8 | **Login.vue 绕过 authStore 直接调用 authService** | `src/views/Login.vue:185` | ✅ 已修复 | 改为调用 `authStore.login()`，测试同步更新 |

### P0-5 修复详情

**根因**: `buildCacheKey` 只使用 `req.path`，完全忽略查询参数。分页、筛选、排序请求会复用同一个缓存条目。

**修复**:
```typescript
function buildCacheKey(req: Request): string {
  const sorted = [...new URLSearchParams(req.url.split('?')[1] || '')]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  return `GET:${req.path}${sorted ? '?' + sorted : ''}`
}
```

### P0-6 修复详情

**根因**: `POST /api/applications` 使用 `optionalAuth` 而非 `authenticate`，且服务层缺少 `userId` 校验。

**修复**: 将路由中间件改为 `authenticate`，在 service 中绑定 `userId`。

### P0-7 修复详情

**根因**: `login`/`register`/`fetchUser`/`updateProfile` 的 catch 块中 `const error = err instanceof Error ...` 遮蔽了 store 顶层的 `const error = ref(null)`。

**修复**: 改用不同变量名 `const errObj = ...`，避免遮蔽。

### P0-8 修复详情

**根因**: 登录页直接 `import { authService }` 并调用 `authService.login()`，绕过了 `authStore.login()`。

**修复**: 改为调用 `authStore.login()`，统一状态管理。

---

## P1 — 代码审查发现的高优先级问题（2026-06-08 深度审查）

| 编号 | 任务 | 影响文件 | 状态 | 备注 |
|:---|:---|:---|:---|:---|
| P1-6 | **速率限制对已登录用户无效** | `server/src/index.ts:196` | ✅ 已修复 | 移除无效的 admin 提额逻辑，简化为 IP 限流 |
| P1-7 | **requireRole 重复查询数据库** | `server/src/middleware/auth.ts:99` | ✅ 已修复 | 直接使用 `req.user.role`，不再查库，测试同步更新 |
| P1-8 | **登录 SELECT * 泄露 password_hash** | `server/src/services/authService.ts:80` | ✅ 已修复 | 明确列出字段，排除 password_hash |
| P1-9 | **WebSocket 心跳 O(n²) 复杂度** | `server/src/websocket.ts:158` | ✅ 已修复 | 添加 ws→clientId 反向映射，O(1) 查找 |
| P1-10 | **gracefulShutdown 逻辑缺陷** | `server/src/index.ts:347` | ✅ 已修复 | await server.close + setTimeout.unref |
| P1-11 | **vite loadEnv 空前缀暴露敏感变量** | `vite.config.js:30` | ✅ 已修复 | 改为 `loadEnv(mode, process.cwd(), 'VITE_')` |
| P1-12 | **manualChunks 配置可能不生效** | `vite.config.js:183` | ✅ 已修复 | 改为函数形式按路径匹配 |
| P1-13 | **App.vue provide 无人消费** | `src/App.vue:276` | ✅ 已修复 | 删除 provide 语句 |
| ~~P1-14~~ | ~~Home.vue 数据硬编码与 API 脱节~~ | `src/views/Home.vue:263` | ✅ 已修复 | v1.3.4 设计改版重写 Home.vue，数据结构已重构 |
| P1-15 | **metrics 端点缺少 Promise 错误处理** | `server/src/middleware/metrics.ts:167` | ✅ 已修复 | 添加 .catch() 错误处理 |
| P1-16 | **DDL 在 init.ts 和 migrate.ts 完全重复** | `server/src/database/init.ts` + `migrate.ts` | ⚠️ 待修复 | ~200 行重复 DDL，应抽取为共享 schema 模块 |

---

## 紧急 — 本周内完成

| 编号 | 任务 | 影响范围 | 状态 | 备注 |
|:---|:---|:---|:---|:---|
| ~~URG-1~~ | ~~Git 工作区清理~~ | 全项目 ~140 文件 | ✅ 已完成 | v1.3.3 已清理并推送到 GitHub |
| ~~URG-2~~ | ~~修复前端测试失败~~ | 3 文件 28 个用例 | ✅ 已完成 | 408 测试通过/1 跳过，选择器和文案已适配重构后组件 |
| URG-3 | 验证生产构建 | vite-plugin-pwa | ⚠️ 未完成 | 沙箱 EPERM 需在本地验证 |

---

## P3 — 低优先级

| 编号 | 任务 | 影响范围 | 预期收益 |
|:---|:---|:---|:---|
| P3-1 | 国际化支持 (i18n) | 全站 | 支持多语言 |
| P3-2 | ~~暗黑模式~~（实为亮色主题切换） | `src/styles/`, `src/composables/useTheme.js` | ✅ 已实现 | `data-theme="light"` 变量全套 + localStorage 持久化 + 首屏防闪烁 |
| P3-3 | ~~PWA 支持~~ | `vite.config.js`, `src/composables/usePwa.js`, `src/components/PwaUpdateToast.vue`, `src/views/Offline.vue`, `public/pwa-icon.svg` | ✅ 已实现 | vite-plugin-pwa 1.3 + Workbox 运行时缓存（API NetworkFirst / 图片字体 CacheFirst）+ 自动更新 Toast + 离线页 |
| P3-4 | 性能监控 (RUM) | 前端 | 真实用户性能数据 |
| P3-5 | ~~自动化安全扫描~~ | `.github/workflows/codeql.yml`, `.snyk`, `.githooks/` | ✅ 已实施 | npm audit fix 漏洞清零 + CodeQL 静态分析 + Snyk CI 集成 + pre-commit/pre-push 安全钩子 |

---

## 技术债务追踪

| 编号 | 问题 | 引入版本 | 状态 | 备注 |
|:---|:---|:---|:---|:---|
| TD-1 | ~~认证中间件使用 `.then()` 而非 `async/await`~~ | v1.0.0 | ✅ 已解决 | v1.3.0 重构为 async/await |
| TD-2 | 部分测试用例依赖执行顺序 | v1.1.0 | 🔄 待观察 | 覆盖率已达标，后续迭代关注 |
| TD-3 | ~~前端 console.log 未清理~~ | v1.2.0 | ✅ 已解决 | v1.3.0 确认零残留 |
| TD-4 | ~~数据库查询未使用连接池监控~~ | v1.0.0 | ✅ 已解决 | v1.3.0 `queryWithTiming` + `getPoolStatus` |
| TD-5 | ~~缺少 API 版本控制~~ | v1.0.0 | ✅ 已解决 | v1.1.0 已实施 `/api/v1/` 版本路由 |
| ~~TD-6~~ | ~~缓存键未包含查询参数~~ | v1.3.1 | ✅ 已修复 | `buildCacheKey` 加入排序后的 query string |
| TD-7 | Service update 函数冗余 SELECT | v1.0.0 | ⚠️ 待修复 | 先 SELECT 检查存在性再 UPDATE，可合并为一次查询 |
| TD-8 | sanitizeBody 在两个文件中重复实现 | v1.1.0 | ⚠️ 待修复 | `auditLogger.ts` 和 `requestLogger.ts` 各自实现脱敏逻辑 |
| TD-9 | 两套重复滚动揭示动画系统 | v1.2.0 | 🔄 部分解决 | composable 层已统一：`useScrollReveal.js` 已删除，`directives/scrollReveal.js` 已基于 GSAP ScrollTrigger。但 `Home.vue` 第 219-225 行仍有内联 IntersectionObserver 代码（P1 基线引入），需在 P3 阶段迁移到 GSAP |
| TD-10 | Sentry 动态导入重复 4 次 | v1.3.1 | ⚠️ 待修复 | `errorReporting.js` 每个函数独立 `import('@sentry/vue')` |
| TD-11 | Knex 配置共享同一对象引用 | v1.0.0 | ⚠️ 待修复 | `knexfile.js` 中 development/production/test 共用 `dbConfig` |
| TD-12 | Event ICS 导出未转义特殊字符 | v1.1.0 | ⚠️ 待修复 | 分号、逗号、反斜杠未转义，可能导致 ICS 格式损坏 |
| TD-13 | 183 处旧变量名引用待迁移 | v1.3.4 | 🔄 进行中 | 别名已止血（47个别名映射），分4组迁移：①基础组件~55处 ②UI组件~30处 ③Admin页面~60处 ④用户页面~38处。每组改完跑lint --strict验证。详见下方迁移计划 |

### TD-13 CSS变量迁移计划

**执行方式**：
- 每组开 feature branch（`refactor/css-vars-group-1` ~ `group-4`），改完 lint --strict + dev 视觉确认后 merge 到 main
- 每组改完跑 `node scripts/css-var-lint.mjs . --strict`，deprecated 从 warning 升级 error，全过才算完成
- 第一组额外检查：`--text-secondary`（label级）和 `--text-muted`（dim级）在组件里是否有混用，确认每个组件确实需要两个层级

| 组 | 组件 | 引用数 | 风险 | 状态 |
|:---|:---|:---|:---|:---|
| ① 基础组件 | BaseButton(12), BaseCard(10), BaseModal(7), BaseTooltip(7), BaseBadge(6) | ~55 | 高（全站复用） | ✅ 已完成（branch: refactor/css-vars-group-1） |
| ② UI组件 | ShipCard(8), TechButton(6), MFDPanel(5), DataDisplay(4), StatusIndicator(4), HoloCard(1) | ~30 | 中（首页可见） | 📋 待开始 |
| ③ Admin页面 | ApplicationsAdmin(8), AdminLayout(7), Dashboard(7), PilotsAdmin(6), ProjectsAdmin(6), Settings(6), MembersAdmin(5) | ~60 | 低（后台页面） | 📋 待开始 |
| ④ 用户页面+杂项 | Calendar(9), Profile(6), ApplicationStatus(5), Offline(4), PwaUpdateToast(4), PageTitle(3), LoadingIndicator(2), ThemeToggle(1), SiteHeader(1), StarfieldBg(1) | ~38 | 低 | 📋 待开始 |

**变量名映射**（旧→新）：
- `--text-muted` → `--color-text-dim` (20处)
- `--text` → `--color-text` (11处)
- `--accent` → `--color-accent` (11处)
- `--text-primary` → `--color-text-heading` (10处)
- `--danger` → `--color-status-danger` (10处)
- `--line` → `--color-border` (10处)
- `--text-secondary` → `--color-text-secondary` (9处)
- `--transition-fast` → `--transition-fast` (8处，确认定义存在)
- `--border-medium` → `--color-border-medium` (8处)
- `--accent-2` → `--color-accent-secondary` (8处)
- 其余37个变量各1-6处，映射关系见 `variables.css` 别名块

---

## 质量门禁

| 指标 | 当前值 | 目标值 | 状态 |
|:---|:---|:---|:---|
| 后端语句覆盖率 | 63.86% | ≥ 60% | ✅ 已达标 |
| 后端分支覆盖率 | 72.00% | ≥ 60% | ✅ 已达标 |
| 后端函数覆盖率 | 85.88% | ≥ 70% | ✅ 已达标 |
| 后端测试通过率 | 310/310 (100%) | 100% | ✅ 已达标 |
| 前端单元测试通过率 | 100% | 100% | ✅ 已达标 |
| E2E 测试 spec 数 | 5 | ≥ 3 | ✅ 已达标 |
| ESLint 错误数 | 0 | 0 | ✅ 已达标 |
| TypeScript 编译错误 | 0 | 0 | ✅ 已达标 |
| 高危安全漏洞 | 0 | 0 | ✅ 已达标 |
| CSS 变量断裂引用 | 0 | 0 | ✅ 已达标（lint 脚本 CI 集成） |
| CSS 变量 deprecated 引用 | 183 | 0 | ⚠️ 别名止血，本周迁移 |

### v1.4.0 质量目标（详见 [ROADMAP.md](ROADMAP.md)）

| 指标 | 目标值 | 状态 |
|:---|:---|:---|
| 后端语句覆盖率 | ≥ 70% | 📋 待实施 |
| 前端估算覆盖率 | ≥ 70% | 📋 待实施 |
| E2E spec 数 | ≥ 7 | 📋 待实施 |
| 0% 模块补测试 | websocket/metrics/swagger | 📋 待实施 |
| 日志轮转 | winston-daily-rotate-file | 📋 待实施 |
| 数据库备份 | Docker 容器定时备份 | 📋 待实施 |

> 覆盖率从 64.69% 微降至 63.86%，原因是 v1.1.0 企业级改进引入的 `websocket.ts`、`swagger.ts`、`metrics.ts` 等模块（约 500 行）尚未写测试，拉大了分母。核心业务模块（auth/admin/services）覆盖率均在 92%~98%。

---

## 近期里程碑

| 里程碑 | 目标日期 | 关键交付物 | 状态 |
|:---|:---|:---|:---|
| v1.2.1 补丁 | 2026-06-01 | P0 任务全部完成 | ✅ 已完成 (2026-05-28) |
| v1.3.0 版本 | 2026-05-28 | P0 + P1 全部完成，295/295 测试通过 | ✅ 已完成 |
| v1.3.1 版本 | 2026-05-31 | 文档体系完善、安全扫描清零 | ✅ 已完成 |
| v1.3.4 版本 | 2026-06-15 | 设计改版（SpaceX极简）、设计系统收口、CSS变量lint、CI/CD修复 | ✅ 已完成 |
| v1.4.0 版本 | 2026-06-21 | 后端 ≥70%、日志轮转、数据库备份、SSL 自动化、183处变量迁移 | 🔄 进行中 |
| v1.5.0 版本 | 2026-06-28 | 前端 ≥70%、E2E 7 spec、API v1 迁移 | 📋 计划中 |
| v1.6.0 版本 | 2026-07-05 | httpOnly Cookie JWT、安全架构完善 | 📋 计划中 |

> 详细优化方案见 [ROADMAP.md](ROADMAP.md)

---

## 任务完成记录

| 日期 | 完成任务 | 完成人 |
|:---|:---|:---|
| 2026-06-15 | v1.3.4：设计改版（SpaceX极简风格 Home.vue 重写）、设计系统收口（accent色统一#4a9eff）、断裂CSS变量修复、CSS变量lint脚本集成CI、CI/CD覆盖率阈值修复、vite/vitest安全升级 | AI Assistant (Hanako) + senior-revie |
| 2026-05-31 | 第二阶段运维加固：日志轮转（winston-daily-rotate-file）、数据库自动备份（Docker backup 服务）、SSL 证书自动化（certbot 容器）、文档同步更新 | AI Assistant (Hanako) |
| 2026-05-31 | 第一阶段测试补全：websocket.ts（17 测试）、metrics.ts（10 测试）、swagger.ts（8 测试）、ROADMAP.md 优化路线图、文档体系扩充至 14 份 | AI Assistant (Hanako) |
| 2026-05-31 | 文档体系重建：修正 8 份文档与代码偏差、新增 DEPLOYMENT/SECURITY/MONITORING/CONTRIBUTING 4 份文档、package.json 版本号修正 | AI Assistant (Hanako) |
| 2026-05-28 | v1.3.0：P0 四项 + P1 五项全部修复，295/295 测试通过，6 个跨项目 skill 安装 | AI Assistant (Hanako) |
| 2026-05-27 | 文档清理与重建 | AI Assistant |
| 2026-05-20 | v1.2.0 发布 | 开发团队 |
| 2026-04-15 | v1.1.0 发布 | 开发团队 |
| 2026-03-10 | v1.0.1 发布 | 开发团队 |
| 2026-03-01 | v1.0.0 初始发布 | 开发团队 |
