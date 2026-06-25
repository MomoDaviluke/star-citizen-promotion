/**
 * @file 舰队服务模块
 * @description 封装所有舰队相关的 API 调用（飞船管理）
 * @module services/fleetService
 * @author Full-stack Team
 */

import httpClient from './http.js'
import { createLogger } from '../utils/logger.js'
const logger = createLogger('FleetService')


const BASE_URL = '/api/fleet'

/**
 * 获取舰队列表
 * @param {Object} [params] - 查询参数
 * @param {string} [params.category] - 飞船类别筛选
 * @param {string} [params.status] - 状态筛选
 * @param {string} [params.sortBy] - 排序字段
 * @param {string} [params.order] - 排序方向
 * @returns {Promise<Object>} 包含 data 的响应
 */
async function getFleet(params = {}) {
  try {
    const response = await httpClient.get(BASE_URL, { params })
    return response.data
  } catch (error) {
    logger.warn('获取舰队列表失败:', error.response?.data || error.message)
    throw error
  }
}

/**
 * 获取单艘飞船详情
 * @param {string} shipId - 飞船ID
 * @returns {Promise<Object>} 包含 data 的响应
 */
async function getShip(shipId) {
  if (!shipId) throw new Error('shipId is required')
  
  try {
    const response = await httpClient.get(`${BASE_URL}/${shipId}`)
    return response.data
  } catch (error) {
    logger.warn('获取飞船详情失败:', error.response?.data || error.message)
    throw error
  }
}

/**
 * 创建飞船记录（管理员）
 * @param {Object} shipData - 飞船数据
 * @param {string} shipData.name - 飞船名称
 * @param {string} shipData.callsign - 呼号
 * @param {string} shipData.ship - 飞船型号
 * @param {string} shipData.category - 类别（combat|transport|explore）
 * @param {number} [shipData.value] - 价值（UEC）
 * @param {string} [shipData.status] - 状态
 * @param {string} [shipData.image] - 图片URL
 * @param {string} [shipData.description] - 描述
 * @returns {Promise<Object>} 包含 data 的响应
 */
async function createShip(shipData) {
  if (!shipData?.name || !shipData?.ship) {
    throw new Error('飞船名称和型号不能为空')
  }

  try {
    const response = await httpClient.post(BASE_URL, shipData)
    return response.data
  } catch (error) {
    logger.error('创建飞船失败:', error.response?.data || error.message)
    throw error
  }
}

/**
 * 更新飞船信息
 * @param {string} shipId - 飞船ID
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} 包含 data 的响应
 */
async function updateShip(shipId, updates) {
  if (!shipId) throw new Error('shipId is required')
  
  try {
    const response = await httpClient.patch(`${BASE_URL}/${shipId}`, updates)
    return response.data
  } catch (error) {
    logger.error('更新飞船失败:', error.response?.data || error.message)
    throw error
  }
}

/**
 * 删除飞船记录
 * @param {string} shipId - 飞船ID
 * @returns {Promise<void>}
 */
async function deleteShip(shipId) {
  if (!shipId) throw new Error('shipId is required')
  
  try {
    await httpClient.delete(`${BASE_URL}/${shipId}`)
  } catch (error) {
    logger.error('删除飞船失败:', error.response?.data || error.message)
    throw error
  }
}

/**
 * 获取舰队统计信息
 * @returns {Promise<Object>} 统计信息
 */
async function getFleetStats() {
  try {
    const response = await httpClient.get(`${BASE_URL}/stats`)
    return response.data
  } catch (error) {
    logger.warn('获取舰队统计失败:', error.response?.data || error.message)
    throw error
  }
}

const fleetService = {
  getFleet,
  getShip,
  createShip,
  updateShip,
  deleteShip,
  getFleetStats
}

export {
  getFleet,
  getShip,
  createShip,
  updateShip,
  deleteShip,
  getFleetStats,
  fleetService
}
