# 🚀 星际公民战队宣传网站

<div align="center">

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=flat-square&logo=vue.js)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite)
![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?style=flat-square&logo=express)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**面向星际公民玩家的团队门户，展示组织定位、核心成员、活动任务与招募信息**

[在线预览](#) · [功能特点](#功能特点) · [快速开始](#快速开始) · [API文档](#api文档)

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
- [贡献指南](#贡献指南)
- [维护说明](#维护说明)
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

---

## 核心功能

### 前端功能

| 模块 | 功能描述 |
|------|----------|
| 🏠 首页展示 | Hero区域、团队统计、王牌飞行员轮播 |
| 👥 团队介绍 | 组织定位、发展历程时间线 |
| 🎖️ 核心成员 | 成员卡片列表、角色展示 |
| 📋 活动项目 | 活动任务卡片、进度展示 |
| 📝 加入我们 | 招募条件、在线申请表单 |
| 📞 联系我们 | 联系渠道、社交链接 |

### 后端功能

| 模块 | API端点 | 功能描述 |
|------|---------|----------|
| 🔐 认证 | `/api/auth/*` | 用户注册、登录、令牌刷新 |
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
├── public/                        # 静态资源
│   ├── images/                    # 图片资源
│   │   ├── F8C.png
│   │   └── f8c-lightning.svg
│   ├── favicon.ico
│   └── og-cover.svg
│
├── src/                           # 前端源码
│   ├── components/                # 组件
│   │   ├── common/                # 通用组件
│   │   │   ├── LoadingIndicator.vue
│   │   │   ├── PageTitle.vue
│   │   │   └── PageTransition.vue
│   │   └── layout/                # 布局组件
│   │       ├── SiteHeader.vue
│   │       └── SiteFooter.vue
│   ├── composables/               # 组合式API
│   │   ├── useAI.js
│   │   └── index.js
│   ├── config/                    # 配置文件
│   ├── data/                      # 静态数据
│   │   └── siteContent.js
│   ├── router/                    # 路由配置
│   │   └── index.js
│   ├── services/                  # 服务层
│   │   ├── AIService.js
│   │   ├── PriorityQueue.js
│   │   ├── ResourceMonitor.js
│   │   ├── dataService.js
│   │   ├── http.js
│   │   └── index.js
│   ├── styles/                    # 样式文件
│   │   └── base.css
│   ├── views/                     # 页面视图
│   │   ├── Home.vue
│   │   ├── About.vue
│   │   ├── Members.vue
│   │   ├── Projects.vue
│   │   ├── Join.vue
│   │   ├── Contact.vue
│   │   └── NotFound.vue
│   ├── App.vue
│   └── main.js
│
├── server/                        # 后端源码
│   ├── src/
│   │   ├── config/                # 配置
│   │   │   └── index.js
│   │   ├── database/              # 数据库
│   │   │   ├── init.js
│   │   │   ├── migrate.js
│   │   │   ├── pool.js
│   │   │   └── seed.js
│   │   ├── middleware/            # 中间件
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── requestLogger.js
│   │   ├── routes/                # 路由
│   │   │   ├── applications.js
│   │   │   ├── auth.js
│   │   │   ├── members.js
│   │   │   ├── pilots.js
│   │   │   ├── projects.js
│   │   │   └── stats.js
│   │   └── index.js
│   ├── tests/                     # 测试文件
│   │   ├── api.test.js
│   │   ├── auth.test.js
│   │   └── errorHandler.test.js
│   ├── .env.example
│   ├── .env.development
│   └── package.json
│
├── tests/                         # 前端测试
│   ├── components/
│   ├── composables/
│   └── services/
│
├── .env.example                   # 环境变量模板
├── .env.development               # 开发环境配置
├── .env.production                # 生产环境配置
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── package.json
├── vite.config.js
└── README.md
```

---

## 环境要求

### 必需环境

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | ≥20.0.0 | JavaScript运行环境 |
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

### 2. 安装前端依赖

```bash
npm install
```

### 3. 安装后端依赖

```bash
cd server
npm install
cd ..
```

### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.development
cp server/.env.example server/.env.development
```

编辑 `server/.env.development`，配置数据库连接：

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password    # 修改为你的MySQL密码
DB_NAME=star_citizen_promotion
```

### 5. 初始化数据库

```bash
cd server
npm run db:init
```

### 6. 启动服务

**方式一：分别启动（开发推荐）**

```bash
# 终端1 - 启动后端
cd server
npm run dev

# 终端2 - 启动前端
cd ..
npm run dev
```

**方式二：使用脚本一键启动**

```bash
# Windows PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"
npm run dev
```

### 7. 访问应用

- 前端：http://localhost:3000
- 后端API：http://localhost:3001
- 健康检查：http://localhost:3001/health

---

## 配置说明

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

# WebSocket
VITE_WS_URL=ws://localhost:3003

# 是否使用API
VITE_USE_API=true
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

# WebSocket配置
WS_PORT=3003
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

### 认证接口

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | ❌ |
| POST | `/api/auth/login` | 用户登录 | ❌ |
| POST | `/api/auth/refresh` | 刷新令牌 | ❌ |
| GET | `/api/auth/me` | 获取当前用户 | ✅ |

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
| `npm run test` | 运行测试 |
| `npm run test:watch` | 监听模式测试 |
| `npm run test:coverage` | 测试覆盖率报告 |

**后端脚本：**

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（热重载） |
| `npm start` | 启动生产服务器 |
| `npm run lint` | 运行ESLint检查 |
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

---

## 部署说明

### 构建生产版本

```bash
# 构建前端
npm run build

# 构建产物在 dist/ 目录
```

### Docker部署

**前端 Dockerfile：**

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**后端 Dockerfile：**

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "src/index.js"]
```

**docker-compose.yml：**

```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_USER=root
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=star_citizen_promotion
    depends_on:
      - db

  db:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_PASSWORD}
      - MYSQL_DATABASE=star_citizen_promotion
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

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
# 运行所有测试
npm run test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 后端测试

```bash
cd server

# 运行所有测试
npm run test
```

### 测试覆盖范围

| 模块 | 测试文件 | 覆盖内容 |
|------|----------|----------|
| 组件 | `tests/components/*.test.js` | 组件渲染、交互 |
| 服务 | `tests/services/*.test.js` | 业务逻辑 |
| API | `server/tests/api.test.js` | 接口测试 |
| 认证 | `server/tests/auth.test.js` | 认证流程 |

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

## 维护说明

### 常见问题

**Q: 数据库连接失败？**

A: 检查以下项目：
1. MySQL服务是否启动
2. `.env.development` 中的数据库配置是否正确
3. 数据库用户是否有足够权限

**Q: 前端无法访问后端API？**

A: 检查以下项目：
1. 后端服务是否启动（访问 http://localhost:3001/health）
2. Vite代理配置是否正确
3. CORS配置是否正确

**Q: JWT令牌无效？**

A: 检查以下项目：
1. `JWT_SECRET` 配置是否一致
2. 令牌是否过期
3. 请求头是否包含 `Authorization: Bearer <token>`

### 日志查看

后端日志输出到控制台，包含：
- 请求日志（Morgan）
- 错误日志
- 数据库连接状态

### 数据库维护

```bash
# 重新初始化数据库
cd server
npm run db:init

# 填充种子数据
npm run db:seed
```

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
