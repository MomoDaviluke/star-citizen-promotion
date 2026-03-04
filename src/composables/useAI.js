/**
 * @file AI 服务组合式函数
 * @description 提供 Vue 组件中使用的 AI 服务组合式函数，封装任务执行、状态管理和取消功能
 * @module composables/useAI
 */

import { ref, reactive, onUnmounted } from 'vue'
import { aiService, PRIORITY, TASK_STATUS } from '../services/AIService.js'

/**
 * AI 任务执行组合式函数
 * @description 提供任务提交、取消、进度追踪和状态管理功能
 * @returns {Object} 组合式函数返回对象
 * @returns {Ref<boolean>} returns.isLoading - 是否正在加载
 * @returns {Ref<Error|null>} returns.error - 错误对象
 * @returns {Ref<*>} returns.result - 任务结果
 * @returns {Ref<number>} returns.progress - 任务进度（0-100）
 * @returns {Object} returns.status - 服务状态对象
 * @returns {Function} returns.execute - 执行任务函数
 * @returns {Function} returns.cancel - 取消当前任务
 * @returns {Function} returns.submitBackground - 提交后台任务
 * @returns {Function} returns.updateStatus - 更新服务状态
 * @returns {Object} returns.PRIORITY - 优先级常量
 * @returns {Object} returns.TASK_STATUS - 任务状态常量
 * @example
 * const { isLoading, error, result, execute } = useAI()
 *
 * const data = await execute(async (context) => {
 *   const { signal, onProgress } = context
 *   onProgress(50) // 更新进度
 *   // 执行异步操作...
 *   return result
 * }, { priority: PRIORITY.HIGH })
 */
export function useAI() {
  /**
   * 是否正在加载
   * @type {Ref<boolean>}
   */
  const isLoading = ref(false)

  /**
   * 错误对象
   * @type {Ref<Error|null>}
   */
  const error = ref(null)

  /**
   * 任务结果
   * @type {Ref<*>}
   */
  const result = ref(null)

  /**
   * 任务进度
   * @type {Ref<number>}
   */
  const progress = ref(0)

  /**
   * 当前任务 ID
   * @type {Ref<string|null>}
   */
  const currentTaskId = ref(null)

  /**
   * 服务状态
   * @type {Object}
   */
  const status = reactive({
    queueSize: 0,
    activeTasks: 0,
    completedTasks: 0
  })

  /**
   * 内部 AbortController 实例
   * @type {AbortController|null}
   */
  let abortController = null

  /**
   * 执行任务
   * @description 提交任务到 AI 服务并追踪执行状态
   * @param {Function} taskFn - 任务函数
   * @param {Object} [options={}] - 任务选项
   * @returns {Promise} 任务执行结果
   */
  const execute = async (taskFn, options = {}) => {
    isLoading.value = true
    error.value = null
    result.value = null
    progress.value = 0

    abortController = new AbortController()

    const mergedSignal = options.signal
      ? combineSignals(abortController.signal, options.signal)
      : abortController.signal

    try {
      const response = await aiService.submit(
        async (context) => {
          return taskFn({
            ...context,
            onProgress: (p) => {
              progress.value = p
            }
          })
        },
        {
          ...options,
          signal: mergedSignal
        }
      )

      result.value = response
      return response
    } catch (err) {
      error.value = err
      throw err
    } finally {
      isLoading.value = false
      currentTaskId.value = null
      abortController = null
    }
  }

  /**
   * 取消当前任务
   * @description 中止正在执行的任务
   */
  const cancel = () => {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    isLoading.value = false
  }

  /**
   * 更新服务状态
   * @description 从 AI 服务获取最新状态
   */
  const updateStatus = () => {
    const serviceStatus = aiService.getStatus()
    status.queueSize = serviceStatus.queueSize
    status.activeTasks = serviceStatus.activeTasks
    status.completedTasks = serviceStatus.completedTasks
  }

  /**
   * 提交后台任务
   * @description 提交不需要追踪结果的后台任务
   * @param {Function} taskFn - 任务函数
   * @param {Object} [options={}] - 任务选项
   * @returns {Promise} 任务 Promise
   */
  const submitBackground = (taskFn, options = {}) => {
    return aiService.submit(taskFn, options)
  }

  onUnmounted(() => {
    cancel()
  })

  return {
    isLoading,
    error,
    result,
    progress,
    status,
    execute,
    cancel,
    submitBackground,
    updateStatus,
    PRIORITY,
    TASK_STATUS
  }
}

/**
 * 合并多个 AbortSignal
 * @description 创建一个新的 AbortController，当任一信号中止时触发
 * @param {AbortSignal} signal1 - 第一个信号
 * @param {AbortSignal} signal2 - 第二个信号
 * @returns {AbortSignal} 合并后的信号
 * @private
 */
function combineSignals(signal1, signal2) {
  const controller = new AbortController()

  const abort = () => controller.abort()

  signal1.addEventListener('abort', abort)
  signal2.addEventListener('abort', abort)

  controller.signal.addEventListener('abort', () => {
    signal1.removeEventListener('abort', abort)
    signal2.removeEventListener('abort', abort)
  })

  return controller.signal
}

/**
 * AI 服务状态监控组合式函数
 * @description 提供服务状态的实时监控功能
 * @returns {Object} 组合式函数返回对象
 * @returns {Object} returns.status - 服务状态对象
 * @returns {Function} returns.startMonitoring - 开始监控
 * @returns {Function} returns.stopMonitoring - 停止监控
 * @example
 * const { status, startMonitoring } = useAIStatus()
 * startMonitoring(1000) // 每秒更新一次状态
 * console.log(status.queueSize, status.activeTasks)
 */
export function useAIStatus() {
  /**
   * 服务状态
   * @type {Object}
   */
  const status = reactive({
    queueSize: 0,
    activeTasks: 0,
    maxConcurrent: 0,
    completedTasks: 0,
    metrics: {
      requestCount: 0,
      errorCount: 0,
      errorRate: 0,
      avgResponseTime: 0,
      memoryTrend: 0
    }
  })

  /**
   * 监控定时器 ID
   * @type {number|null}
   */
  let intervalId = null

  /**
   * 开始监控
   * @description 启动定时器定期更新服务状态
   * @param {number} [interval=2000] - 更新间隔（毫秒）
   */
  const startMonitoring = (interval = 2000) => {
    if (intervalId) return

    intervalId = setInterval(() => {
      const serviceStatus = aiService.getStatus()
      Object.assign(status, serviceStatus)
    }, interval)
  }

  /**
   * 停止监控
   * @description 停止定时器
   */
  const stopMonitoring = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    status,
    startMonitoring,
    stopMonitoring
  }
}

export { aiService }
