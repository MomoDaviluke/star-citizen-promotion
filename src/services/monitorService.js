/**
 * @file 监控服务
 * @description 封装资源指标、告警列表、告警认领与前端问题回报接口。
 *              回报优先使用 sendBeacon，页面卸载时也能可靠送达。
 * @module services/monitorService
 */

import httpClient from './http.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('MonitorService')

/** 监控接口基址（httpClient 已统一拼上 /api/v1 前缀） */
const BASE_URL = '/monitor'

/** 问题回报端点：sendBeacon 需要完整路径，不能使用相对基址 */
const REPORT_ENDPOINT = '/monitor/reports'

const ALLOWED_CATEGORIES = new Set(['frontend_error', 'slow_page', 'api_failure', 'manual'])

/**
 * 获取实时监控指标
 * @description 返回最新采样点、历史序列、告警规则与活跃告警统计
 * @param {object} [params] 查询参数
 * @param {number} [params.points] 历史序列降采样点数（默认 60，后端上限 300）
 * @returns {Promise<object>} 监控指标
 */
async function getMetrics(params = {}) {
  try {
    const response = await httpClient.get(`${BASE_URL}/metrics`, { params })
    return response.data
  } catch (error) {
    logger.warn('获取监控指标失败:', error.response?.data || error.message)
    throw error
  }
}

/**
 * 获取告警列表
 * @param {object} [params] 过滤参数
 * @param {string} [params.status] 告警状态：active / acked / resolved
 * @param {string} [params.severity] 告警级别：warn / critical
 * @param {number} [params.limit] 返回条数
 * @returns {Promise<Array>} 告警列表
 */
async function getAlerts(params = {}) {
  try {
    const response = await httpClient.get(`${BASE_URL}/alerts`, { params })
    return response.data
  } catch (error) {
    logger.warn('获取告警列表失败:', error.response?.data || error.message)
    throw error
  }
}

/**
 * 认领告警
 * @param {string} id 告警 ID
 * @returns {Promise<object>} 认领后的告警
 */
async function ackAlert(id) {
  try {
    const response = await httpClient.post(`${BASE_URL}/alerts/${id}/ack`)
    return response.data
  } catch (error) {
    logger.warn('认领告警失败:', error.response?.data || error.message)
    throw error
  }
}

/**
 * 获取前端问题回报列表
 * @param {object} [params] 查询参数
 * @param {string} [params.requestId] 按请求 ID 精确查找，用于与后端告警串联
 * @returns {Promise<Array>} 回报列表
 */
async function getReports(params = {}) {
  try {
    const response = await httpClient.get(`${BASE_URL}/reports`, { params })
    return response.data
  } catch (error) {
    logger.warn('获取问题回报失败:', error.response?.data || error.message)
    throw error
  }
}

/**
 * 采集浏览器环境信息
 * @description 回报时一并上报，便于复现「只在某些浏览器出现」的问题
 * @returns {object|null} 浏览器环境，非浏览器环境返回 null
 */
function collectBrowserInfo() {
  if (typeof window === 'undefined') return null
  return {
    userAgent: navigator.userAgent || '',
    language: navigator.language || '',
    url: window.location.href,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    reportedAt: new Date().toISOString()
  }
}

/**
 * 上报前端问题
 * @description 静默失败：监控回报不应影响用户操作
 * @param {object} input 回报内容
 * @param {string} [input.category] 问题类别，未知值回落为 manual
 * @param {string} [input.message] 问题描述
 * @param {object} [input.payload] 附加数据（控制台错误、失败请求等）
 * @param {string} [input.requestId] 关联的后端请求 ID
 * @returns {Promise<void>}
 */
async function reportIssue({ category = 'manual', message, payload, requestId } = {}) {
  if (!message && !payload) {
    logger.warn('问题回报缺少 message 与 payload，已跳过')
    return
  }

  const body = JSON.stringify({
    category: ALLOWED_CATEGORIES.has(category) ? category : 'manual',
    message: message || null,
    payload: payload || null,
    requestId: requestId || null,
    browser: collectBrowserInfo()
  })

  // sendBeacon 直接传字符串会被浏览器强制置为 text/plain，后端解析不到请求体。
  // 必须包装成 application/json 的 Blob，与 analyticsService 保持一致。
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' })
    if (navigator.sendBeacon(REPORT_ENDPOINT, blob)) {
      return
    }
  }

  try {
    const response = await fetch(REPORT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'include'
    })
    if (!response.ok) {
      logger.warn('问题回报失败:', response.status)
    }
  } catch (error) {
    logger.warn('问题回报异常:', error.message)
  }
}

const monitorService = {
  getMetrics,
  getAlerts,
  ackAlert,
  getReports,
  reportIssue
}

export { getMetrics, getAlerts, ackAlert, getReports, reportIssue, monitorService }
