/**
 * @file 资源监控器
 * @description 监控浏览器内存和 CPU 使用情况，提供资源预警机制
 * @module services/ResourceMonitor
 */

/**
 * 资源监控器类
 * @description 定期检查系统资源使用情况，在资源紧张时触发回调警告
 * @class
 * @example
 * const monitor = new ResourceMonitor({
 *   maxMemoryUsage: 0.85,
 *   onWarning: (info) => console.warn('Resource warning:', info),
 *   onCritical: (info) => console.error('Resource critical:', info)
 * })
 * monitor.start()
 */
class ResourceMonitor {
  /**
   * 创建资源监控器实例
   * @param {Object} [options={}] - 配置选项
   * @param {number} [options.maxMemoryUsage=0.9] - 内存使用率阈值（0-1）
   * @param {number} [options.maxCpuThreshold=0.8] - CPU 使用率阈值（0-1）
   * @param {number} [options.checkInterval=5000] - 检查间隔（毫秒）
   * @param {Function} [options.onWarning] - 警告级别回调
   * @param {Function} [options.onCritical] - 严重级别回调
   */
  constructor(options = {}) {
    /**
     * 内存使用率阈值
     * @type {number}
     */
    this.maxMemoryUsage = options.maxMemoryUsage || 0.9

    /**
     * CPU 使用率阈值
     * @type {number}
     */
    this.maxCpuThreshold = options.maxCpuThreshold || 0.8

    /**
     * 检查间隔
     * @type {number}
     */
    this.checkInterval = options.checkInterval || 5000

    /**
     * 警告级别回调函数
     * @type {Function}
     */
    this.onWarning = options.onWarning || (() => {})

    /**
     * 严重级别回调函数
     * @type {Function}
     */
    this.onCritical = options.onCritical || (() => {})

    /**
     * 是否正在监控
     * @type {boolean}
     */
    this.isMonitoring = false

    /**
     * 定时器 ID
     * @type {number|null}
     */
    this.intervalId = null

    /**
     * 监控指标数据
     * @type {Object}
     */
    this.metrics = {
      memoryUsage: [],
      timestamps: [],
      requestCount: 0,
      errorCount: 0,
      avgResponseTime: 0
    }

    /**
     * 上次 CPU 检查时间
     * @type {number|null}
     */
    this.lastCpuCheck = null

    /**
     * 当前 CPU 使用率估算值
     * @type {number}
     */
    this.cpuUsage = 0
  }

  /**
   * 启动监控
   * @description 开始定期检查资源使用情况
   */
  start() {
    if (this.isMonitoring) return
    this.isMonitoring = true
    this.lastCpuCheck = performance.now()

    this.intervalId = setInterval(() => {
      this.check()
    }, this.checkInterval)

    this.check()
  }

  /**
   * 停止监控
   * @description 停止定期检查并清理定时器
   */
  stop() {
    if (!this.isMonitoring) return
    this.isMonitoring = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * 执行资源检查
   * @description 检查内存和 CPU 使用情况，根据阈值触发相应回调
   * @returns {Object} 包含内存和 CPU 信息的对象
   */
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

  /**
   * 获取内存信息
   * @description 从 performance API 获取 JavaScript 堆内存使用情况
   * @returns {Object} 内存信息对象
   */
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

  /**
   * 获取 CPU 信息
   * @description 使用 requestIdleCallback 估算 CPU 使用率
   * @returns {Object} CPU 信息对象
   */
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

  /**
   * 记录请求
   * @description 记录请求响应时间和错误状态，用于计算平均响应时间和错误率
   * @param {number} responseTime - 响应时间（毫秒）
   * @param {boolean} [isError=false] - 是否为错误响应
   */
  recordRequest(responseTime, isError = false) {
    this.metrics.requestCount++
    if (isError) {
      this.metrics.errorCount++
    }

    const alpha = 0.2
    this.metrics.avgResponseTime = alpha * responseTime + (1 - alpha) * this.metrics.avgResponseTime
  }

  /**
   * 获取监控指标
   * @description 返回当前监控数据和计算得出的统计指标
   * @returns {Object} 包含各项监控指标的对象
   */
  getMetrics() {
    return {
      ...this.metrics,
      errorRate: this.metrics.requestCount > 0
        ? this.metrics.errorCount / this.metrics.requestCount
        : 0,
      memoryTrend: this.calculateTrend(this.metrics.memoryUsage)
    }
  }

  /**
   * 计算趋势
   * @description 使用线性回归计算数据变化趋势
   * @param {Array<number>} data - 数据数组
   * @returns {number} 趋势斜率，正值表示上升趋势
   */
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

  /**
   * 重置监控数据
   * @description 清空所有累积的监控指标数据
   */
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
