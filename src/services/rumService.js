/**
 * @file RUM 上报服务
 * @description 将前端采集的真实用户性能指标上报到后端
 *              优先使用 navigator.sendBeacon，页面卸载时也能可靠发送
 *              不支持 sendBeacon 或发送失败时降级为 fetch keepalive
 * @module services/rumService
 */

/**
 * RUM 接收端点
 * @description 与后端 /api/v1/rum 路由对应
 * @type {string}
 */
const RUM_ENDPOINT = '/api/v1/rum'

/**
 * 发送 RUM 指标信标
 * @description 将性能指标数据异步上报到后端，失败不影响主流程
 * @param {Object|Object[]} payload - 单条或批量 RUM 指标数据
 * @returns {Promise<void>}
 */
export async function sendRumBeacon(payload) {
  const body = JSON.stringify(payload)

  // 优先使用 sendBeacon：在页面卸载时仍能可靠发送，且不会阻塞导航
  // 注意：sendBeacon 直接传字符串时 Content-Type 会被浏览器强制置为 text/plain，
  // 后端 express.json() 不解析该类型，导致 req.body 为空而被白名单校验拒绝（400）。
  // 必须显式包装为 application/json 类型的 Blob，与 analyticsService 保持一致。
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' })
    const sent = navigator.sendBeacon(RUM_ENDPOINT, blob)
    if (sent) {
      return
    }
  }

  // 降级方案：fetch keepalive 保证页面关闭时也能继续传输
  try {
    const response = await fetch(RUM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body,
      keepalive: true,
      credentials: 'include'
    })

    if (!response.ok) {
      // 静默失败：RUM 上报不应影响用户体验，仅在开发环境输出警告
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[RUM] 上报失败:', response.status)
      }
    }
  } catch {
    // 静默失败：网络异常不应中断主流程
  }
}
