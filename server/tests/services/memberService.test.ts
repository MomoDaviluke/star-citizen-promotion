/**
 * @file 成员服务层单元测试
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.unstable_mockModule('../../src/database/pool.ts', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  transaction: jest.fn((cb) => cb({ execute: jest.fn() }))
}))

const { query, queryOne, transaction } = await import('../../src/database/pool.ts')
const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
} = await import('../../src/services/memberService.ts')

describe('memberService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getMembers', () => {
    it('应返回成员列表和分页', async () => {
      query.mockResolvedValueOnce([{ id: 'm1', name: 'Echo' }])
      queryOne.mockResolvedValueOnce({ total: 1 })

      const result = await getMembers({ limit: 10, offset: 0 })

      expect(result.members).toHaveLength(1)
      expect(result.pagination.total).toBe(1)
      expect(result.pagination.hasMore).toBe(false)
    })

    it('应支持状态筛选', async () => {
      query.mockResolvedValueOnce([])
      queryOne.mockResolvedValueOnce({ total: 0 })

      await getMembers({ status: 'active', limit: 10, offset: 0 })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = ?'),
        expect.arrayContaining(['active'])
      )
    })
  })

  describe('getMemberById', () => {
    it('应返回成员', async () => {
      queryOne.mockResolvedValueOnce({ id: 'm1', name: 'Echo' })

      const result = await getMemberById('m1')

      expect(result.name).toBe('Echo')
    })
  })

  describe('createMember', () => {
    it('应创建新成员', async () => {
      query.mockResolvedValueOnce({ affectedRows: 1 })
      queryOne.mockResolvedValueOnce({ id: 'm1', name: 'Nova', role: '后勤' })

      const result = await createMember({ name: 'Nova', role: '后勤' })

      expect(result.name).toBe('Nova')
    })
  })

  describe('updateMember', () => {
    it('应更新成员', async () => {
      const conn = { execute: jest.fn() }
      conn.execute
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[{ id: 'm1', name: 'Echo Updated' }]])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      const result = await updateMember('m1', { name: 'Echo Updated' })

      expect(result.name).toBe('Echo Updated')
    })

    it('不存在的成员应返回 404', async () => {
      const conn = { execute: jest.fn() }
      conn.execute.mockResolvedValueOnce([{ affectedRows: 0 }])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      await expect(updateMember('m99', { name: 'Test' })).rejects.toMatchObject({ statusCode: 404 })
    })

    it('无更新内容应返回 400', async () => {
      const conn = { execute: jest.fn() }
      conn.execute.mockResolvedValueOnce([{ affectedRows: 0 }])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      await expect(updateMember('m1', {})).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  describe('deleteMember', () => {
    it('应删除成员', async () => {
      queryOne.mockResolvedValueOnce({ id: 'm1', name: 'Echo' })
      query.mockResolvedValueOnce({ affectedRows: 1 })

      await expect(deleteMember('m1')).resolves.toBeUndefined()
    })

    it('不存在的成员应返回 404', async () => {
      queryOne.mockResolvedValueOnce(null)

      await expect(deleteMember('m99')).rejects.toMatchObject({ statusCode: 404 })
    })
  })
})
