/**
 * @file 活动日历服务测试
 * @description 覆盖 getEvents / getEvent / createEvent / updateEvent / deleteEvent / joinEvent / leaveEvent
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
import { calendarService, getEvents, getEvent, createEvent, updateEvent, deleteEvent, joinEvent, leaveEvent, exportCalendar } from '@/services/calendarService.js'

describe('calendarService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---- getEvents ----

  describe('getEvents', () => {
    it('应该调用 GET /events 并返回数据', async () => {
      const mockData = { data: [{ id: '1', title: '测试活动' }] }
      httpClient.get.mockResolvedValue({ data: mockData })

      const result = await getEvents()

      expect(httpClient.get).toHaveBeenCalledWith('/events', {})
      expect(result).toEqual(mockData)
    })

    it('应该传递查询参数', async () => {
      httpClient.get.mockResolvedValue({ data: { data: [] } })

      await getEvents({ startDate: '2026-01-01', status: 'active' })

      expect(httpClient.get).toHaveBeenCalledWith('/events', {
        startDate: '2026-01-01', status: 'active'
      })
    })

    it('请求失败时应该抛出错误', async () => {
      httpClient.get.mockRejectedValue(new Error('网络错误'))

      await expect(getEvents()).rejects.toThrow('网络错误')
    })
  })

  // ---- getEvent ----

  describe('getEvent', () => {
    it('应该调用 GET /events/:id 并返回数据', async () => {
      const mockEvent = { data: { id: '1', title: '活动详情' } }
      httpClient.get.mockResolvedValue(mockEvent)

      const result = await getEvent('1')

      expect(httpClient.get).toHaveBeenCalledWith('/events/1')
      expect(result).toEqual(mockEvent.data)
    })

    it('缺少 eventId 应该抛出错误', async () => {
      await expect(getEvent()).rejects.toThrow('eventId is required')
      await expect(getEvent('')).rejects.toThrow('eventId is required')
    })
  })

  // ---- createEvent ----

  describe('createEvent', () => {
    it('应该调用 POST /events 并返回创建的活动', async () => {
      const eventData = { title: '新活动', startTime: '2026-06-01T10:00:00Z' }
      const mockResponse = { data: { id: '2', ...eventData } }
      httpClient.post.mockResolvedValue(mockResponse)

      const result = await createEvent(eventData)

      expect(httpClient.post).toHaveBeenCalledWith('/events', eventData)
      expect(result).toEqual(mockResponse.data)
    })

    it('缺少 title 应该抛出错误', async () => {
      await expect(createEvent({ startTime: '2026-06-01' }))
        .rejects.toThrow('活动标题和时间不能为空')
    })

    it('缺少 startTime 应该抛出错误', async () => {
      await expect(createEvent({ title: '活动' }))
        .rejects.toThrow('活动标题和时间不能为空')
    })

    it('空对象应该抛出错误', async () => {
      await expect(createEvent({}))
        .rejects.toThrow('活动标题和时间不能为空')
    })

    it('null 应该抛出错误', async () => {
      await expect(createEvent(null))
        .rejects.toThrow('活动标题和时间不能为空')
    })
  })

  // ---- updateEvent ----

  describe('updateEvent', () => {
    it('应该调用 PATCH /events/:id', async () => {
      const updates = { title: '更新后的标题' }
      httpClient.patch.mockResolvedValue({ data: { id: '1', ...updates } })

      const result = await updateEvent('1', updates)

      expect(httpClient.patch).toHaveBeenCalledWith('/events/1', updates)
      expect(result.title).toBe('更新后的标题')
    })

    it('缺少 eventId 应该抛出错误', async () => {
      await expect(updateEvent('', {})).rejects.toThrow('eventId is required')
    })
  })

  // ---- deleteEvent ----

  describe('deleteEvent', () => {
    it('应该调用 DELETE /events/:id', async () => {
      httpClient.delete.mockResolvedValue({})

      await deleteEvent('1')

      expect(httpClient.delete).toHaveBeenCalledWith('/events/1')
    })

    it('缺少 eventId 应该抛出错误', async () => {
      await expect(deleteEvent()).rejects.toThrow('eventId is required')
    })

    it('请求失败时应该抛出错误', async () => {
      httpClient.delete.mockRejectedValue(new Error('删除失败'))

      await expect(deleteEvent('1')).rejects.toThrow('删除失败')
    })
  })

  // ---- joinEvent ----

  describe('joinEvent', () => {
    it('应该调用 POST /events/:id/join', async () => {
      httpClient.post.mockResolvedValue({ data: { id: '1', joined: true } })

      const result = await joinEvent('1')

      expect(httpClient.post).toHaveBeenCalledWith('/events/1/join')
      expect(result.joined).toBe(true)
    })

    it('缺少 eventId 应该抛出错误', async () => {
      await expect(joinEvent('')).rejects.toThrow('eventId is required')
    })
  })

  // ---- leaveEvent ----

  describe('leaveEvent', () => {
    it('应该调用 POST /events/:id/leave', async () => {
      httpClient.post.mockResolvedValue({ data: { id: '1', joined: false } })

      const result = await leaveEvent('1')

      expect(httpClient.post).toHaveBeenCalledWith('/events/1/leave')
      expect(result.joined).toBe(false)
    })

    it('缺少 eventId 应该抛出错误', async () => {
      await expect(leaveEvent('')).rejects.toThrow('eventId is required')
    })
  })

  // ---- exportCalendar ----

  describe('exportCalendar', () => {
    it('应该调用 GET /events/export 获取全部活动', async () => {
      const mockBlob = new Blob(['test'])
      httpClient.get.mockResolvedValue({ data: mockBlob })

      const result = await exportCalendar()

      expect(httpClient.get).toHaveBeenCalledWith('/events/export', { responseType: 'blob' })
      expect(result).toBe(mockBlob)
    })

    it('传入 eventId 应该导出单个活动', async () => {
      const mockBlob = new Blob(['test'])
      httpClient.get.mockResolvedValue({ data: mockBlob })

      await exportCalendar('1')

      expect(httpClient.get).toHaveBeenCalledWith('/events/1/ics', { responseType: 'blob' })
    })
  })

  // ---- calendarService 对象 ----

  describe('calendarService 对象', () => {
    it('应该导出所有方法', () => {
      expect(calendarService.getEvents).toBe(getEvents)
      expect(calendarService.getEvent).toBe(getEvent)
      expect(calendarService.createEvent).toBe(createEvent)
      expect(calendarService.updateEvent).toBe(updateEvent)
      expect(calendarService.deleteEvent).toBe(deleteEvent)
      expect(calendarService.joinEvent).toBe(joinEvent)
      expect(calendarService.leaveEvent).toBe(leaveEvent)
      expect(calendarService.exportCalendar).toBe(exportCalendar)
    })
  })
})
