/**
 * @file 站点统计服务
 * @description 封装 /api/stats 调用
 * @module services/statsService
 */

import httpClient from './http.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('StatsService')
const BASE_URL = '/stats'

/**
 * 获取站点统计数据
 * @returns {Promise<object>} 统计数据，包含 stats 数组和 summary 对象
 */
async function getStats() {
  try {
    const response = await httpClient.get(BASE_URL)
    return response.data
  } catch (error) {
    const err = /** @type {any} */ (error)
    logger.warn('获取站点统计失败:', err.response?.data || err.message)
    throw error
  }
}

export { getStats }
export default { getStats }
