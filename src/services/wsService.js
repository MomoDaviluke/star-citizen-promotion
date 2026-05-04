/**
 * @file WebSocket 客户端服务
 * @description 封装浏览器 WebSocket 连接，提供自动重连、心跳检测和事件分发
 * @module services/wsService
 */

import { ref } from 'vue'

/**
 * WebSocket 连接状态枚举
 */
export const WS_STATE = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting'
}

/**
 * WebSocket 客户端服务类
 */
class WebSocketService {
  constructor() {
    /** @type {WebSocket|null} */
    this.ws = null
    this.state = ref(WS_STATE.DISCONNECTED)
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.heartbeatInterval = null
    this.eventHandlers = new Map()
  }

  /**
   * 获取 WebSocket 服务地址
   */
  getWsUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/ws`
  }

  /**
   * 建立 WebSocket 连接
   * @param {string} [token] - 认证令牌
   */
  connect(token) {
    if (this.ws?.readyState === WebSocket.OPEN) return

    const url = this.getWsUrl()
    this.state.value = WS_STATE.CONNECTING

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        this.state.value = WS_STATE.CONNECTED
        this.reconnectAttempts = 0

        // 发送认证消息
        if (token) {
          this.send({ type: 'auth', data: { token } })
        }

        // 启动心跳
        this.startHeartbeat()

        this._emit('connected')
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this._emit(message.type, message.data)
        } catch {
          console.warn('[WS] 消息解析失败')
        }
      }

      this.ws.onclose = (event) => {
        this.state.value = WS_STATE.DISCONNECTED
        this.stopHeartbeat()

        // 非正常关闭时尝试重连
        if (event.code !== 1001 && event.code !== 1000) {
          this._scheduleReconnect(token)
        }

        this._emit('disconnected', { code: event.code, reason: event.reason })
      }

      this.ws.onerror = () => {
        this.state.value = WS_STATE.DISCONNECTED
        this._emit('error')
      }
    } catch (err) {
      console.error('[WS] 连接失败:', err)
      this.state.value = WS_STATE.DISCONNECTED
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.stopHeartbeat()
    this.reconnectAttempts = this.maxReconnectAttempts // 阻止自动重连

    if (this.ws) {
      this.ws.close(1000, '用户主动断开')
      this.ws = null
    }

    this.state.value = WS_STATE.DISCONNECTED
  }

  /**
   * 发送消息
   */
  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  /**
   * 注册事件监听
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event).add(handler)

    // 返回取消监听函数
    return () => {
      this.eventHandlers.get(event)?.delete(handler)
    }
  }

  /**
   * 移除事件监听
   */
  off(event, handler) {
    if (handler) {
      this.eventHandlers.get(event)?.delete(handler)
    } else {
      this.eventHandlers.delete(event)
    }
  }

  /**
   * 触发事件
   */
  _emit(event, data) {
    this.eventHandlers.get(event)?.forEach((handler) => {
      try {
        handler(data)
      } catch (err) {
        console.error(`[WS] 事件处理器错误 (${event}):`, err)
      }
    })
  }

  /**
   * 启动心跳
   */
  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping' })
    }, 25000)
  }

  /**
   * 停止心跳
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * 调度重连
   */
  _scheduleReconnect(token) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WS] 达到最大重连次数，停止重连')
      return
    }

    this.state.value = WS_STATE.RECONNECTING
    this.reconnectAttempts++

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    console.log(`[WS] ${delay}ms 后重连 (第 ${this.reconnectAttempts} 次)`)

    setTimeout(() => {
      this.connect(token)
    }, delay)
  }
}

/** WebSocket 服务单例 */
export const wsService = new WebSocketService()

export default wsService
