/**
 * @file GSAP 滚动揭示动画组合式函数
 * @description 基于 GSAP ScrollTrigger 的统一滚动动画封装，支持 7 种动画类型、
 *              交错动画、视差偏移、数字递增、进度条填充等高级效果。
 *              自动处理 prefers-reduced-motion 无障碍适配和组件卸载清理。
 * @module composables/useGSAPReveal
 * @version 1.0
 */

import { onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * 检测用户是否偏好减少动画
 * 当用户开启系统"减少动画"设置时，跳过所有滚动动画
 */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * 动画类型默认配置
 * 每种动画定义了 from 状态（初始隐藏态）和缓动参数
 * to 状态统一为：opacity:1, x:0, y:0, scale:1
 */
export const ANIMATION_CONFIGS = {
  fadeUp: { y: 50, opacity: 0, duration: 0.8, ease: 'power2.out' },
  fadeDown: { y: -50, opacity: 0, duration: 0.8, ease: 'power2.out' },
  fadeLeft: { x: -50, opacity: 0, duration: 0.8, ease: 'power2.out' },
  fadeRight: { x: 50, opacity: 0, duration: 0.8, ease: 'power2.out' },
  scaleIn: { scale: 0.8, opacity: 0, duration: 0.7, ease: 'back.out(1.4)' },
  fadeIn: { opacity: 0, duration: 0.7, ease: 'power2.out' },
  glitch: { opacity: 0, duration: 0.6, ease: 'steps(3)' }
}

/**
 * 初始化单个元素的 GSAP 滚动揭示动画
 * @param {HTMLElement} element - 目标 DOM 元素
 * @param {Object} options - 动画配置选项
 * @param {string} [options.animation='fadeUp'] - 动画类型，支持 fadeUp/fadeDown/fadeLeft/fadeRight/scaleIn/fadeIn/glitch
 * @param {number} [options.duration] - 覆盖默认动画时长（秒）
 * @param {number} [options.delay=0] - 动画延迟（秒）
 * @param {string} [options.start='top 85%'] - ScrollTrigger 触发起始位置
 * @param {boolean} [options.once=true] - 是否只播放一次（离开视口不反向）
 * @returns {ScrollTrigger|null} ScrollTrigger 实例，用于手动控制或清理
 */
export function initScrollReveal(element, options = {}) {
  if (!element || prefersReducedMotion) return null

  const {
    animation = 'fadeUp',
    duration,
    delay = 0,
    start = 'top 85%',
    once = true
  } = options

  const config = ANIMATION_CONFIGS[animation]
  if (!config) return null

  const fromVars = { ...config }
  if (duration !== undefined) fromVars.duration = duration

  const st = ScrollTrigger.create({
    trigger: element,
    start,
    toggleActions: once ? 'play none none none' : 'play none none reverse',
    onEnter: () => {
      gsap.fromTo(element, fromVars, {
        y: 0, x: 0, opacity: 1, scale: 1,
        duration: fromVars.duration,
        delay,
        ease: fromVars.ease,
        overwrite: 'auto'
      })
    }
  })

  return st
}

/**
 * 初始化一组子元素的交错滚动揭示动画
 * @param {HTMLElement} container - 父容器元素
 * @param {string} selector - 子元素选择器
 * @param {Object} options - 动画配置选项
 * @param {string} [options.animation='fadeUp'] - 动画类型
 * @param {number} [options.stagger=0.12] - 交错延迟（秒）
 * @param {number} [options.duration] - 覆盖默认动画时长
 * @param {string} [options.start='top 80%'] - ScrollTrigger 触发位置
 * @param {boolean} [options.once=true] - 是否只播放一次
 * @returns {ScrollTrigger|null} ScrollTrigger 实例
 */
export function initStaggerReveal(container, selector, options = {}) {
  if (!container || prefersReducedMotion) return null

  const {
    animation = 'fadeUp',
    stagger = 0.12,
    duration,
    start = 'top 80%',
    once = true
  } = options

  const config = ANIMATION_CONFIGS[animation]
  if (!config) return null

  const items = container.querySelectorAll(selector)
  if (!items.length) return null

  const fromVars = { ...config }
  if (duration !== undefined) fromVars.duration = duration

  const st = ScrollTrigger.create({
    trigger: container,
    start,
    toggleActions: once ? 'play none none none' : 'play none none reverse',
    onEnter: () => {
      gsap.fromTo(items, fromVars, {
        y: 0, x: 0, opacity: 1, scale: 1,
        duration: fromVars.duration,
        stagger,
        ease: fromVars.ease,
        overwrite: 'auto'
      })
    }
  })

  return st
}

/**
 * 数字递增动画 — 适用于统计数据展示
 * @param {HTMLElement} element - 显示数字的目标元素
 * @param {Object} options - 动画配置选项
 * @param {number} [options.endValue=100] - 目标数值
 * @param {number} [options.duration=2] - 动画时长（秒）
 * @param {string} [options.start='top 85%'] - ScrollTrigger 触发位置
 * @param {string} [options.suffix=''] - 数字后缀（如 '%'、'+'）
 * @param {boolean} [options.once=true] - 是否只播放一次
 * @returns {ScrollTrigger|null} ScrollTrigger 实例
 */
export function initCountUp(element, options = {}) {
  if (!element || prefersReducedMotion) return null

  const {
    endValue = 100,
    duration = 2,
    start = 'top 85%',
    suffix = '',
    once = true
  } = options

  const counter = { val: 0 }

  const st = ScrollTrigger.create({
    trigger: element,
    start,
    toggleActions: once ? 'play none none none' : 'play none none reverse',
    onEnter: () => {
      gsap.to(counter, {
        val: endValue,
        duration,
        ease: 'power1.out',
        onUpdate: () => {
          element.textContent = Math.round(counter.val) + suffix
        }
      })
    }
  })

  return st
}

/**
 * 进度条填充动画 — 适用于技能条、完成度展示
 * @param {HTMLElement} element - 进度条内部填充元素
 * @param {Object} options - 动画配置选项
 * @param {number} [options.width='100%'] - 目标宽度
 * @param {number} [options.duration=1.5] - 动画时长（秒）
 * @param {string} [options.start='top 85%'] - ScrollTrigger 触发位置
 * @param {boolean} [options.once=true] - 是否只播放一次
 * @returns {ScrollTrigger|null} ScrollTrigger 实例
 */
export function initBarFill(element, options = {}) {
  if (!element || prefersReducedMotion) return null

  const {
    width = '100%',
    duration = 1.5,
    start = 'top 85%',
    once = true
  } = options

  gsap.set(element, { width: '0%' })

  const st = ScrollTrigger.create({
    trigger: element,
    start,
    toggleActions: once ? 'play none none none' : 'play none none reverse',
    onEnter: () => {
      gsap.to(element, {
        width,
        duration,
        ease: 'power2.out',
        overwrite: 'auto'
      })
    }
  })

  return st
}

/**
 * useGSAPReveal 组合式函数
 * @description 在组件中管理 GSAP ScrollTrigger 实例的生命周期，
 *              自动在组件卸载时清理所有 ScrollTrigger 实例，防止内存泄漏。
 * @param {Function} setupFn - 初始化函数，接收工具方法对象作为参数，
 *                              返回值将被忽略。工具方法包括：
 *                              - reveal: 初始化单个元素滚动揭示
 *                              - stagger: 初始化交错动画
 *                              - countUp: 初始化数字递增
 *                              - barFill: 初始化进度条填充
 * @returns {Object} 暴露的方法
 *   - refresh(): 手动刷新所有 ScrollTrigger 实例（布局变化后调用）
 *   - kill(): 手动销毁所有 ScrollTrigger 实例
 */
export function useGSAPReveal(setupFn) {
  /** 存储所有创建的 ScrollTrigger 实例，用于统一清理 */
  const triggers = []

  /**
   * 工具方法集合，传递给 setupFn 使用
   * 每个方法在创建 ScrollTrigger 后自动收集到 triggers 数组
   */
  const api = {
    reveal: (el, opts) => {
      const st = initScrollReveal(el, opts)
      if (st) triggers.push(st)
      return st
    },
    stagger: (container, selector, opts) => {
      const st = initStaggerReveal(container, selector, opts)
      if (st) triggers.push(st)
      return st
    },
    countUp: (el, opts) => {
      const st = initCountUp(el, opts)
      if (st) triggers.push(st)
      return st
    },
    barFill: (el, opts) => {
      const st = initBarFill(el, opts)
      if (st) triggers.push(st)
      return st
    }
  }

  onMounted(() => {
    if (setupFn) setupFn(api)
  })

  onUnmounted(() => {
    triggers.forEach(st => st.kill())
    triggers.length = 0
  })

  return {
    /** 手动刷新所有 ScrollTrigger（布局变化后调用） */
    refresh: () => ScrollTrigger.refresh(),
    /** 手动销毁所有已收集的 ScrollTrigger 实例 */
    kill: () => {
      triggers.forEach(st => st.kill())
      triggers.length = 0
    }
  }
}
