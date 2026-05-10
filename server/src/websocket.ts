/**
 * @file WebSocket 服务
 * @description 基于 ws 库的 WebSocket 实时通信服务
 * @module server/websocket
 */

import { Server as HttpServer } from 'node:http'
import { WebSocketServer, WebSocket } from 'ws'
import { verifyToken } from './utils/jwt.js'
import logger from './utils/logger.js'

interface ClientInfo {
  ws: WebSocket
  userId: string | null
  isAlive: boolean
  connectedAt: string
}

let wss: WebSocketServer | null = null
const clients = new Map<string, ClientInfo>()

export function startWebSocket(server: HttpServer): void {
  wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 1024 * 100
  })

  wss.on('connection', (ws: WebSocket, req) => {
    const clientIp = req.socket.remoteAddress
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
    for (const [, client] of clients) {
      client.ws.close(1001, '服务器关闭')
    }
    clients.clear()
  })

  logger.info('🔌 WebSocket 服务已启动，路径: /ws')
}

interface WSMessage {
  type: string
  data?: { token?: string; [key: string]: unknown }
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
    for (const [, client] of clients) {
      client.ws.close(1001, '服务器关闭')
    }
    clients.clear()
    wss.close()
    wss = null
    logger.info('🔌 WebSocket 服务已关闭')
  }
}

export function getConnectedCount(): number {
  return clients.size
}

export default { startWebSocket, sendToUser, broadcast, closeWebSocket, getConnectedCount }
