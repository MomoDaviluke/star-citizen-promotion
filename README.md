# 🚀 星际公民战队宣传网站

<div align="center">

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=flat-square&logo=vue.js)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**面向星际公民玩家的团队门户，展示组织定位、核心成员、活动任务与招募信息**

[在线预览](#) · [功能特点](#功能特点) · [快速开始](#快速开始) · [配置说明](#配置说明)

</div>

---

## 📖 目录

- [项目概述](#项目概述)
- [功能特点](#功能特点)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [开发指南](#开发指南)
- [部署说明](#部署说明)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

---

## 项目概述

本项目是一个基于 **Vue 3 + Vite** 构建的星际公民战队宣传网站。采用科幻风格的UI设计，具有流畅的页面过渡动画和完善的AI服务架构，为战队提供专业的展示平台。

### 核心功能

- 🏠 **首页展示** - Hero区域、团队统计、王牌飞行员轮播
- 👥 **团队介绍** - 组织定位、发展历程时间线
- 🎖️ **核心成员** - 成员卡片列表展示
- 📋 **活动项目** - 活动任务卡片、进度展示
- 📝 **加入我们** - 招募条件、加入流程
- 📞 **联系我们** - 联系渠道、社交链接

---

## 功能特点

### 🎨 精美的UI设计

- 科幻风格的深色主题
- 流畅的动画效果和交互体验
- 响应式布局，完美适配各种设备
- 支持 `prefers-reduced-motion` 无障碍访问

### ⚡ 性能优化

- 路由懒加载与智能预加载
- 页面过渡动画（前进/后退方向感知）
- 代码分割与资源优化
- 全局加载状态指示器

### 🤖 AI服务架构

项目内置了完善的AI服务层架构，支持：

| 特性 | 说明 |
|------|------|
| 优先级队列 | 4级优先级调度（LOW/NORMAL/HIGH/CRITICAL） |
| 超时机制 | 可配置超时时间，自动中止超时任务 |
| 错误恢复 | 指数退避重试策略 |
| 并发控制 | 可配置最大并发数 |
| 资源监控 | 内存使用监控与预警 |
| 任务取消 | AbortController支持 |

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3.5 (Composition API) |
| 路由 | Vue Router 5.0 |
| 构建工具 | Vite 7.3 |
| 代码规范 | ESLint + Prettier |
| 包管理器 | npm |

---

## 项目结构

```
star-citizen-promotion/
├── public/                    # 静态资源
│   └── images/                # 图片资源
├── src/
│   ├── components/            # 组件
│   │   ├── common/            # 通用组件
│   │   │   ├── LoadingIndicator.vue  # 加载指示器
│   │   │   ├── PageTitle.vue         # 页面标题
│   │   │   └── PageTransition.vue    # 页面过渡
│   │   └── layout/            # 布局组件
│   │       ├── SiteHeader.vue        # 网站头部
│   │       └── SiteFooter.vue        # 网站底部
│   ├── composables/           # 组合式API
│   │   ├── useAI.js           # AI服务Hook
│   │   └── index.js
│   ├── config/                # 配置文件
│   │   └── index.js           # 端口配置
│   ├── data/                  # 静态数据
│   │   └── siteContent.js     # 网站内容
│   ├── router/                # 路由配置
│   │   └── index.js           # 路由定义
│   ├── services/              # 服务层
│   │   ├── AIService.js       # AI服务核心
│   │   ├── PriorityQueue.js   # 优先级队列
│   │   ├── ResourceMonitor.js # 资源监控
│   │   └── index.js
│   ├── styles/                # 样式文件
│   │   └── base.css           # 全局样式
│   ├── views/                 # 页面视图
│   │   ├── Home.vue           # 首页
│   │   ├── About.vue          # 团队介绍
│   │   ├── Members.vue        # 核心成员
│   │   ├── Projects.vue       # 活动项目
│   │   ├── Join.vue           # 加入我们
│   │   ├── Contact.vue        # 联系我们
│   │   └── NotFound.vue       # 404页面
│   ├── App.vue                # 根组件
│   └── main.js                # 入口文件
├── .editorconfig              # 编辑器配置
├── .env.example               # 环境变量模板
├── .env.development           # 开发环境配置
├── .env.production            # 生产环境配置
├── .gitignore                 # Git忽略规则
├── .prettierrc                # Prettier配置
├── eslint.config.js           # ESLint配置
├── package.json               # 项目依赖
└── vite.config.js             # Vite配置
```

---

## 快速开始

### 环境要求

- Node.js `^20.19.0` 或 `>=22.12.0`
- npm `>=9.0.0`

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/MomoDaviluke/star-citizen-promotion.git

# 进入项目目录
cd star-citizen-promotion

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

启动后访问 http://localhost:3000 查看网站。

### 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | 运行ESLint检查 |
| `npm run lint:fix` | 自动修复ESLint问题 |
| `npm run format` | 格式化代码 |

---

## 配置说明

### 环境变量

项目使用环境变量进行配置，主要配置项如下：

```bash
# 应用配置
VITE_APP_ENV=development          # 环境：development/production
VITE_APP_NAME=Star Citizen Promotion

# 前端服务
VITE_SERVER_PORT=3000             # 开发服务器端口
VITE_SERVER_HOST=localhost

# 后端API服务
VITE_BACKEND_PORT=3001            # 后端服务端口
VITE_BACKEND_HOST=localhost
VITE_BACKEND_URL=http://localhost:3001

# AI服务
VITE_AI_SERVICE_PORT=3002         # AI服务端口
VITE_AI_SERVICE_HOST=localhost
VITE_AI_SERVICE_URL=http://localhost:3002
VITE_AI_TIMEOUT=30000             # 超时时间(ms)
VITE_AI_MAX_RETRIES=3             # 最大重试次数
VITE_AI_MAX_CONCURRENT=3          # 最大并发数

# WebSocket服务
VITE_WS_PORT=3003                 # WebSocket端口
VITE_WS_HOST=localhost
VITE_WS_URL=ws://localhost:3003
```

### 端口配置

| 服务 | 默认端口 | 用途 |
|------|----------|------|
| 前端开发服务器 | 3000 | Vite开发服务器 |
| 后端API服务 | 3001 | RESTful API |
| AI服务 | 3002 | AI模型推理 |
| WebSocket服务 | 3003 | 实时通信 |

### 修改网站内容

网站内容存储在 `src/data/siteContent.js` 文件中，修改该文件即可更新网站内容：

```javascript
// 修改导航菜单
export const navItems = [
  { label: '首页', to: '/' },
  // ...
]

// 修改团队成员
export const members = [
  { name: 'Echo', role: '舰队指挥', intro: '...' },
  // ...
]
```

---

## 开发指南

### 代码规范

项目遵循以下代码规范：

- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **EditorConfig** - 编辑器配置统一

### 提交规范

项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>
```

**类型说明：**

| 类型 | 描述 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复bug |
| `docs` | 文档更新 |
| `style` | 代码格式调整 |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 其他杂项 |

**示例：**

```bash
feat: 添加用户登录功能
fix(router): 修复页面跳转动画卡顿问题
docs: 更新README部署说明
```

### 使用AI服务

```javascript
import { useAI, PRIORITY } from '@/composables/useAI'

const { execute, isLoading, error, result } = useAI()

// 执行AI任务
await execute(
  async ({ signal, onProgress }) => {
    onProgress(0.5)
    const response = await fetch('/api/ai', { signal })
    return response.json()
  },
  {
    priority: PRIORITY.HIGH,
    timeout: 10000,
    retries: 3
  }
)
```

---

## 部署说明

### 构建生产版本

```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

构建产物将输出到 `dist` 目录。

### 部署到静态托管

项目可部署到任何静态文件托管服务：

- **Vercel** - 推荐，零配置部署
- **Netlify** - 支持自动部署
- **GitHub Pages** - 免费托管
- **Cloudflare Pages** - 全球CDN加速

### Docker部署

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发流程

1. 确保代码通过ESLint检查
2. 确保代码格式符合Prettier规范
3. 编写清晰的提交信息
4. 更新相关文档

---

## 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

---

## 致谢

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Star Citizen](https://robertsspaceindustries.com/) - 星际公民游戏

---

<div align="center">

**Made with ❤️ for Star Citizen Players**

</div>
