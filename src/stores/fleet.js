/**
 * 舰队状态管理 Store
 * @description 管理飞船数据、筛选、统计数据等
 * @module stores/fleet
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fleetService } from '@/services/fleetService'

export const useFleetStore = defineStore('fleet', () => {
  // ========== 状态定义 ==========
  const ships = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filter = ref('all') // all|combat|transport|explore
  const searchQuery = ref('')
  const sortBy = ref('name') // name|value|added
  const sortOrder = ref('asc') // asc|desc

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

  /**
   * 获取舰队列表
   * @param {Object} [params] - 查询参数
   * @returns {Promise<Array>} 飞船列表
   */
  async function fetchShips(params = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await fleetService.getFleet(params)
      ships.value = response.data || []
      return ships.value
    } catch (err) {
      error.value = err.message || '获取舰队数据失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取单艘飞船详情
   * @param {string} shipId - 飞船ID
   * @returns {Promise<Object>} 飞船详情
   */
  async function fetchShip(shipId) {
    if (!shipId) throw new Error('shipId is required')
    
    loading.value = true
    error.value = null

    try {
      const response = await fleetService.getShip(shipId)
      return response.data
    } catch (err) {
      error.value = err.message || '获取飞船详情失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加飞船
   * @param {Object} shipData - 飞船数据
   * @returns {Promise<Object>} 创建的飞船
   */
  async function addShip(shipData) {
    loading.value = true
    error.value = null

    try {
      const response = await fleetService.createShip(shipData)
      ships.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.message || '添加飞船失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新飞船信息
   * @param {string} shipId - 飞船ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新后的飞船
   */
  async function updateShip(shipId, updates) {
    if (!shipId) throw new Error('shipId is required')
    
    loading.value = true
    error.value = null

    try {
      const response = await fleetService.updateShip(shipId, updates)
      const index = ships.value.findIndex(s => s.id === shipId)
      if (index !== -1) {
        ships.value[index] = { ...ships.value[index], ...response.data }
      }
      return response.data
    } catch (err) {
      error.value = err.message || '更新飞船失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除飞船
   * @param {string} shipId - 飞船ID
   * @returns {Promise<void>}
   */
  async function deleteShip(shipId) {
    if (!shipId) throw new Error('shipId is required')
    
    loading.value = true
    error.value = null

    try {
      await fleetService.deleteShip(shipId)
      ships.value = ships.value.filter(s => s.id !== shipId)
    } catch (err) {
      error.value = err.message || '删除飞船失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 设置筛选条件
   * @param {string} newFilter - 筛选类别
   */
  function setFilter(newFilter) {
    filter.value = newFilter
  }

  /**
   * 设置搜索查询
   * @param {string} query - 搜索关键词
   */
  function setSearchQuery(query) {
    searchQuery.value = query
  }

  /**
   * 设置排序
   * @param {string} sortKey - 排序字段
   * @param {string} [order] - 排序方向
   */
  function setSorting(sortKey, order) {
    if (sortBy.value === sortKey) {
      // 切换排序方向
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = sortKey
      sortOrder.value = order || 'asc'
    }
  }

  /**
   * 清除错误状态
   */
  function clearError() {
    error.value = null
  }

  /**
   * 重置状态
   */
  function resetState() {
    ships.value = []
    loading.value = false
    error.value = null
    filter.value = 'all'
    searchQuery.value = ''
    sortBy.value = 'name'
    sortOrder.value = 'asc'
  }

  // 返回所有状态和方法
  return {
    // 状态
    ships,
    loading,
    error,
    filter,
    searchQuery,
    sortBy,
    sortOrder,

    // 计算属性
    filteredShips,
    totalValue,
    shipCategories,
    shipsByStatus,

    // 方法
    fetchShips,
    fetchShip,
    addShip,
    updateShip,
    deleteShip,
    setFilter,
    setSearchQuery,
    setSorting,
    clearError,
    resetState
  }
})
