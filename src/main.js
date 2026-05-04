/**
 * @file 应用入口文件
 * @description Vue 应用初始化与全局配置入口，负责创建应用实例、注册插件并挂载到 DOM
 * @module main
 */

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/base.css'

const app = createApp(App)

app.use(router)

/**
 * 全局错误处理器
 * @description 捕获组件渲染和生命周期中的未处理错误
 */
app.config.errorHandler = (err, instance, info) => {
  // 避免在开发环境输出过多噪音（Vite 已有 HMR 错误覆盖）
  if (import.meta.env.PROD) {
    console.error('[全局错误]', {
      message: err.message,
      component: instance?.$options?.name || 'Unknown',
      info
    })
  }

  // 触发全局事件，App.vue 等可以监听并展示错误通知
  window.dispatchEvent(new CustomEvent('app:error', {
    detail: { message: err.message, info }
  }))
}

/**
 * 全局警告处理器（仅生产环境）
 */
app.config.warnHandler = import.meta.env.PROD
  ? (msg, _instance, _trace) => {
      // 生产环境静默警告，避免泄露内部信息
      console.debug('[Vue Warn]', msg)
    }
  : undefined

app.mount('#app')
