/**
 * @file 项目服务层单元测试
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.unstable_mockModule('../../src/database/pool.ts', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  transaction: jest.fn((cb) => cb({ execute: jest.fn() }))
}))

const { query, queryOne, transaction } = await import('../../src/database/pool.ts')
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} = await import('../../src/services/projectService.ts')

describe('projectService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getProjects', () => {
    it('应返回项目列表', async () => {
      query.mockResolvedValueOnce([{ id: 'pr1', name: 'Project A' }])
      queryOne.mockResolvedValueOnce({ total: 1 })

      const result = await getProjects({ limit: 10, offset: 0 })

      expect(result.projects).toHaveLength(1)
      expect(result.pagination.total).toBe(1)
    })
  })

  describe('getProjectById', () => {
    it('应返回项目', async () => {
      queryOne.mockResolvedValueOnce({ id: 'pr1', name: 'Project A' })

      const result = await getProjectById('pr1')

      expect(result.name).toBe('Project A')
    })
  })

  describe('createProject', () => {
    it('应创建新项目', async () => {
      query.mockResolvedValueOnce({ affectedRows: 1 })
      queryOne.mockResolvedValueOnce({ id: 'pr1', name: 'New Project' })

      const result = await createProject({ name: 'New Project' })

      expect(result.name).toBe('New Project')
    })
  })

  describe('updateProject', () => {
    it('应更新项目', async () => {
      const conn = { execute: jest.fn() }
      conn.execute
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[{ id: 'pr1', name: 'Updated' }]])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      const result = await updateProject('pr1', { name: 'Updated' })

      expect(result.name).toBe('Updated')
    })

    it('不存在的项目应返回 404', async () => {
      const conn = { execute: jest.fn() }
      conn.execute.mockResolvedValueOnce([{ affectedRows: 0 }])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      await expect(updateProject('pr99', { name: 'Test' }))
        .rejects.toMatchObject({ statusCode: 404 })
    })
  })

  describe('deleteProject', () => {
    it('应删除项目', async () => {
      queryOne.mockResolvedValueOnce({ id: 'pr1' })
      query.mockResolvedValueOnce({ affectedRows: 1 })

      await expect(deleteProject('pr1')).resolves.toBeUndefined()
    })

    it('不存在的项目应返回 404', async () => {
      queryOne.mockResolvedValueOnce(null)

      await expect(deleteProject('pr99')).rejects.toMatchObject({ statusCode: 404 })
    })
  })
})
