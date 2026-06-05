/**
 * WebSocket 组合式函数
 * @description wsService 的 Vue composable 包装器，提供响应式状态和生命周期管理
 *              实际 WebSocket 连接由 wsService 单例管理，本模块仅提供 Vue 组件集成
 * @module composables/useWebSocket
 * @deprecated 建议直接使用 wsService 和 Vue 响应式 API 替代
 */

import { onMounted, onUnmounted } from 'vue'
import { wsService } from '../services/wsService.js'

/**
 * 使用 WebSocket 连接
 * @description 在 Vue 组件中使用 WebSocket 的便捷方法
 *              自动在 onMounted 时连接，onUnmounted 时清理事件监听
 *              不断开单例连接（其他组件可能仍在使用）
 * @param {Object} options - 配置选项
 * @param {string} [options.token] - 认证令牌（可选，用于 WebSocket 认证）
 * @param {boolean} [options.autoConnect=true] - 是否在组件挂载时自动连接
 * @returns {Object} 响应式 WebSocket 状态和操作方法
 */
export function useWebSocket(options = {}) {
  const {
    token = null,
    autoConnect = true
  } = options

  // 收集事件处理器引用，用于组件卸载时清理
  const cleanupFns = []

  /**
   * 建立 WebSocket 连接
   * @param {string} [authToken] - 可选的认证令牌
   */
  function connect(authToken) {
    wsService.connect(authToken || token)
  }

  /**
   * 断开 WebSocket 连接
   */
  function disconnect() {
    wsService.disconnect()
  }

  /**
   * 发送消息
   * @param {Object|string} data - 要发送的数据
   */
  function send(data) {
    wsService.send(data)
  }

  /**
   * 注册事件监听
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   * @returns {Function} 取消监听函数
   */
  function on(event, handler) {
    const unsub = wsService.on(event, handler)
    cleanupFns.push(unsub)
    return unsub
  }

  /**
   * 移除事件监听
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   */
  function off(event, handler) {
    wsService.off(event, handler)
  }

  // 组件挂载时自动连接
  onMounted(() => {
    if (autoConnect) {
      connect()
    }
  })

  // 组件卸载时仅清理事件监听，不断开单例连接
  onUnmounted(() => {
    cleanupFns.forEach((fn) => fn())
    cleanupFns.length = 0
  })

  return {
    // 响应式状态（来自 wsService 单例）
    state: wsService.state,
    isConnected: wsService.isConnected,

    // 操作方法
    connect,
    disconnect,
    send,
    on,
    off
  }
}

export default useWebSocket
