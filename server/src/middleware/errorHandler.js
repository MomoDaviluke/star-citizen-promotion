/**
 * @file 错误处理中间件
 * @description 统一的错误处理和404处理
 * @module server/middleware/errorHandler
 */

/**
 * 自定义 API 错误类
 */
export class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
    this.name = 'ApiError'
  }

  static badRequest(message, errors = null) {
    return new ApiError(400, message, errors)
  }

  static unauthorized(message = '未授权访问') {
    return new ApiError(401, message)
  }

  static forbidden(message = '禁止访问') {
    return new ApiError(403, message)
  }

  static notFound(message = '资源未找到') {
    return new ApiError(404, message)
  }

  static conflict(message = '资源冲突') {
    return new ApiError(409, message)
  }

  static internal(message = '服务器内部错误') {
    return new ApiError(500, message)
  }
}

/**
 * 全局错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Request} req - Express 请求对象
 * @param {Response} res - Express 响应对象
 * @param {NextFunction} next - Express next 函数
 */
export function errorHandler(err, req, res, next) {
  console.error('❌ 错误:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  })

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      errors: err.errors,
      timestamp: new Date().toISOString()
    })
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: '数据验证失败',
      errors: err.errors,
      timestamp: new Date().toISOString()
    })
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: '无效的认证令牌',
      timestamp: new Date().toISOString()
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: '认证令牌已过期',
      timestamp: new Date().toISOString()
    })
  }

  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({
      success: false,
      error: '数据约束冲突',
      timestamp: new Date().toISOString()
    })
  }

  const statusCode = err.statusCode || err.status || 500
  const message = err.message || '服务器内部错误'

  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  })
}

/**
 * 404 处理中间件
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `路由 ${req.method} ${req.url} 不存在`,
    timestamp: new Date().toISOString()
  })
}

export default errorHandler
