/**
 * @file 图片 CDN 工具
 * @description 构建时注入 CDN base URL，运行时提供统一图片路径转换
 * @module src/utils/cdn
 */

/**
 * CDN 基础 URL
 * @description 通过环境变量 VITE_CDN_BASE_URL 配置
 *              开发环境默认为空（使用本地资源）
 *              生产环境示例：https://cdn.example.com 或 https://img.example.com
 */
const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL || ''

/** CDN 是否已启用 */
const CDN_ENABLED = CDN_BASE_URL.length > 0

/**
 * 将相对路径转换为 CDN 完整 URL
 * @param {string} path - 相对路径或已带协议的完整 URL
 * @returns {string} CDN 完整 URL
 *
 * @example
 * cdnUrl('/images/ships/aurora.webp')
 * // => 'https://cdn.example.com/images/ships/aurora.webp'
 *
 * cdnUrl('https://other-cdn.com/img.jpg')
 * // => 'https://other-cdn.com/img.jpg' (已带协议，不转换)
 */
export function cdnUrl(path) {
  if (!CDN_ENABLED || !path) return path

  // 已带协议的外部 URL 不转换
  if (/^https?:\/\//.test(path)) return path

  // data: URL 不转换
  if (path.startsWith('data:')) return path

  // 拼接 CDN base + 路径（确保无重复斜杠）
  const base = CDN_BASE_URL.replace(/\/+$/, '')
  const cleanPath = path.replace(/^\/+/, '')
  return `${base}/${cleanPath}`
}

/**
 * 获取 CDN 基础 URL
 * @returns {string} CDN 基础 URL 或空字符串
 */
export function getCdnBaseUrl() {
  return CDN_BASE_URL
}

/**
 * CDN 是否已启用
 * @returns {boolean}
 */
export function isCdnEnabled() {
  return CDN_ENABLED
}

/**
 * Vue 全局属性版本：可直接在模板中使用 $cdnUrl
 * @example
 * // main.js 中注册
 * app.config.globalProperties.$cdnUrl = cdnUrl
 *
 * // 模板中
 * <img :src="$cdnUrl('/images/ships/aurora.webp')" />
 */

export default {
  cdnUrl,
  getCdnBaseUrl,
  isCdnEnabled
}
