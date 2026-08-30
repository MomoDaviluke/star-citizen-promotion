/**
 * @file Webhook 通知器测试
 * @description 覆盖四种消息格式的 payload 构造、发送成功/失败容错、重试与同规则速率冷却
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { WebhookNotifier, buildPayload, normalizeFormat } from '../../src/monitoring/webhookNotifier.js'
import type { AlertEvent } from '../../src/monitoring/alertRepository.js'
import type { AlertNotification } from '../../src/monitoring/notifier.js'

function makeAlert(overrides: Partial<AlertEvent> = {}): AlertEvent {
  return {
    id: 'alert-1',
    rule: 'cpu_percent',
    severity: 'critical',
    metricValue: 95,
    threshold: 90,
    status: 'active',
    hitCount: 3,
    message: '[cpu_percent] CPU 使用率实测 95%，已达 critical 阈值 90%',
    snapshot: { sample: {} as never, recentErrors: [], triggeredAt: 1700000000000 },
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    resolvedAt: null,
    ackBy: null,
    ...overrides
  }
}

function makeNotification(event: AlertNotification['event'] = 'opened'): AlertNotification {
  return { alert: makeAlert(), event }
}

describe('normalizeFormat', () => {
  it('合法格式原样返回', () => {
    expect(normalizeFormat('wecom')).toBe('wecom')
    expect(normalizeFormat('dingtalk')).toBe('dingtalk')
    expect(normalizeFormat('feishu')).toBe('feishu')
    expect(normalizeFormat('generic')).toBe('generic')
  })

  it('非法或缺失格式回落 generic', () => {
    expect(normalizeFormat('slack')).toBe('generic')
    expect(normalizeFormat(undefined)).toBe('generic')
  })
})

describe('buildPayload 四种格式', () => {
  it('wecom：群机器人 markdown 结构', () => {
    const payload = JSON.parse(buildPayload('wecom', makeNotification()))
    expect(payload.msgtype).toBe('markdown')
    expect(payload.markdown.content).toContain('🚨 新告警 [critical]')
    expect(payload.markdown.content).toContain('cpu_percent')
  })

  it('dingtalk：markdown 结构', () => {
    const payload = JSON.parse(buildPayload('dingtalk', makeNotification()))
    expect(payload.msgtype).toBe('markdown')
    expect(payload.text.content).toContain('cpu_percent')
  })

  it('feishu：text 结构', () => {
    const payload = JSON.parse(buildPayload('feishu', makeNotification()))
    expect(payload.msg_type).toBe('text')
    expect(payload.content.text).toContain('cpu_percent')
  })

  it('generic：结构化 JSON 含全部字段', () => {
    const payload = JSON.parse(buildPayload('generic', makeNotification('escalated')))
    expect(payload.event).toBe('escalated')
    expect(payload.rule).toBe('cpu_percent')
    expect(payload.severity).toBe('critical')
    expect(payload.metricValue).toBe(95)
    expect(payload.threshold).toBe(90)
    expect(payload.alertId).toBe('alert-1')
  })

  it('resolved 事件文案使用恢复标记', () => {
    const payload = JSON.parse(buildPayload('generic', makeNotification('resolved')))
    expect(payload.event).toBe('resolved')
  })
})

describe('WebhookNotifier 发送', () => {
  let fetchMock: jest.Mock
  let notifier: WebhookNotifier

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 })
    notifier = new WebhookNotifier({
      url: 'https://hook.example.com/abc',
      format: 'generic',
      fetchFn: fetchMock,
      timeoutMs: 500,
      retries: 1
    })
  })

  it('发送成功：POST 到配置 url，Content-Type 为 application/json', async () => {
    await notifier.notify(makeNotification())

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, { method: string; headers: Record<string, string>; body: string }]
    expect(url).toBe('https://hook.example.com/abc')
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body).rule).toBe('cpu_percent')
  })

  it('非 2xx 响应：不抛出，按重试次数重试', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 })

    await expect(notifier.notify(makeNotification())).resolves.toBeUndefined()
    // 初始 + 1 次重试
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('网络异常：不抛出，按重试次数重试', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'))

    await expect(notifier.notify(makeNotification())).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('同规则冷却期内第二次通知被跳过', async () => {
    await notifier.notify(makeNotification())
    await notifier.notify(makeNotification())

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('不同规则不受冷却影响', async () => {
    await notifier.notify(makeNotification())
    await notifier.notify({ alert: makeAlert({ rule: 'redis_down' }), event: 'opened' })

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('缺少 url 时构造抛错', () => {
    expect(() => new WebhookNotifier({ url: '' })).toThrow()
  })
})
