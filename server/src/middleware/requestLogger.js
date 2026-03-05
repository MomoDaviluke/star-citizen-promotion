/**
 * @file 请求日志中间件
 * @description 记录 HTTP 请求详情
 * @module server/middleware/requestLogger
 */

/**
 * 请求日志中间件
 * @param {Request} req - Express 请求对象
 * @param {Response} res - Express 响应对象
 * @param {NextFunction} next - Express next 函数
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now()

  const originalEnd = res.end
  res.end = function (...args) {
    const responseTime = Date.now() - startTime

    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '-',
      contentLength: res.get('Content-Length') || 0
    }

    if (res.statusCode >= 400) {
      console.error('📤 请求失败:', logData)
    } else {
      console.log('📥 请求:', logData)
    }

    originalEnd.apply(res, args)
  }

  next()
}

export default requestLogger
