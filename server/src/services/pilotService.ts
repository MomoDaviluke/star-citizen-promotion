/**
 * @file 飞行员业务服务层
 * @description 封装飞行员 CRUD 业务逻辑，支持事务保护
 * @module server/services/pilotService
 */

import { v4 as uuidv4 } from 'uuid'
import { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise'
import { query, queryOne, transaction } from '../database/pool.js'
import { paginatedQuery } from '../database/paginatedQuery.js'
import { buildUpdateSet } from '../database/buildUpdateSet.js'
import { ApiError } from '../middleware/errorHandler.js'

export interface Pilot {
  id: string
  name: string
  callsign: string
  ship: string
  description: string | null
  image: string | null
  missions: number
  kills: number
  status: string
  createdAt?: string
}

export interface GetPilotsOptions {
  status?: string
  limit: number
  offset: number
}

export interface PaginatedPilots {
  pilots: Pilot[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

/** 获取飞行员列表（分页） */
export async function getPilots({ status, limit, offset }: GetPilotsOptions): Promise<PaginatedPilots> {
  const conditions: string[] = []
  const params: unknown[] = []

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }

  const result = await paginatedQuery<Pilot>({
    from: 'pilots',
    conditions,
    params,
    orderBy: 'missions',
    orderDir: 'DESC',
    limit,
    offset
  })

  return {
    pilots: result.rows,
    pagination: result.pagination
  }
}

/**
 * 通过 ID 获取飞行员
 */
export async function getPilotById(id: string): Promise<Pilot | null> {
  return queryOne<Pilot>('SELECT * FROM pilots WHERE id = ?', [id])
}

/**
 * 创建飞行员
 */
export async function createPilot(data: Partial<Pilot>): Promise<Pilot | null> {
  const { name, callsign, ship, description, image, missions, kills } = data
  const id = uuidv4()

  await query(
    `INSERT INTO pilots (id, name, callsign, ship, description, image, missions, kills, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, callsign, ship, description ?? null, image ?? null, missions ?? 0, kills ?? 0, 'active']
  )

  return queryOne<Pilot>('SELECT * FROM pilots WHERE id = ?', [id])
}

/** 更新飞行员 */
export async function updatePilot(id: string, data: Partial<Pilot>): Promise<Pilot> {
  return transaction<Pilot>(async (conn: PoolConnection) => {
    const allowedColumns = ['name', 'callsign', 'ship', 'description', 'image', 'missions', 'kills', 'status']
    const { setClause, values } = buildUpdateSet(data as Record<string, unknown>, allowedColumns)
    if (!setClause) throw ApiError.badRequest('没有要更新的内容')

    const [result] = await conn.execute<ResultSetHeader>('UPDATE pilots SET ' + setClause + ' WHERE id = ?', [...values, id] as never)
    if (result.affectedRows === 0) throw ApiError.notFound('飞行员不存在')

    const [rows] = await conn.execute<RowDataPacket[]>('SELECT * FROM pilots WHERE id = ?', [id])
    return rows[0] as Pilot
  })
}

/**
 * 删除飞行员
 */
export async function deletePilot(id: string): Promise<void> {
  const existingPilot = await queryOne<Pilot>('SELECT * FROM pilots WHERE id = ?', [id])

  if (!existingPilot) {
    throw ApiError.notFound('飞行员不存在')
  }

  await query('DELETE FROM pilots WHERE id = ?', [id])
}
