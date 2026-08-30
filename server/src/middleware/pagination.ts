/**
 * @file 分页中间件
 * @description 解析分页参数并注入到 req.pagination
 * @module server/middleware/pagination
 */

import { Request, Response, NextFunction } from 'express'

export interface PaginationInfo {
  page: number
  limit: number
  offset: number
  skip: number
  take: number
}

export interface PaginatedRequest extends Request {
  pagination: PaginationInfo
}

/**
 * 创建分页中间件
 * @param defaultLimit - 默认每页条数
 * @param maxLimit - 最大每页条数
 * @returns Express 中间件函数
 */
export function paginate(defaultLimit = 20, maxLimit = 100) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
    const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit as string, 10) || defaultLimit))
    const offset = (page - 1) * limit

    ;(req as PaginatedRequest).pagination = {
      page,
      limit,
      offset,
      skip: offset,
      take: limit
    }

    next()
  }
}

export default paginate
