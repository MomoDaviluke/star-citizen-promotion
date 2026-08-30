/**
 * @file 告警引擎
 * @description 按分级阈值判定采样点是否异常，满足连续点数要求后生成告警并抓上下文快照；
 *              冷却期内去重、指标回落自动恢复、支持管理员认领。
 *              不负责采样（由 MetricsCollector 承担）与持久化细节（由 AlertRepository 承担）。
 * @module server/monitoring/alertEngine
 */

import { randomUUID } from 'node:crypto'
import logger from '../utils/logger.js'
import type { MetricSample, RequestRecord } from './collector.js'
import {
  InMemoryAlertRepository,
  type AlertEvent,
  type AlertFilter,
  type AlertRepository,
  type AlertSeverity
} from './alertRepository.js'
import { NullNotifier, type Notifier } from './notifier.js'

export interface AlertRule {
  name: string
  label: string
  unit: string
  warn: number | null
  critical: number | null
  /** 需连续多少个采样点越阈值才触发，用于抑制瞬时毛刺 */
  consecutivePoints: number
  /** 从采样中取值，返回 null 表示该规则本次不适用 */
  extract: (sample: MetricSample) => number | null
}

export const DEFAULT_RULES: AlertRule[] = [
  {
    name: 'cpu_percent',
    label: 'CPU 使用率',
    unit: '%',
    warn: 70,
    critical: 90,
    consecutivePoints: 2,
    extract: s => s.cpuPercent
  },
  {
    // 不采用「堆占用 / 堆上限」作为告警依据：V8 本就会把堆用到接近上限才 GC，
    // 健康进程的瞬时堆占用长期在 90% 以上，据此告警会持续误报。
    // 改用 RSS 占系统内存的比例，它才反映真实的 OOM 风险。
    name: 'rss_percent',
    label: '进程内存占系统比例',
    unit: '%',
    warn: 70,
    critical: 85,
    consecutivePoints: 2,
    extract: s => s.rssPercent
  },
  {
    name: 'event_loop_p95_ms',
    label: '事件循环 P95 延迟',
    unit: 'ms',
    warn: 100,
    critical: 300,
    // 事件循环阻塞会立刻放大为所有请求变慢，后果严重，不要求连续点数
    consecutivePoints: 1,
    extract: s => s.eventLoop.p95
  },
  {
    name: 'error_rate_5xx',
    label: '5xx 错误率',
    unit: '%',
    warn: 0.05,
    critical: 0.15,
    consecutivePoints: 1,
    extract: s => s.requests.errorRate5xx
  },
  {
    name: 'db_pool_waiting',
    label: 'DB 连接池等待数',
    unit: '个',
    warn: 3,
    critical: 8,
    consecutivePoints: 2,
    extract: s => s.dbPool.waitingRequests
  },
  {
    name: 'redis_down',
    label: 'Redis 不可用',
    unit: '',
    warn: null,
    critical: 1,
    consecutivePoints: 2,
    extract: s => (s.redis.up ? 0 : 1)
  }
]

export interface AlertEngineOptions {
  repository?: AlertRepository
  rules?: AlertRule[]
  cooldownMs?: number
  /** 外部通知器；未提供时使用 NullNotifier（不发送任何通知） */
  notifier?: Notifier
}

const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000
const SEVERITY_RANK: Record<AlertSeverity, number> = { warn: 1, critical: 2 }

/**
 * 判定指标值对应的告警级别
 * @returns 未越任何阈值时返回 null
 */
function classify(rule: AlertRule, value: number): { severity: AlertSeverity; threshold: number } | null {
  if (rule.critical !== null && value >= rule.critical) {
    return { severity: 'critical', threshold: rule.critical }
  }
  if (rule.warn !== null && value >= rule.warn) {
    return { severity: 'warn', threshold: rule.warn }
  }
  return null
}

const THRESHOLD_ENV_KEY = 'MONITOR_THRESHOLDS'

function cloneRule(rule: AlertRule): AlertRule {
  return { ...rule }
}

/**
 * 校验单个阈值覆盖值
 * @returns 合法数值原样返回，非法值回退默认
 */
function pickThreshold(value: unknown, fallback: number | null): number | null {
  if (value === undefined) return fallback
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value
  return fallback
}

/**
 * 从环境变量 MONITOR_THRESHOLDS 解析规则阈值覆盖
 * @description 只允许覆盖 warn / critical；连续点数与取值函数始终固定在代码里，
 *              防止环境变量破坏判定结构。非法配置整体回退默认并记日志。
 * @example MONITOR_THRESHOLDS='{"cpu_percent":{"warn":50,"critical":80}}'
 */
export function resolveRules(env: NodeJS.ProcessEnv = process.env): AlertRule[] {
  const raw = env[THRESHOLD_ENV_KEY]
  if (!raw) return DEFAULT_RULES.map(cloneRule)

  let overrides: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
    overrides = parsed as Record<string, unknown>
  } catch {
    logger.warn('MONITOR_THRESHOLDS 不是合法 JSON，已回退默认阈值', { value: raw.slice(0, 120) })
    return DEFAULT_RULES.map(cloneRule)
  }

  return DEFAULT_RULES.map(rule => {
    const override = overrides[rule.name]
    if (!override || typeof override !== 'object') return cloneRule(rule)

    const obj = override as Record<string, unknown>
    const warn = pickThreshold(obj.warn, rule.warn)
    const critical = pickThreshold(obj.critical, rule.critical)
    if (warn === rule.warn && critical === rule.critical) return cloneRule(rule)

    logger.info('告警阈值已通过环境变量覆盖', { rule: rule.name, warn, critical })
    return { ...cloneRule(rule), warn, critical }
  })
}

export class AlertEngine {
  private readonly repo: AlertRepository
  private readonly rules: AlertRule[]
  private readonly cooldownMs: number
  private readonly notifier: Notifier
  /** 各规则当前的连续越阈值点数，用于抑制毛刺 */
  private readonly streaks = new Map<string, number>()
  private recentErrors: RequestRecord[] = []

  constructor(options: AlertEngineOptions = {}) {
    this.repo = options.repository ?? new InMemoryAlertRepository()
    // 默认规则支持 MONITOR_THRESHOLDS 环境变量覆盖阈值，无需改代码重启调参
    this.rules = options.rules ?? resolveRules()
    this.cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS
    this.notifier = options.notifier ?? new NullNotifier()
  }

  /**
   * 注入窗口内的错误请求
   * @description 由采集器在每次采样后同步，作为告警快照的一部分
   */
  setRecentErrors(errors: RequestRecord[]): void {
    this.recentErrors = errors
  }

  /**
   * 评估一个采样点
   * @returns 本次新建或更新的告警
   */
  async evaluate(sample: MetricSample): Promise<AlertEvent[]> {
    const touched: AlertEvent[] = []

    for (const rule of this.rules) {
      let value: number | null
      try {
        value = rule.extract(sample)
      } catch (error) {
        // 单个规则取值异常只影响该规则，不能让整轮评估崩溃
        logger.warn('告警规则取值异常，本轮跳过', { rule: rule.name, error: (error as Error).message })
        continue
      }
      // 非有限值（undefined / NaN / Infinity）视为本次不适用：
      // 防御不完整采样让评估链路抛错，进而误触调度器自警
      if (value === null || !Number.isFinite(value)) continue

      const verdict = classify(rule, value)
      if (!verdict) {
        await this.handleRecovered(rule, touched)
        continue
      }

      const streak = (this.streaks.get(rule.name) ?? 0) + 1
      this.streaks.set(rule.name, streak)
      if (streak < rule.consecutivePoints) continue

      const existing = await this.repo.findActiveByRule(rule.name)
      if (!existing) {
        touched.push(await this.openAlert(rule, value, verdict.severity, verdict.threshold, sample))
        continue
      }

      const withinCooldown = sample.timestamp - existing.createdAt < this.cooldownMs
      if (withinCooldown) {
        touched.push(await this.hitAgain(existing, value, verdict.severity, verdict.threshold, sample.timestamp))
      } else {
        await this.resolveAlert(existing)
        touched.push(await this.openAlert(rule, value, verdict.severity, verdict.threshold, sample))
      }
    }

    return touched
  }

  private async handleRecovered(rule: AlertRule, touched: AlertEvent[]): Promise<void> {
    this.streaks.set(rule.name, 0)
    const existing = await this.repo.findActiveByRule(rule.name)
    if (!existing) return
    touched.push(await this.resolveAlert(existing))
  }

  /**
   * 触发外部通知（fire-and-forget）
   * @description 通知失败只记日志，绝不让通知链路影响告警主链路
   */
  private notifySafe(notification: Parameters<Notifier['notify']>[0]): void {
    this.notifier.notify(notification).catch((error: Error) => {
      logger.error('告警通知器异常（已隔离）', { rule: notification.alert.rule, error: error.message })
    })
  }

  private async openAlert(
    rule: AlertRule,
    value: number,
    severity: AlertSeverity,
    threshold: number,
    sample: MetricSample
  ): Promise<AlertEvent> {
    const now = sample.timestamp
    const alert: AlertEvent = {
      id: randomUUID(),
      rule: rule.name,
      severity,
      metricValue: value,
      threshold,
      status: 'active',
      hitCount: 1,
      message: `[${rule.name}] ${rule.label}实测 ${value}${rule.unit}，已达 ${severity} 阈值 ${threshold}${rule.unit}`,
      snapshot: {
        sample,
        recentErrors: [...this.recentErrors],
        triggeredAt: now
      },
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      ackBy: null
    }
    await this.repo.create(alert)
    this.notifySafe({ alert, event: 'opened' })
    return alert
  }

  private async hitAgain(
    existing: AlertEvent,
    value: number,
    severity: AlertSeverity,
    threshold: number,
    now: number
  ): Promise<AlertEvent> {
    const upgraded = SEVERITY_RANK[severity] > SEVERITY_RANK[existing.severity]
    const updated: AlertEvent = {
      ...existing,
      metricValue: value,
      threshold,
      // 级别只升不降：冷却期内出现更严重的越阈值应如实反映
      severity: upgraded ? severity : existing.severity,
      hitCount: existing.hitCount + 1,
      // 与 openAlert 保持一致：使用采样时间而非系统时钟，避免时钟不一致
      updatedAt: now
    }
    await this.repo.update(updated)
    if (upgraded) {
      this.notifySafe({ alert: updated, event: 'escalated' })
    }
    return updated
  }

  private async resolveAlert(alert: AlertEvent): Promise<AlertEvent> {
    if (alert.status === 'resolved') return alert
    const resolved: AlertEvent = {
      ...alert,
      status: 'resolved',
      resolvedAt: Date.now(),
      updatedAt: Date.now()
    }
    await this.repo.update(resolved)
    this.notifySafe({ alert: resolved, event: 'resolved' })
    return resolved
  }

  /**
   * 认领告警
   * @returns 认领后的告警，不存在或已恢复时返回 null
   */
  async ack(id: string, userId: string): Promise<AlertEvent | null> {
    const alert = await this.repo.findById(id)
    if (!alert || alert.status !== 'active') return null
    const acked: AlertEvent = {
      ...alert,
      status: 'acked',
      ackBy: userId,
      updatedAt: Date.now()
    }
    await this.repo.update(acked)
    return acked
  }

  list(filter: AlertFilter = {}): Promise<AlertEvent[]> {
    return this.repo.list(filter)
  }

  getRules(): AlertRule[] {
    return this.rules.map(r => ({
      ...r,
      extract: r.extract
    }))
  }
}
