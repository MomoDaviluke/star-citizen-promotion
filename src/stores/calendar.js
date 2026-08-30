/**
 * 活动日历状态管理 Store
 * @description 管理活动数据、视图切换、提醒等
 * @module stores/calendar
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { calendarService } from '@/services/calendarService'
import { createStoreHelpers } from '@/utils/storeHelpers'

export const useCalendarStore = defineStore('calendar', () => {
  // ========== 状态定义 ==========
  /** @type {import('vue').Ref<Array<{ id: string, title: string, description?: string, startTime: string, endTime?: string, location?: string, status?: string, participants?: string[], creatorId?: string }>>} */
  const events = ref([])
  const loading = ref(false)
  const error = ref(null)
  const currentDate = ref(new Date())
  const viewMode = ref('month') // month|week|list
  /** @type {import('vue').Ref<{ id: string, title: string, description?: string, startTime: string, endTime?: string, location?: string, status?: string, participants?: string[], creatorId?: string } | null>} */
  const selectedEvent = ref(null)
  const filter = ref('all') // all|upcoming|past|mine

  const { withLoading } = createStoreHelpers(loading, error)

  /**
   * 解包服务端返回的 { data: ... } 包装结构
   * @description 兼容直接返回实体与包装响应两种格式
   * @param {any} res - 服务层返回值
   * @returns {any} 实际业务数据
   */
  const unwrap = (res) => res?.data ?? res

  // ========== 计算属性 ==========
  const upcomingEvents = computed(() => {
    const now = new Date()
    return events.value
      .filter(event => new Date(event.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  })

  const pastEvents = computed(() => {
    const now = new Date()
    return events.value
      .filter(event => new Date(event.startTime) < now)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
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
      const data = await calendarService.getEvents(params)
      events.value = unwrap(data) || []
      return events.value
    }, '获取活动失败')
  }

  /** 获取单个活动详情 */
  async function fetchEvent(eventId) {
    if (!eventId) throw new Error('eventId is required')
    return withLoading(async () => {
      const data = await calendarService.getEvent(eventId)
      selectedEvent.value = unwrap(data)
      return selectedEvent.value
    }, '获取活动详情失败')
  }

  /** 创建活动 */
  async function createEvent(eventData) {
    return withLoading(async () => {
      const data = unwrap(await calendarService.createEvent(eventData))
      events.value.push(data)
      return data
    }, '创建活动失败')
  }

  /** 更新活动 */
  async function updateEvent(eventId, updates) {
    if (!eventId) throw new Error('eventId is required')
    return withLoading(async () => {
      const data = unwrap(await calendarService.updateEvent(eventId, updates))
      const index = events.value.findIndex(e => e.id === eventId)
      if (index !== -1) {
        events.value[index] = { ...events.value[index], ...data }
      }
      if (selectedEvent.value?.id === eventId) {
        selectedEvent.value = { ...selectedEvent.value, ...data }
      }
      return data
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
      const data = unwrap(await calendarService.joinEvent(eventId))
      const index = events.value.findIndex(e => e.id === eventId)
      if (index !== -1) {
        events.value[index] = { ...events.value[index], ...data }
      }
      return data
    }, '报名失败')
  }

  /** 取消报名 */
  async function leaveEvent(eventId) {
    if (!eventId) throw new Error('eventId is required')
    return withLoading(async () => {
      const data = unwrap(await calendarService.leaveEvent(eventId))
      const index = events.value.findIndex(e => e.id === eventId)
      if (index !== -1) {
        events.value[index] = { ...events.value[index], ...data }
      }
      return data
    }, '取消报名失败')
  }

  /** 设置视图模式 */
  function setViewMode(mode) { viewMode.value = mode }

  /** 设置筛选条件 */
  function setFilter(newFilter) { filter.value = newFilter }

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
    joinEvent, leaveEvent, setViewMode, setFilter,
    goToDate, goNext, goPrev, goToday, clearError, resetState
  }
})
