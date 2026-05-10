/**
 * @file 错误处理中间件
 * @description 统一的错误处理和404处理
 * @module server/middleware/errorHandler
 */

import { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger.js'
import { config } from '../config/index.js'

/**
 * 自定义 API 错误类
 */
export class ApiError extends Error {
  statusCode: number
  errors: unknown | null

  constructor(statusCode: number, message: string, errors: unknown | null = null) {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
    this.name = 'ApiError'
  }

  static badRequest(message: string, errors: unknown | null = null): ApiError {
    return new ApiError(400, message, errors)
  }

  static unauthorized(message = '未授权访问'): ApiError {
    return new ApiError(401, message)
  }

  static forbidden(message = '禁止访问'): ApiError {
    return new ApiError(403, message)
  }

  static notFound(message = '资源未找到'): ApiError {
    return new ApiError(404, message)
  }

  static conflict(message = '资源冲突'): ApiError {
    return new ApiError(409, message)
  }

  static internal(message = '服务器内部错误'): ApiError {
    return new ApiError(500, message)
  }
}

/**
 * 全局错误处理中间件
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (config.nodeEnv !== 'production') {
    logger.error('请求错误', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method
    })
  } else {
    logger.error('请求错误', {
      message: err.message,
      url: req.url,
      method: req.method
    })
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      errors: err.errors,
      timestamp: new Date().toISOString()
    })
    return
  }

  const errRecord = err as unknown as Record<string, unknown>

  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: '数据验证失败',
      errors: errRecord.errors,
      timestamp: new Date().toISOString()
    })
    return
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: '无效的认证令牌',
      timestamp: new Date().toISOString()
    })
    return
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: '认证令牌已过期',
      timestamp: new Date().toISOString()
    })
    return
  }

  if (errRecord.code === 'ER_DUP_ENTRY') {
    res.status(409).json({
      success: false,
      error: '数据约束冲突，记录已存在',
      timestamp: new Date().toISOString()
    })
    return
  }

  const statusCode = (errRecord.statusCode as number)
    || (errRecord.status as number)
    || 500

  // 生产环境隐藏内部错误详情，防止信息泄露
  const isInternalError = statusCode >= 500
  const message = config.nodeEnv === 'production' && isInternalError
    ? '服务器内部错误'
    : (err.message || '服务器内部错误')

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.nodeEnv === 'development' && isInternalError ? { stack: err.stack } : {}),
    timestamp: new Date().toISOString()
  })
}

/**
 * 404 处理中间件
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `路由 ${req.method} ${req.url} 不存在`,
    timestamp: new Date().toISOString()
  })
}
