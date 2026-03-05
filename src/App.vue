<!--
  @file 应用根组件
  @description Vue 应用根组件，包含页面布局、路由视图、全局状态管理和无障碍支持
  @module App
-->

<template>
  <div class="app-shell">
    <!-- 技术风格背景装饰层 -->
    <div class="tech-overlay" aria-hidden="true">
      <div class="tech-grid"></div>
      <div class="tech-glow tech-glow-1"></div>
      <div class="tech-glow tech-glow-2"></div>
    </div>

    <!-- 站点头部导航 -->
    <SiteHeader />

    <!-- 主内容区域 -->
    <main class="container page-main">
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

    <!-- 全局加载指示器 -->
    <LoadingIndicator ref="loadingIndicator" />

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
import ErrorBoundary from './components/common/ErrorBoundary.vue'
import { aiService, authService } from './services'

/** 路由实例 */
const router = useRouter()

/** 加载指示器组件引用 */
const loadingIndicator = ref(null)

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
 */
function handleGlobalError(errorInfo) {
  console.error('全局错误:', errorInfo)
  showNotification({
    message: '页面加载出错，请刷新重试',
    type: 'error'
  })
}

/** 向子组件提供通知方法 */
provide('notification', { showNotification, removeNotification })

/**
 * 路由前置守卫
 * @description 导航开始时设置加载状态并显示加载指示器
 */
router.beforeEach((to, from, next) => {
  isPageLoading.value = true
  if (loadingIndicator.value && to.path !== from.path) {
    loadingIndicator.value.startLoading()
  }
  next()
})

/**
 * 路由后置守卫
 * @description 导航完成后取消加载状态并隐藏加载指示器
 */
router.afterEach(() => {
  isPageLoading.value = false
  if (loadingIndicator.value) {
    loadingIndicator.value.stopLoading()
  }
})

/**
 * 路由错误处理
 * @description 导航出错时强制停止加载
 */
router.onError((error) => {
  isPageLoading.value = false
  if (loadingIndicator.value) {
    loadingIndicator.value.forceStop()
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
const showLoading = (text) => {
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

/** 向子组件提供 AI 服务实例 */
provide('aiService', aiService)

/** 向子组件提供认证服务 */
provide('authService', authService)
</script>

<style scoped>
/**
 * 技术风格背景层
 * @description 固定定位的装饰性背景，包含网格和光晕效果
 */
.tech-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}

/**
 * 网格背景
 * @description 半透明的科技感网格图案
 */
.tech-grid {
  position: absolute;
  inset: 0;
  opacity: 0.08;
  background-image:
    linear-gradient(rgba(143, 215, 255, 0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(143, 215, 255, 0.15) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: linear-gradient(180deg, black 0%, transparent 80%);
}

/**
 * 光晕效果基础样式
 * @description 模糊的渐变圆形装饰
 */
.tech-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  will-change: transform;
}

/**
 * 左上角光晕
 */
.tech-glow-1 {
  width: 500px;
  height: 500px;
  left: -150px;
  top: -150px;
  background: radial-gradient(circle, rgba(95, 169, 255, 0.12), transparent 70%);
}

/**
 * 右下角光晕
 */
.tech-glow-2 {
  width: 400px;
  height: 400px;
  right: -100px;
  bottom: -100px;
  background: radial-gradient(circle, rgba(143, 215, 255, 0.08), transparent 70%);
}

/**
 * 粒子效果（已禁用）
 */
.tech-particles {
  display: none;
}

/**
 * 主内容区域
 * @description 页面主体容器，包含路由视图
 */
.page-main {
  padding-block: 2rem 4rem;
  position: relative;
  overflow: hidden;
}

/**
 * 减少动画偏好支持
 */
@media (prefers-reduced-motion: reduce) {
  .tech-glow,
  .tech-particles {
    animation: none;
  }
}

/**
 * 全局通知容器
 */
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
  background: rgba(3, 8, 16, 0.95);
  border: 1px solid var(--line);
  border-radius: 4px;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.notification-success {
  border-color: var(--success);
}

.notification-error {
  border-color: var(--danger);
}

.notification-warning {
  border-color: #f0ad4e;
}

.notification-info {
  border-color: var(--accent);
}

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

.notification-success .notification-icon {
  background: rgba(78, 205, 196, 0.2);
  color: var(--success);
}

.notification-error .notification-icon {
  background: rgba(255, 107, 107, 0.2);
  color: var(--danger);
}

.notification-warning .notification-icon {
  background: rgba(240, 173, 78, 0.2);
  color: #f0ad4e;
}

.notification-info .notification-icon {
  background: rgba(95, 169, 255, 0.2);
  color: var(--accent);
}

.notification-message {
  flex: 1;
  font-size: 0.9rem;
  color: var(--text);
}

.notification-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.notification-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text);
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
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
