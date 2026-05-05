# 技术栈文档

> 本文档详细列出项目使用的所有技术、框架、工具和库，以及选型理由。

---

## 前端技术栈

| 技术 | 版本 | 用途 | 选型理由 |
|:-----|:-----|:-----|:---------|
| [Vue.js](https://vuejs.org/) | 3.5 | 渐进式 JavaScript 框架 | 响应式系统、组合式 API、优秀的性能 |
| [Vue Router](https://router.vuejs.org/) | 5.0 | 官方路由管理器 | 与 Vue 深度集成，支持导航守卫 |
| [Vite](https://vitejs.dev/) | 7.3 | 下一代前端构建工具 | 极速冷启动、按需编译、原生 ESM |
| [Vitest](https://vitest.dev/) | 3.0 | 单元测试框架 | Vite 原生集成、Jest 兼容 API |
| [Playwright](https://playwright.dev/) | 1.58 | 端到端测试框架 | 多浏览器支持、自动等待、Trace Viewer |
| [ESLint](https://eslint.org/) | 9.x | 代码质量检查 | 可插拔规则、Vue 插件支持 |
| [@vue/test-utils](https://test-utils.vuejs.org/) | 2.4 | Vue 组件测试工具 | 官方测试工具、组件挂载与交互 |
| [Sentry](https://sentry.io/) | - | 前端错误监控 | 实时错误追踪、性能监控 |

## 后端技术栈

| 技术 | 版本 | 用途 | 选型理由 |
|:-----|:-----|:-----|:---------|
| [Node.js](https://nodejs.org/) | >=20.0 | JavaScript 运行时 | 事件驱动、非阻塞 I/O、丰富生态 |
| [Express.js](https://expressjs.com/) | 4.21 | Web 应用框架 | 轻量灵活、中间件生态丰富 |
| [MySQL2](https://github.com/sidorares/node-mysql2) | 3.12 | MySQL 数据库驱动 | 连接池、Promise API、参数化查询 |
| [Knex.js](https://knexjs.org/) | - | SQL 查询构建器 & 迁移工具 | 链式查询、迁移管理、种子数据 |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | 9.0 | JWT 令牌签发与验证 | 标准 JWT 实现、灵活配置 |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 2.4 | 密码哈希加密 | 纯 JavaScript、无需原生依赖 |
| [Helmet](https://helmetjs.github.io/) | 8.0 | HTTP 安全头设置 | 一键配置安全头、CSP 支持 |
| [Winston](https://github.com/winstonjs/winston) | 3.17 | 企业级结构化日志 | 多级别、多传输、JSON 格式 |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | 7.5 | API 速率限制 | 灵活配置、Store 扩展 |
| [express-validator](https://express-validator.github.io/) | 7.2 | 请求数据校验 | 链式验证、错误格式化 |
| [ws](https://github.com/websockets/ws) | 8.18 | WebSocket 实时通信 | 高性能、广泛使用的 WebSocket 库 |
| [Jest](https://jestjs.io/) | 29.7 | 后端测试框架 | 快照测试、Mock、覆盖率 |
| [Supertest](https://github.com/ladjs/supertest) | 7.0 | HTTP 接口测试 | Express 集成、链式断言 |
| [Prometheus](https://prometheus.io/) | - | 应用性能监控 | 指标收集、Grafana 集成 |
| [Swagger](https://swagger.io/) | - | API 文档自动生成 | OpenAPI 规范、交互式文档 |

## DevOps & 工具链

| 技术 | 版本 | 用途 | 选型理由 |
|:-----|:-----|:-----|:---------|
| [Docker](https://www.docker.com/) | - | 容器化部署 | 环境一致性、快速部署 |
| [Docker Compose](https://docs.docker.com/compose/) | - | 多容器编排 | 开发/生产环境统一配置 |
| [Nginx](https://nginx.org/) | - | 反向代理 & 静态资源服务 | 高性能、负载均衡、SSL 终止 |
| [GitHub Actions](https://github.com/features/actions) | - | CI/CD 自动化 | 与 GitHub 集成、丰富 Marketplace |
| [npm](https://www.npmjs.com/) | >=9.0 | 包管理器 | 标准工具、workspaces 支持 |

## 安全相关

| 技术/措施 | 说明 |
|:----------|:-----|
| JWT 认证 | HS256 签名，含 issuer/subject 声明 |
| bcrypt 哈希 | 可配置 salt rounds（默认 12） |
| Helmet 安全头 | CSP、XSS 保护、HSTS、X-Frame-Options |
| CORS 策略 | 限定前端域名，支持 credentials |
| 速率限制 | 15 分钟窗口内最多 100 次请求 |
| 请求体限制 | JSON 10kb / URL-encoded 10kb |
| SQL 参数化查询 | mysql2 `?` 占位符，防止注入 |
| 敏感数据脱敏 | 日志中密码/Token 显示为 `***REDACTED***` |
| Sentry 错误监控 | 生产环境自动上报异常 |

## 监控与可观测性

| 技术 | 用途 |
|:-----|:-----|
| Prometheus 指标 | HTTP 请求延迟、吞吐量、活跃连接数 |
| Winston 日志 | 结构化日志，支持多级别输出 |
| Sentry | 前端错误追踪、性能监控 |
| 健康检查端点 | `/health/live`、`/health/ready` |

## 技术栈演进

### 已引入（本次企业级改进）

- **Knex.js** — 数据库迁移工具，替代手写迁移脚本
- **JSDoc + TypeScript 检查** — 渐进式类型安全
- **Prometheus** — 应用性能监控
- **Swagger/OpenAPI** — API 文档自动生成
- **Sentry** — 前端错误监控

### 计划引入

- **Redis** — 会话缓存、速率限制存储
- **Elasticsearch** — 日志聚合与搜索
- **Grafana** — 可视化监控仪表盘
