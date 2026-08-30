/**
 * @file 活动日志服务层单元测试
 * @description 测试 getActivityLogs 的条件拼接/分页与 logActivity 的写入参数
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.unstable_mockModule('../../src/database/pool.ts', () => ({
  query: jest.fn(),
  queryOne: jest.fn()
}))

const { query, queryOne } = await import('../../src/database/pool.ts')
const { getActivityLogs, logActivity } = await import('../../src/services/activityLogService.ts')

describe('activityLogService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getActivityLogs', () => {
    it('无过滤条件时返回日志列表与分页结构', async () => {
      query.mockResolvedValue([{ id: '1', action: 'login', username: 'alice' }])
      queryOne.mockResolvedValue({ total: 1 })

      const result = await getActivityLogs({ limit: 10, offset: 0 })

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({ id: '1', username: 'alice' })
      expect(result.pagination).toEqual({ total: 1, limit: 10, offset: 0, hasMore: false })
      // 必须 JOIN users 获取操作人用户名
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('LEFT JOIN users u'),
        [10, 0]
      )
    })

    it('action 过滤时拼接 WHERE 且参数顺序为 [action, limit, offset]', async () => {
      query.mockResolvedValue([])
      queryOne.mockResolvedValue({ total: 0 })

      await getActivityLogs({ action: 'reset-db', limit: 5, offset: 0 })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('a.action = ?'),
        ['reset-db', 5, 0]
      )
      // count 查询同样带 action 条件
      expect(queryOne).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*)'),
        ['reset-db']
      )
    })

    it('userId 过滤时拼接 a.user_id = ? 条件', async () => {
      query.mockResolvedValue([])
      queryOne.mockResolvedValue({ total: 0 })

      await getActivityLogs({ userId: 'u-42', limit: 10, offset: 0 })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('a.user_id = ?'),
        ['u-42', 10, 0]
      )
    })

    it('offset + 长度小于 total 时 hasMore 为 true', async () => {
      query.mockResolvedValue([{ id: '1' }, { id: '2' }])
      queryOne.mockResolvedValue({ total: 15 })

      const result = await getActivityLogs({ limit: 10, offset: 0 })

      expect(result.pagination.hasMore).toBe(true)
    })

    it('count 查询无结果时 total 兜底为 0', async () => {
      query.mockResolvedValue([])
      queryOne.mockResolvedValue(undefined)

      const result = await getActivityLogs({ limit: 10, offset: 20 })

      expect(result.pagination.total).toBe(0)
      expect(result.pagination.hasMore).toBe(false)
    })
  })

  describe('logActivity', () => {
    it('应生成 uuid 并将 details 序列化写入', async () => {
      await logActivity({
        userId: 'u-1',
        action: 'create',
        entityType: 'member',
        details: { name: '新成员' },
        ipAddress: '::1',
        userAgent: 'test-agent'
      })

      expect(query).toHaveBeenCalledTimes(1)
      const [sql, params] = query.mock.calls[0]
      expect(String(sql)).toContain('INSERT INTO activity_logs')
      expect(params[0]).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/))
      expect(params[1]).toBe('u-1')
      expect(params[2]).toBe('create')
      expect(params[3]).toBe('member')
      expect(params[5]).toBe('{"name":"新成员"}')
      expect(params[6]).toBe('::1')
      expect(params[7]).toBe('test-agent')
    })

    it('可选字段为空时写入 null 兜底', async () => {
      await logActivity({ action: 'anonymous' })

      const [, params] = query.mock.calls[0]
      expect(params[1]).toBeNull()
      expect(params[3]).toBeNull()
      expect(params[4]).toBeNull()
      expect(params[5]).toBeNull()
      expect(params[6]).toBeNull()
      expect(params[7]).toBeNull()
    })
  })
})