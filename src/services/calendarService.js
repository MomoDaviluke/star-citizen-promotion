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
    return response.data
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
    return response.data
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
    const response = await httpClient.post(BASE_URL, eventData)
    return response.data
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
    const response = await httpClient.patch(`${BASE_URL}/${eventId}`, updates)
    return response.data
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
    return response.data
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
    return response.data
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
