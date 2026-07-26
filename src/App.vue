<!--
  @file 应用根组件
  @description Vue 应用根组件，包含页面布局、路由视图、全局状态管理和无障碍支持
  @module App
-->

<template>
  <div class="app-shell">
    <!-- 站点头部导航 -->
    <SiteHeader />

    <!-- 跳转至主内容链接（屏幕阅读器与键盘用户） -->
    <a href="#main-content" class="skip-link">跳转至主内容</a>

    <!-- 主内容区域 -->
    <main id="main-content" class="page-main" tabindex="-1">
      <ErrorBoundary @error="handleGlobalError">
        <router-view v-slot="{ Component, route }">
          <PageTransition :key="route.path">
            <component :is="Component" :key="route.path" />
          </PageTransition>
        </router-view>
      </ErrorBoundary>
    </main>

    <!-- 站点底部 -->
    <SiteFooter />

    <!-- 全局加载指示器（页面内重型加载用） -->
    <LoadingIndicator ref="loadingIndicator" />

    <!-- 路由切换顶部进度条（不阻塞内容） -->
    <RouteProgress ref="routeProgress" />

    <!-- PWA 更新与离线提示 -->
    <PwaUpdateToast />

    <!-- 全局通知容器 -->
    <Teleport to="body">
      <TransitionGroup name="notification" tag="div" class="notification-container">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="['notification', `notification-${notification.type}`]"
          role="alert"
        >
          <span class="notification-icon">{{ notification.icon }}</span>
          <span class="notification-message">{{ notification.message }}</span>
          <button
            class="notification-close"
            @click="removeNotification(notification.id)"
            aria-label="关闭通知"
          >
            ×
          </button>
        </div>
      </TransitionGroup>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * 应用根组件
 * @description 负责应用的整体布局、路由过渡动画、全局状态提供和无障碍支持
 */

import { ref, onMounted, provide, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import SiteHeader from './components/layout/SiteHeader.vue'
import SiteFooter from './components/layout/SiteFooter.vue'
import PageTransition from './components/common/PageTransition.vue'
import LoadingIndicator from './components/common/LoadingIndicator.vue'
import RouteProgress from './components/common/RouteProgress.vue'
import ErrorBoundary from './components/common/ErrorBoundary.vue'
import PwaUpdateToast from './components/PwaUpdateToast.vue'
import { createLogger } from './utils/logger.js'

const logger = createLogger('App')

/** 路由实例 */
const router = useRouter()

/** 加载指示器组件引用 */
const loadingIndicator = ref(null)

/** 路由进度条组件引用 */
const routeProgress = ref(null)

/** 页面加载状态 */
const isPageLoading = ref(false)

/** 全局通知列表 */
const notifications = ref([])
let notificationId = 0

/** 向子组件提供页面加载状态 */
provide('isPageLoading', isPageLoading)

/**
 * 显示通知
 * @param {Object} options - 通知选项
 * @param {string} options.message - 通知消息
 * @param {string} [options.type] - 通知类型 (success, error, warning, info)
 * @param {number} [options.duration] - 显示时长（毫秒）
 */
function showNotification(options) {
  const { message, type = 'info', duration = 5000 } = options
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }

  const id = ++notificationId
  notifications.value.push({
    id,
    message,
    type,
    icon: icons[type] || icons.info
  })

  if (duration > 0) {
    setTimeout(() => {
      removeNotification(id)
    }, duration)
  }

  return id
}

/**
 * 移除通知
 * @param {number} id - 通知 ID
 */
function removeNotification(id) {
  const index = notifications.value.findIndex((n) => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

/**
 * 处理全局错误
 * @param {Object} errorInfo - 错误信息
 * @param {string} errorInfo.message - 错误消息
 * @param {string} [errorInfo.stack] - 错误堆栈
 * @param {string} [errorInfo.component] - 发生错误的组件名
 * @param {string} [errorInfo.info] - 错误上下文信息
 * @param {string} [errorInfo.url] - 错误发生时的页面 URL
 * @param {string} [errorInfo.timestamp] - 错误发生时间
 */
function handleGlobalError(errorInfo) {
  logger.error('全局错误:', errorInfo)

  // 根据错误类型展示不同的用户提示
  const isNetworkError = errorInfo.message?.includes('network') ||
                         errorInfo.message?.includes('fetch') ||
                         errorInfo.message?.includes('timeout')
  const isAuthError = errorInfo.message?.includes('auth') ||
                      errorInfo.message?.includes('token') ||
                      errorInfo.message?.includes('unauthorized')

  let message = '页面加载出错，请刷新重试'
  if (isNetworkError) {
    message = '网络连接异常，请检查网络后重试'
  } else if (isAuthError) {
    message = '登录状态已过期，请重新登录'
  }

  showNotification({
    message,
    type: 'error',
    duration: 8000
  })
}

/** 向子组件提供通知方法 */
provide('notification', { showNotification, removeNotification })

/**
 * 监听路由加载状态变化 — 使用顶部进度条替代全屏遮罩
 * 注意：不调用 next()，仅设置进度条状态，路由守卫逻辑由 router/index.js 处理
 */
router.beforeEach((to) => {
  isPageLoading.value = true
  if (routeProgress.value) {
    routeProgress.value.start()
  }
})

router.afterEach(() => {
  isPageLoading.value = false
  if (routeProgress.value) {
    routeProgress.value.finish()
  }
})

/**
 * 路由错误处理（通知层面，状态管理已在 router 中处理）
 * @description 导航出错时显示错误通知
 */
router.onError(() => {
  if (routeProgress.value) {
    routeProgress.value.finish()
  }
  showNotification({
    message: '页面加载失败，请检查网络连接',
    type: 'error'
  })
})

/**
 * 处理认证登出事件
 */
function handleAuthLogout() {
  showNotification({
    message: '登录已过期，请重新登录',
    type: 'warning',
    duration: 3000
  })
}

/**
 * 组件挂载钩子
 * @description 初始化无障碍支持和性能优化设置
 */
onMounted(() => {
  window.addEventListener('auth:logout', handleAuthLogout)

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) {
    document.documentElement.style.setProperty('--transition-normal', '0.01ms')
    document.documentElement.style.setProperty('--transition-slow', '0.01ms')
  }

  if ('connection' in navigator) {
    const connection = navigator.connection
    if (connection.saveData || connection.effectiveType === 'slow-2g') {
      document.body.classList.add('reduce-motion')
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('auth:logout', handleAuthLogout)
})

/**
 * 显示加载指示器
 * @param {string} [text] - 加载提示文本
 */
const showLoading = () => {
  if (loadingIndicator.value) {
    loadingIndicator.value.startLoading()
  }
}

/**
 * 隐藏加载指示器
 */
const hideLoading = () => {
  if (loadingIndicator.value) {
    loadingIndicator.value.stopLoading()
  }
}

/** 向子组件提供加载控制方法 */
provide('loading', { showLoading, hideLoading })
</script>

<style scoped>
/* 跳转主内容链接：默认隐藏，聚焦时显示 */
.skip-link {
  position: fixed;
  top: 0.5rem;
  left: 0.5rem;
  z-index: calc(var(--z-header) + 10);
  padding: 0.75rem 1rem;
  background: var(--color-bg);
  color: var(--color-text-heading);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: 600;
  transform: translateY(-150%);
  transition: transform var(--duration-fast) var(--ease-out);
}

.skip-link:focus {
  transform: translateY(0);
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Main content area */
.page-main {
  padding-top: 64px;
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
}

/* Notification container */
.notification-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
}

.notification {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: var(--color-bg-overlay);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-lg);
}

.notification-success { border-left: 3px solid var(--color-status-online); }
.notification-error { border-left: 3px solid var(--color-status-danger); }
.notification-warning { border-left: 3px solid var(--color-status-warning); }
.notification-info { border-left: 3px solid var(--color-accent); }

.notification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.notification-success .notification-icon { color: var(--color-status-online); }
.notification-error .notification-icon { color: var(--color-status-danger); }
.notification-warning .notification-icon { color: var(--color-status-warning); }
.notification-info .notification-icon { color: var(--color-accent); }

.notification-message {
  flex: 1;
  font-size: var(--text-sm);
  color: var(--color-text-body);
}

.notification-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  color: var(--color-text-dim);
  font-size: 1.25rem;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast);
}

.notification-close:hover {
  color: var(--color-text-heading);
}

.notification-enter-active,
.notification-leave-active {
  transition: all var(--duration-normal) var(--ease-out);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@media (max-width: 480px) {
  .notification-container {
    left: 1rem;
    right: 1rem;
    max-width: none;
  }
}
</style>
