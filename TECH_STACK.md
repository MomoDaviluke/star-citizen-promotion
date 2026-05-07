<div align="center">

<!-- 动态标题横幅 -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:667eea,100:764ba2&height=280&section=header&text=Star%20Citizen%20战队&fontSize=50&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=企业级全栈技术架构&descAlignY=55&descSize=20" width="100%" />

<!-- 技术徽章矩阵 -->
<br>

[![Vue 3](https://img.shields.io/badge/Vue%203-4FC08D?style=flat-square&logo=vue.js&logoColor=white&labelColor=2c3e50)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white&labelColor=2c3e50)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white&labelColor=2c3e50)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white&labelColor=2c3e50)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white&labelColor=2c3e50)](https://www.mysql.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white&labelColor=2c3e50)](https://nodejs.org/)

<br>

[![CI/CD](https://img.shields.io/badge/CI/CD-Passing-success?style=flat-square&logo=github-actions&logoColor=white)](.github/workflows/)
[![Coverage](https://img.shields.io/badge/Coverage-85%25-brightgreen?style=flat-square&logo=codecov&logoColor=white)](docs/TESTING.md)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square&logo=open-source-initiative&logoColor=white)](LICENSE)

</div>

---

## 📑 目录

- [🎯 项目概览](#-项目概览)
- [🏗️ 系统架构](#️-系统架构)
- [🎨 前端技术栈](#-前端技术栈)
- [⚙️ 后端技术栈](#️-后端技术栈)
- [🗄️ 数据层架构](#️-数据层架构)
- [🧪 测试体系](#-测试体系)
- [🚀 DevOps 与部署](#-devops-与部署)
- [🔐 安全体系](#-安全体系)
- [📊 监控与日志](#-监控与日志)
- [🛠️ 开发工具链](#️-开发工具链)
- [📦 依赖全景](#-依赖全景)
- [🎯 选型决策](#-选型决策)

---

## 🎯 项目概览

<div align="center">

| 维度 | 技术方案 | 版本 |
|:---:|:---:|:---:|
| **前端框架** | Vue.js | 3.5.29 |
| **构建工具** | Vite | 7.3.1 |
| **后端框架** | Express.js | 4.21.2 |
| **数据库** | MySQL | 8.0+ |
| **运行时** | Node.js | ≥20.0 |
| **语言** | TypeScript | 6.0 |

</div>

### 核心特性

```yaml
架构模式: 前后端分离 (SPA + RESTful API)
认证机制: JWT + RBAC 角色权限控制
实时通信: WebSocket 双向消息推送
数据安全: 参数化查询 + 密码哈希 + 输入验证
部署方式: Docker Compose / Nginx 反向代理
```

---

## 🏗️ 系统架构

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              🌐 客户端层                                       │
│                                                                              │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐    │
│   │   Chrome    │   │   Firefox   │   │   Safari    │   │    Edge     │    │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘    │
└──────────┼─────────────────┼─────────────────┼─────────────────┼────────────┘
           │                 │                 │                 │
           └─────────────────┴────────┬────────┴─────────────────┘
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          🛡️ Nginx 反向代理层                                   │
│                                                                              │
│     SSL 终止  │  Gzip 压缩  │  负载均衡  │  静态缓存  │  SPA 路由回退            │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        │                        ▼
┌─────────────────────────────┐       │       ┌─────────────────────────────┐
│      🎨 前端应用 (Vue 3)     │       │       │      ⚙️ 后端服务 (Express)   │
│                             │       │       │                             │
│  ┌───────────────────────┐  │       │       │  ┌───────────────────────┐  │
│  │   Vue Router 5.0      │  │       │       │  │   JWT 认证中间件       │  │
│  │   组件化路由导航        │  │       │       │  │   Helmet 安全加固      │  │
│  └───────────────────────┘  │       │       │  └───────────────────────┘  │
│  ┌───────────────────────┐  │       │       │  ┌───────────────────────┐  │
│  │   Vite 7.3 构建工具    │  │       │       │  │   Winston 结构化日志   │  │
│  │   极速 HMR / 代码分割   │  │       │       │  │   Morgan HTTP 日志     │  │
│  └───────────────────────┘  │       │       │  └───────────────────────┘  │
│  ┌───────────────────────┐  │       │       │  ┌───────────────────────┐  │
│  │   Vitest + Playwright  │  │       │       │  │   Rate Limit 速率限制  │  │
│  │   单元测试 + E2E 测试   │  │       │       │  │   Validator 参数校验   │  │
│  └───────────────────────┘  │       │       │  └───────────────────────┘  │
└──────────────┬──────────────┘       │       └──────────────┬──────────────┘
               │                      │                      │
               │                      ▼                      │
               │           ┌────────────────────┐           │
               │           │   📡 WebSocket 服务  │           │
               │           │   ws 实时双向通信    │           │
               │           └────────────────────┘           │
               │                                            │
               └────────────────────┬───────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              💾 数据持久化层                                   │
│                                                                              │
│    ┌────────────────────┐          ┌────────────────────┐                    │
│    │   MySQL 8.0 主库    │◄────────►│  mysql2/promise    │                    │
│    │   关系型数据存储     │          │  连接池管理         │                    │
│    └────────────────────┘          └────────────────────┘                    │
│                                                                              │
│    ┌────────────────────┐          ┌────────────────────┐                    │
│    │   Knex.js 迁移工具  │          │   数据库种子数据     │                    │
│    │   版本化结构变更     │          │   初始化测试数据     │                    │
│    └────────────────────┘          └────────────────────┘                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 前端技术栈

### 核心框架

<table>
<tr>
<td width="70" align="center">
<img src="https://vuejs.org/logo.svg" width="42" height="42" alt="Vue">
</td>
<td>

**Vue.js 3.5.29**
> 渐进式 JavaScript 框架，采用 Composition API 实现逻辑复用，性能优异且包体积小。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://router.vuejs.org/logo.svg" width="42" height="42" alt="Vue Router">
</td>
<td>

**Vue Router 5.0.3**
> 官方路由管理器，支持动态路由匹配、导航守卫、路由懒加载，实现 SPA 无缝页面切换。

</td>
</tr>
</table>

### 构建与工程化

<table>
<tr>
<td width="70" align="center">
<img src="https://vitejs.dev/logo.svg" width="42" height="42" alt="Vite">
</td>
<td>

**Vite 7.3.1**
> 下一代前端构建工具，基于原生 ESM 提供极速冷启动（< 300ms）和即时热更新（HMR）。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://esbuild.github.io/favicon.svg" width="42" height="42" alt="esbuild">
</td>
<td>

**esbuild**
> Go 编写的高性能 JavaScript 打包器，Vite 底层依赖，构建速度比 Webpack 快 10-100 倍。

</td>
</tr>
</table>

### 代码质量

<table>
<tr>
<td width="70" align="center">
<img src="https://eslint.org/favicon.ico" width="42" height="42" alt="ESLint">
</td>
<td>

**ESLint 9.22 + eslint-plugin-vue 10.0**
> 静态代码分析工具，配合 Vue 专用规则插件，实现代码规范统一和潜在问题检测。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://prettier.io/icon.png" width="42" height="42" alt="Prettier">
</td>
<td>

**Prettier 3.5**
> 代码格式化工具，支持 Vue/SFC 自动格式化，确保团队协作时代码风格一致。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://www.typescriptlang.org/favicon.ico" width="42" height="42" alt="TypeScript">
</td>
<td>

**TypeScript 6.0**
> JavaScript 超集，提供静态类型检查、智能提示和重构支持，提升代码可维护性。

</td>
</tr>
</table>

### 测试框架

<table>
<tr>
<td width="70" align="center">
<img src="https://vitest.dev/logo.svg" width="42" height="42" alt="Vitest">
</td>
<td>

**Vitest 3.0.8 + @vitest/coverage-v8 3.2.4**
> 基于 Vite 的单元测试框架，与 Vite 配置共享，支持极速测试执行和 V8 覆盖率报告。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://playwright.dev/img/playwright-logo.svg" width="42" height="42" alt="Playwright">
</td>
<td>

**Playwright 1.58.2**
> 微软出品的端到端测试框架，支持 Chromium/Firefox/WebKit 多浏览器自动化测试。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://test-utils.vuejs.org/logo.svg" width="42" height="42" alt="Vue Test Utils">
</td>
<td>

**@vue/test-utils 2.4.6 + happy-dom 20.9**
> Vue 官方组件测试工具，配合 happy-dom 轻量级浏览器环境，实现组件级单元测试。

</td>
</tr>
</table>

---

## ⚙️ 后端技术栈

### 运行时与框架

<table>
<tr>
<td width="70" align="center">
<img src="https://nodejs.org/static/images/favicons/favicon.png" width="42" height="42" alt="Node.js">
</td>
<td>

**Node.js ≥20.0**
> 基于 V8 引擎的 JavaScript 运行时，支持最新 ES 特性，提供高性能异步 I/O 处理能力。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://expressjs.com/images/favicon.png" width="42" height="42" alt="Express">
</td>
<td>

**Express.js 4.21.2**
> 极简灵活的 Node.js Web 框架，中间件机制成熟，生态丰富，适合构建 RESTful API。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://www.typescriptlang.org/favicon.ico" width="42" height="42" alt="TypeScript">
</td>
<td>

**TypeScript 6.0 (全面迁移)**
> 后端代码已完成全面 TypeScript 迁移，包含类型定义、接口约束和编译时检查。

</td>
</tr>
</table>

### 认证与安全

<table>
<tr>
<td width="70" align="center">
<img src="https://jwt.io/img/favicon/favicon-32x32.png" width="42" height="42" alt="JWT">
</td>
<td>

**jsonwebtoken 9.0.2**
> JWT 令牌签发与验证，支持 HS256 算法、自定义声明、令牌过期与刷新机制。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://www.npmjs.com/npm-avatar/3.0.0/bcryptjs.png" width="42" height="42" alt="bcrypt">
</td>
<td>

**bcryptjs 2.4.3**
> 密码哈希算法，可配置 salt rounds（默认 12），安全存储用户密码。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://helmetjs.github.io/favicon.png" width="42" height="42" alt="Helmet">
</td>
<td>

**Helmet 8.0.0**
> Express 安全中间件，自动设置 CSP、HSTS、X-Frame-Options 等 11 项安全响应头。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://github.com/expressjs/cors/raw/master/logo.png" width="42" height="42" alt="CORS">
</td>
<td>

**cors 2.8.5 + express-rate-limit 7.5.0**
> 跨域资源共享中间件配合速率限制，防止 API 滥用和跨域攻击。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://express-validator.github.io/img/logo.svg" width="42" height="42" alt="express-validator">
</td>
<td>

**express-validator 7.2.1**
> 请求数据验证和清理中间件，防止 SQL 注入和 XSS 攻击。

</td>
</tr>
</table>

### 数据访问层

<table>
<tr>
<td width="70" align="center">
<img src="https://www.mysql.com/common/logos/logo-mysql-170x115.png" width="42" height="42" alt="MySQL">
</td>
<td>

**mysql2 3.12.0**
> MySQL 官方 Node.js 驱动，支持 Promise API、连接池、预处理语句和事务管理。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://knexjs.org/knex-logo.png" width="42" height="42" alt="Knex">
</td>
<td>

**Knex.js (CLI)**
> SQL 查询构建器和迁移工具，支持数据库版本化管理和种子数据初始化。

</td>
</tr>
</table>

### 工具库

<table>
<tr>
<td width="70" align="center">
<img src="https://www.npmjs.com/npm-avatar/3.0.0/dotenv.png" width="42" height="42" alt="dotenv">
</td>
<td>

**dotenv 17.3.1**
> 环境变量加载，支持 `.env.development` / `.env.production` 多环境配置。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://www.npmjs.com/npm-avatar/3.0.0/uuid.png" width="42" height="42" alt="uuid">
</td>
<td>

**uuid 11.0.3**
> UUID v4/v7 生成器，用于数据库主键和唯一标识符。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://www.npmjs.com/npm-avatar/3.0.0/compression.png" width="42" height="42" alt="compression">
</td>
<td>

**compression 1.8.1**
> Express Gzip 压缩中间件，减少响应体积 60-80%。

</td>
</tr>
</table>

### 实时通信与文档

<table>
<tr>
<td width="70" align="center">
<img src="https://github.com/websockets/ws/raw/master/logo.png" width="42" height="42" alt="WebSocket">
</td>
<td>

**ws 8.18.0**
> WebSocket 库，实现实时双向通信，支持消息广播和连接管理。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://swagger.io/swagger/media/assets/swagger-logo.svg" width="42" height="42" alt="Swagger">
</td>
<td>

**swagger-jsdoc 6.2.8 + swagger-ui-express 5.0.1**
> 从 JSDoc 注释自动生成 OpenAPI 3.0 规范，提供交互式 API 文档界面。

</td>
</tr>
</table>

---

## 🗄️ 数据层架构

### 数据库实体关系

```
┌─────────────────────────────────────────────────────────────┐
│                      MySQL 8.0 数据库                        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   users     │  │   members   │  │   pilots    │         │
│  │   用户表     │  │   成员表     │  │   飞行员表   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   projects  │  │ applications│  │   stats     │         │
│  │   项目表     │  │   申请表     │  │   统计表     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    mysql2/promise 连接池                     │
│                                                             │
│  • 连接池大小：生产 20 / 开发 10                              │
│  • 连接保活：enableKeepAlive = true                         │
│  • 空闲超时：idleTimeout = 60000ms                          │
│  • 最大空闲时间：maxIdleTime = 300000ms                      │
│  • 队列限制：queueLimit = 50                                │
│  • 时区配置：timezone = '+08:00'                            │
│  • 字符集：charset = 'utf8mb4'                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 数据库特性

| 特性 | 实现 | 说明 |
|:---:|:---:|:---|
| **连接池管理** | mysql2/promise | 自动管理连接生命周期，支持并发查询 |
| **事务支持** | `transaction()` 封装 | ACID 事务保证数据一致性 |
| **参数化查询** | `?` 占位符 | 防止 SQL 注入攻击 |
| **数据库迁移** | Knex.js CLI | 版本化表结构变更，支持回滚 |
| **种子数据** | Knex.js Seeder | 初始化开发和测试数据 |

---

## 🧪 测试体系

### 测试金字塔

```
                    ┌─────────┐
                    │   E2E   │  Playwright (浏览器自动化)
                    │  10 用例 │  首页 / 加入流程 / 管理后台
                    ├─────────┤
                    │ 集成测试 │  Jest + Supertest (API 测试)
                    │ 65 用例  │  路由 / 中间件 / 认证流程
                    ├─────────┤
                    │ 单元测试 │  Vitest / Jest (模块测试)
                    │ 195 用例 │  服务层 / 组件 / 工具函数
                    └─────────┘
```

### 测试工具

<table>
<tr>
<td width="70" align="center">
<img src="https://vitest.dev/logo.svg" width="42" height="42" alt="Vitest">
</td>
<td>

**Vitest 3.0.8**
> 与 Vite 共享配置的单元测试框架，支持极速执行和快照测试。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://playwright.dev/img/playwright-logo.svg" width="42" height="42" alt="Playwright">
</td>
<td>

**Playwright 1.58.2**
> 端到端测试，支持多浏览器并行执行，自动生成测试报告和追踪。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://jestjs.io/img/favicon/favicon.ico" width="42" height="42" alt="Jest">
</td>
<td>

**Jest 29.7.0 + ts-jest 29.4.9**
> JavaScript 测试框架，支持 ESM、Mock、覆盖率报告，配合 ts-jest 处理 TypeScript。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://www.npmjs.com/npm-avatar/3.0.0/supertest.png" width="42" height="42" alt="Supertest">
</td>
<td>

**Supertest 7.0.0**
> HTTP 断言库，用于测试 Express API 接口，支持链式调用和异步测试。

</td>
</tr>
</table>

### 核心模块覆盖率

| 模块 | 覆盖率 | 测试框架 |
|:---:|:---:|:---:|
| `PriorityQueue.js` | **100%** | Vitest |
| `authService.js` (后端) | **95%** | Jest |
| `dataService.js` | **95%** | Vitest |
| `ResourceMonitor.js` | **94%** | Vitest |
| `AIService.js` | **92%** | Vitest |
| Admin Views | **100%** | Vitest |

---

## 🚀 DevOps 与部署

### CI/CD 流水线

```
代码提交 → Lint 检查 → 前端测试 → 后端测试 → 安全扫描 → 构建 → E2E 测试 → 部署
   │           │           │           │           │         │         │
   ▼           ▼           ▼           ▼           ▼         ▼         ▼
GitHub    ESLint      Vitest      Jest +      npm      Vite    Playwright   Docker
Actions   前后端      单元测试    Supertest   audit    构建    E2E 测试    Compose
```

### 部署方案

| 方案 | 技术 | 说明 |
|:---:|:---:|:---|
| **Docker Compose** | Docker + docker-compose | 多阶段构建，一键启动全栈环境 |
| **手动部署** | Node.js + Nginx | 前端静态资源 + 后端服务分离部署 |
| **Nginx 反向代理** | Nginx | 负载均衡、SSL、Gzip、SPA 路由回退 |

### DevOps 工具

<table>
<tr>
<td width="70" align="center">
<img src="https://github.githubassets.com/favicons/favicon.svg" width="42" height="42" alt="GitHub Actions">
</td>
<td>

**GitHub Actions**
> 自动化 CI/CD 平台，配置代码检查、测试、安全扫描、构建流水线。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://about.codecov.io/wp-content/themes/codecov/assets/brand/icons/codecov-icon.svg" width="42" height="42" alt="Codecov">
</td>
<td>

**Codecov**
> 代码覆盖率报告托管，支持前后端覆盖率合并展示。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://www.docker.com/wp-content/uploads/2023/08/logo-guide-logos-1.svg" width="42" height="42" alt="Docker">
</td>
<td>

**Docker + Docker Compose**
> 容器化部署，支持多阶段构建和开发/生产环境切换。

</td>
</tr>
</table>

---

## 🔐 安全体系

### 多层安全防护

```
┌─────────────────────────────────────────────────────────────┐
│                      网络安全层                              │
│  • HTTPS / SSL 加密传输                                      │
│  • Nginx 反向代理过滤                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      应用安全层                              │
│  • Helmet 安全头 (CSP / HSTS / X-Frame-Options)             │
│  • CORS 跨域策略限制                                         │
│  • Rate Limit 速率限制 (15分钟/100请求)                       │
│  • express-validator 输入验证                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      认证安全层                              │
│  • bcryptjs 密码哈希 (salt rounds: 12)                      │
│  • JWT 令牌认证 (HS256 / 过期刷新)                           │
│  • RBAC 角色权限控制                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据安全层                              │
│  • mysql2 参数化查询 (防 SQL 注入)                           │
│  • 敏感数据脱敏 (sanitizeUser)                               │
│  • 请求体大小限制 (JSON 10kb)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 监控与日志

### 日志系统

<table>
<tr>
<td width="70" align="center">
<img src="https://github.com/winstonjs/winston/raw/master/assets/winston-logo.svg" width="42" height="42" alt="Winston">
</td>
<td>

**Winston 3.19.0**
> 企业级结构化日志库，支持多级别（error/warn/info/debug）、多传输通道（控制台/文件/HTTP）。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://www.npmjs.com/npm-avatar/3.0.0/morgan.png" width="42" height="42" alt="Morgan">
</td>
<td>

**Morgan 1.10.0**
> HTTP 请求日志中间件，记录请求方法、URL、状态码、响应时间。

</td>
</tr>
</table>

### 监控指标

<table>
<tr>
<td width="70" align="center">
<img src="https://prometheus.io/assets/favicons/favicon.ico" width="42" height="42" alt="Prometheus">
</td>
<td>

**prom-client 15.1.3**
> Prometheus 客户端库，暴露 `/metrics` 端点，采集 HTTP 请求数、响应时间、内存使用等指标。

</td>
</tr>
</table>

### 日志与监控架构

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   应用日志   │    │   访问日志   │    │   审计日志   │
│  (Winston)  │    │  (Morgan)   │    │(auditLogger)│
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          ▼
              ┌─────────────────────┐
              │    日志文件归档      │
              │  logs/app-error.log │
              │  logs/app-info.log  │
              │  logs/access.log    │
              └─────────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │   Prometheus 指标    │
              │   /metrics 端点      │
              └─────────────────────┘
```

---

## 🛠️ 开发工具链

### TypeScript 工具

<table>
<tr>
<td width="70" align="center">
<img src="https://tsx.is/favicon.svg" width="42" height="42" alt="tsx">
</td>
<td>

**tsx 4.21.0**
> TypeScript 执行器，支持直接运行 `.ts` 文件，用于开发服务器和数据库脚本。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://typestrong.org/ts-node/favicon.ico" width="42" height="42" alt="ts-node">
</td>
<td>

**ts-node 10.9.2**
> TypeScript 直接执行环境，用于调试和脚本执行。

</td>
</tr>
<tr>
<td width="70" align="center">
<img src="https://typescript-eslint.io/img/favicon.ico" width="42" height="42" alt="typescript-eslint">
</td>
<td>

**typescript-eslint 8.59.2**
> TypeScript 的 ESLint 解析器和插件，提供类型感知的代码检查规则。

</td>
</tr>
</table>

### 类型定义 (@types)

| 包名 | 版本 | 说明 |
|:---:|:---:|:---|
| @types/node | ^25.6.0 | Node.js 内置模块类型 |
| @types/express | ^5.0.6 | Express.js 类型 |
| @types/bcryptjs | ^2.4.6 | bcryptjs 类型 |
| @types/jsonwebtoken | ^9.0.10 | jsonwebtoken 类型 |
| @types/cors | ^2.8.19 | cors 类型 |
| @types/compression | ^1.8.1 | compression 类型 |
| @types/morgan | ^1.9.10 | morgan 类型 |
| @types/ws | ^8.18.1 | ws 类型 |
| @types/swagger-jsdoc | ^6.0.4 | swagger-jsdoc 类型 |
| @types/swagger-ui-express | ^4.1.8 | swagger-ui-express 类型 |

---

## 📦 依赖全景

### 前端依赖

```yaml
总依赖: 15 个
├── 生产依赖: 2 个
│   ├── vue: ^3.5.29
│   └── vue-router: ^5.0.3
└── 开发依赖: 13 个
    ├── vite: ^7.3.1
    ├── vitest: ^3.0.8
    ├── @vitest/coverage-v8: ^3.2.4
    ├── playwright: ^1.58.2
    ├── eslint: ^9.22.0
    ├── eslint-plugin-vue: ^10.0.0
    ├── prettier: ^3.5.1
    ├── typescript: ^6.0.3
    ├── @vue/test-utils: ^2.4.6
    └── happy-dom: ^20.9.0
```

### 后端依赖

```yaml
总依赖: 32 个
├── 生产依赖: 16 个
│   ├── express: ^4.21.2
│   ├── mysql2: ^3.12.0
│   ├── jsonwebtoken: ^9.0.2
│   ├── bcryptjs: ^2.4.3
│   ├── helmet: ^8.0.0
│   ├── cors: ^2.8.5
│   ├── express-rate-limit: ^7.5.0
│   ├── express-validator: ^7.2.1
│   ├── winston: ^3.19.0
│   ├── morgan: ^1.10.0
│   ├── ws: ^8.18.0
│   ├── swagger-jsdoc: ^6.2.8
│   ├── swagger-ui-express: ^5.0.1
│   ├── dotenv: ^17.3.1
│   ├── uuid: ^11.0.3
│   └── compression: ^1.8.1
└── 开发依赖: 16 个
    ├── typescript: ^6.0.3
    ├── tsx: ^4.21.0
    ├── ts-node: ^10.9.2
    ├── jest: ^29.7.0
    ├── ts-jest: ^29.4.9
    ├── supertest: ^7.0.0
    ├── eslint: ^9.22.0
    ├── typescript-eslint: ^8.59.2
    └── @types/*: 10 个类型定义包
```

---

## 🎯 选型决策

### 为什么选择 Vue 3？

- **渐进式框架**：学习曲线平缓，可逐步采用高级特性
- **Composition API**：优秀的逻辑复用能力，代码组织更清晰
- **性能优异**：包体积小，渲染性能在主流框架中领先
- **生态成熟**：Vue Router、Pinia、Vite 等官方工具链完善

### 为什么选择 Express.js？

- **生态最成熟**：Node.js 社区最广泛使用的 Web 框架
- **中间件机制**：灵活的中间件栈，扩展性极强
- **RESTful 友好**：天然适合构建 RESTful API
- **TypeScript 支持**：类型定义完善，与 TS 集成顺畅

### 为什么选择 MySQL？

- **成熟稳定**： decades 的生产环境验证
- **事务支持**：完善的 ACID 事务机制
- **Node.js 生态**：mysql2 驱动性能优秀，功能完善
- **运维友好**：广泛的管理工具和云服务支持

### 为什么选择 TypeScript？

- **类型安全**：编译时捕获类型错误，减少运行时异常
- **IDE 体验**：智能提示、自动补全、重构支持
- **可维护性**：类型即文档，便于团队协作和代码审查
- **企业标准**：现代前端/后端项目的标准选择

---

## 🌐 环境兼容性

| 环境 | 版本要求 | 说明 |
|:---:|:---:|:---|
| **Node.js** | ^20.19.0 \|\| >=22.12.0 | 前端要求 |
| **Node.js** | >=20.0.0 | 后端最低要求 |
| **npm** | >=10.0.0 | 包管理器 |
| **MySQL** | 8.0+ | 数据库服务器 |
| **浏览器** | Chrome 90+, Firefox 88+, Safari 14+ | 客户端支持 |

---

<div align="center">

<!-- 底部横幅 -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:764ba2,100:667eea&height=120&section=footer&text=Star%20Citizen%20战队&fontSize=30&fontColor=ffffff&animation=fadeIn" width="100%" />

<br>

**🌌 技术驱动，品质至上**

*[查看完整项目文档](README.md) · [API 接口文档](docs/API.md) · [开发指南](docs/DEVELOPMENT.md)*

<br>

*本文档最后更新于 2026-05-07*

</div>
