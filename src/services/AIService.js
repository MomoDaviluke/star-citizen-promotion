import { PriorityQueue, PRIORITY } from './PriorityQueue.js'
import ResourceMonitor from './ResourceMonitor.js'

const DEFAULT_CONFIG = {
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  maxConcurrent: 3,
  queueTimeout: 60000,
  enableMonitoring: true
}

const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled'
}

class AIService {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.queue = new PriorityQueue()
    this.runningTasks = new Map()
    this.completedTasks = new Map()
    this.activeCount = 0
    this.isProcessing = false
    this.abortControllers = new Map()
    
    this.monitor = new ResourceMonitor({
      maxMemoryUsage: 0.85,
      onWarning: (info) => this.handleResourceWarning(info),
      onCritical: (info) => this.handleResourceCritical(info)
    })
    
    if (this.config.enableMonitoring) {
      this.monitor.start()
    }
  }
  
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
  
  cancelAll() {
    for (const [taskId] of this.abortControllers) {
      this.cancelTask(taskId)
    }
    this.queue.clear()
  }
  
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
  
  handleResourceCritical(info) {
    console.error('[AIService] Resource critical:', info.message)
    
    const criticalTasks = Array.from(this.runningTasks.values())
      .filter(t => t.priority < PRIORITY.CRITICAL)
    
    criticalTasks.forEach(task => this.cancelTask(task.id))
  }
  
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  cleanupCompletedTasks() {
    const maxCompleted = 100
    if (this.completedTasks.size > maxCompleted) {
      const entries = Array.from(this.completedTasks.entries())
      const toRemove = entries.slice(0, this.completedTasks.size - maxCompleted)
      toRemove.forEach(([id]) => this.completedTasks.delete(id))
    }
  }
  
  getStatus() {
    return {
      queueSize: this.queue.size(),
      activeTasks: this.activeCount,
      maxConcurrent: this.config.maxConcurrent,
      completedTasks: this.completedTasks.size,
      metrics: this.monitor.getMetrics()
    }
  }
  
  destroy() {
    this.cancelAll()
    this.monitor.stop()
    this.runningTasks.clear()
    this.completedTasks.clear()
  }
}

const aiService = new AIService()

export { AIService, TASK_STATUS, PRIORITY, aiService }
export default AIService
