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

// Mock authStore（authMock 可编程，供 myEvents 无用户分支切换）
const authMock = vi.hoisted(() => ({ user: { id: 'user-1', role: 'member' } }))
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    get user() { return authMock.user }
  })
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
      // 锚定 1 月 15 日：月初锚定消除月末日溢出（如 8/31 setMonth(+1) → 10/1 溢出陷阱）
      store.currentDate = new Date(2026, 0, 15)

      store.goNext()

      expect(store.currentDate.getMonth()).toBe(1)
    })

    it('goNext 月视图跨年（12月 → 次年1月）', () => {
      const store = useCalendarStore()
      store.viewMode = 'month'
      store.currentDate = new Date(2026, 11, 15)

      store.goNext()

      expect(store.currentDate.getMonth()).toBe(0)
      expect(store.currentDate.getFullYear()).toBe(2027)
    })

    it('goPrev 月视图应该后退一个月', () => {
      const store = useCalendarStore()
      store.viewMode = 'month'
      // 同样锚定月中日期，避免月末日 setMonth(-1) 溢出
      store.currentDate = new Date(2026, 2, 15) // 2026-03-15

      store.goPrev()

      expect(store.currentDate.getMonth()).toBe(1)
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

  // ---- M4-2 补测：join/leave、日期分组、月度筛选、我的活动、视图导航 ----
  describe('joinEvent / leaveEvent', () => {
    it('joinEvent 应合并返回数据到对应活动', async () => {
      const store = useCalendarStore()
      store.events = [{ id: '1', title: '活动', participants: [] }]
      calendarService.joinEvent.mockResolvedValue({ success: true, data: { id: '1', participants: ['user-1'] } })

      await store.joinEvent('1')

      expect(calendarService.joinEvent).toHaveBeenCalledWith('1')
      expect(store.events[0].participants).toEqual(['user-1'])
    })

    it('joinEvent 缺 eventId 抛错且不调服务', async () => {
      const store = useCalendarStore()
      await expect(store.joinEvent('')).rejects.toThrow('eventId is required')
      expect(calendarService.joinEvent).not.toHaveBeenCalled()
    })

    it('joinEvent 失败时设置 error 并复位 loading', async () => {
      const store = useCalendarStore()
      calendarService.joinEvent.mockRejectedValue(new Error('活动已满员'))

      await expect(store.joinEvent('1')).rejects.toThrow('活动已满员')

      expect(store.error).toBe('活动已满员')
      expect(store.loading).toBe(false)
    })

    it('leaveEvent 应合并返回数据到对应活动', async () => {
      const store = useCalendarStore()
      store.events = [{ id: '1', title: '活动', participants: ['user-1'] }]
      calendarService.leaveEvent.mockResolvedValue({ success: true, data: { id: '1', participants: [] } })

      await store.leaveEvent('1')

      expect(calendarService.leaveEvent).toHaveBeenCalledWith('1')
      expect(store.events[0].participants).toEqual([])
    })

    it('leaveEvent 缺 eventId 抛错且不调服务', async () => {
      const store = useCalendarStore()
      await expect(store.leaveEvent('')).rejects.toThrow('eventId is required')
      expect(calendarService.leaveEvent).not.toHaveBeenCalled()
    })
  })

  describe('计算属性补充', () => {
    it('myEvents 无登录用户时为空数组', () => {
      const store = useCalendarStore()
      store.events = [...mockEvents]
      const saved = authMock.user
      authMock.user = null
      try {
        expect(store.myEvents).toEqual([])
      } finally {
        authMock.user = saved
      }
    })

    it('eventsByDate 按 toDateString 分组', () => {
      const store = useCalendarStore()
      store.events = [...mockEvents]

      const groups = store.eventsByDate
      // mockEvents 中 1/3 同一未来日期、2 为过去日期 → 2 组
      const futureKey = new Date(futureDate).toDateString()
      expect(groups[futureKey]).toHaveLength(2)
      expect(groups[new Date(pastDate).toDateString()]).toHaveLength(1)
    })

    it('currentMonthEvents 只保留当月活动', () => {
      const store = useCalendarStore()
      const now = new Date()
      const inMonth = {
        id: '9',
        title: '当月活动',
        startTime: new Date(now.getFullYear(), now.getMonth(), 15).toISOString()
      }
      const otherMonth = (now.getMonth() + 5) % 12
      const outMonth = {
        id: '10',
        title: '跨月活动',
        startTime: new Date(now.getFullYear(), otherMonth, 15).toISOString()
      }
      store.events = [inMonth, outMonth]

      expect(store.currentMonthEvents).toHaveLength(1)
      expect(store.currentMonthEvents[0].id).toBe('9')
    })
  })

  describe('周/列表视图导航', () => {
    it('goNext/goPrev 周视图 ±7 天', () => {
      const store = useCalendarStore()
      store.viewMode = 'week'
      const before = store.currentDate.getTime()

      store.goNext()
      expect(store.currentDate.getTime() - before).toBe(7 * 86400000)

      store.goPrev()
      store.goPrev()
      expect(before - store.currentDate.getTime()).toBe(7 * 86400000)
    })

    it('goNext/goPrev 列表视图 ±1 天', () => {
      const store = useCalendarStore()
      store.viewMode = 'list'
      const before = store.currentDate.getTime()

      store.goNext()
      expect(store.currentDate.getTime() - before).toBe(86400000)

      store.goPrev()
      expect(store.currentDate.getTime()).toBe(before)
    })
  })

  describe('clearError', () => {
    it('清除后 error 为 null', async () => {
      const store = useCalendarStore()
      calendarService.getEvents.mockRejectedValue(new Error('x'))
      await expect(store.fetchEvents()).rejects.toThrow('x')
      expect(store.error).toBe('x')

      store.clearError()
      expect(store.error).toBeNull()
    })
  })
})
