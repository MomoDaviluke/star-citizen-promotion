/**
 * @file 舰队服务层单元测试
 * @description 测试 fleetService 的 CRUD 和统计功能
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.unstable_mockModule('../../src/database/pool.ts', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  transaction: jest.fn((cb) => cb({ execute: jest.fn() }))
}))

const { query, queryOne, transaction } = await import('../../src/database/pool.ts')
const {
  getShips,
  getShipById,
  createShip,
  updateShip,
  deleteShip,
  getFleetStats
} = await import('../../src/services/fleetService.ts')

describe('fleetService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getShips', () => {
    it('应返回飞船列表和分页', async () => {
      query.mockResolvedValueOnce([{ id: 's1', name: '复仇者', category: 'combat' }])
      queryOne.mockResolvedValueOnce({ total: 1 })

      const result = await getShips({ limit: 10, offset: 0 })

      expect(result.ships).toHaveLength(1)
      expect(result.pagination.total).toBe(1)
      expect(result.pagination.hasMore).toBe(false)
    })

    it('应支持分类筛选', async () => {
      query.mockResolvedValueOnce([])
      queryOne.mockResolvedValueOnce({ total: 0 })

      await getShips({ category: 'combat', limit: 10, offset: 0 })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('category = ?'),
        expect.arrayContaining(['combat'])
      )
    })

    it('应支持状态筛选', async () => {
      query.mockResolvedValueOnce([])
      queryOne.mockResolvedValueOnce({ total: 0 })

      await getShips({ status: 'available', limit: 10, offset: 0 })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('status = ?'),
        expect.arrayContaining(['available'])
      )
    })

    it('应支持按价值排序', async () => {
      query.mockResolvedValueOnce([])
      queryOne.mockResolvedValueOnce({ total: 0 })

      await getShips({ sortBy: 'value', order: 'desc', limit: 10, offset: 0 })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY value DESC'),
        expect.any(Array)
      )
    })

    it('hasMore 为 true 当还有更多数据', async () => {
      query.mockResolvedValueOnce(new Array(10).fill({ id: 's1' }))
      queryOne.mockResolvedValueOnce({ total: 25 })

      const result = await getShips({ limit: 10, offset: 0 })

      expect(result.pagination.hasMore).toBe(true)
    })
  })

  describe('getShipById', () => {
    it('应返回飞船详情', async () => {
      queryOne.mockResolvedValueOnce({ id: 's1', name: '复仇者', category: 'combat' })

      const result = await getShipById('s1')

      expect(result).not.toBeNull()
      expect(result!.name).toBe('复仇者')
    })

    it('不存在的飞船应返回 null', async () => {
      queryOne.mockResolvedValueOnce(null)

      const result = await getShipById('s999')

      expect(result).toBeNull()
    })
  })

  describe('createShip', () => {
    it('应创建新飞船', async () => {
      query.mockResolvedValueOnce({ affectedRows: 1 })
      queryOne.mockResolvedValueOnce({ id: 's1', name: '新飞船', category: 'combat', status: 'available' })

      const result = await createShip({ name: '新飞船', ship: 'F7C Hornet', category: 'combat' })

      expect(result).not.toBeNull()
      expect(result!.name).toBe('新飞船')
    })
  })

  describe('updateShip', () => {
    it('应更新飞船', async () => {
      const conn = { execute: jest.fn() }
      conn.execute
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[{ id: 's1', name: '新名', category: 'combat' }]])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      const result = await updateShip('s1', { name: '新名' })

      expect(result.name).toBe('新名')
    })

    it('不存在的飞船应返回 404', async () => {
      const conn = { execute: jest.fn() }
      conn.execute.mockResolvedValueOnce([{ affectedRows: 0 }])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      await expect(updateShip('s999', { name: 'Test' })).rejects.toMatchObject({ statusCode: 404 })
    })

    it('无更新内容应返回 400', async () => {
      const conn = { execute: jest.fn() }
      conn.execute.mockResolvedValueOnce([{ affectedRows: 0 }])

      transaction.mockImplementationOnce(async (cb) => cb(conn))

      await expect(updateShip('s1', {})).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  describe('deleteShip', () => {
    it('应删除飞船', async () => {
      queryOne.mockResolvedValueOnce({ id: 's1', name: '待删除' })
      query.mockResolvedValueOnce({ affectedRows: 1 })

      await expect(deleteShip('s1')).resolves.toBeUndefined()
    })

    it('不存在的飞船应返回 404', async () => {
      queryOne.mockResolvedValueOnce(null)

      await expect(deleteShip('s999')).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  describe('getFleetStats', () => {
    it('应返回舰队统计数据', async () => {
      query
        .mockResolvedValueOnce([{ category: 'combat', count: 5 }, { category: 'transport', count: 3 }])
        .mockResolvedValueOnce([{ status: 'available', count: 6 }, { status: 'maintenance', count: 2 }])
        .mockResolvedValueOnce([{ total: 8, totalValue: 15000000 }])

      const stats = await getFleetStats()

      expect(stats.totalShips).toBe(8)
      expect(stats.totalValue).toBe(15000000)
      expect(stats.byCategory.combat).toBe(5)
      expect(stats.byCategory.transport).toBe(3)
      expect(stats.byStatus.available).toBe(6)
      expect(stats.byStatus.maintenance).toBe(2)
    })
  })
})