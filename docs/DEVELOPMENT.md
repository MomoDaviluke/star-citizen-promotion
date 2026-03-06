# 星际公民战队宣传网站 - 开发文档

## 目录

1. [项目概述](#项目概述)
2. [系统架构](#系统架构)
3. [模块功能介绍](#模块功能介绍)
4. [API 接口文档](#api-接口文档)
5. [部署指南](#部署指南)
6. [配置说明](#配置说明)
7. [开发指南](#开发指南)
8. [模板定制](#模板定制)

---

## 项目概述

本项目是一个基于 **Vue 3 + Vite + Express.js** 构建的全栈星际公民战队宣传网站。采用科幻风格的UI设计，具有流畅的页面过渡动画、完善的AI服务架构和RESTful API后端，为战队提供专业的展示平台。

### 核心特性

- 🚀 **现代化技术栈** - Vue 3.5 + Vite 7.3 + Express.js 4.21
- 🎨 **科幻风格设计** - 独特的星际公民主题UI
- 📱 **响应式布局** - 完美适配桌面端和移动端
- 🔐 **完善的认证系统** - JWT + bcrypt 安全认证
- 🤖 **AI 服务架构** - 任务队列、并发控制、资源监控
- 📊 **管理后台** - 完整的后台管理系统
- ⚡ **性能优化** - 路由懒加载、组件预加载、代码分割

---

## 系统架构

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

### 目录结构

```
star-citizen-promotion/
├── public/                        # 静态资源
├── src/                           # 前端源码
│   ├── components/                # 组件
│   │   ├── common/                # 通用组件
│   │   └── layout/                # 布局组件
│   ├── composables/               # 组合式API
│   ├── config/                    # 配置文件
│   │   ├── index.js               # 应用配置
│   │   └── site.config.js         # 站点配置（模板化）
│   ├── data/                      # 静态数据
│   ├── router/                    # 路由配置
│   ├── services/                  # 服务层
│   │   ├── AIService.js           # AI 服务
│   │   ├── authService.js         # 认证服务
│   │   ├── dataService.js         # 数据服务
│   │   └── http.js                # HTTP 客户端
│   ├── styles/                    # 样式文件
│   └── views/                     # 页面视图
│       ├── admin/                 # 管理后台页面
│       ├── Home.vue               # 首页
│       ├── About.vue              # 团队介绍
│       ├── Members.vue            # 核心成员
│       ├── Projects.vue           # 活动项目
│       ├── Join.vue               # 加入我们
│       ├── Contact.vue            # 联系我们
│       ├── Login.vue              # 登录
│       ├── Profile.vue            # 个人中心
│       └── ApplicationStatus.vue  # 申请状态
├── server/                        # 后端源码
│   ├── src/
│   │   ├── config/                # 配置
│   │   ├── database/              # 数据库
│   │   ├── middleware/            # 中间件
│   │   └── routes/                # 路由
│   └── tests/                     # 测试文件
└── tests/                         # 前端测试
```

---

## 模块功能介绍

### 前端模块

| 模块 | 文件 | 功能描述 |
|------|------|----------|
| 首页展示 | [Home.vue](src/views/Home.vue) | 英雄区域、团队统计、王牌飞行员轮播 |
| 团队介绍 | [About.vue](src/views/About.vue) | 组织定位、发展历程时间线 |
| 核心成员 | [Members.vue](src/views/Members.vue) | 成员卡片列表、角色展示 |
| 活动项目 | [Projects.vue](src/views/Projects.vue) | 活动任务卡片、进度展示 |
| 加入我们 | [Join.vue](src/views/Join.vue) | 招募条件、在线申请表单 |
| 联系我们 | [Contact.vue](src/views/Contact.vue) | 联系渠道、社交链接 |
| 管理后台 | [views/admin/](src/views/admin/) | 仪表盘、申请管理、成员管理等 |
| AI 服务 | [AIService.js](src/services/AIService.js) | 任务队列、并发控制、资源监控 |

### 后端模块

| 模块 | 文件 | 功能描述 |
|------|------|----------|
| 认证路由 | [auth.js](server/src/routes/auth.js) | 用户注册、登录、令牌管理 |
| 成员路由 | [members.js](server/src/routes/members.js) | 成员 CRUD 操作 |
| 项目路由 | [projects.js](server/src/routes/projects.js) | 项目 CRUD 操作 |
| 申请路由 | [applications.js](server/src/routes/applications.js) | 入队申请管理 |
| 飞行员路由 | [pilots.js](server/src/routes/pilots.js) | 飞行员 CRUD 操作 |
| 统计路由 | [stats.js](server/src/routes/stats.js) | 团队统计数据 |

---

## API 接口文档

### 基础信息

- **基础URL**: `http://localhost:3001/api`
- **认证方式**: Bearer Token (JWT)
- **内容类型**: `application/json`

### 认证接口

#### 用户注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string (3-20字符)",
  "email": "string (有效邮箱)",
  "password": "string (至少8位，包含大小写字母和数字)"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "uuid",
      "username": "用户名",
      "email": "邮箱",
      "role": "member"
    },
    "token": "jwt_token"
  }
}
```

#### 用户登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

#### 获取当前用户

```http
GET /api/auth/me
Authorization: Bearer <token>
```

### 成员接口

#### 获取成员列表

```http
GET /api/members?status=active&limit=50&offset=0
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "成员名称",
      "role": "角色",
      "intro": "简介",
      "status": "active"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### 创建成员（管理员）

```http
POST /api/members
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "string",
  "role": "string",
  "intro": "string (可选)",
  "avatar": "string (可选)"
}
```

### 申请接口

#### 提交申请

```http
POST /api/applications
Content-Type: application/json

{
  "name": "string (必填)",
  "email": "string (必填)",
  "discord": "string (可选)",
  "experience": "string (可选)",
  "availability": "string (可选)",
  "reason": "string (可选)"
}
```

#### 更新申请状态（管理员）

```http
PUT /api/applications/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "pending | approved | rejected",
  "note": "string (可选)"
}
```

### 统计接口

#### 获取统计数据

```http
GET /api/stats
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "stats": [
      { "label": "团队成员", "value": "20+" }
    ],
    "summary": {
      "activeMembers": 20,
      "activeProjects": 5,
      "activePilots": 10,
      "totalMissions": 500
    }
  }
}
```

---

## 部署指南

### 环境要求

| 软件 | 版本要求 |
|------|----------|
| Node.js | ≥20.0.0 |
| npm | ≥9.0.0 |
| MySQL | ≥8.0 |
| Docker | ≥20.0 (可选) |

### 快速部署

#### 1. 克隆项目

```bash
git clone https://github.com/your-org/star-citizen-promotion.git
cd star-citizen-promotion
```

#### 2. 安装依赖

```bash
# 前端依赖
npm install

# 后端依赖
cd server && npm install && cd ..
```

#### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.development
cp server/.env.example server/.env.development
```

编辑 `server/.env.development`：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=star_citizen_promotion

# JWT 配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# 服务配置
PORT=3001
FRONTEND_URL=http://localhost:3000
```

#### 4. 初始化数据库

```bash
cd server
npm run db:init
npm run db:seed  # 可选：填充测试数据
```

#### 5. 启动服务

```bash
# 终端1 - 启动后端
cd server && npm run dev

# 终端2 - 启动前端
npm run dev
```

### Docker 部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 配置说明

### 站点配置文件

通过修改 `src/config/site.config.js` 可以快速定制站点内容：

```javascript
export const siteConfig = {
  // 站点基本信息
  siteInfo: {
    name: '您的团队名称',
    nameEn: 'Your Team Name',
    description: '团队描述',
    version: '1.0.0',
    author: '您的名称',
    email: 'contact@example.com',
    discord: 'https://discord.gg/xxx',
    qqGroup: '123456789',
    github: 'https://github.com/your-org',
    year: new Date().getFullYear()
  },

  // 导航菜单
  navigation: [
    { label: '首页', to: '/', icon: 'home' },
    { label: '团队介绍', to: '/about', icon: 'team' },
    // ... 添加更多菜单项
  ],

  // 首页配置
  home: {
    hero: {
      badge: 'YOUR BADGE TEXT',
      title: '您的标题',
      subtitle: '副标题',
      description: '详细描述'
    },
    stats: [
      { label: '团队成员', value: '20+', icon: 'users' },
      // ... 添加更多统计项
    ]
  },

  // 主题配置
  theme: {
    colors: {
      primary: '#5fa9ff',
      secondary: '#8fd7ff',
      // ... 自定义颜色
    }
  }
}
```

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_SERVER_PORT` | 前端开发服务器端口 | 3000 |
| `VITE_BACKEND_URL` | 后端 API 地址 | http://localhost:3001 |
| `VITE_USE_API` | 是否使用 API | false |
| `PORT` | 后端服务端口 | 3001 |
| `DB_HOST` | 数据库主机 | localhost |
| `DB_PASSWORD` | 数据库密码 | - |
| `JWT_SECRET` | JWT 密钥 | - |

---

## 开发指南

### 可用脚本

**前端**:
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
npm run lint         # 运行 ESLint 检查
npm run test         # 运行测试
```

**后端**:
```bash
npm run dev          # 启动开发服务器（热重载）
npm start            # 启动生产服务器
npm run db:init      # 初始化数据库
npm run db:seed      # 填充种子数据
npm run test         # 运行测试
```

### 代码规范

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 Conventional Commits 提交规范

### 添加新页面

1. 在 `src/views/` 创建 Vue 组件
2. 在 `src/router/index.js` 添加路由配置
3. 在 `src/config/site.config.js` 添加导航项（如需要）

### 添加新 API

1. 在 `server/src/routes/` 创建路由文件
2. 在 `server/src/index.js` 注册路由
3. 在 `src/services/dataService.js` 添加前端调用方法

---

## 模板定制

### 快速定制步骤

1. **修改站点信息**: 编辑 `src/config/site.config.js`
2. **替换静态数据**: 编辑 `src/data/siteContent.js`
3. **自定义主题**: 修改 `src/styles/base.css` 中的 CSS 变量
4. **添加图片资源**: 放入 `public/images/` 目录

### 常见定制场景

#### 修改主题颜色

编辑 `src/styles/base.css`:

```css
:root {
  --accent: #your-color;
  --accent-2: #your-secondary-color;
  --bg: #your-background;
}
```

#### 修改首页内容

编辑 `src/config/site.config.js` 中的 `home` 配置块。

#### 添加新的统计项

在 `siteConfig.home.stats` 数组中添加新项：

```javascript
stats: [
  { label: '新统计项', value: '100', icon: 'chart' }
]
```

---

## 常见问题

### 数据库连接失败

检查以下项目：
1. MySQL 服务是否启动
2. `.env.development` 中的数据库配置是否正确
3. 数据库用户是否有足够权限

### 前端无法访问后端 API

检查以下项目：
1. 后端服务是否启动
2. Vite 代理配置是否正确
3. CORS 配置是否正确

### JWT 令牌无效

检查以下项目：
1. `JWT_SECRET` 配置是否一致
2. 令牌是否过期
3. 请求头是否包含正确的 Authorization

---

## 许可证

本项目基于 MIT 许可证开源。
