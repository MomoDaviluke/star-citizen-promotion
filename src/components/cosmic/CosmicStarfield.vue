<!--
  @file CosmicStarfield 星空背景组件
  @description 多层 Canvas 星空粒子，支持视差漂移、周期性闪烁、偶发流星
  @module components/cosmic/CosmicStarfield
-->
<template>
  <div class="cosmic-starfield">
    <canvas ref="canvasRef" class="cosmic-starfield__canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 组件 Props 定义
 * @property {string} quality - 粒子质量级别：low / medium / high
 */
const props = defineProps({
  quality: {
    type: String,
    default: 'high',
    validator: (value) => ['low', 'medium', 'high'].includes(value)
  }
})

const canvasRef = ref(null)
let ctx = null
let animationId = null
let width = 0
let height = 0
let lastTime = 0

/**
 * 不同质量级别对应的粒子层配置
 * 每层包含数量、速度、亮度、大小参数
 */
const qualityConfig = {
  low: {
    layers: [
      { count: 60, speed: 0.05, brightness: 0.3, size: 1 },
      { count: 30, speed: 0.12, brightness: 0.6, size: 1.5 },
      { count: 10, speed: 0.25, brightness: 0.9, size: 2 }
    ]
  },
  medium: {
    layers: [
      { count: 120, speed: 0.05, brightness: 0.3, size: 1 },
      { count: 60, speed: 0.12, brightness: 0.6, size: 1.5 },
      { count: 20, speed: 0.25, brightness: 0.9, size: 2 }
    ]
  },
  high: {
    layers: [
      { count: 180, speed: 0.05, brightness: 0.3, size: 1 },
      { count: 90, speed: 0.12, brightness: 0.6, size: 1.5 },
      { count: 30, speed: 0.25, brightness: 0.9, size: 2.5 }
    ]
  }
}

/** 星星数组，包含位置、速度、大小、闪烁相位等状态 */
const stars = []
/** 流星数组 */
const meteors = []

/**
 * 调整 Canvas 尺寸以匹配父容器
 */
function resize() {
  const parent = canvasRef.value.parentElement
  width = parent.clientWidth
  height = parent.clientHeight
  canvasRef.value.width = width
  canvasRef.value.height = height
}

/**
 * 根据配置生成星星粒子
 */
function createStars() {
  stars.length = 0
  const config = qualityConfig[props.quality]
  config.layers.forEach((layer) => {
    for (let i = 0; i < layer.count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: layer.size * (0.6 + Math.random() * 0.4),
        speed: layer.speed,
        brightness: layer.brightness,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.5 + Math.random() * 1.5
      })
    }
  })
}

/**
 * 生成一颗流星
 */
function spawnMeteor() {
  if (meteors.length > 2) return
  const startY = Math.random() * height * 0.4
  const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3
  meteors.push({
    x: -50,
    y: startY,
    vx: Math.cos(angle) * 8,
    vy: Math.sin(angle) * 8,
    length: 60 + Math.random() * 60,
    life: 1,
    decay: 0.01 + Math.random() * 0.01
  })
}

/**
 * 渲染循环：绘制星星与流星
 * @param {number} time - requestAnimationFrame 时间戳
 */
function render(time) {
  const delta = Math.min((time - lastTime) / 1000, 0.05)
  lastTime = time

  ctx.clearRect(0, 0, width, height)

  // 绘制星星：缓慢向下漂移并周期性闪烁
  stars.forEach((star) => {
    star.y += star.speed * delta * 60
    if (star.y > height + 10) {
      star.y = -10
      star.x = Math.random() * width
    }

    const twinkle = 0.6 + 0.4 * Math.sin(time * 0.001 * star.twinkleSpeed + star.twinklePhase)
    const alpha = star.brightness * twinkle

    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.fill()
  })

  // 偶发流星
  if (Math.random() < 0.005) spawnMeteor()

  for (let i = meteors.length - 1; i >= 0; i--) {
    const meteor = meteors[i]
    meteor.x += meteor.vx * delta * 60
    meteor.y += meteor.vy * delta * 60
    meteor.life -= meteor.decay * delta * 60

    if (meteor.life <= 0 || meteor.x > width + 100 || meteor.y > height + 100) {
      meteors.splice(i, 1)
      continue
    }

    const tailX = meteor.x - meteor.vx * meteor.length / 8
    const tailY = meteor.y - meteor.vy * meteor.length / 8
    const gradient = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY)
    gradient.addColorStop(0, `rgba(255, 255, 255, ${meteor.life})`)
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    ctx.beginPath()
    ctx.moveTo(meteor.x, meteor.y)
    ctx.lineTo(tailX, tailY)
    ctx.strokeStyle = gradient
    ctx.lineWidth = 2
    ctx.stroke()
  }

  animationId = requestAnimationFrame(render)
}

onMounted(() => {
  ctx = canvasRef.value.getContext('2d')
  resize()
  createStars()

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) {
    renderStaticStars()
  } else {
    animationId = requestAnimationFrame(render)
  }

  window.addEventListener('resize', resize)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', resize)
})

/**
 * 绘制静态星空（用于 prefers-reduced-motion）
 */
function renderStaticStars() {
  ctx.clearRect(0, 0, width, height)
  stars.forEach((star) => {
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`
    ctx.fill()
  })
}
</script>

<style scoped>
.cosmic-starfield {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.cosmic-starfield__canvas {
  width: 100%;
  height: 100%;
}
</style>
