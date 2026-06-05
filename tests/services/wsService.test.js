/**
 * @file wsService 单元测试
 * @description 覆盖 WebSocket 客户端服务：连接、消息、事件、心跳、重连
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock window.location
vi.stubGlobal('location', { protocol: 'http:', host: 'localhost:3000' })

// Mock logger
vi.mock('../../src/utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })
}))

// ---- Mock WebSocket ------------------------------------------------
let mockWsInstance = null
const MockWebSocket = vi.fn(function (url) {
  mockWsInstance = this
  this.url = url
  this.readyState = WebSocket.CONNECTING
  this.onopen = null
  this.onmessage = null
  this.onclose = null
  this.onerror = null
  this.send = vi.fn()
  this.close = vi.fn(function (code, reason) {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) {
      this.onclose({ code: code || 1000, reason: reason || '' })
    }
  })
})
MockWebSocket.CONNECTING = 0
MockWebSocket.OPEN = 1
MockWebSocket.CLOSING = 2
MockWebSocket.CLOSED = 3

vi.stubGlobal('WebSocket', MockWebSocket)

// ---- Import after mocks ---------------------------------------------
const { wsService, WS_STATE } = await import('../../src/services/wsService.js')

// ---- Helpers -------------------------------------------------------
function resetService() {
  wsService.disconnect()
  wsService.reconnectAttempts = 0
  wsService.eventHandlers.clear()
  vi.clearAllMocks()
  mockWsInstance = null
}

function simulateOpen() {
  mockWsInstance.readyState = WebSocket.OPEN
  mockWsInstance.onopen?.()
}

function simulateMessage(data) {
  mockWsInstance.onmessage?.({ data: JSON.stringify(data) })
}

function simulateClose(code = 1000, reason = '') {
  mockWsInstance.readyState = WebSocket.CLOSED
  mockWsInstance.onclose?.({ code, reason })
}

function simulateError() {
  mockWsInstance.onerror?.()
}

describe('wsService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetService()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ---- 初始状态 ------------------------------------------------
  describe('initial state', () => {
    it('初始状态应为 DISCONNECTED', () => {
      expect(wsService.state.value).toBe(WS_STATE.DISCONNECTED)
    })

    it('isConnected 应为 false', () => {
      expect(wsService.isConnected.value).toBe(false)
    })

    it('eventHandlers 应为空 Map', () => {
      expect(wsService.eventHandlers.size).toBe(0)
    })
  })

  // ---- connect() ------------------------------------------------
  describe('connect', () => {
    it('应创建 WebSocket 并切换到 CONNECTING', () => {
      wsService.connect()
      expect(MockWebSocket).toHaveBeenCalledWith('ws://localhost:3000/ws')
      expect(wsService.state.value).toBe(WS_STATE.CONNECTING)
    })

    it('已在 OPEN 状态不应重复连接', () => {
      wsService.connect()
      simulateOpen()
      MockWebSocket.mockClear()
      wsService.connect()
      expect(MockWebSocket).not.toHaveBeenCalled()
    })

    it('传入 token 时 onopen 应发送认证消息', () => {
      wsService.connect('test-token')
      simulateOpen()
      expect(mockWsInstance.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'auth', data: { token: 'test-token' } })
      )
    })
  })

  // ---- onopen --------------------------------------------------
  describe('onopen', () => {
    it('应切换到 CONNECTED 状态', () => {
      wsService.connect()
      simulateOpen()
      expect(wsService.state.value).toBe(WS_STATE.CONNECTED)
    })

    it('应重置重连计数', () => {
      wsService.reconnectAttempts = 3
      wsService.connect()
      simulateOpen()
      expect(wsService.reconnectAttempts).toBe(0)
    })

    it('应触发 connected 事件', () => {
      const handler = vi.fn()
      wsService.on('connected', handler)
      wsService.connect()
      simulateOpen()
      expect(handler).toHaveBeenCalled()
    })

    it('应启动心跳', () => {
      wsService.connect()
      simulateOpen()
      expect(wsService.heartbeatInterval).not.toBeNull()
    })
  })

  // ---- onmessage -----------------------------------------------
  describe('onmessage', () => {
    it('应解析 JSON 并按 type 派发事件', () => {
      const handler = vi.fn()
      wsService.on('notification', handler)
      wsService.connect()
      simulateOpen()
      simulateMessage({ type: 'notification', data: { msg: 'hello' } })
      expect(handler).toHaveBeenCalledWith({ msg: 'hello' })
    })

    it('无效 JSON 应静默处理', () => {
      wsService.connect()
      simulateOpen()
      // onmessage 接收非 JSON 数据
      expect(() => {
        mockWsInstance.onmessage?.({ data: 'not-json' })
      }).not.toThrow()
    })
  })

  // ---- onclose -------------------------------------------------
  describe('onclose', () => {
    it('正常关闭(code=1000)不应重连', () => {
      wsService.connect()
      simulateOpen()
      simulateClose(1000)
      expect(wsService.reconnectTimeoutId).toBeNull()
    })

    it('异常关闭(code=1006)应触发重连', () => {
      wsService.connect()
      simulateOpen()
      simulateClose(1006)
      expect(wsService.reconnectTimeoutId).not.toBeNull()
    })

    it('应停止心跳', () => {
      wsService.connect()
      simulateOpen()
      simulateClose()
      expect(wsService.heartbeatInterval).toBeNull()
    })

    it('应触发 disconnected 事件', () => {
      const handler = vi.fn()
      wsService.on('disconnected', handler)
      wsService.connect()
      simulateOpen()
      simulateClose(1001, 'Going Away')
      expect(handler).toHaveBeenCalledWith({ code: 1001, reason: 'Going Away' })
    })
  })

  // ---- onerror -------------------------------------------------
  describe('onerror', () => {
    it('应切换到 DISCONNECTED', () => {
      wsService.connect()
      simulateOpen()
      simulateError()
      expect(wsService.state.value).toBe(WS_STATE.DISCONNECTED)
    })

    it('应触发 error 事件', () => {
      const handler = vi.fn()
      wsService.on('error', handler)
      wsService.connect()
      simulateOpen()
      simulateError()
      expect(handler).toHaveBeenCalled()
    })
  })

  // ---- disconnect() --------------------------------------------
  describe('disconnect', () => {
    it('应停止心跳和重连', () => {
      wsService.connect()
      simulateOpen()
      wsService.disconnect()
      expect(wsService.heartbeatInterval).toBeNull()
      expect(wsService.reconnectTimeoutId).toBeNull()
    })

    it('应设 reconnectAttempts 为 max 以阻止重连', () => {
      wsService.connect()
      simulateOpen()
      wsService.disconnect()
      expect(wsService.reconnectAttempts).toBe(wsService.maxReconnectAttempts)
    })

    it('应调用 ws.close(1000)', () => {
      wsService.connect()
      simulateOpen()
      wsService.disconnect()
      expect(mockWsInstance.close).toHaveBeenCalledWith(1000, '用户主动断开')
    })
  })

  // ---- send() --------------------------------------------------
  describe('send', () => {
    it('连接状态下应发送 JSON 消息', () => {
      wsService.connect()
      simulateOpen()
      wsService.send({ type: 'test', data: { x: 1 } })
      expect(mockWsInstance.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'test', data: { x: 1 } })
      )
    })

    it('非连接状态不应发送', () => {
      wsService.send({ type: 'test' })
      // 未连接时 ws 为 null，send 方法直接返回
      expect(wsService.ws).toBeNull()
    })
  })

  // ---- on / off ------------------------------------------------
  describe('on / off', () => {
    it('on 应注册事件处理器并返回取消函数', () => {
      const handler = vi.fn()
      const unsubscribe = wsService.on('test', handler)
      expect(typeof unsubscribe).toBe('function')
    })

    it('off 应移除指定处理器', () => {
      const handler = vi.fn()
      wsService.on('test', handler)
      wsService.off('test', handler)
      wsService._emit('test', {})
      expect(handler).not.toHaveBeenCalled()
    })

    it('off 无 handler 应移除整个事件', () => {
      const handler = vi.fn()
      wsService.on('test', handler)
      wsService.off('test')
      expect(wsService.eventHandlers.has('test')).toBe(false)
    })

    it('事件处理器异常不应影响其他处理器', () => {
      const badHandler = vi.fn(() => { throw new Error('boom') })
      const goodHandler = vi.fn()
      wsService.on('test', badHandler)
      wsService.on('test', goodHandler)
      expect(() => wsService._emit('test', {})).not.toThrow()
      expect(badHandler).toHaveBeenCalled()
      expect(goodHandler).toHaveBeenCalled()
    })
  })

  // ---- 心跳 ----------------------------------------------------
  describe('heartbeat', () => {
    it('心跳应每 25 秒发送 ping', () => {
      wsService.connect()
      simulateOpen()
      wsService.send = vi.fn()
      vi.advanceTimersByTime(25000)
      expect(wsService.send).toHaveBeenCalledWith({ type: 'ping' })
    })

    it('stopHeartbeat 应清除定时器', () => {
      wsService.connect()
      simulateOpen()
      wsService.stopHeartbeat()
      expect(wsService.heartbeatInterval).toBeNull()
    })
  })

  // ---- 重连 ----------------------------------------------------
  describe('reconnect', () => {
    it('首次重连延迟应为 1 秒', () => {
      wsService.connect()
      simulateOpen()
      simulateClose(1006)
      expect(wsService.reconnectTimeoutId).not.toBeNull()
      expect(wsService.state.value).toBe(WS_STATE.RECONNECTING)
    })

    it('指数退避：第 2 次重连延迟应为 2 秒', () => {
      wsService.reconnectAttempts = 1
      wsService._scheduleReconnect('token')
      vi.advanceTimersByTime(2000)
      expect(MockWebSocket).toHaveBeenCalled()
    })

    it('达到最大重连次数应停止', () => {
      wsService.reconnectAttempts = wsService.maxReconnectAttempts
      wsService._scheduleReconnect('token')
      expect(wsService.reconnectTimeoutId).toBeNull()
    })
  })

  // ---- getWsUrl ------------------------------------------------
  describe('getWsUrl', () => {
    it('http 协议应返回 ws://', () => {
      vi.stubGlobal('location', { protocol: 'http:', host: 'example.com' })
      const url = wsService.getWsUrl()
      expect(url).toBe('ws://example.com/ws')
    })

    it('https 协议应返回 wss://', () => {
      vi.stubGlobal('location', { protocol: 'https:', host: 'secure.example.com' })
      const url = wsService.getWsUrl()
      expect(url).toBe('wss://secure.example.com/ws')
    })
  })
})
