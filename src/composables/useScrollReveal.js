/**
 * 滚动揭示动画组合式函数
 * @description 当元素进入视口时触发入场动画，支持多种动画类型和高级交互
 * @module composables/useScrollReveal
 * @author Full-stack Team
 * @version 3.0 - 增强版：添加更多动画类型、交错动画、视差滚动支持
 */

import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * 动画类型映射表
 * 定义每种动画对应的 CSS 类名和默认参数
 */
const ANIMATION_MAP = {
  fadeInUp: { class: 'animate-fade-in-up', duration: 600 },
  fadeInDown: { class: 'animate-fade-in-down', duration: 600 },
  fadeInLeft: { class: 'animate-fade-in-left', duration: 600 },
  fadeInRight: { class: 'animate-fade-in-right', duration: 600 },
  fadeIn: { class: 'animate-fade-in', duration: 600 },
  fadeInScale: { class: 'animate-scale-in', duration: 500 },
  slideUp: { class: 'animate-slide-up', duration: 800 },
  slideLeft: { class: 'animate-slide-left', duration: 800 },
  slideRight: { class: 'animate-slide-right', duration: 800 },
  glitch: { class: 'animate-glitch-reveal', duration: 800 },
  hologram: { class: 'animate-hologram-reveal', duration: 1000 },
  scan: { class: 'animate-scan-reveal', duration: 1200 },
  typewriter: { class: 'animate-typewriter', duration: 1500 }
}

/**
 * 使用滚动揭示动画
 * @param {Object} options - 配置选项
 * @param {string} [options.animation='fadeInUp'] - 动画类型
 * @param {number} [options.threshold=0.15] - 触发阈值（0-1）
 * @param {string} [options.rootMargin='0px 0px -50px 0px'] - 根边距，提前触发
 * @param {boolean} [options.once=true] - 是否只触发一次
 * @param {number} [options.delay=0] - 动画延迟（毫秒）
 * @param {number} [options.duration] - 动画持续时间（毫秒），覆盖默认值
 * @param {Function} [options.onReveal] - 揭示完成后的回调函数
 * @returns {Object} 暴露的响应式状态和方法
 */
export function useScrollReveal(options = {}) {
  const {
    animation = 'fadeInUp',
    threshold = 0.15,
    rootMargin = '0px 0px -50px 0px',
    once = true,
    delay = 0,
    duration,
    onReveal
  } = options

  /** 是否可见 */
  const isVisible = ref(false)

  /** 是否已触发过 */
  const hasTriggered = ref(false)

  /** 是否正在动画中 */
  const isAnimating = ref(false)

  /** Intersection Observer 实例 */
  let observer = null

  /** setTimeout 定时器 ID */
  let revealTimeoutId = null

  /** 动画完成定时器 ID */
  let animationEndTimeoutId = null

  /** 获取动画配置 */
  const animConfig = ANIMATION_MAP[animation] || ANIMATION_MAP.fadeInUp

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
            // 标记正在动画
            isAnimating.value = true

            // 延迟触发动画
            revealTimeoutId = setTimeout(() => {
              revealTimeoutId = null
              isVisible.value = true
              hasTriggered.value = true

              // 设置动画完成回调
              const animDuration = duration || animConfig.duration
              animationEndTimeoutId = setTimeout(() => {
                animationEndTimeoutId = null
                isAnimating.value = false
                if (typeof onReveal === 'function') {
                  onReveal(element)
                }
              }, animDuration + 100)
            }, delay)

            if (once && hasTriggered.value) {
              // 只触发一次，触发后断开观察
              observer.unobserve(entry.target)
            }
          } else if (!once && !isAnimating.value) {
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
    if (animationEndTimeoutId) {
      clearTimeout(animationEndTimeoutId)
      animationEndTimeoutId = null
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
    isAnimating.value = false
  }

  // 组件卸载时清理
  onUnmounted(() => {
    destroyObserver()
  })

  /** 动画类名（计算属性） */
  const animationClass = computed(() => {
    if (!isVisible.value) return 'will-animate'
    return `${animConfig.class} animated`
  })

  /** 内联动画样式（用于自定义持续时间） */
  const animationStyle = computed(() => {
    const styles = {}
    if (duration) {
      styles.animationDuration = `${duration}ms`
    }
    if (delay && !isVisible.value) {
      styles.animationDelay = `${delay}ms`
    }
    return styles
  })

  return {
    isVisible,
    hasTriggered,
    isAnimating,
    initObserver,
    destroyObserver,
    trigger,
    hide,
    reset,
    animationClass,
    animationStyle
  }
}

/**
 * 使用批量滚动揭示（用于列表项）
 * @param {Object} options - 配置选项
 * @param {number} [options.stagger=120] - 交错延迟（毫秒）
 * @param {string} [options.animation='fadeInUp'] - 动画类型
 * @param {number} [options.threshold=0.1] - 触发阈值
 * @returns {Object} 暴露的方法
 */
export function useBatchReveal(options = {}) {
  const {
    stagger = 120,
    animation = 'fadeInUp',
    threshold = 0.1,
    rootMargin = '0px 0px -30px 0px'
  } = options

  const revealedItems = ref(new Set())
  const observers = ref([])

  /**
   * 初始化批量观察
   * @param {Array<HTMLElement>} elements - 元素数组
   * @param {Object} [itemOptions] - 每个元素的额外选项
   */
  function initBatch(elements, itemOptions = {}) {
    if (!elements || !elements.length) return

    elements.forEach((el, index) => {
      if (!el) return

      const delay = index * stagger
      const itemDelay = itemOptions.delay || 0
      const totalDelay = delay + itemDelay

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                el.classList.add('animated')
                el.classList.add(`animate-${animation}`)
                revealedItems.value.add(el)
              }, totalDelay)

              observer.unobserve(entry.target)
            }
          })
        },
        { threshold, rootMargin }
      )

      // 初始添加 will-animate 类
      el.classList.add('will-animate')
      observer.observe(el)
      observers.value.push(observer)
    })
  }

  /**
   * 销毁所有观察器
   */
  function destroyAll() {
    observers.value.forEach((obs) => obs.disconnect())
    observers.value = []
    revealedItems.value.clear()
  }

  // 组件卸载时清理
  onUnmounted(() => {
    destroyAll()
  })

  return {
    revealedItems,
    observers,
    initBatch,
    destroyAll
  }
}

/**
 * 使用视差滚动揭示
 * @description 结合视差效果和滚动揭示，创建更沉浸的体验
 * @param {Object} options - 配置选项
 * @param {number} [options.parallaxSpeed=0.3] - 视差速度
 * @param {number} [options.revealThreshold=0.2] - 揭示阈值
 */
export function useParallaxReveal(options = {}) {
  const {
    parallaxSpeed = 0.3,
    revealThreshold = 0.2
  } = options

  const offsetY = ref(0)
  const isRevealed = ref(false)
  let observer = null
  let ticking = false

  function handleScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        offsetY.value = window.scrollY * parallaxSpeed
        ticking = false
      })
      ticking = true
    }
  }

  function init(element) {
    if (!element) return

    // 初始化滚动揭示
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isRevealed.value = true
            element.classList.add('parallax-revealed')
          }
        })
      },
      { threshold: revealThreshold }
    )

    observer.observe(element)

    // 添加滚动监听
    window.addEventListener('scroll', handleScroll, { passive: true })
  }

  function destroy() {
    if (observer) {
      observer.disconnect()
      observer = null
    }
    window.removeEventListener('scroll', handleScroll)
  }

  onUnmounted(() => {
    destroy()
  })

  return {
    offsetY,
    isRevealed,
    init,
    destroy
  }
}
