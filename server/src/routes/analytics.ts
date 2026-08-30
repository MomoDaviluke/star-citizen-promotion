/**
 * @file 转化埋点接收路由
 * @description 接收前端上报的转化漏斗事件（申请提交/招募官对话/页面访问/外链引流），
 *              经事件白名单校验后写入结构化日志，供日志聚合分析转化漏斗
 * @module server/routes/analytics
 */

import { Router, Request, Response, NextFunction } from 'express'
import logger from '../utils/logger.js'

const router = Router()

/**
 * 允许接收的转化事件白名单
 * @description 防止任意字符串污染日志与分析系统
 */
const ALLOWED_EVENTS = new Set([
  'page_view',
  'login_success',
  'application_form_start',
  'application_submit_success',
  'application_submit_fail',
  'recruiter_chat_turn',
  'recruiter_profile_prefill',
  'external_link_click'
])

/**
 * 验证单条事件对象
 * @param {unknown} item - 待验证的事件对象
 * @returns {boolean}
 */
function isValidEvent(item: unknown): item is Record<string, unknown> {
  if (typeof item !== 'object' || item === null) {
    return false
  }

  const event = item as Record<string, unknown>

  if (typeof event.event !== 'string' || !ALLOWED_EVENTS.has(event.event)) {
    return false
  }

  if (event.properties !== undefined && (typeof event.properties !== 'object' || event.properties === null)) {
    return false
  }

  return true
}

/**
 * 将请求体规范化为事件数组
 * @param {unknown} body - 请求体
 * @returns {Array<Record<string, unknown>>|null} 规范化后的事件数组，无效时返回 null
 */
function normalizeEvents(body: unknown): Array<Record<string, unknown>> | null {
  if (Array.isArray(body)) {
    return body
  }

  if (typeof body === 'object' && body !== null) {
    return [body as Record<string, unknown>]
  }

  return null
}

/**
 * POST /api/analytics
 * @description 接收单条或批量转化事件，白名单校验后写入结构化日志
 */
router.post('/', (req: Request, res: Response, _next: NextFunction) => {
  const events = normalizeEvents(req.body)

  if (events === null) {
    res.status(400).json({
      success: false,
      error: '请求体必须是对象或数组'
    })
    return
  }

  if (events.length === 0) {
    res.status(400).json({
      success: false,
      error: '事件列表不能为空'
    })
    return
  }

  const invalidIndex = events.findIndex((item) => !isValidEvent(item))
  if (invalidIndex !== -1) {
    res.status(400).json({
      success: false,
      error: `第 ${invalidIndex + 1} 条事件无效：event 不在白名单或 properties 格式错误`
    })
    return
  }

  // 写入结构化日志，便于日志聚合分析转化漏斗
  logger.info('Analytics event received', {
    count: events.length,
    events: events.map((evt) => ({
      event: evt.event,
      properties: evt.properties,
      ts: evt.ts
    })),
    ip: req.ip,
    userAgent: req.headers['user-agent']
  })

  // 返回 204 No Content，前端无需处理响应体
  res.status(204).send()
})

export default router
