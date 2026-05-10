/**
 * 视差滚动组合式函数
 * @description 实现鼠标移动和滚动视差效果
 * @module composables/useParallax
 * @author Full-stack Team
 */

import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * 使用视差效果
 * @param {Object} options - 配置选项
 * @param {number} [options.strength=0.1] - 视差强度
 * @param {boolean} [options.onScroll=true] - 是否响应滚动
 * @param {boolean} [options.onMouseMove=true] - 是否响应鼠标移动
 * @param {number} [options.smooth=0.1] - 平滑插值系数
 * @returns {Object} 暴露的响应式状态和方法
 */
export function useParallax(options = {}) {
  const {
    strength = 0.1,
    onScroll = true,
    onMouseMove = true,
    smooth = 0.1
  } = options

  /** X轴偏移量 */
  const offsetX = ref(0)
  
  /** Y轴偏移量 */
  const offsetY = ref(0)
  
  /** 当前滚动位置 */
  const scrollY = ref(0)
  
  /** 目标X轴偏移（用于平滑插值） */
  let targetX = 0
  
  /** 目标Y轴偏移（用于平滑插值） */
  let targetY = 0
  
  /** 动画帧ID */
  let animationFrame = null
  
  /** 元素引用 */
  let element = null

  /**
   * 处理鼠标移动
   * @param {MouseEvent} event - 鼠标事件
   */
  function handleMouseMove(event) {
    if (!element || !onMouseMove) return

    const rect = element.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5

    targetX = x * strength * 100
    targetY = y * strength * 100
  }

  /**
   * 处理滚动
   */
  function handleScroll() {
    if (!onScroll) return
    scrollY.value = window.scrollY
  }

  /**
   * 动画循环（使用requestAnimationFrame实现平滑插值）
   */
  function animate() {
    // 平滑插值
    offsetX.value += (targetX - offsetX.value) * smooth
    offsetY.value += (targetY - offsetY.value) * smooth

    // 继续动画循环
    animationFrame = requestAnimationFrame(animate)
  }

  /**
   * 初始化视差效果
   * @param {HTMLElement} el - 目标元素
   */
  function init(el) {
    if (!el) return
    element = el

    // 添加事件监听
    if (onMouseMove) {
      element.addEventListener('mousemove', handleMouseMove)
      element.addEventListener('mouseleave', () => {
        targetX = 0
        targetY = 0
      })
    }

    if (onScroll) {
      window.addEventListener('scroll', handleScroll, { passive: true })
    }

    // 启动动画循环
    animate()
  }

  /**
   * 销毁视差效果
   */
  function destroy() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }

    if (element) {
      if (onMouseMove) {
        element.removeEventListener('mousemove', handleMouseMove)
        element.removeEventListener('mouseleave', () => {
          targetX = 0
          targetY = 0
        })
      }
      element = null
    }

    if (onScroll) {
      window.removeEventListener('scroll', handleScroll)
    }

    offsetX.value = 0
    offsetY.value = 0
    scrollY.value = 0
  }

  /**
   * 计算属性：变换样式
   */
  const transformStyle = computed(() => ({
    transform: `translate(${offsetX.value}px, ${offsetY.value}px)`,
    willChange: 'transform'
  }))

  /**
   * 计算属性：滚动进度（0-1）
   */
  const scrollProgress = computed(() => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    return docHeight > 0 ? scrollY.value / docHeight : 0
  })

  // 组件挂载时初始化
  onMounted(() => {
    // 延迟初始化，确保DOM已渲染
    nextTick(() => {
      if (element) {
        init(element)
      }
    })
  })

  // 组件卸载时清理
  onUnmounted(() => {
    destroy()
  })

  return {
    offsetX,
    offsetY,
    scrollY,
    scrollProgress,
    transformStyle,
    init,
    destroy
  }
}

/**
 * 使用滚动视差（简化版，只响应滚动）
 * @param {Object} options - 配置选项
 * @returns {Object} 暴露的响应式状态和方法
 */
export function useScrollParallax(options = {}) {
  const { speed = 0.5 } = options
  
  const offsetY = ref(0)
  let ticking = false

  function handleScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        offsetY.value = window.scrollY * speed
        ticking = false
      })
      ticking = true
    }
  }

  function init() {
    window.addEventListener('scroll', handleScroll, { passive: true })
  }

  function destroy() {
    window.removeEventListener('scroll', handleScroll)
    offsetY.value = 0
  }

  onMounted(() => {
    init()
  })

  onUnmounted(() => {
    destroy()
  })

  const transformStyle = computed(() => ({
    transform: `translateY(${offsetY.value}px)`
  }))

  return {
    offsetY,
    transformStyle,
    init,
    destroy
  }
}
