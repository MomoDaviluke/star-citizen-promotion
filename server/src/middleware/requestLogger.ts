/**
 * @file 请求日志中间件
 * @description 记录 HTTP 请求详情，使用 Winston 结构化日志，自动脱敏敏感字段
 * @module server/middleware/requestLogger
 */

import { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger.js'
import { sanitizeBody } from '../utils/sanitizeBody.js'

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now()

  const originalEnd = res.end
  res.end = function (this: Response, ...args: Parameters<Response['end']>): Response {
    const responseTime = Date.now() - startTime

    const logData: Record<string, unknown> = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || (req.connection as { remoteAddress?: string })?.remoteAddress,
      userAgent: req.get('User-Agent') || '-',
      contentLength: res.get('Content-Length') || 0,
      requestId: (req as Request & { id?: string }).id || '-'
    }

    if (process.env.NODE_ENV === 'development' && req.body) {
      logData.body = sanitizeBody(req.body)
    }

    if (res.statusCode >= 400) {
      logger.error('请求失败', logData)
    } else {
      logger.info('请求', logData)
    }

    return originalEnd.apply(this, args)
  } as Response['end']

  next()
}

export default requestLogger
