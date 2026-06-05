/**
 * @file 应用入口文件
 * @description Vue 应用初始化与全局配置入口，负责创建应用实例、注册插件并挂载到 DOM
 * @module main
 * @author 星际公民团队站
 * @version 2.0.0
 */

// 从 Vue 核心库导入 createApp 函数，用于创建 Vue 3 应用实例
import { createApp } from 'vue'
// 导入 Pinia 用于状态管理
import { createPinia } from 'pinia'
// 导入根组件 App.vue，作为应用的根节点
import App from './App.vue'
// 导入路由实例，管理应用的单页面导航
import router from './router'
// 导入全局基础样式文件，包含 CSS 变量、重置样式和工具类
import './styles/base.css'
// 导入主题变量系统
import './styles/variables.css'
// 导入动画关键帧库
import './styles/animations.css'

/**
 * 预应用主题
 * @description 在应用创建前读取 localStorage / 系统偏好并设置 data-theme
 *              避免首屏闪烁（FOUC）
 */
function applyInitialTheme() {
  try {
    const stored = localStorage.getItem('star-citizen-theme')
    let theme = stored
    if (theme !== 'light' && theme !== 'dark') {
      theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    }
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '')
  } catch {
    // localStorage 不可用时静默使用暗黑主题
  }
}
applyInitialTheme()

// 导入错误报告服务，集成 Sentry 进行生产环境错误监控
import { initErrorReporting } from './services/errorReporting.js'
// 导入全局基础组件
import BaseButton from './components/common/BaseButton.vue'
import BaseCard from './components/common/BaseCard.vue'
import BaseModal from './components/common/BaseModal.vue'
import BaseBadge from './components/common/BaseBadge.vue'
import BaseTooltip from './components/common/BaseTooltip.vue'
import { createLogger } from './utils/logger.js'
import { vScrollReveal } from './directives/scrollReveal.js'
import { vRipple } from './directives/ripple.js'
const logger = createLogger('App')


/**
 * 创建 Vue 应用实例
 * @description 使用 createApp 函数创建应用实例，这是 Vue 3 的标志性特性
 *              相比 Vue 2 的 new Vue()，createApp 允许多个应用实例共存
 */
const app = createApp(App)

/**
 * 注册 Pinia 状态管理插件
 * @description Pinia 是 Vue 官方推荐的状态管理方案，替代 Vuex
 *              提供组合式 API 风格的 store，更好的 TypeScript 支持
 */
const pinia = createPinia()
app.use(pinia)

/**
 * 初始化认证状态
 * @description 应用启动时通过 /auth/me 恢复用户信息
 *              httpOnly cookie 由浏览器自动携带，无需前端管理 Token
 *              必须在 pinia 注册之后、router 之前调用
 */
import { useAuthStore } from './stores/auth.js'
const authStore = useAuthStore(pinia)
authStore.initializeAuth()

/**
 * 监听认证过期事件
 * @description 当 httpOnly cookie 中的 Token 过期且刷新失败时
 *              http.js 会派发 auth:session-expired 事件
 *              此处监听并自动重定向到登录页
 */
window.addEventListener('auth:session-expired', () => {
  authStore.user = null
  router.push('/login')
})

/**
 * 注册 Vue Router 插件
 * @description 将路由实例注册到应用中，使所有组件都能使用路由功能
 *              包括 $route、$router 等属性和 <router-view> 组件
 */
app.use(router)

/**
 * 注册全局基础组件
 * @description 注册后可在任意组件中使用，无需重复导入
 *              适合高频使用的通用组件
 */
app.component('BaseButton', BaseButton)
app.component('BaseCard', BaseCard)
app.component('BaseModal', BaseModal)
app.component('BaseBadge', BaseBadge)
app.component('BaseTooltip', BaseTooltip)

/**
 * 注册全局自定义指令
 * @description v-scroll-reveal: 基于 GSAP ScrollTrigger 的声明式滚动揭示动画
 *              使用方式：v-scroll-reveal="'fadeUp'" 或 v-scroll-reveal="{ animation: 'scaleIn', delay: 0.2 }"
 */
app.directive('scroll-reveal', vScrollReveal)

/**
 * 注册全局涟漪指令
 * @description v-ripple: 点击时从点击位置产生涟漪扩散动画
 *              使用方式：v-ripple
 */
app.directive('ripple', vRipple)

/**
 * 初始化错误报告服务
 * @description 在生产环境且配置了 Sentry DSN 时启用错误上报
 *              帮助开发团队及时发现和修复线上问题
 * @param {import('vue').App} app - Vue 应用实例
 * @param {import('vue-router').Router} router - Vue Router 实例
 */
initErrorReporting(app, router)

/**
 * 全局错误处理器
 * @description 捕获组件渲染和生命周期中的未处理错误
 *              作为最后一道防线，防止错误导致应用崩溃
 *              生产环境自动上报到 Sentry，并展示用户友好的错误提示
 * @param {Error} err - 错误对象
 * @param {import('vue').ComponentPublicInstance|null} instance - 发生错误的组件实例
 * @param {string} info - 错误信息，说明错误发生在哪个生命周期钩子或渲染阶段
 */
app.config.errorHandler = (err, instance, info) => {
  // 将 unknown 类型的 err 断言为 Error，确保可以安全访问 message 和 stack
  const error = err instanceof Error ? err : new Error(String(err))
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    component: instance?.$options?.name || 'Unknown',
    info,
    url: window.location.href,
    timestamp: new Date().toISOString()
  }

  // 生产环境：上报到 Sentry 并记录结构化日志
  if (import.meta.env.PROD) {
    logger.error('[全局错误]', errorInfo)

    // 动态导入 Sentry 进行错误上报（避免阻塞应用启动）
    if (import.meta.env.VITE_SENTRY_DSN) {
      import('./services/errorReporting.js').then(({ captureException }) => {
        captureException(error, {
          component: errorInfo.component,
          info,
          url: errorInfo.url
        })
      })
    }
  }

  // 触发全局自定义事件，App.vue 等组件可以监听并展示错误通知
  // 这种事件驱动的方式实现了跨组件的通信，无需依赖全局状态管理
  window.dispatchEvent(new CustomEvent('app:error', {
    detail: errorInfo
  }))
}

/**
 * 全局警告处理器（仅生产环境）
 * @description 在生产环境静默 Vue 警告，避免泄露内部实现细节
 *              开发环境保留默认行为，方便调试
 */
app.config.warnHandler = import.meta.env.PROD
  ? (msg) => {
    // 生产环境将警告降级为 debug 级别，不干扰正常日志
    logger.debug('[Vue Warn]', msg)
  }
  : undefined

/**
 * 挂载应用到 DOM
 * @description 将 Vue 应用挂载到 id 为 'app' 的 DOM 元素上
 *              这是应用启动的最后一步，之后用户即可看到交互界面
 */
app.mount('#app')

/**
 * 注册 PWA Service Worker
 * @description 仅生产环境有效，提供离线访问与自动更新能力
 *              vite-plugin-pwa 会在构建时注入 virtual:pwa-register/vue 虚拟模块
 */
if (import.meta.env.PROD) {
  import('./composables/usePwa.js').then(({ registerPWA }) => {
    registerPWA()
  })
}
