/**
 * @file 转化埋点服务
 * @description 前端转化漏斗事件上报（申请提交/招募官对话/页面访问/外链引流），
 *              优先使用 navigator.sendBeacon，不支持或失败时降级为 fetch keepalive，
 *              失败静默不影响主流程。受 siteConfig.features.enableAnalytics 开关控制。
 * @module services/analyticsService
 */

import siteConfig from '@/config/site.config.js'

/**
 * 埋点接收端点
 * @description 与后端 /api/v1/analytics 路由对应
 * @type {string}
 */
const ANALYTICS_ENDPOINT = '/api/v1/analytics'

/**
 * 上报单条转化事件
 * @description 发送事件到后端，失败不影响主流程
 * @param {string} event - 事件名（需在服务端白名单内，如 page_view / application_submit_success）
 * @param {Object} [properties] - 事件附加属性（路径、经验、轮次等）
 * @returns {Promise<void>}
 */
export async function trackEvent(event, properties = {}) {
  // 功能开关：enableAnalytics=false 时完全静默
  if (!siteConfig.features.enableAnalytics) {
    return
  }

  const payload = {
    event,
    properties,
    ts: Date.now()
  }
  const body = JSON.stringify(payload)

  // 优先使用 sendBeacon：页面卸载时仍能可靠发送，且不会阻塞导航
  // 注意：sendBeacon 直接传字符串时 Content-Type 会被置为 text/plain，
  // 后端 express.json() 不解析该类型，导致 req.body 为空而被白名单校验拒绝（400）。
  // 必须显式包装为 application/json 类型的 Blob。
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' })
    const sent = navigator.sendBeacon(ANALYTICS_ENDPOINT, blob)
    if (sent) {
      return
    }
  }

  // 降级方案：fetch keepalive 保证页面关闭时也能继续传输
  try {
    const response = await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body,
      keepalive: true,
      credentials: 'include'
    })

    if (!response.ok) {
      // 静默失败：埋点上报不应影响用户体验，仅在开发环境输出警告
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[Analytics] 上报失败:', response.status)
      }
    }
  } catch {
    // 静默失败：网络异常不应中断主流程
  }
}

/**
 * 批量上报转化事件
 * @description 将多条事件打包为数组一次上报，减少请求数
 * @param {Array<{event: string, properties?: Object}>} events - 事件列表
 * @returns {Promise<void>}
 */
export async function trackEvents(events) {
  if (!Array.isArray(events) || events.length === 0) {
    return
  }

  if (!siteConfig.features.enableAnalytics) {
    return
  }

  const payload = events.map((evt) => ({
    event: evt.event,
    properties: evt.properties || {},
    ts: Date.now()
  }))
  const body = JSON.stringify(payload)

  // 同 trackEvent：需用 Blob 显式声明 application/json，否则 sendBeacon 会以
  // text/plain 发送，后端无法解析请求体导致批量上报整体失败
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' })
    const sent = navigator.sendBeacon(ANALYTICS_ENDPOINT, blob)
    if (sent) {
      return
    }
  }

  try {
    const response = await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body,
      keepalive: true,
      credentials: 'include'
    })

    if (!response.ok && import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[Analytics] 批量上报失败:', response.status)
    }
  } catch {
    // 静默失败
  }
}
