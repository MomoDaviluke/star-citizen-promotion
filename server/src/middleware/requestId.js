/**
 * @file 请求 ID 中间件
 * @description 为每个请求生成唯一 ID，支持全链路追踪
 * @module server/middleware/requestId
 */

import { randomUUID } from 'node:crypto'
import logger from '../utils/logger.js'

/**
 * 生成或提取请求 ID
 * @param {Request} req - Express 请求对象
 * @returns {string} 请求 ID
 */
function getRequestId(req) {
  return req.headers['x-request-id'] || randomUUID()
}

/**
 * 请求 ID 中间件
 * @description 从 header 提取或生成请求 ID，注入到 req.id 并设置响应头
 */
export function requestId(req, res, next) {
  const id = getRequestId(req)
  req.id = id
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
