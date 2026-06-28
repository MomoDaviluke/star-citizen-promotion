<!--
  @file CosmicNebula 星云背景组件
  @description 使用 Canvas 2D 绘制多层半透明星云，带缓慢漂移与鼠标视差
  @module components/cosmic/CosmicNebula
-->
<template>
  <canvas ref="canvasRef" class="cosmic-nebula" aria-hidden="true"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
let ctx = null
let animationId = null
let width = 0
let height = 0

const layers = [
  { color: 'rgba(138, 43, 226, 0.23)', count: 5, radius: 0.45, speed: 0.0003 },
  { color: 'rgba(74, 158, 255, 0.18)', count: 7, radius: 0.35, speed: 0.0005 },
  { color: 'rgba(6, 182, 212, 0.13)', count: 6, radius: 0.28, speed: 0.0007 }
]

const blobs = []
let mouseX = 0
let mouseY = 0

function initBlobs() {
  blobs.length = 0
  layers.forEach((layer, layerIndex) => {
    for (let i = 0; i < layer.count; i++) {
      blobs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.min(width, height) * layer.radius * (0.6 + Math.random() * 0.8),
        layerIndex,
        phase: Math.random() * Math.PI * 2
      })
    }
  })
}

function resize() {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = window.innerWidth
  height = window.innerHeight
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx.scale(dpr, dpr)
  initBlobs()
}

function draw(time) {
  if (!ctx) return
  ctx.clearRect(0, 0, width, height)

  // 深空基底色
  const gradient = ctx.createRadialGradient(
    width * 0.3, height * 0.3, 0,
    width * 0.5, height * 0.5, Math.max(width, height)
  )
  gradient.addColorStop(0, '#0a0f1a')
  gradient.addColorStop(0.5, '#05070d')
  gradient.addColorStop(1, '#020205')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // 极淡星尘带：增加背景层次，避免纯黑
  const dustGradient = ctx.createLinearGradient(0, 0, width, height * 0.7)
  dustGradient.addColorStop(0, 'rgba(74, 158, 255, 0.0)')
  dustGradient.addColorStop(0.35, 'rgba(74, 158, 255, 0.025)')
  dustGradient.addColorStop(0.55, 'rgba(138, 43, 226, 0.02)')
  dustGradient.addColorStop(1, 'rgba(74, 158, 255, 0.0)')
  ctx.fillStyle = dustGradient
  ctx.fillRect(0, 0, width, height)

  const parallaxX = (mouseX - width * 0.5) * 0.02
  const parallaxY = (mouseY - height * 0.5) * 0.02

  blobs.forEach((blob) => {
    const layer = layers[blob.layerIndex]
    const driftX = Math.sin(time * layer.speed + blob.phase) * width * 0.05
    const driftY = Math.cos(time * layer.speed * 0.7 + blob.phase) * height * 0.03

    const g = ctx.createRadialGradient(
      blob.x + driftX + parallaxX * (blob.layerIndex + 1) * 0.5,
      blob.y + driftY + parallaxY * (blob.layerIndex + 1) * 0.5,
      0,
      blob.x + driftX + parallaxX * (blob.layerIndex + 1) * 0.5,
      blob.y + driftY + parallaxY * (blob.layerIndex + 1) * 0.5,
      blob.r
    )
    g.addColorStop(0, layer.color)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(
      blob.x + driftX + parallaxX * (blob.layerIndex + 1) * 0.5,
      blob.y + driftY + parallaxY * (blob.layerIndex + 1) * 0.5,
      blob.r,
      0,
      Math.PI * 2
    )
    ctx.fill()
  })

  animationId = requestAnimationFrame(draw)
}

function onMouseMove(e) {
  mouseX = e.clientX
  mouseY = e.clientY
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  ctx = canvas.getContext('2d')
  if (!ctx) return
  resize()
  window.addEventListener('resize', resize)
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  animationId = requestAnimationFrame(draw)
})

onUnmounted(() => {
  window.removeEventListener('resize', resize)
  window.removeEventListener('mousemove', onMouseMove)
  if (animationId) cancelAnimationFrame(animationId)
})
</script>

<style scoped>
.cosmic-nebula {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .cosmic-nebula {
    display: none;
  }
}
</style>
