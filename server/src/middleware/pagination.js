/**
 * @file 分页中间件
 * @description 解析分页参数并注入到 req.pagination
 * @module server/middleware/pagination
 */

/**
 * 创建分页中间件
 * @param {Object} options - 分页选项
 * @param {number} options.defaultLimit - 默认每页条数
 * @param {number} options.maxLimit - 最大每页条数
 * @returns {Function} Express 中间件函数
 */
export function paginate(defaultLimit = 20, maxLimit = 100) {
  return (req, res, next) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit, 10) || defaultLimit))
    const offset = (page - 1) * limit

    req.pagination = {
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
