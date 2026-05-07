/**
 * @file 请求 ID 中间件
 * @description 为每个请求生成唯一 ID，支持全链路追踪
 * @module server/middleware/requestId
 */

import { randomUUID } from 'node:crypto'
import { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger.js'

function getRequestId(req: Request): string {
  return (req.headers['x-request-id'] as string) || randomUUID()
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = getRequestId(req)
  ;(req as Request & { id: string }).id = id
  res.setHeader('X-Request-ID', id)

  logger.info('请求开始', {
    requestId: id,
    method: req.method,
    url: req.url,
    ip: req.ip
  })

  next()
}

export default requestId
