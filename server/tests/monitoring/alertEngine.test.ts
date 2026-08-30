/**
 * @file 告警引擎测试
 * @description 覆盖分级阈值判定、连续点数要求、冷却去重、回落自动恢复、
 *              管理员认领状态流转与上下文快照内容
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { AlertEngine, DEFAULT_RULES, resolveRules } from '../../src/monitoring/alertEngine.js'
import { InMemoryAlertRepository } from '../../src/monitoring/alertRepository.js'
import { NullNotifier, type Notifier } from '../../src/monitoring/notifier.js'
import type { MetricSample } from '../../src/monitoring/collector.js'

/**
 * 构造一份基线采样（各指标均在健康区间）
 */
function healthy(overrides: Partial<MetricSample> = {}): MetricSample {
  return {
    timestamp: Date.now(),
    cpuPercent: 10,
    rssMb: 200,
    heapUsedMb: 50,
    heapTotalMb: 200,
    externalMb: 5,
    systemMemTotalMb: 16384,
    systemMemUsedPercent: 40,
    rssPercent: 1,
    eventLoop: { mean: 2, p95: 5, max: 9 },
    dbPool: { totalConnections: 2, activeConnections: 1, idleConnections: 1, waitingRequests: 0, connectionLimit: 10 },
    redis: { up: true, latencyMs: 3 },
    requests: { count: 100, errorRate5xx: 0, p95LatencyMs: 80, rpm: 100 },
    ...overrides
  }
}

describe('AlertEngine 阈值判定', () => {
  let repo: InMemoryAlertRepository
  let engine: AlertEngine

  beforeEach(() => {
    repo = new InMemoryAlertRepository()
    engine = new AlertEngine({ repository: repo, cooldownMs: 300_000 })
  })

  it('首次越过 warn 阈值不触发（需连续 2 个点）', async () => {
    await engine.evaluate(healthy({ cpuPercent: 75 }))
    expect(await repo.list({})).toHaveLength(0)
  })

  it('连续 2 个点越过 warn 阈值触发 warn 告警', async () => {
    await engine.evaluate(healthy({ cpuPercent: 75 }))
    const alerts = await engine.evaluate(healthy({ cpuPercent: 80 }))

    expect(alerts).toHaveLength(1)
    expect(alerts[0].rule).toBe('cpu_percent')
    expect(alerts[0].severity).toBe('warn')
    expect(alerts[0].threshold).toBe(70)
  })

  it('越过 critical 阈值触发 critical 告警', async () => {
    await engine.evaluate(healthy({ cpuPercent: 95 }))
    const alerts = await engine.evaluate(healthy({ cpuPercent: 96 }))

    expect(alerts[0].severity).toBe('critical')
    expect(alerts[0].threshold).toBe(90)
  })

  it('越阈值后回落再越阈值要重新累计连续点数', async () => {
    await engine.evaluate(healthy({ cpuPercent: 75 }))
    await engine.evaluate(healthy({ cpuPercent: 10 }))
    const alerts = await engine.evaluate(healthy({ cpuPercent: 80 }))

    expect(alerts).toHaveLength(0)
  })

  it('事件循环延迟单次越阈值即触发（无需连续点数）', async () => {
    const alerts = await engine.evaluate(healthy({ eventLoop: { mean: 10, p95: 150, max: 300 } }))
    expect(alerts).toHaveLength(1)
    expect(alerts[0].rule).toBe('event_loop_p95_ms')
    expect(alerts[0].severity).toBe('warn')
  })

  it('5xx 错误率单次越阈值即触发', async () => {
    const alerts = await engine.evaluate(healthy({
      requests: { count: 100, errorRate5xx: 0.2, p95LatencyMs: 90, rpm: 100 }
    }))
    expect(alerts[0].rule).toBe('error_rate_5xx')
    expect(alerts[0].severity).toBe('critical')
  })

  it('进程内存占系统比例越 warn 阈值触发', async () => {
    await engine.evaluate(healthy({ rssPercent: 72 }))
    const alerts = await engine.evaluate(healthy({ rssPercent: 75 }))

    expect(alerts[0].rule).toBe('rss_percent')
    expect(alerts[0].severity).toBe('warn')
    expect(alerts[0].metricValue).toBeCloseTo(75, 1)
  })

  it('进程内存占系统比例越 critical 阈值升级', async () => {
    await engine.evaluate(healthy({ rssPercent: 80 }))
    const alerts = await engine.evaluate(healthy({ rssPercent: 88 }))

    expect(alerts[0].severity).toBe('critical')
    expect(alerts[0].threshold).toBe(85)
  })

  it('V8 常态堆占用不应触发内存告警', async () => {
    // 堆占用 96% 是 V8 的正常表现，不应据此告警；RSS 占比仍在安全线内
    await engine.evaluate(healthy({ heapUsedMb: 192, heapTotalMb: 200, rssPercent: 1 }))
    const alerts = await engine.evaluate(healthy({ heapUsedMb: 192, heapTotalMb: 200, rssPercent: 1 }))

    expect(alerts).toHaveLength(0)
  })

  it('DB 连接池等待数连续 2 点越阈值触发', async () => {
    const waiting = (n: number) => healthy({
      dbPool: { totalConnections: 10, activeConnections: 10, idleConnections: 0, waitingRequests: n, connectionLimit: 10 }
    })
    await engine.evaluate(waiting(4))
    const alerts = await engine.evaluate(waiting(5))

    expect(alerts[0].rule).toBe('db_pool_waiting')
    expect(alerts[0].severity).toBe('warn')
  })

  it('Redis 连续 2 次心跳失败触发 critical', async () => {
    await engine.evaluate(healthy({ redis: { up: false, latencyMs: null } }))
    const alerts = await engine.evaluate(healthy({ redis: { up: false, latencyMs: null } }))

    expect(alerts[0].rule).toBe('redis_down')
    expect(alerts[0].severity).toBe('critical')
  })

  it('Redis 单次失败不触发', async () => {
    const alerts = await engine.evaluate(healthy({ redis: { up: false, latencyMs: null } }))
    expect(alerts).toHaveLength(0)
  })

  it('全部指标健康时不产生任何告警', async () => {
    const alerts = await engine.evaluate(healthy())
    expect(alerts).toHaveLength(0)
    expect(await repo.list({})).toHaveLength(0)
  })
})

describe('AlertEngine 冷却去重', () => {
  let repo: InMemoryAlertRepository
  let engine: AlertEngine

  beforeEach(() => {
    repo = new InMemoryAlertRepository()
    engine = new AlertEngine({ repository: repo, cooldownMs: 300_000 })
  })

  it('冷却期内重复越阈值只累加 hitCount 不新建告警', async () => {
    await engine.evaluate(healthy({ eventLoop: { mean: 10, p95: 150, max: 300 } }))
    await engine.evaluate(healthy({ eventLoop: { mean: 10, p95: 160, max: 300 } }))
    const alerts = await engine.evaluate(healthy({ eventLoop: { mean: 10, p95: 170, max: 300 } }))

    expect(await repo.list({})).toHaveLength(1)
    const stored = await repo.findById(alerts[0].id)
    expect(stored?.hitCount).toBe(3)
  })

  it('冷却期内 hitCount 累加会同步更新实测值', async () => {
    await engine.evaluate(healthy({ eventLoop: { mean: 10, p95: 150, max: 300 } }))
    const alerts = await engine.evaluate(healthy({ eventLoop: { mean: 10, p95: 400, max: 500 } }))

    const stored = await repo.findById(alerts[0].id)
    expect(stored?.metricValue).toBeCloseTo(400, 1)
    expect(stored?.severity).toBe('critical')
  })

  it('超过冷却期后可再次新建告警', async () => {
    const shortCooldown = new AlertEngine({ repository: repo, cooldownMs: 0 })
    await shortCooldown.evaluate(healthy({ eventLoop: { mean: 10, p95: 150, max: 300 } }))
    await shortCooldown.evaluate(healthy({ eventLoop: { mean: 10, p95: 151, max: 300 } }))

    expect(await repo.list({})).toHaveLength(2)
  })
})

describe('AlertEngine 状态流转', () => {
  let repo: InMemoryAlertRepository
  let engine: AlertEngine

  beforeEach(() => {
    repo = new InMemoryAlertRepository()
    engine = new AlertEngine({ repository: repo, cooldownMs: 300_000 })
  })

  it('指标回落到 warn 阈值以下自动标记 resolved', async () => {
    await engine.evaluate(healthy({ cpuPercent: 75 }))
    const alerts = await engine.evaluate(healthy({ cpuPercent: 80 }))
    expect(alerts[0].status).toBe('active')

    await engine.evaluate(healthy({ cpuPercent: 20 }))
    const stored = await repo.findById(alerts[0].id)
    expect(stored?.status).toBe('resolved')
    expect(stored?.resolvedAt).not.toBeNull()
  })

  it('已 resolved 的告警在回落期间不重复处理', async () => {
    await engine.evaluate(healthy({ cpuPercent: 75 }))
    const alerts = await engine.evaluate(healthy({ cpuPercent: 80 }))
    await engine.evaluate(healthy({ cpuPercent: 20 }))
    await engine.evaluate(healthy({ cpuPercent: 10 }))

    const stored = await repo.findById(alerts[0].id)
    expect(stored?.status).toBe('resolved')
    expect(await repo.list({})).toHaveLength(1)
  })

  it('管理员认领后进入 acked 状态', async () => {
    await engine.evaluate(healthy({ cpuPercent: 75 }))
    const alerts = await engine.evaluate(healthy({ cpuPercent: 80 }))

    const acked = await engine.ack(alerts[0].id, 'admin-001')
    expect(acked?.status).toBe('acked')
    expect(acked?.ackBy).toBe('admin-001')
  })

  it('认领不存在的告警返回 null', async () => {
    expect(await engine.ack('not-exist', 'admin-001')).toBeNull()
  })

  it('acked 状态的告警回落后转为 resolved', async () => {
    await engine.evaluate(healthy({ cpuPercent: 75 }))
    const alerts = await engine.evaluate(healthy({ cpuPercent: 80 }))
    await engine.ack(alerts[0].id, 'admin-001')

    await engine.evaluate(healthy({ cpuPercent: 20 }))
    const stored = await repo.findById(alerts[0].id)
    expect(stored?.status).toBe('resolved')
  })

  it('resolved 后再次越阈值可重新开一条告警', async () => {
    const noCooldown = new AlertEngine({ repository: repo, cooldownMs: 0 })
    await noCooldown.evaluate(healthy({ eventLoop: { mean: 10, p95: 150, max: 300 } }))
    await noCooldown.evaluate(healthy({ eventLoop: { mean: 1, p95: 2, max: 3 } }))
    await noCooldown.evaluate(healthy({ eventLoop: { mean: 10, p95: 150, max: 300 } }))

    expect(await repo.list({})).toHaveLength(2)
    expect(await repo.list({ status: 'resolved' })).toHaveLength(1)
    expect(await repo.list({ status: 'active' })).toHaveLength(1)
  })
})

describe('AlertEngine 上下文快照', () => {
  let repo: InMemoryAlertRepository
  let engine: AlertEngine

  beforeEach(() => {
    repo = new InMemoryAlertRepository()
    engine = new AlertEngine({ repository: repo, cooldownMs: 300_000 })
  })

  it('快照包含触发时刻的完整采样与依赖状态', async () => {
    const sample = healthy({ eventLoop: { mean: 10, p95: 150, max: 300 } })
    const alerts = await engine.evaluate(sample)

    expect(alerts[0].snapshot.sample.eventLoop.p95).toBe(150)
    expect(alerts[0].snapshot.sample.dbPool.connectionLimit).toBe(10)
    expect(alerts[0].snapshot.sample.redis.up).toBe(true)
  })

  it('快照包含窗口内的错误请求明细，可用 requestId 串联前后端', async () => {
    const errors = [
      { requestId: 'req-a', method: 'POST', route: '/api/v1/applications', statusCode: 500, durationMs: 1200, timestamp: Date.now() },
      { requestId: 'req-b', method: 'GET', route: '/api/v1/members', statusCode: 502, durationMs: 800, timestamp: Date.now() }
    ]
    engine.setRecentErrors(errors)
    const alerts = await engine.evaluate(healthy({ eventLoop: { mean: 10, p95: 150, max: 300 } }))

    expect(alerts[0].snapshot.recentErrors).toHaveLength(2)
    expect(alerts[0].snapshot.recentErrors[0].requestId).toBe('req-a')
  })

  it('无错误请求时快照的 recentErrors 为空数组', async () => {
    const alerts = await engine.evaluate(healthy({ eventLoop: { mean: 10, p95: 150, max: 300 } }))
    expect(alerts[0].snapshot.recentErrors).toEqual([])
  })

  it('告警消息包含规则名、实测值与阈值', async () => {
    const alerts = await engine.evaluate(healthy({ eventLoop: { mean: 10, p95: 150, max: 300 } }))
    expect(alerts[0].message).toContain('event_loop_p95_ms')
    expect(alerts[0].message).toContain('150')
  })
})

describe('DEFAULT_RULES 完整性', () => {
  it('覆盖设计文档约定的全部规则', () => {
    const names = DEFAULT_RULES.map(r => r.name)
    expect(names).toEqual([
      'cpu_percent',
      'rss_percent',
      'event_loop_p95_ms',
      'error_rate_5xx',
      'db_pool_waiting',
      'redis_down'
    ])
  })

  it('每条规则的 critical 阈值不低于 warn 阈值', () => {
    for (const rule of DEFAULT_RULES) {
      if (rule.warn !== null && rule.critical !== null) {
        expect(rule.critical).toBeGreaterThanOrEqual(rule.warn)
      }
    }
  })
})

describe('resolveRules 阈值环境变量覆盖', () => {
  const baseEnv = (): NodeJS.ProcessEnv => {
    const env = { ...process.env }
    delete env.MONITOR_THRESHOLDS
    return env
  }

  it('未设置环境变量时返回默认规则', () => {
    const rules = resolveRules(baseEnv())
    expect(rules.map(r => [r.name, r.warn, r.critical])).toEqual(
      DEFAULT_RULES.map(r => [r.name, r.warn, r.critical])
    )
  })

  it('合法 JSON 覆盖指定规则的阈值', () => {
    const rules = resolveRules({
      ...baseEnv(),
      MONITOR_THRESHOLDS: JSON.stringify({ cpu_percent: { warn: 50, critical: 80 } })
    })

    const cpu = rules.find(r => r.name === 'cpu_percent')
    expect(cpu?.warn).toBe(50)
    expect(cpu?.critical).toBe(80)
    // 其他规则不受影响
    const loop = rules.find(r => r.name === 'event_loop_p95_ms')
    expect(loop?.warn).toBe(100)
  })

  it('部分覆盖只改指定阈值，未指定的保留默认', () => {
    const rules = resolveRules({
      ...baseEnv(),
      MONITOR_THRESHOLDS: JSON.stringify({ cpu_percent: { warn: 40 } })
    })

    const cpu = rules.find(r => r.name === 'cpu_percent')
    expect(cpu?.warn).toBe(40)
    expect(cpu?.critical).toBe(90)
  })

  it('非法 JSON 时整体回退默认规则', () => {
    const rules = resolveRules({ ...baseEnv(), MONITOR_THRESHOLDS: 'not-json' })
    expect(rules.map(r => r.warn)).toEqual(DEFAULT_RULES.map(r => r.warn))
  })

  it('未知规则名被忽略', () => {
    const rules = resolveRules({
      ...baseEnv(),
      MONITOR_THRESHOLDS: JSON.stringify({ no_such_rule: { warn: 1 } })
    })
    expect(rules.map(r => r.name)).toEqual(DEFAULT_RULES.map(r => r.name))
  })

  it('非法数值类型被拒绝并保留该规则默认值', () => {
    const rules = resolveRules({
      ...baseEnv(),
      MONITOR_THRESHOLDS: JSON.stringify({ cpu_percent: { warn: '很高' } })
    })
    const cpu = rules.find(r => r.name === 'cpu_percent')
    expect(cpu?.warn).toBe(70)
  })

  it('覆盖不能改变规则的连续点数与取值函数', () => {
    const rules = resolveRules({
      ...baseEnv(),
      MONITOR_THRESHOLDS: JSON.stringify({
        cpu_percent: { consecutivePoints: 1, extract: () => 0 }
      })
    })
    const cpu = rules.find(r => r.name === 'cpu_percent')
    expect(cpu?.consecutivePoints).toBe(DEFAULT_RULES[0].consecutivePoints)
    expect(cpu?.extract).toBe(DEFAULT_RULES[0].extract)
  })

  it('覆盖后的规则在引擎中真实生效', async () => {
    const repo = new InMemoryAlertRepository()
    const engine = new AlertEngine({
      repository: repo,
      cooldownMs: 300_000,
      rules: resolveRules({
        MONITOR_THRESHOLDS: JSON.stringify({ event_loop_p95_ms: { warn: 10, critical: 20 } })
      })
    })

    const sample = healthy({ eventLoop: { mean: 5, p95: 15, max: 30 } })
    const alerts = await engine.evaluate(sample)

    expect(alerts).toHaveLength(1)
    expect(alerts[0].rule).toBe('event_loop_p95_ms')
    expect(alerts[0].threshold).toBe(10)
  })
})

describe('AlertEngine 通知触发', () => {
  let repo: InMemoryAlertRepository
  let notifyMock: jest.Mock
  let engine: AlertEngine

  beforeEach(() => {
    repo = new InMemoryAlertRepository()
    notifyMock = jest.fn().mockResolvedValue(undefined)
    const notifier: Notifier = { notify: notifyMock }
    engine = new AlertEngine({ repository: repo, cooldownMs: 300_000, notifier })
  })

  it('新开告警触发 opened 通知', async () => {
    await engine.evaluate(healthy({ cpuPercent: 75 }))
    await engine.evaluate(healthy({ cpuPercent: 80 }))

    expect(notifyMock).toHaveBeenCalledTimes(1)
    const [notification] = notifyMock.mock.calls[0] as [{ event: string; alert: { rule: string } }]
    expect(notification.event).toBe('opened')
    expect(notification.alert.rule).toBe('cpu_percent')
  })

  it('指标回落后触发 resolved 通知', async () => {
    await engine.evaluate(healthy({ cpuPercent: 75 }))
    await engine.evaluate(healthy({ cpuPercent: 80 }))
    notifyMock.mockClear()

    await engine.evaluate(healthy({ cpuPercent: 10 }))

    expect(notifyMock).toHaveBeenCalledTimes(1)
    const [notification] = notifyMock.mock.calls[0] as [{ event: string; alert: { status: string } }]
    expect(notification.event).toBe('resolved')
    expect(notification.alert.status).toBe('resolved')
  })

  it('冷却期内严重级别升级触发 escalated 通知', async () => {
    const lowEngine = new AlertEngine({
      repository: repo,
      cooldownMs: 300_000,
      rules: DEFAULT_RULES.map(r => (r.name === 'cpu_percent' ? { ...r, warn: 50, critical: 90, consecutivePoints: 1 } : r)),
      notifier: { notify: notifyMock }
    })

    await lowEngine.evaluate(healthy({ cpuPercent: 60 })) // warn
    notifyMock.mockClear()
    await lowEngine.evaluate(healthy({ cpuPercent: 95 })) // 冷却期内升 critical

    expect(notifyMock).toHaveBeenCalledTimes(1)
    const [notification] = notifyMock.mock.calls[0] as [{ event: string; alert: { severity: string } }]
    expect(notification.event).toBe('escalated')
    expect(notification.alert.severity).toBe('critical')
  })

  it('冷却期内同级重复命中不重复通知', async () => {
    await engine.evaluate(healthy({ cpuPercent: 75 }))
    await engine.evaluate(healthy({ cpuPercent: 80 }))
    notifyMock.mockClear()

    await engine.evaluate(healthy({ cpuPercent: 82 }))

    expect(notifyMock).not.toHaveBeenCalled()
  })

  it('通知器抛错不影响告警落库与评估结果', async () => {
    const failingNotifier: Notifier = {
      notify: jest.fn().mockRejectedValue(new Error('webhook down'))
    }
    const failingEngine = new AlertEngine({ repository: repo, cooldownMs: 300_000, notifier: failingNotifier })

    await expect(failingEngine.evaluate(healthy({ cpuPercent: 95 }))).resolves.toHaveLength(0)
    await expect(failingEngine.evaluate(healthy({ cpuPercent: 96 }))).resolves.toHaveLength(1)
    expect(await repo.list({})).toHaveLength(1)
  })

  it('未注入 notifier 时使用 NullNotifier 且不抛错', async () => {
    const plainEngine = new AlertEngine({ repository: repo, cooldownMs: 300_000 })
    expect(plainEngine).toBeDefined()
    // 隐式 NullNotifier：评估正常完成
    await expect(plainEngine.evaluate(healthy({ eventLoop: { mean: 10, p95: 150, max: 300 } }))).resolves.toHaveLength(1)
  })

  it('NullNotifier.notify 为无操作', async () => {
    await expect(new NullNotifier().notify({ alert: makeNullAlert(), event: 'opened' })).resolves.toBeUndefined()
  })
})

function makeNullAlert() {
  return {
    id: 'x',
    rule: 'cpu_percent',
    severity: 'critical' as const,
    metricValue: 1,
    threshold: 1,
    status: 'active' as const,
    hitCount: 1,
    message: '',
    snapshot: { sample: {} as MetricSample, recentErrors: [], triggeredAt: 0 },
    createdAt: 1,
    updatedAt: 1,
    resolvedAt: null,
    ackBy: null
  }
}

describe('AlertEngine 时间戳一致性（E3）', () => {
  it('冷却期内再次命中的 updatedAt 使用采样时间而非系统时钟', async () => {
    const repo = new InMemoryAlertRepository()
    const engine = new AlertEngine({ repository: repo, cooldownMs: 300_000 })

    const t1 = 1757000000000
    const t2 = 1757000005000
    const t3 = 1757000010000
    // 前两点触发 openAlert（createdAt=t2），第三点冷却期内命中 hitAgain
    await engine.evaluate(healthy({ cpuPercent: 75, timestamp: t1 }))
    await engine.evaluate(healthy({ cpuPercent: 80, timestamp: t2 }))
    const alerts = await engine.evaluate(healthy({ cpuPercent: 82, timestamp: t3 }))

    expect(alerts).toHaveLength(1)
    expect(alerts[0].updatedAt).toBe(t3)
    expect(alerts[0].createdAt).toBe(t2)
  })
})
