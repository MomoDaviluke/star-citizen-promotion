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
      <router-view v-slot="{ Component, route }">
        <PageTransition :key="route.path">
          <component :is="Component" :key="route.path" />
        </PageTransition>
      </router-view>
    </main>

    <!-- 站点底部 -->
    <SiteFooter />

    <!-- 全局加载指示器 -->
    <LoadingIndicator ref="loadingIndicator" />
  </div>
</template>

<script setup>
/**
 * 应用根组件
 * @description 负责应用的整体布局、路由过渡动画、全局状态提供和无障碍支持
 */

import { ref, onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import SiteHeader from './components/layout/SiteHeader.vue'
import SiteFooter from './components/layout/SiteFooter.vue'
import PageTransition from './components/common/PageTransition.vue'
import LoadingIndicator from './components/common/LoadingIndicator.vue'
import { aiService } from './services'

/** 路由实例 */
const router = useRouter()

/** 加载指示器组件引用 */
const loadingIndicator = ref(null)

/** 页面加载状态 */
const isPageLoading = ref(false)

/** 向子组件提供页面加载状态 */
provide('isPageLoading', isPageLoading)

/**
 * 路由前置守卫
 * @description 导航开始时设置加载状态
 */
router.beforeEach((to, from, next) => {
  isPageLoading.value = true
  next()
})

/**
 * 路由后置守卫
 * @description 导航完成后取消加载状态
 */
router.afterEach(() => {
  isPageLoading.value = false
})

/**
 * 组件挂载钩子
 * @description 初始化无障碍支持和性能优化设置
 */
onMounted(() => {
  // 检测用户是否偏好减少动画
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) {
    document.documentElement.style.setProperty('--transition-normal', '0.01ms')
    document.documentElement.style.setProperty('--transition-slow', '0.01ms')
  }

  // 检测网络连接状态，为低速网络用户优化体验
  if ('connection' in navigator) {
    const connection = navigator.connection
    if (connection.saveData || connection.effectiveType === 'slow-2g') {
      document.body.classList.add('reduce-motion')
    }
  }
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
</style>
