/**
 * 活动日历状态管理 Store
 * @description 管理活动数据、视图切换、提醒等
 * @module stores/calendar
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { calendarService } from '@/services/calendarService'

export const useCalendarStore = defineStore('calendar', () => {
  // ========== 状态定义 ==========
  const events = ref([])
  const loading = ref(false)
  const error = ref(null)
  const currentDate = ref(new Date())
  const viewMode = ref('month') // month|week|list
  const selectedEvent = ref(null)
  const filter = ref('all') // all|upcoming|past|mine

  // ========== 计算属性 ==========
  const upcomingEvents = computed(() => {
    const now = new Date()
    return events.value
      .filter(event => new Date(event.startTime) > now)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
  })

  const pastEvents = computed(() => {
    const now = new Date()
    return events.value
      .filter(event => new Date(event.startTime) < now)
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
  })

  const myEvents = computed(() => {
    const userId = useAuthStore().user?.id
    if (!userId) return []
    return events.value.filter(
      event => event.participants?.includes(userId) || event.creatorId === userId
    )
  })

  const filteredEvents = computed(() => {
    switch (filter.value) {
      case 'upcoming':
        return upcomingEvents.value
      case 'past':
        return pastEvents.value
      case 'mine':
        return myEvents.value
      default:
        return events.value
    }
  })

  const eventsByDate = computed(() => {
    const grouped = {}
    events.value.forEach(event => {
      const dateKey = new Date(event.startTime).toDateString()
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(event)
    })
    return grouped
  })

  const currentMonthEvents = computed(() => {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    return events.value.filter(event => {
      const eventDate = new Date(event.startTime)
      return eventDate.getFullYear() === year && eventDate.getMonth() === month
    })
  })

  // ========== 方法定义 ==========

  /**
   * 获取活动列表
   * @param {Object} [params] - 查询参数
   * @returns {Promise<Array>} 活动列表
   */
  async function fetchEvents(params = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await calendarService.getEvents(params)
      events.value = response.data || []
      return events.value
    } catch (err) {
      error.value = err.message || '获取活动失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取单个活动详情
   * @param {string} eventId - 活动ID
   * @returns {Promise<Object>} 活动详情
   */
  async function fetchEvent(eventId) {
    if (!eventId) throw new Error('eventId is required')

    loading.value = true
    error.value = null

    try {
      const response = await calendarService.getEvent(eventId)
      selectedEvent.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message || '获取活动详情失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建活动
   * @param {Object} eventData - 活动数据
   * @returns {Promise<Object>} 创建的活动
   */
  async function createEvent(eventData) {
    loading.value = true
    error.value = null

    try {
      const response = await calendarService.createEvent(eventData)
      events.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err.message || '创建活动失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新活动
   * @param {string} eventId - 活动ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新后的活动
   */
  async function updateEvent(eventId, updates) {
    if (!eventId) throw new Error('eventId is required')

    loading.value = true
    error.value = null

    try {
      const response = await calendarService.updateEvent(eventId, updates)
      const index = events.value.findIndex(e => e.id === eventId)
      if (index !== -1) {
        events.value[index] = { ...events.value[index], ...response.data }
      }
      if (selectedEvent.value?.id === eventId) {
        selectedEvent.value = { ...selectedEvent.value, ...response.data }
      }
      return response.data
    } catch (err) {
      error.value = err.message || '更新活动失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除活动
   * @param {string} eventId - 活动ID
   * @returns {Promise<void>}
   */
  async function deleteEvent(eventId) {
    if (!eventId) throw new Error('eventId is required')

    loading.value = true
    error.value = null

    try {
      await calendarService.deleteEvent(eventId)
      events.value = events.value.filter(e => e.id !== eventId)
      if (selectedEvent.value?.id === eventId) {
        selectedEvent.value = null
      }
    } catch (err) {
      error.value = err.message || '删除活动失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 取消报名
   * @param {string} eventId - 活动ID
   * @returns {Promise<Object>} 更新后的活动
   */
  async function leaveEvent(eventId) {
    if (!eventId) throw new Error('eventId is required')

    loading.value = true
    error.value = null

    try {
      const response = await calendarService.leaveEvent(eventId)
      const index = events.value.findIndex(e => e.id === eventId)
      if (index !== -1) {
        events.value[index] = { ...events.value[index], ...response.data }
      }
      return response.data
    } catch (err) {
      error.value = err.message || '取消报名失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 报名参加活动
   * @param {string} eventId - 活动ID
   * @returns {Promise<Object>} 更新后的活动
   */
  async function joinEvent(eventId) {
    if (!eventId) throw new Error('eventId is required')

    loading.value = true
    error.value = null

    try {
      const response = await calendarService.joinEvent(eventId)
      const index = events.value.findIndex(e => e.id === eventId)
      if (index !== -1) {
        events.value[index] = { ...events.value[index], ...response.data }
      }
      return response.data
    } catch (err) {
      error.value = err.message || '报名失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 设置视图模式
   * @param {string} mode - 视图模式
   */
  function setViewMode(mode) {
    viewMode.value = mode
  }

  /**
   * 设置筛选条件
   * @param {string} newFilter - 筛选条件
   */
  function setFilter(newFilter) {
    filter.value = newFilter
  }

  /**
   * 跳转到指定日期
   * @param {Date} date - 目标日期
   */
  function goToDate(date) {
    currentDate.value = new Date(date)
  }

  /**
   * 跳转到下一天/周/月
   */
  function goNext() {
    const date = new Date(currentDate.value)
    switch (viewMode.value) {
      case 'month':
        date.setMonth(date.getMonth() + 1)
        break
      case 'week':
        date.setDate(date.getDate() + 7)
        break
      case 'list':
        date.setDate(date.getDate() + 1)
        break
    }
    currentDate.value = date
  }

  /**
   * 跳转到前一天/周/月
   */
  function goPrev() {
    const date = new Date(currentDate.value)
    switch (viewMode.value) {
      case 'month':
        date.setMonth(date.getMonth() - 1)
        break
      case 'week':
        date.setDate(date.getDate() - 7)
        break
      case 'list':
        date.setDate(date.getDate() - 1)
        break
    }
    currentDate.value = date
  }

  /**
   * 跳转到今天
   */
  function goToday() {
    currentDate.value = new Date()
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
    events.value = []
    loading.value = false
    error.value = null
    currentDate.value = new Date()
    viewMode.value = 'month'
    selectedEvent.value = null
    filter.value = 'all'
  }

  // 返回所有状态和方法
  return {
    // 状态
    events,
    loading,
    error,
    currentDate,
    viewMode,
    selectedEvent,
    filter,

    // 计算属性
    upcomingEvents,
    pastEvents,
    myEvents,
    filteredEvents,
    eventsByDate,
    currentMonthEvents,

    // 方法
    fetchEvents,
    fetchEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    joinEvent,
    leaveEvent,
    setViewMode,
    setFilter,
    goToDate,
    goNext,
    goPrev,
    goToday,
    clearError,
    resetState
  }
})
