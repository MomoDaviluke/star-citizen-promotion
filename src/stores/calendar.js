/**
 * @file 活动日历状态管理 Store
 * @description 管理活动数据、视图切换、提醒等
 * @module stores/calendar
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { calendarService } from '@/services/calendarService'
import { createStoreHelpers } from '@/utils/storeHelpers'

export const useCalendarStore = defineStore('calendar', () => {
  // ========== 状态定义 ==========
  const events = ref([])
  const loading = ref(false)
  const error = ref(null)
  const currentDate = ref(new Date())
  const viewMode = ref('month') // month|week|list
  const selectedEvent = ref(null)
  const filter = ref('all') // all|upcoming|past|mine
  /**
   * 当前用户 ID（由组件层通过 setCurrentUserId 注入）
   * @description 解耦对 useAuthStore 的直接依赖，store 不再反向依赖 auth store
   */
  const currentUserId = ref(null)

  const { withLoading } = createStoreHelpers(loading, error)

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
    const userId = currentUserId.value
    if (!userId) return []
    return events.value.filter(
      event => event.participants?.includes(userId) || event.creatorId === userId
    )
  })

  const filteredEvents = computed(() => {
    switch (filter.value) {
      case 'upcoming': return upcomingEvents.value
      case 'past': return pastEvents.value
      case 'mine': return myEvents.value
      default: return events.value
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

  /** 获取活动列表 */
  async function fetchEvents(params = {}) {
    return withLoading(async () => {
      const response = await calendarService.getEvents(params)
      events.value = response.data || []
      return events.value
    }, '获取活动失败')
  }

  /** 获取单个活动详情 */
  async function fetchEvent(eventId) {
    if (!eventId) throw new Error('eventId is required')
    return withLoading(async () => {
      const response = await calendarService.getEvent(eventId)
      selectedEvent.value = response.data
      return response.data
    }, '获取活动详情失败')
  }

  /** 创建活动 */
  async function createEvent(eventData) {
    return withLoading(async () => {
      const response = await calendarService.createEvent(eventData)
      events.value.push(response.data)
      return response.data
    }, '创建活动失败')
  }

  /** 更新活动 */
  async function updateEvent(eventId, updates) {
    if (!eventId) throw new Error('eventId is required')
    return withLoading(async () => {
      const response = await calendarService.updateEvent(eventId, updates)
      const index = events.value.findIndex(e => e.id === eventId)
      if (index !== -1) {
        events.value[index] = { ...events.value[index], ...response.data }
      }
      if (selectedEvent.value?.id === eventId) {
        selectedEvent.value = { ...selectedEvent.value, ...response.data }
      }
      return response.data
    }, '更新活动失败')
  }

  /** 删除活动 */
  async function deleteEvent(eventId) {
    if (!eventId) throw new Error('eventId is required')
    return withLoading(async () => {
      await calendarService.deleteEvent(eventId)
      events.value = events.value.filter(e => e.id !== eventId)
      if (selectedEvent.value?.id === eventId) {
        selectedEvent.value = null
      }
    }, '删除活动失败')
  }

  /** 报名参加活动 */
  async function joinEvent(eventId) {
    if (!eventId) throw new Error('eventId is required')
    return withLoading(async () => {
      const response = await calendarService.joinEvent(eventId)
      const index = events.value.findIndex(e => e.id === eventId)
      if (index !== -1) {
        events.value[index] = { ...events.value[index], ...response.data }
      }
      return response.data
    }, '报名失败')
  }

  /** 取消报名 */
  async function leaveEvent(eventId) {
    if (!eventId) throw new Error('eventId is required')
    return withLoading(async () => {
      const response = await calendarService.leaveEvent(eventId)
      const index = events.value.findIndex(e => e.id === eventId)
      if (index !== -1) {
        events.value[index] = { ...events.value[index], ...response.data }
      }
      return response.data
    }, '取消报名失败')
  }

  /** 设置视图模式 */
  function setViewMode(mode) { viewMode.value = mode }

  /** 设置筛选条件 */
  function setFilter(newFilter) { filter.value = newFilter }

  /**
   * 设置当前用户 ID（解耦 auth store 依赖）
   * @param {string|null} id - 当前用户 ID，登出时传 null
   */
  function setCurrentUserId(id) { currentUserId.value = id }

  /** 跳转到指定日期 */
  function goToDate(date) { currentDate.value = new Date(date) }

  /** 跳转到下一天/周/月 */
  function goNext() {
    const date = new Date(currentDate.value)
    switch (viewMode.value) {
      case 'month': date.setMonth(date.getMonth() + 1); break
      case 'week': date.setDate(date.getDate() + 7); break
      case 'list': date.setDate(date.getDate() + 1); break
    }
    currentDate.value = date
  }

  /** 跳转到前一天/周/月 */
  function goPrev() {
    const date = new Date(currentDate.value)
    switch (viewMode.value) {
      case 'month': date.setMonth(date.getMonth() - 1); break
      case 'week': date.setDate(date.getDate() - 7); break
      case 'list': date.setDate(date.getDate() - 1); break
    }
    currentDate.value = date
  }

  /** 跳转到今天 */
  function goToday() { currentDate.value = new Date() }

  /** 清除错误状态 */
  function clearError() { error.value = null }

  /** 重置状态 */
  function resetState() {
    events.value = []
    loading.value = false
    error.value = null
    currentDate.value = new Date()
    viewMode.value = 'month'
    selectedEvent.value = null
    filter.value = 'all'
  }

  return {
    events, loading, error, currentDate, viewMode, selectedEvent, filter,
    upcomingEvents, pastEvents, myEvents, filteredEvents, eventsByDate, currentMonthEvents,
    fetchEvents, fetchEvent, createEvent, updateEvent, deleteEvent,
    joinEvent, leaveEvent, setViewMode, setFilter, setCurrentUserId,
    goToDate, goNext, goPrev, goToday, clearError, resetState
  }
})
