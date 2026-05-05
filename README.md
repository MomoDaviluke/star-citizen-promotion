<div align="center">

# 🚀 星际公民战队宣传网站

**企业级全栈项目 · 95%+ 测试覆盖率 · 完整 CI/CD 流水线**

*面向星际公民玩家的专业团队门户*

[![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Knex.js](https://img.shields.io/badge/Knex.js-latest-E16426?style=flat-square&logo=knex)](https://knexjs.org/)
[![Vitest](https://img.shields.io/badge/Vitest-3.0-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-1.58-45ba4c?style=flat-square&logo=playwright)](https://playwright.dev/)
[![Jest](https://img.shields.io/badge/Jest-29.7-C21325?style=flat-square&logo=jest)](https://jestjs.io/)
[![Docker](https://img.shields.io/badge/Docker-latest-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Prometheus](https://img.shields.io/badge/Prometheus-latest-E6522C?style=flat-square&logo=prometheus)](https://prometheus.io/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?style=flat-square&logo=swagger)](https://swagger.io/)
[![Sentry](https://img.shields.io/badge/Sentry-latest-362D59?style=flat-square&logo=sentry)](https://sentry.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

[功能特性](#-功能特性) ·
[技术架构](#-技术架构) ·
[快速开始](#-快速开始) ·
[核心模块](#-核心模块解析) ·
[配置指南](#-配置指南) ·
[API 文档](#-api-接口文档) ·
[测试体系](#-测试体系) ·
[部署方案](#-部署方案) ·
[常见问题](#-常见问题)

</div>

---

## 📖 项目简介

基于 **Vue 3 + Vite + Express.js + MySQL** 构建的企业级全栈星际公民战队宣传网站。采用科幻风格 UI 设计，三层架构分层设计，为战队提供专业的展示、招募与管理平台。

### 核心亮点

| 特性 | 说明 |
|:-----|:-----|
| 🏗️ **三层架构** | Controllers → Services → Repositories 严格分层，职责清晰 |
| 🧪 **全面测试** | 单元测试 + 集成测试 + E2E 测试，覆盖率阈值 80%+ |
| 🚀 **CI/CD** | GitHub Actions 自动化代码检查、测试、安全扫描、构建流水线 |
| 🔐 **安全加固** | JWT 认证、bcrypt 加密、Helmet 安全头、速率限制、CORS 策略、敏感数据脱敏 |
| 📝 **企业日志** | Winston 结构化日志，支持多级别输出与文件归档 |
| 📊 **可观测性** | Prometheus 指标监控、Sentry 错误追踪、Swagger API 文档 |
| 🤖 **AI 服务** | 优先级任务队列、并发控制、超时重试、资源监控 |
| 🗄️ **数据库迁移** | Knex.js 专业迁移工具，支持版本追踪与回滚 |
| 🔍 **类型安全** | JSDoc + TypeScript 渐进式类型检查 |
| 🐳 **容器化** | Docker 多阶段构建、docker-compose 编排、Nginx 反向代理 |
| 📚 **完整文档** | 16+ 份文档覆盖架构设计、需求规格、API 接口、质量标准等 |

---

## ✨ 功能特性

### 前端功能

- **科幻 UI 设计** — 网格背景、光晕效果、扫描线动画，沉浸式星际体验
- **路由预加载** — 智能预加载相邻路由组件，提升页面导航体验
- **双数据源** — 支持后端 API 与静态数据自动切换，离线亦可访问
- **AI 服务架构** — 优先级队列调度、并发控制、超时重试、资源监控
- **完整认证流程** — 注册 / 登录 / 令牌自动刷新 / RBAC 权限控制
- **错误边界** — React 风格 ErrorBoundary 组件，优雅处理渲染异常
- **响应式设计** — 移动端适配，支持 `prefers-reduced-motion` 无障碍偏好
- **管理后台** — 仪表盘、成员管理、飞行员管理、项目管理、申请审核

### 后端功能

- **RESTful API** — 规范的资源路由设计，统一的响应格式
- **JWT 认证** — 令牌签发 / 验证 / 刷新，支持可选认证与角色鉴权
- **数据库连接池** — MySQL2 连接池管理，支持事务操作
- **请求日志** — Morgan + 自定义请求日志中间件，全链路追踪
- **速率限制** — express-rate-limit 防止 API 滥用
- **参数校验** — express-validator 请求数据验证
- **WebSocket** — ws 实时通信支持

---

## 🛠️ 技术架构

### 技术栈总览

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx 反向代理                        │
│                    (负载均衡 / Gzip / 静态资源)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│    前端 (Vue 3)   │    │   后端 (Express)  │
│                  │    │                  │
│  Vue Router 5.0  │◄──►│  JWT 认证中间件    │
│  Vitest 3.0      │    │  Helmet 安全加固   │
│  Playwright 1.58 │    │  Winston 日志     │
│  Vite 7.3        │    │  Rate Limit      │
└──────────────────┘    └────────┬─────────┘
                                 │
                        ┌────────┴─────────┐
                        ▼                  ▼
                ┌──────────────┐   ┌──────────────┐
                │  MySQL 8.0   │   │  WebSocket   │
                │  (连接池)     │   │  (ws 实时通信) │
                └──────────────┘   └──────────────┘
```

### 前端技术栈

| 技术 | 版本 | 用途 |
|:-----|:-----|:-----|
| Vue.js | 3.5 | 渐进式 JavaScript 框架 |
| Vue Router | 5.0 | 官方路由管理器 |
| Vite | 7.3 | 下一代前端构建工具 |
| Vitest | 3.0 | 单元测试框架 |
| Playwright | 1.58 | 端到端测试框架 |
| ESLint | 9.x | 代码质量检查 |
| @vue/test-utils | 2.4 | Vue 组件测试工具 |
| Sentry | latest | 前端错误监控 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|:-----|:-----|:-----|
| Node.js | ≥20.0 | JavaScript 运行时 |
| Express.js | 4.21 | Web 应用框架 |
| MySQL2 | 3.12 | MySQL 数据库驱动（连接池） |
| Knex.js | latest | SQL 查询构建器 & 迁移工具 |
| jsonwebtoken | 9.0 | JWT 令牌签发与验证 |
| bcryptjs | 2.4 | 密码哈希加密 |
| Helmet | 8.0 | HTTP 安全头设置 |
| Winston | 3.17 | 企业级结构化日志 |
| express-rate-limit | 7.5 | API 速率限制 |
| express-validator | 7.2 | 请求数据校验 |
| ws | 8.18 | WebSocket 实时通信 |
| Jest | 29.7 | 后端测试框架 |
| Supertest | 7.0 | HTTP 接口测试 |
| Prometheus | latest | 应用性能监控指标 |
| Swagger | OpenAPI 3.0 | API 文档自动生成 |
| Sentry | latest | 前端错误监控 |

---

## 📁 项目结构

```
star-citizen-promotion/
├── .github/workflows/          # CI/CD 配置
│   └── ci.yml                  # GitHub Actions 流水线
├── docs/                       # 项目文档 (16+ 份)
├── e2e/                        # Playwright E2E 测试
│   ├── home.spec.js
│   └── join.spec.js
├── public/                     # 静态资源
├── server/                     # ===== 后端服务 =====
│   └── src/
│       ├── config/index.js         # 环境配置中心
│       ├── controllers/            # 控制器层（路由处理）
│       │   ├── authController.js       # 认证控制器
│       │   ├── memberController.js     # 成员控制器
│       │   ├── pilotController.js      # 飞行员控制器
│       │   ├── projectController.js    # 项目控制器
│       │   ├── applicationController.js# 申请控制器
│       │   └── statsController.js      # 统计控制器
│       ├── services/               # 业务逻辑层
│       │   ├── authService.js          # 认证服务（注册/登录/令牌）
│       │   ├── memberService.js        # 成员服务
│       │   ├── pilotService.js         # 飞行员服务
│       │   ├── projectService.js       # 项目服务
│       │   ├── applicationService.js   # 申请服务
│       │   └── statsService.js         # 统计服务
│       ├── repositories/           # 数据访问层
│       │   ├── baseRepository.js       # 基础仓储（通用 CRUD）
│       │   ├── userRepository.js       # 用户仓储
│       │   ├── memberRepository.js     # 成员仓储
│       │   ├── pilotRepository.js      # 飞行员仓储
│       │   ├── projectRepository.js    # 项目仓储
│       │   └── applicationRepository.js# 申请仓储
│       ├── middleware/             # Express 中间件
│       │   ├── auth.js                 # JWT 认证 / 角色鉴权
│       │   ├── errorHandler.js         # 统一错误处理
│       │   └── requestLogger.js        # 请求日志
│       ├── routes/                 # 路由定义
│       ├── database/               # 数据库管理
│       │   ├── pool.js                 # MySQL 连接池
│       │   ├── init.js                 # 表结构初始化
│       │   ├── migrate.js              # 数据库迁移
│       │   └── seed.js                 # 种子数据
│       ├── utils/                  # 工具模块
│       │   ├── errors.js               # 统一错误类体系
│       │   ├── jwt.js                  # JWT 工具函数
│       │   ├── logger.js               # Winston 日志配置
│       │   └── container.js            # 依赖注入容器
│       └── index.js               # 服务入口
├── src/                        # ===== 前端应用 =====
│   ├── components/             # Vue 组件
│   │   ├── common/                 # 通用组件
│   │   │   ├── ErrorBoundary.vue       # 错误边界
│   │   │   ├── LoadingIndicator.vue    # 加载指示器
│   │   │   ├── PageTitle.vue           # 页面标题
│   │   │   └── PageTransition.vue      # 页面过渡动画
│   │   └── layout/                 # 布局组件
│   │       ├── SiteHeader.vue          # 站点头部导航
│   │       └── SiteFooter.vue          # 站点底部
│   ├── composables/            # 组合式函数
│   │   └── useAI.js                # AI 任务管理 Hook
│   ├── config/                 # 前端配置
│   │   └── site.config.js          # 站点内容配置
│   ├── data/                   # 静态数据
│   │   └── siteContent.js          # 站点内容数据
│   ├── router/                 # 路由配置
│   │   └── index.js                # 路由定义与导航守卫
│   ├── services/               # 前端服务层
│   │   ├── AIService.js            # AI 服务（队列/并发/重试/监控）
│   │   ├── PriorityQueue.js        # 优先级队列（最大堆实现）
│   │   ├── ResourceMonitor.js      # 浏览器资源监控器
│   │   ├── authService.js          # 认证 API 调用
│   │   ├── dataService.js          # 数据服务（API/静态切换）
│   │   └── http.js                 # HTTP 客户端封装
│   ├── styles/                 # 全局样式
│   │   └── base.css                # 基础样式与 CSS 变量
│   └── views/                  # 页面视图
│       ├── Home.vue                # 首页
│       ├── About.vue               # 团队介绍
│       ├── Members.vue             # 核心成员
│       ├── Projects.vue            # 活动项目
│       ├── Join.vue                # 加入我们
│       ├── Contact.vue             # 联系我们
│       ├── Login.vue               # 登录
│       ├── Register.vue            # 注册
│       ├── Profile.vue             # 个人中心
│       ├── ApplicationStatus.vue   # 申请状态
│       ├── NotFound.vue            # 404 页面
│       └── admin/                  # 管理后台
│           ├── AdminLayout.vue         # 后台布局
│           ├── Dashboard.vue           # 仪表盘
│           ├── MembersAdmin.vue        # 成员管理
│           ├── PilotsAdmin.vue         # 飞行员管理
│           ├── ProjectsAdmin.vue       # 项目管理
│           ├── ApplicationsAdmin.vue   # 申请审核
│           └── Settings.vue            # 系统设置
├── tests/                      # 前端测试
│   ├── components/                 # 组件测试
│   ├── composables/                # 组合式函数测试
│   ├── services/                   # 服务层测试
│   └── views/                      # 视图测试
├── Dockerfile                  # 多阶段 Docker 构建
├── docker-compose.yml          # 容器编排配置
├── nginx.conf                  # Nginx 反向代理配置
├── vitest.config.js            # Vitest 配置
├── playwright.config.js        # Playwright 配置
├── eslint.config.js            # ESLint 配置
└── vite.config.js              # Vite 构建配置
```

---

## 🚀 快速开始

### 环境要求

| 依赖 | 最低版本 | 推荐版本 |
|:-----|:---------|:---------|
| Node.js | 20.0 | 20.19+ |
| MySQL | 8.0 | 8.0 |
| npm | 9.0 | 10+ |

### 安装部署

```bash
# 1. 克隆项目
git clone https://github.com/MomoDaviluke/star-citizen-promotion.git
cd star-citizen-promotion

# 2. 安装前端依赖
npm install

# 3. 安装后端依赖
cd server && npm install && cd ..

# 4. 配置环境变量
cp .env.example .env.development
cp server/.env.example server/.env.development
# 编辑 .env 文件，填入实际的数据库连接信息和 JWT 密钥

# 5. 初始化数据库
cd server && npm run db:init && cd ..

# 6. 启动开发服务器
npm run dev                    # 前端 → http://localhost:3000
cd server && npm run dev       # 后端 → http://localhost:3001
```

### Docker 部署

```bash
# 使用 docker-compose 一键启动
docker-compose up -d

# 生产环境（含 Nginx 反向代理）
docker-compose --profile production up -d
```

---

## 🔍 核心模块解析

### 1. 三层架构设计

项目后端严格遵循 **Controllers → Services → Repositories** 三层架构：

```
请求 → Controller（参数校验、响应格式化）
         ↓
      Service（业务逻辑、错误处理）
         ↓
      Repository（数据访问、SQL 构建）
         ↓
      MySQL（数据持久化）
```

- **Controller 层** — 负责接收请求、参数校验（express-validator）、调用 Service、格式化响应
- **Service 层** — 核心业务逻辑，处理认证、数据转换、错误抛出（统一错误类）
- **Repository 层** — 数据访问抽象，封装 SQL 操作，继承 `baseRepository` 通用 CRUD

### 2. AI 服务引擎

前端 AI 服务模块提供完整的异步任务管理能力：

```javascript
import { AIService, PRIORITY } from '@/services/AIService.js'

const aiService = new AIService({
  timeout: 30000,       // 任务超时 30s
  maxRetries: 3,        // 最大重试 3 次
  maxConcurrent: 3,     // 最大并发 3 个
  enableMonitoring: true // 启用资源监控
})

// 提交高优先级任务
const result = await aiService.submit(async ({ signal, onProgress }) => {
  onProgress(50)
  const response = await fetch('/api/data', { signal })
  return response.json()
}, { priority: PRIORITY.HIGH })
```

**核心能力：**

| 能力 | 实现方式 |
|:-----|:---------|
| 优先级调度 | 最大堆优先级队列（`PriorityQueue`），4 级优先级 |
| 并发控制 | 信号量机制，可配置最大并发数 |
| 超时处理 | `AbortController` + 可配置超时时间 |
| 自动重试 | 指数退避重试策略，可配置重试次数与延迟 |
| 资源监控 | `ResourceMonitor` 定期检测内存/CPU，超阈值触发预警 |
| 任务取消 | 支持 `AbortSignal` 取消正在执行的任务 |

**组合式函数封装：**

```javascript
import { useAI } from '@/composables/useAI.js'

const { isLoading, error, result, execute, cancel } = useAI()

const data = await execute(async ({ signal, onProgress }) => {
  onProgress(50)
  // 异步操作...
  return result
}, { priority: PRIORITY.CRITICAL })
```

### 3. 认证与安全体系

**JWT 认证流程：**

```
注册/登录 → Service 层验证 → 签发 JWT → 前端存储 Token
                                              ↓
后续请求 → Authorization: Bearer <token> → auth 中间件验证 → 注入 req.user
```

**安全措施：**

| 措施 | 实现 |
|:-----|:-----|
| 密码加密 | bcryptjs，可配置 salt rounds（默认 12） |
| JWT 签名 | HS256 算法，包含 issuer/subject 声明 |
| 令牌刷新 | 前端 HTTP 客户端自动检测 401 并刷新 |
| 安全头 | Helmet 中间件，配置 CSP / XSS 保护 / HSTS |
| CORS | 限定前端域名，支持 credentials |
| 速率限制 | 15 分钟窗口内最多 100 次请求 |
| 请求体限制 | JSON 10kb / URL-encoded 10kb |
| SQL 注入防护 | mysql2 参数化查询（`?` 占位符） |
| 用户数据脱敏 | `sanitizeUser()` 移除 password_hash / passwordHash |

**认证中间件：**

```javascript
// 强制认证
router.get('/profile', authenticate, handler)

// 可选认证（未登录不报错）
router.get('/public-data', optionalAuth, handler)

// 角色鉴权
router.delete('/admin/users', authenticate, requireRole('admin'), handler)
```

### 4. 统一错误处理

后端定义了完整的错误类体系，所有业务错误均继承自 `AppError`：

```javascript
// 错误类层级
AppError (基类, statusCode=500)
  ├── BadRequestError    (400)  // 请求参数错误
  ├── UnauthorizedError  (401)  // 未授权访问
  ├── ForbiddenError     (403)  // 禁止访问
  ├── NotFoundError      (404)  // 资源不存在
  └── ConflictError      (409)  // 资源冲突
```

`errorHandler` 中间件统一捕获并格式化错误响应：

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "无效的认证令牌"
  }
}
```

同时处理 `JsonWebTokenError`、`TokenExpiredError`、`SQLITE_CONSTRAINT` / `ER_DUP_ENTRY` 等第三方错误。

### 5. 数据库连接池

```javascript
// 连接池配置（server/src/database/pool.js）
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  timezone: '+08:00',
  charset: 'utf8mb4'
})

// 统一查询接口
export async function query(sql, params)     // 返回行数组
export async function queryOne(sql, params)  // 返回单行或 null
export async function execute(sql, params)   // 返回执行结果
export async function transaction(callback)  // 事务支持
```

### 6. 依赖注入容器

```javascript
// server/src/utils/container.js
const container = new Container()

container.register('authService', (c) => new AuthService(c.get('userRepository')), { singleton: true })
container.register('userRepository', () => new UserRepository())

const authService = container.get('authService')
```

### 7. 前端 HTTP 客户端

```javascript
// src/services/http.js — 统一 HTTP 请求封装
import { httpClient } from '@/services/http.js'

// 自动附加 Authorization 头
// 401 时自动刷新令牌并重试
// 请求/响应统一错误处理
const response = await httpClient.get('/api/members')
const response = await httpClient.post('/api/auth/login', { email, password })
```

### 8. 错误边界组件

```vue
<template>
  <ErrorBoundary title="加载失败" message="数据获取异常，请稍后重试">
    <MyComponent />
  </ErrorBoundary>
</template>
```

捕获子组件渲染错误，提供重试与返回首页操作，支持显示错误详情。

---

## ⚙️ 配置指南

### 前端环境变量

在项目根目录创建 `.env.development` 文件：

```bash
# 应用基础
VITE_APP_ENV=development
VITE_APP_NAME=Star Citizen Promotion

# 后端服务地址
VITE_BACKEND_URL=http://localhost:3001

# AI 服务配置
VITE_AI_SERVICE_URL=http://localhost:3002
VITE_AI_TIMEOUT=30000
VITE_AI_MAX_RETRIES=3
VITE_AI_MAX_CONCURRENT=3

# WebSocket 配置
VITE_WS_URL=ws://localhost:3003

# 数据源切换（true=API, false=静态数据）
VITE_USE_API=false
```

### 后端环境变量

在 `server/` 目录创建 `.env.development` 文件：

```bash
# 服务配置
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# JWT 配置
JWT_SECRET=your-secure-jwt-secret-key
JWT_EXPIRES_IN=7d

# MySQL 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=star_citizen_promotion
DB_CONNECTION_LIMIT=10

# Bcrypt
BCRYPT_SALT_ROUNDS=12

# 速率限制
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# WebSocket
WS_PORT=3003
```

### 站点内容定制

编辑 `src/config/site.config.js` 可快速定制站点信息：

```javascript
export const siteConfig = {
  siteInfo: {
    name: '星际公民团队站',
    description: '面向星际公民玩家的团队门户',
    discord: 'your-discord-invite',
    qqGroup: '123456789',
    github: 'https://github.com/your-org'
  },
  navigation: [
    { label: '首页', to: '/' },
    { label: '团队介绍', to: '/about' },
    // ...
  ],
  home: {
    hero: {
      title: '星际公民战队',
      subtitle: '官方招募站'
    }
  }
}
```

---

## 📡 API 接口文档

### 接口概览

| 方法 | 路径 | 说明 | 认证 |
|:-----|:-----|:-----|:-----|
| `POST` | `/api/auth/register` | 用户注册 | 否 |
| `POST` | `/api/auth/login` | 用户登录 | 否 |
| `GET` | `/api/auth/me` | 获取当前用户 | 是 |
| `GET` | `/api/stats` | 获取统计数据 | 否 |
| `GET` | `/api/pilots` | 飞行员列表 | 否 |
| `GET` | `/api/pilots/:id` | 飞行员详情 | 否 |
| `GET` | `/api/members` | 成员列表 | 否 |
| `GET` | `/api/members/:id` | 成员详情 | 否 |
| `GET` | `/api/projects` | 项目列表 | 否 |
| `GET` | `/api/projects/:id` | 项目详情 | 否 |
| `POST` | `/api/applications` | 提交申请 | 否 |
| `GET` | `/api/health` | 健康检查 | 否 |

### 请求/响应示例

**用户注册：**

```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "pilot_ace",
  "email": "ace@example.com",
  "password": "SecurePass123!"
}
```

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "pilot_ace",
      "email": "ace@example.com",
      "role": "member"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**提交申请：**

```bash
POST /api/applications
Content-Type: application/json

{
  "name": "新飞行员",
  "email": "new@example.com",
  "gameId": "ACE-001",
  "experience": "3年",
  "reason": "热爱星际探索"
}
```

### 统一响应格式

```json
// 成功响应
{
  "success": true,
  "data": { ... }
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "无效的认证令牌"
  }
}
```

---

## 🧪 测试体系

### 测试架构

```
测试金字塔
    ┌─────────┐
    │  E2E 测试 │  ← Playwright（用户场景模拟）
    ├─────────┤
    │ 集成测试  │  ← Jest + Supertest（API 接口测试）
    ├─────────┤
    │ 单元测试  │  ← Vitest / Jest（模块逻辑测试）
    └─────────┘
```

### 测试统计

| 测试类型 | 框架 | 用例数 | 覆盖范围 |
|:---------|:-----|:-------|:---------|
| 前端单元测试 | Vitest | 195 | 服务层、组合式函数、组件、路由 |
| 后端集成测试 | Jest + Supertest | 65 | API 接口、认证中间件、错误处理、仓储层 |
| E2E 测试 | Playwright | 10 | 首页、加入流程 |

### 核心模块覆盖率

| 模块 | 覆盖率 |
|:-----|:-------|
| AIService.js | **92%** |
| authService.js（后端） | **95%** |
| dataService.js | **95%** |
| ResourceMonitor.js | **94%** |
| PriorityQueue.js | **100%** |
| Admin Views | **100%** |

### 运行测试

```bash
# 前端测试
npm test                    # 运行所有前端单元测试
npm run test:coverage       # 生成覆盖率报告
npm run test:e2e            # 运行 E2E 测试

# 后端测试
cd server
npm test                    # 运行所有后端测试
npm test -- --coverage      # 生成覆盖率报告

# 代码检查
npm run lint                # ESLint 检查
npm run lint:fix            # ESLint 自动修复
```

---

## 🚢 部署方案

### 方案一：Docker Compose（推荐）

```bash
# 开发环境
docker-compose up -d

# 生产环境（含 Nginx）
docker-compose --profile production up -d
```

Docker 采用多阶段构建：
1. `frontend-builder` — 安装依赖并构建前端产物
2. `backend-builder` — 安装后端依赖
3. `production` — 合并前后端产物，暴露端口

### 方案二：手动部署

```bash
# 前端构建
npm run build               # 产物输出到 dist/

# 后端启动
cd server
NODE_ENV=production node src/index.js
```

### 方案三：Nginx 反向代理

项目内置 `nginx.conf`，配置了：
- 前端静态资源服务（`try_files` SPA 路由回退）
- `/api` 请求代理到后端服务
- Gzip 压缩
- 健康检查端点

---

## 🔧 可用脚本

### 前端

| 命令 | 说明 |
|:-----|:-----|
| `npm run dev` | 启动开发服务器（http://localhost:3000） |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | ESLint 代码检查 |
| `npm run lint:fix` | ESLint 自动修复 |
| `npm test` | 运行单元测试 |
| `npm run test:coverage` | 生成覆盖率报告 |
| `npm run test:e2e` | 运行 E2E 测试 |

### 后端

| 命令 | 说明 |
|:-----|:-----|
| `cd server && npm run dev` | 启动开发服务器（http://localhost:3001） |
| `cd server && npm start` | 启动生产服务器 |
| `cd server && npm test` | 运行测试 |
| `cd server && npm run db:init` | 初始化数据库表结构 |
| `cd server && npm run db:seed` | 填充种子数据 |

---

## ❓ 常见问题

### Q: 启动后端报数据库连接失败？

确保 MySQL 服务已启动，并检查 `server/.env.development` 中的数据库配置是否正确：

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=star_citizen_promotion
```

然后运行数据库初始化：

```bash
cd server && npm run db:init
```

### Q: 前端页面无法获取数据？

默认前端使用静态数据（`VITE_USE_API=false`）。如需从后端 API 获取数据，在 `.env.development` 中设置：

```bash
VITE_USE_API=true
VITE_BACKEND_URL=http://localhost:3001
```

并确保后端服务已启动。

### Q: 如何修改站点名称和内容？

编辑 `src/config/site.config.js`，可修改站点名称、导航菜单、首页内容等所有可配置项，无需修改组件代码。

### Q: 如何添加新的 API 接口？

遵循三层架构模式：

1. **Repository** — 在 `server/src/repositories/` 新建仓储文件，继承 `baseRepository`
2. **Service** — 在 `server/src/services/` 新建服务文件，注入 Repository
3. **Controller** — 在 `server/src/controllers/` 新建控制器，调用 Service
4. **Route** — 在 `server/src/routes/` 新建路由文件，绑定 Controller 方法
5. 在 `server/src/index.js` 中注册路由

### Q: 如何运行 E2E 测试？

```bash
# 安装 Playwright 浏览器（首次运行）
npx playwright install

# 运行 E2E 测试
npm run test:e2e
```

### Q: Docker 部署时如何配置环境变量？

修改 `docker-compose.yml` 中的 `environment` 字段，或创建 `.env` 文件通过 `${VAR}` 引用：

```yaml
backend:
  environment:
    - JWT_SECRET=${JWT_SECRET:-change-me-in-production}
    - DB_PASSWORD=${DB_PASSWORD}
```

---

## 📄 文档体系

| 文档 | 说明 |
|:-----|:-----|
| [PROJECT_BACKGROUND.md](docs/PROJECT_BACKGROUND.md) | 项目背景与目标 |
| [REQUIREMENTS.md](docs/REQUIREMENTS.md) | 需求规格说明 |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 系统架构设计 |
| [TECH_STACK.md](docs/TECH_STACK.md) | 技术选型依据 |
| [CONFIG.md](docs/CONFIG.md) | 配置参数说明 |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | 开发指南 |
| [DEVELOPMENT_PROCESS.md](docs/DEVELOPMENT_PROCESS.md) | 开发流程规范 |
| [QUALITY_STANDARDS.md](docs/QUALITY_STANDARDS.md) | 质量保证标准 |
| [API.md](docs/API.md) | API 接口文档 |
| [MAINTENANCE.md](docs/MAINTENANCE.md) | 运维手册 |
| [CHANGELOG.md](docs/CHANGELOG.md) | 变更日志 |
| [ROADMAP.md](docs/ROADMAP.md) | 产品路线图 |
| [RISK_MANAGEMENT.md](docs/RISK_MANAGEMENT.md) | 风险管理 |
| [GLOSSARY.md](docs/GLOSSARY.md) | 术语表 |
| [PROJECT_PLAN.md](docs/PROJECT_PLAN.md) | 项目计划 |

---

## 📜 许可证

本项目采用 [MIT License](LICENSE) 许可证。

---

<div align="center">

**Made with ❤️ for Star Citizen Community**

</div>
