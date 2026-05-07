# Star Citizen 战队宣传网站 - 技术栈详解

> 本文档详细展示项目所采用的每一项技术，包括核心框架、构建工具、测试框架、数据库、DevOps 等各个层面的技术选型。

---

## 目录

- [项目概览](#项目概览)
- [前端技术栈](#前端技术栈)
- [后端技术栈](#后端技术栈)
- [数据库与存储](#数据库与存储)
- [测试体系](#测试体系)
- [CI/CD 与 DevOps](#cicd-与-devops)
- [安全与监控](#安全与监控)
- [开发工具](#开发工具)

---

## 项目概览

| 属性 | 说明 |
|------|------|
| **项目名称** | Star Citizen 战队宣传网站 |
| **架构模式** | 前后端分离 (SPA + RESTful API) |
| **前端框架** | Vue 3 + Vue Router 5 |
| **后端框架** | Express.js 4 + TypeScript |
| **数据库** | MySQL 8.0 |
| **Node.js 版本** | ^20.19.0 \|\| >=22.12.0 |
| **包管理器** | npm |
| **许可证** | MIT |

---

## 前端技术栈

### 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| [Vue](https://vuejs.org/) | ^3.5.29 | 渐进式 JavaScript 框架，用于构建用户界面 |
| [Vue Router](https://router.vuejs.org/) | ^5.0.3 | Vue.js 官方路由管理器，实现 SPA 页面导航 |

### 构建工具

| 技术 | 版本 | 用途 |
|------|------|------|
| [Vite](https://vitejs.dev/) | ^7.3.1 | 下一代前端构建工具，提供极速的冷启动和热更新 |
| [@vitejs/plugin-vue](https://github.com/vitejs/vite-plugin-vue) | ^6.0.4 | Vite 官方 Vue 单文件组件支持插件 |
| [vite-plugin-vue-devtools](https://github.com/webfansplz/vite-plugin-vue-devtools) | ^8.0.6 | Vue DevTools 集成，支持在浏览器中调试 Vue 应用 |
| [esbuild](https://esbuild.github.io/) | (内置) | 极速 JavaScript 打包器，Vite 底层使用 |

### 代码质量

| 技术 | 版本 | 用途 |
|------|------|------|
| [ESLint](https://eslint.org/) | ^9.22.0 | JavaScript/TypeScript 静态代码分析工具 |
| [@eslint/js](https://github.com/eslint/eslint) | ^9.22.0 | ESLint 官方 JavaScript 规则集 |
| [eslint-plugin-vue](https://eslint.vuejs.org/) | ^10.0.0 | Vue.js 专用 ESLint 规则插件 |
| [Prettier](https://prettier.io/) | ^3.5.0 | 代码格式化工具，统一代码风格 |
| [TypeScript](https://www.typescriptlang.org/) | ^6.0.3 | JavaScript 的超集，提供静态类型检查 |

### 前端测试

| 技术 | 版本 | 用途 |
|------|------|------|
| [Vitest](https://vitest.dev/) | ^3.0.8 | 基于 Vite 的单元测试框架，极速执行 |
| [@vitest/coverage-v8](https://vitest.dev/guide/coverage.html) | ^3.2.4 | Vitest 覆盖率报告生成器 (基于 V8) |
| [@vue/test-utils](https://test-utils.vuejs.org/) | ^2.4.6 | Vue 组件测试工具库 |
| [happy-dom](https://github.com/capricorn86/happy-dom) | ^20.9.0 | 轻量级浏览器环境模拟，用于单元测试 |
| [Playwright](https://playwright.dev/) | ^1.58.2 | 端到端 (E2E) 测试框架，支持多浏览器 |

### 前端工程化配置

| 配置项 | 说明 |
|--------|------|
| `vite.config.js` | Vite 构建配置，包含插件、路径别名、代理、构建优化 |
| `jsconfig.json` | JavaScript 项目配置，提供 IDE 智能提示 |
| `.eslintrc.js` | ESLint 规则配置 |
| `.prettierrc` | Prettier 格式化配置 |

---

## 后端技术栈

### 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| [Node.js](https://nodejs.org/) | >=20.0.0 | JavaScript 运行时环境 |
| [Express.js](https://expressjs.com/) | ^4.21.2 | 极简灵活的 Node.js Web 应用框架 |
| [TypeScript](https://www.typescriptlang.org/) | ^6.0.3 | 后端代码全面使用 TypeScript，提供类型安全 |

### 数据库访问

| 技术 | 版本 | 用途 |
|------|------|------|
| [mysql2](https://github.com/sidorares/node-mysql2) | ^3.12.0 | MySQL 客户端，支持 Promise API 和连接池 |
| [Knex.js](https://knexjs.org/) | (通过 CLI 使用) | SQL 查询构建器，用于数据库迁移和种子 |

### 认证与安全

| 技术 | 版本 | 用途 |
|------|------|------|
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | ^9.0.2 | JWT (JSON Web Token) 生成与验证 |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | ^2.4.3 | 密码哈希算法，安全存储用户密码 |
| [helmet](https://helmetjs.github.io/) | ^8.0.0 | Express 安全中间件，设置 HTTP 安全响应头 |
| [cors](https://github.com/expressjs/cors) | ^2.8.5 | 跨域资源共享 (CORS) 中间件 |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | ^7.5.0 | Express 请求速率限制中间件，防止暴力攻击 |
| [express-validator](https://express-validator.github.io/) | ^7.2.1 | Express 请求数据验证和清理中间件 |

### 日志与监控

| 技术 | 版本 | 用途 |
|------|------|------|
| [Winston](https://github.com/winstonjs/winston) | ^3.19.0 | 通用日志库，支持多传输通道和格式化 |
| [Morgan](https://github.com/expressjs/morgan) | ^1.10.0 | HTTP 请求日志中间件 |
| [prom-client](https://github.com/siimon/prom-client) | ^15.1.3 | Prometheus 客户端库，暴露应用指标 |

### 实时通信

| 技术 | 版本 | 用途 |
|------|------|------|
| [ws](https://github.com/websockets/ws) | ^8.18.0 | WebSocket 库，实现实时双向通信 |

### API 文档

| 技术 | 版本 | 用途 |
|------|------|------|
| [Swagger JSDoc](https://github.com/Surnet/swagger-jsdoc) | ^6.2.8 | 从 JSDoc 注释生成 OpenAPI/Swagger 规范 |
| [Swagger UI Express](https://github.com/scottie1984/swagger-ui-express) | ^5.0.1 | Express 中间件，提供 Swagger UI 文档界面 |

### 工具库

| 技术 | 版本 | 用途 |
|------|------|------|
| [dotenv](https://github.com/motdotla/dotenv) | ^17.3.1 | 环境变量加载，支持多环境配置 |
| [uuid](https://github.com/uuidjs/uuid) | ^11.0.3 | UUID 生成器，用于唯一标识符 |
| [compression](https://github.com/expressjs/compression) | ^1.8.1 | Express Gzip 压缩中间件 |

### 后端测试

| 技术 | 版本 | 用途 |
|------|------|------|
| [Jest](https://jestjs.io/) | ^29.7.0 | JavaScript 测试框架，支持断言、Mock、覆盖率 |
| [ts-jest](https://kulshekhar.github.io/ts-jest/) | ^29.4.9 | Jest 的 TypeScript 预处理器 |
| [SuperTest](https://github.com/ladjs/supertest) | ^7.0.0 | HTTP 断言库，用于测试 Express API |

### TypeScript 开发工具

| 技术 | 版本 | 用途 |
|------|------|------|
| [tsx](https://github.com/privatenumber/tsx) | ^4.21.0 | TypeScript 执行器，支持直接运行 .ts 文件 |
| [ts-node](https://github.com/TypeStrong/ts-node) | ^10.9.2 | TypeScript 直接执行环境 |
| [typescript-eslint](https://typescript-eslint.io/) | ^8.59.2 | TypeScript 的 ESLint 解析器和插件 |

### 类型定义 (@types)

| 包名 | 版本 | 说明 |
|------|------|------|
| @types/node | ^25.6.0 | Node.js 内置模块类型定义 |
| @types/express | ^5.0.6 | Express.js 类型定义 |
| @types/bcryptjs | ^2.4.6 | bcryptjs 类型定义 |
| @types/jsonwebtoken | ^9.0.10 | jsonwebtoken 类型定义 |
| @types/cors | ^2.8.19 | cors 类型定义 |
| @types/compression | ^1.8.1 | compression 类型定义 |
| @types/morgan | ^1.9.10 | morgan 类型定义 |
| @types/ws | ^8.18.1 | ws 类型定义 |
| @types/swagger-jsdoc | ^6.0.4 | swagger-jsdoc 类型定义 |
| @types/swagger-ui-express | ^4.1.8 | swagger-ui-express 类型定义 |

---

## 数据库与存储

| 技术 | 版本 | 用途 |
|------|------|------|
| [MySQL](https://www.mysql.com/) | 8.0 | 关系型数据库，存储业务数据 |
| MySQL 连接池 | (mysql2 内置) | 管理数据库连接，提高并发性能 |
| 数据库迁移 | (Knex CLI) | 版本化数据库结构变更 |
| 数据种子 | (Knex CLI) | 初始化测试/开发数据 |

### 数据库设计特点

- 连接池配置：生产环境 20 连接，开发环境 10 连接
- 支持事务处理 (transaction)
- 连接保活和空闲超时管理
- 时区和字符集配置

---

## 测试体系

### 前端测试

| 层级 | 工具 | 说明 |
|------|------|------|
| 单元测试 | Vitest + @vue/test-utils | 组件和工具函数测试 |
| E2E 测试 | Playwright | 端到端用户流程测试 |
| 覆盖率 | @vitest/coverage-v8 | 代码覆盖率报告 |

### 后端测试

| 层级 | 工具 | 说明 |
|------|------|------|
| 单元测试 | Jest + ts-jest | 服务层、工具函数测试 |
| API 测试 | Jest + SuperTest | Express 路由和中间件测试 |
| 覆盖率 | Jest 内置 | 代码覆盖率报告 |

### 测试命令

```bash
# 前端
npm run test              # 运行单元测试
npm run test:coverage     # 运行测试并生成覆盖率报告
npm run test:e2e          # 运行 E2E 测试

# 后端
cd server
npm test                  # 运行后端测试
```

---

## CI/CD 与 DevOps

### GitHub Actions 工作流

| 任务 | 说明 |
|------|------|
| **代码检查 (lint)** | 前后端 ESLint 静态分析 |
| **前端测试** | Vitest 单元测试 + 覆盖率上传 Codecov |
| **后端测试** | Jest 单元测试 (依赖 MySQL 服务) + 覆盖率上传 |
| **安全扫描** | npm audit 依赖漏洞检查 |
| **构建检查** | Vite 生产构建验证 |
| **端到端测试** | Playwright 浏览器自动化测试 |

### CI/CD 技术栈

| 技术 | 用途 |
|------|------|
| [GitHub Actions](https://github.com/features/actions) | CI/CD 自动化平台 |
| [Codecov](https://about.codecov.io/) | 代码覆盖率报告托管 |
| [MySQL Docker](https://hub.docker.com/_/mysql) | CI 环境中的测试数据库 |
| [npm audit](https://docs.npmjs.com/cli/commands/npm-audit) | 依赖安全审计 |

### 部署相关

| 技术 | 用途 |
|------|------|
| Vite 生产构建 | 代码压缩、Tree Shaking、代码分割 |
| 环境变量配置 | .env.development / .env.production |
| 代理配置 | 开发环境 API 代理转发 |

---

## 安全与监控

### 安全措施

| 技术 | 说明 |
|------|------|
| Helmet | 设置安全 HTTP 响应头 (CSP、HSTS、X-Frame-Options 等) |
| CORS | 限制跨域请求来源 |
| Rate Limiting | 防止 API 滥用和暴力攻击 |
| express-validator | 输入验证和清理，防止注入攻击 |
| bcryptjs | 密码安全哈希存储 |
| JWT | 无状态认证，支持 Token 过期和刷新 |

### 监控与日志

| 技术 | 说明 |
|------|------|
| Winston | 结构化应用日志，支持文件和控制台输出 |
| Morgan | HTTP 访问日志 |
| Prometheus Client | 暴露 /metrics 端点，支持性能指标采集 |
| Request ID | 请求链路追踪 |
| Audit Logger | 审计日志记录 |

---

## 开发工具

### 推荐 IDE

- [VS Code](https://code.visualstudio.com/) + Volar (Vue 官方插件)
- [Trae IDE](https://www.trae.ai/) (AI 驱动的智能 IDE)

### VS Code 插件

| 插件 | 用途 |
|------|------|
| Volar | Vue 3 官方语言支持 |
| ESLint | 实时代码检查 |
| Prettier | 代码格式化 |
| TypeScript Importer | 自动导入类型 |

### 开发命令

```bash
# 前端开发
npm run dev              # 启动开发服务器 (Vite)
npm run build            # 生产构建
npm run lint             # 代码检查
npm run lint:fix         # 自动修复代码问题
npm run format           # 格式化代码

# 后端开发
cd server
npm run dev              # 启动开发服务器 (tsx watch)
npm run build            # TypeScript 编译
npm run typecheck        # 类型检查
npm run lint             # 代码检查
npm run db:init          # 初始化数据库
npm run db:seed          # 填充种子数据
npm run db:reset         # 重置数据库
```

---

## 项目结构

```
star-citizen-promotion/
├── .github/workflows/     # GitHub Actions CI/CD 配置
├── server/                # 后端服务
│   ├── src/
│   │   ├── config/        # 应用配置
│   │   ├── database/      # 数据库连接和迁移
│   │   ├── middleware/    # Express 中间件
│   │   ├── routes/        # API 路由
│   │   ├── services/      # 业务逻辑层
│   │   ├── utils/         # 工具函数
│   │   ├── index.ts       # 应用入口
│   │   └── websocket.ts   # WebSocket 服务
│   ├── tests/             # 测试文件
│   ├── package.json       # 后端依赖
│   └── tsconfig.json      # TypeScript 配置
├── src/                   # 前端源码
│   ├── components/        # Vue 组件
│   ├── views/             # 页面视图
│   ├── router/            # 路由配置
│   ├── stores/            # 状态管理
│   ├── services/          # API 服务
│   └── assets/            # 静态资源
├── package.json           # 前端依赖
├── vite.config.js         # Vite 配置
└── TECH_STACK.md          # 本文件
```

---

## 技术选型理由

### 为什么选择 Vue 3？
- 渐进式框架，学习曲线平缓
- Composition API 提供优秀的逻辑复用能力
- 性能优异，包体积小
- 生态系统成熟，社区活跃

### 为什么选择 Express.js？
- Node.js 生态最成熟的 Web 框架
- 中间件机制灵活，扩展性强
- 适合构建 RESTful API
- 与 TypeScript 集成良好

### 为什么选择 MySQL？
- 成熟稳定的关系型数据库
- 良好的事务支持
- 与 Node.js 生态集成完善 (mysql2)
- 适合结构化业务数据存储

### 为什么选择 TypeScript？
- 静态类型检查，减少运行时错误
- 优秀的 IDE 支持，提升开发效率
- 便于代码重构和维护
- 企业级项目的标准选择

---

## 版本兼容性

| 环境 | 版本要求 |
|------|----------|
| Node.js | ^20.19.0 \|\| >=22.12.0 |
| npm | >=10.0.0 |
| MySQL | 8.0+ |
| 浏览器 | Chrome 90+, Firefox 88+, Safari 14+ |

---

*本文档最后更新于 2026-05-07*
