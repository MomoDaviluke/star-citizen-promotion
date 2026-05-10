/**
 * 滚动揭示动画组合式函数
 * @description 当元素进入视口时触发入场动画，支持多种动画类型
 * @module composables/useScrollReveal
 * @author Full-stack Team
 */

import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * 使用滚动揭示动画
 * @param {Object} options - 配置选项
 * @param {string} [options.animation='fadeInUp'] - 动画类型
 *                                       可选值：fadeInUp|fadeInDown|fadeInLeft|fadeInRight|fadeIn|fadeInScale
 * @param {number} [options.threshold=0.1] - 触发阈值（0-1）
 * @param {string} [options.rootMargin='0px'] - 根边距
 * @param {boolean} [options.once=true] - 是否只触发一次
 * @param {number} [options.delay=0] - 动画延迟（毫秒）
 * @returns {Object} 暴露的响应式状态和方法
 */
export function useScrollReveal(options = {}) {
  const {
    animation = 'fadeInUp',
    threshold = 0.1,
    rootMargin = '0px',
    once = true,
    delay = 0
  } = options

  /** 是否可见 */
  const isVisible = ref(false)
  
  /** 是否已触发过 */
  const hasTriggered = ref(false)
  
  /** Intersection Observer 实例 */
  let observer = null

  /** setTimeout 定时器 ID */
  let revealTimeoutId = null

  /**
   * 初始化 Intersection Observer
   * @param {HTMLElement} element - 目标元素
   */
  function initObserver(element) {
    if (!element) return
    if (!('IntersectionObserver' in window)) {
      // 浏览器不支持，直接显示
      isVisible.value = true
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 延迟触发动画，记录定时器 ID 以便组件卸载时清理
            revealTimeoutId = setTimeout(() => {
              revealTimeoutId = null
              isVisible.value = true
            }, delay)

            if (once && !hasTriggered.value) {
              hasTriggered.value = true
              // 只触发一次，触发后断开观察
              observer.unobserve(entry.target)
            }
          } else if (!once) {
            // 不是只触发一次，离开视口时隐藏
            isVisible.value = false
          }
        })
      },
      { threshold, rootMargin }
    )

    observer.observe(element)
  }

  /**
   * 销毁观察器并清理定时器
   */
  function destroyObserver() {
    if (revealTimeoutId) {
      clearTimeout(revealTimeoutId)
      revealTimeoutId = null
    }
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  /**
   * 手动触发显示
   */
  function trigger() {
    isVisible.value = true
    hasTriggered.value = true
  }

  /**
   * 手动隐藏
   */
  function hide() {
    isVisible.value = false
  }

  /**
   * 重置状态
   */
  function reset() {
    isVisible.value = false
    hasTriggered.value = false
  }

  // 组件挂载时初始化
  onMounted(() => {
    // 延迟初始化，确保DOM已渲染
    nextTick(() => {
      // initObserver 需要在组件中使用时传入元素
    })
  })

  // 组件卸载时清理
  onUnmounted(() => {
    destroyObserver()
  })

  return {
    isVisible,
    hasTriggered,
    initObserver,
    destroyObserver,
    trigger,
    hide,
    reset,
    // 计算属性：动画类名
    animationClass: computed(() => isVisible.value ? `animate-${animation} animation-fill-both` : '')
  }
}

/**
 * 使用批量滚动揭示（用于列表项）
 * @param {Object} options - 配置选项
 * @param {number} [options.stagger=100] - 交错延迟（毫秒）
 * @returns {Object} 暴露的方法
 */
export function useBatchReveal(options = {}) {
  const { stagger = 100, ...revealOptions } = options
  const items = ref([])

  /**
   * 初始化批量观察
   * @param {Array<HTMLElement>} elements - 元素数组
   */
  function initBatch(elements) {
    if (!elements || !elements.length) return

    elements.forEach((el, index) => {
      const delay = index * stagger
      const { initObserver } = useScrollReveal({
        ...revealOptions,
        delay
      })
      initObserver(el)
    })
  }

  return {
    items,
    initBatch
  }
}
