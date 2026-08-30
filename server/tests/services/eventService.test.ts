/**
 * @file 活动服务层单元测试
 * @description 测试 eventService 的 CRUD、参与者管理和 ICS 生成功能
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.unstable_mockModule('../../src/database/pool.ts', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  transaction: jest.fn((cb) => cb({ execute: jest.fn() }))
}))

const { query, queryOne, transaction } = await import('../../src/database/pool.ts')
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  generateICS
} = await import('../../src/services/eventService.ts')

describe('eventService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getEvents', () => {
    it('应返回活动列表和分页', async () => {
      query.mockResolvedValue([])
      queryOne.mockResolvedValueOnce({ total: 0 })

      const result = await getEvents({ limit: 10, offset: 0 })

      expect(result.events).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.hasMore).toBe(false)
    })

    it('应支持日期范围筛选', async () => {
      query.mockResolvedValue([])
      queryOne.mockResolvedValueOnce({ total: 0 })

      await getEvents({ startDate: '2026-06-01', endDate: '2026-06-30', limit: 10, offset: 0 })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('start_time >='),
        expect.arrayContaining(['2026-06-01', '2026-06-30'])
      )
    })

    it('应支持状态筛选', async () => {
      query.mockResolvedValue([])
      queryOne.mockResolvedValueOnce({ total: 0 })

      await getEvents({ status: 'upcoming', limit: 10, offset: 0 })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('status = ?'),
        expect.arrayContaining(['upcoming'])
      )
    })

    it('应支持创建者筛选', async () => {
      query.mockResolvedValue([])
      queryOne.mockResolvedValueOnce({ total: 0 })

      await getEvents({ creatorId: 'user1', limit: 10, offset: 0 })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('creator_id = ?'),
        expect.arrayContaining(['user1'])
      )
    })

    it('hasMore 为 true 当还有更多数据', async () => {
      const mockEvents = new Array(10).fill(null).map((_, i) => ({ id: `e${i}`, title: `活动${i}` }))
      query.mockResolvedValueOnce(mockEvents)
      query.mockResolvedValue([])
      queryOne.mockResolvedValueOnce({ total: 25 })

      const result = await getEvents({ limit: 10, offset: 0 })

      expect(result.events).toHaveLength(10)
      expect(result.pagination.total).toBe(25)
      expect(result.pagination.hasMore).toBe(true)
    })
  })

  describe('getEventById', () => {
    it('应返回活动详情含参与者', async () => {
      queryOne.mockResolvedValueOnce({ id: 'e1', title: '舰队阅兵' })
      query.mockResolvedValueOnce([{ user_id: 'u1' }, { user_id: 'u2' }])

      const result = await getEventById('e1')

      expect(result).not.toBeNull()
      expect(result!.participants).toEqual(['u1', 'u2'])
    })

    it('不存在的活动应返回 null', async () => {
      queryOne.mockResolvedValueOnce(null)

      const result = await getEventById('e999')

      expect(result).toBeNull()
    })
  })

  describe('createEvent', () => {
    it('应创建新活动', async () => {
      query.mockResolvedValueOnce({ affectedRows: 1 })
      queryOne.mockResolvedValueOnce({ id: 'e1', title: '新活动', status: 'upcoming' })
      query.mockResolvedValueOnce([])

      const result = await createEvent({
        title: '新活动',
        description: '描述',
        start_time: '2026-06-01T10:00:00Z',
        creatorId: 'user1'
      })

      expect(result).not.toBeNull()
      expect(result!.title).toBe('新活动')
      expect(result!.status).toBe('upcoming')
    })
  })

  describe('updateEvent', () => {
    it('应更新活动', async () => {
      const conn = { execute: jest.fn() }
      conn.execute
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[{ id: 'e1', title: '新标题', status: 'upcoming' }]])
        .mockResolvedValueOnce([[]])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      const result = await updateEvent('e1', { title: '新标题' })

      expect(result.title).toBe('新标题')
    })

    it('不存在的活动应返回 404', async () => {
      const conn = { execute: jest.fn() }
      conn.execute.mockResolvedValueOnce([{ affectedRows: 0 }])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      await expect(updateEvent('e999', { title: 'Test' })).rejects.toMatchObject({ statusCode: 404 })
    })

    it('无更新内容应返回 400', async () => {
      const conn = { execute: jest.fn() }
      conn.execute.mockResolvedValueOnce([{ affectedRows: 0 }])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      await expect(updateEvent('e1', {})).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  describe('deleteEvent', () => {
    it('应删除活动', async () => {
      queryOne.mockResolvedValueOnce({ id: 'e1', title: '待删除' })
      query.mockResolvedValueOnce({ affectedRows: 1 })

      await expect(deleteEvent('e1')).resolves.toBeUndefined()
    })

    it('不存在的活动应返回 404', async () => {
      queryOne.mockResolvedValueOnce(null)

      await expect(deleteEvent('e999')).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  describe('joinEvent', () => {
    it('应加入活动', async () => {
      queryOne.mockResolvedValueOnce({ id: 'e1', title: '活动' })
      queryOne.mockResolvedValueOnce(null)
      query.mockResolvedValueOnce({ affectedRows: 1 })
      queryOne.mockResolvedValueOnce({ id: 'e1', title: '活动' })
      query.mockResolvedValueOnce([])

      const result = await joinEvent('e1', 'user1')

      expect(result.title).toBe('活动')
    })

    it('不存在的活动应返回 404', async () => {
      queryOne.mockResolvedValueOnce(null)

      await expect(joinEvent('e999', 'user1')).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  describe('leaveEvent', () => {
    it('应离开活动', async () => {
      queryOne.mockResolvedValueOnce({ id: 'e1', title: '活动' })
      query.mockResolvedValueOnce({ affectedRows: 1 })
      queryOne.mockResolvedValueOnce({ id: 'e1', title: '活动' })
      query.mockResolvedValueOnce([])

      const result = await leaveEvent('e1', 'user1')

      expect(result.title).toBe('活动')
    })

    it('不存在的活动应返回 404', async () => {
      queryOne.mockResolvedValueOnce(null)

      await expect(leaveEvent('e999', 'user1')).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  describe('generateICS', () => {
    it('应生成有效的 ICS 日历字符串', () => {
      const event = {
        id: 'evt-001',
        title: '舰队阅兵',
        description: '年度舰队阅兵活动',
        start_time: '2026-06-15T10:00:00Z',
        end_time: '2026-06-15T12:00:00Z',
        location: '斯坦顿星系',
        status: 'upcoming',
        creator_id: 'user1'
      }

      const ics = generateICS(event)

      expect(ics).toContain('BEGIN:VCALENDAR')
      expect(ics).toContain('VERSION:2.0')
      expect(ics).toContain('BEGIN:VEVENT')
      expect(ics).toContain('SUMMARY:舰队阅兵')
      expect(ics).toContain('LOCATION:斯坦顿星系')
      expect(ics).toContain('END:VEVENT')
      expect(ics).toContain('END:VCALENDAR')
    })

    it('无结束时间和地点时应生成最小 ICS', () => {
      const event = {
        id: 'evt-002',
        title: '简单活动',
        description: null,
        start_time: '2026-07-01T10:00:00Z',
        end_time: null,
        location: null,
        status: 'upcoming',
        creator_id: null
      }

      const ics = generateICS(event)

      expect(ics).toContain('BEGIN:VCALENDAR')
      expect(ics).toContain('SUMMARY:简单活动')
      expect(ics).not.toContain('LOCATION:')
      expect(ics).not.toContain('DTEND:')
    })

    it('应转义 ICS 特殊字符（反斜杠/分号/逗号）', () => {
      const event = {
        id: 'evt-003',
        title: '行动;代号:Alpha, 首战',
        description: '路线: A\\B, 分号;测试',
        start_time: '2026-07-02T10:00:00Z',
        end_time: null,
        location: '格林, 星系;分区1',
        status: 'upcoming',
        creator_id: null
      }

      const ics = generateICS(event)

      // 分号 → \;
      expect(ics).toContain('SUMMARY:行动\\;代号:Alpha\\, 首战')
      // 反斜杠 → \\，逗号 → \,
      expect(ics).toContain('DESCRIPTION:路线: A\\\\B\\, 分号\\;测试')
      // location 逗号与分号均转义
      expect(ics).toContain('LOCATION:格林\\, 星系\\;分区1')
      // 原始未转义字符不应出现
      expect(ics).not.toContain('SUMMARY:行动;')
      expect(ics).not.toContain('DESCRIPTION:路线: A\\B')
    })

    it('应转义换行符为字面量 \\n', () => {
      const event = {
        id: 'evt-004',
        title: '多行活动',
        description: '第一行\n第二行',
        start_time: '2026-07-03T10:00:00Z',
        end_time: null,
        location: null,
        status: 'upcoming',
        creator_id: null
      }

      const ics = generateICS(event)

      // 换行 → \n 字面量（两个字符），而非真实换行
      expect(ics).toContain('DESCRIPTION:第一行\\n第二行')
      // 转义后 DESCRIPTION 不应包含真实换行导致的裸字段
      const descriptionLine = ics.split('\r\n').find((l) => l.startsWith('DESCRIPTION:'))
      expect(descriptionLine).toBe('DESCRIPTION:第一行\\n第二行')
    })
  })
})