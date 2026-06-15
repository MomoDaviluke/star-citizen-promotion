/**
 * @file 全息动画 composable
 * @description 提供可配置的全息动画效果：浮动、闪烁入场、鼠标视差
 * @module composables/useHoloAnimation
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * 使用全息动画效果
 * @param {Object} options - 动画配置
 * @param {boolean} [options.enableFloat=true] - 启用浮动动画
 * @param {boolean} [options.enableGlitch=true] - 启用全息闪烁入场
 * @param {boolean} [options.enableParallax=true] - 启用鼠标视差
 * @param {number} [options.floatDuration=3] - 浮动周期(秒)
 * @param {number} [options.floatDistance=2] - 浮动幅度(px)
 * @param {number} [options.glitchDuration=600] - 闪烁时长(ms)
 * @param {number} [options.staggerDelay=100] - 列表交错延迟(ms)
 * @returns {Object} 动画控制方法
 */
export function useHoloAnimation(options = {}) {
  const {
    enableFloat = true,
    enableGlitch = true,
    enableParallax = true,
    floatDuration = 3,
    floatDistance = 2,
    glitchDuration = 600,
    staggerDelay = 100,
  } = options

  const mouseX = ref(0.5)
  const mouseY = ref(0.5)
  const isHovered = ref(false)
  const isVisible = ref(false)

  /**
   * 处理卡片鼠标移动
   */
  function onCardMouseMove(e) {
    if (!enableParallax) return
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.value = (e.clientX - rect.left) / rect.width
    mouseY.value = (e.clientY - rect.top) / rect.height
    isHovered.value = true
  }

  /**
   * 处理卡片鼠标离开
   */
  function onCardMouseLeave() {
    mouseX.value = 0.5
    mouseY.value = 0.5
    isHovered.value = false
  }

  /**
   * 获取 stagger 延迟样式
   * @param {number} index - 元素索引
   * @returns {Object} CSS 样式对象
   */
  function staggerStyle(index) {
    return {
      animationDelay: `${index * staggerDelay}ms`,
      transitionDelay: `${index * staggerDelay}ms`,
    }
  }

  /**
   * 获取浮动动画样式
   * @param {number} [offset=0] - 延迟偏移(秒)
   * @returns {Object} CSS 样式对象
   */
  function floatStyle(offset = 0) {
    if (!enableFloat) return {}
    return {
      animation: `holo-float ${floatDuration}s ease-in-out ${offset}s infinite`,
    }
  }

  /**
   * 获取入场动画样式
   * @param {number} index - 元素索引
   * @returns {Object} CSS 样式对象
   */
  function enterStyle(index = 0) {
    if (!enableGlitch) {
      return {
        animation: `fadeInUp 0.5s ease-out ${index * staggerDelay}ms both`,
      }
    }
    return {
      animation: `holo-enter ${glitchDuration}ms ease-out ${index * staggerDelay}ms both`,
    }
  }

  /**
   * 视差偏移计算
   * @param {number} intensity - 视差强度(px)
   * @returns {Object} transform 样式
   */
  const parallaxOffset = computed(() => {
    if (!enableParallax || !isHovered.value) {
      return { transform: 'translate(0, 0)' }
    }
    const offsetX = (mouseX.value - 0.5) * 4
    const offsetY = (mouseY.value - 0.5) * 4
    return {
      transform: `translate(${offsetX}px, ${offsetY}px)`,
      transition: 'transform 0.15s ease-out',
    }
  })

  /**
   * 边框光晕位置
   */
  const glowPosition = computed(() => {
    return {
      '--glow-x': `${mouseX.value * 100}%`,
      '--glow-y': `${mouseY.value * 100}%`,
    }
  })

  return {
    mouseX,
    mouseY,
    isHovered,
    isVisible,
    onCardMouseMove,
    onCardMouseLeave,
    staggerStyle,
    floatStyle,
    enterStyle,
    parallaxOffset,
    glowPosition,
  }
}

export default useHoloAnimation
