/**
 * @file AI 服务核心模块
 * @description 提供任务队列管理、并发控制、超时处理、重试机制和资源监控的完整 AI 服务
 * @module services/AIService
 */

import { PriorityQueue, PRIORITY } from './PriorityQueue.js'
import ResourceMonitor from './ResourceMonitor.js'

/**
 * 默认服务配置
 * @type {Object}
 */
const DEFAULT_CONFIG = {
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  maxConcurrent: 3,
  queueTimeout: 60000,
  enableMonitoring: true
}

/**
 * 任务状态常量
 * @description 定义任务生命周期中的各种状态
 * @type {Object}
 * @property {string} PENDING - 等待执行
 * @property {string} RUNNING - 正在执行
 * @property {string} COMPLETED - 执行完成
 * @property {string} FAILED - 执行失败
 * @property {string} TIMEOUT - 执行超时
 * @property {string} CANCELLED - 已取消
 */
const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled'
}

/**
 * AI 服务类
 * @description 管理异步任务队列，支持优先级调度、并发控制、超时重试和资源监控
 * @class
 * @example
 * const service = new AIService({ maxConcurrent: 5 })
 *
 * const result = await service.submit(async (context) => {
 *   const { signal, taskId } = context
 *   // 执行异步任务...
 *   return result
 * }, { priority: PRIORITY.HIGH })
 */
class AIService {
  /**
   * 创建 AI 服务实例
   * @param {Object} [config={}] - 服务配置
   * @param {number} [config.timeout=30000] - 任务超时时间（毫秒）
   * @param {number} [config.maxRetries=3] - 最大重试次数
   * @param {number} [config.retryDelay=1000] - 重试延迟基数（毫秒）
   * @param {number} [config.maxConcurrent=3] - 最大并发任务数
   * @param {number} [config.queueTimeout=60000] - 队列等待超时（毫秒）
   * @param {boolean} [config.enableMonitoring=true] - 是否启用资源监控
   */
  constructor(config = {}) {
    /**
     * 合并后的配置对象
     * @type {Object}
     */
    this.config = { ...DEFAULT_CONFIG, ...config }

    /**
     * 优先级任务队列
     * @type {PriorityQueue}
     */
    this.queue = new PriorityQueue()

    /**
     * 正在执行的任务映射表
     * @type {Map<string, Object>}
     */
    this.runningTasks = new Map()

    /**
     * 已完成任务映射表
     * @type {Map<string, Object>}
     */
    this.completedTasks = new Map()

    /**
     * 当前活跃任务数
     * @type {number}
     */
    this.activeCount = 0

    /**
     * 是否正在处理队列
     * @type {boolean}
     */
    this.isProcessing = false

    /**
     * 任务 AbortController 映射表
     * @type {Map<string, AbortController>}
     */
    this.abortControllers = new Map()

    /**
     * 资源监控器实例
     * @type {ResourceMonitor}
     */
    this.monitor = new ResourceMonitor({
      maxMemoryUsage: 0.85,
      onWarning: (info) => this.handleResourceWarning(info),
      onCritical: (info) => this.handleResourceCritical(info)
    })

    if (this.config.enableMonitoring) {
      this.monitor.start()
    }
  }

  /**
   * 提交任务到队列
   * @description 将任务函数加入优先级队列，返回 Promise 等待执行结果
   * @param {Function} taskFn - 任务函数，接收包含 signal 和 taskId 的上下文对象
   * @param {Object} [options={}] - 任务选项
   * @param {number} [options.priority] - 任务优先级
   * @param {number} [options.timeout] - 任务超时时间
   * @param {number} [options.retries] - 重试次数
   * @param {number} [options.retryDelay] - 重试延迟
   * @param {AbortSignal} [options.signal] - 外部中止信号
   * @returns {Promise} 任务执行结果的 Promise
   */
  async submit(taskFn, options = {}) {
    const taskId = this.generateTaskId()
    const task = {
      id: taskId,
      fn: taskFn,
      priority: options.priority ?? PRIORITY.NORMAL,
      timeout: options.timeout ?? this.config.timeout,
      retries: options.retries ?? this.config.maxRetries,
      retryDelay: options.retryDelay ?? this.config.retryDelay,
      signal: options.signal,
      status: TASK_STATUS.PENDING,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      result: null,
      error: null,
      attempts: 0
    }

    return new Promise((resolve, reject) => {
      task.resolve = resolve
      task.reject = reject

      if (options.signal?.aborted) {
        task.status = TASK_STATUS.CANCELLED
        reject(new DOMException('Task cancelled', 'AbortError'))
        return
      }

      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          this.cancelTask(taskId)
          reject(new DOMException('Task cancelled', 'AbortError'))
        })
      }

      this.queue.enqueue(task, task.priority)
      this.processQueue()
    })
  }

  /**
   * 处理任务队列
   * @description 从队列中取出任务并执行，控制并发数量
   */
  async processQueue() {
    if (this.isProcessing || this.activeCount >= this.config.maxConcurrent) {
      return
    }

    this.isProcessing = true

    while (!this.queue.isEmpty() && this.activeCount < this.config.maxConcurrent) {
      const node = this.queue.dequeue()
      if (!node) break

      const task = node.item

      if (Date.now() - task.createdAt > this.config.queueTimeout) {
        task.status = TASK_STATUS.TIMEOUT
        task.error = new Error('Task queue timeout')
        task.reject(task.error)
        continue
      }

      this.executeTask(task)
    }

    this.isProcessing = false
  }

  /**
   * 执行单个任务
   * @description 执行任务函数，处理超时、成功和失败情况
   * @param {Object} task - 任务对象
   */
  async executeTask(task) {
    this.activeCount++
    task.status = TASK_STATUS.RUNNING
    task.startedAt = Date.now()
    this.runningTasks.set(task.id, task)

    const abortController = new AbortController()
    this.abortControllers.set(task.id, abortController)

    const timeoutId = setTimeout(() => {
      this.handleTimeout(task.id)
    }, task.timeout)

    try {
      const startTime = performance.now()
      const result = await task.fn({
        signal: abortController.signal,
        taskId: task.id
      })

      clearTimeout(timeoutId)
      const responseTime = performance.now() - startTime

      task.status = TASK_STATUS.COMPLETED
      task.completedAt = Date.now()
      task.result = result

      this.monitor.recordRequest(responseTime, false)
      this.runningTasks.delete(task.id)
      this.abortControllers.delete(task.id)
      this.completedTasks.set(task.id, task)
      this.cleanupCompletedTasks()

      task.resolve(result)
    } catch (error) {
      clearTimeout(timeoutId)
      await this.handleTaskError(task, error)
    } finally {
      this.activeCount--
      this.processQueue()
    }
  }

  /**
   * 处理任务错误
   * @description 根据错误类型决定重试或标记失败
   * @param {Object} task - 任务对象
   * @param {Error} error - 错误对象
   */
  async handleTaskError(task, error) {
    task.attempts++

    if (error.name === 'AbortError') {
      task.status = TASK_STATUS.CANCELLED
      this.runningTasks.delete(task.id)
      this.abortControllers.delete(task.id)
      task.reject(error)
      return
    }

    if (task.attempts < task.retries) {
      const delay = task.retryDelay * Math.pow(2, task.attempts - 1)

      await new Promise(resolve => setTimeout(resolve, delay))

      if (task.status === TASK_STATUS.CANCELLED) {
        return
      }

      this.runningTasks.delete(task.id)
      this.queue.enqueue(task, task.priority)
      this.processQueue()
      return
    }

    task.status = TASK_STATUS.FAILED
    task.completedAt = Date.now()
    task.error = error

    this.monitor.recordRequest(0, true)
    this.runningTasks.delete(task.id)
    this.abortControllers.delete(task.id)
    this.completedTasks.set(task.id, task)

    task.reject(error)
  }

  /**
   * 处理任务超时
   * @description 中止超时任务并更新状态
   * @param {string} taskId - 任务 ID
   */
  handleTimeout(taskId) {
    const task = this.runningTasks.get(taskId)
    if (!task || task.status !== TASK_STATUS.RUNNING) return

    const controller = this.abortControllers.get(taskId)
    if (controller) {
      controller.abort()
    }

    task.status = TASK_STATUS.TIMEOUT
    task.error = new Error(`Task ${taskId} timed out after ${task.timeout}ms`)
    task.completedAt = Date.now()

    this.runningTasks.delete(taskId)
    this.abortControllers.delete(taskId)
    this.completedTasks.set(taskId, task)
    this.activeCount--

    task.reject(task.error)
    this.processQueue()
  }

  /**
   * 取消指定任务
   * @description 中止正在执行或等待中的任务
   * @param {string} taskId - 任务 ID
   * @returns {boolean} 是否成功取消
   */
  cancelTask(taskId) {
    const controller = this.abortControllers.get(taskId)
    if (controller) {
      controller.abort()
    }

    const runningTask = this.runningTasks.get(taskId)
    if (runningTask) {
      runningTask.status = TASK_STATUS.CANCELLED
      this.runningTasks.delete(taskId)
      this.abortControllers.delete(taskId)
      this.activeCount--
      return true
    }

    this.queue.remove(item => item.id === taskId)
    return false
  }

  /**
   * 取消所有任务
   * @description 中止所有正在执行和等待中的任务
   */
  cancelAll() {
    for (const [taskId] of this.abortControllers) {
      this.cancelTask(taskId)
    }
    this.queue.clear()
  }

  /**
   * 处理资源警告
   * @description 当资源使用接近阈值时，取消低优先级任务
   * @param {Object} info - 警告信息对象
   */
  handleResourceWarning(info) {
    console.warn('[AIService] Resource warning:', info.message)

    if (this.activeCount > 1) {
      const lowPriorityTasks = Array.from(this.runningTasks.values())
        .filter(t => t.priority < PRIORITY.HIGH)

      if (lowPriorityTasks.length > 0) {
        this.cancelTask(lowPriorityTasks[0].id)
      }
    }
  }

  /**
   * 处理资源严重警告
   * @description 当资源使用超过阈值时，取消所有非关键任务
   * @param {Object} info - 严重警告信息对象
   */
  handleResourceCritical(info) {
    console.error('[AIService] Resource critical:', info.message)

    const criticalTasks = Array.from(this.runningTasks.values())
      .filter(t => t.priority < PRIORITY.CRITICAL)

    criticalTasks.forEach(task => this.cancelTask(task.id))
  }

  /**
   * 生成任务 ID
   * @description 生成唯一的任务标识符
   * @returns {string} 任务 ID
   */
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 清理已完成任务
   * @description 限制已完成任务缓存大小，防止内存泄漏
   */
  cleanupCompletedTasks() {
    const maxCompleted = 100
    if (this.completedTasks.size > maxCompleted) {
      const entries = Array.from(this.completedTasks.entries())
      const toRemove = entries.slice(0, this.completedTasks.size - maxCompleted)
      toRemove.forEach(([id]) => this.completedTasks.delete(id))
    }
  }

  /**
   * 获取服务状态
   * @description 返回当前队列、任务和监控指标状态
   * @returns {Object} 服务状态对象
   */
  getStatus() {
    return {
      queueSize: this.queue.size(),
      activeTasks: this.activeCount,
      maxConcurrent: this.config.maxConcurrent,
      completedTasks: this.completedTasks.size,
      metrics: this.monitor.getMetrics()
    }
  }

  /**
   * 销毁服务实例
   * @description 取消所有任务并停止监控
   */
  destroy() {
    this.cancelAll()
    this.monitor.stop()
    this.runningTasks.clear()
    this.completedTasks.clear()
  }
}

/**
 * 默认 AI 服务实例
 * @description 提供全局共享的服务实例
 * @type {AIService}
 */
const aiService = new AIService()

export { AIService, TASK_STATUS, PRIORITY, aiService }
export default AIService
