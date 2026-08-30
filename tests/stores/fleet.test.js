/**
 * @file 舰队状态 Store 测试
 * @description 覆盖 fetchShips / addShip / updateShip / deleteShip / 筛选 / 排序
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock fleetService
vi.mock('@/services/fleetService', () => ({
  fleetService: {
    getFleet: vi.fn(),
    getShip: vi.fn(),
    createShip: vi.fn(),
    updateShip: vi.fn(),
    deleteShip: vi.fn(),
    getFleetStats: vi.fn()
  }
}))

import { useFleetStore } from '@/stores/fleet.js'
import { fleetService } from '@/services/fleetService'

const mockShips = [
  { id: '1', name: 'Aurora MR', ship: 'Aurora', category: 'transport', value: 100000, status: 'available' },
  { id: '2', name: 'Hornet F7C', ship: 'Hornet', category: 'combat', value: 250000, status: 'available' },
  { id: '3', name: 'Constellation', ship: 'Constellation', category: 'explore', value: 500000, status: 'maintenance' }
]

describe('useFleetStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const store = useFleetStore()

      expect(store.ships).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.filter).toBe('all')
      expect(store.searchQuery).toBe('')
      expect(store.sortBy).toBe('name')
      expect(store.sortOrder).toBe('asc')
    })
  })

  describe('fetchShips', () => {
    it('应该获取飞船列表并更新状态', async () => {
      const store = useFleetStore()
      fleetService.getFleet.mockResolvedValue({ data: mockShips })

      await store.fetchShips()

      expect(store.ships).toEqual(mockShips)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('请求失败时应该设置错误信息', async () => {
      const store = useFleetStore()
      fleetService.getFleet.mockRejectedValue(new Error('网络错误'))

      await expect(store.fetchShips()).rejects.toThrow()

      expect(store.error).toBe('网络错误')
      expect(store.loading).toBe(false)
    })

    it('返回空数据时 ships 应为空数组', async () => {
      const store = useFleetStore()
      fleetService.getFleet.mockResolvedValue({ data: [] })

      await store.fetchShips()

      expect(store.ships).toEqual([])
    })
  })

  describe('addShip', () => {
    it('应该添加飞船到列表', async () => {
      const store = useFleetStore()
      const newShip = { id: '4', name: '新飞船', ship: 'Gladius' }
      fleetService.createShip.mockResolvedValue({ data: newShip })

      const result = await store.addShip({ name: '新飞船', ship: 'Gladius' })

      expect(store.ships).toContainEqual(newShip)
      expect(result).toEqual(newShip)
    })

    it('请求失败时应该设置错误信息', async () => {
      const store = useFleetStore()
      fleetService.createShip.mockRejectedValue(new Error('创建失败'))

      await expect(store.addShip({ name: '飞船', ship: '型号' })).rejects.toThrow()

      expect(store.error).toBe('创建失败')
    })
  })

  describe('updateShip', () => {
    it('应该更新指定飞船的信息', async () => {
      const store = useFleetStore()
      store.ships = [...mockShips]
      fleetService.updateShip.mockResolvedValue({ data: { id: '1', name: '更新后' } })

      await store.updateShip('1', { name: '更新后' })

      expect(store.ships.find(s => s.id === '1').name).toBe('更新后')
    })

    it('不存在的飞船不应影响列表', async () => {
      const store = useFleetStore()
      store.ships = [...mockShips]
      fleetService.updateShip.mockResolvedValue({ data: { id: '999', name: '不存在' } })

      await store.updateShip('999', { name: '不存在' })

      expect(store.ships.length).toBe(3)
    })
  })

  describe('deleteShip', () => {
    it('应该从列表中移除飞船', async () => {
      const store = useFleetStore()
      store.ships = [...mockShips]
      fleetService.deleteShip.mockResolvedValue({})

      await store.deleteShip('1')

      expect(store.ships.length).toBe(2)
      expect(store.ships.find(s => s.id === '1')).toBeUndefined()
    })

    it('请求失败时不应移除飞船', async () => {
      const store = useFleetStore()
      store.ships = [...mockShips]
      fleetService.deleteShip.mockRejectedValue(new Error('删除失败'))

      await expect(store.deleteShip('1')).rejects.toThrow()

      expect(store.ships.length).toBe(3)
    })
  })

  describe('筛选与排序', () => {
    it('setFilter 应该更新筛选条件', () => {
      const store = useFleetStore()

      store.setFilter('combat')

      expect(store.filter).toBe('combat')
    })

    it('setSearchQuery 应该更新搜索关键词', () => {
      const store = useFleetStore()

      store.setSearchQuery('aurora')

      expect(store.searchQuery).toBe('aurora')
    })

    it('setSorting 相同字段应切换排序方向', () => {
      const store = useFleetStore()
      store.sortBy = 'name'
      store.sortOrder = 'asc'

      store.setSorting('name')

      expect(store.sortOrder).toBe('desc')
    })

    it('setSorting 不同字段应重置排序方向', () => {
      const store = useFleetStore()
      store.sortBy = 'name'
      store.sortOrder = 'desc'

      store.setSorting('value', 'asc')

      expect(store.sortBy).toBe('value')
      expect(store.sortOrder).toBe('asc')
    })
  })

  describe('计算属性', () => {
    it('filteredShips 应该按类别筛选', () => {
      const store = useFleetStore()
      store.ships = [...mockShips]
      store.filter = 'combat'

      expect(store.filteredShips.length).toBe(1)
      expect(store.filteredShips[0].name).toBe('Hornet F7C')
    })

    it('filteredShips 应该按搜索词过滤', () => {
      const store = useFleetStore()
      store.ships = [...mockShips]
      store.searchQuery = 'aurora'

      expect(store.filteredShips.length).toBe(1)
      expect(store.filteredShips[0].name).toBe('Aurora MR')
    })

    it('filteredShips 应该按名称排序', () => {
      const store = useFleetStore()
      store.ships = [...mockShips]
      store.sortBy = 'name'
      store.sortOrder = 'asc'

      expect(store.filteredShips[0].name).toBe('Aurora MR')
      expect(store.filteredShips[2].name).toBe('Hornet F7C')
    })

    it('totalValue 应该计算所有飞船总价值', () => {
      const store = useFleetStore()
      store.ships = [...mockShips]

      expect(store.totalValue).toBe(850000)
    })

    it('shipCategories 应该统计各类别数量', () => {
      const store = useFleetStore()
      store.ships = [...mockShips]

      expect(store.shipCategories.combat).toBe(1)
      expect(store.shipCategories.transport).toBe(1)
      expect(store.shipCategories.explore).toBe(1)
    })
  })

  describe('resetState', () => {
    it('应该重置所有状态', () => {
      const store = useFleetStore()
      store.ships = [...mockShips]
      store.filter = 'combat'
      store.searchQuery = 'test'

      store.resetState()

      expect(store.ships).toEqual([])
      expect(store.filter).toBe('all')
      expect(store.searchQuery).toBe('')
      expect(store.sortBy).toBe('name')
      expect(store.sortOrder).toBe('asc')
    })
  })
})
