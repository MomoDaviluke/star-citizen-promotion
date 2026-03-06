# 🚀 星际公民战队宣传网站

<div align="center">

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=flat-square&logo=vue.js)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite)
![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?style=flat-square&logo=express)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**面向星际公民玩家的团队门户，展示组织定位、核心成员、活动任务与招募信息**

[在线预览](#) · [功能特点](#功能特点) · [快速开始](#快速开始) · [API文档](docs/API.md)

</div>

---

## 📖 目录

- [项目概述](#项目概述)
- [核心功能](#核心功能)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [API文档](#api文档)
- [开发指南](#开发指南)
- [部署说明](#部署说明)
- [测试说明](#测试说明)
- [常见问题](#常见问题)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

---

## 项目概述

本项目是一个基于 **Vue 3 + Vite + Express.js** 构建的全栈星际公民战队宣传网站。采用科幻风格的UI设计，具有流畅的页面过渡动画、完善的AI服务架构和RESTful API后端，为战队提供专业的展示平台。

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Vue 3)                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  首页   │  │  团队   │  │  成员   │  │  申请   │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
│       └────────────┴────────────┴────────────┘              │
│                         │                                    │
│                    HTTP/WebSocket                            │
│                         │                                    │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                         ▼                                    │
│                   后端 API (Express.js)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Auth   │  │Members  │  │Projects │  │  Apply  │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       └────────────┴────────────┴────────────┘              │
│                         │                                    │
│                    MySQL Pool                                │
│                         │                                    │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                         ▼                                    │
│                    MySQL 数据库                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  users  │  │ members │  │ projects│  │  apps   │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 核心特性

| 特性 | 描述 |
|------|------|
| 🎨 科幻UI设计 | 网格背景、光晕效果、扫描线动画 |
| ⚡ 路由预加载 | 智能预加载相邻路由，提升导航体验 |
| 🔄 AI服务架构 | 任务队列、优先级调度、并发控制、超时重试 |
| 🔐 完整认证 | JWT认证、令牌刷新、角色权限控制 |
| 📱 响应式设计 | 移动端适配，支持减少动画偏好 |
| 🧪 全面测试 | 单元测试、集成测试、E2E测试 |

---

## 核心功能

### 前端功能

| 模块 | 路由 | 功能描述 |
|------|------|----------|
| 🏠 首页展示 | `/` | Hero区域、团队统计、王牌飞行员轮播 |
| 👥 团队介绍 | `/about` | 组织定位、发展历程时间线 |
| 🎖️ 核心成员 | `/members` | 成员卡片列表、角色展示 |
| 📋 活动项目 | `/projects` | 活动任务卡片、进度展示 |
| 📝 加入我们 | `/join` | 招募条件、在线申请表单 |
| 📞 联系我们 | `/contact` | 联系渠道、社交链接 |
| 🔑 用户登录 | `/login` | 邮箱密码登录 |
| 📋 注册 | `/register` | 用户注册 |
| 👤 个人中心 | `/profile` | 个人资料管理（需认证） |
| 📊 申请状态 | `/application/status` | 查询申请进度 |
| ⚙️ 管理后台 | `/admin/*` | 仪表盘、申请管理、成员管理等 |

### 后端功能

| 模块 | API端点 | 功能描述 |
|------|---------|----------|
| 🔐 认证 | `/api/auth/*` | 用户注册、登录、资料管理、密码修改 |
| 👥 成员 | `/api/members/*` | 成员CRUD操作 |
| 📋 项目 | `/api/projects/*` | 项目CRUD操作 |
| ✈️ 飞行员 | `/api/pilots/*` | 飞行员CRUD操作 |
| 📝 申请 | `/api/applications/*` | 入队申请管理 |
| 📊 统计 | `/api/stats` | 团队统计数据 |

---

## 技术栈

### 前端技术

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Vue.js | 3.5 | 渐进式JavaScript框架 |
| 路由 | Vue Router | 5.0 | 官方路由管理器 |
| 构建工具 | Vite | 7.3 | 下一代前端构建工具 |
| 测试 | Vitest | 3.0 | 单元测试框架 |
| E2E测试 | Playwright | 1.58 | 端到端测试框架 |
| 代码规范 | ESLint | 9.x | 代码质量检查 |
| 代码格式 | Prettier | 3.x | 代码格式化工具 |

### 后端技术

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 运行时 | Node.js | ≥20.0 | JavaScript运行环境 |
| 框架 | Express.js | 4.21 | Web应用框架 |
| 数据库 | MySQL | 8.0 | 关系型数据库 |
| 驱动 | mysql2 | 3.12 | MySQL连接池 |
| 认证 | JWT | 9.0 | JSON Web Token |
| 加密 | bcryptjs | 2.4 | 密码哈希 |
| 安全 | Helmet | 8.0 | 安全HTTP头 |
| 测试 | Jest | 29.7 | 测试框架 |

---

## 项目结构

```
star-citizen-promotion/
├── .github/workflows/           # CI/CD 配置
│   └── ci.yml
├── .trae/rules/                 # 项目规范
│   └── commit_convention.md
├── docs/                        # 文档目录
│   ├── API.md                   # API参考文档
│   ├── CONFIG.md                # 配置说明文档
│   └── DEVELOPMENT.md           # 开发指南
├── e2e/                         # E2E 测试
│   ├── home.spec.js
│   └── join.spec.js
├── public/                      # 静态资源
│   ├── images/
│   ├── favicon.ico
│   └── og-cover.svg
├── server/                      # 后端源码
│   ├── src/
│   │   ├── config/              # 配置
│   │   ├── database/            # 数据库
│   │   │   ├── init.js          # 数据库初始化
│   │   │   ├── migrate.js       # 数据库迁移
│   │   │   ├── pool.js          # 连接池管理
│   │   │   └── seed.js          # 种子数据
│   │   ├── middleware/          # 中间件
│   │   │   ├── auth.js          # JWT认证
│   │   │   ├── errorHandler.js  # 错误处理
│   │   │   └── requestLogger.js # 请求日志
│   │   ├── routes/              # API路由
│   │   │   ├── applications.js
│   │   │   ├── auth.js
│   │   │   ├── members.js
│   │   │   ├── pilots.js
│   │   │   ├── projects.js
│   │   │   └── stats.js
│   │   └── index.js             # 服务入口
│   ├── tests/                   # 后端测试
│   ├── .env.example
│   └── package.json
├── src/                         # 前端源码
│   ├── components/              # 组件
│   │   ├── common/              # 通用组件
│   │   │   ├── ErrorBoundary.vue
│   │   │   ├── LoadingIndicator.vue
│   │   │   ├── PageTitle.vue
│   │   │   └── PageTransition.vue
│   │   └── layout/              # 布局组件
│   │       ├── SiteHeader.vue
│   │       └── SiteFooter.vue
│   ├── composables/             # 组合式函数
│   │   ├── useAI.js
│   │   └── index.js
│   ├── config/                  # 配置
│   │   ├── site.config.js       # 站点配置
│   │   └── index.js
│   ├── data/                    # 静态数据
│   │   └── siteContent.js
│   ├── router/                  # 路由配置
│   │   └── index.js
│   ├── services/                # 服务层
│   │   ├── AIService.js         # AI服务核心
│   │   ├── PriorityQueue.js     # 优先级队列
│   │   ├── ResourceMonitor.js   # 资源监控
│   │   ├── authService.js       # 认证服务
│   │   ├── dataService.js       # 数据服务
│   │   ├── http.js              # HTTP客户端
│   │   └── index.js
│   ├── styles/                  # 样式
│   │   └── base.css
│   ├── views/                   # 页面视图
│   │   ├── admin/               # 管理后台
│   │   │   ├── AdminLayout.vue
│   │   │   ├── ApplicationsAdmin.vue
│   │   │   ├── Dashboard.vue
│   │   │   ├── MembersAdmin.vue
│   │   │   ├── PilotsAdmin.vue
│   │   │   ├── ProjectsAdmin.vue
│   │   │   └── Settings.vue
│   │   ├── About.vue
│   │   ├── ApplicationStatus.vue
│   │   ├── Contact.vue
│   │   ├── Home.vue
│   │   ├── Join.vue
│   │   ├── Login.vue
│   │   ├── Members.vue
│   │   ├── NotFound.vue
│   │   ├── Profile.vue
│   │   ├── Projects.vue
│   │   └── Register.vue
│   ├── App.vue
│   └── main.js
├── tests/                       # 前端测试
│   ├── components/
│   ├── composables/
│   ├── config/
│   ├── router/
│   ├── services/
│   └── views/
├── .editorconfig
├── .env.example
├── .gitignore
├── .prettierrc
├── Dockerfile
├── docker-compose.yml
├── eslint.config.js
├── index.html
├── jsconfig.json
├── nginx.conf
├── package.json
├── playwright.config.js
├── vite.config.js
└── vitest.config.js
```

---

## 环境要求

### 必需环境

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | ^20.19.0 或 >=22.12.0 | JavaScript运行环境 |
| npm | ≥9.0.0 | 包管理器 |
| MySQL | ≥8.0 | 数据库服务 |

### 推荐工具

- **VS Code** - 代码编辑器
- **MySQL Workbench** - 数据库管理
- **Postman** - API测试

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/MomoDaviluke/star-citizen-promotion.git
cd star-citizen-promotion
```

### 2. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install && cd ..
```

### 3. 配置环境变量

```bash
# 复制前端环境变量模板
cp .env.example .env.development

# 复制后端环境变量模板
cp server/.env.example server/.env.development
```

编辑 `server/.env.development`，配置数据库连接：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password    # 修改为你的MySQL密码
DB_NAME=star_citizen_promotion

# JWT配置
JWT_SECRET=your-secure-jwt-secret-key
JWT_EXPIRES_IN=7d
```

### 4. 初始化数据库

```bash
cd server
npm run db:init
```

### 5. 启动服务

**方式一：分别启动（推荐开发使用）**

```bash
# 终端1 - 启动后端
cd server && npm run dev

# 终端2 - 启动前端
npm run dev
```

**方式二：后台启动后端**

```bash
# Windows PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"
npm run dev
```

### 6. 访问应用

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:3000 | Vue开发服务器 |
| 后端API | http://localhost:3001 | Express RESTful API |
| 健康检查 | http://localhost:3001/health | 服务状态检查 |

---

## 配置说明

详细配置说明请参阅 [配置文档](docs/CONFIG.md)。

### 前端环境变量

创建 `.env.development` 文件：

```bash
# 应用配置
VITE_APP_ENV=development
VITE_SERVER_PORT=3000

# 后端API
VITE_BACKEND_URL=http://localhost:3001

# AI服务
VITE_AI_SERVICE_URL=http://localhost:3002
VITE_AI_TIMEOUT=30000
VITE_AI_MAX_RETRIES=3
VITE_AI_MAX_CONCURRENT=3

# WebSocket
VITE_WS_URL=ws://localhost:3003
```

### 后端环境变量

创建 `server/.env.development` 文件：

```bash
# 服务配置
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# JWT配置
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# MySQL配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=star_citizen_promotion
DB_CONNECTION_LIMIT=10

# Bcrypt配置
BCRYPT_SALT_ROUNDS=12

# 速率限制
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端开发服务器 | 3000 | Vite开发服务器 |
| 后端API服务 | 3001 | Express RESTful API |
| AI服务 | 3002 | AI模型推理服务 |
| WebSocket服务 | 3003 | 实时通信服务 |
| MySQL | 3306 | 数据库服务 |

---

## API文档

详细API文档请参阅 [API参考文档](docs/API.md)。

### 认证接口

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | ❌ |
| POST | `/api/auth/login` | 用户登录 | ❌ |
| GET | `/api/auth/me` | 获取当前用户 | ✅ |
| PUT | `/api/auth/profile` | 更新资料 | ✅ |
| PUT | `/api/auth/password` | 修改密码 | ✅ |

### 申请接口

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/applications` | 获取申请列表 | Admin |
| GET | `/api/applications/:id` | 获取申请详情 | Optional |
| POST | `/api/applications` | 提交申请 | ❌ |
| PUT | `/api/applications/:id/status` | 更新申请状态 | Admin |
| DELETE | `/api/applications/:id` | 删除申请 | Admin |

### 成员接口

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/members` | 获取成员列表 | ❌ |
| GET | `/api/members/:id` | 获取成员详情 | ❌ |
| POST | `/api/members` | 创建成员 | Admin |
| PUT | `/api/members/:id` | 更新成员 | Admin |
| DELETE | `/api/members/:id` | 删除成员 | Admin |

### 项目接口

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/projects` | 获取项目列表 | ❌ |
| GET | `/api/projects/:id` | 获取项目详情 | ❌ |
| POST | `/api/projects` | 创建项目 | Admin |
| PUT | `/api/projects/:id` | 更新项目 | Admin |
| DELETE | `/api/projects/:id` | 删除项目 | Admin |

### 飞行员接口

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/pilots` | 获取飞行员列表 | ❌ |
| GET | `/api/pilots/:id` | 获取飞行员详情 | ❌ |
| POST | `/api/pilots` | 创建飞行员 | Admin |
| PUT | `/api/pilots/:id` | 更新飞行员 | Admin |
| DELETE | `/api/pilots/:id` | 删除飞行员 | Admin |

### 统计接口

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/stats` | 获取统计数据 | ❌ |

---

## 开发指南

### 可用脚本

**前端脚本：**

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | 运行ESLint检查 |
| `npm run lint:fix` | 自动修复ESLint问题 |
| `npm run format` | 格式化代码 |
| `npm run test` | 运行单元测试 |
| `npm run test:watch` | 监听模式测试 |
| `npm run test:coverage` | 测试覆盖率报告 |
| `npm run test:e2e` | 运行E2E测试 |
| `npm run test:e2e:ui` | E2E测试UI模式 |
| `npm run test:all` | 运行所有测试 |

**后端脚本：**

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（热重载） |
| `npm start` | 启动生产服务器 |
| `npm run test` | 运行测试 |
| `npm run db:init` | 初始化数据库 |
| `npm run db:seed` | 填充种子数据 |

### 代码规范

项目遵循以下代码规范：

- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **EditorConfig** - 编辑器配置统一

### 提交规范

项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型说明：**

| 类型 | 描述 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加用户登录功能` |
| `fix` | 修复bug | `fix(router): 修复页面跳转问题` |
| `docs` | 文档更新 | `docs: 更新README部署说明` |
| `style` | 代码格式 | `style: 格式化代码缩进` |
| `refactor` | 代码重构 | `refactor(services): 重构AI服务` |
| `perf` | 性能优化 | `perf: 优化首屏加载速度` |
| `test` | 测试相关 | `test: 添加登录单元测试` |
| `chore` | 其他杂项 | `chore: 更新依赖版本` |

**范围标识：**

| 范围 | 说明 |
|------|------|
| `router` | 路由相关 |
| `components` | 组件相关 |
| `services` | 服务层 |
| `styles` | 样式相关 |
| `config` | 配置文件 |
| `api` | API接口 |
| `ai` | AI服务相关 |

---

## 部署说明

### 构建生产版本

```bash
# 构建前端
npm run build

# 构建产物在 dist/ 目录
```

### Docker部署

项目提供完整的Docker支持：

```bash
# 使用Docker Compose启动
docker-compose up -d
```

**docker-compose.yml 服务说明：**

| 服务 | 镜像 | 端口 | 说明 |
|------|------|------|------|
| frontend | nginx:alpine | 80 | 前端静态服务 |
| backend | node:22-alpine | 3001 | 后端API服务 |
| db | mysql:8.0 | 3306 | MySQL数据库 |

### 静态托管部署

前端可部署到任何静态文件托管服务：

- **Vercel** - 推荐，零配置部署
- **Netlify** - 支持自动部署
- **GitHub Pages** - 免费托管
- **Cloudflare Pages** - 全球CDN加速

---

## 测试说明

### 前端测试

```bash
# 运行单元测试
npm run test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 运行E2E测试
npm run test:e2e

# E2E测试UI模式
npm run test:e2e:ui

# 运行所有测试
npm run test:all
```

### 后端测试

```bash
cd server
npm run test
```

### 测试覆盖范围

| 模块 | 测试文件 | 覆盖内容 |
|------|----------|----------|
| 组件 | `tests/components/*.test.js` | 组件渲染、交互 |
| 服务 | `tests/services/*.test.js` | 业务逻辑 |
| 组合式函数 | `tests/composables/*.test.js` | useAI等 |
| 路由 | `tests/router/*.test.js` | 路由配置 |
| 配置 | `tests/config/*.test.js` | 站点配置 |
| E2E | `e2e/*.spec.js` | 端到端测试 |
| API | `server/tests/api.test.js` | 接口测试 |
| 认证 | `server/tests/auth.test.js` | 认证流程 |

---

## 常见问题

### Q: 数据库连接失败？

A: 检查以下项目：
1. MySQL服务是否启动
2. `.env.development` 中的数据库配置是否正确
3. 数据库用户是否有足够权限
4. 数据库是否已创建

```bash
# 测试数据库连接
cd server
node -e "require('./src/database/pool.js').testConnection()"
```

### Q: 前端无法访问后端API？

A: 检查以下项目：
1. 后端服务是否启动（访问 http://localhost:3001/health）
2. Vite代理配置是否正确
3. CORS配置是否正确

### Q: JWT令牌无效？

A: 检查以下项目：
1. `JWT_SECRET` 配置是否一致
2. 令牌是否过期
3. 请求头是否包含 `Authorization: Bearer <token>`

### Q: E2E测试失败？

A: 检查以下项目：
1. 是否已运行 `npm run build` 构建前端
2. Playwright浏览器是否已安装 (`npx playwright install`)
3. 端口4173是否被占用

### Q: 安装依赖失败？

A: 尝试以下解决方案：
1. 清除npm缓存：`npm cache clean --force`
2. 删除node_modules后重新安装
3. 使用国内镜像：`npm config set registry https://registry.npmmirror.com`

---

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

### 贡献流程

1. **Fork** 本仓库
2. **克隆** 你 Fork 的仓库到本地
3. **创建** 特性分支 (`git checkout -b feature/amazing-feature`)
4. **开发** 并确保通过所有测试
5. **提交** 更改 (`git commit -m 'feat: add amazing feature'`)
6. **推送** 到分支 (`git push origin feature/amazing-feature`)
7. **创建** Pull Request

### 代码审查标准

- [ ] 代码通过ESLint检查
- [ ] 代码格式符合Prettier规范
- [ ] 所有测试通过
- [ ] 提交信息符合规范
- [ ] 更新相关文档

---

## 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

---

## 致谢

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Express.js](https://expressjs.com/) - Web应用框架
- [MySQL](https://www.mysql.com/) - 关系型数据库
- [Star Citizen](https://robertsspaceindustries.com/) - 星际公民游戏

---

<div align="center">

**Made with ❤️ for Star Citizen Players**

[⬆ 返回顶部](#-星际公民战队宣传网站)

</div>
