/**
 * @file Prometheus 指标中间件
 * @description 提供应用性能监控指标，支持 HTTP 请求追踪和系统指标收集
 * @module server/middleware/metrics
 */

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

/**
 * Prometheus 指标中间件
 * @param {Request} req - Express 请求对象
 * @param {Response} res - Express 响应对象
 * @param {NextFunction} next - Express next 函数
 */
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

/**
 * Prometheus 指标端点处理器
 * @param {Request} req - Express 请求对象
 * @param {Response} res - Express 响应对象
 */
export function metricsEndpoint(req, res) {
  res.set('Content-Type', register.contentType)
  res.end(register.metrics())
}

export default register
