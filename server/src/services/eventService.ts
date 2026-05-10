/**
 * @file 活动业务服务层
 * @description 封装活动 CRUD、参与者管理和 ICS 日历生成等业务逻辑，支持事务保护
 * @module server/services/eventService
 */

import { v4 as uuidv4 } from 'uuid'
import { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { query, queryOne, transaction } from '../database/pool.js'
import { ApiError } from '../middleware/errorHandler.js'

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  location: string | null
  status: string
  creator_id: string | null
  participants?: string[]
  createdAt?: string
}

export interface GetEventsOptions {
  startDate?: string
  endDate?: string
  status?: string
  creatorId?: string
  limit: number
  offset: number
}

export interface PaginatedEvents {
  events: CalendarEvent[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export async function getEvents({ startDate, endDate, status, creatorId, limit, offset }: GetEventsOptions): Promise<PaginatedEvents> {
  const conditions: string[] = []
  const params: unknown[] = []

  if (startDate) {
    conditions.push('start_time >= ?')
    params.push(startDate)
  }

  if (endDate) {
    conditions.push('start_time <= ?')
    params.push(endDate)
  }

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }

  if (creatorId) {
    conditions.push('creator_id = ?')
    params.push(creatorId)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const sql = `SELECT * FROM events ${whereClause} ORDER BY start_time ASC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const events = await query<CalendarEvent[]>(sql, params)

  for (const event of events) {
    const participants = await query<RowDataPacket[]>(
      'SELECT user_id FROM event_participants WHERE event_id = ?',
      [event.id]
    )
    event.participants = participants.map((p) => p.user_id)
  }

  const countSql = conditions.length > 0
    ? `SELECT COUNT(*) as total FROM events WHERE ${conditions.join(' AND ')}`
    : 'SELECT COUNT(*) as total FROM events'
  const countParams = conditions.length > 0 ? params.slice(0, -2) : []
  const result = await queryOne<{ total: number }>(countSql, countParams)
  const total = result?.total ?? 0

  return {
    events,
    pagination: { total, limit, offset, hasMore: offset + events.length < total }
  }
}

export async function getEventById(id: string): Promise<CalendarEvent | null> {
  const event = await queryOne<CalendarEvent>('SELECT * FROM events WHERE id = ?', [id])

  if (event) {
    const participants = await query<RowDataPacket[]>(
      'SELECT user_id FROM event_participants WHERE event_id = ?',
      [id]
    )
    event.participants = participants.map((p) => p.user_id)
  }

  return event
}

export async function createEvent(data: Partial<CalendarEvent> & { creatorId?: string }): Promise<CalendarEvent | null> {
  const { title, description, start_time, end_time, location, creatorId } = data
  const id = uuidv4()

  await query(
    `INSERT INTO events (id, title, description, start_time, end_time, location, status, creator_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, title, description ?? null, start_time, end_time ?? null, location ?? null, 'upcoming', creatorId ?? null]
  )

  return getEventById(id)
}

export async function updateEvent(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
  return transaction<CalendarEvent>(async (conn: PoolConnection) => {
    const [existingRows] = await conn.execute<RowDataPacket[]>('SELECT * FROM events WHERE id = ?', [id])

    if (existingRows.length === 0) {
      throw ApiError.notFound('活动不存在')
    }

    const { title, description, start_time, end_time, location, status } = data
    const updates: string[] = []
    const values: unknown[] = []

    const columnMap: Record<string, unknown> = { title, description, start_time, end_time, location, status }
    const allowedColumns = ['title', 'description', 'start_time', 'end_time', 'location', 'status']

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

    await conn.execute(`UPDATE events SET ${setClause} WHERE id = ?`, values as never)

    const [rows] = await conn.execute<RowDataPacket[]>('SELECT * FROM events WHERE id = ?', [id])
    const event = rows[0] as CalendarEvent

    const [participants] = await conn.execute<RowDataPacket[]>(
      'SELECT user_id FROM event_participants WHERE event_id = ?',
      [id]
    )
    event.participants = participants.map((p: RowDataPacket) => p.user_id)

    return event
  })
}

export async function deleteEvent(id: string): Promise<void> {
  const existingEvent = await queryOne<CalendarEvent>('SELECT * FROM events WHERE id = ?', [id])

  if (!existingEvent) {
    throw ApiError.notFound('活动不存在')
  }

  await query('DELETE FROM events WHERE id = ?', [id])
}

export async function joinEvent(eventId: string, userId: string): Promise<CalendarEvent> {
  const existingEvent = await queryOne<CalendarEvent>('SELECT * FROM events WHERE id = ?', [eventId])

  if (!existingEvent) {
    throw ApiError.notFound('活动不存在')
  }

  const existing = await queryOne<RowDataPacket>(
    'SELECT * FROM event_participants WHERE event_id = ? AND user_id = ?',
    [eventId, userId]
  )

  if (!existing) {
    await query(
      'INSERT INTO event_participants (event_id, user_id) VALUES (?, ?)',
      [eventId, userId]
    )
  }

  return (await getEventById(eventId))!
}

export async function leaveEvent(eventId: string, userId: string): Promise<CalendarEvent> {
  const existingEvent = await queryOne<CalendarEvent>('SELECT * FROM events WHERE id = ?', [eventId])

  if (!existingEvent) {
    throw ApiError.notFound('活动不存在')
  }

  await query(
    'DELETE FROM event_participants WHERE event_id = ? AND user_id = ?',
    [eventId, userId]
  )

  return (await getEventById(eventId))!
}

export function generateICS(event: CalendarEvent): string {
  const formatDate = (d: string) => new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Star Citizen Promotion//Events//CN',
    'BEGIN:VEVENT',
    `UID:${event.id}`,
    `DTSTART:${formatDate(event.start_time)}`,
    event.end_time ? `DTEND:${formatDate(event.end_time)}` : '',
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
    event.location ? `LOCATION:${event.location}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean)

  return lines.join('\r\n')
}
