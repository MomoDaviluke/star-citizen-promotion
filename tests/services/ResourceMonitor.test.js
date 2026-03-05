/**
 * @file 资源监控测试
 * @description 测试 ResourceMonitor 功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ResourceMonitor from '@/services/ResourceMonitor.js'

const mockRequestIdleCallback = vi.fn((cb) => {
  cb({ timeRemaining: () => 50 })
  return 1
})

vi.stubGlobal('window', {
  performance: {
    now: () => Date.now(),
    memory: {
      usedJSHeapSize: 50000000,
      totalJSHeapSize: 100000000,
      jsHeapSizeLimit: 200000000
    }
  },
  requestIdleCallback: mockRequestIdleCallback
})

describe('ResourceMonitor', () => {
  let monitor

  beforeEach(() => {
    vi.useFakeTimers()
    mockRequestIdleCallback.mockClear()
  })

  afterEach(() => {
    if (monitor) {
      monitor.stop()
    }
    vi.useRealTimers()
  })

  describe('构造函数', () => {
    it('应使用默认配置创建实例', () => {
      monitor = new ResourceMonitor()
      expect(monitor.maxMemoryUsage).toBe(0.9)
      expect(monitor.checkInterval).toBe(5000)
    })

    it('应合并自定义配置', () => {
      monitor = new ResourceMonitor({
        maxMemoryUsage: 0.85,
        checkInterval: 10000
      })
      expect(monitor.maxMemoryUsage).toBe(0.85)
      expect(monitor.checkInterval).toBe(10000)
    })

    it('应设置回调函数', () => {
      const onWarning = vi.fn()
      const onCritical = vi.fn()

      monitor = new ResourceMonitor({
        onWarning,
        onCritical
      })

      expect(monitor.onWarning).toBe(onWarning)
      expect(monitor.onCritical).toBe(onCritical)
    })
  })

  describe('start/stop', () => {
    it('start 应开始监控', () => {
      monitor = new ResourceMonitor({ checkInterval: 1000 })
      monitor.start()

      expect(monitor.isMonitoring).toBe(true)
      expect(monitor.intervalId).not.toBeNull()
    })

    it('stop 应停止监控', () => {
      monitor = new ResourceMonitor({ checkInterval: 1000 })
      monitor.start()
      monitor.stop()

      expect(monitor.isMonitoring).toBe(false)
      expect(monitor.intervalId).toBeNull()
    })

    it('重复 start 不应创建多个定时器', () => {
      monitor = new ResourceMonitor({ checkInterval: 1000 })
      monitor.start()
      const firstIntervalId = monitor.intervalId
      monitor.start()

      expect(monitor.intervalId).toBe(firstIntervalId)
    })
  })

  describe('recordRequest', () => {
    it('应记录请求数据', () => {
      monitor = new ResourceMonitor()

      monitor.recordRequest(100, false)
      monitor.recordRequest(200, false)
      monitor.recordRequest(0, true)

      const metrics = monitor.getMetrics()
      expect(metrics.requestCount).toBe(3)
      expect(metrics.errorCount).toBe(1)
    })

    it('应使用指数移动平均计算响应时间', () => {
      monitor = new ResourceMonitor()

      monitor.recordRequest(100, false)
      monitor.recordRequest(200, false)
      monitor.recordRequest(300, false)

      const metrics = monitor.getMetrics()
      expect(metrics.avgResponseTime).toBeGreaterThan(0)
      expect(metrics.avgResponseTime).toBeLessThan(300)
    })

    it('应计算错误率', () => {
      monitor = new ResourceMonitor()

      monitor.recordRequest(100, false)
      monitor.recordRequest(100, false)
      monitor.recordRequest(0, true)

      const metrics = monitor.getMetrics()
      expect(metrics.errorRate).toBeCloseTo(0.333, 2)
    })
  })

  describe('getMetrics', () => {
    it('应返回完整的指标对象', () => {
      monitor = new ResourceMonitor()

      monitor.recordRequest(100, false)

      const metrics = monitor.getMetrics()
      expect(metrics).toHaveProperty('requestCount')
      expect(metrics).toHaveProperty('errorCount')
      expect(metrics).toHaveProperty('errorRate')
      expect(metrics).toHaveProperty('avgResponseTime')
      expect(metrics).toHaveProperty('memoryTrend')
    })
  })

  describe('check', () => {
    it('应返回内存和 CPU 信息', () => {
      monitor = new ResourceMonitor({
        maxMemoryUsage: 0.85
      })

      const result = monitor.check()

      expect(result).toHaveProperty('memory')
      expect(result).toHaveProperty('cpu')
    })
  })

  describe('reset', () => {
    it('应重置所有指标', () => {
      monitor = new ResourceMonitor()

      monitor.recordRequest(100, false)
      monitor.recordRequest(0, true)
      monitor.reset()

      const metrics = monitor.getMetrics()
      expect(metrics.requestCount).toBe(0)
      expect(metrics.errorCount).toBe(0)
      expect(metrics.errorRate).toBe(0)
      expect(metrics.avgResponseTime).toBe(0)
    })
  })

  describe('calculateTrend', () => {
    it('应计算数据趋势', () => {
      monitor = new ResourceMonitor()

      const trend = monitor.calculateTrend([1, 2, 3, 4, 5])
      expect(trend).toBeGreaterThan(0)
    })

    it('数据不足时应返回 0', () => {
      monitor = new ResourceMonitor()

      expect(monitor.calculateTrend([1])).toBe(0)
      expect(monitor.calculateTrend([])).toBe(0)
    })
  })
})
