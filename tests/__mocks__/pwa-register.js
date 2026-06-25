/**
 * @file virtual:pwa-register/vue 的测试替身
 * @description vite-plugin-pwa 在构建时注入的虚拟模块，Vitest 中不存在
 *              通过 vitest.config.js 的 resolve.alias 映射到此文件
 */
import { ref } from 'vue'

export function useRegisterSW(options = {}) {
  const needRefresh = ref(false)
  const offlineReady = ref(false)

  // 模拟注册回调
  if (options.onRegisteredSW) {
    options.onRegisteredSW('/sw.js', null)
  }

  return {
    updateServiceWorker: async () => {},
    needRefresh,
    offlineReady
  }
}
