/**
 * 舰队状态管理 Store
 * @description 管理飞船数据、筛选、统计数据等
 * @module stores/fleet
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fleetService } from '@/services/fleetService'
import { createStoreHelpers } from '@/utils/storeHelpers'

export const useFleetStore = defineStore('fleet', () => {
  // ========== 状态定义 ==========
  const ships = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filter = ref('all') // all|combat|transport|explore
  const searchQuery = ref('')
  const sortBy = ref('name') // name|value|added
  const sortOrder = ref('asc') // asc|desc

  const { withLoading } = createStoreHelpers(loading, error)

  /**
   * 解包服务端返回的 { data: ... } 包装结构
   * @description 兼容直接返回实体与包装响应两种格式
   * @param {any} res - 服务层返回值
   * @returns {any} 实际业务数据
   */
  const unwrap = (res) => res?.data ?? res

  // ========== 计算属性 ==========
  const filteredShips = computed(() => {
    let result = [...ships.value]

    // 按类别筛选
    if (filter.value !== 'all') {
      result = result.filter(ship => ship.category === filter.value)
    }

    // 搜索过滤
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(ship =>
        ship.name.toLowerCase().includes(query) ||
        ship.callsign?.toLowerCase().includes(query) ||
        ship.ship?.toLowerCase().includes(query)
      )
    }

    // 排序
    result.sort((a, b) => {
      let compare = 0

      switch (sortBy.value) {
        case 'name':
          compare = a.name.localeCompare(b.name)
          break
        case 'value':
          compare = (a.value || 0) - (b.value || 0)
          break
        case 'added':
          compare = new Date(a.addedAt || 0) - new Date(b.addedAt || 0)
          break
      }

      return sortOrder.value === 'desc' ? -compare : compare
    })

    return result
  })

  const totalValue = computed(() =>
    ships.value.reduce((sum, ship) => sum + (ship.value || 0), 0)
  )

  const shipCategories = computed(() => {
    const categories = {}
    ships.value.forEach(ship => {
      const cat = ship.category || 'other'
      categories[cat] = (categories[cat] || 0) + 1
    })
    return categories
  })

  const shipsByStatus = computed(() => {
    const status = { available: 0, borrowed: 0, inMission: 0, maintenance: 0 }
    ships.value.forEach(ship => {
      status[ship.status || 'available']++
    })
    return status
  })

  // ========== 方法定义 ==========

  /** 获取舰队列表 */
  async function fetchShips(params = {}) {
    return withLoading(async () => {
      const data = await fleetService.getFleet(params)
      ships.value = unwrap(data) || []
      return ships.value
    }, '获取舰队数据失败')
  }

  /** 获取单艘飞船详情 */
  async function fetchShip(shipId) {
    if (!shipId) throw new Error('shipId is required')
    return withLoading(async () => unwrap(await fleetService.getShip(shipId)), '获取飞船详情失败')
  }

  /** 添加飞船 */
  async function addShip(shipData) {
    return withLoading(async () => {
      const data = unwrap(await fleetService.createShip(shipData))
      ships.value.push(data)
      return data
    }, '添加飞船失败')
  }

  /** 更新飞船信息 */
  async function updateShip(shipId, updates) {
    if (!shipId) throw new Error('shipId is required')
    return withLoading(async () => {
      const data = unwrap(await fleetService.updateShip(shipId, updates))
      const index = ships.value.findIndex(s => s.id === shipId)
      if (index !== -1) {
        ships.value[index] = { ...ships.value[index], ...data }
      }
      return data
    }, '更新飞船失败')
  }

  /** 删除飞船 */
  async function deleteShip(shipId) {
    if (!shipId) throw new Error('shipId is required')
    return withLoading(async () => {
      await fleetService.deleteShip(shipId)
      ships.value = ships.value.filter(s => s.id !== shipId)
    }, '删除飞船失败')
  }

  /** 设置筛选条件 */
  function setFilter(newFilter) {
    filter.value = newFilter
  }

  /** 设置搜索查询 */
  function setSearchQuery(query) {
    searchQuery.value = query
  }

  /** 设置排序 */
  function setSorting(sortKey, order) {
    if (sortBy.value === sortKey) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = sortKey
      sortOrder.value = order || 'asc'
    }
  }

  /** 清除错误状态 */
  function clearError() {
    error.value = null
  }

  /** 重置状态 */
  function resetState() {
    ships.value = []
    loading.value = false
    error.value = null
    filter.value = 'all'
    searchQuery.value = ''
    sortBy.value = 'name'
    sortOrder.value = 'asc'
  }

  return {
    ships, loading, error, filter, searchQuery, sortBy, sortOrder,
    filteredShips, totalValue, shipCategories, shipsByStatus,
    fetchShips, fetchShip, addShip, updateShip, deleteShip,
    setFilter, setSearchQuery, setSorting, clearError, resetState
  }
})
