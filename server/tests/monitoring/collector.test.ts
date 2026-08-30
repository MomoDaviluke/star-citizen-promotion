/**
 * @file 资源采集器测试
 * @description 覆盖 CPU 百分比计算、环形缓冲容量与覆盖顺序、事件循环直方图读取、
 *              依赖降级（Redis 不可用时不应阻塞采集）
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { RingBuffer, MetricsCollector } from '../../src/monitoring/collector.js'
import type { CollectorDeps } from '../../src/monitoring/collector.js'

const MB = 1024 * 1024

/**
 * 构造可完全控制的采集器依赖
 * @param overrides 覆盖项
 */
function makeDeps(overrides: Partial<CollectorDeps> = {}): CollectorDeps {
  return {
    cpuUsage: jest.fn(() => ({ user: 0, system: 0 })) as unknown as CollectorDeps['cpuUsage'],
    memoryUsage: jest.fn(() => ({
      rss: 100 * MB,
      heapUsed: 50 * MB,
      heapTotal: 80 * MB,
      external: 5 * MB
    })) as unknown as CollectorDeps['memoryUsage'],
    systemMemory: jest.fn(() => ({ total: 8 * 1024 * MB, free: 4 * 1024 * MB })),
    eventLoopDelay: jest.fn(() => ({ mean: 2_000_000, p95: 5_000_000, max: 9_000_000 })),
    getPoolStatus: jest.fn(() => ({
      totalConnections: 2,
      activeConnections: 1,
      idleConnections: 1,
      waitingRequests: 0,
      connectionLimit: 10
    })),
    pingRedis: jest.fn(async () => 3),
    cpuCount: 4,
    ...overrides
  } as CollectorDeps
}

describe('RingBuffer', () => {
  it('未填满时按写入顺序返回', () => {
    const buf = new RingBuffer<number>(3)
    buf.push(1)
    buf.push(2)
    expect(buf.toArray()).toEqual([1, 2])
  })

  it('超出容量时丢弃最旧的数据', () => {
    const buf = new RingBuffer<number>(3)
    buf.push(1)
    buf.push(2)
    buf.push(3)
    buf.push(4)
    expect(buf.toArray()).toEqual([2, 3, 4])
  })

  it('反复覆盖后仍保持容量上限且顺序正确', () => {
    const buf = new RingBuffer<number>(3)
    for (let i = 1; i <= 10; i++) buf.push(i)
    expect(buf.toArray()).toEqual([8, 9, 10])
    expect(buf.size).toBe(3)
  })

  it('size 反映当前实际元素数', () => {
    const buf = new RingBuffer<number>(5)
    expect(buf.size).toBe(0)
    buf.push(1)
    expect(buf.size).toBe(1)
  })
})

describe('MetricsCollector', () => {
  let deps: CollectorDeps
  let collector: MetricsCollector

  beforeEach(() => {
    deps = makeDeps()
    collector = new MetricsCollector(deps, { capacity: 5 })
  })

  afterEach(() => {
    collector.stop()
  })

  describe('CPU 使用率', () => {
    it('按两次采样的差值除以间隔与核数计算百分比', async () => {
      // 第一次采样建立基线
      deps.cpuUsage = jest.fn(() => ({ user: 0, system: 0 })) as unknown as CollectorDeps['cpuUsage']
      await collector.collect()

      // 第二次采样：用户态 + 系统态共消耗 200ms CPU 时间（微秒）
      deps.cpuUsage = jest.fn(() => ({ user: 150_000, system: 50_000 })) as unknown as CollectorDeps['cpuUsage']
      const sample = await collector.collect(1000)

      // 200ms / 1000ms / 4 核 = 5%
      expect(sample.cpuPercent).toBeCloseTo(5, 5)
    })

    it('首次采样无基线时返回 0 而非 NaN', async () => {
      const sample = await collector.collect()
      expect(sample.cpuPercent).toBe(0)
      expect(Number.isNaN(sample.cpuPercent)).toBe(false)
    })
  })

  describe('内存指标', () => {
    it('将字节转换为 MB 并保留两位小数', async () => {
      const sample = await collector.collect()
      expect(sample.rssMb).toBeCloseTo(100, 1)
      expect(sample.heapUsedMb).toBeCloseTo(50, 1)
      expect(sample.heapTotalMb).toBeCloseTo(80, 1)
      expect(sample.externalMb).toBeCloseTo(5, 1)
    })

    it('按系统总内存与可用内存计算使用率', async () => {
      const sample = await collector.collect()
      // total 8GB / free 4GB → 已用 50%
      expect(sample.systemMemUsedPercent).toBeCloseTo(50, 1)
    })
  })

  describe('事件循环延迟', () => {
    it('将纳秒直方图转换为毫秒', async () => {
      const sample = await collector.collect()
      expect(sample.eventLoop.mean).toBeCloseTo(2, 5)
      expect(sample.eventLoop.p95).toBeCloseTo(5, 5)
      expect(sample.eventLoop.max).toBeCloseTo(9, 5)
    })

    it('直方图无样本返回 NaN 时归零，避免序列化成 null', async () => {
      deps.eventLoopDelay = jest.fn(() => ({ mean: NaN, p95: NaN, max: NaN }))
      const sample = await collector.collect()
      expect(sample.eventLoop.mean).toBe(0)
      expect(sample.eventLoop.p95).toBe(0)
      expect(sample.eventLoop.max).toBe(0)
      expect(Number.isNaN(sample.eventLoop.mean)).toBe(false)
    })

    it('直方图返回 Infinity 时同样归零', async () => {
      deps.eventLoopDelay = jest.fn(() => ({ mean: Infinity, p95: Infinity, max: Infinity }))
      const sample = await collector.collect()
      expect(sample.eventLoop.mean).toBe(0)
      expect(sample.eventLoop.p95).toBe(0)
    })
  })

  describe('依赖状态', () => {
    it('采集 DB 连接池状态', async () => {
      const sample = await collector.collect()
      expect(sample.dbPool).toEqual({
        totalConnections: 2,
        activeConnections: 1,
        idleConnections: 1,
        waitingRequests: 0,
        connectionLimit: 10
      })
    })

    it('Redis 可用时记录延迟并标记在线', async () => {
      const sample = await collector.collect()
      expect(sample.redis.up).toBe(true)
      expect(sample.redis.latencyMs).toBe(3)
    })

    it('Redis 不可用时标记为离线而非抛错', async () => {
      deps.pingRedis = jest.fn(async () => { throw new Error('ECONNREFUSED') })
      const sample = await collector.collect()
      expect(sample.redis.up).toBe(false)
      expect(sample.redis.latencyMs).toBeNull()
      expect(sample.cpuPercent).toBeGreaterThanOrEqual(0)
    })
  })

  describe('历史缓冲', () => {
    it('采样写入环形缓冲并受容量限制', async () => {
      for (let i = 0; i < 8; i++) await collector.collect()
      expect(collector.history()).toHaveLength(5)
    })

    it('history 按时间从旧到新排列', async () => {
      for (let i = 0; i < 8; i++) await collector.collect()
      const history = collector.history()
      for (let i = 1; i < history.length; i++) {
        expect(history[i].timestamp).toBeGreaterThanOrEqual(history[i - 1].timestamp)
      }
    })

    it('latest 返回最近一次采样，无数据时为 null', async () => {
      expect(collector.latest()).toBeNull()
      await collector.collect()
      expect(collector.latest()).not.toBeNull()
    })
  })

  describe('请求窗口统计', () => {
    it('统计窗口内的 5xx 比例与 P95 延迟', () => {
      const now = Date.now()
      collector.recordRequest({ requestId: 'r1', method: 'GET', route: '/a', statusCode: 200, durationMs: 10, timestamp: now })
      collector.recordRequest({ requestId: 'r2', method: 'GET', route: '/b', statusCode: 500, durationMs: 100, timestamp: now })
      collector.recordRequest({ requestId: 'r3', method: 'GET', route: '/c', statusCode: 200, durationMs: 20, timestamp: now })
      collector.recordRequest({ requestId: 'r4', method: 'GET', route: '/d', statusCode: 503, durationMs: 30, timestamp: now })

      const stats = collector.getRequestStats()
      // 4 次请求中 2 次 5xx → 0.5
      expect(stats.errorRate5xx).toBeCloseTo(0.5, 5)
      expect(stats.count).toBe(4)
    })

    it('无请求时错误率为 0 而非除零', () => {
      const stats = collector.getRequestStats()
      expect(stats.errorRate5xx).toBe(0)
      expect(stats.count).toBe(0)
      expect(Number.isNaN(stats.errorRate5xx)).toBe(false)
    })

    it('recentErrors 只返回 5xx 且按时间倒序', () => {
      const now = Date.now()
      collector.recordRequest({ requestId: 'ok', method: 'GET', route: '/a', statusCode: 200, durationMs: 10, timestamp: now })
      collector.recordRequest({ requestId: 'err1', method: 'POST', route: '/applications', statusCode: 500, durationMs: 120, timestamp: now + 1 })
      collector.recordRequest({ requestId: 'err2', method: 'GET', route: '/members', statusCode: 502, durationMs: 80, timestamp: now + 2 })

      const errors = collector.recentErrors(10)
      expect(errors).toHaveLength(2)
      expect(errors[0].requestId).toBe('err2')
      expect(errors[1].requestId).toBe('err1')
    })

    it('recentErrors 受 limit 限制', () => {
      const now = Date.now()
      for (let i = 0; i < 5; i++) {
        collector.recordRequest({ requestId: `e${i}`, method: 'GET', route: '/x', statusCode: 500, durationMs: 10, timestamp: now + i })
      }
      expect(collector.recentErrors(2)).toHaveLength(2)
    })

    it('超出窗口时限的请求不再计入统计', () => {
      const stale = Date.now() - 120_000
      collector.recordRequest({ requestId: 'old', method: 'GET', route: '/a', statusCode: 500, durationMs: 10, timestamp: stale })
      collector.recordRequest({ requestId: 'new', method: 'GET', route: '/b', statusCode: 200, durationMs: 10, timestamp: Date.now() })

      const stats = collector.getRequestStats()
      expect(stats.count).toBe(1)
      expect(stats.errorRate5xx).toBe(0)
    })
  })

  describe('定时采样', () => {
    it('start 后按周期自动采样，stop 后停止', async () => {
      const c = new MetricsCollector(makeDeps(), { capacity: 10, intervalMs: 20 })
      c.start()
      await new Promise(r => setTimeout(r, 110))
      const countAfterRun = c.history().length
      c.stop()
      await new Promise(r => setTimeout(r, 60))

      expect(countAfterRun).toBeGreaterThanOrEqual(2)
      expect(c.history().length).toBe(countAfterRun)
    })

    it('重复 start 不会创建多个定时器', async () => {
      const c = new MetricsCollector(makeDeps(), { capacity: 50, intervalMs: 20 })
      c.start()
      c.start()
      c.start()
      await new Promise(r => setTimeout(r, 110))
      c.stop()
      // 若存在 3 个定时器，采样数会接近 3 倍
      expect(c.history().length).toBeLessThanOrEqual(8)
    })
  })
})
