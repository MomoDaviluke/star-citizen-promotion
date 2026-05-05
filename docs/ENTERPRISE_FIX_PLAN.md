# 企业级项目修复计划

> **优先级排序的技术修复文档** — 按严重程度和实施依赖关系排列，每个任务包含具体文件、代码变更和验证步骤。

---

## 总体策略

| 阶段 | 目标 | 预计时间 |
|:-----|:-----|:---------|
| **P0 - 安全加固** | 修复所有安全漏洞，阻断高危风险 | 1-2 天 |
| **P1 - 质量门禁** | 建立代码质量和测试覆盖率门槛 | 1-2 天 |
| **P2 - 架构改进** | 引入类型安全、迁移工具、监控 | 2-3 天 |
| **P3 - 运维增强** | 完善日志、监控、部署流程 | 1-2 天 |

---

## 🔴 P0 - 安全加固（最高优先级）

### P0-1: CI 安全扫描强制阻断构建

**问题**: 安全扫描失败不阻断构建，高危漏洞可被忽略
**文件**: `.github/workflows/ci.yml`
**影响**: 生产环境可能部署带漏洞的代码

**修改步骤**:

1. 移除 `security-scan` 任务的 `continue-on-error: true`
2. 移除 `npm audit` 的 `continue-on-error: true`
3. 将 `security-scan` 加入 `build` 任务的 `needs` 依赖

```yaml
# .github/workflows/ci.yml

  security-scan:
    name: 安全扫描
    runs-on: ubuntu-latest
    # 删除: continue-on-error: true
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 前端安全审计
        run: npm audit --audit-level=high
        # 删除: continue-on-error: true

      - name: 后端安全审计
        working-directory: ./server
        run: npm audit --audit-level=high
        # 删除: continue-on-error: true

      - name: 运行 Snyk 扫描
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  build:
    name: 构建检查
    runs-on: ubuntu-latest
    needs: [lint, test-frontend, test-backend, security-scan]  # 添加 security-scan
    if: always() && needs.lint.result == 'success' && needs.test-frontend.result == 'success' && needs.test-backend.result == 'success' && needs.security-scan.result == 'success'  # 添加安全扫描条件
```

**验证**: 提交一个带已知漏洞的依赖版本，确认 CI 构建失败

---

### P0-2: 开发环境 JWT 密钥强制从环境变量读取

**问题**: 开发环境使用硬编码 JWT 密钥，存在泄露风险
**文件**: `server/src/config/index.js`, `server/.env.example`
**影响**: 密钥泄露可导致令牌伪造

**修改步骤**:

1. 修改配置，开发环境也要求环境变量

```javascript
// server/src/config/index.js

export const config = {
  // ...
  jwt: {
    secret: process.env.JWT_SECRET || (
      nodeEnv === 'test'
        ? 'test-jwt-secret-key'
        : undefined  // 开发环境也必须有环境变量
    ),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  // ...
}
```

2. 更新 `.env.example` 添加开发环境 JWT 密钥说明

```bash
# server/.env.example
# JWT 配置（所有环境必须设置）
JWT_SECRET=your-dev-jwt-secret-min-32-chars-long
```

3. 更新 `validateProductionConfig` 函数，开发环境也校验

```javascript
// server/src/config/index.js

export function validateProductionConfig() {
  const errors = []

  // 所有非 test 环境都必须设置 JWT_SECRET
  if (config.nodeEnv !== 'test' && !process.env.JWT_SECRET) {
    if (config.nodeEnv === 'production') {
      throw new Error(
        'FATAL: JWT_SECRET must be set in production. ' +
        'Please set a strong secret key (at least 32 characters).'
      )
    }
    // 开发环境也警告
    console.warn('⚠️ 警告: JWT_SECRET not set. Using application is insecure.')
    errors.push('JWT_SECRET (not set, application is insecure)')
  }

  if (config.nodeEnv !== 'test' && process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    if (config.nodeEnv === 'production') {
      throw new Error('FATAL: JWT_SECRET must be at least 32 characters in production.')
    }
    console.warn('⚠️ 警告: JWT_SECRET should be at least 32 characters.')
    errors.push('JWT_SECRET (too short, should be >= 32 chars)')
  }

  // ... 其余代码不变
}
```

**验证**: 不设置 `JWT_SECRET` 启动开发服务器，确认有警告输出

---

### P0-3: 开发环境数据库密码强制非空

**问题**: 数据库密码默认为空字符串
**文件**: `server/src/config/index.js`, `server/.env.example`
**影响**: 可能导致未授权数据库访问

**修改步骤**:

```javascript
// server/src/config/index.js

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',  // 保持兼容，但添加校验
    name: process.env.DB_NAME || 'star_citizen_promotion',
    // ...
  }
```

在 `validateProductionConfig` 中添加：

```javascript
  if (config.nodeEnv !== 'test' && !config.database.password) {
    console.warn('⚠️ 警告: DB_PASSWORD not set. Database connection may fail or be insecure.')
    errors.push('DB_PASSWORD')
  }
```

**验证**: 不设置 `DB_PASSWORD` 启动服务器，确认有警告

---

### P0-4: 请求日志敏感信息脱敏

**问题**: 请求日志可能记录密码、Token 等敏感信息
**文件**: `server/src/middleware/requestLogger.js`（新建或修改）
**影响**: 日志泄露导致凭证暴露

**修改步骤**:

创建/修改请求日志中间件，脱敏敏感字段：

```javascript
// server/src/middleware/requestLogger.js

import { v4 as uuidv4 } from 'uuid'
import logger from '../utils/logger.js'

const SENSITIVE_FIELDS = [
  'password', 'passwordHash', 'password_hash',
  'token', 'auth_token', 'refreshToken',
  'secret', 'apiKey', 'api_key',
  'creditCard', 'ssn', 'phone'
]

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body

  const sanitized = {}
  for (const [key, value] of Object.entries(body)) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '***REDACTED***'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeBody(value)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

export function requestLogger(req, res, next) {
  const requestId = req.requestId || uuidv4()
  req.requestId = requestId

  const startTime = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - startTime
    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent')
    }

    // 仅在开发环境记录请求体，且脱敏
    if (process.env.NODE_ENV === 'development' && req.body) {
      logData.body = sanitizeBody(req.body)
    }

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData)
    } else {
      logger.info('HTTP Request', logData)
    }
  })

  next()
}
```

**验证**: 发送包含密码的登录请求，确认日志中密码显示为 `***REDACTED***`

---

## 🟡 P1 - 质量门禁（高优先级）

### P1-1: ESLint 生产构建移除 console/debugger

**问题**: `no-console` 和 `no-debugger` 完全关闭，生产代码可能残留调试语句
**文件**: `eslint.config.js`, `vite.config.js`
**影响**: 性能下降、信息泄露

**修改步骤**:

1. 修改 ESLint 配置，区分开发和生产规则

```javascript
// eslint.config.js

import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

const isProduction = process.env.NODE_ENV === 'production'

export default [
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/node_modules/**']
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    name: 'app/rules',
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'warn',
      'no-unused-vars': 'warn',
      // 生产环境禁止 console/debugger，开发环境警告
      'no-console': isProduction ? 'error' : 'warn',
      'no-debugger': isProduction ? 'error' : 'warn'
    }
  },
  // ... 其余配置不变
]
```

2. 在 Vite 构建配置中添加构建时移除 console

```javascript
// vite.config.js

    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: mode !== 'production',
      // 生产构建移除 console 和 debugger
      esbuild: {
        drop: mode === 'production' ? ['console', 'debugger'] : []
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router']
          }
        }
      }
    }
```

**验证**: 在代码中添加 `console.log`，运行 `npm run build`，确认生产产物中无 console

---

### P1-2: 提高测试覆盖率阈值

**问题**: 覆盖率阈值过低（20%-30%），无法作为质量门禁
**文件**: `vitest.config.js`, `server/jest.config.js`
**影响**: 低质量代码可能通过 CI

**修改步骤**:

1. 前端覆盖率阈值提升至 80%

```javascript
// vitest.config.js

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'tests/', 'src/main.js'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      }
    }
```

2. 后端 Jest 添加覆盖率阈值

```javascript
// server/jest.config.js

export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/index.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  // 添加覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  verbose: true,
  testTimeout: 15000,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
}
```

**验证**: 运行 `npm run test:coverage`，确认低于阈值时构建失败

---

### P1-3: 统一后端 ESLint 规则

**问题**: 后端 ESLint 配置缺少 Vue 插件相关规则，且 `no-console` 规则不一致
**文件**: `server/eslint.config.js`
**影响**: 代码风格不一致

**修改步骤**:

```javascript
// server/eslint.config.js

import js from '@eslint/js'
import globals from 'globals'

const isProduction = process.env.NODE_ENV === 'production'

export default [
  {
    name: 'server/files-to-ignore',
    ignores: ['**/node_modules/**', '**/coverage/**', '**/data/**']
  },
  js.configs.recommended,
  {
    name: 'server/rules',
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': isProduction ? 'error' : 'warn',
      'no-debugger': isProduction ? 'error' : 'warn',
      'prefer-const': 'warn',
      'no-var': 'error'
    }
  },
  {
    name: 'server/parser-options',
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...globals.jest
      }
    }
  }
]
```

**验证**: 在后端代码中添加 `console.log`，运行 `npm run lint`，确认报错

---

## 🟡 P2 - 架构改进（中优先级）

### P2-1: 引入数据库迁移工具（Knex.js）

**问题**: 使用自定义迁移脚本，无版本追踪、无法回滚
**文件**: 新建 `server/knexfile.js`, `server/migrations/` 目录
**影响**: 数据库 schema 变更难以管理

**修改步骤**:

1. 安装依赖

```bash
cd server
npm install knex
npm install -D @types/knex  # 可选，类型支持
```

2. 创建 Knex 配置文件

```javascript
// server/knexfile.js

import { config as appConfig } from './src/config/index.js'

const dbConfig = {
  client: 'mysql2',
  connection: {
    host: appConfig.database.host,
    port: appConfig.database.port,
    user: appConfig.database.user,
    password: appConfig.database.password,
    database: appConfig.database.name
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: './seeds'
  },
  pool: {
    min: 2,
    max: 10
  }
}

export default {
  development: dbConfig,
  production: dbConfig,
  test: {
    ...dbConfig,
    connection: {
      ...dbConfig.connection,
      database: 'test_db'
    }
  }
}
```

3. 添加 npm 脚本

```json
// server/package.json

"scripts": {
  // ... 现有脚本
  "db:migrate": "knex migrate:latest",
  "db:migrate:rollback": "knex migrate:rollback",
  "db:migrate:status": "knex migrate:status",
  "db:seed": "knex seed:run",
  "db:make:migration": "knex migrate:make",
  "db:make:seed": "knex seed:make"
}
```

4. 将现有迁移脚本转换为 Knex 迁移文件

```javascript
// server/migrations/20240101000001_create_users_table.js

export async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'))
    table.string('username', 50).notNullable().unique()
    table.string('email', 255).notNullable().unique()
    table.string('password_hash', 255).notNullable()
    table.enum('role', ['admin', 'member', 'pilot']).defaultTo('member')
    table.timestamps(true, true)
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('users')
}
```

**验证**: 运行 `npm run db:migrate:status`，确认迁移系统正常工作

---

### P2-2: 引入 JSDoc 类型检查

**问题**: 纯 JavaScript 项目缺少类型安全
**文件**: `jsconfig.json`, 各源文件
**影响**: 运行时类型错误难以发现

**修改步骤**:

1. 在 `jsconfig.json` 中启用类型检查

```json
// jsconfig.json

{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    // 启用类型检查
    "checkJs": true,
    "strict": true,
    "noImplicitAny": false,  // 渐进式启用
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

2. 为关键服务添加 JSDoc 类型注释（示例）

```javascript
// src/services/http.js

/**
 * HTTP 响应数据
 * @typedef {Object} ApiResponse
 * @property {boolean} success - 请求是否成功
 * @property {Object} [data] - 响应数据
 * @property {Object} [error] - 错误信息
 */

/**
 * HTTP 请求客户端
 * @param {string} endpoint - API 端点路径
 * @param {RequestInit} options - 请求选项
 * @returns {Promise<ApiResponse>} 响应数据
 */
async function http(endpoint, options = {}) {
  // ... 现有实现
}
```

3. 添加类型检查脚本

```json
// package.json

"scripts": {
  // ... 现有脚本
  "typecheck": "tsc --noEmit -p jsconfig.json"
}
```

**验证**: 运行 `npm run typecheck`，确认无类型错误

---

### P2-3: Dockerfile 包含前端构建产物

**问题**: 生产镜像缺少前端静态文件
**文件**: `Dockerfile`, `docker-compose.yml`
**影响**: 部署后前端无法访问

**修改步骤**:

```dockerfile
# Dockerfile

# ===== 前端构建阶段 =====
FROM node:22-alpine AS frontend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ===== 后端构建阶段 =====
FROM node:22-alpine AS backend-builder

WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/ ./

# ===== 生产阶段 =====
FROM node:22-alpine AS production

WORKDIR /app

# 安装 wget 用于健康检查
RUN apk add --no-cache wget

# 复制后端代码
COPY --from=backend-builder /app/server ./server

# 复制前端构建产物
COPY --from=frontend-builder /app/dist ./dist

# 创建数据目录
RUN mkdir -p /app/server/data

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001
ENV STATIC_FILES_PATH=/app/dist

# 暴露端口
EXPOSE 3001

# 启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]
```

修改后端入口，添加静态文件服务：

```javascript
// server/src/index.js

import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 在生产环境提供前端静态文件
if (config.nodeEnv === 'production') {
  const staticPath = process.env.STATIC_FILES_PATH || path.join(__dirname, '../../dist')
  app.use(express.static(staticPath))

  // SPA 路由回退
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
      res.sendFile(path.join(staticPath, 'index.html'))
    }
  })
}
```

**验证**: 构建 Docker 镜像，访问前端页面确认正常

---

## 🟢 P3 - 运维增强（低优先级）

### P3-1: 添加 Prometheus 指标端点

**问题**: 缺少应用性能监控指标
**文件**: 新建 `server/src/middleware/metrics.js`
**影响**: 无法监控应用健康状况

**修改步骤**:

1. 安装依赖

```bash
cd server
npm install prom-client
```

2. 创建指标中间件

```javascript
// server/src/middleware/metrics.js

import client from 'prom-client'

const register = new client.Registry()

client.collectDefaultMetrics({ register })

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP 请求处理时间（秒）',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
})

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'HTTP 请求总数',
  labelNames: ['method', 'route', 'status_code']
})

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: '当前活跃连接数'
})

register.registerMetric(httpRequestDuration)
register.registerMetric(httpRequestTotal)
register.registerMetric(activeConnections)

export function metricsMiddleware(req, res, next) {
  const start = Date.now()
  activeConnections.inc()

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    const route = req.route?.path || req.path

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    )
    httpRequestTotal.inc({ method: req.method, route, status_code: res.statusCode })
    activeConnections.dec()
  })

  next()
}

export function metricsEndpoint(req, res) {
  res.set('Content-Type', register.contentType)
  res.end(register.metrics())
}

export default register
```

3. 在入口文件注册

```javascript
// server/src/index.js

import { metricsMiddleware, metricsEndpoint } from './middleware/metrics.js'

app.use(metricsMiddleware)
app.get('/metrics', metricsEndpoint)
```

**验证**: 访问 `/metrics` 端点，确认返回 Prometheus 格式指标

---

### P3-2: 添加 Swagger API 文档

**问题**: API 文档手动维护，易与代码不同步
**文件**: 新建 `server/src/config/swagger.js`
**影响**: 文档准确性无法保证

**修改步骤**:

1. 安装依赖

```bash
cd server
npm install swagger-jsdoc swagger-ui-express
```

2. 创建 Swagger 配置

```javascript
// server/src/config/swagger.js

import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Star Citizen Promotion API',
      version: '1.0.0',
      description: '星际公民战队宣传网站 API 文档'
    },
    servers: [
      { url: '/api/v1', description: 'V1 API' },
      { url: '/api', description: '兼容 API' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/middleware/*.js']
}

const specs = swaggerJsdoc(options)

export function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }'
  }))

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(specs)
  })
}

export default specs
```

3. 在路由中添加 JSDoc 注释（示例）

```javascript
// server/src/routes/auth.js

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: 用户注册
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: 注册成功
 *       409:
 *         description: 用户已存在
 */
router.post('/register', validateRegister, register)
```

**验证**: 访问 `/api-docs`，确认文档页面正常显示

---

### P3-3: 前端错误监控集成（Sentry）

**问题**: 生产环境 JavaScript 错误无法追踪
**文件**: `src/main.js`, `src/services/errorReporting.js`（新建）
**影响**: 线上问题难以定位

**修改步骤**:

1. 安装依赖

```bash
npm install @sentry/vue @sentry/browser
```

2. 创建错误报告服务

```javascript
// src/services/errorReporting.js

import * as Sentry from '@sentry/vue'
import { BrowserTracing } from '@sentry/browser'

export function initErrorReporting(app, router) {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      app,
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new BrowserTracing({
          routingInstrumentation: Sentry.vueRouterInstrumentation(router)
        })
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1.0
    })
  }
}

export function captureException(error, context = {}) {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, { extra: context })
  } else {
    console.error('Error captured:', error, context)
  }
}

export function captureMessage(message, level = 'info') {
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, level)
  }
}
```

3. 在 main.js 中初始化

```javascript
// src/main.js

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initErrorReporting } from './services/errorReporting.js'

const app = createApp(App)

app.use(router)
initErrorReporting(app, router)

app.mount('#app')
```

**验证**: 在代码中故意抛出一个错误，确认 Sentry 收到报告

---

## 实施检查清单

### P0 安全加固
- [ ] CI 安全扫描强制阻断
- [ ] JWT 密钥环境变量强制
- [ ] 数据库密码非空校验
- [ ] 请求日志脱敏

### P1 质量门禁
- [ ] ESLint 生产构建移除 console
- [ ] 测试覆盖率阈值 80%
- [ ] 后端 ESLint 规则统一

### P2 架构改进
- [ ] Knex.js 迁移工具引入
- [ ] JSDoc 类型检查启用
- [ ] Dockerfile 包含前端产物

### P3 运维增强
- [ ] Prometheus 指标端点
- [ ] Swagger API 文档
- [ ] Sentry 错误监控

---

## 附录：快速修复脚本

```bash
#!/bin/bash
# 一键运行所有自动修复

set -e

echo "🔧 运行 ESLint 自动修复..."
npm run lint:fix
cd server && npm run lint:fix && cd ..

echo "🧪 运行测试..."
npm test
cd server && npm test && cd ..

echo "🔒 安全审计..."
npm audit fix
cd server && npm audit fix && cd ..

echo "✅ 修复完成"
```
