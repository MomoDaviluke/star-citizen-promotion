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
    it('应该调用 GET /events 并返回数据（snake→camel 字段转换）', async () => {
      // 后端返回 { success, data: events[], pagination }
      // httpClient.get 直接返回后端 JSON
      const backendResponse = {
        success: true,
        data: [{ id: '1', title: '测试活动', start_time: '2026-06-01T10:00:00Z', creator_id: 'u1' }],
        pagination: { total: 1, limit: 50, offset: 0, hasMore: false }
      }
      httpClient.get.mockResolvedValue(backendResponse)

      const result = await getEvents()

      expect(httpClient.get).toHaveBeenCalledWith('/events', {})
      // service 层应将 start_time→startTime, creator_id→creatorId
      expect(result.data[0]).toEqual({
        id: '1', title: '测试活动', startTime: '2026-06-01T10:00:00Z', creatorId: 'u1'
      })
      expect(result.pagination.total).toBe(1)
    })

    it('应该传递查询参数', async () => {
      httpClient.get.mockResolvedValue({ success: true, data: [], pagination: { total: 0, limit: 50, offset: 0, hasMore: false } })

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
    it('应该调用 GET /events/:id 并返回转换后的数据', async () => {
      // 后端返回 { success, data: event }
      const backendResponse = {
        success: true,
        data: { id: '1', title: '活动详情', start_time: '2026-06-01T10:00:00Z' }
      }
      httpClient.get.mockResolvedValue(backendResponse)

      const result = await getEvent('1')

      expect(httpClient.get).toHaveBeenCalledWith('/events/1')
      // service 层返回 { ...response, data: toCamelEvent(response.data) }
      expect(result.data).toEqual({ id: '1', title: '活动详情', startTime: '2026-06-01T10:00:00Z' })
      expect(result.success).toBe(true)
    })

    it('缺少 eventId 应该抛出错误', async () => {
      await expect(getEvent()).rejects.toThrow('eventId is required')
      await expect(getEvent('')).rejects.toThrow('eventId is required')
    })
  })

  // ---- createEvent ----

  describe('createEvent', () => {
    it('应该调用 POST /events，发送 snake_case 并返回 camelCase', async () => {
      const eventData = { title: '新活动', startTime: '2026-06-01T10:00:00Z' }
      // 后端返回创建的活动（snake_case）
      const backendResponse = {
        success: true,
        data: { id: '2', title: '新活动', start_time: '2026-06-01T10:00:00Z' }
      }
      httpClient.post.mockResolvedValue(backendResponse)

      const result = await createEvent(eventData)

      // 发送时应转为 snake_case
      expect(httpClient.post).toHaveBeenCalledWith('/events', {
        title: '新活动', start_time: '2026-06-01T10:00:00Z'
      })
      // 返回时应转回 camelCase
      expect(result.data).toEqual({ id: '2', title: '新活动', startTime: '2026-06-01T10:00:00Z' })
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
      httpClient.patch.mockResolvedValue({
        success: true,
        data: { id: '1', title: '更新后的标题' }
      })

      const result = await updateEvent('1', updates)

      expect(httpClient.patch).toHaveBeenCalledWith('/events/1', updates)
      // service 返回 { ...response, data: toCamelEvent(response.data) }
      expect(result.data.title).toBe('更新后的标题')
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
      // service 返回 { ...response, data: toCamelEvent(response.data) }
      httpClient.post.mockResolvedValue({ success: true, data: { id: '1', joined: true } })

      const result = await joinEvent('1')

      expect(httpClient.post).toHaveBeenCalledWith('/events/1/join')
      expect(result.data.joined).toBe(true)
    })

    it('缺少 eventId 应该抛出错误', async () => {
      await expect(joinEvent('')).rejects.toThrow('eventId is required')
    })
  })

  // ---- leaveEvent ----

  describe('leaveEvent', () => {
    it('应该调用 POST /events/:id/leave', async () => {
      httpClient.post.mockResolvedValue({ success: true, data: { id: '1', joined: false } })

      const result = await leaveEvent('1')

      expect(httpClient.post).toHaveBeenCalledWith('/events/1/leave')
      expect(result.data.joined).toBe(false)
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

  // ---- M4-2 补测：错误传播、参数校验与转换函数边界 ----
  describe('错误传播（重抛并保留原始错误）', () => {
    it.each([
      ['getEvents', 'get', []],
      ['getEvent', 'get', ['e1']],
      ['updateEvent', 'patch', ['e1', { startTime: '2026-06-02' }]],
      ['deleteEvent', 'delete', ['e1']],
      ['joinEvent', 'post', ['e1']],
      ['leaveEvent', 'post', ['e1']]
    ])('%s 失败时重抛原始错误', async (fn, verb, args) => {
      httpClient[verb].mockRejectedValue(new Error('api exploded'))
      await expect(calendarService[fn](...args)).rejects.toThrow('api exploded')
    })

    it('createEvent 失败时重抛原始错误', async () => {
      httpClient.post.mockRejectedValue(new Error('create failed'))
      await expect(createEvent({ title: 'T', startTime: '2026-06-01T10:00:00Z' })).rejects.toThrow('create failed')
    })

    it('exportCalendar 失败时重抛原始错误', async () => {
      httpClient.get.mockRejectedValue(new Error('export failed'))
      await expect(exportCalendar()).rejects.toThrow('export failed')
    })

    it('getEvents 错误日志读取 err.response?.data 不抛次生异常', async () => {
      httpClient.get.mockRejectedValue({ message: 'no response body' })
      await expect(getEvents()).rejects.toMatchObject({ message: 'no response body' })
    })
  })

  describe('参数校验（httpClient 不应被调用）', () => {
    it('getEvent 缺 eventId 抛错', async () => {
      await expect(getEvent('')).rejects.toThrow('eventId is required')
      expect(httpClient.get).not.toHaveBeenCalled()
    })

    it('createEvent 缺标题抛错', async () => {
      await expect(createEvent({ startTime: '2026-06-01T10:00:00Z' })).rejects.toThrow('活动标题和时间不能为空')
      expect(httpClient.post).not.toHaveBeenCalled()
    })

    it('createEvent 缺开始时间抛错', async () => {
      await expect(createEvent({ title: '只有标题' })).rejects.toThrow('活动标题和时间不能为空')
      expect(httpClient.post).not.toHaveBeenCalled()
    })

    it('updateEvent 缺 eventId 抛错', async () => {
      await expect(updateEvent('', { startTime: 'x' })).rejects.toThrow('eventId is required')
      expect(httpClient.patch).not.toHaveBeenCalled()
    })

    it('deleteEvent 缺 eventId 抛错', async () => {
      await expect(deleteEvent(undefined)).rejects.toThrow('eventId is required')
      expect(httpClient.delete).not.toHaveBeenCalled()
    })

    it.each(['joinEvent', 'leaveEvent'])('%s 缺 eventId 抛错', async (fn) => {
      await expect(calendarService[fn]('')).rejects.toThrow('eventId is required')
      expect(httpClient.post).not.toHaveBeenCalled()
    })
  })

  describe('字段转换边界', () => {
    it('getEvents 返回 data 为 null 时原样透传不崩溃', async () => {
      httpClient.get.mockResolvedValue({ success: true, data: null })
      const r = await getEvents()
      expect(r.data).toBeNull()
    })

    it('getEvent 返回非对象 data 时原样透传', async () => {
      httpClient.get.mockResolvedValue({ success: true, data: 'raw-string' })
      const r = await getEvent('e1')
      expect(r.data).toBe('raw-string')
    })

    it('createEvent 发送前转 snake_case（startTime→start_time）', async () => {
      httpClient.post.mockResolvedValue({ success: true, data: { id: '1' } })
      await createEvent({ title: 'T', startTime: '2026-06-01T10:00:00Z', creatorId: 'u9' })
      expect(httpClient.post).toHaveBeenCalledWith('/events', {
        title: 'T',
        start_time: '2026-06-01T10:00:00Z',
        creator_id: 'u9'
      })
    })

    it('updateEvent 发送前转 snake_case 且返回转回 camelCase', async () => {
      httpClient.patch.mockResolvedValue({
        success: true,
        data: { id: 'e1', start_time: '2026-06-02T10:00:00Z' }
      })
      const r = await updateEvent('e1', { startTime: '2026-06-02T10:00:00Z' })
      expect(httpClient.patch).toHaveBeenCalledWith('/events/e1', { start_time: '2026-06-02T10:00:00Z' })
      expect(r.data.startTime).toBe('2026-06-02T10:00:00Z')
    })
  })
})
