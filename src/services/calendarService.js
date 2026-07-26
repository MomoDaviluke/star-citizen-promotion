/**
 * 活动日历服务模块
 * @description 封装所有活动相关的 API 调用
 * @module services/calendarService
 * @author Full-stack Team
 */

import httpClient from './http.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('CalendarService')

const BASE_URL = '/events'

/**
 * 后端 SQL 字段（snake_case）→ 前端字段（camelCase）映射
 * @description 后端 events 表用 start_time/end_time/creator_id，
 *              前端 store/组件约定用 startTime/endTime/creatorId。
 *              在 service 层做双向转换，保证前后端字段名惯例各自一致。
 */
const SNAKE_TO_CAMEL = {
  start_time: 'startTime',
  end_time: 'endTime',
  creator_id: 'creatorId',
  created_at: 'createdAt',
  updated_at: 'updatedAt'
}

const CAMEL_TO_SNAKE = Object.entries(SNAKE_TO_CAMEL).reduce((acc, [snake, camel]) => {
  acc[camel] = snake
  return acc
}, {})

/**
 * 将单个 event 对象的字段名从 snake_case 转为 camelCase
 * @param {Object} event - 后端返回的 event 对象
 * @returns {Object} 转换后的 event 对象
 */
function toCamelEvent(event) {
  if (!event || typeof event !== 'object') return event
  const result = { ...event }
  for (const [snake, camel] of Object.entries(SNAKE_TO_CAMEL)) {
    if (snake in result) {
      result[camel] = result[snake]
      delete result[snake]
    }
  }
  return result
}

/**
 * 将单个 event 对象的字段名从 camelCase 转为 snake_case
 * @param {Object} event - 前端传入的 event 对象
 * @returns {Object} 转换后的 event 对象
 */
function toSnakeEvent(event) {
  if (!event || typeof event !== 'object') return event
  const result = { ...event }
  for (const [camel, snake] of Object.entries(CAMEL_TO_SNAKE)) {
    if (camel in result) {
      result[snake] = result[camel]
      delete result[camel]
    }
  }
  return result
}

/** 批量转换 event 数组为 camelCase */
function toCamelEvents(events) {
  return Array.isArray(events) ? events.map(toCamelEvent) : events
}

/**
 * 获取活动列表
 * @param {Object} [params] - 查询参数
 * @param {string} [params.startDate] - 开始日期
 * @param {string} [params.endDate] - 结束日期
 * @param {string} [params.status] - 状态筛选
 * @param {string} [params.creatorId] - 创建者ID
 * @returns {Promise<Object>} 包含 data 的响应
 */
async function getEvents(params = {}) {
  try {
    const response = await httpClient.get(BASE_URL, params)
    // 后端返回 { success, data: events[], pagination }，这里解包 data 并转 camelCase
    const events = toCamelEvents(response.data)
    return { ...response, data: events }
  } catch (error) {
    const err = /** @type {any} */ (error)
    logger.warn('获取活动列表失败:', err.response?.data || err.message)
    throw error
  }
}

/**
 * 获取单个活动详情
 * @param {string} eventId - 活动ID
 * @returns {Promise<Object>} 包含 data 的响应
 */
async function getEvent(eventId) {
  if (!eventId) throw new Error('eventId is required')

  try {
    const response = await httpClient.get(`${BASE_URL}/${eventId}`)
    // 后端返回 { success, data: event }，这里解包 data 并转 camelCase
    return { ...response, data: toCamelEvent(response.data) }
  } catch (error) {
    const err = /** @type {any} */ (error)
    logger.warn('获取活动详情失败:', err.response?.data || err.message)
    throw error
  }
}

/**
 * 创建活动（管理员）
 * @param {Object} eventData - 活动数据
 * @param {string} eventData.title - 活动标题
 * @param {string} eventData.description - 活动描述
 * @param {string} eventData.startTime - 开始时间
 * @param {string} eventData.endTime - 结束时间
 * @param {string} [eventData.location] - 活动地点
 * @param {Array<string>} [eventData.participants] - 参与者ID列表
 * @returns {Promise<Object>} 包含 data 的响应
 */
async function createEvent(eventData) {
  if (!eventData?.title || !eventData?.startTime) {
    throw new Error('活动标题和时间不能为空')
  }

  try {
    // 发送前转 snake_case，返回后转 camelCase
    const response = await httpClient.post(BASE_URL, toSnakeEvent(eventData))
    return { ...response, data: toCamelEvent(response.data) }
  } catch (error) {
    const err = /** @type {any} */ (error)
    logger.error('创建活动失败:', err.response?.data || err.message)
    throw error
  }
}

/**
 * 更新活动
 * @param {string} eventId - 活动ID
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} 包含 data 的响应
 */
async function updateEvent(eventId, updates) {
  if (!eventId) throw new Error('eventId is required')

  try {
    // 发送前转 snake_case，返回后转 camelCase
    const response = await httpClient.patch(`${BASE_URL}/${eventId}`, toSnakeEvent(updates))
    return { ...response, data: toCamelEvent(response.data) }
  } catch (error) {
    const err = /** @type {any} */ (error)
    logger.error('更新活动失败:', err.response?.data || err.message)
    throw error
  }
}

/**
 * 删除活动
 * @param {string} eventId - 活动ID
 * @returns {Promise<void>}
 */
async function deleteEvent(eventId) {
  if (!eventId) throw new Error('eventId is required')
    
  try {
    await httpClient.delete(`${BASE_URL}/${eventId}`)
  } catch (error) {
    const err = /** @type {any} */ (error)
    logger.error('删除活动失败:', err.response?.data || err.message)
    throw error
  }
}

/**
 * 报名参加活动
 * @param {string} eventId - 活动ID
 * @returns {Promise<Object>} 包含 data 的响应
 */
async function joinEvent(eventId) {
  if (!eventId) throw new Error('eventId is required')

  try {
    const response = await httpClient.post(`${BASE_URL}/${eventId}/join`)
    return { ...response, data: toCamelEvent(response.data) }
  } catch (error) {
    const err = /** @type {any} */ (error)
    logger.error('报名失败:', err.response?.data || err.message)
    throw error
  }
}

/**
 * 取消报名
 * @param {string} eventId - 活动ID
 * @returns {Promise<Object>} 包含 data 的响应
 */
async function leaveEvent(eventId) {
  if (!eventId) throw new Error('eventId is required')

  try {
    const response = await httpClient.post(`${BASE_URL}/${eventId}/leave`)
    return { ...response, data: toCamelEvent(response.data) }
  } catch (error) {
    const err = /** @type {any} */ (error)
    logger.error('取消报名失败:', err.response?.data || err.message)
    throw error
  }
}

/**
 * 导出日历文件（ICS格式）
 * @param {string} [eventId] - 活动ID（不传则导出所有）
 * @returns {Promise<Blob>} ICS文件Blob
 */
async function exportCalendar(eventId) {
  try {
    const url = eventId ? `${BASE_URL}/${eventId}/ics` : `${BASE_URL}/export`
    const response = await httpClient.get(url, {
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    const err = /** @type {any} */ (error)
    logger.error('导出日历失败:', err.response?.data || err.message)
    throw error
  }
}

const calendarService = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  exportCalendar
}

export {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  exportCalendar,
  calendarService
}
