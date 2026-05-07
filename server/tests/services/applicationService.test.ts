/**
 * @file 申请服务层单元测试
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.unstable_mockModule('../../src/database/pool.ts', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  transaction: jest.fn((cb) => cb({ execute: jest.fn() }))
}))

const { query, queryOne, transaction } = await import('../../src/database/pool.ts')
const {
  getApplications,
  getApplicationById,
  submitApplication,
  updateApplicationStatus,
  deleteApplication
} = await import('../../src/services/applicationService.ts')

describe('applicationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getApplications', () => {
    it('应返回申请列表', async () => {
      query.mockResolvedValueOnce([{ id: 'a1', name: 'Test' }])
      queryOne.mockResolvedValueOnce({ total: 1 })

      const result = await getApplications({ limit: 10, offset: 0 })

      expect(result.applications).toHaveLength(1)
    })
  })

  describe('getApplicationById', () => {
    it('应返回申请详情', async () => {
      queryOne.mockResolvedValueOnce({ id: 'a1', name: 'Test', reviewer_name: 'Admin' })

      const result = await getApplicationById('a1')

      expect(result.reviewer_name).toBe('Admin')
    })
  })

  describe('submitApplication', () => {
    it('应成功提交申请', async () => {
      const conn = { execute: jest.fn() }
      conn.execute
        .mockResolvedValueOnce([[]]) // 无重复申请
        .mockResolvedValueOnce([{ insertId: 'a1' }])
        .mockResolvedValueOnce([[{ id: 'a1', status: 'pending' }]])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      const result = await submitApplication({
        name: 'Test',
        email: 'test@e.com',
        discord: 'test#1234',
        experience: '100h',
        availability: 'flexible',
        reason: 'Join team'
      })

      expect(result.status).toBe('pending')
    })

    it('24小时内重复申请应返回冲突', async () => {
      const conn = { execute: jest.fn() }
      conn.execute.mockResolvedValueOnce([[{ id: 'a1', created_at: new Date() }]])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      await expect(submitApplication({ name: 'Test', email: 'test@e.com' }))
        .rejects.toMatchObject({ statusCode: 409 })
    })
  })

  describe('updateApplicationStatus', () => {
    it('应更新申请状态', async () => {
      const conn = { execute: jest.fn() }
      conn.execute
        .mockResolvedValueOnce([[{ id: 'a1', status: 'pending' }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[{ id: 'a1', status: 'approved', reviewer_name: 'Admin' }]])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      const result = await updateApplicationStatus('a1', 'approved', 'u1', 'Welcome')

      expect(result.status).toBe('approved')
    })

    it('不存在的申请应返回 404', async () => {
      const conn = { execute: jest.fn() }
      conn.execute.mockResolvedValueOnce([[]])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      await expect(updateApplicationStatus('a99', 'approved', 'u1'))
        .rejects.toMatchObject({ statusCode: 404 })
    })
  })

  describe('deleteApplication', () => {
    it('应删除申请', async () => {
      queryOne.mockResolvedValueOnce({ id: 'a1' })
      query.mockResolvedValueOnce({ affectedRows: 1 })

      await expect(deleteApplication('a1')).resolves.toBeUndefined()
    })

    it('不存在的申请应返回 404', async () => {
      queryOne.mockResolvedValueOnce(null)

      await expect(deleteApplication('a99')).rejects.toMatchObject({ statusCode: 404 })
    })
  })
})
