# 版本变更记录

> **项目**: Star Citizen 战队宣传网站
> **更新日期**: 2026-06-08
> **当前版本**: v1.3.1

---

## 版本规范

本项目遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/) 规范：

- **主版本号 (MAJOR)**: 不兼容的 API 变更
- **次版本号 (MINOR)**: 向下兼容的功能新增
- **修订号 (PATCH)**: 向下兼容的问题修复

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
