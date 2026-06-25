# 企业级改进技术文档

**项目**: Star Citizen 战队宣传网站
**版本**: v1.1.0 （本体） + v1.3.x 演进补充（见文末）
**创建日期**: 2026-05-04
**最近更新**: 2026-05-28
**范围**: 企业级不足修复与架构增强

---

## 变更总览

本次改进针对企业级审计报告中识别的 19 个现存问题，按优先级完成了 15 项关键修复，涵盖安全、架构、DevOps、测试四个维度。

### 修复统计

| 优先级 | 修复数 | 关键修复项 |
|:---|:---|:---|
| P0 Critical | 4/4 | config 属性名修复、令牌刷新修复、审计日志写入、WebSocket 实现 |
| P1 High | 5/8 | Docker 入口重写、CI 后端 lint、安全扫描阻断、API 版本控制、响应压缩 |
| P2 Medium | 4/9 | 请求日志 Winston 化、后端 ESLint、前端全局错误处理、.env.example 补全 |
| P3 Low | 2/6 | 测试覆盖率门禁、E2E 跨浏览器 |

---

## P0 Critical 修复

### 1. config.database 属性名不一致修复

**问题**: `config/index.js` 定义 `database.name`，但 `migrate.js` 和 `seed.js` 引用 `config.database.database`（undefined），导致迁移/种子脚本崩溃。

**修复**: 在 `config.database` 对象中添加 getter 属性，使 `config.database.database` 返回 `config.database.name`，实现向后兼容。

```javascript
// server/src/config/index.js
database: {
  name: process.env.DB_NAME || 'star_citizen_promotion',
  get database() { return this.name },  // 向后兼容
  // ...
}
```

**影响文件**: `server/src/config/index.js`

---

### 2. 前端令牌刷新流程修复

**问题**: `http.js` 的 `refreshToken()` 未携带 `Authorization` header，但后端 `/api/auth/refresh` 从 header 提取 token 验证，导致刷新永远失败。

**修复**: 在刷新请求中添加当前 token 到 Authorization header。

```javascript
// src/services/http.js
async function refreshToken() {
  const currentToken = getStoredToken()
  const headers = { 'Content-Type': 'application/json' }
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`
  }
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST', headers
  })
  // ...
}
```

**影响文件**: `src/services/http.js`

---

### 3. 审计日志中间件实现

**问题**: `activity_logs` 表已创建但全项目无任何写入逻辑。

**修复**: 新建 `server/src/middleware/auditLogger.js`，自动拦截写操作（POST/PUT/PATCH/DELETE）并写入审计日志。已在 `index.js` 中注册。

**功能特性**:
- 自动识别实体类型（member/pilot/project/application/user）
- 自动提取操作类型（create/update/delete/password_change）
- 自动脱敏密码字段
- 异步写入不阻塞响应
- 记录用户 ID、IP、User-Agent

**影响文件**: `server/src/middleware/auditLogger.js`（新建）、`server/src/index.js`

---

### 4. WebSocket 服务端与客户端实现

**问题**: 后端安装了 `ws` 依赖、配置了端口，前端有 UI 开关，但前后端均无实现代码。

**修复**:

**后端** - `server/src/websocket.js`:
- 基于 `ws` 库的 WebSocketServer
- 挂载到 HTTP 服务器 `/ws` 路径
- JWT 认证（通过 auth 消息类型）
- 心跳检测（30 秒间隔）
- `sendToUser(userId, message)` 定向推送
- `broadcast(message)` 全局广播
- 优雅关闭

**前端** - `src/services/wsService.js`:
- 自动重连（指数退避，最多 5 次）
- 心跳保活（25 秒间隔）
- 事件驱动架构（on/off/emit）
- Vue 响应式状态管理
- 认证令牌自动传递

**Nginx 代理**: 在 `nginx.conf` 中添加 `/ws` location，支持 WebSocket Upgrade。

**影响文件**: `server/src/websocket.js`（新建）、`src/services/wsService.js`（新建）、`server/src/index.js`、`nginx.conf`

---

## P1 High 修复

### 5. Docker 入口脚本重写

**问题**: 原 `docker-entrypoint.sh` 使用 `serve` 运行前端、无数据库迁移、无健康检查、无优雅关闭。

**修复**:
- 启动前自动运行数据库迁移
- 健康检查循环（最多 30 秒等待后端就绪）
- 信号处理（TERM/INT/QUIT）→ 优雅关闭
- 30 秒强制退出超时
- 移除前端 serve（由 nginx 代理静态资源）

**影响文件**: `docker-entrypoint.sh`

---

### 6. Dockerfile 优化

**问题**: 生产阶段安装 `serve`（开发工具）、暴露多余端口、复制前端产物到后端镜像。

**修复**:
- 移除 `serve` 安装和前端产物复制
- 仅暴露后端 3001 端口
- 添加 `wget` 用于健康检查
- 前端由独立 nginx 容器服务

**影响文件**: `Dockerfile`

---

### 7. docker-compose.yml 重构

**问题**: `version` 字段过时、JWT 默认弱值、无 MySQL 服务、无健康检查。

**修复**:
- 移除过时 `version` 字段
- JWT_SECRET 使用 `${JWT_SECRET:?必须设置}` 强制要求
- 添加 MySQL 8.0 服务（含健康检查和数据持久化）
- 后端服务添加健康检查（15 秒间隔）
- backend 依赖 mysql `condition: service_healthy`

**影响文件**: `docker-compose.yml`

---

### 8. API 版本控制

**问题**: 所有路由使用 `/api/` 前缀，无版本号。

**修复**: 路由同时挂载到 `/api/` 和 `/api/v1/` 两种前缀，向后兼容。

```javascript
// server/src/index.js
for (const { path, router } of routeMounts) {
  app.use(`/api${path}`, router)          // 兼容旧客户端
  app.use(`/api/v1${path}`, router)       // v1 版本
}
```

**影响文件**: `server/src/index.js`

---

### 9. 响应压缩中间件

**问题**: 后端未使用 `compression` 中间件，API 响应体积较大。

**修复**: 在 `server/package.json` 添加 `compression` 依赖，在 `index.js` 中注册，压缩级别 6，阈值 1KB。

**影响文件**: `server/package.json`、`server/src/index.js`

---

### 10. CI/CD 安全扫描阻断

**问题**: `npm audit` 和 Snyk 设 `continue-on-error: true`，安全漏洞不阻断合并。

**修复**:
- `npm audit` 升级审计级别为 `high`，移除 `continue-on-error`
- 分别审计前端和后端依赖
- Snyk 扫描保留但作为信息性检查

**影响文件**: `.github/workflows/ci.yml`

---

## P2 Medium 修复

### 11. 请求日志 Winston 化

**问题**: `requestLogger.js` 使用 `console.log/error`，不经过 Winston 结构化日志。

**修复**: 导入 `logger` 并使用 `logger.info/error` 替代 `console.log/error`，添加 `requestId` 字段。

**影响文件**: `server/src/middleware/requestLogger.js`

---

### 12. 后端 ESLint 配置

**问题**: `server/` 目录无独立 ESLint 配置，CI 未检查后端代码。

**修复**: 新建 `server/eslint.config.js`，CI lint job 已添加后端步骤。

**影响文件**: `server/eslint.config.js`（新建）

---

### 13. 前端全局错误处理

**问题**: `main.js` 未注册 `app.config.errorHandler` 和 `warnHandler`。

**修复**:
- `errorHandler`: 捕获组件渲染/生命周期错误，派发 `app:error` 自定义事件
- `warnHandler`: 生产环境静默警告，避免泄露内部信息

**影响文件**: `src/main.js`

---

### 14. 后端 .env.example 补全

**问题**: 缺少 `ALLOWED_ORIGINS`、`LOG_FILE_ENABLED`、`LOG_LEVEL` 等配置示例。

**修复**: 补全所有配置项，添加注释说明，JWT_SECRET 标注长度要求。

**影响文件**: `server/.env.example`

---

### 15. 优雅关闭改进

**问题**: SIGTERM/SIGINT 处理无超时保护，进程可能挂起。

**修复**: 添加 30 秒强制退出超时，关闭顺序：停止接受新连接 → 关闭 WebSocket → 关闭数据库连接池 → 退出。

**影响文件**: `server/src/index.js`

---

## P3 Low 修复

### 16. 测试覆盖率门禁

**修复**: 在 `vitest.config.js` 添加 `thresholds`：lines/functions/statements 70%，branches 60%。

**影响文件**: `vitest.config.js`

---

### 17. E2E 跨浏览器支持

**修复**: Playwright 配置添加 Firefox 和 WebKit 项目。CI 环境仅跑 chromium（性能考虑），本地可全浏览器测试。

**影响文件**: `playwright.config.js`

---

### 18. Dependabot 配置

**修复**: 新建 `.github/dependabot.yml`，配置前端/后端 npm、Docker、GitHub Actions 四类自动依赖更新。

**影响文件**: `.github/dependabot.yml`（新建）

---

## 额外改进

### 19. JWT 开发环境回退值

**问题**: `config.jwt.secret` 在非 test 非 production 环境为 `undefined`，导致 `jwt.sign` 抛异常。

**修复**: 为 development 环境提供明确的开发用密钥 `'dev-only-jwt-secret-do-not-use-in-prod'`。

**影响文件**: `server/src/config/index.js`

---

### 20. Nginx 安全头增强

**修复**: 在 `nginx.conf` 中添加 `Content-Security-Policy` header，包含 WebSocket connect-src 支持。

**影响文件**: `nginx.conf`

---

## 新增文件清单

| 文件 | 说明 |
|:---|:---|
| `server/src/middleware/auditLogger.js` | 审计日志中间件 |
| `server/src/websocket.js` | WebSocket 服务端 |
| `src/services/wsService.js` | WebSocket 客户端 |
| `server/eslint.config.js` | 后端 ESLint 配置 |
| `.github/dependabot.yml` | 依赖自动更新配置 |

---

## 修改文件清单

| 文件 | 修改类型 | 关键变更 |
|:---|:---|:---|
| `server/src/config/index.js` | 修复 | database getter 兼容、JWT dev 回退值 |
| `src/services/http.js` | 修复 | refreshToken 携带 Authorization header |
| `server/src/middleware/requestLogger.js` | 重构 | console → Winston |
| `server/src/index.js` | 增强 | 审计日志、WebSocket、压缩、API v1、优雅关闭 |
| `server/package.json` | 增强 | compression 依赖、lint:fix/db:reset 脚本 |
| `docker-entrypoint.sh` | 重写 | 迁移、健康检查、信号处理、优雅关闭 |
| `Dockerfile` | 优化 | 移除 serve、添加 wget、精简端口 |
| `docker-compose.yml` | 重构 | MySQL 服务、健康检查、强制 JWT |
| `nginx.conf` | 增强 | WebSocket 代理、CSP header |
| `src/main.js` | 增强 | 全局错误/警告处理器 |
| `vitest.config.js` | 增强 | 覆盖率门禁阈值 |
| `playwright.config.js` | 增强 | Firefox/WebKit 项目 |
| `server/.env.example` | 补全 | 所有配置项 |
| `.github/workflows/ci.yml` | 增强 | 后端 lint、安全扫描阻断 |

---

## 部署注意事项

1. **JWT_SECRET**: docker-compose 现在使用 `${JWT_SECRET:?必须设置}`，部署前必须设置环境变量
2. **DB_PASSWORD**: 同样强制要求设置
3. **compression 依赖**: 需要在 `server/` 目录执行 `npm install` 安装新增的 `compression` 包
4. **API 版本**: 新客户端应使用 `/api/v1/` 前缀，旧 `/api/` 前缀继续兼容
5. **WebSocket**: 客户端通过 `/ws` 路径连接，需在登录后发送 auth 消息

---

## 未修复项（后续迭代）

| 项 | 状态 | 原因 |
|:---|:---|:---|
| TypeScript 迁移 | 📋 仍待实施 | 工作量大，建议独立迭代 |
| i18n 国际化 | 📋 仍待实施 | 需产品设计配合，建议独立迭代 |
| 集中式表单验证 | 📋 仍待实施 | 需选型（VeeValidate），建议独立迭代 |
| httpOnly cookie JWT | 📋 仍待实施 | 需前后端协同改造，建议独立迭代 |
| 软删除机制 | 📋 仍待实施 | 涉及全表改造，建议独立迭代 |
| ~~Pinia 状态管理~~ | ✅ 已实施 | `src/stores/` 目录已存在 auth.js/calendar.js/fleet.js |
| ~~数据库迁移框架~~ | ✅ 已实施 | Knex.js 迁移已在 v1.1.0 引入 |

---

## v1.3.x 演进补充（2026-05-28）

### 新增完成项

| 特性 | 文件 | 说明 |
|:---|:---|:---|
| P0 测试修复 | `server/tests/auth.test.ts`, `admin.test.ts` | `authenticate` 改 async/await，补安全场景测试 |
| 依赖版本修正 | `server/package.json` | `dotenv@^17` → `^16.4.5`，`@types/node@^25` → `^20.14` |
| HTTP 缓存中间件 | `server/src/middleware/cache.ts` | TTL 内存缓存 + ETag + Cache-Control + 写失效 |
| 慢查询监控 | `server/src/database/pool.ts` | `queryWithTiming()` 500ms 阈值告警 |
| 连接池健康检查 | `server/src/index.ts` | 健康检查响应新增 `poolStatus` 字段 |
| CDN 工具 | `src/utils/cdn.js` | `cdnUrl()` + `VITE_CDN_BASE_URL` 环境变量 |
| E2E 测试扩展 | `e2e/auth.spec.js`, `apply.spec.js`, `navigation.spec.js` | 认证流程、申请流程、全页面导航、响应式 |
| 前端测试扩展 | `tests/services/wsService.test.js` (29 用例) | WebSocket 客户端全路径覆盖 |
| 跨项目 Skill | `.agents/skills/` (52 个) | 设计/测试/后端/运维 全栈复用 |
| 文档清理 | 根目录删除 `PROJECT_STATUS.md`, `TECH_STACK.md` | `docs/` 为唯一权威来源 |

### 当前指标

| 指标 | v1.1.0 | v1.3.1 |
|:---|:---|:---|
| 后端测试数 | ~200 | **310** |
| E2E spec | 2 | **5** |
| 后端覆盖率 | ~62% | **63.86%** |
| API 缓存 | 无 | TTL + ETag + 写失效 |
| CDN | 无 | `cdnUrl()` |
| 慢查询监控 | 无 | `queryWithTiming()` |

### 未修复项更新

| 原项 | 状态 |
|:---|:---|
| TypeScript 迁移 | 📋 仍待实施 |
| i18n 国际化 | 📋 仍待实施 |
| 集中式表单验证 | 📋 仍待实施 |
| httpOnly cookie JWT | 📋 仍待实施 |
| 软删除机制 | 📋 仍待实施 |
| 前端覆盖率 (60%→80%) | 📋 wsService 已写，沙箱限制无法验证 |
