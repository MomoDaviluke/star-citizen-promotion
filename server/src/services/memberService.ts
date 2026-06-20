/**
 * @file 成员业务服务层
 * @description 封装成员 CRUD 业务逻辑，支持事务保护
 * @module server/services/memberService
 */

import { v4 as uuidv4 } from 'uuid'
import { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { query, queryOne, transaction } from '../database/pool.js'
import { paginatedQuery } from '../database/paginatedQuery.js'
import { buildUpdateSet } from '../database/buildUpdateSet.js'
import { ApiError } from '../middleware/errorHandler.js'

export interface Member {
  id: string
  name: string
  role: string
  intro: string | null
  avatar: string | null
  joinDate: string | null
  status: string
  createdAt?: string
}

export interface GetMembersOptions {
  status?: string
  limit: number
  offset: number
}

export interface PaginatedMembers {
  members: Member[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

/** 获取成员列表（分页） */
export async function getMembers({ status, limit, offset }: GetMembersOptions): Promise<PaginatedMembers> {
  const conditions: string[] = []
  const params: unknown[] = []

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }

  const result = await paginatedQuery<Member>({
    from: 'members',
    conditions,
    params,
    orderBy: 'created_at',
    orderDir: 'DESC',
    limit,
    offset
  })

  return {
    members: result.rows,
    pagination: result.pagination
  }
}

/**
 * 通过 ID 获取成员
 */
export async function getMemberById(id: string): Promise<Member | null> {
  return queryOne<Member>('SELECT * FROM members WHERE id = ?', [id])
}

/**
 * 创建成员
 */
export async function createMember(data: Partial<Member>): Promise<Member | null> {
  const { name, role, intro, avatar, joinDate } = data
  const id = uuidv4()

  await query(
    'INSERT INTO members (id, name, role, intro, avatar, join_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name, role, intro ?? null, avatar ?? null, joinDate ?? null, 'active']
  )

  return queryOne<Member>('SELECT * FROM members WHERE id = ?', [id])
}

/** 更新成员 */
export async function updateMember(id: string, data: Partial<Member>): Promise<Member> {
  return transaction<Member>(async (conn: PoolConnection) => {
    const [existingRows] = await conn.execute<RowDataPacket[]>('SELECT * FROM members WHERE id = ?', [id])
    if (existingRows.length === 0) throw ApiError.notFound('成员不存在')

    const allowedColumns = ['name', 'role', 'intro', 'avatar', 'status']
    const { setClause, values } = buildUpdateSet(data as Record<string, unknown>, allowedColumns)
    if (!setClause) throw ApiError.badRequest('没有要更新的内容')

    await conn.execute(`UPDATE members SET ${setClause} WHERE id = ?`, [...values, id] as never)

    const [rows] = await conn.execute<RowDataPacket[]>('SELECT * FROM members WHERE id = ?', [id])
    return rows[0] as Member
  })
}

/**
 * 删除成员
 */
export async function deleteMember(id: string): Promise<void> {
  const existingMember = await queryOne<Member>('SELECT * FROM members WHERE id = ?', [id])

  if (!existingMember) {
    throw ApiError.notFound('成员不存在')
  }

  await query('DELETE FROM members WHERE id = ?', [id])
}
