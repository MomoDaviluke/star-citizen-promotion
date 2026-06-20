/**
 * @file Store 异步操作工具
 * @description 为 Pinia Store 提供统一的 loading/error 状态管理，
 *              消除各 Store 中重复的 try/catch/finally 模式
 * @module utils/storeHelpers
 */

/**
 * 创建带 loading/error 状态管理的异步操作包装器
 * @description 自动管理 loading 和 error 状态，避免在每个异步方法中重复 try/catch/finally
 * @param {import('vue').Ref<boolean>} loading - loading 状态引用
 * @param {import('vue').Ref<string|null>} error - error 状态引用
 * @returns {Function} withLoading 包装函数
 *
 * @example
 * const { withLoading } = createStoreHelpers(loading, error)
 *
 * async function fetchShips() {
 *   return withLoading(
 *     () => fleetService.getFleet(),
 *     '获取舰队数据失败'
 *   )
 * }
 */
export function createStoreHelpers(loading, error) {
  /**
   * 执行异步操作并自动管理 loading/error 状态
   * @param {Function} fn - 异步操作函数
   * @param {string} [errorMsg='操作失败'] - 失败时的默认错误消息
   * @returns {Promise<*>} fn 的返回值
   */
  async function withLoading(fn, errorMsg = '操作失败') {
    loading.value = true
    error.value = null
    try {
      return await fn()
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error(String(err))
      error.value = errObj.message || errorMsg
      throw errObj
    } finally {
      loading.value = false
    }
  }

  return { withLoading }
}
