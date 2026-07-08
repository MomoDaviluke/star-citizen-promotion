/**
 * @file 统一动效编排组合式函数
 * @description 提供与国际大厂对齐的 Motion Token 访问与动画编排能力，
 *              支持 prefers-reduced-motion 自动降级。
 * @module composables/useMotion
 * @example
 * const { fadeUp, stagger } = useMotion()
 * onMounted(() => fadeUp(elRef.value))
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * Motion Token 常量表
 * @description 与 src/styles/variables.css 中的 CSS 变量保持同步，
 *              便于 JS 侧按场景选择动画参数。
 */
export const MOTION_TOKENS = {
  duration: {
    instant: 0,
    micro: 80,
    fast: 150,
    normal: 250,
    slow: 400,
    emphasis: 600,
    ambient: 20000
  },
  easing: {
    linear: 'linear',
    out: 'cubic-bezier(0.16, 1, 0.3, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    dramatic: 'cubic-bezier(0.87, 0, 0.13, 1)'
  },
  stagger: {
    tight: 40,
    normal: 80,
    loose: 120
  },
  distance: {
    sm: 8,
    md: 24,
    lg: 48
  }
}

/**
 * 检测用户是否偏好减弱动效
 * @returns {boolean}
 */
function getPrefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * 使用统一动效系统
 * @returns {Object} 动效工具集
 */
export function useMotion() {
  const reducedMotion = ref(getPrefersReducedMotion())

  /**
   * 当前是否处于减弱动效模式
   * @type {import('vue').ComputedRef<boolean>}
   */
  const isReduced = computed(() => reducedMotion.value)

  /**
   * 监听系统动效偏好变化
   */
  let mediaQuery = null
  onMounted(() => {
    if (typeof window === 'undefined') return
    mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e) => { reducedMotion.value = e.matches }
    mediaQuery.addEventListener('change', handler)
    onUnmounted(() => {
      mediaQuery.removeEventListener('change', handler)
    })
  })

  /**
   * 根据偏好返回实际时长
   * @param {number} duration - 原始时长（毫秒）
   * @returns {number}
   */
  function resolveDuration(duration) {
    return reducedMotion.value ? 0 : duration
  }

  /**
   * 对单个元素执行淡入上移动画
   * @param {HTMLElement} el - 目标元素
   * @param {Object} options - 配置
   * @param {number} [options.delay=0] - 延迟（毫秒）
   * @param {number} [options.duration=400] - 时长（毫秒）
   * @param {string} [options.easing='out'] - 缓动名
   * @param {number} [options.distance=24] - 位移距离（像素）
   */
  function fadeUp(el, options = {}) {
    if (!el) return
    const {
      delay = 0,
      duration = MOTION_TOKENS.duration.slow,
      easing = 'out',
      distance = MOTION_TOKENS.distance.md
    } = options

    const realDuration = resolveDuration(duration)
    el.style.opacity = '0'
    el.style.transform = `translateY(${distance}px)`
    el.style.transition = `opacity ${realDuration}ms ${MOTION_TOKENS.easing[easing] || MOTION_TOKENS.easing.out}, transform ${realDuration}ms ${MOTION_TOKENS.easing[easing] || MOTION_TOKENS.easing.out}`

    requestAnimationFrame(() => {
      setTimeout(() => {
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
      }, delay)
    })
  }

  /**
   * 对元素列表执行级联入场动画
   * @param {HTMLElement[]} elements - 元素列表
   * @param {Object} options - 配置
   * @param {number} [options.baseDelay=0] - 基础延迟
   * @param {number} [options.stagger=80] - 级联间隔
   * @param {Function} [options.animation=fadeUp] - 单个元素动画函数
   */
  function stagger(elements, options = {}) {
    if (!elements || !elements.length) return
    const {
      baseDelay = 0,
      stagger: staggerMs = MOTION_TOKENS.stagger.normal,
      animation = fadeUp
    } = options

    elements.forEach((el, index) => {
      animation(el, { delay: baseDelay + index * staggerMs })
    })
  }

  /**
   * 生成 CSS transition 字符串
   * @param {string[]} properties - 参与过渡的属性名
   * @param {Object} options - 配置
   * @param {number} [options.duration=250] - 时长
   * @param {string} [options.easing='out'] - 缓动名
   * @param {number} [options.delay=0] - 延迟
   * @returns {string}
   */
  function transition(properties, options = {}) {
    const {
      duration = MOTION_TOKENS.duration.normal,
      easing = 'out',
      delay = 0
    } = options
    const realDuration = resolveDuration(duration)
    const ease = MOTION_TOKENS.easing[easing] || MOTION_TOKENS.easing.out
    return properties.map(p => `${p} ${realDuration}ms ${ease} ${delay}ms`).join(', ')
  }

  return {
    isReduced,
    tokens: MOTION_TOKENS,
    resolveDuration,
    fadeUp,
    stagger,
    transition
  }
}

export default useMotion
