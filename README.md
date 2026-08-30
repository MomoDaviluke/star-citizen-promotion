<div align="center">

# 🚀 星际公民战队宣传网站

**企业级全栈项目 · 后端 656 测试用例全通过 · 完整 CI/CD 流水线 · AI 招募官 Agent（已实测上线链路）**

*面向星际公民玩家的专业团队门户*

[![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Knex.js](https://img.shields.io/badge/Knex.js-latest-E16426?style=flat-square&logo=knex)](https://knexjs.org/)
[![Vitest](https://img.shields.io/badge/Vitest-4.x-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev/)
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
| 🏗️ **分层架构** | Routes → Services → Database 严格分层，职责清晰 |
| 🧪 **全面测试** | 单元测试 + 集成测试 + E2E 测试（9 spec），后端 656 用例、前端 509 用例全通过，AI 模块覆盖率 88.94% |
| 🚀 **CI/CD** | GitHub Actions 自动化代码检查、测试、安全扫描、构建流水线 |
| 🔐 **安全加固** | JWT 认证、bcrypt 加密、Helmet 安全头、速率限制、CORS 策略、敏感数据脱敏 |
| 📝 **企业日志** | Winston 结构化日志，支持多级别输出与文件归档 |
| 📊 **可观测性** | Prometheus 指标监控、Sentry 错误追踪、Swagger API 文档 |
| 🤖 **AI 服务** | 通用槽位制 LLM 配置（聊天/嵌入自由指向任意 OpenAI 兼容端点）+ pgvector 语义检索（RAG）+ 对话式 AI 招募官（SSE 流式 + 画像预填），Redis 缓存与会话，全链路已实测验证 |
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
- **请求日志** — Morgan 访问日志 + Winston 结构化日志 + requestId 全链路追踪
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
| Vite | 8.x | 下一代前端构建工具 |
| Vitest | 4.x | 单元测试框架 |
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
│   ├── join.spec.js
│   ├── apply.spec.js
│   ├── auth.spec.js
│   └── navigation.spec.js
├── public/                     # 静态资源
├── server/                     # ===== 后端服务 =====
│   └── src/
│       ├── config/                 # 配置
│       │   ├── index.ts                # 统一配置加载
│       │   └── swagger.ts              # Swagger 文档配置
│       ├── routes/                 # 路由层（路由定义 + 中间件编排）
│       │   ├── admin.ts                # 管理员操作
│       │   ├── ai.ts                   # AI 服务（health / retrieve / 招募官会话）
│       │   ├── applications.ts         # 申请管理
│       │   ├── auth.ts                 # 用户认证
│       │   ├── events.ts               # 活动管理
│       │   ├── fleet.ts                # 舰队管理
│       │   ├── members.ts              # 成员管理
│       │   ├── pilots.ts               # 飞行员管理
│       │   ├── projects.ts             # 项目管理
│       │   ├── settings.ts             # 站点设置
│       │   └── stats.ts                # 统计数据
│       ├── services/               # 业务逻辑层
│       │   ├── authService.ts          # 认证服务（注册/登录/令牌）
│       │   ├── ai/                     # AI 服务（LLM Provider / RAG / 招募官 Agent）
│       │   ├── memberService.ts        # 成员服务
│       │   ├── pilotService.ts         # 飞行员服务
│       │   ├── projectService.ts       # 项目服务
│       │   ├── applicationService.ts   # 申请服务
│       │   ├── fleetService.ts         # 舰队服务
│       │   ├── eventService.ts         # 活动服务
│       │   ├── settingsService.ts      # 站点设置服务
│       │   └── statsService.ts         # 统计服务
│       ├── middleware/             # Express 中间件
│       │   ├── auth.ts                 # JWT 认证 (async/await)
│       │   ├── cache.ts                # HTTP 缓存 (TTL + ETag)
│       │   ├── auditLogger.ts          # 审计日志
│       │   ├── errorHandler.ts         # 统一错误处理
│       │   ├── metrics.ts              # Prometheus 指标
│       │   ├── pagination.ts           # 分页解析
│       │   ├── requestId.ts            # 请求关联 ID
│       │   ├── requestLogger.ts        # 请求日志 (Winston)
│       │   └── validator.ts            # 输入校验
│       ├── database/               # 数据库管理
│       │   ├── pool.ts                 # MySQL 连接池 + queryWithTiming
│       │   ├── init.ts                 # 表结构初始化
│       │   ├── migrate.ts              # Knex.js 迁移
│       │   └── seed.ts                 # 种子数据
│       ├── utils/                  # 工具模块
│       │   ├── jwt.ts                  # JWT 工具函数
│       │   └── logger.ts               # Winston 日志配置
│       ├── websocket.ts            # WebSocket 服务端
│       └── index.ts                # Express 入口
├── src/                        # ===== 前端应用 =====
│   ├── components/             # Vue 组件
│   │   ├── ai/                     # AI 全息终端组件（招募官）
│   │   │   ├── RecruiterTerminal.vue    # 全息终端容器（全屏/浮层切换）
│   │   │   ├── HoloAvatar.vue           # 全息头像
│   │   │   ├── ChatStream.vue           # 流式对话（滚动节流 + ARIA live）
│   │   │   ├── QuickSuggestions.vue     # 快捷推荐气泡
│   │   │   └── ProfilePanel.vue         # 实时画像面板
│   │   ├── common/                 # 通用组件
│   │   │   ├── ErrorBoundary.vue       # 错误边界
│   │   │   ├── LoadingIndicator.vue    # 加载指示器
│   │   │   ├── PageTitle.vue           # 页面标题
│   │   │   └── PageTransition.vue      # 页面过渡动画
│   │   └── layout/                 # 布局组件
│   │       ├── SiteHeader.vue          # 站点头部导航
│   │       └── SiteFooter.vue          # 站点底部
│   ├── composables/            # 组合式函数
│   │   ├── useAiRecruiter.js        # AI 招募官（SSE 流式 + 画像同步）
│   │   ├── useAI.js                # AI 任务管理 Hook
│   │   ├── useWebSocket.js          # WebSocket 封装
│   │   ├── useGSAPReveal.js         # 滚动动画
│   │   ├── useEffectQuality.js      # 特效分级
│   │   ├── usePwa.js                # PWA 生命周期
│   │   └── useTheme.js              # 主题切换
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
│   │   ├── wsService.js            # WebSocket 客户端
│   │   ├── http.js                 # HTTP 客户端封装
│   │   └── errorReporting.js       # Sentry 错误上报
│   ├── stores/                 # Pinia 状态管理
│   │   ├── auth.js                 # 认证状态
│   │   ├── calendar.js             # 日历状态
│   │   └── fleet.js                # 舰队状态
│   ├── styles/                 # 全局样式
│   │   ├── base.css                # 基础样式
│   │   ├── variables.css           # CSS 变量
│   │   ├── animations.css          # 动画定义
│   │   └── utilities.css           # 工具类
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
│       ├── Calendar.vue             # 活动日历
│       ├── Fleet.vue                # 舰队展示
│       ├── Offline.vue              # 离线页面 (PWA)
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
| PostgreSQL + pgvector | 15 | 16（AI RAG 知识库，可选） |
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
npm run dev                    # 前端 → http://localhost:5173
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

项目后端遵循 **Routes → Services → Database** 分层架构：

```
请求 → Route（路由定义、中间件编排）
         ↓
      Service（业务逻辑、数据访问、错误处理）
         ↓
      MySQL（连接池 + 参数化查询）
```

- **Route 层** — 负责 HTTP 路由定义、中间件组合（认证/校验/限流）、请求分发
- **Service 层** — 核心业务逻辑，直接调用数据库连接池执行 SQL，封装业务操作
- **Database 层** — MySQL2 连接池管理，提供 `query/queryOne/execute/transaction` 统一接口

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
| 请求体限制 | JSON 100kb / URL-encoded 100kb |
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

后端通过 `errorHandler` 中间件统一捕获并格式化错误响应，支持 HTTP 状态码和结构化错误信息：

```json
{
  "success": false,
  "message": "无效的认证令牌"
}
```

同时处理 `JsonWebTokenError`、`TokenExpiredError`、`ER_DUP_ENTRY` 等第三方错误。

### 5. 数据库连接池

```typescript
// 连接池配置（server/src/database/pool.ts）
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  connectionLimit: config.database.connectionLimit,
  waitForConnections: true,
  timezone: '+08:00',
  charset: 'utf8mb4'
})

// 统一查询接口
export async function query(sql, params)      // 返回行数组
export async function queryOne(sql, params)   // 返回单行或 null
export async function queryWithTiming(sql, params) // 带慢查询监控（500ms 阈值）
export async function transaction(callback)   // 事务支持
export function getPoolStatus()               // 连接池状态
export function closePool()                   // 优雅关闭
```

### 6. 前端 HTTP 客户端

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
VITE_WS_URL=ws://localhost:3001/ws

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
WS_PORT=3001

# AI 槽位制配置（AI-SLOT，可选）——OpenAI 兼容端点自由指向
# 聊天槽位：DeepSeek / 豆包 / vLLM / 任意兼容网关
LLM_CHAT_API_KEY=
LLM_CHAT_BASE_URL=https://api.deepseek.com/v1
LLM_CHAT_MODEL=deepseek-chat
# 嵌入槽位：本地 Ollama（bge-m3，1024 维）/ 其他 embeddings 服务
LLM_EMBED_API_KEY=ollama
LLM_EMBED_BASE_URL=http://localhost:11434/v1
LLM_EMBEDDING_MODEL=bge-m3
# pgvector 连接（AI 知识库，可选）
PGVECTOR_URL=postgres://app_user:app_password@localhost:5432/star_citizen_ai
```

#### AI 能力启用（可选）

AI 功能采用**槽位制**设计——不配置任何 key 时服务正常启动，AI 端点自动降级为"服务不可用"（非 bug）；配置后即可获得完整 RAG + 流式招募官能力：

```bash
# 1. 启动 pgvector（AI 向量知识库）
docker run -d --name sc-pgvector-dev -e POSTGRES_USER=app_user \
  -e POSTGRES_PASSWORD=app_password -e POSTGRES_DB=star_citizen_ai \
  -p 127.0.0.1:5432:5432 pgvector/pgvector:pg16

# 2. 启动本地嵌入模型（Ollama bge-m3，1024 维，零 API 成本）
ollama pull bge-m3

# 3. 建表 + 知识入库（幂等，可重复执行）
cd server && npm run ai:migrate && npm run ai:ingest

# 4. 验证
curl http://localhost:3001/api/v1/ai/health
curl -X POST http://localhost:3001/api/v1/ai/retrieve \
  -H "Content-Type: application/json" -d '{"question":"推荐一艘适合新手的战斗机"}'
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

> **接口基路径**: `/api/v1`（推荐，主版本 v1）+ `/api`（兼容前缀，标记弃用，建议迁移）。代码中 `API_VERSION` 常量控制（`server/src/index.ts`）。未来 v2 发布时通过添加 `/api/v2/` 逐步迁移。

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

| 测试类型 | 框架 | 文件数 | 覆盖范围 |
|:---------|:-----|:-------|:---------|
| 前端单元测试 | Vitest | 37（分布在 components/composables/router/services/stores/views/utils） | 服务层、组合式函数、组件、路由、视图、工具 |
| 后端集成测试 | Jest + Supertest | 26+ 文件（469 用例） | API 接口、认证中间件、错误处理、仓储层、缓存、AI（Providers/RAG/招募官） |
| E2E 测试 | Playwright | 5 spec | 首页、加入流程、认证流程、申请流程、导航 |

### 核心模块覆盖率（AI 模块 88.94%，以下为高覆盖模块）

| 模块 | 覆盖率 |
|:-----|:-------|
| `routes/admin.ts` | **98%** |
| `routes/auth.ts` | **97%** |
| `services/*` | **93~100%** |
| `middleware/cache.ts` | **100%** |
| `database/pool.ts` | **88%** |
| `services/ai/*`（Providers/RAG/招募官） | **88.94%** |

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

遵循分层架构模式：

1. **Service** — 在 `server/src/services/` 新建服务文件，封装业务逻辑和数据库操作
2. **Route** — 在 `server/src/routes/` 新建路由文件，组合中间件（认证/校验/限流）并调用 Service
3. 在 `server/src/index.ts` 中注册路由

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
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 系统架构设计 |
| [TECH_STACK.md](docs/guides/TECH_STACK.md) | 技术选型依据 |
| [CONFIG.md](docs/guides/CONFIG.md) | 配置参数说明 |
| [DEVELOPMENT.md](docs/guides/DEVELOPMENT.md) | 开发指南 |
| [API.md](docs/guides/API.md) | API 接口文档 |
| [DEPLOYMENT.md](docs/guides/DEPLOYMENT.md) | 部署指南 |
| [SECURITY.md](docs/guides/SECURITY.md) | 安全体系 |
| [MONITORING.md](docs/guides/MONITORING.md) | 监控与可观测性 |
| [CONTRIBUTING.md](docs/guides/CONTRIBUTING.md) | 贡献指南 |
| [ROADMAP.md](docs/ROADMAP.md) | 优化路线图 |
| [TESTING.md](docs/TESTING.md) | 测试指南 |
| [TODO.md](docs/TODO.md) | 待办任务与质量门禁 |
| [ENTERPRISE_IMPROVEMENTS.md](docs/reports/ENTERPRISE_IMPROVEMENTS.md) | 企业级改进报告 |
| [CHANGELOG.md](CHANGELOG.md) | 版本变更记录 |

---

## 📜 许可证

本项目采用 [MIT License](LICENSE) 许可证。

---

<div align="center">

**Made with ❤️ for Star Citizen Community**

</div>
