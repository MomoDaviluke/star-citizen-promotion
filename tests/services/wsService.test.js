/**
 * @file WebSocket 客户端服务单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { wsService, WS_STATE } from '../../src/services/wsService.js'

describe('WebSocketService', () => {
  let mockWs
  let wsSpy

  beforeEach(() => {
    // 手动重置 wsService 状态
    if (wsService.ws) {
      try { wsService.ws.close() } catch { /* ignore */ }
    }
    wsService.ws = null
    wsService.state.value = WS_STATE.DISCONNECTED
    wsService.reconnectAttempts = 0
    wsService.eventHandlers.clear()
    wsService.stopHeartbeat()

    // Mock WebSocket 实例
    mockWs = {
      send: vi.fn(),
      close: vi.fn(),
      readyState: 1
    }

    // Stub global WebSocket
    wsSpy = vi.fn().mockImplementation(() => mockWs)
    wsSpy.OPEN = 1
    wsSpy.CONNECTING = 0
    wsSpy.CLOSING = 2
    wsSpy.CLOSED = 3
    vi.stubGlobal('WebSocket', wsSpy)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('connect', () => {
    it('应创建 WebSocket 连接', () => {
      wsService.connect('test-token')
      expect(wsSpy).toHaveBeenCalledWith(expect.stringContaining('/ws'))
    })

    it('连接成功后应触发 connected 事件并发送认证', () => {
      const onConnected = vi.fn()
      wsService.on('connected', onConnected)

      wsService.connect('test-token')
      // 模拟 onopen 回调赋值后触发
      expect(typeof mockWs.onopen).toBe('function')
      mockWs.onopen()

      expect(onConnected).toHaveBeenCalled()
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('auth'))
      expect(wsService.state.value).toBe(WS_STATE.CONNECTED)
    })

    it('已连接时不应重复创建连接', () => {
      wsService.connect('test-token')
      mockWs.onopen()

      wsSpy.mockClear()
      wsService.connect('test-token')

      expect(wsSpy).not.toHaveBeenCalled()
    })
  })

  describe('消息接收', () => {
    it('应解析并分发服务器消息', () => {
      const onNotification = vi.fn()
      wsService.on('notification', onNotification)

      wsService.connect('test-token')
      mockWs.onopen()

      expect(typeof mockWs.onmessage).toBe('function')
      mockWs.onmessage({
        data: JSON.stringify({ type: 'notification', data: 'Test' })
      })

      expect(onNotification).toHaveBeenCalledWith('Test')
    })
  })

  describe('连接状态', () => {
    it('连接成功后状态应为 CONNECTED', () => {
      wsService.connect('test-token')
      mockWs.onopen()

      expect(wsService.state.value).toBe(WS_STATE.CONNECTED)
    })

    it('未连接时状态应为 DISCONNECTED', () => {
      expect(wsService.state.value).toBe(WS_STATE.DISCONNECTED)
    })
  })

  describe('disconnect', () => {
    it('应关闭连接并重置状态', () => {
      wsService.connect('test-token')
      mockWs.onopen()

      wsService.disconnect()

      expect(mockWs.close).toHaveBeenCalledWith(1000, '用户主动断开')
      expect(wsService.state.value).toBe(WS_STATE.DISCONNECTED)
      expect(wsService.ws).toBeNull()
    })
  })

  describe('send', () => {
    it('连接状态应发送消息', () => {
      wsService.connect('test-token')
      mockWs.onopen()
      mockWs.send.mockClear()

      wsService.send({ type: 'test', data: 'hello' })

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'test', data: 'hello' })
      )
    })

    it('未连接时应静默不发送', () => {
      // 不应抛出错误
      wsService.send({ type: 'test' })
      expect(wsService.ws).toBeNull()
    })
  })

  describe('事件管理', () => {
    it('on 应注册事件监听器', () => {
      const handler = vi.fn()
      wsService.on('custom', handler)

      wsService._emit('custom', 'data')

      expect(handler).toHaveBeenCalledWith('data')
    })

    it('on 返回的函数应取消监听', () => {
      const handler = vi.fn()
      const unsubscribe = wsService.on('custom', handler)

      unsubscribe()
      wsService._emit('custom', 'data')

      expect(handler).not.toHaveBeenCalled()
    })

    it('off 应移除事件监听器', () => {
      const handler = vi.fn()
      wsService.on('custom', handler)
      wsService.off('custom', handler)

      wsService._emit('custom', 'data')

      expect(handler).not.toHaveBeenCalled()
    })

    it('off 无 handler 时应清空事件', () => {
      const handler = vi.fn()
      wsService.on('custom', handler)
      wsService.off('custom')

      wsService._emit('custom', 'data')

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('错误与关闭处理', () => {
    it('连接错误应触发 error 事件', () => {
      const onError = vi.fn()
      wsService.on('error', onError)

      wsService.connect('test-token')
      expect(typeof mockWs.onerror).toBe('function')
      mockWs.onerror()

      expect(onError).toHaveBeenCalled()
      expect(wsService.state.value).toBe(WS_STATE.DISCONNECTED)
    })

    it('连接关闭应触发 disconnected 事件', () => {
      const onDisconnected = vi.fn()
      wsService.on('disconnected', onDisconnected)

      wsService.connect('test-token')
      mockWs.onopen()
      expect(typeof mockWs.onclose).toBe('function')
      mockWs.onclose({ code: 1000, reason: 'Normal' })

      expect(onDisconnected).toHaveBeenCalledWith(
        expect.objectContaining({ code: 1000 })
      )
    })
  })

  describe('心跳', () => {
    it('连接后应启动心跳定时器', () => {
      vi.useFakeTimers()

      wsService.connect('test-token')
      mockWs.onopen()
      mockWs.send.mockClear()

      vi.advanceTimersByTime(25000)

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'ping' })
      )

      vi.useRealTimers()
    })

    it('断开时应停止心跳', () => {
      vi.useFakeTimers()

      wsService.connect('test-token')
      mockWs.onopen()
      wsService.disconnect()

      mockWs.send.mockClear()
      vi.advanceTimersByTime(50000)

      expect(mockWs.send).not.toHaveBeenCalled()

      vi.useRealTimers()
    })
  })
})
