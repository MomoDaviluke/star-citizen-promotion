/**
 * @file 活动日历状态 Store 测试
 * @description 覆盖 fetchEvents / createEvent / updateEvent / deleteEvent / 筛选 / 导航
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock calendarService
vi.mock('@/services/calendarService', () => ({
  calendarService: {
    getEvents: vi.fn(),
    getEvent: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
    joinEvent: vi.fn(),
    leaveEvent: vi.fn()
  }
}))

import { useCalendarStore } from '@/stores/calendar.js'
import { calendarService } from '@/services/calendarService'

const now = new Date()
const futureDate = new Date(now.getTime() + 86400000).toISOString()
const pastDate = new Date(now.getTime() - 86400000).toISOString()

const mockEvents = [
  { id: '1', title: '未来活动', startTime: futureDate, participants: ['user-1'], creatorId: 'user-2' },
  { id: '2', title: '过去活动', startTime: pastDate, participants: ['user-2'], creatorId: 'user-1' },
  { id: '3', title: '另一个未来活动', startTime: futureDate, participants: [], creatorId: 'user-3' }
]

describe('useCalendarStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const store = useCalendarStore()

      expect(store.events).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.viewMode).toBe('month')
      expect(store.selectedEvent).toBeNull()
      expect(store.filter).toBe('all')
    })
  })

  describe('fetchEvents', () => {
    it('应该获取活动列表并更新状态', async () => {
      const store = useCalendarStore()
      calendarService.getEvents.mockResolvedValue({ data: mockEvents })

      await store.fetchEvents()

      expect(store.events).toEqual(mockEvents)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('请求失败时应该设置错误信息', async () => {
      const store = useCalendarStore()
      calendarService.getEvents.mockRejectedValue(new Error('网络错误'))

      await expect(store.fetchEvents()).rejects.toThrow()

      expect(store.error).toBe('网络错误')
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchEvent', () => {
    it('应该获取单个活动详情', async () => {
      const store = useCalendarStore()
      const mockEvent = { id: '1', title: '活动详情' }
      calendarService.getEvent.mockResolvedValue({ data: mockEvent })

      const result = await store.fetchEvent('1')

      expect(store.selectedEvent).toEqual(mockEvent)
      expect(result).toEqual(mockEvent)
    })

    it('缺少 eventId 应该抛出错误', async () => {
      const store = useCalendarStore()

      await expect(store.fetchEvent()).rejects.toThrow('eventId is required')
    })
  })

  describe('createEvent', () => {
    it('应该创建活动并添加到列表', async () => {
      const store = useCalendarStore()
      const newEvent = { id: '4', title: '新活动' }
      calendarService.createEvent.mockResolvedValue({ data: newEvent })

      const result = await store.createEvent({ title: '新活动' })

      expect(store.events).toContainEqual(newEvent)
      expect(result).toEqual(newEvent)
    })
  })

  describe('updateEvent', () => {
    it('应该更新指定活动', async () => {
      const store = useCalendarStore()
      store.events = [...mockEvents]
      calendarService.updateEvent.mockResolvedValue({ data: { id: '1', title: '更新后' } })

      await store.updateEvent('1', { title: '更新后' })

      expect(store.events.find(e => e.id === '1').title).toBe('更新后')
    })

    it('应该同步更新 selectedEvent', async () => {
      const store = useCalendarStore()
      store.events = [...mockEvents]
      store.selectedEvent = { ...mockEvents[0] }
      calendarService.updateEvent.mockResolvedValue({ data: { id: '1', title: '更新后' } })

      await store.updateEvent('1', { title: '更新后' })

      expect(store.selectedEvent.title).toBe('更新后')
    })

    it('缺少 eventId 应该抛出错误', async () => {
      const store = useCalendarStore()

      await expect(store.updateEvent()).rejects.toThrow('eventId is required')
    })
  })

  describe('deleteEvent', () => {
    it('应该从列表中移除活动', async () => {
      const store = useCalendarStore()
      store.events = [...mockEvents]
      calendarService.deleteEvent.mockResolvedValue({})

      await store.deleteEvent('1')

      expect(store.events.length).toBe(2)
      expect(store.events.find(e => e.id === '1')).toBeUndefined()
    })

    it('删除 selectedEvent 时应该清空', async () => {
      const store = useCalendarStore()
      store.events = [...mockEvents]
      store.selectedEvent = { ...mockEvents[0] }
      calendarService.deleteEvent.mockResolvedValue({})

      await store.deleteEvent('1')

      expect(store.selectedEvent).toBeNull()
    })

    it('缺少 eventId 应该抛出错误', async () => {
      const store = useCalendarStore()

      await expect(store.deleteEvent()).rejects.toThrow('eventId is required')
    })
  })

  describe('筛选与视图', () => {
    it('setViewMode 应该更新视图模式', () => {
      const store = useCalendarStore()

      store.setViewMode('week')

      expect(store.viewMode).toBe('week')
    })

    it('setFilter 应该更新筛选条件', () => {
      const store = useCalendarStore()

      store.setFilter('upcoming')

      expect(store.filter).toBe('upcoming')
    })
  })

  describe('计算属性', () => {
    it('upcomingEvents 应该返回未来的活动', () => {
      const store = useCalendarStore()
      store.events = [...mockEvents]

      expect(store.upcomingEvents.length).toBe(2)
      expect(store.upcomingEvents.every(e => new Date(e.startTime) > now)).toBe(true)
    })

    it('pastEvents 应该返回过去的活动', () => {
      const store = useCalendarStore()
      store.events = [...mockEvents]

      expect(store.pastEvents.length).toBe(1)
      expect(store.pastEvents[0].title).toBe('过去活动')
    })

    it('myEvents 应该返回用户参与或创建的活动', () => {
      const store = useCalendarStore()
      store.events = [...mockEvents]

      // 通过 setCurrentUserId 注入用户 ID（解耦后不再依赖 authStore）
      store.setCurrentUserId('user-1')
      // user-1 参与了活动 1，创建了活动 2
      expect(store.myEvents.length).toBe(2)
    })

    it('filteredEvents 应该根据 filter 返回对应活动', () => {
      const store = useCalendarStore()
      store.events = [...mockEvents]

      store.filter = 'upcoming'
      expect(store.filteredEvents.length).toBe(2)

      store.filter = 'past'
      expect(store.filteredEvents.length).toBe(1)

      store.filter = 'all'
      expect(store.filteredEvents.length).toBe(3)
    })
  })

  describe('日期导航', () => {
    it('goToDate 应该更新 currentDate', () => {
      const store = useCalendarStore()
      const targetDate = new Date('2026-12-25')

      store.goToDate(targetDate)

      expect(store.currentDate.getFullYear()).toBe(2026)
      expect(store.currentDate.getMonth()).toBe(11)
    })

    it('goNext 月视图应该前进一个月', () => {
      const store = useCalendarStore()
      store.viewMode = 'month'
      const originalMonth = store.currentDate.getMonth()

      store.goNext()

      const expectedMonth = originalMonth === 11 ? 0 : originalMonth + 1
      expect(store.currentDate.getMonth()).toBe(expectedMonth)
    })

    it('goPrev 月视图应该后退一个月', () => {
      const store = useCalendarStore()
      store.viewMode = 'month'
      const originalMonth = store.currentDate.getMonth()

      store.goPrev()

      const expectedMonth = originalMonth === 0 ? 11 : originalMonth - 1
      expect(store.currentDate.getMonth()).toBe(expectedMonth)
    })

    it('goToday 应该回到今天', () => {
      const store = useCalendarStore()
      store.currentDate = new Date('2020-01-01')

      store.goToday()

      const today = new Date()
      expect(store.currentDate.getFullYear()).toBe(today.getFullYear())
      expect(store.currentDate.getMonth()).toBe(today.getMonth())
      expect(store.currentDate.getDate()).toBe(today.getDate())
    })
  })

  describe('resetState', () => {
    it('应该重置所有状态', () => {
      const store = useCalendarStore()
      store.events = [...mockEvents]
      store.filter = 'upcoming'
      store.viewMode = 'week'
      store.selectedEvent = mockEvents[0]

      store.resetState()

      expect(store.events).toEqual([])
      expect(store.filter).toBe('all')
      expect(store.viewMode).toBe('month')
      expect(store.selectedEvent).toBeNull()
    })
  })
})
