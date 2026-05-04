/**
 * @file WebSocket 服务
 * @description 基于 ws 库的 WebSocket 实时通信服务
 * @module server/websocket
 */

import { WebSocketServer } from 'ws'
import { verify } from 'jsonwebtoken'
import { config } from './config/index.js'
import logger from './utils/logger.js'

/**
 * WebSocket 服务器实例
 */
let wss = null

/**
 * 已连接的客户端映射
 * @type {Map<string, {ws: WebSocket, userId: string, isAlive: boolean}>}
 */
const clients = new Map()

/**
 * 启动 WebSocket 服务器
 * @param {import('http').Server} server - HTTP 服务器实例
 */
export function startWebSocket(server) {
  wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 1024 * 100 // 100KB 限制
  })

  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress
    logger.info('WebSocket 客户端连接', { ip: clientIp })

    const clientId = Date.now().toString(36) + Math.random().toString(36).slice(2)

    const client = {
      ws,
      userId: null,
      isAlive: true,
      connectedAt: new Date().toISOString()
    }

    clients.set(clientId, client)

    // 心跳检测
    ws.on('pong', () => {
      client.isAlive = true
    })

    // 消息处理
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        handleMessage(clientId, message)
      } catch (err) {
        logger.warn('WebSocket 消息解析失败', { error: err.message, clientId })
        ws.send(JSON.stringify({ type: 'error', message: '无效的消息格式' }))
      }
    })

    // 断开连接
    ws.on('close', () => {
      logger.info('WebSocket 客户端断开', { clientId, userId: client.userId })
      clients.delete(clientId)
    })

    ws.on('error', (err) => {
      logger.error('WebSocket 错误', { error: err.message, clientId })
      clients.delete(clientId)
    })

    // 发送连接成功消息
    ws.send(JSON.stringify({
      type: 'connected',
      data: { clientId, timestamp: new Date().toISOString() }
    }))
  })

  // 心跳定时器：每 30 秒检测一次
  const heartbeat = setInterval(() => {
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
    for (const [_clientId, client] of clients) {
      client.ws.close(1001, '服务器关闭')
    }
    clients.clear()
  })

  logger.info(`🔌 WebSocket 服务已启动，路径: /ws`)
}

/**
 * 处理客户端消息
 */
function handleMessage(clientId, message) {
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

/**
 * 处理认证消息
 */
function handleAuth(clientId, data) {
  const client = clients.get(clientId)
  if (!client || !data?.token) return

  try {
    const decoded = verify(data.token, config.jwt.secret)
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

/**
 * 向指定用户发送消息
 * @param {string} userId - 目标用户 ID
 * @param {Object} message - 消息对象
 */
export function sendToUser(userId, message) {
  for (const [, client] of clients) {
    if (client.userId === userId && client.ws.readyState === 1) {
      client.ws.send(JSON.stringify(message))
    }
  }
}

/**
 * 向所有已连接客户端广播消息
 * @param {Object} message - 消息对象
 */
export function broadcast(message) {
  const data = JSON.stringify(message)
  for (const [, client] of clients) {
    if (client.ws.readyState === 1) {
      client.ws.send(data)
    }
  }
}

/**
 * 关闭 WebSocket 服务器
 */
export function closeWebSocket() {
  if (wss) {
    // 关闭所有客户端连接
    for (const [_clientId, client] of clients) {
      client.ws.close(1001, '服务器关闭')
    }
    clients.clear()
    wss.close()
    wss = null
    logger.info('🔌 WebSocket 服务已关闭')
  }
}

/**
 * 获取当前连接数
 */
export function getConnectedCount() {
  return clients.size
}

export default { startWebSocket, sendToUser, broadcast, closeWebSocket, getConnectedCount }
