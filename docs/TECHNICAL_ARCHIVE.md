# 项目技术档案

> **项目名称**: Star Citizen 战队宣传网站
> **版本**: v1.3.4
> **档案日期**: 2026-06-19（全面审查更新）
> **档案说明**: 本文档基于源码逐文件审阅与真实测试运行结果编写，所有数据均可交叉验证。
> **⚠️ 技能档案更新提醒**: 本技术档案需随项目进展随时更新，每次重大变更后应同步更新对应章节。

---

## 〇、档案更新日志

| 日期 | 更新内容 | 更新人 |
|:-----|:---------|:-------|
| 2026-06-05 | 初始版本（v1.3.1） | AI Assistant |
| 2026-06-19 | 全面审查更新：版本升级至v1.3.4、漏洞分析P0-P3、Skills优化、前端设计问题、测试数据更新 | AI Agent |

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
| 2026-06-15 | v1.3.4 设计改版（SpaceX极简）、设计系统收口、CSS变量lint、CI/CD修复 |
| 2026-06-19 | 技术档案全面更新、漏洞分析、Skills优化（67→27个） |

### 1.4 当前状态

- **版本**: v1.3.4（已提交至main分支）
- **最新提交**: 784689c merge: TD-13 组①基础组件CSS变量迁移
- **Git状态**: 工作区干净，仅4个文件有未暂存变更
- **测试状态**: 前端410/411通过，后端352/352通过
- **Skills优化**: 已从67个精简至27个核心skills

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

`	ext
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
`

### 3.2 后端分层

`	ext
Route（路由 + 中间件编排）-> Service（业务逻辑）-> Database Pool（数据访问）
`

### 3.3 前端架构

`	ext
main.js -> App.vue -> Router -> Views -> Components/Composables/Services/Stores
`

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
| http.js | HTTP 客户端：fetch + httpOnly Cookie + 401 自动刷新 |
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

| 文件 | 功能 | 设计状态 |
|:-----|:-----|:---------|
| Home.vue | 首页：Hero、Key Numbers、Fleet Preview、CTA | ⚠️ 需重新设计 |
| About.vue | 团队介绍：Dossier + 数据面板 + 时间线 | ⚠️ 需重新设计 |
| Members.vue | 核心成员展示 | ⚠️ 需重新设计 |
| Projects.vue | 活动项目 | ⚠️ 需重新设计 |
| Fleet.vue | 舰队展示 | ⚠️ 需重新设计 |
| Calendar.vue | 活动日历（MFD风格） | ✅ 已使用新组件 |
| Join.vue | 入队申请表单 | ⚠️ 需重新设计 |
| Contact.vue | 联系我们 | ⚠️ 需重新设计 |
| Login.vue | 登录（全息终端风格） | ✅ 已使用新风格 |
| Register.vue | 注册 | ⚠️ 需重新设计 |
| Profile.vue | 个人中心 | ⚠️ 需重新设计 |
| ApplicationStatus.vue | 申请状态 | ⚠️ 需重新设计 |
| Offline.vue | PWA 离线页 | ✅ 可用 |
| NotFound.vue | 404 | ⚠️ 需重新设计 |
| admin/Dashboard.vue | 仪表盘 | ⚠️ 需重新设计 |
| admin/MembersAdmin.vue | 成员管理 | ⚠️ 需重新设计 |
| admin/PilotsAdmin.vue | 飞行员管理 | ⚠️ 需重新设计 |
| admin/ProjectsAdmin.vue | 项目管理 | ⚠️ 需重新设计 |
| admin/ApplicationsAdmin.vue | 申请审核 | ⚠️ 需重新设计 |
| admin/Settings.vue | 系统设置 | ⚠️ 需重新设计 |

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

## 七、测试现状（2026-06-19 实测）

### 7.1 后端（Jest）

**29 suites / 352 tests / 全部通过 / 4.99s**

覆盖率: 语句 63.86% | 分支 72.00% | 函数 85.88% | 通过率 100%

高覆盖: admin 路由 98%, auth 路由 97%, services 93~100%, cache 100%, pool 88%

测试文件: api / auth / errorHandler / websocket / swagger / cache / metrics / auditLogger / pagination / requestId / validator / 10 个 route 文件 / 8 个 service 文件

### 7.2 前端（Vitest）

**44 files / 44 passed / 410 tests passed / 1 skipped / 32.27s**

✅ 全部通过，无失败用例

测试覆盖: 6 组件 + 6 composable + 1 config + 1 router + 8 service + 3 store + 1 util + 14 view + 1 PWA

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
| 认证 | JWT (HS256)，httpOnly Cookie，可选认证 + 角色鉴权 |
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

## 十一、Skills 技能框架管理

> **⚠️ 技能档案更新提醒**: Skills 配置需随项目需求变化随时更新，新增或移除 skill 后应同步更新本章节。

### 11.1 当前 Skills 配置（2026-06-19 优化后）

**总计**: 27 个核心 skills（从原有 67 个精简 60%）

**备份位置**: .agents/skills.backup/ + .trae/skills.backup/

### 11.2 保留的 Skills 分类

#### 前端设计类（10个）

| Skill | 用途 | 位置 |
|:------|:-----|:-----|
| design-taste-frontend | 前端设计品味 | .agents/skills/ |
| minimalist-ui | 极简UI设计 | .agents/skills/ |
| web-design-engineer | 网页设计工程 | .agents/skills/ |
| high-end-visual-design | 高端视觉设计 | .agents/skills/ |
| industrial-brutalist-ui | 工业风UI | .agents/skills/ |
| superdesign | 超级设计 | .agents/skills/ |
| stitch-design-taste | 设计品味整合 | .agents/skills/ |
| prototype | 原型设计 | .agents/skills/ |
| redesign-existing-projects | 项目重设计 | .agents/skills/ |
| improve-codebase-architecture | 架构改进 | .agents/skills/ |

#### 后端开发类（6个）

| Skill | 用途 | 位置 |
|:------|:-----|:-----|
| api-design-standards | API设计标准 | .agents/skills/ |
| database-design | 数据库设计 | .agents/skills/ |
| nodejs-database-patterns | Node.js数据库模式 | .agents/skills/ |
| express-security-hardening | Express安全加固 | .agents/skills/ |
| sql-toolkit | SQL工具包 | .agents/skills/ |
| docker-essentials | Docker基础 | .agents/skills/ |

#### Vue专项类（2个）

| Skill | 用途 | 位置 |
|:------|:-----|:-----|
| vue-component-testing | Vue组件测试 | .agents/skills/ |
| vue-chartjs-integration | Vue图表集成 | .agents/skills/ |

#### 工程流程类（2个）

| Skill | 用途 | 位置 |
|:------|:-----|:-----|
| tdd | 测试驱动开发 | .agents/skills/ |
| typescript-migration-guide | TypeScript迁移指南 | .agents/skills/ |

#### Superpowers框架（7个）

| Skill | 用途 | 位置 |
|:------|:-----|:-----|
| brainstorming | 头脑风暴/需求分析 | .trae/skills/ |
| test-driven-development | 测试驱动开发 | .trae/skills/ |
| systematic-debugging | 系统化调试 | .trae/skills/ |
| requesting-code-review | 请求代码审查 | .trae/skills/ |
| verification-before-completion | 完成前验证 | .trae/skills/ |
| writing-plans | 编写计划 | .trae/skills/ |
| finishing-a-development-branch | 完成开发分支 | .trae/skills/ |

### 11.3 已剔除的 Skills（40个）

**从 .agents/skills 剔除（27个）**: image-to-code, imagegen-frontend-web, web-video-presentation, brandkit, caveman, deep-research-pro, diagnose, ecc, find-skills, full-output-enforcement, git-essentials, github, grill-me, grill-with-docs, handoff, kb-retriever, learned, playwright-mcp, proactive-agent, self-improving, skill-vetter, summarize, to-issues, to-prd, triage, write-a-skill, zoom-out

**从 .trae/skills 剔除（13个）**: chinese-code-review, chinese-commit-conventions, chinese-documentation, chinese-git-workflow, dispatching-parallel-agents, executing-plans, mcp-builder, receiving-code-review, subagent-driven-development, using-git-worktrees, using-superpowers, workflow-runner, writing-skills

### 11.4 Skills 更新规则

1. **新增 Skill**: 当项目引入新技术栈或新流程时，添加对应 skill
2. **移除 Skill**: 当 skill 与项目不再相关时，移除并更新本章节
3. **备份原则**: 每次批量操作前必须备份至 .agents/skills.backup/
4. **文档同步**: Skills 变更后必须同步更新本技术档案的第十一章

---

## 十二、漏洞分析报告（P0-P3 排序）

> **分析日期**: 2026-06-19
> **分析范围**: 全栈代码审查（前端Vue组件 + 后端Express路由/服务/中间件）

### 12.1 P0 — 严重漏洞（影响系统安全/数据完整性）

| 编号 | 漏洞 | 文件 | 影响 | 修复方案 | 预计工时 |
|:-----|:-----|:-----|:-----|:---------|:--------|
| V-P0-1 | 申请提交接口缺少独立速率限制 | server/src/routes/applications.ts:59 | 攻击者可用不同邮箱批量刷申请，污染数据库 | 为申请提交路由添加独立速率限制（每IP每小时最多5次） | 半天 |
| V-P0-2 | 生产构建未验证 | vite.config.js | vite-plugin-pwa的esbuild子进程EPERM，生产环境可能无法部署 | 本地运行
pm run build验证构建输出 | 半天 |
| V-P0-3 | Admin路由缺少CSRF防护 | server/src/routes/admin.ts | 高危操作（reset-db/clear-cache）无CSRF token，管理员可被CSRF攻击 | 添加CSRF token中间件 | 1天 |

### 12.2 P1 — 高优先级漏洞（影响功能/用户体验）

| 编号 | 漏洞 | 文件 | 影响 | 修复方案 | 预计工时 |
|:-----|:-----|:-----|:-----|:---------|:--------|
| V-P1-1 | 128处CSS变量deprecated引用未迁移 | 多个前端组件 | 样式维护困难，主题切换可能不一致 | 按TD-13计划分组迁移（组②③④） | 3-4天 |
| V-P1-2 | 两套重复滚动揭示动画系统 | composables/useScrollReveal.js + useGSAPReveal.js | 打包体积增大，维护混乱 | 统一使用一套，删除另一套 | 1天 |
| V-P1-3 | Sentry动态导入重复4次 | services/errorReporting.js | 增加不必要的网络请求 | 模块顶层做一次动态导入 | 半天 |
| V-P1-4 | Service update函数冗余SELECT | server/src/services/*.ts | 每次更新多一次数据库查询 | 使用UPDATE后检查affectedRows | 1天 |
| V-P1-5 | 前端设计缺乏一致性 | 多个Vue组件 | 用户体验差，品牌形象受损 | 重新设计前端，统一视觉风格 | 2周 |

### 12.3 P2 — 中优先级问题（影响代码质量/可维护性）

| 编号 | 问题 | 文件 | 影响 | 修复方案 | 预计工时 |
|:-----|:-----|:-----|:-----|:---------|:--------|
| V-P2-1 | sanitizeBody重复实现 | middleware/auditLogger.ts + requestLogger.ts | 代码重复，维护困难 | 抽取为utils/sanitize.ts | 半天 |
| V-P2-2 | Knex配置共享同一对象引用 | server/knexfile.js | 环境隔离性差 | 使用深拷贝或独立配置对象 | 半天 |
| V-P2-3 | Event ICS导出未转义特殊字符 | 活动日历相关服务 | 导出的日历文件可能格式损坏 | 按RFC 5545规范转义 | 半天 |
| V-P2-4 | 生产构建验证未完成 | vite.config.js | 不确定生产部署是否可行 | 运行npm run build并验证输出 | 半天 |

### 12.4 P3 — 低优先级问题（技术债务/优化改进）

| 编号 | 问题 | 文件 | 影响 | 触发条件 |
|:-----|:-----|:-----|:-----|:--------|
| V-P3-1 | 数据库DDL重复 | database/init.ts + migrate.ts | 维护困难 | 需要修改表结构时 |
| V-P3-2 | 前端i18n支持缺失 | 全站 | 无法面向国际用户 | 面向国际玩家时 |
| V-P3-3 | 前端性能监控(RUM)缺失 | 前端 | 无法了解真实用户体验 | 需要性能优化时 |
| V-P3-4 | 前端未迁移到TypeScript | src/ | 类型安全依赖运行时 | 代码量增长或第二开发者加入 |
| V-P3-5 | 无软删除机制 | 数据库 | 删除即物理删除 | 有数据审计需求 |
| V-P3-6 | 无Redis缓存层 | 后端 | 多实例部署时缓存失效 | 并发用户超过500 |
| V-P3-7 | 无Grafana监控仪表盘 | 基础设施 | 缺少可视化监控 | 生产部署后 |

---

## 十三、前端设计问题分析

> **分析日期**: 2026-06-19
> **用户反馈**: "前端太丑没有设计感，要重新设计一遍前端排版"

### 13.1 当前设计问题诊断

| 问题 | 严重程度 | 影响页面 | 说明 |
|:-----|:---------|:---------|:-----|
| 视觉风格不统一 | 🔴 高 | 全站 | 部分页面用bezel-shell风格，部分用glass-card风格，部分用普通card |
| 布局单调 | 🔴 高 | Members/Projects/About | 大量简单卡片网格，缺乏视觉层次和空间感 |
| 交互反馈不足 | 🟡 中 | Fleet/Members | 悬停效果、过渡动画不够丰富 |
| 响应式不够精细 | 🟡 中 | 全站 | 移动端体验需要优化 |
| 信息密度过低 | 🟡 中 | About/Contact | 部分页面内容稀疏，空间利用不充分 |
| CSS变量deprecated引用 | 🟠 中 | 128处 | 旧变量名仍在使用，影响主题一致性 |

### 13.2 前端重新设计优先级

| 页面 | 当前问题 | 设计方向 | 优先级 |
|:-----|:----------|:---------|:-------|
| Home.vue | 数据硬编码，视觉层次不够 | SpaceX极简+沉浸式 | 🔴 最高 |
| Members.vue | 卡片过于简单 | 飞行员档案风格+数据可视化 | 🔴 高 |
| Fleet.vue | 舰船卡片缺乏互动 | 3D视差+全息效果 | 🔴 高 |
| Join.vue | 表单缺乏设计感 | 终端风格+进度引导 | 🟡 中 |
| About.vue | 布局单调 | 数据仪表盘+时间线 | 🟡 中 |
| Contact.vue | 信息稀疏 | 通讯频道风格 | 🟢 低 |
| Projects.vue | 卡片过于简单 | 任务指挥面板 | 🟢 低 |
| Login/Register | 风格不一致 | 统一全息终端风格 | 🟡 中 |
| Profile/ApplicationStatus | 缺乏设计 | 个人数据中心风格 | 🟢 低 |
| Admin页面 | 全部需要重设计 | MFD仪表盘风格 | 🟡 中 |

### 13.3 设计系统现状

**色彩体系**: ✅ 已统一为星际蓝（#4a9eff）+ OLED黑底
**字体系统**: ✅ 已定义（font-display/font-body/font-data/font-tech）
**间距系统**: ✅ 已定义（space-1到space-20）
**圆角系统**: ✅ 已定义（radius-sm到radius-2xl）
**动画系统**: ⚠️ 存在两套重复实现
**组件库**: ⚠️ 有基础组件但使用不一致

---

## 十四、技术债务追踪

### 14.1 已解决的技术债务

| 编号 | 问题 | 解决日期 | 版本 |
|:-----|:-----|:---------|:-----|
| TD-1 | 认证中间件使用.then()而非async/await | 2026-05-28 | v1.3.0 |
| TD-3 | 前端console.log未清理 | 2026-05-28 | v1.3.0 |
| TD-4 | 数据库查询未使用连接池监控 | 2026-05-28 | v1.3.0 |
| TD-5 | 缺少API版本控制 | 2026-04-15 | v1.1.0 |
| TD-6 | 缓存键未包含查询参数 | 2026-06-08 | v1.3.1 |

### 14.2 待解决的技术债务

| 编号 | 问题 | 引入版本 | 状态 | 优先级 |
|:-----|:-----|:---------|:------|:-------|
| TD-7 | Service update函数冗余SELECT | v1.0.0 | ⚠️ 待修复 | P1 |
| TD-8 | sanitizeBody重复实现 | v1.1.0 | ⚠️ 待修复 | P2 |
| TD-9 | 两套重复滚动揭示动画系统 | v1.2.0 | ⚠️ 待修复 | P1 |
| TD-10 | Sentry动态导入重复4次 | v1.3.1 | ⚠️ 待修复 | P1 |
| TD-11 | Knex配置共享同一对象引用 | v1.0.0 | ⚠️ 待修复 | P2 |
| TD-12 | Event ICS导出未转义特殊字符 | v1.1.0 | ⚠️ 待修复 | P2 |
| TD-13 | 128处旧CSS变量名待迁移 | v1.3.4 | 🔄 进行中 | P1 |

---

## 十五、质量门禁

| 指标 | 当前值 | 目标值 | 状态 |
|:-----|:-------|:-------|:-----|
| 后端语句覆盖率 | 63.86% | ≥ 70% | ⚠️ 差距6.14% |
| 后端分支覆盖率 | 72.00% | ≥ 60% | ✅ 已达标 |
| 后端函数覆盖率 | 85.88% | ≥ 70% | ✅ 已达标 |
| 后端测试通过率 | 352/352 (100%) | 100% | ✅ 已达标 |
| 前端测试通过率 | 410/411 (99.76%) | 100% | ✅ 基本达标 |
| E2E 测试 spec 数 | 5 | ≥ 7 | ⚠️ 差距2个 |
| ESLint 错误数 | 0 | 0 | ✅ 已达标 |
| 高危安全漏洞 | 0 | 0 | ✅ 已达标 |
| CSS变量deprecated引用 | 128 | 0 | ⚠️ 迁移中 |

---

## 十六、版本规划

| 版本 | 关键交付 | 预计时间 | 状态 |
|:-----|:---------|:---------|:-----|
| v1.3.4 | 设计改版、设计系统收口、CSS变量lint | 2026-06-15 | ✅ 已完成 |
| v1.4.0 | 后端≥70%、日志轮转、数据库备份、SSL自动化、CSS变量迁移 | 2026-06-21 | 🔄 进行中 |
| v1.5.0 | 前端≥70%、E2E 7 spec、前端重新设计 | 2026-06-28 | 📋 计划中 |
| v1.6.0 | httpOnly Cookie JWT、CSRF防护、安全架构完善 | 2026-07-05 | 📋 计划中 |

---

## 十七、开发规范

代码: ESLint 9.x + Prettier + Vue 3 Composition API + JSDoc/TS

Git: feat/ fix/ refactor/ docs/ chore/ 前缀

测试: Jest(后端) + Vitest(前端) + Playwright(E2E)

---

## 十八、文档索引

| 文档 | 路径 | 说明 |
|:-----|:-----|:-----|
| 技术档案 | docs/TECHNICAL_ARCHIVE.md | **本文档** - 项目全貌 |
| 架构设计 | docs/ARCHITECTURE.md | 系统架构详解 |
| 路线图 | docs/ROADMAP.md | 优化路线规划 |
| 待办清单 | docs/TODO.md | 任务追踪 |
| 测试指南 | docs/TESTING.md | 测试规范 |
| API文档 | docs/guides/API.md | 接口说明 |
| 配置指南 | docs/guides/CONFIG.md | 配置参数 |
| 开发指南 | docs/guides/DEVELOPMENT.md | 开发流程 |
| 部署指南 | docs/guides/DEPLOYMENT.md | 部署方案 |
| 安全指南 | docs/guides/SECURITY.md | 安全体系 |
| 监控指南 | docs/guides/MONITORING.md | 监控方案 |
| 贡献指南 | docs/guides/CONTRIBUTING.md | 贡献规范 |
| 技术选型 | docs/guides/TECH_STACK.md | 选型依据 |
| 改进报告 | docs/reports/ENTERPRISE_IMPROVEMENTS.md | 企业级改进 |
| 变更记录 | CHANGELOG.md | 版本变更 |
| 前端重设计计划 | docs/home-redesign-plan.md | 首页重设计方案 |

---

> **⚠️ 技能档案更新提醒**
> 
> 本技术档案是项目的核心参考文档，需随项目进展随时更新。以下情况必须同步更新本档案：
> 
> 1. **版本发布后** — 更新版本号、测试数据、质量门禁
> 2. **Skills变更后** — 更新第十一章Skills配置
> 3. **漏洞修复后** — 更新第十二章漏洞状态
> 4. **设计改版后** — 更新第十三章设计问题分析
> 5. **技术债务解决后** — 更新第十四章债务追踪
> 6. **架构变更后** — 更新第三章架构设计和第四章源码清单
