import { ref, reactive, onUnmounted } from 'vue'
import { aiService, PRIORITY, TASK_STATUS } from '../services/AIService.js'

export function useAI() {
  const isLoading = ref(false)
  const error = ref(null)
  const result = ref(null)
  const progress = ref(0)
  const currentTaskId = ref(null)
  
  const status = reactive({
    queueSize: 0,
    activeTasks: 0,
    completedTasks: 0
  })
  
  let abortController = null
  
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
  
  const cancel = () => {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    isLoading.value = false
  }
  
  const updateStatus = () => {
    const serviceStatus = aiService.getStatus()
    status.queueSize = serviceStatus.queueSize
    status.activeTasks = serviceStatus.activeTasks
    status.completedTasks = serviceStatus.completedTasks
  }
  
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

export function useAIStatus() {
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
  
  let intervalId = null
  
  const startMonitoring = (interval = 2000) => {
    if (intervalId) return
    
    intervalId = setInterval(() => {
      const serviceStatus = aiService.getStatus()
      Object.assign(status, serviceStatus)
    }, interval)
  }
  
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
