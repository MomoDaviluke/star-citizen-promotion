/**
 * @file Prometheus 指标中间件
 * @description 提供应用性能监控指标，支持 HTTP 请求追踪和系统指标收集
 * @module server/middleware/metrics
 */

import { Request, Response, NextFunction } from 'express'
import client from 'prom-client'
import { getPoolStatus } from '../database/pool.js'

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

export function metricsEndpoint(_req: Request, res: Response): void {
  // 更新数据库连接池指标
  const poolStatus = getPoolStatus()
  dbTotalConnections.set(poolStatus.totalConnections)
  dbActiveConnections.set(poolStatus.activeConnections)
  dbIdleConnections.set(poolStatus.idleConnections)
  dbWaitingRequests.set(poolStatus.waitingRequests)
  dbConnectionLimit.set(poolStatus.connectionLimit)

  res.set('Content-Type', register.contentType)
  register.metrics().then((metrics: string) => res.end(metrics))
}

export default register
