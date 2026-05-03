# 技术优化文档

> 本文档记录项目上线前的技术优化计划、安全加固方案和运维完善建议。
> 基于企业级生产标准，从安全性、性能、运维、DevOps 四大维度制定。

## 目录

- [严重问题（必须修复）](#严重问题必须修复)
- [高优先级问题](#高优先级问题)
- [中等优先级问题](#中等优先级问题)
- [上线前检查清单](#上线前检查清单)
- [优化实施计划](#优化实施计划)

---

## 严重问题（必须修复）

### 1. 认证中间件缺失

**问题描述：**

`server/src/routes/auth.js` 第 12 行导入了 `authenticate` 中间件：

```javascript
import { authenticate } from '../middleware/auth.js'
```

但 `server/src/middleware/` 目录下**不存在 `auth.js` 文件**，仅有：
- `errorHandler.js`
- `requestLogger.js`

**影响范围：**

所有依赖 `authenticate` 的路由（如 `/api/auth/me`）将抛出 `Cannot find module` 错误，导致用户无法获取个人信息、访问受保护资源。

**根因分析：**

根据提交历史 `3f1311d fix: simplify ESLint config for better CI compatibility`，ESLint 配置简化后，此文件可能在此过程中被误删或从未提交。

**修复方案：**

创建 `server/src/middleware/auth.js`，实现以下功能：

```javascript
/**
 * @file 认证授权中间件
 * @description JWT 令牌验证、角色鉴权
 * @module server/middleware/auth
 */

import { verifyToken } from '../utils/jwt.js'
import { ApiError } from './errorHandler.js'
import { queryOne } from '../database/pool.js'

/**
 * 验证 JWT 令牌
 * @description 从 Authorization header 提取并验证 Bearer token
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('缺少认证令牌')
  }

  const token = authHeader.substring(7)

  try {
    const decoded = verifyToken(token)
    req.user = { id: decoded.userId }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('令牌已过期')
    }
    throw ApiError.unauthorized('无效的认证令牌')
  }
}

/**
 * 可选认证
 * @description 即使未携带令牌也不报错，用于公开接口的增强验证
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  const token = authHeader.substring(7)

  try {
    const decoded = verifyToken(token)
    req.user = { id: decoded.userId }
  } catch (err) {
    // 忽略验证错误，继续处理请求
  }

  next()
}

/**
 * 角色鉴权中间件工厂
 * @param {string|string[]} allowedRoles - 允许的角色列表
 */
export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('请先登录')
    }

    const user = await queryOne(
      'SELECT role FROM users WHERE id = ?',
      [req.user.id]
    )

    if (!user) {
      throw ApiError.unauthorized('用户不存在')
    }

    if (!allowedRoles.includes(user.role)) {
      throw ApiError.forbidden('权限不足，无权访问此资源')
    }

    req.user.role = user.role
    next()
  }
}
```

**验证方法：**

```bash
cd server
npm test
# 确保 auth 相关测试全部通过
```

---

### 2. 生产环境 JWT_SECRET 默认值风险

**问题描述：**

`server/src/config/index.js` 第 25 行：

```javascript
jwt: {
  secret: process.env.JWT_SECRET || 'star-citizen-secret-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
}
```

**风险分析：**

| 场景 | 风险 |
|:-----|:-----|
| 生产环境未设置 `JWT_SECRET` | 使用弱默认密钥，攻击者可伪造任意令牌 |
| 开发者本地未设置 | 与生产环境使用相同密钥，本地泄露导致生产沦陷 |
| `.env.example` 包含示例密钥 | 新开发者直接复制使用，未修改即为弱密钥 |

**修复方案：**

```javascript
// server/src/config/index.js

const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development'
dotenv.config({ path: join(__dirname, '../../', envFile) })

// 生产环境强制要求关键环境变量
if (config.nodeEnv === 'production') {
  const requiredVars = ['JWT_SECRET', 'DB_PASSWORD']
  const missing = requiredVars.filter(v => !process.env[v])

  if (missing.length > 0) {
    throw new Error(
      `FATAL: Missing required production environment variables: ${missing.join(', ')}`
    )
  }

  // 生产环境禁止使用默认密钥
  if (process.env.JWT_SECRET === 'star-citizen-secret-key-change-in-production') {
    throw new Error('FATAL: JWT_SECRET must be changed from default value in production')
  }
}

export const config = {
  jwt: {
    secret: process.env.JWT_SECRET,  // 不再提供默认值
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  }
  // ...
}
```

**同时更新 `.env.example`：**

```bash
# .env.example（仅作为模板，密钥留空）
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# ⚠️ 重要：生产环境必须设置以下变量
JWT_SECRET=                   # 生产环境必须设置强密钥（至少 32 字符）
JWT_EXPIRES_IN=7d
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=                 # 生产环境必须设置
DB_NAME=star_citizen_promotion
```

---

### 3. 多处 JWT 密钥定义

**问题描述：**

| 文件 | 问题 |
|:-----|:-----|
| `server/src/config/index.js` | 定义 `config.jwt.secret` |
| `server/src/utils/jwt.js` | 定义独立的 `jwt.js` 工具函数，可能使用不同密钥 |
| `server/src/routes/auth.js` | 直接导入 `jsonwebtoken` 签名，未统一使用 `config.jwt` |

**风险：** 密钥来源不统一，刷新令牌、验证令牌的逻辑分散，容易出现不一致。

**修复方案：**

统一 `server/src/utils/jwt.js`，所有 JWT 操作必须通过此模块：

```javascript
/**
 * @file JWT 工具模块
 * @description 统一的 JWT 签发与验证，所有 JWT 操作必须通过此模块
 * @module server/utils/jwt
 */

import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'

/**
 * 签发访问令牌
 * @param {Object} payload - 令牌载荷
 * @param {string} payload.userId - 用户 ID
 * @returns {string} JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    issuer: 'star-citizen-api',
    subject: payload.userId,
    expiresIn: config.jwt.expiresIn
  })
}

/**
 * 验证令牌
 * @param {string} token - JWT token
 * @returns {Object} 解码后的 payload
 * @throws {Error} 令牌无效或已过期
 */
export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret, {
    issuer: 'star-citizen-api'
  })
}

/**
 * 解码令牌（不验证）
 * @param {string} token - JWT token
 * @returns {Object|null} 解码结果或 null
 */
export function decodeToken(token) {
  return jwt.decode(token)
}
```

然后 `server/src/routes/auth.js` 中删除直接使用 `jsonwebtoken` 的代码，改为：

```javascript
import { generateToken, verifyToken } from '../utils/jwt.js'
// 删除: import jwt from 'jsonwebtoken'
```

---

## 高优先级问题

### 4. 生产环境 CORS 域名白名单

**问题描述：**

`server/src/index.js` 中 CORS 配置：

```javascript
app.use(cors({
  origin: config.frontendUrl,  // 可能被设置为 localhost
  credentials: true
}))
```

**风险：** 如果生产环境 `FRONTEND_URL` 仍为 `http://localhost:3000`，则任何网站都能调用 API。

**修复方案：**

```javascript
// server/src/config/index.js
const corsOptions = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}

if (config.nodeEnv === 'production') {
  // 生产环境从环境变量读取域名白名单，逗号分隔
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [config.frontendUrl]

  corsOptions.origin = (origin, callback) => {
    // 允许没有 origin 的请求（如移动端或 curl）
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`))
    }
  }
} else {
  corsOptions.origin = config.frontendUrl
}

app.use(cors(corsOptions))
```

`.env.production` 添加：

```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

### 5. 清理 console.log 替换为 Winston

**问题描述：**

多个文件直接使用 `console.log`：

| 文件 | 行数 |
|:-----|:-----|
| `server/src/database/pool.js` | ~3 处 |
| `server/src/database/init.js` | ~2 处 |
| `server/src/index.js` | ~2 处 |

**风险：** 生产环境 stdout 无法追溯，且无法统一控制日志级别。

**修复方案：**

创建统一的日志模块 `server/src/utils/logger.js`（如不存在），或确保使用现有模块：

```javascript
// server/src/utils/logger.js（如果已存在，确保被使用）
import winston from 'winston'
import { config } from '../config/index.js'

const { combine, timestamp, printf, colorize, errors, json } = winston.format

const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let log = `${timestamp} [${level}]: ${message}`
  if (Object.keys(metadata).length > 0) {
    log += ` ${JSON.stringify(metadata)}`
  }
  if (stack) {
    log += `\n${stack}`
  }
  return log
})

const jsonFormat = combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), json())
const consoleFormat = combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), colorize({ all: true }), errors({ stack: true }), logFormat)

const logger = winston.createLogger({
  level: config.logging?.level || 'info',
  defaultMeta: { service: 'star-citizen-api' },
  transports: [
    new winston.transports.Console({
      format: config.nodeEnv === 'production' ? jsonFormat : consoleFormat
    })
  ]
})

if (config.logging?.file?.enabled) {
  logger.add(new winston.transports.File({
    filename: config.logging.file.error || 'logs/error.log',
    level: 'error',
    format: jsonFormat
  }))
  logger.add(new winston.transports.File({
    filename: config.logging.file.combined || 'logs/combined.log',
    format: jsonFormat
  }))
}

export default logger
```

然后替换所有 `console.log`/`console.error`：

```javascript
// 替换前
console.log('📦 MySQL 连接池创建成功')

// 替换后
import logger from '../utils/logger.js'
logger.info('MySQL 连接池创建成功', { host, port, database })
```

**特别注意：** `errorHandler.js` 中的 `console.error` 需区分环境：

```javascript
if (config.nodeEnv !== 'production') {
  console.error('❌ 错误:', err.message, err.stack)
} else {
  logger.error('请求错误', { message: err.message, url: req.url, method: req.method })
}
```

---

### 6. 完善健康检查端点

**问题描述：**

当前健康检查仅返回 `ok` 状态，不检查依赖项：

```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: ..., uptime: ... })
})
```

**风险：** 负载均衡器或 Kubernetes 无法感知后端真实健康状态，可能将请求路由到已崩溃的实例。

**修复方案：**

```javascript
import { query } from './database/pool.js'
import os from 'os'

const healthCheck = async (req, res) => {
  const checks = {
    database: false,
    memory: false
  }

  try {
    await query('SELECT 1')
    checks.database = true
  } catch (err) {
    checks.database = false
  }

  const memUsage = process.memoryUsage()
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
  }
  checks.memory = memUsageMB.heapUsed < memUsageMB.heapTotal * 0.9

  const allHealthy = Object.values(checks).every(Boolean)

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    checks
  })
}

app.get('/health', healthCheck)
app.get('/health/live', (req, res) => res.json({ status: 'ok' }))   // Liveness probe
app.get('/health/ready', healthCheck)                                // Readiness probe
```

---

### 7. 实现 Refresh Token 机制

**问题描述：**

`src/services/http.js` 中有刷新令牌的逻辑：

```javascript
async function refreshToken() {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, { ... })
}
```

但后端**没有 `/api/auth/refresh` 端点**，且 `http.js` 中的 `refreshToken` 函数体不完整（读取的文件被截断）。

**影响：** JWT 过期后用户需重新登录，体验差且增加服务器负担。

**修复方案（简化版 — 延长 JWT 有效期）：**

如果暂不实现完整的 refresh token 机制，可先将 JWT 有效期延长到合理范围：

```javascript
// server/src/config/index.js
jwt: {
  expiresIn: process.env.JWT_EXPIRES_IN || '30d'  // 从 7d 改为 30d
}
```

**修复方案（完整版 — HTTP-only Cookie Refresh Token）：**

1. 后端添加 refresh token 表：

```sql
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token_hash (token_hash)
);
```

2. 后端添加 `/api/auth/refresh` 端点：

```javascript
// server/src/routes/auth.js
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken

  if (!refreshToken) {
    throw ApiError.unauthorized('缺少刷新令牌')
  }

  // 验证 refresh token
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
  const stored = await queryOne(
    'SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()',
    [tokenHash]
  )

  if (!stored) {
    throw ApiError.unauthorized('刷新令牌无效或已过期')
  }

  // 生成新的 access token
  const newAccessToken = generateToken({ userId: stored.user_id })

  res.json({
    success: true,
    data: { token: newAccessToken }
  })
})
```

3. 前端 `http.js` 实现完整的令牌刷新逻辑（待文件完整读取后补充）

---

### 8. CI/CD 添加 E2E 测试

**问题描述：**

`.github/workflows/ci.yml` 仅包含：
- Lint
- Frontend unit test
- Backend unit test

缺少 Playwright E2E 测试。

**修复方案：**

在 `ci.yml` 中添加 E2E job：

```yaml
test-e2e:
  name: E2E 测试
  runs-on: ubuntu-latest
  needs: build
  if: github.event_name == 'pull_request'

  steps:
    - name: 检出代码
      uses: actions/checkout@v4

    - name: 设置 Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: 安装依赖
      run: npm ci

    - name: 安装 Playwright 浏览器
      run: npx playwright install --with-deps chromium

    - name: 启动后端服务
      run: |
        cd server
        npm ci
        npm run dev &
        sleep 5

    - name: 启动前端服务
      run: npm run dev &

    - name: 运行 E2E 测试
      run: npm run test:e2e

    - name: 上传测试结果
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report
        path: playwright-report/
```

---

## 中等优先级问题

### 9. 分页机制缺失

**问题描述：** `GET /api/members`、`GET /api/projects` 等接口返回全量数据。

**修复方案：** 创建分页中间件 `server/src/middleware/pagination.js`：

```javascript
export function paginate(defaultLimit = 20, maxLimit = 100) {
  return (req, res, next) => {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit) || defaultLimit))
    const offset = (page - 1) * limit

    req.pagination = { page, limit, offset }
    next()
  }
}
```

### 10. 请求 ID 全链路追踪

**修复方案：** 创建 `server/src/middleware/requestId.js`：

```javascript
import { randomUUID } from 'crypto'
import logger from '../utils/logger.js'

export function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || randomUUID()
  req.id = id
  res.setHeader('X-Request-ID', id)
  logger.info('请求开始', { requestId: id, method: req.method, url: req.url })
  next()
}
```

### 11. 数据库连接池断线重连

**修复方案：** 在 `pool.js` 的 `createPool` 后添加心跳：

```javascript
setInterval(async () => {
  try {
    const [rows] = await pool.execute('SELECT 1')
  } catch (err) {
    logger.error('数据库心跳检测失败，准备重连', { error: err.message })
    pool.end()
    await createPool()
  }
}, 30000)
```

---

## 上线前检查清单

### 必检项（阻断发布）

| 序号 | 检查项 | 检查方法 | 通过标准 |
|:----:|:-------|:---------|:---------|
| 1 | `server/src/middleware/auth.js` 存在 | `ls server/src/middleware/auth.js` | 文件存在且可导入 |
| 2 | 生产环境 `JWT_SECRET` 已设置 | `echo $JWT_SECRET` | 长度 ≥32 字符，非默认值 |
| 3 | `authenticate` 中间件测试通过 | `cd server && npm test` | 所有 auth 相关用例通过 |
| 4 | CORS 生产域名配置正确 | 检查 `ALLOWED_ORIGINS` | 不含 localhost |
| 5 | 健康检查端点返回 200 | `curl /health` | 包含 db 和 memory 检查 |
| 6 | 无 `console.log` 遗留（生产） | `grep -r "console.log" server/src` | 仅允许 errorHandler 中有条件输出 |

### 功能验证

| 序号 | 检查项 | 检查方法 |
|:----:|:-------|:---------|
| 7 | 注册 → 登录 → 获取用户信息 全流程 | API 测试脚本 |
| 8 | 受保护路由无令牌返回 401 | `curl /api/auth/me` |
| 9 | 错误响应格式统一 | `success: false, error: { code, message }` |
| 10 | 请求体超限返回 413 | 上传 >10kb JSON |

### 性能与安全

| 序号 | 检查项 | 检查方法 | 通过标准 |
|:----:|:-------|:---------|:---------|
| 11 | API 限流生效 | `ab -n 150 -c 10 /api/members` | 第 101 次请求返回 429 |
| 12 | SQL 注入防护 | `GET /api/milembers?username=' OR 1=1 --` | 返回 400 或空结果 |
| 13 | Helmet 安全头设置 | `curl -I /api/health` | 包含 `X-Content-Type-Options`, `X-Frame-Options` |
| 14 | 密码不在响应中返回 | `POST /api/auth/login` 响应 | 无 `password`, `password_hash` 字段 |

### 运维验证

| 序号 | 检查项 | 检查方法 |
|:----:|:-------|:---------|
| 15 | Graceful shutdown | `kill -SIGTERM <pid>` 检查日志 |
| 16 | 日志文件写入 | `tail -f logs/combined.log` |
| 17 | Docker 启动正常 | `docker-compose up -d` |
| 18 | 环境变量分离 | `.env.production` 不提交到仓库 |

---

## 优化实施计划

### 第一阶段：安全修复（1-2 天）

| 序号 | 任务 | 预计工时 | 依赖 |
|:----:|:-----|:---------|:-----|
| 1.1 | 创建 `server/src/middleware/auth.js` | 2h | 无 |
| 1.2 | 生产环境 JWT_SECRET 强制校验 | 1h | 1.1 |
| 1.3 | 统一 JWT 工具模块 | 1h | 1.1 |
| 1.4 | CORS 生产域名白名单 | 1h | 无 |
| 1.5 | 安全验证测试 | 2h | 1.1-1.4 |

### 第二阶段：稳定性加固（2-3 天）

| 序号 | 任务 | 预计工时 | 依赖 |
|:----:|:-----|:---------|:-----|
| 2.1 | 完善健康检查端点 | 2h | 无 |
| 2.2 | 数据库断线重连机制 | 1h | 无 |
| 2.3 | 替换 console.log 为 Winston | 2h | 无 |
| 2.4 | 请求 ID 追踪中间件 | 1h | 无 |
| 2.5 | 错误日志环境区分 | 1h | 无 |

### 第三阶段：功能完善（3-5 天）

| 序号 | 任务 | 预计工时 | 依赖 |
|:----:|:-----|:---------|:-----|
| 3.1 | 实现 Refresh Token | 4h | 1.1-1.3 |
| 3.2 | 添加 API 分页 | 3h | 无 |
| 3.3 | 认证接口单独限流 | 2h | 无 |
| 3.4 | 完善 E2E 测试 | 3h | 1.1 |
| 3.5 | CI/CD E2E job | 2h | 3.4 |

### 第四阶段：上线准备（2-3 天）

| 序号 | 任务 | 预计工时 | 依赖 |
|:----:|:-----|:---------|:-----|
| 4.1 | 生产环境配置文档 | 1h | 无 |
| 4.2 | 压力测试 | 4h | 阶段 1-3 |
| 4.3 | 安全扫描 (npm audit, OWASP) | 2h | 无 |
| 4.4 | 备份策略文档 | 2h | 无 |
| 4.5 | 监控告警配置 (Sentry) | 3h | 无 |

**总预计工时：约 10-16 小时**

---

## 附录

### A. 环境变量完整清单（生产环境）

| 变量名 | 必填 | 示例值 | 说明 |
|:-------|:----:|:-------|:-----|
| `NODE_ENV` | ✅ | `production` | 运行环境 |
| `PORT` | ✅ | `3001` | 后端服务端口 |
| `FRONTEND_URL` | ✅ | `https://yourdomain.com` | 前端域名 |
| `ALLOWED_ORIGINS` | ✅ | `https://yourdomain.com` | CORS 白名单 |
| `JWT_SECRET` | ✅ | `随机 32+ 字符` | JWT 签名密钥 |
| `JWT_EXPIRES_IN` | ❌ | `30d` | JWT 有效期 |
| `DB_HOST` | ✅ | `localhost` 或 `mysql.prod` | 数据库地址 |
| `DB_PORT` | ❌ | `3306` | 数据库端口 |
| `DB_USER` | ✅ | `app_user` | 数据库用户名 |
| `DB_PASSWORD` | ✅ | `强密码` | 数据库密码 |
| `DB_NAME` | ✅ | `star_citizen_prod` | 数据库名 |
| `BCRYPT_SALT_ROUNDS` | ❌ | `12` | 密码加密强度 |
| `RATE_LIMIT_WINDOW_MS` | ❌ | `900000` | 限流窗口（ms） |
| `RATE_LIMIT_MAX` | ❌ | `100` | 限流最大请求数 |

### B. 相关文档

- [ARCHITECTURE.md](ARCHITECTURE.md) — 系统架构设计
- [CONFIG.md](CONFIG.md) — 配置参数说明
- [API.md](API.md) — API 接口文档
- [QUALITY_STANDARDS.md](QUALITY_STANDARDS.md) — 质量保证标准
- [DEVELOPMENT.md](DEVELOPMENT.md) — 开发指南

---

*本文档版本: v1.0.0*
*创建日期: 2026-05-03*
*最后更新: 2026-05-03*
