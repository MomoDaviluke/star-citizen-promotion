/**
 * @file 监控数据持久化
 * @description 告警与前端回报的 MySQL 读写。告警事件落库以支持历史追溯，
 *              高频采样点不落库（由采集器的内存环形缓冲承载）。
 * @module server/database/monitorStore
 */

import { randomUUID } from 'node:crypto'
import { query, queryOne } from './pool.js'
import logger from '../utils/logger.js'
import type {
  AlertEvent,
  AlertFilter,
  AlertRepository,
  AlertSeverity,
  AlertStatus
} from '../monitoring/alertRepository.js'
import type { MetricSample, RequestRecord } from '../monitoring/collector.js'

interface AlertRow {
  id: string
  rule: string
  severity: AlertSeverity
  metric_value: string | number
  threshold: string | number
  status: AlertStatus
  hit_count: number
  message: string
  snapshot: unknown
  ack_by: string | null
  created_at: Date | string
  updated_at: Date | string
  resolved_at: Date | string | null
}

function toTimestamp(value: Date | string | null | undefined): number | null {
  if (!value) return null
  return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

/**
 * 毫秒时间戳转 Unix 秒
 * @description 统一由本函数换算，SQL 侧直接使用 FROM_UNIXTIME(?) 不再二次除法。
 *              曾因「参数先除 1000、SQL 再除 1000」导致写入时间落在 1970 年，
 *              进而使冷却判断失真、每次采样都新建告警。
 */
export function toUnixSeconds(ms: number): number {
  return Math.floor(ms / 1000)
}

function parseSnapshot(raw: unknown): AlertEvent['snapshot'] {
  if (raw && typeof raw === 'object') return raw as AlertEvent['snapshot']
  return { sample: {} as MetricSample, recentErrors: [] as RequestRecord[], triggeredAt: 0 }
}

function rowToAlert(row: AlertRow): AlertEvent {
  return {
    id: row.id,
    rule: row.rule,
    severity: row.severity,
    metricValue: Number(row.metric_value),
    threshold: Number(row.threshold),
    status: row.status,
    hitCount: row.hit_count,
    message: row.message,
    snapshot: parseSnapshot(row.snapshot),
    createdAt: toTimestamp(row.created_at) ?? Date.now(),
    updatedAt: toTimestamp(row.updated_at) ?? Date.now(),
    resolvedAt: toTimestamp(row.resolved_at),
    ackBy: row.ack_by
  }
}

type QueryFn = (sql: string, params?: unknown[]) => Promise<unknown>
type QueryOneFn = (sql: string, params?: unknown[]) => Promise<unknown>

export interface MysqlAlertRepositoryDeps {
  query?: QueryFn
  queryOne?: QueryOneFn
}

/**
 * MySQL 告警仓储
 * @description 所有读写都做容错降级：监控链路的任何数据库故障都不应拖垮业务请求，
 *              也不应让告警评估链路瘫痪。读故障降级为 null / 空数组，写故障降级为静默 + 日志。
 */
export class MysqlAlertRepository implements AlertRepository {
  private readonly runQuery: QueryFn
  private readonly runQueryOne: QueryOneFn

  constructor(deps: MysqlAlertRepositoryDeps = {}) {
    this.runQuery = deps.query ?? (query as unknown as QueryFn)
    this.runQueryOne = deps.queryOne ?? (queryOne as unknown as QueryOneFn)
  }

  async create(alert: AlertEvent): Promise<void> {
    try {
      await this.runQuery(
        `INSERT INTO monitor_alerts
         (id, rule, severity, metric_value, threshold, status, hit_count, message, snapshot, ack_by, created_at, updated_at, resolved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?), FROM_UNIXTIME(?), ?)`,
        [
          alert.id,
          alert.rule,
          alert.severity,
          alert.metricValue,
          alert.threshold,
          alert.status,
          alert.hitCount,
          alert.message,
          JSON.stringify(alert.snapshot),
          alert.ackBy,
          toUnixSeconds(alert.createdAt),
          toUnixSeconds(alert.updatedAt),
          alert.resolvedAt ? new Date(alert.resolvedAt) : null
        ]
      )
    } catch (error) {
      logger.error('告警落库失败', { alertId: alert.id, error: (error as Error).message })
    }
  }

  async update(alert: AlertEvent): Promise<void> {
    try {
      await this.runQuery(
        `UPDATE monitor_alerts
         SET severity = ?, metric_value = ?, threshold = ?, status = ?, hit_count = ?,
             message = ?, snapshot = ?, ack_by = ?, updated_at = FROM_UNIXTIME(?),
             resolved_at = ?
         WHERE id = ?`,
        [
          alert.severity,
          alert.metricValue,
          alert.threshold,
          alert.status,
          alert.hitCount,
          alert.message,
          JSON.stringify(alert.snapshot),
          alert.ackBy,
          toUnixSeconds(alert.updatedAt),
          alert.resolvedAt ? new Date(alert.resolvedAt) : null,
          alert.id
        ]
      )
    } catch (error) {
      logger.error('告警更新失败', { alertId: alert.id, error: (error as Error).message })
    }
  }

  async findById(id: string): Promise<AlertEvent | null> {
    try {
      const row = await this.runQueryOne('SELECT * FROM monitor_alerts WHERE id = ?', [id])
      return row ? rowToAlert(row as AlertRow) : null
    } catch (error) {
      logger.error('告警查询失败', { alertId: id, error: (error as Error).message })
      return null
    }
  }

  async findActiveByRule(rule: string): Promise<AlertEvent | null> {
    try {
      const row = await this.runQueryOne(
        `SELECT * FROM monitor_alerts
         WHERE rule = ? AND status IN ('active', 'acked')
         ORDER BY created_at DESC LIMIT 1`,
        [rule]
      )
      return row ? rowToAlert(row as AlertRow) : null
    } catch (error) {
      // 评估链路每 5 秒都会走到这里，数据库故障时按「无活跃告警」处理：
      // 告警引擎会新建告警，写路径的容错会兜住，恢复后状态自然收敛
      logger.error('活跃告警查询失败，本轮评估按无活跃告警处理', { rule, error: (error as Error).message })
      return null
    }
  }

  async list(filter: AlertFilter = {}): Promise<AlertEvent[]> {
    const conditions: string[] = []
    const params: unknown[] = []

    if (filter.status) {
      conditions.push('status = ?')
      params.push(filter.status)
    }
    if (filter.severity) {
      conditions.push('severity = ?')
      params.push(filter.severity)
    }
    if (filter.rule) {
      conditions.push('rule = ?')
      params.push(filter.rule)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const limit = Math.min(filter.limit ?? 50, 200)
    const offset = Math.max(filter.offset ?? 0, 0)

    try {
      const rows = await this.runQuery(
        `SELECT * FROM monitor_alerts ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
        params
      )
      return (rows as AlertRow[]).map(rowToAlert)
    } catch (error) {
      logger.error('告警列表查询失败', { error: (error as Error).message })
      return []
    }
  }

  /**
   * 清理超过保留期的已恢复告警
   * @returns 删除的行数，数据库故障返回 -1
   */
  async purgeResolvedBefore(timestampMs: number): Promise<number> {
    try {
      const result = await this.runQuery(
        `DELETE FROM monitor_alerts
         WHERE status = 'resolved' AND created_at < FROM_UNIXTIME(?)`,
        [toUnixSeconds(timestampMs)]
      ) as { affectedRows?: number }
      return result?.affectedRows ?? 0
    } catch (error) {
      logger.error('过期告警清理失败', { error: (error as Error).message })
      return -1
    }
  }
}

/**
 * 清理超过保留期的前端回报
 * @description 独立函数（不与告警仓储绑定），供调度器按保留期清理 monitor_reports。
 *              容错与 purgeResolvedBefore 一致：数据库故障返回 -1，绝不抛出。
 * @param timestampMs 早于该时间戳（毫秒）的回报将被删除
 * @param deps 可选注入（测试用）；缺省使用连接池 query
 * @returns 删除的行数，数据库故障返回 -1
 */
export async function purgeReportsBefore(
  timestampMs: number,
  deps?: { query?: QueryFn }
): Promise<number> {
  const runQuery = deps?.query ?? (query as unknown as QueryFn)
  try {
    const result = await runQuery(
      `DELETE FROM monitor_reports
       WHERE created_at < FROM_UNIXTIME(?)`,
      [toUnixSeconds(timestampMs)]
    ) as { affectedRows?: number }
    return result?.affectedRows ?? 0
  } catch (error) {
    logger.error('过期问题回报清理失败', { error: (error as Error).message })
    return -1
  }
}

export type ReportCategory = 'frontend_error' | 'slow_page' | 'api_failure' | 'manual'

export interface IssueReportInput {
  requestId?: string | null
  category?: ReportCategory
  message?: string | null
  browser?: Record<string, unknown> | null
  payload?: Record<string, unknown> | null
}

export interface IssueReport {
  id: string
  requestId: string | null
  category: ReportCategory
  message: string | null
  browser: Record<string, unknown> | null
  payload: Record<string, unknown> | null
  createdAt: number
}

interface ReportRow {
  id: string
  request_id: string | null
  category: ReportCategory
  message: string | null
  browser: unknown
  payload: unknown
  created_at: Date | string
}

const ALLOWED_CATEGORIES = new Set<ReportCategory>(['frontend_error', 'slow_page', 'api_failure', 'manual'])

/**
 * 写入前端问题回报
 * @returns 落库后的回报记录，失败返回 null
 */
export async function createReport(input: IssueReportInput): Promise<IssueReport | null> {
  const id = randomUUID()
  const category: ReportCategory = input.category && ALLOWED_CATEGORIES.has(input.category)
    ? input.category
    : 'manual'

  try {
    await query(
      `INSERT INTO monitor_reports (id, request_id, category, message, browser, payload)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.requestId ?? null,
        category,
        input.message ?? null,
        input.browser ? JSON.stringify(input.browser) : null,
        input.payload ? JSON.stringify(input.payload) : null
      ]
    )
    return {
      id,
      requestId: input.requestId ?? null,
      category,
      message: input.message ?? null,
      browser: input.browser ?? null,
      payload: input.payload ?? null,
      createdAt: Date.now()
    }
  } catch (error) {
    logger.error('问题回报落库失败', { error: (error as Error).message })
    return null
  }
}

/**
 * 查询前端问题回报
 * @param options.requestId 按请求 ID 精确查找，用于与后端告警串联
 * @param options.offset 分页偏移量（对齐告警列表的 limit/offset 模式）
 */
export async function listReports(options: { requestId?: string; limit?: number; offset?: number } = {}): Promise<IssueReport[]> {
  const conditions: string[] = []
  const params: unknown[] = []

  if (options.requestId) {
    conditions.push('request_id = ?')
    params.push(options.requestId)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = Math.min(options.limit ?? 50, 200)
  const offset = Math.max(options.offset ?? 0, 0)

  try {
    const rows = await query<ReportRow[]>(
      `SELECT * FROM monitor_reports ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    )
    return rows.map(row => ({
      id: row.id,
      requestId: row.request_id,
      category: row.category,
      message: row.message,
      browser: (row.browser ?? null) as Record<string, unknown> | null,
      payload: (row.payload ?? null) as Record<string, unknown> | null,
      createdAt: toTimestamp(row.created_at) ?? Date.now()
    }))
  } catch (error) {
    logger.error('问题回报查询失败', { error: (error as Error).message })
    return []
  }
}
