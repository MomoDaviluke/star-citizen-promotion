/**
 * @file 滚动视差组合式函数
 * @description 基于 GSAP ScrollTrigger 实现滚动视差效果，
 *              支持速度控制、方向限制和自动清理。
 *              遵循 prefers-reduced-motion 无障碍设置。
 * @module composables/useParallax
 * @example
 * const { addParallax } = useParallax()
 * addParallax(heroRef.value, { speed: 0.3 })
 * addParallax(bgRef.value, { speed: -0.15, direction: 'vertical' })
 */

import { onUnmounted } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * 检测用户是否偏好减少动画
 */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * 滚动视差组合式函数
 * @returns {{ addParallax: Function }} 视差 API
 */
export function useParallax() {
  const triggers = []

  /**
   * 为元素添加滚动视差效果
   * @param {HTMLElement} element - 目标元素
   * @param {Object} options - 配置选项
   * @param {number} [options.speed=0.2] - 视差速度，正值向下偏移，负值向上
   * @param {'vertical'|'horizontal'|'both'} [options.direction='vertical'] - 视差方向
   * @param {string} [options.start='top bottom'] - ScrollTrigger 起始位置
   * @param {string} [options.end='bottom top'] - ScrollTrigger 结束位置
   * @param {number} [options.ease=1] - 插值平滑度（0=无平滑，1=完全平滑）
   */
  function addParallax(element, options = {}) {
    if (!element || prefersReducedMotion) return null

    const {
      speed = 0.2,
      direction = 'vertical',
      start = 'top bottom',
      end = 'bottom top',
      ease = 0.1
    } = options

    let currentY = 0
    let targetY = 0
    let currentX = 0
    let targetX = 0
    let rafId = null

    const st = ScrollTrigger.create({
      trigger: element,
      start,
      end,
      onUpdate: (self) => {
        const progress = self.progress
        const offset = (progress - 0.5) * speed * 200

        if (direction === 'vertical' || direction === 'both') {
          targetY = offset
        }
        if (direction === 'horizontal' || direction === 'both') {
          targetX = offset
        }

        if (!rafId) {
          rafId = requestAnimationFrame(updatePosition)
        }
      }
    })

    /**
     * 平滑插值更新元素位置
     */
    function updatePosition() {
      currentY += (targetY - currentY) * ease
      currentX += (targetX - currentX) * ease

      const transforms = []
      if (direction === 'vertical' || direction === 'both') {
        transforms.push(`translateY(${currentY}px)`)
      }
      if (direction === 'horizontal' || direction === 'both') {
        transforms.push(`translateX(${currentX}px)`)
      }

      element.style.transform = transforms.join(' ')

      if (Math.abs(targetY - currentY) > 0.1 || Math.abs(targetX - currentX) > 0.1) {
        rafId = requestAnimationFrame(updatePosition)
      } else {
        rafId = null
      }
    }

    triggers.push(st)
    return st
  }

  onUnmounted(() => {
    triggers.forEach(st => st.kill())
    triggers.length = 0
  })

  return { addParallax }
}
