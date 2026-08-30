/**
 * @file 舰队业务服务层
 * @description 封装飞船 CRUD 业务逻辑，支持事务保护
 * @module server/services/fleetService
 */

import { v4 as uuidv4 } from 'uuid'
import { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise'
import { query, queryOne, transaction } from '../database/pool.js'
import { paginatedQuery } from '../database/paginatedQuery.js'
import { buildUpdateSet } from '../database/buildUpdateSet.js'
import { ApiError } from '../middleware/errorHandler.js'

export interface Ship {
  id: string
  name: string
  callsign: string | null
  ship: string
  category: string
  status: string
  value: number
  image: string | null
  description: string | null
  createdAt?: string
}

export interface GetShipsOptions {
  category?: string
  status?: string
  sortBy?: string
  order?: string
  limit: number
  offset: number
}

export interface PaginatedShips {
  ships: Ship[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface FleetStats {
  totalShips: number
  totalValue: number
  byCategory: Record<string, number>
  byStatus: Record<string, number>
}

const allowedSortColumns: Record<string, string> = {
  name: 'name',
  value: 'value',
  added: 'created_at'
}

/** 获取飞船列表（分页） */
export async function getShips({ category, status, sortBy, order, limit, offset }: GetShipsOptions): Promise<PaginatedShips> {
  const conditions: string[] = []
  const params: unknown[] = []

  if (category) {
    conditions.push('category = ?')
    params.push(category)
  }

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }

  const sortColumn = allowedSortColumns[sortBy || 'added'] || 'created_at'
  const sortOrder = order === 'asc' ? 'ASC' as const : 'DESC' as const

  const result = await paginatedQuery<Ship>({
    from: 'ships',
    conditions,
    params,
    orderBy: sortColumn,
    orderDir: sortOrder,
    limit,
    offset
  })

  return {
    ships: result.rows,
    pagination: result.pagination
  }
}

/** 通过 ID 获取飞船 */
export async function getShipById(id: string): Promise<Ship | null> {
  return queryOne<Ship>('SELECT * FROM ships WHERE id = ?', [id])
}

/** 创建飞船 */
export async function createShip(data: Partial<Ship>): Promise<Ship | null> {
  const { name, callsign, ship, category, status, value, image, description } = data
  const id = uuidv4()

  await query(
    `INSERT INTO ships (id, name, callsign, ship, category, status, value, image, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, callsign ?? null, ship, category ?? 'combat', status ?? 'available', value ?? 0, image ?? null, description ?? null]
  )

  return queryOne<Ship>('SELECT * FROM ships WHERE id = ?', [id])
}

/** 更新飞船信息 */
export async function updateShip(id: string, data: Partial<Ship>): Promise<Ship> {
  return transaction<Ship>(async (conn: PoolConnection) => {
    const allowedColumns = ['name', 'callsign', 'ship', 'category', 'status', 'value', 'image', 'description']
    const { setClause, values } = buildUpdateSet(data as Record<string, unknown>, allowedColumns)
    if (!setClause) throw ApiError.badRequest('没有要更新的内容')

    const [result] = await conn.execute<ResultSetHeader>('UPDATE ships SET ' + setClause + ' WHERE id = ?', [...values, id] as never)
    if (result.affectedRows === 0) throw ApiError.notFound('飞船不存在')

    const [rows] = await conn.execute<RowDataPacket[]>('SELECT * FROM ships WHERE id = ?', [id])
    return rows[0] as Ship
  })
}

/** 删除飞船 */
export async function deleteShip(id: string): Promise<void> {
  const existingShip = await queryOne<Ship>('SELECT * FROM ships WHERE id = ?', [id])
  if (!existingShip) throw ApiError.notFound('飞船不存在')
  await query('DELETE FROM ships WHERE id = ?', [id])
}

/** 获取舰队统计 */
export async function getFleetStats(): Promise<FleetStats> {
  const categoryRows = await query<RowDataPacket[]>('SELECT category, COUNT(*) as count FROM ships GROUP BY category')
  const statusRows = await query<RowDataPacket[]>('SELECT status, COUNT(*) as count FROM ships GROUP BY status')
  const totalRows = await query<RowDataPacket[]>('SELECT COUNT(*) as total, COALESCE(SUM(value), 0) as totalValue FROM ships')
  const totalRow = totalRows[0]

  const byCategory: Record<string, number> = {}
  for (const row of categoryRows) { byCategory[row.category] = row.count }

  const byStatus: Record<string, number> = {}
  for (const row of statusRows) { byStatus[row.status] = row.count }

  return {
    totalShips: totalRow.total,
    totalValue: totalRow.totalValue,
    byCategory,
    byStatus
  }
}
