/**
 * WebSocket组合式函数
 * @description 管理WebSocket连接、消息收发、重连等
 * @module composables/useWebSocket
 * @author Full-stack Team
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

// WebSocket状态枚举
const WS_STATE = {
  CONNECTING: 'connecting',
  OPEN: 'open',
  CLOSING: 'closing',
  CLOSED: 'closed',
  RECONNECTING: 'reconnecting'
}

/**
 * 使用WebSocket
 * @param {Object} options - 配置选项
 * @param {string} options.url - WebSocket服务器URL
 * @param {number} [options.reconnectInterval=3000] - 重连间隔（毫秒）
 * @param {number} [options.maxReconnectAttempts=5] - 最大重连次数
 * @param {boolean} [options.autoConnect=true] - 是否自动连接
 * @param {boolean} [options.autoReconnect=true] - 是否自动重连
 * @returns {Object} 暴露的响应式状态和方法
 */
export function useWebSocket(options = {}) {
  const {
    url,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    autoConnect = true,
    autoReconnect = true
  } = options

  // ========== 状态定义 ==========
  const socket = ref(null)
  const state = ref(WS_STATE.CLOSED)
  const messages = ref([])
  const error = ref(null)
  const reconnectCount = ref(0)
  let reconnectTimer = null

  // ========== 计算属性 ==========
  const isConnected = computed(() => state.value === WS_STATE.OPEN)
  const isConnecting = computed(() => 
    state.value === WS_STATE.CONNECTING || state.value === WS_STATE.RECONNECTING
  )

  // ========== 方法定义 ==========

  /**
   * 连接WebSocket
   * @returns {Promise<void>}
   */
  function connect() {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected')
      return Promise.resolve()
    }

    state.value = reconnectCount.value > 0 ? WS_STATE.RECONNECTING : WS_STATE.CONNECTING
    error.value = null

    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(url)
        socket.value = ws

        ws.onopen = () => {
          state.value = WS_STATE.OPEN
          reconnectCount.value = 0
          resolve()
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            messages.value.push({
              id: Date.now(),
              data,
              timestamp: new Date(),
              type: 'received'
            })
            // 触发自定义事件，方便组件监听
            window.dispatchEvent(new CustomEvent('ws-message', { detail: data }))
          } catch (err) {
            console.warn('Failed to parse WebSocket message:', err)
          }
        }

        ws.onerror = (event) => {
          error.value = 'WebSocket error occurred'
          console.error('WebSocket error:', event)
        }

        ws.onclose = (event) => {
          state.value = WS_STATE.CLOSED
          socket.value = null

          // 自动重连
          if (autoReconnect && reconnectCount.value < maxReconnectAttempts) {
            reconnectCount.value++
            reconnectTimer = setTimeout(() => {
              connect()
            }, reconnectInterval)
          }
        }
      } catch (err) {
        error.value = err.message
        state.value = WS_STATE.CLOSED
        reject(err)
      }
    })
  }

  /**
   * 断开连接
   * @param {number} [code=1000] - 关闭代码
   * @param {string} [reason=''] - 关闭原因
   */
  function disconnect(code = 1000, reason = '') {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    if (socket.value) {
      state.value = WS_STATE.CLOSING
      socket.value.close(code, reason)
    }
  }

  /**
   * 发送消息
   * @param {Object|string} data - 要发送的数据
   * @returns {boolean} 是否发送成功
   */
  function send(data) {
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
      error.value = 'WebSocket is not connected'
      return false
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      socket.value.send(message)
      
      messages.value.push({
        id: Date.now(),
        data,
        timestamp: new Date(),
        type: 'sent'
      })
      
      return true
    } catch (err) {
      error.value = err.message
      return false
    }
  }

  /**
   * 清除消息历史
   */
  function clearMessages() {
    messages.value = []
  }

  /**
   * 清除错误状态
   */
  function clearError() {
    error.value = null
  }

  // ========== 生命周期 ==========

  // 组件挂载时自动连接
  onMounted(() => {
    if (autoConnect) {
      connect().catch(() => {})
    }
  })

  // 组件卸载时断开连接
  onUnmounted(() => {
    disconnect()
  })

  // ========== 返回状态和方法 ==========
  return {
    // 状态
    socket,
    state,
    messages,
    error,
    reconnectCount,

    // 计算属性
    isConnected,
    isConnecting,

    // 方法
    connect,
    disconnect,
    send,
    clearMessages,
    clearError
  }
}

/**
 * 创建WebSocket服务（单例模式）
 * @param {Object} options - 配置选项
 * @returns {Object} WebSocket服务实例
 */
let wsInstance = null

export function useWebSocketService(options = {}) {
  if (!wsInstance) {
    wsInstance = useWebSocket(options)
  }
  return wsInstance
}

/**
 * 关闭WebSocket服务（清除单例）
 */
export function destroyWebSocketService() {
  if (wsInstance) {
    wsInstance.disconnect()
    wsInstance = null
  }
}
