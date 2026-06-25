/**
 * @file WebSocket 服务测试
 * @description 覆盖连接管理、认证、心跳、消息路由、速率限制、优雅关闭
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

// ---- Mocks -----------------------------------------------------------

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}

const mockVerifyToken = jest.fn()

jest.unstable_mockModule('../src/utils/logger.js', () => ({
  default: mockLogger
}))

jest.unstable_mockModule('../src/utils/jwt.js', () => ({
  verifyToken: mockVerifyToken
}))

// ---- Mock WebSocketServer --------------------------------------------

type WSSHandler = (...args: unknown[]) => void

class MockWebSocket {
  static OPEN = 1
  static CLOSED = 3
  readyState = MockWebSocket.OPEN
  private handlers = new Map<string, WSSHandler[]>()
  sent: string[] = []
  closed = false
  closeCode?: number
  closeReason?: string

  on(event: string, handler: WSSHandler) {
    if (!this.handlers.has(event)) this.handlers.set(event, [])
    this.handlers.get(event)!.push(handler)
    return this
  }

  emit(event: string, ...args: unknown[]) {
    for (const handler of this.handlers.get(event) || []) {
      handler(...args)
    }
  }

  send(data: string) {
    this.sent.push(data)
  }

  ping() {
    // no-op
  }

  terminate() {
    this.readyState = MockWebSocket.CLOSED
    this.closed = true
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED
    this.closed = true
    this.closeCode = code
    this.closeReason = reason
  }
}

class MockWSServer {
  static _instance: MockWSServer | null = null
  private handlers = new Map<string, WSSHandler[]>()
  clients = new Set<MockWebSocket>()
  closed = false

  constructor() {
    MockWSServer._instance = this
  }

  on(event: string, handler: WSSHandler) {
    if (!this.handlers.has(event)) this.handlers.set(event, [])
    this.handlers.get(event)!.push(handler)
    return this
  }

  emit(event: string, ...args: unknown[]) {
    for (const handler of this.handlers.get(event) || []) {
      handler(...args)
    }
  }

  close() {
    this.closed = true
    this.emit('close')
  }

  simulateConnection(ws: MockWebSocket, req: unknown) {
    this.clients.add(ws)
    this.emit('connection', ws, req)
  }
}

// Mock ws module
jest.unstable_mockModule('ws', () => ({
  WebSocketServer: MockWSServer,
  WebSocket: MockWebSocket
}))

// ---- Import after mocks ----------------------------------------------

const { startWebSocket, sendToUser, broadcast, closeWebSocket } = await import('../src/websocket.js')

// ---- Helpers ---------------------------------------------------------

function createMockReq(ip = '127.0.0.1') {
  return {
    headers: {} as Record<string, string>,
    socket: { remoteAddress: ip }
  }
}

function createMockHttpServer() {
  return {} as any
}

// ---- Tests -----------------------------------------------------------

describe('WebSocket Server', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    MockWSServer._instance = null
  })

  afterEach(() => {
    closeWebSocket()
    jest.useRealTimers()
  })

  describe('startWebSocket', () => {
    it('应该创建 WebSocketServer 并监听 /ws 路径', () => {
      const server = createMockHttpServer()
      startWebSocket(server)
      expect(MockWSServer._instance).not.toBeNull()
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('WebSocket')
      )
    })
  })

  describe('连接管理', () => {
    it('应该接受新连接并发送 connected 消息', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!
      const ws = new MockWebSocket()

      wss.simulateConnection(ws, createMockReq())

      expect(ws.sent.length).toBe(1)
      const msg = JSON.parse(ws.sent[0])
      expect(msg.type).toBe('connected')
      expect(msg.data.clientId).toBeDefined()
      expect(msg.data.timestamp).toBeDefined()
    })

    it('应该在客户端断开时清理状态', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!
      const ws = new MockWebSocket()

      wss.simulateConnection(ws, createMockReq())
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('连接'),
        expect.anything()
      )

      // 模拟断开
      ws.emit('close')

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('断开'),
        expect.objectContaining({ clientId: expect.any(String) })
      )
    })
  })

  describe('速率限制', () => {
    it('应该拒绝超出速率限制的连接', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!
      const req = createMockReq('10.0.0.1')

      // 发起 10 次连接（达到限制）
      for (let i = 0; i < 10; i++) {
        const ws = new MockWebSocket()
        wss.simulateConnection(ws, req)
      }

      // 第 11 次应被拒绝
      const rejectedWs = new MockWebSocket()
      wss.simulateConnection(rejectedWs, req)

      expect(rejectedWs.closed).toBe(true)
      expect(rejectedWs.closeCode).toBe(1008)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('速率'),
        expect.objectContaining({ ip: '10.0.0.1' })
      )
    })

    it('不同 IP 的连接互不影响', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!

      // IP A 发起 10 次连接
      for (let i = 0; i < 10; i++) {
        const ws = new MockWebSocket()
        wss.simulateConnection(ws, createMockReq('10.0.0.1'))
      }

      // IP B 应该正常连接
      const wsB = new MockWebSocket()
      wss.simulateConnection(wsB, createMockReq('10.0.0.2'))

      expect(wsB.closed).toBe(false)
      expect(wsB.sent.length).toBe(1) // connected 消息
    })

    it('时间窗口过期后应重置计数', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!
      const req = createMockReq('10.0.0.5')

      // 发起 10 次连接
      for (let i = 0; i < 10; i++) {
        const ws = new MockWebSocket()
        wss.simulateConnection(ws, req)
      }

      // 快进 61 秒（超过窗口）
      jest.advanceTimersByTime(61 * 1000)

      // 应该可以再次连接
      const ws = new MockWebSocket()
      wss.simulateConnection(ws, req)

      expect(ws.closed).toBe(false)
    })
  })

  describe('消息验证', () => {
    it('应该拒绝不合法的消息类型', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!
      const ws = new MockWebSocket()

      wss.simulateConnection(ws, createMockReq())
      ws.sent = [] // 清除 connected 消息

      // ws 库 message 事件直接传递 Buffer，不是包装对象
      ws.emit('message', Buffer.from(JSON.stringify({ type: 'invalid_type' })))

      expect(ws.sent.length).toBe(1)
      const msg = JSON.parse(ws.sent[0])
      expect(msg.type).toBe('error')
      expect(msg.message).toContain('不合法')
    })

    it('应该拒绝 JSON 解析失败的消息', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!
      const ws = new MockWebSocket()

      wss.simulateConnection(ws, createMockReq())
      ws.sent = []

      ws.emit('message', Buffer.from('not json'))

      expect(ws.sent.length).toBe(1)
      const msg = JSON.parse(ws.sent[0])
      expect(msg.type).toBe('error')
      expect(msg.message).toContain('无效')
    })

    it('应该接受合法的 ping 消息并返回 pong', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!
      const ws = new MockWebSocket()

      wss.simulateConnection(ws, createMockReq())
      ws.sent = []

      ws.emit('message', Buffer.from(JSON.stringify({ type: 'ping' })))

      expect(ws.sent.length).toBe(1)
      const msg = JSON.parse(ws.sent[0])
      expect(msg.type).toBe('pong')
      expect(msg.timestamp).toBeDefined()
    })
  })

  describe('认证', () => {
    it('有效 token 应该认证成功', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!
      const ws = new MockWebSocket()

      wss.simulateConnection(ws, createMockReq())
      ws.sent = []

      mockVerifyToken.mockReturnValueOnce({ userId: 'user-42' })

      ws.emit('message', Buffer.from(JSON.stringify({
        type: 'auth',
        data: { token: 'valid-token' }
      })))

      expect(ws.sent.length).toBe(1)
      const msg = JSON.parse(ws.sent[0])
      expect(msg.type).toBe('auth_success')
      expect(msg.data.userId).toBe('user-42')
    })

    it('无效 token 应该认证失败', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!
      const ws = new MockWebSocket()

      wss.simulateConnection(ws, createMockReq())
      ws.sent = []

      mockVerifyToken.mockImplementationOnce(() => {
        throw new Error('invalid token')
      })

      ws.emit('message', Buffer.from(JSON.stringify({
        type: 'auth',
        data: { token: 'invalid-token' }
      })))

      expect(ws.sent.length).toBe(1)
      const msg = JSON.parse(ws.sent[0])
      expect(msg.type).toBe('auth_error')
      expect(msg.data.message).toContain('无效')
    })

    it('非字符串 token 应该返回格式错误', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!
      const ws = new MockWebSocket()

      wss.simulateConnection(ws, createMockReq())
      ws.sent = []

      ws.emit('message', Buffer.from(JSON.stringify({
        type: 'auth',
        data: { token: 12345 }
      })))

      expect(ws.sent.length).toBe(1)
      const msg = JSON.parse(ws.sent[0])
      expect(msg.type).toBe('auth_error')
      expect(msg.data.message).toContain('格式')
    })

    it('缺少 token 字段应该静默忽略', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!
      const ws = new MockWebSocket()

      wss.simulateConnection(ws, createMockReq())
      ws.sent = []

      ws.emit('message', Buffer.from(JSON.stringify({
        type: 'auth',
        data: {}
      })))

      // 没有 token 时 handleAuth 直接 return，不发送任何消息
      expect(ws.sent.length).toBe(0)
    })
  })

  describe('消息路由', () => {
    it('sendToUser 应该只发送给指定用户的客户端', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!

      // 客户端 A 认证为 user-1
      const wsA = new MockWebSocket()
      wss.simulateConnection(wsA, createMockReq())
      mockVerifyToken.mockReturnValueOnce({ userId: 'user-1' })
      wsA.emit('message', Buffer.from(JSON.stringify({ type: 'auth', data: { token: 'token-a' } })))
      wsA.sent = []

      // 客户端 B 认证为 user-2
      const wsB = new MockWebSocket()
      wss.simulateConnection(wsB, createMockReq())
      mockVerifyToken.mockReturnValueOnce({ userId: 'user-2' })
      wsB.emit('message', Buffer.from(JSON.stringify({ type: 'auth', data: { token: 'token-b' } })))
      wsB.sent = []

      // 发送给 user-1
      sendToUser('user-1', { type: 'notification', data: { text: 'hello' } })

      expect(wsA.sent.length).toBe(1)
      expect(wsB.sent.length).toBe(0)
    })

    it('broadcast 应该发送给所有已连接客户端', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!

      const wsA = new MockWebSocket()
      const wsB = new MockWebSocket()
      wss.simulateConnection(wsA, createMockReq())
      wss.simulateConnection(wsB, createMockReq())
      wsA.sent = []
      wsB.sent = []

      broadcast({ type: 'announcement', data: { text: '全员通知' } })

      expect(wsA.sent.length).toBe(1)
      expect(wsB.sent.length).toBe(1)
      expect(JSON.parse(wsA.sent[0]).type).toBe('announcement')
    })

    it('sendToUser 应该跳过已关闭的连接', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!

      const ws = new MockWebSocket()
      wss.simulateConnection(ws, createMockReq())
      mockVerifyToken.mockReturnValueOnce({ userId: 'user-3' })
      ws.emit('message', Buffer.from(JSON.stringify({ type: 'auth', data: { token: 'token' } })))
      ws.readyState = MockWebSocket.CLOSED
      ws.sent = []

      sendToUser('user-3', { type: 'test' })

      expect(ws.sent.length).toBe(0)
    })
  })

  describe('心跳检测', () => {
    it('超时未响应 pong 的客户端应被断开', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!
      const ws = new MockWebSocket()

      wss.simulateConnection(ws, createMockReq())

      // 客户端连接后 isAlive 初始为 true
      // 快进 30 秒触发第一次心跳：isAlive 被设为 false，发送 ping
      jest.advanceTimersByTime(30000)

      // 再快进 30 秒：此时 isAlive 仍为 false（未收到 pong），应被 terminate
      jest.advanceTimersByTime(30000)

      expect(ws.closed).toBe(true)
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('心跳超时'),
        expect.anything()
      )
    })

    it('收到 pong 应该重置 isAlive', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!
      const ws = new MockWebSocket()

      wss.simulateConnection(ws, createMockReq())

      // 第一次心跳：isAlive 设为 false
      jest.advanceTimersByTime(30000)

      // 客户端回复 pong
      ws.emit('pong')

      // 第二次心跳：isAlive 为 true（收到 pong），不会断开
      jest.advanceTimersByTime(30000)

      expect(ws.closed).toBe(false)
    })
  })

  describe('优雅关闭', () => {
    it('closeWebSocket 应该关闭所有连接并清理状态', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!

      const ws = new MockWebSocket()
      wss.simulateConnection(ws, createMockReq())

      closeWebSocket()

      expect(wss.closed).toBe(true)
    })

    it('重复调用 closeWebSocket 不应报错', () => {
      startWebSocket(createMockHttpServer())
      closeWebSocket()
      closeWebSocket()
      // 不应抛异常
    })
  })

  describe('IP 解析', () => {
    it('应该优先使用 X-Forwarded-For 头', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!
      const ws = new MockWebSocket()
      const req = {
        headers: { 'x-forwarded-for': '203.0.113.1, 70.41.3.18' },
        socket: { remoteAddress: '10.0.0.1' }
      }

      wss.simulateConnection(ws, req)

      // 应该使用 X-Forwarded-For 的第一个 IP
      // 通过 logger 调用验证
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('连接'),
        expect.objectContaining({ ip: '203.0.113.1' })
      )
    })

    it('应该回退到 X-Real-IP 头', () => {
      startWebSocket(createMockHttpServer())
      const wss = MockWSServer._instance!
      const ws = new MockWebSocket()
      const req = {
        headers: { 'x-real-ip': '198.51.100.1' },
        socket: { remoteAddress: '10.0.0.1' }
      }

      wss.simulateConnection(ws, req)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('连接'),
        expect.objectContaining({ ip: '198.51.100.1' })
      )
    })
  })
})
