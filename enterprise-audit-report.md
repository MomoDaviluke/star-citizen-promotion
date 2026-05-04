# 企业级项目规范审查报告

**项目**: Star Citizen 战队宣传网站  
**技术栈**: Vue 3 + Vite + Express + MySQL  
**审查日期**: 2026-05-04  
**审查范围**: 前端、后端、DevOps、安全、测试、架构

---

## 📊 总体评分

| 维度 | 评分 (1-5) | 说明 |
|---|---|---|
| 代码安全 | 2/5 | 存在多个高危安全漏洞 |
| 架构设计 | 3/5 | 基本合理，但有多处关键缺陷 |
| 测试质量 | 2.5/5 | 服务层良好，但视图/E2E/集成测试严重不足 |
| CI/CD 成熟度 | 3/5 | 有完整流水线但缺少部署和安全门禁 |
| 代码规范 | 2/5 | ESLint 规则过于宽松，无本地钩子 |
| 企业就绪度 | 2/5 | 缺少 i18n、TypeScript、审计日志等关键特性 |

**综合评分: 2.4/5** — 具备基本功能但距离企业级标准有显著差距

---

## 🔴 P0 - 必须立即修复的严重问题

### 1. 路由守卫未实现 — 任何人可访问管理后台

**文件**: `src/router/index.js`  
**问题**: 路由定义了 `meta: { requiresAuth: true }` 和 `meta: { requiresAdmin: true }`，但 **没有任何 beforeEach 守卫检查这些元信息**。任何人都可以直接访问 `/admin`、`/profile` 等需要认证的页面。

```javascript
// 当前：没有认证检查
router.beforeEach((to, from, next) => {
  // 只做了组件预加载，没有检查 to.meta.requiresAuth
})
```

**修复建议**: 添加认证/授权检查守卫：
```javascript
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return next({ name: '登录', query: { redirect: to.fullPath } })
  }
  if (to.meta.requiresAdmin && !isAdmin()) {
    return next({ name: '首页' })
  }
  if (to.meta.guest && isAuthenticated()) {
    return next({ name: '首页' })
  }
  next()
})
```

---

### 2. 后端 `requireAdmin` 导出缺失 — 所有管理路由将崩溃

**文件**: `server/src/routes/members.js`, `projects.js`, `applications.js`, `pilots.js`  
**问题**: 这四个路由文件都 `import { requireAdmin } from '../middleware/auth.js'`，但 `auth.js` **从未导出** `requireAdmin`（只有 `requireRole`）。这会导致运行时 `SyntaxError`，**所有管理端接口全部不可用**。

**修复建议**: 在 `server/src/middleware/auth.js` 中添加：
```javascript
export const requireAdmin = requireRole('admin')
```

---

### 3. 错误处理器使用了错误的数据库约束错误码

**文件**: `server/src/middleware/errorHandler.js` 第 103 行  
**问题**: `err.code === 'SQLITE_CONSTRAINT'` — 但项目使用的是 **MySQL**（`mysql2` 驱动）。MySQL 的重复键错误码是 `ER_DUP_ENTRY`。

**影响**: 数据库约束冲突（如用户名/邮箱重复）无法返回正确的 409 响应，而是变成 500 内部错误。

**修复建议**:
```javascript
if (err.code === 'ER_DUP_ENTRY') {
  return res.status(409).json(...)
}
```

---

### 4. 硬编码的 JWT 密钥回退值

**文件**: `server/src/config/index.js` 第 27 行  
**问题**: `secret: process.env.JWT_SECRET || 'star-citizen-secret-key-change-in-production'`  
虽然生产环境有 `validateProductionConfig()` 检查，但非生产环境（staging、test）仍会使用此默认值。任何知道此字符串的人都可以伪造合法 JWT。

**修复建议**: 完全移除回退值，启动时若 `JWT_SECRET` 未设置则直接抛出异常。

---

### 5. SQL 中的字符串插值（潜在注入/DoS 风险）

**文件**: `members.js`, `projects.js`, `applications.js`, `pilots.js` 多处  
**问题**: `sql += \` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}\``  
`parseInt` 对非法输入返回 `NaN`，对超大数字无上限保护。项目已有 `pagination.js` 中间件可以正确钳位，但**没有路由使用它**。

**修复建议**: 在所有列表端点应用已有的 `paginate()` 中间件。

---

## 🟠 P1 - 需要尽快修复的高优先级问题

### 6. stats 路由缺少 try/catch

**文件**: `server/src/routes/stats.js`  
**问题**: `GET /api/stats` 处理器没有任何错误捕获，数据库查询失败将导致未处理的 Promise 拒绝。

### 7. 密码修改路由存在空指针风险

**文件**: `server/src/routes/auth.js` 第 262 行  
**问题**: 用户在认证后、查询前可能被删除，`user.password_hash` 会抛出 TypeError。

### 8. 通知应用接口的授权逻辑缺陷

**文件**: `server/src/routes/applications.js` 第 87 行  
**问题**: 使用 `optionalAuth` 但 `req.user` 可能为 undefined，导致未认证用户始终被 403 拒绝。

### 9. Token 刷新无撤销机制

**文件**: `server/src/routes/auth.js` 第 288-328 行  
**问题**: 旧的 JWT 在刷新后仍然有效（无 `jti`、无黑名单），被盗 token 可在 7 天内无限使用。

### 10. 管理路由结构错误 — Dashboard 被加载两次

**文件**: `src/router/index.js`  
**问题**: `/admin` 路由的 `component` 是 `Dashboard.vue`，但其子路由 `path: ''` 也指向 `Dashboard.vue`。父路由应使用 `AdminLayout.vue`。

### 11. 前端路由守卫重复注册

**文件**: `src/App.vue` 和 `src/router/index.js`  
**问题**: 两个文件都在同一个 router 实例上注册 `beforeEach` 守卫，执行顺序不可控，逻辑分散。

### 12. express-rate-limit 未对登录/注册单独限速

**文件**: `server/src/index.js`  
**问题**: 全局 100次/15分钟 的限速对登录/注册端点不够，容易遭受暴力破解。

---

## 🟡 P2 - 架构与规范改进建议

### 13. 无 TypeScript / 类型检查

整个项目使用纯 JavaScript + JSDoc，无编译时类型安全保障。企业级项目应引入 TypeScript 或至少配置 `tsc --checkJs`。

### 14. 无 i18n 国际化支持

所有 UI 字符串硬编码中文。`site.config.js` 已有 `nameEn` 字段，说明考虑过但未实施。

### 15. 无状态管理库

项目仅依赖 `provide/inject` + `localStorage`。随着功能增长，缺少 Pinia 等状态管理会导致：
- 跨组件状态同步困难
- DevTools 无法调试状态变化
- 认证状态管理分散

### 16. provide/inject 使用字符串键

使用 `'notification'`、`'loading'` 等字符串键存在命名冲突风险，应使用 `Symbol()` 或 `InjectionKey<T>`。

### 17. JWT 存储在 localStorage

XSS 攻击可窃取 localStorage 中的 token。企业级安全要求应使用 `httpOnly` cookie。

### 18. 无集中式表单验证

`Login.vue`、`Join.vue`、`Register.vue` 各自实现内联验证逻辑（邮箱正则、必填校验），大量重复代码。应引入 VeeValidate + Zod/Yup。

### 19. 后端无 API 版本控制

所有路由挂载在 `/api/` 下，无 `/api/v1/` 前缀。破坏性变更将直接影响所有客户端。

### 20. 无数据库迁移框架

使用 `CREATE TABLE IF NOT EXISTS` 建表，无版本化迁移。Schema 变更无法追踪和回滚。应引入 knex 或 Sequelize migrations。

### 21. 无软删除

所有 DELETE 操作为硬删除，数据永久丢失。企业级项目应实现 `deleted_at` 软删除机制。

### 22. 审计日志表存在但未使用

`activity_logs` 表已创建但无任何路由或中间件写入数据。管理员操作无审计追踪。

### 23. JWT 工具模块未被使用

`server/src/utils/jwt.js` 提供了 `generateToken`、`verifyToken`、`decodeToken`，但路由和中间件直接调用 `jwt.sign/verify`，绕过了集中化模块。

### 24. requestLogger 使用 console 而非 Winston

`server/src/middleware/requestLogger.js` 使用 `console.log/console.error`，应使用项目已配置的 Winston logger。

### 25. 事务功能存在但未使用

`pool.js` 导出 `transaction()` 帮助函数，但所有多步操作未使用事务保护。

### 26. dataService 静态回退静默吞错误

当 `VITE_USE_API=true` 且 API 调用失败时，错误仅 `console.warn` 并返回静态数据，调用方无法区分真实响应和回退数据。

---

## 🔵 P3 - 测试与 DevOps 改进

### 27. 无 Git 钩子（Husky + lint-staged + commitlint）

开发者可以在本地提交未通过 lint 的代码，问题仅在 CI 阶段才发现。缺少：
- pre-commit: 运行 ESLint --fix + Prettier
- commit-msg: 强制 Conventional Commits 格式

### 28. 安全扫描 non-blocking

CI 中 `npm audit` 和 Snyk 都设置了 `continue-on-error: true`，安全漏洞不会阻止合并。

### 29. 无测试覆盖率门禁

Vitest 配置了覆盖率报告但无 `thresholds`，不强制最低覆盖率要求。

### 30. 后端 API 测试使用 mock 应用

`server/tests/api.test.js` 创建了一个独立的 Express 实例（`createTestApp`），而非测试真实的服务器路由，测试有效性存疑。

### 31. E2E 测试仅为冒烟测试

仅检查页面加载和 URL 匹配，无用户工作流测试（登录、提交表单、管理操作）。

### 32. 无跨浏览器 E2E

Playwright 仅配置 Chromium，无 Firefox 和 WebKit 项目。

### 33. 无部署流水线

CI 有 build 但无 CD 阶段，无 staging/production 自动部署。

### 34. Codecov Action 版本过旧

使用 `codecov/codecov-action@v3`，应升级到 v4+。

### 35. 无 Dependabot/Renovate 配置

缺少自动化依赖更新，安全补丁可能被遗漏。

### 36. 前端视图和组件测试严重不足

| 模块 | 测试状态 |
|---|---|
| ErrorBoundary.vue | ❌ 无测试 |
| LoadingIndicator.vue | ❌ 无测试 |
| PageTransition.vue | ❌ 无测试 |
| SiteHeader.vue | ❌ 无测试 |
| SiteFooter.vue | ❌ 无测试 |
| Login.vue | ❌ 无测试 |
| Register.vue | ❌ 无测试 |
| Profile.vue | ❌ 无测试 |
| admin/ (6个视图) | ❌ 无测试 |
| http.js (请求/拦截器) | ⚠️ 仅测试存储，未测试网络 |

---

## 🟣 P4 - 可选优化

### 37. 无 PWA 支持

`site.config.js` 中 `enablePWA: false`，无 Service Worker 和 manifest。

### 38. 无错误上报集成

仅 `console.error`，无 Sentry 等外部错误追踪。

### 39. 无分析/遥测

`enableAnalytics: false` 且未实现。

### 40. ResourceMonitor 依赖 Chrome 专有 API

`performance.memory` 在 Firefox/Safari 不可用，监控器在非 Chrome 浏览器上无效。

### 41. useAI composable 存在竞态条件

`execute` 函数不会取消前一个任务，快速连续调用可能导致后台任务堆积。

### 42. AIService 潜在内存泄漏

`submit` 方法为 `options.signal` 添加 `abort` 监听器，但任务正常完成时未移除。

### 43. 无响应压缩中间件

后端未使用 `compression` 中间件，API 响应体积较大。

### 44. 无请求超时配置

服务端无请求级别的超时设置，长时间运行的查询可能挂起连接。

### 45. Docker entrypoint 缺少健康检查和优雅终止

`docker-entrypoint.sh` 使用简单的 `&` + `wait`，无进程健康监控、无信号转发、无优雅关闭。

---

## 📋 修复优先级总结

| 优先级 | 数量 | 关键问题 |
|---|---|---|
| 🔴 P0 必须立即修复 | 5 | 路由守卫未实现、requireAdmin 崩溃、SQLITE→MySQL 错误码、JWT 硬编码回退、SQL 插值 |
| 🟠 P1 尽快修复 | 7 | stats 无 try/catch、空指针风险、授权逻辑缺陷、Token 无撤销、路由结构错误、守卫重复、限速不足 |
| 🟡 P2 架构改进 | 14 | TypeScript、i18n、状态管理、表单验证、API 版本、迁移框架等 |
| 🔵 P3 测试/DevOps | 10 | Git 钩子、安全门禁、覆盖率门禁、E2E、部署流水线等 |
| 🟣 P4 可选优化 | 9 | PWA、Sentry、分析、压缩、超时等 |

---

**建议下一步行动**: 先集中修复 P0 的 5 个严重问题，它们直接影响系统安全性和核心功能可用性。然后逐步推进 P1 和 P2。
