/**
 * @file Webhook 告警通知器
 * @description 把告警事件推送到外部 webhook（企微群机器人 / 钉钉机器人 / 飞书机器人 / 通用 JSON）。
 *              设计原则：发送失败只记日志并重试一次，同规则 60s 速率冷却，
 *              通知器自身故障绝不上抛——保证监控主链路不受影响。
 * @module server/monitoring/webhookNotifier
 */

import logger from '../utils/logger.js'
import type { AlertNotification, Notifier } from './notifier.js'

/** 支持的消息格式 */
export type WebhookFormat = 'wecom' | 'dingtalk' | 'feishu' | 'generic'

const DEFAULT_TIMEOUT_MS = 3_000
const DEFAULT_RETRIES = 1
/** 同一规则两次通知之间的最小间隔，防止 webhook 被自己刷爆 */
const RULE_COOLDOWN_MS = 60_000

type FetchFn = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal: AbortSignal }) => Promise<{ ok: boolean; status: number }>

export interface WebhookNotifierOptions {
  url: string
  format?: WebhookFormat
  fetchFn?: FetchFn
  timeoutMs?: number
  retries?: number
}

/** 校验并归一化格式名，非法值回落 generic */
export function normalizeFormat(value: string | undefined): WebhookFormat {
  if (value === 'wecom' || value === 'dingtalk' || value === 'feishu' || value === 'generic') {
    return value
  }
  return 'generic'
}

/** 构造对应格式的 webhook 请求体（JSON 字符串） */
export function buildPayload(format: WebhookFormat, notification: AlertNotification): string {
  const { alert, event } = notification
  const occurredAt = new Date(alert.updatedAt || alert.createdAt).toISOString()

  const header = event === 'opened' ? '🚨 新告警' : event === 'resolved' ? '✅ 告警恢复' : '⚠️ 告警升级'
  const text = [
    `${header} [${alert.severity}]`,
    `规则：${alert.rule}`,
    `实测：${alert.metricValue} / 阈值：${alert.threshold}`,
    `命中：${alert.hitCount} 次`,
    alert.message,
    `时间：${occurredAt}`
  ].join('\n')

  switch (format) {
    case 'wecom':
      return JSON.stringify({ msgtype: 'markdown', markdown: { content: text } })
    case 'dingtalk':
      return JSON.stringify({ msgtype: 'markdown', title: header, text: { content: text } })
    case 'feishu':
      return JSON.stringify({ msg_type: 'text', content: { text } })
    case 'generic':
    default:
      return JSON.stringify({
        event,
        severity: alert.severity,
        rule: alert.rule,
        metricValue: alert.metricValue,
        threshold: alert.threshold,
        hitCount: alert.hitCount,
        message: alert.message,
        alertId: alert.id,
        occurredAt
      })
  }
}

export class WebhookNotifier implements Notifier {
  private readonly url: string
  private readonly format: WebhookFormat
  private readonly fetchFn: FetchFn
  private readonly timeoutMs: number
  private readonly retries: number
  /** 各规则最近一次通知时间（内存冷却） */
  private readonly lastNotifyAt = new Map<string, number>()

  constructor(options: WebhookNotifierOptions) {
    if (!options.url) {
      throw new Error('WebhookNotifier 需要配置 url')
    }
    this.url = options.url
    this.format = normalizeFormat(options.format)
    this.fetchFn = options.fetchFn ?? ((...args) => fetch(...args) as Promise<{ ok: boolean; status: number }>)
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.retries = options.retries ?? DEFAULT_RETRIES
  }

  /**
   * 发送通知
   * @description 内部容错：任何失败（网络/超时/非 2xx）都只记日志并静默，
   *              同规则在冷却期内直接跳过（仍视为发送成功，避免刷爆 webhook）
   */
  async notify(notification: AlertNotification): Promise<void> {
    const { alert } = notification
    const now = Date.now()
    const last = this.lastNotifyAt.get(alert.rule) ?? 0
    if (now - last < RULE_COOLDOWN_MS) {
      return
    }
    this.lastNotifyAt.set(alert.rule, now)

    const body = buildPayload(this.format, notification)

    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), this.timeoutMs)
        try {
          const response = await this.fetchFn(this.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            signal: controller.signal
          })
          if (!response.ok) {
            throw new Error(`webhook 返回 ${response.status}`)
          }
          logger.info('告警通知已发送', { rule: alert.rule, event: notification.event, attempt: attempt + 1 })
          return
        } finally {
          clearTimeout(timer)
        }
      } catch (error) {
        const message = (error as Error).message
        if (attempt < this.retries) {
          logger.warn('告警通知发送失败，准备重试', { rule: alert.rule, error: message, attempt: attempt + 1 })
        } else {
          logger.error('告警通知发送失败（已达最大重试）', { rule: alert.rule, error: message })
        }
      }
    }
  }
}
