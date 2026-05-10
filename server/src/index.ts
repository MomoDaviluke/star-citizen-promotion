/**
 * @file 后端服务入口
 * @description Express 服务器启动和配置
 * @module server/index
 */

import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import { rateLimit } from 'express-rate-limit'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server } from 'node:http'

import { config } from './config/index.js'
import { setupSwagger } from './config/swagger.js'
import { initDatabase, closePool } from './database/init.js'
import { query } from './database/pool.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/requestLogger.js'
import { requestId } from './middleware/requestId.js'
import { auditLogger, startAuditCleanupJob } from './middleware/auditLogger.js'
import { metricsMiddleware, metricsEndpoint } from './middleware/metrics.js'
import { startWebSocket, closeWebSocket } from './websocket.js'

import authRoutes from './routes/auth.js'
import memberRoutes from './routes/members.js'
import projectRoutes from './routes/projects.js'
import applicationRoutes from './routes/applications.js'
import statsRoutes from './routes/stats.js'
import pilotRoutes from './routes/pilots.js'
import fleetRoutes from './routes/fleet.js'
import eventRoutes from './routes/events.js'
import settingsRoutes from './routes/settings.js'
import adminRoutes from './routes/admin.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

/**
 * 安全中间件配置
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", config.frontendUrl, 'ws:', 'wss:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}))

/**
 * CORS 配置
 */
const corsOptions: cors.CorsOptions = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}

if (config.nodeEnv === 'production') {
  corsOptions.origin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || config.cors.allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`))
    }
  }
} else {
  corsOptions.origin = config.frontendUrl
}

app.use(cors(corsOptions))

/**
 * 响应压缩中间件
 */
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) return false
    return compression.filter(req, res)
  }
}))

/**
 * 请求 ID 追踪
 */
app.use(requestId)

/**
 * 请求体解析
 */
app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: true, limit: '100kb' }))
app.use(cookieParser())

/**
 * 请求日志
 */
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'))
  app.use(requestLogger)
}

/**
 * Prometheus 指标收集
 */
app.use(metricsMiddleware)

/**
 * API 速率限制
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: (req: Request) => {
    const user = (req as Request & { user?: { role: string } }).user
    if (user?.role === 'admin') return 1000
    return config.rateLimit.max
  },
  keyGenerator: (req: Request) => {
    const user = (req as Request & { user?: { id: string } }).user
    return user?.id || req.ip || 'unknown'
  },
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
})
app.use('/api/', apiLimiter)

/**
 * 认证端点严格速率限制
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req: Request) => req.ip || 'unknown',
  message: { error: '登录尝试过于频繁，请 15 分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false
})
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

/**
 * 健康检查端点
 */
interface HealthChecks {
  database: boolean
  memory: boolean
}

interface MemoryUsageMB {
  rss: number
  heapUsed: number
  heapTotal: number
}

async function performHealthCheck(): Promise<HealthChecks> {
  const checks: HealthChecks = {
    database: false,
    memory: false
  }

  try {
    await query('SELECT 1')
    checks.database = true
  } catch {
    checks.database = false
  }

  const memUsage = process.memoryUsage()
  const memUsageMB: MemoryUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
  }
  checks.memory = memUsageMB.heapUsed < memUsageMB.heapTotal * 0.9

  return checks
}

app.get('/health', async (_req: Request, res: Response) => {
  const checks = await performHealthCheck()
  const allHealthy = Object.values(checks).every(Boolean)

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    checks
  })
})

app.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.get('/health/ready', async (_req: Request, res: Response) => {
  const checks = await performHealthCheck()
  const allHealthy = Object.values(checks).every(Boolean)
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ok' : 'not ready',
    checks
  })
})

app.get('/metrics', metricsEndpoint)

// Swagger API 文档（仅开发环境）
if (config.nodeEnv !== 'production') {
  setupSwagger(app)
}

/**
 * API 路由（v1 版本前缀 + 无前缀兼容）
 */
const apiV1Prefix = '/api/v1'

// 审计日志中间件（仅对写操作生效）
app.use('/api/', auditLogger)

// 挂载路由 — 同时支持 /api/v1/ 和 /api/ 两种前缀
const routeMounts = [
  { path: '/auth', router: authRoutes },
  { path: '/members', router: memberRoutes },
  { path: '/projects', router: projectRoutes },
  { path: '/applications', router: applicationRoutes },
  { path: '/stats', router: statsRoutes },
  { path: '/pilots', router: pilotRoutes },
  { path: '/fleet', router: fleetRoutes },
  { path: '/events', router: eventRoutes },
  { path: '/settings', router: settingsRoutes },
  { path: '/admin', router: adminRoutes }
]

for (const { path: routePath, router } of routeMounts) {
  app.use(`/api${routePath}`, router)
  app.use(`${apiV1Prefix}${routePath}`, router)
}

// 生产环境提供前端静态文件
if (config.nodeEnv === 'production') {
  const staticPath = process.env.STATIC_FILES_PATH || path.join(__dirname, '../../dist')
  app.use(express.static(staticPath))

  // SPA 路由回退
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
      res.sendFile(path.join(staticPath, 'index.html'))
    } else {
      next()
    }
  })
}

/**
 * 错误处理
 */
app.use(notFoundHandler)
app.use(errorHandler)

/**
 * 优雅关闭
 */
function gracefulShutdown(server: Server) {
  let isShuttingDown = false

  return async (signal: string) => {
    if (isShuttingDown) return
    isShuttingDown = true

    console.log(`\n收到 ${signal} 信号，正在优雅关闭...`)

    server.close(() => {
      console.log('HTTP 服务器已停止接受新连接')
    })

    closeWebSocket()

    try {
      await closePool()
    } catch (err) {
      const error = err as Error
      console.error('关闭数据库连接池失败:', error.message)
    }

    setTimeout(() => {
      console.error('⚠️ 优雅关闭超时，强制退出')
      process.exit(1)
    }, 30000)

    console.log('✅ 服务器已优雅关闭')
    process.exit(0)
  }
}

/**
 * 初始化数据库并启动服务器
 */
async function startServer() {
  try {
    await initDatabase()
    console.log('✅ 数据库初始化完成')

    const server = app.listen(config.port, () => {
      console.log(`🚀 服务器运行在 http://localhost:${config.port}`)
      console.log(`📡 环境: ${config.nodeEnv}`)
      console.log(`📋 API 版本: v1 (${apiV1Prefix}/*) + 兼容 (/api/*)`)
    })

    startWebSocket(server)
    startAuditCleanupJob()

    const shutdown = gracefulShutdown(server)
    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))

    return server
  } catch (error) {
    console.error('❌ 服务器启动失败:', error)
    process.exit(1)
  }
}

startServer()

export default app
