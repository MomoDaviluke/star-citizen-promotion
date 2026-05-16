/**
 * @file WebSocket 服务
 * @description 基于 ws 库的 WebSocket 实时通信服务
 *              包含连接速率限制、心跳检测和认证机制
 * @module server/websocket
 */

import { Server as HttpServer, IncomingMessage } from 'node:http'
import { WebSocketServer, WebSocket } from 'ws'
import { verifyToken } from './utils/jwt.js'
import logger from './utils/logger.js'

interface ClientInfo {
  ws: WebSocket
  userId: string | null
  isAlive: boolean
  connectedAt: string
}

interface ConnectionAttempt {
  count: number
  firstAttempt: number
}

let wss: WebSocketServer | null = null
const clients = new Map<string, ClientInfo>()

// 连接速率限制：每个 IP 每分钟最多 10 次连接
const connectionAttempts = new Map<string, ConnectionAttempt>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 分钟
const RATE_LIMIT_MAX = 10 // 最大连接次数

/**
 * 检查 IP 是否超出连接速率限制
 * @param ip 客户端 IP 地址
 * @returns 是否允许连接
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const attempt = connectionAttempts.get(ip)

  if (!attempt) {
    connectionAttempts.set(ip, { count: 1, firstAttempt: now })
    return true
  }

  // 检查时间窗口是否过期
  if (now - attempt.firstAttempt > RATE_LIMIT_WINDOW) {
    connectionAttempts.set(ip, { count: 1, firstAttempt: now })
    return true
  }

  // 检查是否超出限制
  if (attempt.count >= RATE_LIMIT_MAX) {
    logger.warn('WebSocket 连接速率超限', { ip, count: attempt.count })
    return false
  }

  attempt.count++
  return true
}

/**
 * 清理过期的连接速率记录
 * @description 每 5 分钟清理一次，防止内存泄漏
 */
function cleanupRateLimitRecords(): void {
  const now = Date.now()
  for (const [ip, attempt] of connectionAttempts) {
    if (now - attempt.firstAttempt > RATE_LIMIT_WINDOW * 2) {
      connectionAttempts.delete(ip)
    }
  }
}

/**
 * 获取客户端真实 IP 地址
 * @description 优先从代理头获取，支持 X-Forwarded-For 和 X-Real-IP
 * @param req HTTP 请求对象
 * @returns 客户端 IP 地址
 */
function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.headers['x-real-ip'] as string || req.socket.remoteAddress || 'unknown'
}

export function startWebSocket(server: HttpServer): void {
  wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 1024 * 100
  })

  // 定期清理速率限制记录
  const rateLimitCleanup = setInterval(cleanupRateLimitRecords, 5 * 60 * 1000)

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const clientIp = getClientIp(req)

    // 连接速率限制检查
    if (!checkRateLimit(clientIp)) {
      logger.warn('WebSocket 连接被拒绝：速率超限', { ip: clientIp })
      ws.close(1008, '连接速率超限')
      return
    }

    logger.info('WebSocket 客户端连接', { ip: clientIp })

    const clientId = Date.now().toString(36) + Math.random().toString(36).slice(2)

    const client: ClientInfo = {
      ws,
      userId: null,
      isAlive: true,
      connectedAt: new Date().toISOString()
    }

    clients.set(clientId, client)

    ws.on('pong', () => {
      client.isAlive = true
    })

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        if (!isValidMessage(message)) {
          logger.warn('WebSocket 收到非法消息类型', { clientId, messageType: (message as Record<string, unknown>)?.type })
          ws.send(JSON.stringify({ type: 'error', message: '消息类型不合法' }))
          return
        }
        handleMessage(clientId, message)
      } catch (err) {
        logger.warn('WebSocket 消息解析失败', { error: (err as Error).message, clientId })
        ws.send(JSON.stringify({ type: 'error', message: '无效的消息格式' }))
      }
    })

    ws.on('close', () => {
      logger.info('WebSocket 客户端断开', { clientId, userId: client.userId })
      clients.delete(clientId)
    })

    ws.on('error', (err) => {
      logger.error('WebSocket 错误', { error: err.message, clientId })
      clients.delete(clientId)
    })

    ws.send(JSON.stringify({
      type: 'connected',
      data: { clientId, timestamp: new Date().toISOString() }
    }))
  })

  const heartbeat = setInterval(() => {
    if (!wss) return
    wss.clients.forEach((ws) => {
      for (const [clientId, client] of clients) {
        if (client.ws === ws) {
          if (!client.isAlive) {
            logger.info('WebSocket 心跳超时，断开连接', { clientId })
            client.ws.terminate()
            clients.delete(clientId)
            return
          }
          client.isAlive = false
          client.ws.ping()
        }
      }
    })
  }, 30000)

  wss.on('close', () => {
    clearInterval(heartbeat)
    clearInterval(rateLimitCleanup)
    for (const [, client] of clients) {
      client.ws.close(1001, '服务器关闭')
    }
    clients.clear()
    connectionAttempts.clear()
  })

  logger.info('🔌 WebSocket 服务已启动，路径: /ws')
}

/**
 * 允许的 WebSocket 消息类型
 */
const ALLOWED_MESSAGE_TYPES = ['auth', 'ping']

interface WSMessage {
  type: string
  data?: { token?: string; [key: string]: unknown }
}

/**
 * 验证 WebSocket 消息结构
 * @description 确保消息类型在允许列表中，且 data 为对象或 undefined
 */
function isValidMessage(message: unknown): message is WSMessage {
  if (typeof message !== 'object' || message === null) {
    return false
  }
  const msg = message as WSMessage
  if (typeof msg.type !== 'string') {
    return false
  }
  if (!ALLOWED_MESSAGE_TYPES.includes(msg.type)) {
    return false
  }
  if (msg.data !== undefined && (typeof msg.data !== 'object' || msg.data === null)) {
    return false
  }
  return true
}

function handleMessage(clientId: string, message: WSMessage): void {
  const client = clients.get(clientId)
  if (!client) return

  switch (message.type) {
    case 'auth':
      handleAuth(clientId, message.data)
      break
    case 'ping':
      client.ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }))
      break
    default:
      logger.debug('收到未处理的消息类型', { type: message.type, clientId })
  }
}

function handleAuth(clientId: string, data?: { token?: string }): void {
  const client = clients.get(clientId)
  if (!client || !data?.token) return

  // 验证 token 字段类型，防止非字符串输入
  if (typeof data.token !== 'string') {
    client.ws.send(JSON.stringify({
      type: 'auth_error',
      data: { message: '认证令牌格式无效' }
    }))
    return
  }

  try {
    const decoded = verifyToken(data.token) as { userId: string }
    client.userId = decoded.userId
    client.ws.send(JSON.stringify({
      type: 'auth_success',
      data: { userId: decoded.userId }
    }))
    logger.info('WebSocket 客户端认证成功', { clientId, userId: decoded.userId })
  } catch {
    client.ws.send(JSON.stringify({
      type: 'auth_error',
      data: { message: '认证令牌无效或已过期' }
    }))
  }
}

export function sendToUser(userId: string, message: Record<string, unknown>): void {
  for (const [, client] of clients) {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message))
    }
  }
}

export function broadcast(message: Record<string, unknown>): void {
  const data = JSON.stringify(message)
  for (const [, client] of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data)
    }
  }
}

export function closeWebSocket(): void {
  if (wss) {
    wss.close()
    wss = null
  }
}
