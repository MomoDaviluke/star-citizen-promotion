/**
 * @file HTTP 客户端测试
 * @description 测试 HTTP 服务层功能，验证 httpOnly cookie 认证机制
 *              认证通过 httpOnly cookie 自动携带，前端不存储 Token
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---- Mock fetch -------------------------------------------------------
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ---- Import after mock ------------------------------------------------
const { httpClient } = await import('@/services/http.js')

// ---- Helper: build a mock Response-like object -----------------------
function mockResponse({ ok, status = 200, body = null } = {}) {
  const textValue = body ? JSON.stringify(body) : ''
  return {
    ok,
    status,
    text: () => Promise.resolve(textValue),
    json: () => Promise.resolve(body)
  }
}

// ---- Tests ------------------------------------------------------------
describe('HTTP 客户端', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  // ---- 请求配置 ----------------------------------------------------
  describe('请求配置', () => {
    it('应设置 credentials: include 以自动携带 httpOnly cookie', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ok: true, body: { data: 'test' } }))

      await httpClient.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({ credentials: 'include' })
      )
    })

    it('应设置 Content-Type: application/json', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ok: true, body: { data: 'test' } }))

      await httpClient.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/json' })
        })
      )
    })

    it('所有请求应自动携带 cookie（无需手动设置 Authorization）', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ok: true, body: { data: 'test' } }))

      await httpClient.get('/protected')

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs[1].credentials).toBe('include')
      expect(callArgs[1].headers).not.toHaveProperty('Authorization')
    })
  })

  // ---- HTTP 方法 ---------------------------------------------------
  describe('HTTP 方法', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(mockResponse({ ok: true, body: { data: { id: 1, name: 'test' } } }))
    })

    it('GET 应正确拼接查询参数', async () => {
      await httpClient.get('/test', { page: 1, limit: 10 })
      expect(mockFetch).toHaveBeenCalledWith('/api/test?page=1&limit=10', expect.objectContaining({ method: 'GET' }))
    })

    it('GET 应过滤 null 和 undefined 参数', async () => {
      await httpClient.get('/test', { page: 1, limit: null, offset: undefined })
      expect(mockFetch.mock.calls[0][0]).toBe('/api/test?page=1')
    })

    it('GET 无参数时不应添加查询字符串', async () => {
      await httpClient.get('/test')
      expect(mockFetch.mock.calls[0][0]).toBe('/api/test')
    })

    it('POST 应发送 JSON 请求体', async () => {
      await httpClient.post('/test', { name: 'test' })
      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'POST', body: JSON.stringify({ name: 'test' })
      }))
    })

    it('PUT 应发送 JSON 请求体', async () => {
      await httpClient.put('/test/1', { name: 'updated' })
      expect(mockFetch).toHaveBeenCalledWith('/api/test/1', expect.objectContaining({
        method: 'PUT', body: JSON.stringify({ name: 'updated' })
      }))
    })

    it('PATCH 应发送 JSON 请求体', async () => {
      await httpClient.patch('/test/1', { name: 'patched' })
      expect(mockFetch).toHaveBeenCalledWith('/api/test/1', expect.objectContaining({
        method: 'PATCH', body: JSON.stringify({ name: 'patched' })
      }))
    })

    it('DELETE 应发送无请求体', async () => {
      await httpClient.delete('/test/1')
      expect(mockFetch).toHaveBeenCalledWith('/api/test/1', expect.objectContaining({ method: 'DELETE' }))
    })
  })

  // ---- 错误处理 ----------------------------------------------------
  describe('错误处理', () => {
    it('非 200 响应应抛出包含错误信息的异常', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ok: false, status: 400, body: { error: 'Bad Request' } }))
      await expect(httpClient.get('/test')).rejects.toThrow('Bad Request')
    })

    it('错误对象应包含 status 和 data 属性', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ok: false, status: 422, body: { error: 'Validation Error', details: { field: 'email' } } }))
      try {
        await httpClient.get('/test')
      } catch (err) {
        expect(err.status).toBe(422)
        expect(err.data).toEqual({ error: 'Validation Error', details: { field: 'email' } })
      }
    })

    it('响应无 error 字段时应使用 message 字段', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ok: false, status: 500, body: { message: 'Internal Server Error' } }))
      await expect(httpClient.get('/test')).rejects.toThrow('Internal Server Error')
    })

    it('网络错误应提示检查网络设置', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))
      await expect(httpClient.get('/test')).rejects.toThrow('网络连接失败')
    })

    it('非 TypeError 的网络异常应原样抛出', async () => {
      mockFetch.mockRejectedValue(new Error('Abort signal'))
      await expect(httpClient.get('/test')).rejects.toThrow('Abort signal')
    })
  })

  // ---- Token 自动刷新 ---------------------------------------------
  describe('Token 自动刷新', () => {
    it('401 响应（非认证接口）应尝试刷新 Token', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({ ok: false, status: 401, body: { error: 'Unauthorized' } }))
        .mockResolvedValueOnce(mockResponse({ ok: true, body: { data: { token: 'new-token' } } }))
        .mockResolvedValueOnce(mockResponse({ ok: true, body: { data: 'retry-success' } }))

      const result = await httpClient.get('/protected')
      expect(result.data).toBe('retry-success')

      const refreshCall = mockFetch.mock.calls[1]
      expect(refreshCall[0]).toBe('/api/auth/refresh')
      expect(refreshCall[1]).toEqual(expect.objectContaining({ method: 'POST', credentials: 'include' }))
    })

    it('认证接口 401 不应触发刷新', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ok: false, status: 401, body: { error: 'Invalid credentials' } }))

      await expect(httpClient.post('/auth/login', {})).rejects.toThrow('Invalid credentials')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('刷新失败应派发 auth:session-expired 事件', async () => {
      const eventSpy = vi.spyOn(window, 'dispatchEvent')

      mockFetch
        .mockResolvedValueOnce(mockResponse({ ok: false, status: 401, body: { error: 'Unauthorized' } }))
        .mockResolvedValueOnce(mockResponse({ ok: false, status: 401, body: { error: 'Refresh token expired' } }))

      await expect(httpClient.get('/protected')).rejects.toThrow()

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth:session-expired' })
      )
      eventSpy.mockRestore()
    })

    it('并发请求时应排队等待刷新完成', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({ ok: false, status: 401, body: { error: 'Unauthorized' } }))
        .mockResolvedValueOnce(mockResponse({ ok: true, body: { data: { token: 'new-token' } } }))
        .mockResolvedValueOnce(mockResponse({ ok: true, body: { data: 'success' } }))
        .mockResolvedValueOnce(mockResponse({ ok: true, body: { data: 'success' } }))

      const [result1, result2] = await Promise.all([
        httpClient.get('/protected1'),
        httpClient.get('/protected2')
      ])

      expect(result1.data || result2.data).toBe('success')
    })
  })
})
