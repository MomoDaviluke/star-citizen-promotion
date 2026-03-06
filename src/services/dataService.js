/**
 * @file 数据服务
 * @description 统一的数据获取 API，支持从后端或静态数据源获取数据
 * @module services/dataService
 */

import httpClient from './http.js'
import { navItems, teamStats, acePilots, members, projects } from '@/data/siteContent.js'

const USE_API = import.meta.env.VITE_USE_API === 'true'

/**
 * 数据服务 API
 */
export const dataService = {
  /**
   * 获取导航菜单
   * @returns {Promise<Array>} 导航菜单项
   */
  async getNavItems() {
    return navItems
  },

  /**
   * 获取团队统计数据
   * @returns {Promise<Object>} 统计数据
   */
  async getStats() {
    if (USE_API) {
      try {
        const response = await httpClient.get('/stats')
        if (response.success) {
          return {
            stats: response.data.stats,
            summary: response.data.summary
          }
        }
      } catch (error) {
        console.warn('从 API 获取统计数据失败，使用静态数据:', error)
      }
    }
    return { stats: teamStats, summary: null }
  },

  /**
   * 获取王牌飞行员列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 飞行员列表和分页信息
   */
  async getPilots(params = {}) {
    if (USE_API) {
      try {
        const response = await httpClient.get('/pilots', params)
        if (response.success) {
          return response
        }
      } catch (error) {
        console.warn('从 API 获取飞行员数据失败，使用静态数据:', error)
      }
    }
    return {
      success: true,
      data: acePilots,
      pagination: { total: acePilots.length, limit: 50, offset: 0, hasMore: false }
    }
  },

  /**
   * 获取单个飞行员详情
   * @param {string} id - 飞行员 ID
   * @returns {Promise<Object>} 飞行员详情
   */
  async getPilot(id) {
    if (USE_API) {
      try {
        return await httpClient.get(`/pilots/${id}`)
      } catch (error) {
        console.warn('从 API 获取飞行员详情失败:', error)
      }
    }
    const pilot = acePilots.find((p) => p.id === id)
    return { success: !!pilot, data: pilot, error: pilot ? null : '飞行员不存在' }
  },

  /**
   * 获取成员列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 成员列表和分页信息
   */
  async getMembers(params = {}) {
    if (USE_API) {
      try {
        const response = await httpClient.get('/members', params)
        if (response.success) {
          return response
        }
      } catch (error) {
        console.warn('从 API 获取成员数据失败，使用静态数据:', error)
      }
    }
    return {
      success: true,
      data: members,
      pagination: { total: members.length, limit: 50, offset: 0, hasMore: false }
    }
  },

  /**
   * 获取单个成员详情
   * @param {string} id - 成员 ID
   * @returns {Promise<Object>} 成员详情
   */
  async getMember(id) {
    if (USE_API) {
      try {
        return await httpClient.get(`/members/${id}`)
      } catch (error) {
        console.warn('从 API 获取成员详情失败:', error)
      }
    }
    const member = members.find((m) => m.id === id)
    return { success: !!member, data: member, error: member ? null : '成员不存在' }
  },

  /**
   * 获取项目列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 项目列表和分页信息
   */
  async getProjects(params = {}) {
    if (USE_API) {
      try {
        const response = await httpClient.get('/projects', params)
        if (response.success) {
          return response
        }
      } catch (error) {
        console.warn('从 API 获取项目数据失败，使用静态数据:', error)
      }
    }
    return {
      success: true,
      data: projects,
      pagination: { total: projects.length, limit: 50, offset: 0, hasMore: false }
    }
  },

  /**
   * 获取单个项目详情
   * @param {string} id - 项目 ID
   * @returns {Promise<Object>} 项目详情
   */
  async getProject(id) {
    if (USE_API) {
      try {
        return await httpClient.get(`/projects/${id}`)
      } catch (error) {
        console.warn('从 API 获取项目详情失败:', error)
      }
    }
    const project = projects.find((p) => p.id === id)
    return { success: !!project, data: project, error: project ? null : '项目不存在' }
  },

  /**
   * 提交入队申请
   * @param {Object} data - 申请数据
   * @returns {Promise<Object>} 提交结果
   */
  async submitApplication(data) {
    if (USE_API) {
      return httpClient.post('/applications', data)
    }
    console.log('模拟提交申请:', data)
    return {
      success: true,
      message: '申请提交成功（模拟）',
      data: { id: 'mock-id', status: 'pending' }
    }
  },

  /**
   * 创建成员（管理员）
   * @param {Object} data - 成员数据
   * @returns {Promise<Object>} 创建结果
   */
  async createMember(data) {
    return httpClient.post('/members', data)
  },

  /**
   * 更新成员（管理员）
   * @param {string} id - 成员 ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateMember(id, data) {
    return httpClient.put(`/members/${id}`, data)
  },

  /**
   * 删除成员（管理员）
   * @param {string} id - 成员 ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteMember(id) {
    return httpClient.delete(`/members/${id}`)
  },

  /**
   * 创建项目（管理员）
   * @param {Object} data - 项目数据
   * @returns {Promise<Object>} 创建结果
   */
  async createProject(data) {
    return httpClient.post('/projects', data)
  },

  /**
   * 更新项目（管理员）
   * @param {string} id - 项目 ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateProject(id, data) {
    return httpClient.put(`/projects/${id}`, data)
  },

  /**
   * 删除项目（管理员）
   * @param {string} id - 项目 ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteProject(id) {
    return httpClient.delete(`/projects/${id}`)
  },

  /**
   * 创建飞行员（管理员）
   * @param {Object} data - 飞行员数据
   * @returns {Promise<Object>} 创建结果
   */
  async createPilot(data) {
    return httpClient.post('/pilots', data)
  },

  /**
   * 更新飞行员（管理员）
   * @param {string} id - 飞行员 ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updatePilot(id, data) {
    return httpClient.put(`/pilots/${id}`, data)
  },

  /**
   * 删除飞行员（管理员）
   * @param {string} id - 飞行员 ID
   * @returns {Promise<Object>} 删除结果
   */
  async deletePilot(id) {
    return httpClient.delete(`/pilots/${id}`)
  },

  /**
   * 获取申请列表（管理员）
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 申请列表和分页信息
   */
  async getApplications(params = {}) {
    if (USE_API) {
      try {
        const response = await httpClient.get('/applications', params)
        if (response.success) {
          return response
        }
      } catch (error) {
        console.warn('从 API 获取申请数据失败:', error)
      }
    }
    return {
      success: true,
      data: [],
      pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
    }
  },

  /**
   * 更新申请状态（管理员）
   * @param {string} id - 申请 ID
   * @param {string} status - 新状态
   * @param {string} [note] - 备注
   * @returns {Promise<Object>} 更新结果
   */
  async updateApplicationStatus(id, status, note) {
    return httpClient.put(`/applications/${id}/status`, { status, note })
  },

  /**
   * 获取活动日志
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 日志列表
   */
  async getActivityLogs(params = {}) {
    return httpClient.get('/activity-logs', params)
  }
}

export default dataService
