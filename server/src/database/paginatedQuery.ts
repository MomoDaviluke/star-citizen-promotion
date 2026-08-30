/**
 * @file 通用分页查询工具
 * @description 为后端服务层提供统一的分页查询逻辑，
 *              消除各 Service 中重复的 WHERE 构建 / COUNT / LIMIT OFFSET 模式
 * @module server/database/paginatedQuery
 */

import { query, queryOne } from './pool.js'

/** 分页查询选项 */
export interface PaginatedQueryOptions {
  /** SELECT 子句，默认 'SELECT *' */
  select?: string
  /** FROM 子句（表名或含 JOIN 的完整 FROM），如 'ships' 或 'applications a LEFT JOIN users u ON a.reviewed_by = u.id' */
  from: string
  /** WHERE 条件数组，如 ['status = ?', 'a.category = ?'] */
  conditions?: string[]
  /** 条件参数值，如 ['active', 'combat'] */
  params?: unknown[]
  /** 排序字段（必须为白名单中的安全值） */
  orderBy?: string
  /** 排序方向 */
  orderDir?: 'ASC' | 'DESC'
  /** 每页条数 */
  limit: number
  /** 偏移量 */
  offset: number
  /** COUNT 查询的 FROM 子句。仅当主表 JOIN 一对多会放大行数时使用；
   *  注意：指定后 count 查询不再带 JOIN 别名，conditions 不能引用 `别名.` 前缀的字段，
   *  否则 count SQL 会报 Unknown column（多对一 JOIN 请直接省略此参数） */
  countFrom?: string
}

/** 分页查询结果 */
export interface PaginatedResult<T> {
  rows: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

/**
 * 通用分页查询
 * @description 自动构建 SELECT + COUNT 查询，返回分页结果。
 *              支持 JOIN 场景：通过 select / from / countFrom 自定义各子句。
 * @example
 * // 简单查询
 * const result = await paginatedQuery<Ship>({
 *   from: 'ships',
 *   conditions: ['category = ?'],
 *   params: ['combat'],
 *   limit: 50, offset: 0
 * })
 *
 * // JOIN 查询（多对一，count 直接复用 from 的别名，勿传 countFrom）
 * const result = await paginatedQuery<Application>({
 *   select: 'SELECT a.*, u.username as reviewer_name',
 *   from: 'applications a LEFT JOIN users u ON a.reviewed_by = u.id',
 *   conditions: ['a.status = ?'],
 *   params: ['pending'],
 *   orderBy: 'a.created_at',
 *   limit: 50, offset: 0
 * })
 */
export async function paginatedQuery<T>(options: PaginatedQueryOptions): Promise<PaginatedResult<T>> {
  const {
    select = 'SELECT *',
    from,
    conditions = [],
    params = [],
    orderBy = 'created_at',
    orderDir = 'DESC',
    limit,
    offset,
    countFrom
  } = options

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // 数据查询
  const dataSql = `${select} FROM ${from} ${whereClause} ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`
  const rows = await query<T[]>(dataSql, [...params, limit, offset])

  // 总数查询：JOIN 场景下用 countFrom 统计主表，否则用 from
  const countTable = countFrom ?? from
  const countSql = `SELECT COUNT(*) as total FROM ${countTable} ${whereClause}`
  const countResult = await queryOne<{ total: number }>(countSql, params)
  const total = countResult?.total ?? 0

  return {
    rows,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + rows.length < total
    }
  }
}
