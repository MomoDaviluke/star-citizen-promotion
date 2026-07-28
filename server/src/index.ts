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
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server } from 'node:http'

import { config } from './config/index.js'
import { setupSwagger } from './config/swagger.js'
import { initDatabase, closePool } from './database/init.js'
import logger from './utils/logger.js'
import { query, getPoolStatus } from './database/pool.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/requestLogger.js'
import { requestId } from './middleware/requestId.js'
import { auditLogger, startAuditCleanupJob } from './middleware/auditLogger.js'
import { metricsMiddleware, metricsEndpoint } from './middleware/metrics.js'
import { cacheMiddleware, cacheInvalidationMiddleware } from './middleware/cache.js'
import { apiLimiter, authLimiter, refreshLimiter } from './middleware/rateLimiters.js'
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
import rumRoutes from './routes/rum.js'
import activityLogRoutes from './routes/activityLogs.js'

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
 * @description 生产环境严格限制来源，开发环境允许前端地址
 */
const corsOptions: cors.CorsOptions = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}

if (config.nodeEnv === 'production') {
  // 生产环境必须配置 ALLOWED_ORIGINS
  if (!process.env.ALLOWED_ORIGINS) {
    logger.warn('ALLOWED_ORIGINS 未设置，CORS 将拒绝所有跨域请求')
  }
  corsOptions.origin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      // 允许无 Origin 的请求（如直接 curl 调用）
      callback(null, true)
    } else if (config.cors.allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      logger.warn(`CORS 拒绝来源: ${origin}`)
      callback(new Error(`CORS: Origin ${origin} not allowed`))
    }
  }
} else {
  // 开发环境允许前端地址和本地开发服务器
  const devOrigins = [config.frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000']
  corsOptions.origin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || devOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed in development`))
    }
  }
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
 * HTTP 缓存中间件
 * @description 对读密集端点启用 TTL 内存缓存 + ETag 条件请求
 *              已认证路由（/api/auth/*、/api/admin/*）跳过缓存
 */
app.use(cacheMiddleware({ skipAuthRoutes: true }))

/**
 * 缓存失效
 * @description POST/PUT/DELETE 操作后自动清除相关路由缓存
 */
app.use(cacheInvalidationMiddleware)

/**
 * API 速率限制
 * @description limiters 集中定义在 middleware/rateLimiters.ts，便于路由文件显式引用
 */
app.use('/api/', apiLimiter)

/**
 * 认证端点严格速率限制
 */
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

/**
 * 令牌刷新端点速率限制
 * @description 防止对刷新端点的滥用和暴力探测
 */
app.use('/api/auth/refresh', refreshLimiter)

/**
 * 健康检查端点
 * @description 三级健康检查体系：
 *   - /health/live  : 进程存活（始终返回 ok，仅证明进程未退出）
 *   - /health/ready : 就绪探针（数据库连通性，决定是否接收入流量）
 *   - /health       : 综合状态（含连接池指标，供监控面板使用）
 *
 *   memory 检查已移除：V8 堆动态扩展时 heapUsed/heapTotal 比值不稳定，
 *   会导致误报。Node.js 进程内存监控应由 Kubernetes/容器运行时的 OOM 处理，
 *   而非应用层自我判定。真正的就绪判定只有 database 连通性。
 */
interface HealthChecks {
  database: boolean
  poolStatus: ReturnType<typeof getPoolStatus>
}

async function performHealthCheck(): Promise<HealthChecks> {
  const checks: HealthChecks = {
    database: false,
    poolStatus: getPoolStatus()
  }

  try {
    await query('SELECT 1')
    checks.database = true
  } catch {
    checks.database = false
  }

  return checks
}

app.get('/health', async (_req: Request, res: Response) => {
  const checks = await performHealthCheck()
  const allHealthy = checks.database

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
  const allHealthy = checks.database
  // 生产环境仅返回状态码，不暴露内部检查详情
  if (config.nodeEnv === 'production') {
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ok' : 'not ready'
    })
    return
  }
  // 开发/测试环境返回详细检查信息，便于调试
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
 * API 版本控制
 * @description 当前主版本为 v1，同时保留 /api/ 前缀作为兼容入口
 *              未来发布 v2 时，可通过添加 /api/v2/ 前缀逐步迁移
 */
const API_VERSION = 'v1'
const apiV1Prefix = `/api/${API_VERSION}`
const apiCompatPrefix = '/api'

// 审计日志中间件（仅对写操作生效）
app.use(apiCompatPrefix + '/', auditLogger)
app.use(apiV1Prefix + '/', auditLogger)

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
  { path: '/admin', router: adminRoutes },
  { path: '/rum', router: rumRoutes },
  { path: '/activity-logs', router: activityLogRoutes }
]

for (const { path: routePath, router } of routeMounts) {
  // 兼容前缀 /api/*（已标记为弃用，建议使用 /api/v1/*）
  app.use(`${apiCompatPrefix}${routePath}`, (_req: Request, res: Response, next: NextFunction) => {
    // 添加弃用警告头，提醒客户端迁移到新版本
    res.setHeader('Deprecation', 'true')
    res.setHeader('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString())
    res.setHeader('Link', `<${config.frontendUrl}${apiV1Prefix}${routePath}>; rel="successor-version"`)
    next()
  }, router)
  // 版本化前缀 /api/v1/*（推荐）
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

    logger.info(`收到 ${signal} 信号，正在优雅关闭...`)

    // 设置超时强制退出，unref 允许正常退出时不被阻塞
    const forceExit = setTimeout(() => {
      logger.error('⚠️ 优雅关闭超时，强制退出')
      process.exit(1)
    }, 30000)
    forceExit.unref()

    // 等待 HTTP 服务器停止接受新连接
    await new Promise<void>((resolve) => {
      server.close(() => {
        logger.info('HTTP 服务器已停止接受新连接')
        resolve()
      })
    })

    closeWebSocket()

    try {
      await closePool()
    } catch (err) {
      const error = err as Error
      logger.error('关闭数据库连接池失败', { error: error.message })
    }

    logger.info('✅ 服务器已优雅关闭')
    process.exit(0)
  }
}

/**
 * 初始化数据库并启动服务器
 */
async function startServer() {
  try {
    await initDatabase()
    logger.info('✅ 数据库初始化完成')

    const server = app.listen(config.port, () => {
      logger.info(`🚀 服务器运行在 http://localhost:${config.port}`)
      logger.info(`📡 环境: ${config.nodeEnv}`)
      logger.info(`📋 API 版本: v1 (${apiV1Prefix}/*) + 兼容 (/api/*)`)
    })

    startWebSocket(server)
    startAuditCleanupJob()

    const shutdown = gracefulShutdown(server)
    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))

    return server
  } catch (error) {
    logger.error('❌ 服务器启动失败', { error })
    process.exit(1)
  }
}

startServer()

export default app
