/**
 * @file 监控调度器
 * @description 把「采集一次」与「评估一次告警」串成一次 tick，并按固定周期驱动。
 *              单独成类是为了让采集器与告警引擎都不必关心定时逻辑。
 *              自身带健康追踪：监控系统挂掉必须能被外部发现（谁来监控监控者）。
 * @module server/monitoring/scheduler
 */

import type { MetricsCollector } from './collector.js'
import type { AlertEngine } from './alertEngine.js'
import logger from '../utils/logger.js'

const DEFAULT_INTERVAL_MS = 5_000
const DEFAULT_SNAPSHOT_ERRORS = 10
const DEFAULT_SELF_ALERT_THRESHOLD = 3
const DEFAULT_RETENTION_DAYS = 30
const DEFAULT_REPORT_RETENTION_DAYS = 90
const DEFAULT_PURGE_INTERVAL_MS = 60 * 60 * 1000

/**
 * 支持过期数据清理的仓储能力
 * @description 调度器通过该可选能力触发清理，避免在 AlertRepository 接口上强加实现负担
 */
export interface PurgeCapable {
  purgeResolvedBefore(timestampMs: number): Promise<number>
}

export interface SchedulerOptions {
  intervalMs?: number
  /** 告警快照中保留的错误请求条数 */
  snapshotErrors?: number
  /** 连续失败多少次后进入自警状态 */
  selfAlertThreshold?: number
  /** 已恢复告警的保留天数，超过即清理 */
  retentionDays?: number
  /** 前端问题回报的保留天数，超过即清理（默认 90 天） */
  reportRetentionDays?: number
  /** 两次清理之间的最小间隔 */
  purgeIntervalMs?: number
  /** 告警清理执行者；未提供则不清理 */
  purger?: PurgeCapable
  /** 前端回报清理执行者；未提供则不清回报表 */
  reportPurger?: PurgeCapable
}

/** 监控自身健康快照 */
export interface SchedulerHealth {
  running: boolean
  startedAt: number | null
  lastTickAt: number | null
  lastSuccessAt: number | null
  lastError: string | null
  tickCount: number
  failureCount: number
  consecutiveFailures: number
  selfAlert: {
    active: boolean
    since: number | null
    message: string | null
  }
  intervalMs: number
  lastPurgeAt: number | null
  lastPurgeCount: number | null
  lastPurgeError: string | null
  lastPurgeReportsCount: number | null
  lastPurgeReportsError: string | null
}

/**
 * 调度器最小接口
 * @description 供路由等外部模块弱耦合引用，避免直接依赖具体类
 */
export interface SchedulerLike {
  getHealth(): SchedulerHealth
}

export class MonitorScheduler {
  private readonly collector: MetricsCollector
  private readonly alertEngine: AlertEngine
  private readonly intervalMs: number
  private readonly snapshotErrors: number
  private readonly selfAlertThreshold: number
  private readonly retentionDays: number
  private readonly reportRetentionDays: number
  private readonly purgeIntervalMs: number
  private readonly purger?: PurgeCapable
  private readonly reportPurger?: PurgeCapable
  private timer: NodeJS.Timeout | null = null

  private startedAt: number | null = null
  private lastTickAt: number | null = null
  private lastSuccessAt: number | null = null
  private lastError: string | null = null
  private tickCount = 0
  private failureCount = 0
  private consecutiveFailures = 0
  private selfAlertSince: number | null = null
  private selfAlertMessage: string | null = null
  private lastPurgeAt = 0
  private lastPurgeCount: number | null = null
  private lastPurgeError: string | null = null
  private lastPurgeReportsCount: number | null = null
  private lastPurgeReportsError: string | null = null

  constructor(collector: MetricsCollector, alertEngine: AlertEngine, options: SchedulerOptions = {}) {
    this.collector = collector
    this.alertEngine = alertEngine
    this.intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS
    this.snapshotErrors = options.snapshotErrors ?? DEFAULT_SNAPSHOT_ERRORS
    this.selfAlertThreshold = options.selfAlertThreshold ?? DEFAULT_SELF_ALERT_THRESHOLD
    this.retentionDays = options.retentionDays ?? DEFAULT_RETENTION_DAYS
    this.reportRetentionDays = options.reportRetentionDays ?? DEFAULT_REPORT_RETENTION_DAYS
    this.purgeIntervalMs = options.purgeIntervalMs ?? DEFAULT_PURGE_INTERVAL_MS
    this.purger = options.purger
    this.reportPurger = options.reportPurger
  }

  /**
   * 执行一次采样与告警评估
   * @description 内部吞掉异常并计入健康统计：失败的 tick 不能让定时器中断，
   *              也不能向上抛出未处理的 Promise 拒绝
   */
  async tick(): Promise<void> {
    this.tickCount += 1
    this.lastTickAt = Date.now()

    try {
      await this.maybePurge()
      const sample = await this.collector.collect()
      this.alertEngine.setRecentErrors(this.collector.recentErrors(this.snapshotErrors))
      const alerts = await this.alertEngine.evaluate(sample)

      for (const alert of alerts) {
        if (alert.status === 'resolved') {
          logger.info('告警已恢复', { rule: alert.rule, alertId: alert.id })
        } else if (alert.hitCount === 1) {
          logger.warn('触发新告警', {
            rule: alert.rule,
            severity: alert.severity,
            value: alert.metricValue,
            threshold: alert.threshold,
            alertId: alert.id
          })
        }
      }

      this.lastSuccessAt = Date.now()
      this.lastError = null
      this.consecutiveFailures = 0
      if (this.selfAlertSince !== null) {
        logger.info('监控调度自警解除', { since: this.selfAlertSince })
        this.selfAlertSince = null
        this.selfAlertMessage = null
      }
    } catch (error) {
      this.failureCount += 1
      this.consecutiveFailures += 1
      this.lastError = (error as Error).message

      if (this.consecutiveFailures >= this.selfAlertThreshold && this.selfAlertSince === null) {
        this.selfAlertSince = Date.now()
        this.selfAlertMessage = `监控调度连续 ${this.consecutiveFailures} 次失败：${this.lastError}`
        logger.error('监控调度进入自警状态', {
          consecutiveFailures: this.consecutiveFailures,
          error: this.lastError
        })
      } else {
        logger.error('监控采样失败', {
          error: this.lastError,
          consecutiveFailures: this.consecutiveFailures
        })
      }
    }
  }

  /**
   * 按保留期清理过期的已恢复告警与前端回报
   * @description 两类清理相互独立、互不阻塞；清理失败只记录、不影响采样链路健康，
   *              也不会触发自警
   */
  private async maybePurge(): Promise<void> {
    if (!this.purger && !this.reportPurger) return
    const now = Date.now()
    if (now - this.lastPurgeAt < this.purgeIntervalMs) return
    this.lastPurgeAt = now

    if (this.purger) {
      try {
        const cutoff = now - this.retentionDays * 86_400_000
        const purged = await this.purger.purgeResolvedBefore(cutoff)
        this.lastPurgeCount = purged
        this.lastPurgeError = null
        if (purged > 0) {
          logger.info('已清理过期告警', { purged, retentionDays: this.retentionDays })
        }
      } catch (error) {
        this.lastPurgeCount = null
        this.lastPurgeError = (error as Error).message
        logger.error('过期告警清理失败', { error: this.lastPurgeError })
      }
    }

    if (this.reportPurger) {
      try {
        const cutoff = now - this.reportRetentionDays * 86_400_000
        const purged = await this.reportPurger.purgeResolvedBefore(cutoff)
        this.lastPurgeReportsCount = purged
        this.lastPurgeReportsError = null
        if (purged > 0) {
          logger.info('已清理过期问题回报', { purged, reportRetentionDays: this.reportRetentionDays })
        }
      } catch (error) {
        this.lastPurgeReportsCount = null
        this.lastPurgeReportsError = (error as Error).message
        logger.error('过期问题回报清理失败', { error: this.lastPurgeReportsError })
      }
    }
  }

  /**
   * 获取调度器健康快照
   * @description 供 /monitor/health 与 /metrics 暴露，让外部探活能发现监控系统自身故障
   */
  getHealth(): SchedulerHealth {
    return {
      running: this.timer !== null,
      startedAt: this.startedAt,
      lastTickAt: this.lastTickAt,
      lastSuccessAt: this.lastSuccessAt,
      lastError: this.lastError,
      tickCount: this.tickCount,
      failureCount: this.failureCount,
      consecutiveFailures: this.consecutiveFailures,
      selfAlert: {
        active: this.selfAlertSince !== null,
        since: this.selfAlertSince,
        message: this.selfAlertMessage
      },
      intervalMs: this.intervalMs,
      lastPurgeAt: this.lastPurgeAt > 0 ? this.lastPurgeAt : null,
      lastPurgeCount: this.lastPurgeCount,
      lastPurgeError: this.lastPurgeError,
      lastPurgeReportsCount: this.lastPurgeReportsCount,
      lastPurgeReportsError: this.lastPurgeReportsError
    }
  }

  start(): void {
    if (this.timer) return
    this.startedAt = Date.now()
    this.tick().catch((error: Error) => {
      logger.error('首次监控调度异常逃逸', { error: error.message })
    })
    this.timer = setInterval(() => {
      this.tick().catch((error: Error) => {
        logger.error('监控调度异常逃逸', { error: error.message })
      })
    }, this.intervalMs)
    this.timer.unref?.()
  }

  stop(): void {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = null
  }
}
