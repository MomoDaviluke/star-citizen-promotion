class ResourceMonitor {
  constructor(options = {}) {
    this.maxMemoryUsage = options.maxMemoryUsage || 0.9
    this.maxCpuThreshold = options.maxCpuThreshold || 0.8
    this.checkInterval = options.checkInterval || 5000
    this.onWarning = options.onWarning || (() => {})
    this.onCritical = options.onCritical || (() => {})
    
    this.isMonitoring = false
    this.intervalId = null
    this.metrics = {
      memoryUsage: [],
      timestamps: [],
      requestCount: 0,
      errorCount: 0,
      avgResponseTime: 0
    }
    this.lastCpuCheck = null
    this.cpuUsage = 0
  }
  
  start() {
    if (this.isMonitoring) return
    this.isMonitoring = true
    this.lastCpuCheck = performance.now()
    
    this.intervalId = setInterval(() => {
      this.check()
    }, this.checkInterval)
    
    this.check()
  }
  
  stop() {
    if (!this.isMonitoring) return
    this.isMonitoring = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
  
  check() {
    const memoryInfo = this.getMemoryInfo()
    const cpuInfo = this.getCpuInfo()
    
    if (memoryInfo.usageRatio > this.maxMemoryUsage) {
      this.onCritical({
        type: 'memory',
        message: `内存使用率过高: ${(memoryInfo.usageRatio * 100).toFixed(1)}%`,
        data: memoryInfo
      })
    } else if (memoryInfo.usageRatio > this.maxMemoryUsage * 0.8) {
      this.onWarning({
        type: 'memory',
        message: `内存使用率警告: ${(memoryInfo.usageRatio * 100).toFixed(1)}%`,
        data: memoryInfo
      })
    }
    
    this.metrics.memoryUsage.push(memoryInfo.usedJSHeapSize)
    this.metrics.timestamps.push(Date.now())
    
    if (this.metrics.memoryUsage.length > 20) {
      this.metrics.memoryUsage.shift()
      this.metrics.timestamps.shift()
    }
    
    return {
      memory: memoryInfo,
      cpu: cpuInfo
    }
  }
  
  getMemoryInfo() {
    const performance = window.performance || {}
    const memory = performance.memory || {}
    
    return {
      usedJSHeapSize: memory.usedJSHeapSize || 0,
      totalJSHeapSize: memory.totalJSHeapSize || 0,
      jsHeapSizeLimit: memory.jsHeapSizeLimit || 0,
      usageRatio: memory.jsHeapSizeLimit 
        ? memory.usedJSHeapSize / memory.jsHeapSizeLimit 
        : 0
    }
  }
  
  getCpuInfo() {
    const now = performance.now()
    const cpuInfo = {
      estimated: this.cpuUsage,
      isAvailable: false
    }
    
    if ('requestIdleCallback' in window) {
      const start = performance.now()
      requestIdleCallback((deadline) => {
        const elapsed = performance.now() - start
        this.cpuUsage = 1 - (deadline.timeRemaining() / elapsed)
        cpuInfo.estimated = this.cpuUsage
        cpuInfo.isAvailable = true
      })
    }
    
    this.lastCpuCheck = now
    return cpuInfo
  }
  
  recordRequest(responseTime, isError = false) {
    this.metrics.requestCount++
    if (isError) {
      this.metrics.errorCount++
    }
    
    const alpha = 0.2
    this.metrics.avgResponseTime = alpha * responseTime + (1 - alpha) * this.metrics.avgResponseTime
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      errorRate: this.metrics.requestCount > 0 
        ? this.metrics.errorCount / this.metrics.requestCount 
        : 0,
      memoryTrend: this.calculateTrend(this.metrics.memoryUsage)
    }
  }
  
  calculateTrend(data) {
    if (data.length < 2) return 0
    const n = data.length
    const sumX = (n * (n - 1)) / 2
    const sumY = data.reduce((a, b) => a + b, 0)
    const sumXY = data.reduce((sum, y, x) => sum + x * y, 0)
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    return slope
  }
  
  reset() {
    this.metrics = {
      memoryUsage: [],
      timestamps: [],
      requestCount: 0,
      errorCount: 0,
      avgResponseTime: 0
    }
  }
}

export default ResourceMonitor
