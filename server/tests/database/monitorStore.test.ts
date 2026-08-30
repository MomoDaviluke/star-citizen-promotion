/**
 * @file 监控持久化测试
 * @description 覆盖时间换算、告警落库/读回的往返一致性，以及数据库故障时的容错降级。
 *              时间戳换算与容错降级都是稳定性关键点，必须锁死回归。
 */

import { describe, it, expect, jest } from '@jest/globals'
import {
  toUnixSeconds,
  MysqlAlertRepository,
  purgeReportsBefore
} from '../../src/database/monitorStore.js'
import { InMemoryAlertRepository } from '../../src/monitoring/alertRepository.js'
import type { AlertEvent } from '../../src/monitoring/alertRepository.js'

function makeAlert(overrides: Partial<AlertEvent> = {}): AlertEvent {
  const now = Date.now()
  return {
    id: 'alert-1',
    rule: 'cpu_percent',
    severity: 'warn',
    metricValue: 88,
    threshold: 70,
    status: 'active',
    hitCount: 1,
    message: 'test',
    snapshot: { sample: {} as never, recentErrors: [], triggeredAt: now },
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    ackBy: null,
    ...overrides
  }
}

describe('toUnixSeconds', () => {
  it('把毫秒时间戳换算为秒', () => {
    expect(toUnixSeconds(1788002442585)).toBe(1788002442)
  })

  it('换算结果可直接交给 FROM_UNIXTIME 还原原始时间', () => {
    const ms = Date.now()
    const restored = new Date(toUnixSeconds(ms) * 1000).getTime()
    // 允许 1 秒内的取整误差，但绝不能相差到年份级别
    expect(Math.abs(restored - ms)).toBeLessThan(1000)
  })

  it('秒级结果的量级落在合理区间，避免重复除法', () => {
    const seconds = toUnixSeconds(Date.now())
    // 2020-01-01 ~ 2100-01-01 之间的秒数
    expect(seconds).toBeGreaterThan(1_577_836_800)
    expect(seconds).toBeLessThan(4_102_444_800)
  })
})

describe('InMemoryAlertRepository', () => {
  it('落库后可按规则查回活跃告警', async () => {
    const repo = new InMemoryAlertRepository()
    await repo.create(makeAlert())

    const found = await repo.findActiveByRule('cpu_percent')
    expect(found?.id).toBe('alert-1')
  })

  it('已恢复的告警不再被 findActiveByRule 命中', async () => {
    const repo = new InMemoryAlertRepository()
    await repo.create(makeAlert({ status: 'resolved' }))

    expect(await repo.findActiveByRule('cpu_percent')).toBeNull()
  })

  it('按状态过滤生效', async () => {
    const repo = new InMemoryAlertRepository()
    await repo.create(makeAlert({ id: 'a', status: 'active' }))
    await repo.create(makeAlert({ id: 'b', status: 'resolved' }))

    expect(await repo.list({ status: 'active' })).toHaveLength(1)
    expect(await repo.list({ status: 'resolved' })).toHaveLength(1)
    expect(await repo.list({})).toHaveLength(2)
  })

  it('分页参数生效', async () => {
    const repo = new InMemoryAlertRepository()
    for (let i = 0; i < 5; i++) {
      await repo.create(makeAlert({ id: `a${i}`, createdAt: i }))
    }

    const page = await repo.list({ limit: 2, offset: 2 })
    expect(page).toHaveLength(2)
    // 按创建时间倒序，索引 2、3 对应 a2、a1
    expect(page[0].id).toBe('a2')
  })
})

describe('MysqlAlertRepository 容错降级', () => {
  /**
   * 构造一个数据库完全故障的仓储
   * @description 仓储依赖支持注入，测试中用抛错的假实现模拟 MySQL 不可达
   */
  function makeBrokenRepo() {
    const dbError = new Error('ECONNREFUSED')
    const query = jest.fn(async () => { throw dbError })
    const queryOne = jest.fn(async () => { throw dbError })
    const repo = new MysqlAlertRepository({ query, queryOne })
    return { repo, query, queryOne }
  }

  it('findById 数据库故障时返回 null 而非抛错', async () => {
    const { repo } = makeBrokenRepo()
    await expect(repo.findById('alert-1')).resolves.toBeNull()
  })

  it('findActiveByRule 数据库故障时返回 null 而非抛错', async () => {
    const { repo } = makeBrokenRepo()
    // 该方法被告警引擎的每次评估调用，若抛错会让整条评估链路瘫痪
    await expect(repo.findActiveByRule('cpu_percent')).resolves.toBeNull()
  })

  it('list 数据库故障时返回空数组而非抛错', async () => {
    const { repo } = makeBrokenRepo()
    await expect(repo.list({})).resolves.toEqual([])
  })

  it('create/update 数据库故障时静默降级不抛出', async () => {
    const { repo } = makeBrokenRepo()
    await expect(repo.create(makeAlert())).resolves.toBeUndefined()
    await expect(repo.update(makeAlert())).resolves.toBeUndefined()
  })

  it('数据库恢复后查询自动恢复正常', async () => {
    const store = new Map<string, AlertEvent>()
    store.set('alert-1', makeAlert())
    const repo = new MysqlAlertRepository({
      query: jest.fn(async () => []),
      queryOne: jest.fn(async (_sql: string, params: unknown[]) =>
        store.get(String(params[0])) ?? null)
    })

    expect(await repo.findById('alert-1')).not.toBeNull()
  })
})

describe('purgeReportsBefore 前端回报清理', () => {
  it('按保留期删除并返回删除行数', async () => {
    const query = jest.fn().mockResolvedValue({ affectedRows: 3 })

    const purged = await purgeReportsBefore(1700000000000, { query: query as never })

    expect(purged).toBe(3)
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM monitor_reports'),
      expect.arrayContaining([expect.any(Number)])
    )
  })

  it('数据库故障返回 -1 而非抛错', async () => {
    const query = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'))

    await expect(purgeReportsBefore(1700000000000, { query: query as never })).resolves.toBe(-1)
  })

  it('affectedRows 缺失时返回 0', async () => {
    const query = jest.fn().mockResolvedValue({})

    await expect(purgeReportsBefore(1700000000000, { query: query as never })).resolves.toBe(0)
  })
})
