/**
 * @file 后端服务入口
 * @description Express 服务器启动和配置
 * @module server/index
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'

import { config } from './config/index.js'
import { initDatabase, closePool } from './database/init.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/requestLogger.js'

import authRoutes from './routes/auth.js'
import memberRoutes from './routes/members.js'
import projectRoutes from './routes/projects.js'
import applicationRoutes from './routes/applications.js'
import statsRoutes from './routes/stats.js'
import pilotRoutes from './routes/pilots.js'

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
      connectSrc: ["'self'", config.frontendUrl],
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
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

/**
 * 请求体解析
 */
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

/**
 * 请求日志
 */
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'))
  app.use(requestLogger)
}

/**
 * API 速率限制
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
})
app.use('/api/', apiLimiter)

/**
 * 健康检查端点
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

/**
 * API 路由
 */
app.use('/api/auth', authRoutes)
app.use('/api/members', memberRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/pilots', pilotRoutes)

/**
 * 错误处理
 */
app.use(notFoundHandler)
app.use(errorHandler)

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
    })

    process.on('SIGTERM', async () => {
      console.log('收到 SIGTERM 信号，正在关闭服务器...')
      server.close(async () => {
        await closePool()
        console.log('服务器已关闭')
        process.exit(0)
      })
    })

    process.on('SIGINT', async () => {
      console.log('收到 SIGINT 信号，正在关闭服务器...')
      server.close(async () => {
        await closePool()
        console.log('服务器已关闭')
        process.exit(0)
      })
    })

    return server
  } catch (error) {
    console.error('❌ 服务器启动失败:', error)
    process.exit(1)
  }
}

startServer()

export default app
