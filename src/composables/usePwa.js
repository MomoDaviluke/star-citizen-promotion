/**
 * @file PWA Service Worker 注册与更新管理
 * @description 封装 vite-plugin-pwa 的 Service Worker 注册和更新生命周期
 *              提供响应式的更新就绪状态、离线就绪状态、手动更新与跳过等待方法
 * @module composables/usePwa
 */

import { ref } from 'vue'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('PWA')

/** 是否有新版本就绪 */
const needRefresh = ref(false)

/** 是否离线可用 */
const offlineReady = ref(false)

/** Service Worker 是否已注册 */
const swRegistered = ref(false)

/** 触发更新的函数，由 register 时注入 */
let updateSWHandler = null

/**
 * 注册 Service Worker
 * @description 仅在生产环境注册，开发环境跳过
 *              使用 vite-plugin-pwa 的 virtual:pwa-register 虚拟模块
 * @returns {Promise<void>}
 */
export async function registerPWA() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  try {
    // virtual:pwa-register/vue 由 vite-plugin-pwa 在构建时注入
    // 开发环境下该模块不存在，因此使用动态导入
    const { useRegisterSW } = await import('virtual:pwa-register/vue')

    const { updateServiceWorker, needRefresh: nr, offlineReady: or } = useRegisterSW({
      immediate: true,
      onRegisteredSW(swUrl, registration) {
        swRegistered.value = true
        // 每小时检查一次更新
        if (registration) {
          setInterval(() => {
            registration.update().catch(() => {})
          }, 60 * 60 * 1000)
        }
      },
      onRegisterError(error) {
        logger.error('Service Worker 注册失败:', error)
      }
    })

    updateSWHandler = updateServiceWorker

    // 同步 vite-plugin-pwa 的响应式 ref 到本模块全局 ref
    if (nr) {
      // 监听变化
      const sync = () => {
        needRefresh.value = nr.value
        offlineReady.value = or.value
      }
      // 立即同步一次
      sync()
      // Vue 响应式 watch
      const { watch } = await import('vue')
      watch(nr, sync, { immediate: true })
      watch(or, sync, { immediate: true })
    }
  } catch (error) {
    // 开发环境或不支持 PWA 时静默失败
    if (import.meta.env.PROD) {
      logger.warn('注册跳过:', error.message)
    }
  }
}

/**
 * 接受更新并刷新页面
 * @returns {Promise<void>}
 */
export async function applyUpdate() {
  if (typeof updateSWHandler === 'function') {
    await updateSWHandler(true)
  } else {
    // 回退：直接刷新
    window.location.reload()
  }
}

/**
 * 取消更新提示
 */
export function dismissUpdate() {
  needRefresh.value = false
}

/**
 * 取消离线就绪提示
 */
export function dismissOfflineReady() {
  offlineReady.value = false
}

/**
 * 使用 PWA 状态
 * @returns {Object} PWA 相关响应式状态与方法
 */
export function usePwa() {
  return {
    needRefresh,
    offlineReady,
    swRegistered,
    applyUpdate,
    dismissUpdate,
    dismissOfflineReady,
    registerPWA
  }
}

export default usePwa
