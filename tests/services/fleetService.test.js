/**
 * @file 舰队服务测试
 * @description 覆盖 getFleet / getShip / createShip / updateShip / deleteShip / getFleetStats
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock httpClient
vi.mock('@/services/http.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}))

// Mock logger
vi.mock('@/utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })
}))

import httpClient from '@/services/http.js'
import { fleetService, getFleet, getShip, createShip, updateShip, deleteShip, getFleetStats } from '@/services/fleetService.js'

describe('fleetService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---- getFleet ----

  describe('getFleet', () => {
    it('应该调用 GET /api/fleet 并返回数据', async () => {
      const mockData = { data: [{ id: '1', name: 'Aurora MR', ship: 'Aurora' }] }
      httpClient.get.mockResolvedValue({ data: mockData })

      const result = await getFleet()

      expect(httpClient.get).toHaveBeenCalledWith('/api/fleet', {})
      expect(result).toEqual(mockData)
    })

    it('应该传递查询参数', async () => {
      httpClient.get.mockResolvedValue({ data: { data: [] } })

      await getFleet({ category: 'combat', sortBy: 'value' })

      expect(httpClient.get).toHaveBeenCalledWith('/api/fleet', {
        category: 'combat', sortBy: 'value'
      })
    })

    it('请求失败时应该抛出错误', async () => {
      httpClient.get.mockRejectedValue(new Error('网络错误'))

      await expect(getFleet()).rejects.toThrow('网络错误')
    })

    it('返回空数据时应返回空数组', async () => {
      httpClient.get.mockResolvedValue({ data: { data: [] } })

      const result = await getFleet()

      expect(result.data).toEqual([])
    })
  })

  // ---- getShip ----

  describe('getShip', () => {
    it('应该调用 GET /api/fleet/:id 并返回数据', async () => {
      const mockShip = { data: { id: '1', name: 'Aurora MR' } }
      httpClient.get.mockResolvedValue(mockShip)

      const result = await getShip('1')

      expect(httpClient.get).toHaveBeenCalledWith('/api/fleet/1')
      expect(result).toEqual(mockShip.data)
    })

    it('缺少 shipId 应该抛出错误', async () => {
      await expect(getShip()).rejects.toThrow('shipId is required')
      await expect(getShip('')).rejects.toThrow('shipId is required')
    })
  })

  // ---- createShip ----

  describe('createShip', () => {
    it('应该调用 POST /api/fleet 并返回创建的飞船', async () => {
      const shipData = { name: '新飞船', ship: 'Hornet F7C' }
      const mockResponse = { data: { id: '2', ...shipData } }
      httpClient.post.mockResolvedValue(mockResponse)

      const result = await createShip(shipData)

      expect(httpClient.post).toHaveBeenCalledWith('/api/fleet', shipData)
      expect(result).toEqual(mockResponse.data)
    })

    it('缺少 name 应该抛出错误', async () => {
      await expect(createShip({ ship: 'Hornet' }))
        .rejects.toThrow('飞船名称和型号不能为空')
    })

    it('缺少 ship 应该抛出错误', async () => {
      await expect(createShip({ name: '飞船' }))
        .rejects.toThrow('飞船名称和型号不能为空')
    })

    it('空对象应该抛出错误', async () => {
      await expect(createShip({}))
        .rejects.toThrow('飞船名称和型号不能为空')
    })

    it('null 应该抛出错误', async () => {
      await expect(createShip(null))
        .rejects.toThrow('飞船名称和型号不能为空')
    })
  })

  // ---- updateShip ----

  describe('updateShip', () => {
    it('应该调用 PATCH /api/fleet/:id', async () => {
      const updates = { name: '更新后的名称' }
      httpClient.patch.mockResolvedValue({ data: { id: '1', ...updates } })

      const result = await updateShip('1', updates)

      expect(httpClient.patch).toHaveBeenCalledWith('/api/fleet/1', updates)
      expect(result.name).toBe('更新后的名称')
    })

    it('缺少 shipId 应该抛出错误', async () => {
      await expect(updateShip('', {})).rejects.toThrow('shipId is required')
    })
  })

  // ---- deleteShip ----

  describe('deleteShip', () => {
    it('应该调用 DELETE /api/fleet/:id', async () => {
      httpClient.delete.mockResolvedValue({})

      await deleteShip('1')

      expect(httpClient.delete).toHaveBeenCalledWith('/api/fleet/1')
    })

    it('缺少 shipId 应该抛出错误', async () => {
      await expect(deleteShip()).rejects.toThrow('shipId is required')
    })

    it('请求失败时应该抛出错误', async () => {
      httpClient.delete.mockRejectedValue(new Error('删除失败'))

      await expect(deleteShip('1')).rejects.toThrow('删除失败')
    })
  })

  // ---- getFleetStats ----

  describe('getFleetStats', () => {
    it('应该调用 GET /api/fleet/stats', async () => {
      const mockStats = { data: { total: 15, combat: 5, transport: 5, explore: 5 } }
      httpClient.get.mockResolvedValue(mockStats)

      const result = await getFleetStats()

      expect(httpClient.get).toHaveBeenCalledWith('/api/fleet/stats')
      expect(result).toEqual(mockStats.data)
    })

    it('请求失败时应该抛出错误', async () => {
      httpClient.get.mockRejectedValue(new Error('获取统计失败'))

      await expect(getFleetStats()).rejects.toThrow('获取统计失败')
    })
  })

  // ---- fleetService 对象 ----

  describe('fleetService 对象', () => {
    it('应该导出所有方法', () => {
      expect(fleetService.getFleet).toBe(getFleet)
      expect(fleetService.getShip).toBe(getShip)
      expect(fleetService.createShip).toBe(createShip)
      expect(fleetService.updateShip).toBe(updateShip)
      expect(fleetService.deleteShip).toBe(deleteShip)
      expect(fleetService.getFleetStats).toBe(getFleetStats)
    })
  })
})
