/**
 * @file v-scroll-reveal 自定义指令
 * @description 基于 GSAP ScrollTrigger 的声明式滚动揭示指令。
 *              在模板中以 v-scroll-reveal="'fadeUp'" 或
 *              v-scroll-reveal="{ animation: 'scaleIn', delay: 0.2 }" 使用。
 *              指令卸载时自动销毁 ScrollTrigger 实例，防止内存泄漏。
 * @module directives/scrollReveal
 * @version 1.0
 */

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ANIMATION_CONFIGS } from '../composables/useGSAPReveal.js'

gsap.registerPlugin(ScrollTrigger)

/** 检测用户是否偏好减少动画 */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * 解析指令绑定值，统一为配置对象
 * @param {string|Object} value - 指令绑定值，可以是动画类型字符串或配置对象
 * @returns {Object} 标准化的动画配置
 */
function parseOptions(value) {
  if (typeof value === 'string') {
    return { animation: value }
  }
  return { ...value }
}

/**
 * v-scroll-reveal 指令定义
 * @type {import('vue').Directive}
 */
export const vScrollReveal = {
  /**
   * 元素挂载时初始化 GSAP ScrollTrigger 动画
   * @param {HTMLElement} el - 绑定指令的 DOM 元素
   * @param {import('vue').DirectiveBinding} binding - 指令绑定对象
   */
  mounted(el, binding) {
    if (prefersReducedMotion) return

    const options = parseOptions(binding.value)
    const {
      animation = 'fadeUp',
      duration,
      delay = 0,
      start = 'top 85%',
      once = true
    } = options

    const config = ANIMATION_CONFIGS[animation]
    if (!config) return

    const fromVars = { ...config }
    if (duration !== undefined) fromVars.duration = duration

    /** 将 ScrollTrigger 实例存储在元素上，便于卸载时清理 */
    el._scrollRevealTrigger = ScrollTrigger.create({
      trigger: el,
      start,
      toggleActions: once ? 'play none none none' : 'play none none reverse',
      onEnter: () => {
        gsap.fromTo(el, fromVars, {
          y: 0, x: 0, opacity: 1, scale: 1,
          duration: fromVars.duration,
          delay,
          ease: fromVars.ease,
          overwrite: 'auto'
        })
      }
    })
  },

  /**
   * 指令更新时重新创建 ScrollTrigger
   * @param {HTMLElement} el - 绑定指令的 DOM 元素
   * @param {import('vue').DirectiveBinding} binding - 新的指令绑定对象
   */
  updated(el, binding) {
    /** 如果配置未变化，跳过重建 */
    if (JSON.stringify(binding.oldValue) === JSON.stringify(binding.value)) return

    /** 先销毁旧的 ScrollTrigger */
    if (el._scrollRevealTrigger) {
      el._scrollRevealTrigger.kill()
      el._scrollRevealTrigger = null
    }

    /** 重新初始化（复用 mounted 逻辑） */
    vScrollReveal.mounted(el, binding)
  },

  /**
   * 元素卸载时销毁 ScrollTrigger 实例，防止内存泄漏
   * @param {HTMLElement} el - 绑定指令的 DOM 元素
   */
  unmounted(el) {
    if (el._scrollRevealTrigger) {
      el._scrollRevealTrigger.kill()
      el._scrollRevealTrigger = null
    }
  }
}

/**
 * 默认导出，用于 app.directive() 注册
 */
export default vScrollReveal
