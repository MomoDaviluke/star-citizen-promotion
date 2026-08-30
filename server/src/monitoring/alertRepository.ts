/**
 * @file 告警仓储
 * @description 定义告警持久化契约与内存实现。内存实现用于单元测试与
 *              数据库不可用时的降级，MySQL 实现见 database/monitorStore.ts
 * @module server/monitoring/alertRepository
 */

import type { MetricSample, RequestRecord } from './collector.js'

export type AlertSeverity = 'warn' | 'critical'
export type AlertStatus = 'active' | 'acked' | 'resolved'

/** 告警触发瞬间的上下文快照，用于定位问题 */
export interface AlertSnapshot {
  sample: MetricSample
  recentErrors: RequestRecord[]
  triggeredAt: number
}

export interface AlertEvent {
  id: string
  rule: string
  severity: AlertSeverity
  metricValue: number
  threshold: number
  status: AlertStatus
  hitCount: number
  message: string
  snapshot: AlertSnapshot
  createdAt: number
  updatedAt: number
  resolvedAt: number | null
  ackBy: string | null
}

export interface AlertFilter {
  status?: AlertStatus
  severity?: AlertSeverity
  rule?: string
  limit?: number
  offset?: number
}

export interface AlertRepository {
  create(alert: AlertEvent): Promise<void>
  update(alert: AlertEvent): Promise<void>
  findById(id: string): Promise<AlertEvent | null>
  findActiveByRule(rule: string): Promise<AlertEvent | null>
  list(filter: AlertFilter): Promise<AlertEvent[]>
}

/**
 * 内存告警仓储
 * @description 告警按创建时间倒序返回，便于面板优先展示最新问题
 */
export class InMemoryAlertRepository implements AlertRepository {
  private readonly alerts = new Map<string, AlertEvent>()

  async create(alert: AlertEvent): Promise<void> {
    this.alerts.set(alert.id, { ...alert })
  }

  async update(alert: AlertEvent): Promise<void> {
    if (!this.alerts.has(alert.id)) return
    this.alerts.set(alert.id, { ...alert })
  }

  async findById(id: string): Promise<AlertEvent | null> {
    return this.alerts.get(id) ?? null
  }

  async findActiveByRule(rule: string): Promise<AlertEvent | null> {
    const found = [...this.alerts.values()]
      .filter(a => a.rule === rule && (a.status === 'active' || a.status === 'acked'))
      .sort((a, b) => b.createdAt - a.createdAt)
    return found[0] ?? null
  }

  async list(filter: AlertFilter): Promise<AlertEvent[]> {
    let items = [...this.alerts.values()]
    if (filter.status) items = items.filter(a => a.status === filter.status)
    if (filter.severity) items = items.filter(a => a.severity === filter.severity)
    if (filter.rule) items = items.filter(a => a.rule === filter.rule)

    items.sort((a, b) => b.createdAt - a.createdAt)
    const offset = filter.offset ?? 0
    const limit = filter.limit ?? 50
    return items.slice(offset, offset + limit)
  }
}
