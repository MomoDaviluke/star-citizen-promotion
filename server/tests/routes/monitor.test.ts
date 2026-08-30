/**
 * @file 监控路由测试
 * @description 覆盖权限拦截、指标与告警读取、认领流转、前端回报写入、
 *              sendBeacon 的 text/plain 兜底与限流
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import { createMonitorRouter, sampleEvenly } from '../../src/routes/monitor.js'
import { AlertEngine } from '../../src/monitoring/alertEngine.js'
import { InMemoryAlertRepository } from '../../src/monitoring/alertRepository.js'
import { MetricsCollector } from '../../src/monitoring/collector.js'
import { MonitorScheduler } from '../../src/monitoring/scheduler.js'
import type { MetricSample } from '../../src/monitoring/collector.js'
import type { CollectorDeps } from '../../src/monitoring/collector.js'

const MB = 1024 * 1024

function makeDeps(overrides: Partial<CollectorDeps> = {}): CollectorDeps {
  return {
    cpuUsage: () => ({ user: 0, system: 0 }),
    memoryUsage: () => ({ rss: 100 * MB, heapUsed: 50 * MB, heapTotal: 200 * MB, external: 5 * MB }),
    systemMemory: () => ({ total: 8 * 1024 * MB, free: 4 * 1024 * MB }),
    eventLoopDelay: () => ({ mean: 2_000_000, p95: 5_000_000, max: 9_000_000 }),
    getPoolStatus: () => ({
      totalConnections: 2, activeConnections: 1, idleConnections: 1, waitingRequests: 0, connectionLimit: 10
    }),
    pingRedis: async () => 3,
    cpuCount: 4,
    ...overrides
  } as CollectorDeps
}

const passThrough = (_req: Request, _res: Response, next: NextFunction) => next()
const denyAll = (_req: Request, res: Response, _next: NextFunction) => res.status(403).json({ success: false, error: '需要管理员权限' })
const asAdmin = (req: Request, _res: Response, next: NextFunction) => {
  (req as Request & { user: unknown }).user = { id: 'admin-001', role: 'admin' }
  next()
}

interface StoredReport {
  id: string
  requestId: string | null
  category: string
  message: string | null
  browser: unknown
  payload: unknown
  createdAt: number
}

describe('监控路由', () => {
  let collector: MetricsCollector
  let alertEngine: AlertEngine
  let repository: InMemoryAlertRepository
  let reports: StoredReport[]
  let app: express.Express

  beforeEach(async () => {
    repository = new InMemoryAlertRepository()
    alertEngine = new AlertEngine({ repository, cooldownMs: 300_000 })
    collector = new MetricsCollector(makeDeps(), { capacity: 10 })
    await collector.collect()
    reports = []

    app = express()
    app.use(express.json())
    app.use(express.text())
    app.use('/api/v1/monitor', createMonitorRouter({
      collector,
      alertEngine,
      authenticate: asAdmin,
      requireAdmin: passThrough,
      reportLimiter: passThrough,
      createReport: async input => {
        const report: StoredReport = {
          id: `report-${reports.length + 1}`,
          requestId: input.requestId ?? null,
          category: input.category ?? 'manual',
          message: input.message ?? null,
          browser: input.browser ?? null,
          payload: input.payload ?? null,
          createdAt: Date.now()
        }
        reports.push(report)
        return report as never
      },
      listReports: async options => {
        const filtered = options.requestId ? reports.filter(r => r.requestId === options.requestId) : reports
        return filtered as never
      }
    }))
  })

  describe('GET /metrics', () => {
    it('返回当前快照与历史采样', async () => {
      await collector.collect()
      const res = await request(app).get('/api/v1/monitor/metrics')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.latest.cpuPercent).toBeDefined()
      expect(res.body.data.latest.dbPool.connectionLimit).toBe(10)
      expect(Array.isArray(res.body.data.history)).toBe(true)
      expect(res.body.data.history.length).toBeGreaterThanOrEqual(2)
    })

    it('包含告警规则定义，便于前端渲染阈值', async () => {
      const res = await request(app).get('/api/v1/monitor/metrics')
      expect(res.body.data.rules.length).toBeGreaterThan(0)
      expect(res.body.data.rules[0]).toHaveProperty('name')
      expect(res.body.data.rules[0]).toHaveProperty('warn')
    })

    it('包含活跃告警统计', async () => {
      await alertEngine.evaluate(await collector.collect())
      const res = await request(app).get('/api/v1/monitor/metrics')
      expect(res.body.data.alerts).toHaveProperty('active')
    })

    it('无采样数据时返回空历史而非报错', async () => {
      const emptyCollector = new MetricsCollector(makeDeps(), { capacity: 10 })
      const localApp = express()
      localApp.use(express.json())
      localApp.use('/api/v1/monitor', createMonitorRouter({
        collector: emptyCollector,
        alertEngine,
        authenticate: asAdmin,
        requireAdmin: passThrough,
        reportLimiter: passThrough
      }))

      const res = await request(localApp).get('/api/v1/monitor/metrics')
      expect(res.status).toBe(200)
      expect(res.body.data.latest).toBeNull()
      expect(res.body.data.history).toEqual([])
    })

    it('非管理员被拦截', async () => {
      const lockedApp = express()
      lockedApp.use(express.json())
      lockedApp.use('/api/v1/monitor', createMonitorRouter({
        collector,
        alertEngine,
        authenticate: asAdmin,
        requireAdmin: denyAll,
        reportLimiter: passThrough
      }))

      const res = await request(lockedApp).get('/api/v1/monitor/metrics')
      expect(res.status).toBe(403)
    })
  })

  describe('GET /alerts', () => {
    it('返回告警列表', async () => {
      const sample = await collector.collect()
      await alertEngine.evaluate({ ...sample, eventLoop: { mean: 10, p95: 150, max: 300 } })

      const res = await request(app).get('/api/v1/monitor/alerts')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].rule).toBe('event_loop_p95_ms')
      expect(res.body.data[0].snapshot).toBeDefined()
    })

    it('支持按状态过滤', async () => {
      const sample = await collector.collect()
      const alerts = await alertEngine.evaluate({ ...sample, eventLoop: { mean: 10, p95: 150, max: 300 } })
      await alertEngine.ack(alerts[0].id, 'admin-001')

      const active = await request(app).get('/api/v1/monitor/alerts?status=active')
      const acked = await request(app).get('/api/v1/monitor/alerts?status=acked')

      expect(active.body.data).toHaveLength(0)
      expect(acked.body.data).toHaveLength(1)
    })

    it('支持按级别过滤', async () => {
      const sample = await collector.collect()
      await alertEngine.evaluate({ ...sample, eventLoop: { mean: 10, p95: 150, max: 300 } })

      const critical = await request(app).get('/api/v1/monitor/alerts?severity=critical')
      const warn = await request(app).get('/api/v1/monitor/alerts?severity=warn')

      expect(critical.body.data).toHaveLength(0)
      expect(warn.body.data).toHaveLength(1)
    })

    it('拒绝非法状态参数', async () => {
      const res = await request(app).get('/api/v1/monitor/alerts?status=bogus')
      expect(res.status).toBe(400)
    })
  })

  describe('POST /alerts/:id/ack', () => {
    it('认领后状态转为 acked 并记录认领人', async () => {
      const sample = await collector.collect()
      const alerts = await alertEngine.evaluate({ ...sample, eventLoop: { mean: 10, p95: 150, max: 300 } })

      const res = await request(app).post(`/api/v1/monitor/alerts/${alerts[0].id}/ack`)
      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('acked')
      expect(res.body.data.ackBy).toBe('admin-001')
    })

    it('认领不存在的告警返回 404', async () => {
      const res = await request(app).post('/api/v1/monitor/alerts/not-exist/ack')
      expect(res.status).toBe(404)
    })

    it('重复认领已认领的告警返回 404', async () => {
      const sample = await collector.collect()
      const alerts = await alertEngine.evaluate({ ...sample, eventLoop: { mean: 10, p95: 150, max: 300 } })
      await request(app).post(`/api/v1/monitor/alerts/${alerts[0].id}/ack`)

      const res = await request(app).post(`/api/v1/monitor/alerts/${alerts[0].id}/ack`)
      expect(res.status).toBe(404)
    })
  })

  describe('POST /reports', () => {
    it('接受 JSON 格式的回报', async () => {
      const res = await request(app)
        .post('/api/v1/monitor/reports')
        .set('Content-Type', 'application/json')
        .send({ category: 'frontend_error', message: '页面白屏', requestId: 'req-123' })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(reports).toHaveLength(1)
      expect(reports[0].requestId).toBe('req-123')
    })

    it('接受 text/plain 格式（sendBeacon 未包装 Blob 时兜底）', async () => {
      const res = await request(app)
        .post('/api/v1/monitor/reports')
        .set('Content-Type', 'text/plain')
        .send(JSON.stringify({ category: 'api_failure', message: '接口 500' }))

      expect(res.status).toBe(201)
      expect(reports[0].category).toBe('api_failure')
    })

    it('非法 JSON 体返回 400', async () => {
      const res = await request(app)
        .post('/api/v1/monitor/reports')
        .set('Content-Type', 'text/plain')
        .send('not-a-json')

      expect(res.status).toBe(400)
    })

    it('未知类别回落为 manual 而非报错', async () => {
      const res = await request(app)
        .post('/api/v1/monitor/reports')
        .send({ category: 'unknown_category', message: 'x' })

      expect(res.status).toBe(201)
      expect(reports[0].category).toBe('manual')
    })

    it('缺少内容时返回 400', async () => {
      const res = await request(app).post('/api/v1/monitor/reports').send({})
      expect(res.status).toBe(400)
    })

    it('超出大小上限的 payload 被拒绝', async () => {
      const res = await request(app)
        .post('/api/v1/monitor/reports')
        .send({ message: 'x', payload: { blob: 'a'.repeat(70 * 1024) } })

      expect(res.status).toBe(413)
    })

    it('超出大小上限的 browser 被拒绝', async () => {
      const res = await request(app)
        .post('/api/v1/monitor/reports')
        .send({ message: 'x', browser: { blob: 'a'.repeat(70 * 1024) } })

      expect(res.status).toBe(413)
    })

    it('限流生效时返回 429', async () => {
      const limitedApp = express()
      limitedApp.use(express.json())
      limitedApp.use('/api/v1/monitor', createMonitorRouter({
        collector,
        alertEngine,
        authenticate: asAdmin,
        requireAdmin: passThrough,
        reportLimiter: (_req: Request, res: Response, _next: NextFunction) =>
          res.status(429).json({ success: false, error: '上报过于频繁' })
      }))

      const res = await request(limitedApp).post('/api/v1/monitor/reports').send({ message: 'x' })
      expect(res.status).toBe(429)
    })
  })

  describe('GET /reports', () => {
    it('按 requestId 过滤回报，用于与后端告警串联', async () => {
      await request(app).post('/api/v1/monitor/reports').send({ message: 'A', requestId: 'req-1' })
      await request(app).post('/api/v1/monitor/reports').send({ message: 'B', requestId: 'req-2' })

      const res = await request(app).get('/api/v1/monitor/reports?requestId=req-1')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].requestId).toBe('req-1')
    })

    it('不带参数时返回全部回报', async () => {
      await request(app).post('/api/v1/monitor/reports').send({ message: 'A' })
      await request(app).post('/api/v1/monitor/reports').send({ message: 'B' })

      const res = await request(app).get('/api/v1/monitor/reports')
      expect(res.body.data).toHaveLength(2)
    })

    it('支持 limit/offset 分页', async () => {
      const localReports: unknown[] = []
      const pagedApp = express()
      pagedApp.use(express.json())
      pagedApp.use('/api/v1/monitor', createMonitorRouter({
        collector,
        alertEngine,
        authenticate: asAdmin,
        requireAdmin: passThrough,
        reportLimiter: passThrough,
        listReports: async (options: { requestId?: string; limit?: number; offset?: number }) => {
          localReports.push({ options, caller: 'paged' })
          const base = [1, 2, 3, 4, 5].map(i => ({ id: `r-${i}` }))
          return (options.offset ? base.slice(options.offset, options.offset + (options.limit ?? 50)) : base.slice(0, options.limit ?? 50)) as never
        }
      }))

      const res = await request(pagedApp).get('/api/v1/monitor/reports?limit=2&offset=2')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(2)
      expect(res.body.data[0].id).toBe('r-3')
      expect((localReports[0] as { options: { limit: number; offset: number } }).options).toEqual({ limit: 2, offset: 2 })
    })

    it('非管理员被拦截', async () => {
      const lockedApp = express()
      lockedApp.use(express.json())
      lockedApp.use('/api/v1/monitor', createMonitorRouter({
        collector,
        alertEngine,
        authenticate: asAdmin,
        requireAdmin: denyAll,
        reportLimiter: passThrough
      }))

      const res = await request(lockedApp).get('/api/v1/monitor/reports')
      expect(res.status).toBe(403)
    })
  })

  describe('GET /health（监控自检）', () => {
    it('返回调度器健康快照', async () => {
      const scheduler = new MonitorScheduler(collector, alertEngine)
      await scheduler.tick()
      const localApp = express()
      localApp.use(express.json())
      localApp.use('/api/v1/monitor', createMonitorRouter({
        collector,
        alertEngine,
        scheduler,
        authenticate: asAdmin,
        requireAdmin: passThrough,
        reportLimiter: passThrough
      }))

      const res = await request(localApp).get('/api/v1/monitor/health')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.scheduler.tickCount).toBe(1)
      expect(res.body.data.scheduler.consecutiveFailures).toBe(0)
      expect(res.body.data.scheduler.selfAlert).toBeDefined()
      // 缓冲区状态用于判断采集是否在积压或空转
      expect(res.body.data.collector).toHaveProperty('bufferSize')
    })

    it('未注入调度器时返回 not-configured 而非报错', async () => {
      const res = await request(app).get('/api/v1/monitor/health')
      expect(res.status).toBe(200)
      expect(res.body.data.scheduler).toBeNull()
      expect(res.body.data.note).toContain('未配置')
    })

    it('非管理员被拦截', async () => {
      const lockedApp = express()
      lockedApp.use(express.json())
      lockedApp.use('/api/v1/monitor', createMonitorRouter({
        collector,
        alertEngine,
        authenticate: asAdmin,
        requireAdmin: denyAll,
        reportLimiter: passThrough
      }))

      const res = await request(lockedApp).get('/api/v1/monitor/health')
      expect(res.status).toBe(403)
    })
  })

  describe('/metrics 携带调度器摘要', () => {
    it('注入调度器时返回 scheduler 字段', async () => {
      const scheduler = new MonitorScheduler(collector, alertEngine)
      await scheduler.tick()
      const localApp = express()
      localApp.use(express.json())
      localApp.use('/api/v1/monitor', createMonitorRouter({
        collector,
        alertEngine,
        scheduler,
        authenticate: asAdmin,
        requireAdmin: passThrough,
        reportLimiter: passThrough
      }))

      const res = await request(localApp).get('/api/v1/monitor/metrics')
      expect(res.body.data.scheduler).not.toBeNull()
      expect(res.body.data.scheduler.tickCount).toBe(1)
    })
  })
})

describe('监控路由默认依赖', () => {
  it('未注入认证中间件时使用项目默认的 authenticate/requireAdmin', async () => {
    const localCollector = new MetricsCollector(makeDeps(), { capacity: 5 })
    const localApp = express()
    localApp.use(express.json())
    localApp.use('/api/v1/monitor', createMonitorRouter({
      collector: localCollector,
      alertEngine: new AlertEngine({ repository: new InMemoryAlertRepository() })
    }))

    // 默认中间件在无 token 时应返回 401，而非放行
    const res = await request(localApp).get('/api/v1/monitor/metrics')
    expect(res.status).toBe(401)
  })
})

describe('sampleEvenly 等距抽样', () => {
  it('样本数不超过目标时原样返回', () => {
    expect(sampleEvenly([1, 2, 3], 10)).toEqual([1, 2, 3])
  })

  it('保留首尾点的等距抽样', () => {
    const source = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const sampled = sampleEvenly(source, 4)
    expect(sampled).toHaveLength(4)
    expect(sampled[0]).toBe(0)
    expect(sampled[sampled.length - 1]).toBe(9)
  })

  it('目标为 0 或负数时返回空数组', () => {
    expect(sampleEvenly([1, 2, 3], 0)).toEqual([])
    expect(sampleEvenly([1, 2, 3], -1)).toEqual([])
  })
})

describe('GET /metrics 历史降采样', () => {
  const asAdmin = (_req: Request, _res: Response, next: NextFunction) => next()
  const passThrough = (_req: Request, _res: Response, next: NextFunction) => next()

  function buildApp(collector: MetricsCollector) {
    const engine = new AlertEngine({ repository: new InMemoryAlertRepository() })
    const localApp = express()
    localApp.use(express.json())
    localApp.use('/api/v1/monitor', createMonitorRouter({
      collector,
      alertEngine: engine,
      authenticate: asAdmin,
      requireAdmin: passThrough,
      reportLimiter: passThrough
    }))
    return localApp
  }

  it('points 参数生效：历史序列被等距抽样', async () => {
    const localCollector = new MetricsCollector(makeDeps(), { capacity: 20 })
    for (let i = 0; i < 10; i += 1) {
      await localCollector.collect()
    }
    const full = localCollector.history()
    expect(full).toHaveLength(10)

    const res = await request(buildApp(localCollector)).get('/api/v1/monitor/metrics?points=4')
    expect(res.status).toBe(200)
    expect(res.body.data.history).toHaveLength(4)
    expect(res.body.data.history[0].timestamp).toBe(full[0].timestamp)
    expect(res.body.data.history[3].timestamp).toBe(full[9].timestamp)
  })

  it('非法 points 回退默认 60', async () => {
    const localCollector = new MetricsCollector(makeDeps(), { capacity: 10 })
    await localCollector.collect()
    const res = await request(buildApp(localCollector)).get('/api/v1/monitor/metrics?points=abc')
    expect(res.status).toBe(200)
    expect(res.body.data.history.length).toBeLessThanOrEqual(60)
  })

  it('points 超过上限 300 被截断', async () => {
    const localCollector = new MetricsCollector(makeDeps(), { capacity: 10 })
    await localCollector.collect()
    const res = await request(buildApp(localCollector)).get('/api/v1/monitor/metrics?points=9999')
    expect(res.status).toBe(200)
    expect(res.body.data.history.length).toBeLessThanOrEqual(300)
  })
})
