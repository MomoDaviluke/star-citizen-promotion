/**
 * @file 监控调度器测试
 * @description 覆盖健康状态追踪与「谁来监控监控者」的自警机制：
 *              调度器自身故障必须可被外部发现，而不是静默死亡。
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { MonitorScheduler } from '../../src/monitoring/scheduler.js'
import { MetricsCollector } from '../../src/monitoring/collector.js'
import { AlertEngine } from '../../src/monitoring/alertEngine.js'
import { InMemoryAlertRepository } from '../../src/monitoring/alertRepository.js'
import type { CollectorDeps } from '../../src/monitoring/collector.js'

function makeDeps(): CollectorDeps {
  return {
    cpuUsage: () => ({ user: 0, system: 0 }),
    memoryUsage: () => ({ rss: 100, heapUsed: 50, heapTotal: 200, external: 5 }),
    systemMemory: () => ({ total: 8192, free: 4096 }),
    eventLoopDelay: () => ({ mean: 1_000_000, p95: 2_000_000, max: 3_000_000 }),
    getPoolStatus: () => ({
      totalConnections: 0, activeConnections: 0, idleConnections: 0, waitingRequests: 0, connectionLimit: 10
    }),
    pingRedis: async () => 1,
    cpuCount: 4
  } as CollectorDeps
}

describe('MonitorScheduler 健康追踪', () => {
  let collector: MetricsCollector
  let alertEngine: AlertEngine
  let scheduler: MonitorScheduler

  beforeEach(() => {
    collector = new MetricsCollector(makeDeps(), { capacity: 5 })
    alertEngine = new AlertEngine({ repository: new InMemoryAlertRepository() })
    scheduler = new MonitorScheduler(collector, alertEngine)
  })

  it('初始状态为未运行且无自警', () => {
    const health = scheduler.getHealth()
    expect(health.running).toBe(false)
    expect(health.tickCount).toBe(0)
    expect(health.consecutiveFailures).toBe(0)
    expect(health.selfAlert.active).toBe(false)
  })

  it('tick 成功后记录成功时间并清零连续失败', async () => {
    await scheduler.tick()
    const health = scheduler.getHealth()

    expect(health.tickCount).toBe(1)
    expect(health.lastTickAt).not.toBeNull()
    expect(health.lastSuccessAt).not.toBeNull()
    expect(health.lastError).toBeNull()
    expect(health.consecutiveFailures).toBe(0)
    expect(health.selfAlert.active).toBe(false)
  })

  it('采集器抛错时记录失败并累加连续失败数', async () => {
    const broken = new MetricsCollector(makeDeps(), { capacity: 5 })
    ;(broken as unknown as { collect: () => Promise<never> }).collect =
      async () => { throw new Error('采样爆炸') }

    const failingScheduler = new MonitorScheduler(
      broken as unknown as MetricsCollector,
      alertEngine
    )

    await failingScheduler.tick()
    await failingScheduler.tick()

    const health = failingScheduler.getHealth()
    expect(health.tickCount).toBe(2)
    expect(health.failureCount).toBe(2)
    expect(health.consecutiveFailures).toBe(2)
    expect(health.lastError).toContain('采样爆炸')
    expect(health.lastSuccessAt).toBeNull()
  })

  it('连续失败达到阈值时触发内存自警', async () => {
    const broken = new MetricsCollector(makeDeps(), { capacity: 5 })
    ;(broken as unknown as { collect: () => Promise<never> }).collect =
      async () => { throw new Error('DB down') }

    const failingScheduler = new MonitorScheduler(
      broken as unknown as MetricsCollector,
      alertEngine,
      { selfAlertThreshold: 3 }
    )

    await failingScheduler.tick()
    await failingScheduler.tick()
    expect(failingScheduler.getHealth().selfAlert.active).toBe(false)

    await failingScheduler.tick()
    const health = failingScheduler.getHealth()
    expect(health.selfAlert.active).toBe(true)
    expect(health.selfAlert.message).toContain('DB down')
    expect(health.selfAlert.since).not.toBeNull()
  })

  it('失败恢复后自警解除且连续失败归零', async () => {
    const broken = new MetricsCollector(makeDeps(), { capacity: 5 })
    const inner = broken as unknown as {
      collect: () => Promise<unknown>
      shouldFail: boolean
    }
    inner.shouldFail = true
    inner.collect = async () => {
      if (inner.shouldFail) throw new Error('抖动故障')
      return { timestamp: Date.now() } as never
    }

    const flakyScheduler = new MonitorScheduler(
      broken as unknown as MetricsCollector,
      alertEngine,
      { selfAlertThreshold: 2 }
    )

    await flakyScheduler.tick()
    await flakyScheduler.tick()
    expect(flakyScheduler.getHealth().selfAlert.active).toBe(true)

    inner.shouldFail = false
    await flakyScheduler.tick()

    const health = flakyScheduler.getHealth()
    expect(health.selfAlert.active).toBe(false)
    expect(health.consecutiveFailures).toBe(0)
    expect(health.failureCount).toBe(2)
    expect(health.tickCount).toBe(3)
  })

  it('告警评估抛错同样计入失败（仓储故障不能逃过自警）', async () => {
    const brokenRepo = {
      create: async () => { throw new Error('repo down') },
      update: async () => { throw new Error('repo down') },
      findById: async () => { throw new Error('repo down') },
      findActiveByRule: async () => { throw new Error('repo down') },
      list: async () => { throw new Error('repo down') }
    }
    const brokenEngine = new AlertEngine({ repository: brokenRepo as never })
    const failingScheduler = new MonitorScheduler(collector, brokenEngine, { selfAlertThreshold: 1 })

    await failingScheduler.tick()

    const health = failingScheduler.getHealth()
    expect(health.consecutiveFailures).toBe(1)
    expect(health.selfAlert.active).toBe(true)
  })

  it('start 后运行标记为 true，stop 后为 false', async () => {
    scheduler.start()
    expect(scheduler.getHealth().running).toBe(true)
    scheduler.stop()
    expect(scheduler.getHealth().running).toBe(false)
  })
})

describe('MonitorScheduler 数据保留清理', () => {
  let collector: MetricsCollector
  let alertEngine: AlertEngine

  beforeEach(() => {
    collector = new MetricsCollector(makeDeps(), { capacity: 5 })
    alertEngine = new AlertEngine({ repository: new InMemoryAlertRepository() })
  })

  it('到达清理间隔时按保留期调用清理', async () => {
    const purges: number[] = []
    const scheduler = new MonitorScheduler(collector, alertEngine, {
      purger: {
        purgeResolvedBefore: async (cutoff: number) => {
          purges.push(cutoff)
          return 5
        }
      },
      retentionDays: 30,
      purgeIntervalMs: 0
    })

    await scheduler.tick()
    await scheduler.tick()

    expect(purges.length).toBe(2)
    // cutoff ≈ now - 30 天，误差放宽到 2 秒
    const expected = Date.now() - 30 * 86_400_000
    expect(Math.abs(purges[1] - expected)).toBeLessThan(2000)
  })

  it('清理失败不影响采样链路也不触发自警', async () => {
    const scheduler = new MonitorScheduler(collector, alertEngine, {
      purger: {
        purgeResolvedBefore: async () => { throw new Error('purge failed') }
      },
      purgeIntervalMs: 0
    })

    await scheduler.tick()
    const health = scheduler.getHealth()

    expect(health.consecutiveFailures).toBe(0)
    expect(health.selfAlert.active).toBe(false)
    expect(health.lastPurgeError).toContain('purge failed')
    // 采样本身仍然成功
    expect(health.lastSuccessAt).not.toBeNull()
  })

  it('未配置 purger 时不执行清理', async () => {
    const scheduler = new MonitorScheduler(collector, alertEngine, { purgeIntervalMs: 0 })
    await scheduler.tick()
    expect(scheduler.getHealth().lastPurgeError).toBeNull()
  })

  it('清理结果记录在健康快照中', async () => {
    const scheduler = new MonitorScheduler(collector, alertEngine, {
      purger: { purgeResolvedBefore: async () => 7 },
      purgeIntervalMs: 0
    })
    await scheduler.tick()
    const health = scheduler.getHealth()
    expect(health.lastPurgeAt).not.toBeNull()
    expect(health.lastPurgeCount).toBe(7)
  })
})

describe('MonitorScheduler 前端回报清理', () => {
  let collector: MetricsCollector
  let alertEngine: AlertEngine

  beforeEach(() => {
    collector = new MetricsCollector(makeDeps(), { capacity: 5 })
    alertEngine = new AlertEngine({ repository: new InMemoryAlertRepository() })
  })

  it('配置 reportPurger 后按 90 天保留期清理回报', async () => {
    const reportPurges: number[] = []
    const scheduler = new MonitorScheduler(collector, alertEngine, {
      reportPurger: {
        purgeResolvedBefore: async (cutoff: number) => {
          reportPurges.push(cutoff)
          return 12
        }
      },
      purgeIntervalMs: 0
    })

    await scheduler.tick()
    const health = scheduler.getHealth()

    expect(reportPurges).toHaveLength(1)
    const expected = Date.now() - 90 * 86_400_000
    expect(Math.abs(reportPurges[0] - expected)).toBeLessThan(2000)
    expect(health.lastPurgeReportsCount).toBe(12)
    expect(health.lastPurgeReportsError).toBeNull()
  })

  it('回报清理失败只记录，不影响采样与告警清理', async () => {
    const alertPurges: number[] = []
    const scheduler = new MonitorScheduler(collector, alertEngine, {
      purger: {
        purgeResolvedBefore: async (cutoff: number) => {
          alertPurges.push(cutoff)
          return 1
        }
      },
      reportPurger: {
        purgeResolvedBefore: async () => { throw new Error('reports purge failed') }
      },
      purgeIntervalMs: 0
    })

    await scheduler.tick()
    const health = scheduler.getHealth()

    // 两类清理互不阻塞：告警清理成功、回报清理失败但记录错误
    expect(alertPurges).toHaveLength(1)
    expect(health.lastPurgeReportsError).toContain('reports purge failed')
    expect(health.consecutiveFailures).toBe(0)
    expect(health.lastSuccessAt).not.toBeNull()
  })

  it('未配置 reportPurger 时不清回报表', async () => {
    const scheduler = new MonitorScheduler(collector, alertEngine, { purgeIntervalMs: 0 })
    await scheduler.tick()
    expect(scheduler.getHealth().lastPurgeReportsCount).toBeNull()
    expect(scheduler.getHealth().lastPurgeReportsError).toBeNull()
  })
})
