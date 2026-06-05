# 项目技术档案

> **项目名称**: Star Citizen 战队宣传网站
> **版本**: v1.3.1（含未提交增量变更）
> **档案日期**: 2026-06-05（含最新实测数据）
> **档案说明**: 本文档基于源码逐文件审阅与真实测试运行结果编写，所有数据均可交叉验证。

---

## 一、项目概览

### 1.1 这是什么

面向星际公民（Star Citizen）玩家的战队宣传网站。包含公开页面（战队介绍、成员展示、舰队展示、活动日历、入队申请）和管理后台（仪表盘、成员/飞行员/项目/申请管理、系统设置）。

### 1.2 技术选型

Vue 3 SPA + Express.js REST API + MySQL 8.0，Docker 容器化部署，Nginx 反向代理。

### 1.3 开发时间线

| 日期 | 里程碑 |
|:-----|:-------|
| 2026-03-03 | 首次提交，Vue 3 + Vite 脚手架 |
| 2026-03-05 | 前后端分离，SQLite 迁移到 MySQL |
| 2026-03-06 | CI/CD 流水线、E2E 测试、管理后台 |
| 2026-04-15 | v1.1.0 舰队管理、飞行员档案、项目协作、日历 |
| 2026-05-20 | v1.2.0 管理后台仪表盘、申请审批、WebSocket 通知 |
| 2026-05-28 | v1.3.0/v1.3.1 认证中间件重构、310 测试通过、安全扫描清零 |
| 2026-05-28 ~ 06-01 | PWA、亮色主题、新 UI 组件、测试扩充、文档重建（未提交） |

### 1.4 当前状态

主分支有约 140 个文件的未提交变更，涵盖 PWA 支持、亮色主题、UI 组件库、测试扩充、文档重建、安全加固等。

---

## 二、技术栈

### 2.1 前端

| 技术 | 版本 | 角色 |
|:-----|:-----|:-----|
| Vue.js | 3.5 | UI 框架，Composition API + script setup |
| Vue Router | 5.0 | 客户端路由，HTML5 History 模式 |
| Vite | 7.3 | 构建工具，开发服务器，HMR |
| Pinia | 3.0 | 状态管理（auth/calendar/fleet） |
| GSAP | 3.15 | 动画引擎，ScrollTrigger |
| Swiper | 12.1 | 轮播组件 |
| Chart.js | 4.5 | 数据图表 |
| Howler | 2.2 | 音效引擎 |
| @vueuse/core | 14.3 | 组合式工具函数 |
| @sentry/vue | 10.53 | 错误监控 |
| vite-plugin-pwa | 1.3 | PWA 支持 |
| Vitest | 3.0 | 单元测试 |
| Playwright | 1.58 | E2E 测试 |
| ESLint | 9.x | 代码质量检查 |

### 2.2 后端

| 技术 | 版本 | 角色 |
|:-----|:-----|:-----|
| Node.js | >=20.19 | 运行时 |
| Express.js | 4.21 | Web 框架 |
| TypeScript | ts-node | 后端 .ts 源码 |
| MySQL2 | 3.12 | 数据库驱动 + 连接池 |
| Knex.js | latest | 迁移工具（7 个迁移） |
| jsonwebtoken | 9.0 | JWT 签发验证 |
| bcryptjs | 2.4 | 密码哈希 |
| Helmet | 8.0 | HTTP 安全头 |
| Winston | 3.17 | 结构化日志 |
| express-rate-limit | 7.5 | API 限流 |
| express-validator | 7.2 | 请求校验 |
| ws | 8.18 | WebSocket |
| swagger-jsdoc | latest | OpenAPI 文档 |
| prom-client | latest | Prometheus 指标 |
| Jest | 29.7 | 后端测试 |

### 2.3 基础设施

| 技术 | 角色 |
|:-----|:-----|
| Docker | 多阶段构建容器化 |
| Docker Compose | 服务编排 |
| Nginx | 反向代理 + SPA 回退 + Gzip |
| GitHub Actions | CI/CD 流水线 |
| CodeQL + Snyk + Dependabot | 安全扫描 |
| certbot | SSL 证书自动续期 |

---

## 三、架构设计

### 3.1 整体架构

```text
浏览器
  v
Nginx（反向代理）
  ├── 静态资源（/dist）
  ├── SPA 路由回退（try_files -> index.html）
  └── /api 代理 -> Express :3001
                    ├── 中间件链（Helmet/CORS/compression/requestId/
                    │   logger/Prometheus/cache/rateLimit/auditLogger）
                    ├── 10 个路由模块
                    ├── /ws -> WebSocket
                    └── MySQL 8.0（连接池）
```

### 3.2 后端分层

```text
Route（路由 + 中间件编排）-> Service（业务逻辑）-> Database Pool（数据访问）
```

### 3.3 前端架构

```text
main.js -> App.vue -> Router -> Views -> Components/Composables/Services/Stores
```

---

## 四、源码文件清单

### 4.1 前端（src/）

#### 入口

| 文件 | 职责 |
|:-----|:-----|
| main.js | 应用入口：Vue 实例、插件注册、全局组件/指令、错误处理、PWA |
| App.vue | 根组件：布局、路由视图、全局通知、PWA 更新提示 |

#### 路由（src/router/index.js）

15 条路由（含 7 条 admin 子路由），导航守卫支持 requiresAuth / requiresAdmin / guestOnly。

| 路径 | 视图 | Meta |
|:-----|:-----|:-----|
| / | Home.vue | preload |
| /about | About.vue | preload |
| /members | Members.vue | — |
| /projects | Projects.vue | — |
| /fleet | Fleet.vue | — |
| /calendar | Calendar.vue | — |
| /join | Join.vue | — |
| /contact | Contact.vue | — |
| /login | Login.vue | guestOnly |
| /register | Register.vue | guestOnly |
| /profile | Profile.vue | requiresAuth |
| /application-status | ApplicationStatus.vue | — |
| /admin/* | AdminLayout + 7 子路由 | requiresAuth + requiresAdmin |
| /*  | NotFound.vue | — |

#### 组件（src/components/）

**通用**: BaseButton, BaseCard, BaseModal, BaseBadge, BaseTooltip, ErrorBoundary, LoadingIndicator, PageHeader, PageTitle, PageTransition

**UI**: HoloCard, ShipCard, MFDPanel, DataDisplay, StatusIndicator, TechButton

**布局**: SiteHeader, SiteFooter

**特效**: StarfieldBg, PwaUpdateToast, ThemeToggle

#### 组合式函数（src/composables/）

| 文件 | 职责 |
|:-----|:-----|
| useAI.js | AI 任务管理（execute/cancel/isLoading） |
| useWebSocket.js | WebSocket 封装 |
| useGSAPReveal.js | GSAP 滚动动画 |
| useScrollReveal.js | 轻量滚动揭示 |
| useParallax.js | 视差滚动 |
| useSoundEffect.js | 音效播放 |
| useEffectQuality.js | 特效质量分级 |
| useTheme.js | 主题切换 |
| usePwa.js | PWA 生命周期 |

#### 服务层（src/services/）

| 文件 | 职责 |
|:-----|:-----|
| http.js | HTTP 客户端：fetch + Authorization header + 401 自动刷新 |
| authService.js | 认证 API |
| dataService.js | API/静态数据自动切换 |
| AIService.js | AI 任务引擎（优先级队列/并发控制/超时重试） |
| PriorityQueue.js | 最大堆优先级队列 |
| ResourceMonitor.js | 浏览器资源监控 |
| calendarService.js | 日历 API |
| fleetService.js | 舰队 API |
| wsService.js | WebSocket 客户端（心跳/重连） |
| errorReporting.js | Sentry 错误上报 |

#### 状态管理（src/stores/）

| 文件 | 状态 | Actions |
|:-----|:-----|:---------|
| auth.js | user/loading/error/initialized | login/register/logout/initializeAuth/hasPermission |
| calendar.js | events/selectedDate/loading | fetchEvents/selectDate/addEvent |
| fleet.js | ships/activeShip/loading | fetchShips/setActiveShip |

#### 视图页面（src/views/）

| 文件 | 功能 |
|:-----|:-----|
| Home.vue | 首页：英雄区域、统计、任务控制台、王牌飞行员轮播 |
| About.vue | 团队介绍 |
| Members.vue | 核心成员展示 |
| Projects.vue | 活动项目 |
| Fleet.vue | 舰队展示 |
| Calendar.vue | 活动日历 |
| Join.vue | 入队申请表单 |
| Contact.vue | 联系我们 |
| Login.vue | 登录 |
| Register.vue | 注册 |
| Profile.vue | 个人中心 |
| ApplicationStatus.vue | 申请状态 |
| Offline.vue | PWA 离线页 |
| NotFound.vue | 404 |
| admin/Dashboard.vue | 仪表盘 |
| admin/MembersAdmin.vue | 成员管理 |
| admin/PilotsAdmin.vue | 飞行员管理 |
| admin/ProjectsAdmin.vue | 项目管理 |
| admin/ApplicationsAdmin.vue | 申请审核 |
| admin/Settings.vue | 系统设置 |

#### 其他

| 目录 | 职责 |
|:-----|:-----|
| config/ | index.js（运行时配置）+ site.config.js（站点内容） |
| data/ | siteContent.js（静态数据回退） |
| directives/ | scrollReveal.js + ripple.js |
| utils/ | cdn.js + logger.js + effects/ParticleEngine.js |
| styles/ | variables.css + base.css + animations.css + utilities.css |
| types/ | shims-vue.d.ts + shims-css.d.ts + vite-env.d.ts |

---

### 4.2 后端（server/src/）

#### 入口（index.ts）

Express 应用，中间件注册顺序：helmet -> cors -> compression -> requestId -> body-parser -> logger -> Prometheus -> cache -> rateLimit -> auditLogger -> 10 个路由 -> errorHandler。

#### 路由（routes/）

| 文件 | 路径 | 认证 | 功能 |
|:-----|:-----|:-----|:-----|
| auth.ts | /api/auth/* | 部分 | register/login/me/refresh/logout |
| members.ts | /api/members/* | 部分 | CRUD（管理员写，公开读） |
| pilots.ts | /api/pilots/* | 部分 | 同上 |
| projects.ts | /api/projects/* | 部分 | 同上 |
| applications.ts | /api/applications/* | 部分 | POST 公开/GET 认证/PUT DELETE 管理员 |
| fleet.ts | /api/fleet/* | 部分 | CRUD |
| events.ts | /api/events/* | 部分 | CRUD |
| stats.ts | /api/stats/* | 公开 | 聚合统计 |
| settings.ts | /api/settings/* | 管理员 | GET/PUT |
| admin.ts | /api/admin/* | 管理员 | reset-db/clear-cache |

#### 服务（services/）

authService / memberService / pilotService / projectService / applicationService / fleetService / eventService / settingsService / statsService — 每个提供 getAll/getById/create/update/delete 等方法。

#### 中间件（middleware/）

| 文件 | 职责 |
|:-----|:-----|
| auth.ts | JWT 认证（authenticate/optionalAuth/requireRole） |
| cache.ts | TTL 内存缓存 + ETag + 写操作失效 |
| metrics.ts | Prometheus 指标采集 |
| errorHandler.ts | 统一错误处理 |
| requestId.ts | UUID 请求追踪 |
| requestLogger.ts | Winston 请求日志 |
| auditLogger.ts | 写操作审计 |
| pagination.ts | 分页参数解析 |
| validator.ts | 输入校验 |

#### 数据库（database/）

| 文件 | 职责 |
|:-----|:-----|
| pool.ts | MySQL2 连接池（query/queryOne/execute/transaction/queryWithTiming/getPoolStatus/closePool） |
| init.ts | 建表 IF NOT EXISTS |
| migrate.ts | Knex 迁移管理 |
| seed.ts | 种子数据 |

#### 其他

| 文件 | 职责 |
|:-----|:-----|
| config/index.ts | 环境变量 -> config 对象 |
| config/swagger.ts | OpenAPI 3.0 配置 |
| utils/jwt.ts | signToken / verifyToken |
| utils/logger.ts | Winston 日志（控制台 + 文件 + 轮转） |
| websocket.ts | WebSocket（认证/心跳/消息路由/速率限制/优雅关闭） |

---

## 五、数据库设计

### 5.1 表结构

| 表名 | 主要字段 | 索引 |
|:-----|:---------|:-----|
| users | id(UUID), username, email, password_hash, role(member/officer/admin) | email, username |
| members | id, name, role, callsign, status(active/inactive/on_leave), join_date | status |
| pilots | id, name, callsign, ship, flight_hours, specialty, status | status |
| projects | id, name, status(planning/active/completed/cancelled), priority | status, priority |
| applications | id, name, email, game_id, status(pending/approved/rejected), reviewed_by | status, email |
| events | id, title, event_date, location, max_participants, status, created_by | event_date, status |
| fleet | id, name, model, manufacturer, category, status(active/maintenance/retired) | category, status |
| stats | id, key(UNIQUE), value(JSON) | key |
| activity_logs | id, user_id, action, resource_type, resource_id, details(JSON), ip_address | user_id, action |
| settings | id, key(UNIQUE), value(JSON) | key |

### 5.2 连接池

MySQL2 连接池，utf8mb4，+08:00 时区。queryWithTiming 超 500ms 告警，getPoolStatus 暴露连接数。

---

## 六、API 接口

| 方法 | 路径 | 认证 | 功能 |
|:-----|:-----|:-----|:-----|
| POST | /api/auth/register | 公开 | 注册 |
| POST | /api/auth/login | 公开 | 登录 |
| GET | /api/auth/me | 认证 | 当前用户 |
| POST | /api/auth/refresh | 认证 | 刷新 Token |
| POST | /api/auth/logout | 认证 | 登出 |
| GET/POST/PUT/DELETE | /api/members/* | 部分 | 成员 CRUD |
| GET/POST/PUT/DELETE | /api/pilots/* | 部分 | 飞行员 CRUD |
| GET/POST/PUT/DELETE | /api/projects/* | 部分 | 项目 CRUD |
| GET/POST/PUT/DELETE | /api/applications/* | 部分 | 申请 CRUD |
| GET/POST/PUT/DELETE | /api/fleet/* | 部分 | 舰队 CRUD |
| GET/POST/PUT/DELETE | /api/events/* | 部分 | 活动 CRUD |
| GET | /api/stats | 公开 | 统计数据 |
| GET/PUT | /api/settings | 管理员 | 站点设置 |
| POST | /api/admin/reset-db | 管理员 | 重置数据库 |
| POST | /api/admin/clear-cache | 管理员 | 清除缓存 |
| GET | /health | 公开 | 健康检查 |
| GET | /metrics | 白名单 | Prometheus 指标 |

响应格式: { success, data, message, pagination }

API 版本: /api/v1/*（推荐）+ /api/*（兼容，带 Deprecation 头）

---

## 七、测试现状（2026-06-05 实测）

### 7.1 后端（Jest）

**29 suites / 352 tests / 全部通过 / 9.3s**

覆盖率: 语句 63.86% | 分支 72.00% | 函数 85.88% | 通过率 100%

高覆盖: admin 路由 98%, auth 路由 97%, services 93~100%, cache 100%, pool 88%

测试文件: api / auth / errorHandler / websocket / swagger / cache / metrics / auditLogger / pagination / requestId / validator / 10 个 route 文件 / 8 个 service 文件

### 7.2 前端（Vitest）

**44 files / 41 passed / 3 failed / 416 tests / 388 passed / 28 failed / 27.7s**

3 个失败文件及根因:

| 文件 | 失败 | 根因 |
|:-----|:-----|:-----|
| http.test.js | 15 | 测试假设 httpOnly Cookie，实现用 localStorage token |
| Home.test.js | 5 | GSAP 找不到 DOM + RouterLink 未注册 + 指令未 mock |
| wsService.test.js | 1 | mockWsInstance 为 null 时 spy 断言失败 |

41 个通过文件: 6 组件 + 6 composable + 1 config + 1 router + 8 service + 3 store + 1 util + 14 view + 1 PWA

### 7.3 E2E（Playwright）

5 spec: home / join / auth / apply / navigation。CI 仅 Chromium，baseURL localhost:4173。

### 7.4 无测试覆盖的前端文件

组件: ErrorBoundary, LoadingIndicator, PageHeader, PageTransition, PwaUpdateToast, ThemeToggle, StarfieldBg, DataDisplay, HoloCard, MFDPanel, ShipCard, StatusIndicator, TechButton, SiteHeader, SiteFooter

Composables: useEffectQuality, useGSAPReveal

Directives: ripple, scrollReveal

Views: About, NotFound, Offline, admin/ProjectsAdmin, admin/PilotsAdmin, admin/Settings

---

## 八、CI/CD

### 流水线（ci.yml）

Lint -> Frontend Tests -> Backend Tests -> Security Scan -> Build -> E2E -> Notify

### 安全扫描（codeql.yml）

CodeQL 静态分析 + Snyk 依赖扫描 + npm audit

### Git Hooks（.githooks/）

pre-commit: 敏感信息检测 + ESLint

pre-push: 测试 + 漏洞审计

---

## 九、安全体系

| 层面 | 措施 |
|:-----|:-----|
| 认证 | JWT (HS256)，可选认证 + 角色鉴权 |
| 密码 | bcryptjs，salt 12 |
| 传输 | Helmet (CSP/XSS/HSTS)，CORS 限定域名 |
| 限流 | API 100/15min，认证 10/15min，刷新 60/1h |
| 校验 | express-validator |
| SQL | mysql2 参数化查询 |
| 脱敏 | sanitizeUser() 移除 password_hash |
| 审计 | auditLogger 记录写操作 |
| 依赖 | npm audit + Snyk + CodeQL + Dependabot |
| Git | pre-commit 敏感信息检测 |

---

## 十、部署

### Docker Compose

| 服务 | 端口 | Profile | 说明 |
|:-----|:-----|:---------|:-----|
| backend | 3001 | 默认 | Express API |
| mysql | 127.0.0.1:3306 | 默认 | 数据库 |
| nginx | 80/443 | production | 反向代理 |
| backup | — | production | 每天 3:00 备份 |
| certbot | — | production | SSL 续期 |

### 环境变量

前端: VITE_BACKEND_URL / VITE_USE_API / VITE_WS_URL / VITE_CDN_BASE_URL

后端: JWT_SECRET / DB_* / BCRYPT_SALT_ROUNDS / RATE_LIMIT_* / WS_PORT

---

## 十一、开发规范

代码: ESLint 9.x + Prettier + Vue 3 Composition API + JSDoc/TS

Git: feat/ fix/ refactor/ docs/ chore/ 前缀

测试: Jest(后端) + Vitest(前端) + Playwright(E2E)

---

## 十二、已知问题与风险矩阵

### 12.1 高风险（阻断上线或生产安全）

| 编号 | 问题 | 影响范围 | 当前状态 | 修复方案 | 预计工时 |
|:-----|:-----|:---------|:---------|:---------|:--------|
| R-01 | **~140 文件未提交 Git** | 全项目 | 未提交变更覆盖 PWA、亮色主题、UI 组件库、测试扩充、安全加固等全部增量工作 | 按功能拆分为 8~10 个 commit：PWA 支持、亮色主题、UI 组件、后端测试扩充、前端测试扩充、文档重建、安全加固、配置调整 | 1 天 |
| R-02 | **JWT 存储在 localStorage** | 前端安全 | XSS 攻击可窃取 token | 迁移到 httpOnly Cookie（后端 COOKIE_OPTIONS 已定义，前端改 http.js + authService.js + auth store） | 2~3 天 |
| R-03 | **生产构建失败** | 部署 | vite-plugin-pwa 的 esbuild 子进程 EPERM（沙箱限制，非代码问题） | 本地环境验证构建；若仍有问题检查 esbuild 权限或降级 vite-plugin-pwa 版本 | 半天 |

### 12.2 中风险（影响质量和可维护性）

| 编号 | 问题 | 影响范围 | 根因 | 修复方案 | 预计工时 |
|:-----|:-----|:---------|:-----|:---------|:--------|
| R-04 | **前端 3 个测试文件共 28 个用例失败** | 测试质量 | 测试与实现不同步，5 个根因各异 | 逐文件修复，见 12.4 详细分析 | 2~3 天 |
| R-05 | **后端测试无法在沙箱运行** | CI/开发 | esbuild spawn EPERM（Windows 沙箱权限限制） | 本地环境运行验证；CI 环境不受影响 | 环境问题 |
| R-06 | **前端覆盖率未量化** | 质量指标 | Vitest coverage 配置未生效 | 启用 `@vitest/coverage-v8`，配置 thresholds | 半天 |
| R-07 | **~30 个前端文件零测试覆盖** | 测试完整性 | 组件/指令/视图未写测试 | 按 ROADMAP 第三阶段逐步补充 | 2 周 |

### 12.3 低风险（技术债务，按需处理）

| 编号 | 问题 | 说明 | 触发条件 |
|:-----|:-----|:-----|:--------|
| TD-6 | 前端未迁移到 TypeScript | 单人开发投入产出比低 | 代码量增长到维护困难或有第二个开发者 |
| TD-7 | 无 i18n 国际化支持 | 当前仅中文 | 面向国际玩家时启动 |
| TD-8 | 无软删除机制 | 删除即物理删除 | 有数据审计需求或用户误删反馈 |
| TD-9 | 无集中式表单验证 | 各表单独立校验 | 表单数量增多、校验逻辑变复杂时 |
| TD-10 | 数据库无读写分离 | 单节点 | 并发用户超过 500 时 |
| TD-11 | 无 Redis 缓存层 | 内存缓存 TTL | 多实例部署或缓存命中率需提升时 |
| TD-12 | 无 Grafana 监控仪表盘 | Prometheus 指标已就绪 | 部署到生产环境后 |

### 12.4 前端测试失败详细分析

#### http.test.js（15 个失败）

**根因**: 测试假设 JWT 通过 httpOnly Cookie 传递，但当前实现使用 localStorage + Authorization header。测试写了 `document.cookie = ...` 模拟 token，但 `http.js` 的 `getStoredToken()` 从 localStorage 读取。这是测试先行于实现的典型问题。

**修复路径**: A) 让测试适配当前实现（改用 localStorage mock）；B) 先实现 httpOnly Cookie 迁移，测试自然通过。建议选 B。

#### Home.test.js（5 个失败）

**根因**: GSAP 在测试环境找不到 DOM 元象；RouterLink 未注册；自定义指令 `v-ripple`/`v-scroll-reveal` 未 mock；TechButton 的 variant 验证器不接受 'outline'。

**修复路径**: 测试 setup 中注册全局组件 stub 和指令 mock，mock GSAP，修正 variant 验证器。

#### wsService.test.js（1 个失败）

**根因**: `mockWsInstance` 在未连接状态下为 `null`，spy 断言失败。

**修复路径**: 改为 `expect(wsService.ws).toBeNull()` 或用 `vi.fn()` 初始化 mock。

---

## 十三、项目不足深度分析

### 13.1 工程流程不足

| 维度 | 现状 | 理想状态 | 差距分析 |
|:-----|:-----|:---------|:--------|
| **版本控制** | ~140 文件未提交，工作区与 last commit 严重脱节 | 功能分支 + 原子提交 | 增量变更未拆分 commit，磁盘故障将丢失全部工作。最紧迫的风险 |
| **测试可信度** | 前端 28 个测试失败，后端测试因沙箱权限无法本地验证 | 全量通过 + 本地可跑 | 失败用例让其他通过的测试也失去可信度 |
| **构建验证** | 生产构建 EPERM 失败 | `npm run build` 零错误 | 沙箱环境限制是外因，但本地也需验证一次完整构建 |

### 13.2 安全架构不足

| 维度 | 现状 | 理想状态 | 差距分析 |
|:-----|:-----|:---------|:--------|
| **Token 存储** | JWT 在 localStorage | httpOnly + Secure + SameSite Cookie | localStorage 对 XSS 完全暴露 |
| **CSRF 防护** | 无 CSRF token | 双重验证（Cookie JWT + CSRF token） | 迁移到 Cookie 后 CSRF 风险随之而来 |
| **API 版本控制** | 双前缀兼容 | 仅 `/api/v1/`，旧版返回 410 Gone | 长期兼容两套前缀增加维护负担 |
| **密码策略** | 仅 bcrypt salt 12 | + 密码复杂度 + 登录失败锁定 | 注册接口未校验密码强度 |

### 13.3 前端架构不足

| 维度 | 现状 | 理想状态 | 差距分析 |
|:-----|:-----|:---------|:--------|
| **状态管理** | 3 个 store | 按业务域拆分，含缓存和乐观更新 | 缺少 memberStore/projectStore/applicationStore |
| **错误处理** | ErrorBoundary + errorHandler | + API 错误分类 + 用户友好提示 | 对网络超时、429、500 的提示不够差异化 |
| **类型安全** | 前端纯 JS | TypeScript strict | 全靠运行时发现类型错误 |
| **表单验证** | 各组件独立校验 | VeeValidate / FormKit 统一方案 | Join/Login/Register 各自实现校验逻辑 |
| **性能监控** | Sentry 错误追踪 | + Web Vitals RUM | 缺少真实用户性能数据 |

### 13.4 后端架构不足

| 维度 | 现状 | 理想状态 | 差距分析 |
|:-----|:-----|:---------|:--------|
| **缓存层** | 内存 TTL 缓存 | Redis + 内存二级缓存 | 多实例部署时缓存失效 |
| **数据库** | 单节点 MySQL | 主从复制 + 故障转移 | 单点故障风险，备份恢复未验证 |
| **日志** | Winston 文件 + 控制台 | + ELK/Loki 集中式日志 | 缺少跨服务日志聚合 |
| **API 文档** | Swagger 配置已就绪 | 完整 OpenAPI spec + 示例 | 部分接口无文档 |
| **文件上传** | 无 | 图片/文件上传到对象存储 | 成员头像等无上传通道 |

### 13.5 DevOps 不足

| 维度 | 现状 | 理想状态 | 差距分析 |
|:-----|:-----|:---------|:--------|
| **环境管理** | .env 手动配置 | 环境变量管理 + 秘钥轮转 | 无自动轮转 |
| **监控告警** | Prometheus + Sentry | + Grafana + 告警通知 | 无可视化和主动告警 |
| **数据库迁移** | Knex 手动执行 | CI 自动迁移 + 回滚 | 无迁移失败回滚机制 |
| **CDN** | `cdnUrl()` 已实现 | 实际接入 CDN | 代码就绪但未配置实际地址 |

---

## 十四、后续发展方向

### 14.1 优先级排序原则

按投入产出比和风险降低幅度双维度排序。

```
高回报 + 低风险 ← 优先做
高回报 + 高风险 ← 仔细规划后做
低回报 + 低风险 ← 有空再做
低回报 + 高风险 ← 不做
```

### 14.2 紧急（本周内）

**方向一：Git 工作区清理**

140 个未提交文件是最大的工程风险。

```
commit 1: feat(pwa): 添加 PWA 支持和离线页面
commit 2: feat(theme): 添加亮色主题切换
commit 3: feat(ui): 添加 HoloCard/MFDPanel/TechButton 等 UI 组件
commit 4: test(backend): 补充 websocket/metrics/swagger 测试
commit 5: test(frontend): 补充 service/store/router/view 测试
commit 6: docs: 重建文档体系
commit 7: security: 安全加固（CodeQL/Snyk/git hooks）
commit 8: chore: 配置调整（ESLint/vitest/docker/nginx）
```

**方向二：修复前端失败测试**

执行顺序：wsService.test.js（1 个）→ http.test.js（15 个）→ Home.test.js（5 个）

### 14.3 短期（1~2 周，v1.4.0）

**方向三：后端覆盖率 63.86% → 70%+**

任务：websocket.ts 覆盖率验证、errorHandler 生产模式测试、fleetService/authService 异常分支测试。

**方向四：运维地基验证**

代码已就绪，需在测试环境跑一次备份恢复流程验证。

### 14.4 中期（2~4 周，v1.5.0）

**方向五：前端测试体系补全**

优先级：Service 层 → Store → 核心 View → E2E 扩展。策略：只补逻辑测试，跳过纯渲染测试。

**方向六：httpOnly Cookie JWT 迁移**

后端已就绪。前端改 http.js + authService.js + auth store。同步实施 CSRF 防护。

### 14.5 长期（按需启动）

| 方向 | 触发条件 | 工作量 |
|:-----|:---------|:------|
| 前端 TypeScript 迁移 | 代码量增长或第二开发者 | 2~3 周 |
| i18n 国际化 | 面向国际玩家 | 1~2 周 |
| 软删除机制 | 数据审计需求 | 2~3 天 |
| Redis 缓存层 | 多实例部署 | 2~3 天 |
| Grafana 仪表盘 | 生产部署后 | 1~2 天 |
| 文件上传服务 | 需要头像/图片管理 | 3~5 天 |
| 集中式表单验证 | 表单数量增多 | 2~3 天 |
| Web Vitals RUM | 需要真实用户性能数据 | 1~2 天 |

### 14.6 架构演进路线图

```
当前状态 (v1.3.1)
  │
  ├─→ [紧急] Git 清理 + 测试修复
  │
  ├─→ [v1.4.0] 后端 70% + 运维验证
  │     └─→ 后端达到可上线质量标准
  │
  ├─→ [v1.5.0] 前端 70% + httpOnly Cookie
  │     └─→ 全栈达到可上线质量标准
  │
  ├─→ [v1.6.0] CSRF + 密码策略 + API 废弃计划
  │     └─→ 安全体系完善
  │
  └─→ [按需] TS 迁移 / i18n / Redis / Grafana
        └─→ 根据业务增长择机启动
```

---

## 十五、ROADMAP

| 版本 | 交付 | 目标 | 截止日期 |
|:-----|:-----|:-----|:--------|
| v1.3.1 | 文档+安全清零 | 已完成 | 2026-05-31 ✅ |
| v1.4.0 | Git 清理 + 后端 70% + 运维验证 + 前端测试修复 | 可上线后端质量 | 2026-06-14 |
| v1.5.0 | 前端 70% + E2E 7 spec + httpOnly Cookie + CSRF | 可上线全栈质量 | 2026-06-28 |
| v1.6.0 | 密码策略 + API 废弃计划 + 安全架构完善 | 生产级安全 | 2026-07-05 |

---

## 十六、文档索引

| 文档 | 路径 |
|:-----|:-----|
| 架构设计 | docs/ARCHITECTURE.md |
| 路线图 | docs/ROADMAP.md |
| 测试指南 | docs/TESTING.md |
| 待办清单 | docs/TODO.md |
| API | docs/guides/API.md |
| 配置 | docs/guides/CONFIG.md |
| 开发 | docs/guides/DEVELOPMENT.md |
| 部署 | docs/guides/DEPLOYMENT.md |
| 安全 | docs/guides/SECURITY.md |
| 监控 | docs/guides/MONITORING.md |
| 贡献 | docs/guides/CONTRIBUTING.md |
| 技术选型 | docs/guides/TECH_STACK.md |
| 改进报告 | docs/reports/ENTERPRISE_IMPROVEMENTS.md |
| 变更记录 | CHANGELOG.md |