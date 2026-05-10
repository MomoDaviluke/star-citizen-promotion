import { v4 as uuidv4 } from 'uuid'
import { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { query, queryOne, transaction } from '../database/pool.js'
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

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const sortColumn = allowedSortColumns[sortBy || 'added'] || 'created_at'
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC'

  const sql = `SELECT * FROM ships ${whereClause} ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const ships = await query<Ship[]>(sql, params)

  const countSql = conditions.length > 0
    ? `SELECT COUNT(*) as total FROM ships WHERE ${conditions.join(' AND ')}`
    : 'SELECT COUNT(*) as total FROM ships'
  const countParams = conditions.length > 0 ? params.slice(0, -2) : []
  const result = await queryOne<{ total: number }>(countSql, countParams)
  const total = result?.total ?? 0

  return {
    ships,
    pagination: { total, limit, offset, hasMore: offset + ships.length < total }
  }
}

export async function getShipById(id: string): Promise<Ship | null> {
  return queryOne<Ship>('SELECT * FROM ships WHERE id = ?', [id])
}

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

export async function updateShip(id: string, data: Partial<Ship>): Promise<Ship> {
  return transaction<Ship>(async (conn: PoolConnection) => {
    const [existingRows] = await conn.execute<RowDataPacket[]>('SELECT * FROM ships WHERE id = ?', [id])

    if (existingRows.length === 0) {
      throw ApiError.notFound('飞船不存在')
    }

    const { name, callsign, ship, category, status, value, image, description } = data
    const updates: string[] = []
    const values: unknown[] = []

    const columnMap: Record<string, unknown> = { name, callsign, ship, category, status, value, image, description }
    const allowedColumns = ['name', 'callsign', 'ship', 'category', 'status', 'value', 'image', 'description']

    for (const col of allowedColumns) {
      if (columnMap[col] !== undefined) {
        updates.push(col)
        values.push(columnMap[col])
      }
    }

    if (updates.length === 0) {
      throw ApiError.badRequest('没有要更新的内容')
    }

    values.push(id)
    const setClause = updates.map((col) => `${col} = ?`).join(', ')

    await conn.execute(`UPDATE ships SET ${setClause} WHERE id = ?`, values as never)

    const [rows] = await conn.execute<RowDataPacket[]>('SELECT * FROM ships WHERE id = ?', [id])
    return rows[0] as Ship
  })
}

export async function deleteShip(id: string): Promise<void> {
  const existingShip = await queryOne<Ship>('SELECT * FROM ships WHERE id = ?', [id])

  if (!existingShip) {
    throw ApiError.notFound('飞船不存在')
  }

  await query('DELETE FROM ships WHERE id = ?', [id])
}

export async function getFleetStats(): Promise<FleetStats> {
  const categoryRows = await query<RowDataPacket[]>('SELECT category, COUNT(*) as count FROM ships GROUP BY category')
  const statusRows = await query<RowDataPacket[]>('SELECT status, COUNT(*) as count FROM ships GROUP BY status')
  const totalRows = await query<RowDataPacket[]>('SELECT COUNT(*) as total, COALESCE(SUM(value), 0) as totalValue FROM ships')
  const totalRow = totalRows[0]

  const byCategory: Record<string, number> = {}
  for (const row of categoryRows) {
    byCategory[row.category] = row.count
  }

  const byStatus: Record<string, number> = {}
  for (const row of statusRows) {
    byStatus[row.status] = row.count
  }

  return {
    totalShips: totalRow.total,
    totalValue: totalRow.totalValue,
    byCategory,
    byStatus
  }
}
