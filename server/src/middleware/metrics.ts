/**
 * @file Prometheus 指标中间件
 * @description 提供应用性能监控指标，支持 HTTP 请求追踪和系统指标收集
 *              生产环境下 /metrics 端点仅允许白名单 IP 访问
 * @module server/middleware/metrics
 */

import { Request, Response, NextFunction } from 'express'
import client from 'prom-client'
import { getPoolStatus } from '../database/pool.js'
import { config } from '../config/index.js'

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

// 数据库连接池指标
const dbTotalConnections = new client.Gauge({
  name: 'db_pool_total_connections',
  help: '数据库连接池总连接数'
})

const dbActiveConnections = new client.Gauge({
  name: 'db_pool_active_connections',
  help: '数据库连接池活跃连接数'
})

const dbIdleConnections = new client.Gauge({
  name: 'db_pool_idle_connections',
  help: '数据库连接池空闲连接数'
})

const dbWaitingRequests = new client.Gauge({
  name: 'db_pool_waiting_requests',
  help: '数据库连接池等待请求数'
})

const dbConnectionLimit = new client.Gauge({
  name: 'db_pool_connection_limit',
  help: '数据库连接池连接上限'
})

register.registerMetric(httpRequestDuration)
register.registerMetric(httpRequestTotal)
register.registerMetric(activeConnections)
register.registerMetric(dbTotalConnections)
register.registerMetric(dbActiveConnections)
register.registerMetric(dbIdleConnections)
register.registerMetric(dbWaitingRequests)
register.registerMetric(dbConnectionLimit)

/**
 * 获取客户端真实 IP 地址
 * @description 优先从代理头获取，支持 X-Forwarded-For 和 X-Real-IP
 * @param req Express 请求对象
 * @returns 客户端 IP 地址
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.headers['x-real-ip'] as string || req.ip || req.socket.remoteAddress || ''
}

/**
 * 检查 IP 是否在白名单中
 * @description 支持精确匹配和 CIDR 网段匹配（如 10.0.0.0/8）
 * @param clientIp 客户端 IP
 * @param allowedIps 允许的白名单 IP 列表
 * @returns 是否允许访问
 */
function isIpAllowed(clientIp: string, allowedIps: string[]): boolean {
  return allowedIps.some(allowedIp => {
    // 精确匹配
    if (allowedIp === clientIp) return true

    // CIDR 网段匹配（如 10.0.0.0/8）
    if (allowedIp.includes('/')) {
      try {
        const [subnet, prefixStr] = allowedIp.split('/')
        const prefix = parseInt(prefixStr, 10)
        if (isNaN(prefix)) return false

        const ipToLong = (ip: string): number => {
          return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
        }

        const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0
        return (ipToLong(clientIp) & mask) === (ipToLong(subnet) & mask)
      } catch {
        return false
      }
    }

    return false
  })
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()
  activeConnections.inc()

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    const route = (req as Request & { route?: { path?: string } }).route?.path || req.path

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode.toString() },
      duration
    )
    httpRequestTotal.inc({ method: req.method, route, status_code: res.statusCode.toString() })
    activeConnections.dec()
  })

  next()
}

/**
 * Prometheus 指标端点
 * @description 生产环境下仅允许白名单 IP 访问，防止内部指标泄露
 * @param req Express 请求对象
 * @param res Express 响应对象
 */
export function metricsEndpoint(req: Request, res: Response): void {
  // 生产环境下进行 IP 白名单校验
  if (config.nodeEnv === 'production') {
    if (!config.metrics.enabled) {
      res.status(404).json({ message: 'Not Found' })
      return
    }

    const clientIp = getClientIp(req)
    if (!isIpAllowed(clientIp, config.metrics.allowedIps)) {
      res.status(403).json({ message: 'Forbidden' })
      return
    }
  }

  // 更新数据库连接池指标
  const poolStatus = getPoolStatus()
  dbTotalConnections.set(poolStatus.totalConnections)
  dbActiveConnections.set(poolStatus.activeConnections)
  dbIdleConnections.set(poolStatus.idleConnections)
  dbWaitingRequests.set(poolStatus.waitingRequests)
  dbConnectionLimit.set(poolStatus.connectionLimit)

  res.set('Content-Type', register.contentType)
  register.metrics()
    .then((metrics: string) => res.end(metrics))
    .catch((err: Error) => {
      logger.error('指标收集失败', { error: err.message })
      res.status(500).end('Internal Server Error')
    })
}

export default register
