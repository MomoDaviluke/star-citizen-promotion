/**
 * @file 按钮涟漪效果指令
 * @description 为按钮元素添加点击涟漪动画效果，涟漪从点击位置向外扩散，
 *              配合 CSS 变量 --ripple-x / --ripple-y 实现精确定位。
 *              自动检测 prefers-reduced-motion 并跳过动画。
 * @module directives/ripple
 * @example
 * <button v-ripple>点击我</button>
 * <TechButton v-ripple variant="primary">确认</TechButton>
 */

/**
 * 检测用户是否偏好减少动画
 */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * 创建涟漪 DOM 元素
 * @param {HTMLElement} el - 目标按钮元素
 * @param {number} x - 涟漪中心 X 坐标（相对于元素）
 * @param {number} y - 涟漪中心 Y 坐标（相对于元素）
 * @param {number} size - 涟漪直径
 */
function createRipple(el, x, y, size) {
  const ripple = document.createElement('span')
  ripple.className = 'v-ripple__wave'

  const diameter = Math.max(size, 100)
  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    width: ${diameter}px;
    height: ${diameter}px;
    left: ${x - diameter / 2}px;
    top: ${y - diameter / 2}px;
    background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 40%, transparent 70%);
    transform: scale(0);
    opacity: 1;
    pointer-events: none;
    z-index: 1;
  `

  el.appendChild(ripple)

  ripple.animate(
    [
      { transform: 'scale(0)', opacity: 1 },
      { transform: 'scale(2.5)', opacity: 0 }
    ],
    {
      duration: 600,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'forwards'
    }
  ).onfinish = () => {
    ripple.remove()
  }
}

/**
 * 涟漪指令定义
 * @type {import('vue').Directive}
 */
export const vRipple = {
  mounted(el) {
    if (prefersReducedMotion) return

    el.style.position = el.style.position || 'relative'
    el.style.overflow = 'hidden'

    el.addEventListener('click', (e) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const size = Math.max(rect.width, rect.height) * 2

      createRipple(el, x, y, size)
    })
  }
}
