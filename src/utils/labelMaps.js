/**
 * @file 统一标签映射工具
 * @description 提供各种状态、角色、分类的标签映射函数
 *              消除组件中的重复映射逻辑，确保显示一致性
 * @module utils/labelMaps
 */

/**
 * 项目状态映射
 */
export const PROJECT_STATUS_MAP = {
  active: '进行中',
  planning: '计划中',
  completed: '已完成',
  paused: '已暂停'
}

/**
 * 成员状态映射
 */
export const MEMBER_STATUS_MAP = {
  active: '活跃',
  inactive: '非活跃'
}

/**
 * 申请状态映射
 */
export const APPLICATION_STATUS_MAP = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝'
}

/**
 * 用户角色映射
 */
export const USER_ROLE_MAP = {
  admin: '管理员',
  member: '成员',
  guest: '访客'
}

/**
 * 在线时间映射
 */
export const AVAILABILITY_MAP = {
  weekdays: '工作日晚上',
  weekends: '周末全天',
  flexible: '时间灵活',
  limited: '时间有限'
}

/**
 * 通用标签映射函数
 * @param {string} value - 需要映射的值
 * @param {Object} map - 映射表对象
 * @param {string} [defaultValue] - 默认值，默认返回原始值
 * @returns {string} 映射后的标签
 */
export function getLabel(value, map, defaultValue) {
  if (!value || !map) return defaultValue || value
  return map[value] || (defaultValue !== undefined ? defaultValue : value)
}

/**
 * 项目状态标签
 * @param {string} status - 项目状态
 * @returns {string} 中文标签
 */
export function getProjectStatusLabel(status) {
  return getLabel(status, PROJECT_STATUS_MAP)
}

/**
 * 成员状态标签
 * @param {string} status - 成员状态
 * @returns {string} 中文标签
 */
export function getMemberStatusLabel(status) {
  return getLabel(status, MEMBER_STATUS_MAP)
}

/**
 * 申请状态标签
 * @param {string} status - 申请状态
 * @returns {string} 中文标签
 */
export function getApplicationStatusLabel(status) {
  return getLabel(status, APPLICATION_STATUS_MAP)
}

/**
 * 用户角色标签
 * @param {string} role - 用户角色
 * @returns {string} 中文标签
 */
export function getUserRoleLabel(role) {
  return getLabel(role, USER_ROLE_MAP, '未知')
}

/**
 * 在线时间标签
 * @param {string} availability - 在线时间
 * @returns {string} 中文标签
 */
export function getAvailabilityLabel(availability) {
  return getLabel(availability, AVAILABILITY_MAP)
}
