<!--
  @file CosmicPlanet 行星组件
  @description 具有体积感、自转、光晕、悬停增强的行星天体
  支持 CSS 程序化渐变、Canvas 程序化生成与真实纹理贴图三种模式
  @module components/cosmic/CosmicPlanet
-->
<template>
  <div
    class="cosmic-planet"
    :class="[
      `cosmic-planet--${size}`,
      `cosmic-planet--${variant}`,
      { 'cosmic-planet--textured': !!texture }
    ]"
    :style="planetStyle"
  >
    <div class="cosmic-planet__glow"></div>
    <!-- Canvas 火星：用于绘制高细节程序化表面 -->
    <canvas
      v-if="variant === 'mars' && !texture"
      ref="marsCanvas"
      class="cosmic-planet__canvas"
      :width="canvasSize"
      :height="canvasSize"
      aria-hidden="true"
    ></canvas>
    <div v-else class="cosmic-planet__body"></div>
    <div class="cosmic-planet__atmosphere"></div>
    <div class="cosmic-planet__rings">
      <slot name="rings"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

/**
 * 组件 Props 定义
 * @property {string} size - 行星尺寸：small / medium / large
 * @property {string} variant - 行星色系：purple / blue / mars / ice / gas-giant
 * @property {number} rotationDuration - 自转周期（秒）
 * @property {string} texture - 真实纹理图片路径，传入后覆盖默认渐变
 */
const props = defineProps({
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  variant: {
    type: String,
    default: 'purple',
    validator: (value) => ['purple', 'blue', 'mars', 'ice', 'gas-giant'].includes(value)
  },
  rotationDuration: {
    type: Number,
    default: 90
  },
  texture: {
    type: String,
    default: ''
  }
})

/** 尺寸映射表：将 size prop 转换为具体像素值 */
const sizeMap = {
  small: 180,
  medium: 320,
  large: 480
}

const canvasSize = computed(() => sizeMap[props.size])

/**
 * 计算行星容器样式
 * 包含尺寸、CSS 自定义属性 --rotation-duration、以及真实纹理路径
 */
const planetStyle = computed(() => ({
  width: `${sizeMap[props.size]}px`,
  height: `${sizeMap[props.size]}px`,
  '--rotation-duration': `${props.rotationDuration}s`,
  '--planet-texture': props.texture ? `url(${props.texture})` : 'none'
}))

const marsCanvas = ref(null)
let rafId = null
let isActive = false

/* ============================================================
   火星 Canvas 程序化渲染
   ============================================================ */

/**
 * 确定性伪随机生成器
 * 相同 seed 总是产生相同的地形，保证星球外观稳定
 */
function makeRandom(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/**
 * 多层倍频噪声：将多组不同频率/振幅的噪声叠加，形成自然地形
 */
function noise(x, seed, octaves = 5) {
  const rand = makeRandom(seed)
  const primes = [157, 313, 631, 1259, 2521]
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0

  // 预生成每个倍频的相位偏移
  const phases = primes.map((_p) => rand() * Math.PI * 2)

  for (let i = 0; i < octaves; i++) {
    const px = x * frequency + phases[i]
    value += Math.sin(px) * amplitude
    maxValue += amplitude
    amplitude *= 0.5
    frequency *= 2.3
  }

  return value / maxValue
}

/**
 * 绘制带光照的陨石坑
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {number} x - 圆心 x
 * @param {number} y - 圆心 y
 * @param {number} r - 半径
 * @param {number} lightAngle - 光源方向（弧度）
 */
function drawCrater(ctx, x, y, r, lightAngle) {
  // 撞击坑底部阴影
  const floor = ctx.createRadialGradient(x, y, 0, x, y, r)
  floor.addColorStop(0, 'rgba(30, 8, 4, 0.85)')
  floor.addColorStop(0.65, 'rgba(55, 18, 10, 0.55)')
  floor.addColorStop(1, 'rgba(80, 30, 18, 0)')
  ctx.fillStyle = floor
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()

  // 隆起的坑缘高光（朝向光源一侧）
  const rimX = x - Math.cos(lightAngle) * r * 0.55
  const rimY = y - Math.sin(lightAngle) * r * 0.55
  const rim = ctx.createRadialGradient(rimX, rimY, 0, rimX, rimY, r * 1.1)
  rim.addColorStop(0, 'rgba(220, 130, 90, 0.45)')
  rim.addColorStop(0.5, 'rgba(180, 85, 55, 0.15)')
  rim.addColorStop(1, 'rgba(180, 85, 55, 0)')
  ctx.fillStyle = rim
  ctx.beginPath()
  ctx.arc(x, y, r * 1.05, 0, Math.PI * 2)
  ctx.fill()

  // 背光侧坑缘阴影
  const shadowX = x + Math.cos(lightAngle) * r * 0.5
  const shadowY = y + Math.sin(lightAngle) * r * 0.5
  const shadow = ctx.createRadialGradient(shadowX, shadowY, 0, shadowX, shadowY, r)
  shadow.addColorStop(0, 'rgba(20, 5, 3, 0.5)')
  shadow.addColorStop(0.6, 'rgba(20, 5, 3, 0.15)')
  shadow.addColorStop(1, 'rgba(20, 5, 3, 0)')
  ctx.fillStyle = shadow
  ctx.beginPath()
  ctx.arc(x, y, r * 1.02, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * 绘制极地冰冠
 * 使用不规则形状和渐变，避免完美的圆形
 */
function drawIceCap(ctx, x, y, r, _isNorth) {
  // 主体冰冠：不规则多边形近似
  ctx.fillStyle = 'rgba(235, 242, 248, 0.75)'
  ctx.beginPath()
  const points = 16
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2
    const radiusVar = r * (0.7 + Math.random() * 0.35)
    const px = x + Math.cos(angle) * radiusVar
    const py = y + Math.sin(angle) * radiusVar * 0.55
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.filter = 'blur(2px)'
  ctx.fill()
  ctx.filter = 'none'

  // 冰冠边缘柔和过渡
  const capGradient = ctx.createRadialGradient(x, y, 0, x, y, r * 1.2)
  capGradient.addColorStop(0, 'rgba(245, 248, 250, 0.4)')
  capGradient.addColorStop(0.6, 'rgba(230, 235, 240, 0.2)')
  capGradient.addColorStop(1, 'rgba(230, 235, 240, 0)')
  ctx.fillStyle = capGradient
  ctx.beginPath()
  ctx.arc(x, y, r * 1.2, 0, Math.PI * 2)
  ctx.fill()

  // 冰冠表面裂纹/纹理
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 1
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = Math.random() * r * 0.6
    const cx = x + Math.cos(angle) * dist
    const cy = y + Math.sin(angle) * dist * 0.6
    const length = Math.random() * r * 0.3 + r * 0.1
    const crackAngle = Math.random() * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(crackAngle) * length, cy + Math.sin(crackAngle) * length)
    ctx.stroke()
  }
}

/**
 * 生成火星表面纹理画布
 * 宽度为 2 倍星球周长，用于无缝循环滚动
 */
function generateMarsSurface(width, height) {
  const surfaceCanvas = document.createElement('canvas')
  const surfaceWidth = width * 4
  surfaceCanvas.width = surfaceWidth
  surfaceCanvas.height = height
  const ctx = surfaceCanvas.getContext('2d')

  const rand = makeRandom(42)
  const lightAngle = Math.PI * 0.25

  // 1. 基础地形色：从深红褐到亮赭石
  const baseGradient = ctx.createLinearGradient(0, 0, surfaceWidth, 0)
  for (let i = 0; i <= 8; i++) {
    const stop = i / 8
    const hue = 12 + rand() * 8
    const sat = 55 + rand() * 25
    const light = 22 + rand() * 18
    baseGradient.addColorStop(stop, `hsl(${hue}, ${sat}%, ${light}%)`)
  }
  ctx.fillStyle = baseGradient
  ctx.fillRect(0, 0, surfaceWidth, height)

  // 2. 大范围地貌起伏（暗色熔岩平原 / 亮色高地）
  const imageData = ctx.getImageData(0, 0, surfaceWidth, height)
  const data = imageData.data
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < surfaceWidth; x++) {
      const nx = x / surfaceWidth
      const ny = y / height

      // 经度方向的地形噪声
      const terrain = noise(nx * 6, 11, 5) * 0.6 + noise(nx * 18 + ny * 4, 23, 4) * 0.3
      // 纬度方向弯曲，模拟球面投影
      const latitude = (ny - 0.5) * 2
      const sphereFactor = Math.cos(latitude * Math.PI * 0.45)

      // 大型暗区（熔岩平原 / 撞击盆地）
      const maria = noise(nx * 3 + 100, 7, 4)
      // 小型表面粗糙度
      const roughness = noise(nx * 40 + ny * 20, 31, 3) * 0.15

      const idx = (y * surfaceWidth + x) * 4
      let r = data[idx]
      let g = data[idx + 1]
      let b = data[idx + 2]

      // 高地提亮、低地压暗（赤道附近地形更明显）
      const heightShift = terrain * 45 * sphereFactor + roughness * 30
      r = Math.min(255, Math.max(0, r + heightShift))
      g = Math.min(255, Math.max(0, g + heightShift * 0.85))
      b = Math.min(255, Math.max(0, b + heightShift * 0.6))

      // 暗色平原
      if (maria < -0.25) {
        const darken = (maria + 0.25) * -80
        r = Math.max(0, r - darken)
        g = Math.max(0, g - darken * 0.9)
        b = Math.max(0, b - darken * 0.8)
      }

      // 球面边缘压暗（简单模拟）
      const edgeDarken = Math.pow(Math.abs(latitude), 2.2) * 35
      r = Math.max(0, r - edgeDarken)
      g = Math.max(0, g - edgeDarken)
      b = Math.max(0, b - edgeDarken)

      data[idx] = r
      data[idx + 1] = g
      data[idx + 2] = b
    }
  }
  ctx.putImageData(imageData, 0, 0)

  // 3. 巨型地貌：奥林匹斯山风格的盾状火山
  const volcanoX = rand() * surfaceWidth
  const volcanoY = height * 0.35 + rand() * height * 0.3
  const volcanoR = height * 0.16
  const volcano = ctx.createRadialGradient(volcanoX, volcanoY, 0, volcanoX, volcanoY, volcanoR * 1.4)
  volcano.addColorStop(0, 'rgba(210, 130, 90, 0.5)')
  volcano.addColorStop(0.45, 'rgba(180, 95, 60, 0.35)')
  volcano.addColorStop(0.75, 'rgba(120, 55, 35, 0.2)')
  volcano.addColorStop(1, 'rgba(120, 55, 35, 0)')
  ctx.fillStyle = volcano
  ctx.beginPath()
  ctx.arc(volcanoX, volcanoY, volcanoR * 1.4, 0, Math.PI * 2)
  ctx.fill()
  // 火山口
  const caldera = ctx.createRadialGradient(volcanoX, volcanoY, 0, volcanoX, volcanoY, volcanoR * 0.35)
  caldera.addColorStop(0, 'rgba(40, 12, 6, 0.8)')
  caldera.addColorStop(0.6, 'rgba(80, 30, 18, 0.45)')
  caldera.addColorStop(1, 'rgba(80, 30, 18, 0)')
  ctx.fillStyle = caldera
  ctx.beginPath()
  ctx.arc(volcanoX, volcanoY, volcanoR * 0.4, 0, Math.PI * 2)
  ctx.fill()

  // 4. 大型峡谷系统（水手谷风格）：几道平行的深色长沟壑
  for (let c = 0; c < 3; c++) {
    const canyonX = rand() * surfaceWidth
    const canyonY = height * 0.3 + rand() * height * 0.4
    const canyonLength = height * (0.6 + rand() * 0.25)
    const canyonAngle = (rand() - 0.5) * 0.4
    const canyonWidth = height * (0.02 + rand() * 0.015)

    const canyonGrad = ctx.createLinearGradient(
      canyonX, canyonY,
      canyonX + Math.cos(canyonAngle) * canyonLength,
      canyonY + Math.sin(canyonAngle) * canyonLength
    )
    canyonGrad.addColorStop(0, 'rgba(25, 6, 3, 0)')
    canyonGrad.addColorStop(0.15, 'rgba(25, 6, 3, 0.7)')
    canyonGrad.addColorStop(0.5, 'rgba(35, 10, 5, 0.85)')
    canyonGrad.addColorStop(0.85, 'rgba(25, 6, 3, 0.7)')
    canyonGrad.addColorStop(1, 'rgba(25, 6, 3, 0)')

    ctx.strokeStyle = canyonGrad
    ctx.lineWidth = canyonWidth
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(canyonX, canyonY)
    ctx.lineTo(canyonX + Math.cos(canyonAngle) * canyonLength, canyonY + Math.sin(canyonAngle) * canyonLength)
    ctx.stroke()

    // 峡谷两侧的断崖高光
    const rimOffset = canyonWidth * 0.7
    ctx.strokeStyle = 'rgba(200, 130, 90, 0.18)'
    ctx.lineWidth = canyonWidth * 0.25
    ctx.beginPath()
    ctx.moveTo(canyonX - Math.sin(canyonAngle) * rimOffset, canyonY + Math.cos(canyonAngle) * rimOffset)
    ctx.lineTo(
      canyonX + Math.cos(canyonAngle) * canyonLength - Math.sin(canyonAngle) * rimOffset,
      canyonY + Math.sin(canyonAngle) * canyonLength + Math.cos(canyonAngle) * rimOffset
    )
    ctx.stroke()
  }

  // 5. 陨石坑群
  const craterCount = Math.floor(surfaceWidth / 28)
  for (let i = 0; i < craterCount; i++) {
    const cx = rand() * surfaceWidth
    const cy = rand() * height * 0.86 + height * 0.07
    const sizeBias = Math.pow(rand(), 3.5)
    const r = sizeBias * (height * 0.16) + 2
    drawCrater(ctx, cx, cy, r, lightAngle)
  }

  // 6. 小型山脊与沟壑纹理
  ctx.globalCompositeOperation = 'overlay'
  for (let i = 0; i < 60; i++) {
    const x = rand() * surfaceWidth
    const y = rand() * height * 0.8 + height * 0.1
    const length = rand() * (height * 0.25) + height * 0.05
    const angle = rand() * Math.PI * 2
    const thickness = rand() * 1.5 + 0.4
    const isRidge = rand() > 0.5

    const gradient = ctx.createLinearGradient(
      x, y,
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length
    )
    gradient.addColorStop(0, 'rgba(0,0,0,0)')
    gradient.addColorStop(0.5, isRidge ? 'rgba(255,200,160,0.3)' : 'rgba(20,5,3,0.55)')
    gradient.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.strokeStyle = gradient
    ctx.lineWidth = thickness
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length)
    ctx.stroke()
  }
  ctx.globalCompositeOperation = 'source-over'

  // 7. 极地冰冠（绘制在表面纹理上，后续会被球体光照压暗边缘）
  const capRadius = height * 0.18
  drawIceCap(ctx, surfaceWidth * 0.25, height * 0.08, capRadius, true)
  drawIceCap(ctx, surfaceWidth * 0.75, height * 0.92, capRadius * 0.85, false)

  // 8. 尘埃/薄雾层
  ctx.fillStyle = 'rgba(200, 120, 70, 0.06)'
  for (let i = 0; i < 60; i++) {
    const x = rand() * surfaceWidth
    const y = rand() * height
    const r = rand() * (height * 0.05) + height * 0.008
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  return surfaceCanvas
}

/**
 * 初始化并持续绘制 Canvas 火星
 */
function initMarsCanvas() {
  const canvas = marsCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const size = canvasSize.value
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = size * dpr
  canvas.height = size * dpr
  ctx.scale(dpr, dpr)

  const surfaceCanvas = generateMarsSurface(size, size)
  const surfaceWidth = surfaceCanvas.width / dpr
  let rotation = 0

  isActive = true

  const render = () => {
    if (!isActive) return

    // 自转速度：每帧偏移像素
    const speed = surfaceWidth / (props.rotationDuration * 60)
    rotation = (rotation + speed) % surfaceWidth

    ctx.clearRect(0, 0, size, size)

    const center = size / 2
    const radius = size / 2 - 2

    // 1. 绘制星球圆盘并裁剪
    ctx.save()
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.clip()

    // 2. 从表面纹理画布中截取圆形区域
    ctx.drawImage(
      surfaceCanvas,
      rotation, 0, size, size,
      0, 0, size, size
    )
    // 为了无缝循环，在右侧补上一段开头
    if (rotation + size > surfaceWidth) {
      const overflow = rotation + size - surfaceWidth
      ctx.drawImage(
        surfaceCanvas,
        0, 0, overflow, size,
        size - overflow, 0, overflow, size
      )
    }

    ctx.restore()

    // 3. 球体光照与阴影（左侧暗部、右侧高光）
    const lightGradient = ctx.createRadialGradient(
      center - radius * 0.35,
      center - radius * 0.25,
      radius * 0.1,
      center,
      center,
      radius
    )
    lightGradient.addColorStop(0, 'rgba(255, 230, 200, 0.22)')
    lightGradient.addColorStop(0.35, 'rgba(255, 220, 180, 0.08)')
    lightGradient.addColorStop(0.65, 'rgba(0, 0, 0, 0)')
    lightGradient.addColorStop(0.9, 'rgba(0, 0, 0, 0.55)')
    lightGradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)')
    ctx.fillStyle = lightGradient
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.fill()

    // 4. 边缘大气散射
    const atmosphere = ctx.createRadialGradient(center, center, radius * 0.92, center, center, radius * 1.08)
    atmosphere.addColorStop(0, 'rgba(220, 120, 70, 0)')
    atmosphere.addColorStop(0.7, 'rgba(220, 120, 70, 0.15)')
    atmosphere.addColorStop(1, 'rgba(220, 120, 70, 0)')
    ctx.fillStyle = atmosphere
    ctx.beginPath()
    ctx.arc(center, center, radius * 1.1, 0, Math.PI * 2)
    ctx.fill()

    rafId = requestAnimationFrame(render)
  }

  render()
}

onMounted(() => {
  if (props.variant === 'mars' && !props.texture) {
    initMarsCanvas()
  }
})

onUnmounted(() => {
  isActive = false
  if (rafId) cancelAnimationFrame(rafId)
})

watch(() => [props.variant, props.texture], () => {
  if (props.variant === 'mars' && !props.texture) {
    isActive = false
    if (rafId) cancelAnimationFrame(rafId)
    initMarsCanvas()
  } else {
    isActive = false
    if (rafId) cancelAnimationFrame(rafId)
  }
})
</script>

<style scoped>
.cosmic-planet {
  position: relative;
  border-radius: 50%;
  transform-style: preserve-3d;
  transition: transform 0.6s var(--ease-out), filter 0.6s var(--ease-out);
}

.cosmic-planet:hover {
  transform: scale(1.02);
  filter: brightness(1.15);
}

.cosmic-planet__body {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  animation: planet-rotate var(--rotation-duration) linear infinite;
}

.cosmic-planet__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  pointer-events: none;
}

/* 纹理模式：使用真实 NASA 行星照片作为贴图 */
.cosmic-planet--textured .cosmic-planet__body {
  background-image: var(--planet-texture);
  background-size: cover;
  background-position: center;
  box-shadow: inset -30px -30px 80px rgba(0, 0, 0, 0.85);
}

/* 紫色变体在纹理模式下通过 hue-rotate + 蓝紫叠加层调出深空色调 */
.cosmic-planet--textured.cosmic-planet--purple .cosmic-planet__body {
  filter: hue-rotate(30deg) saturate(0.9) contrast(1.1);
}

.cosmic-planet--textured.cosmic-planet--purple .cosmic-planet__body::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 35%, rgba(74, 158, 255, 0.25), transparent 55%),
    radial-gradient(circle at 75% 75%, rgba(138, 43, 226, 0.2), transparent 60%);
  mix-blend-mode: overlay;
}

/* 紫色变体：深空星云紫（程序化渐变） */
.cosmic-planet--purple:not(.cosmic-planet--textured) .cosmic-planet__body {
  background:
    radial-gradient(circle at 35% 30%, rgba(122, 126, 188, 0.85), transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(36, 28, 68, 1), transparent 60%),
    linear-gradient(135deg, #26224a 0%, #181230 50%, #0d0818 100%);
  box-shadow: inset -30px -30px 80px rgba(0, 0, 0, 0.9);
}

/* 蓝色变体：科技深蓝（程序化渐变） */
.cosmic-planet--blue:not(.cosmic-planet--textured) .cosmic-planet__body {
  background:
    radial-gradient(circle at 35% 30%, rgba(74, 158, 255, 0.5), transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(10, 16, 37, 1), transparent 60%),
    linear-gradient(135deg, #1a2a4a 0%, #0a1025 50%, #050818 100%);
  box-shadow: inset -30px -30px 80px rgba(0, 0, 0, 0.9);
}

/* 火星变体：Canvas 绘制高细节表面，此处仅保留边缘阴影与辉光 */
.cosmic-planet--mars:not(.cosmic-planet--textured) .cosmic-planet__canvas {
  box-shadow:
    inset -40px -40px 100px rgba(0, 0, 0, 0.92),
    inset 20px 20px 60px rgba(0, 0, 0, 0.35);
}

.cosmic-planet--textured.cosmic-planet--mars .cosmic-planet__body {
  filter: hue-rotate(-140deg) saturate(1.2) contrast(1.15) brightness(1.05);
}

.cosmic-planet--textured.cosmic-planet--mars .cosmic-planet__body::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 35%, rgba(210, 90, 50, 0.3), transparent 55%),
    radial-gradient(circle at 75% 75%, rgba(70, 20, 15, 0.25), transparent 60%);
  mix-blend-mode: overlay;
}

/* 冰封变体：苍白冻土 */
.cosmic-planet--ice:not(.cosmic-planet--textured) .cosmic-planet__body {
  background:
    radial-gradient(circle at 35% 30%, rgba(160, 210, 230, 0.6), transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(25, 45, 65, 1), transparent 60%),
    linear-gradient(135deg, #3a5a6a 0%, #1e3240 50%, #0d161c 100%);
  box-shadow: inset -30px -30px 80px rgba(0, 0, 0, 0.9);
}

.cosmic-planet--textured.cosmic-planet--ice .cosmic-planet__body {
  filter: hue-rotate(160deg) saturate(0.6) contrast(1.1) brightness(1.15);
}

.cosmic-planet--textured.cosmic-planet--ice .cosmic-planet__body::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 35%, rgba(160, 210, 230, 0.25), transparent 55%),
    radial-gradient(circle at 75% 75%, rgba(25, 45, 65, 0.2), transparent 60%);
  mix-blend-mode: overlay;
}

/* 气态巨星变体：条带状大气 */
.cosmic-planet--gas-giant:not(.cosmic-planet--textured) .cosmic-planet__body {
  background:
    radial-gradient(circle at 35% 30%, rgba(200, 150, 80, 0.55), transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(60, 40, 20, 1), transparent 60%),
    repeating-linear-gradient(
      180deg,
      #4a3018 0%,
      #7a5028 8%,
      #a07038 16%,
      #4a3018 24%,
      #2a1a0c 32%,
      #5a3818 40%,
      #8a5a30 48%,
      #3a240e 56%
    );
  box-shadow: inset -30px -30px 80px rgba(0, 0, 0, 0.9);
}

.cosmic-planet--textured.cosmic-planet--gas-giant .cosmic-planet__body {
  filter: hue-rotate(-100deg) saturate(0.9) contrast(1.05) brightness(0.95);
}

.cosmic-planet__glow {
  position: absolute;
  inset: -12%;
  border-radius: 50%;
  filter: blur(32px);
  opacity: 0.4;
  transition: opacity 0.6s var(--ease-out);
}

.cosmic-planet--purple .cosmic-planet__glow {
  background: radial-gradient(circle, rgba(80, 70, 160, 0.35), transparent 70%);
}

.cosmic-planet--blue .cosmic-planet__glow {
  background: radial-gradient(circle, rgba(74, 158, 255, 0.3), transparent 70%);
}

.cosmic-planet--mars .cosmic-planet__glow {
  background: radial-gradient(circle, rgba(180, 70, 40, 0.35), transparent 70%);
}

.cosmic-planet--ice .cosmic-planet__glow {
  background: radial-gradient(circle, rgba(120, 180, 210, 0.3), transparent 70%);
}

.cosmic-planet--gas-giant .cosmic-planet__glow {
  background: radial-gradient(circle, rgba(180, 130, 60, 0.3), transparent 70%);
}

.cosmic-planet:hover .cosmic-planet__glow {
  opacity: 0.7;
}

.cosmic-planet__rings {
  position: absolute;
  inset: -25%;
  pointer-events: none;
}

.cosmic-planet__atmosphere {
  position: absolute;
  inset: -4%;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow:
    0 0 20px rgba(255, 255, 255, 0.08),
    0 0 40px rgba(74, 158, 255, 0.08),
    inset 0 0 30px rgba(255, 255, 255, 0.04);
  pointer-events: none;
}

.cosmic-planet--mars .cosmic-planet__atmosphere {
  box-shadow:
    0 0 20px rgba(255, 200, 160, 0.08),
    0 0 50px rgba(180, 70, 40, 0.12),
    inset 0 0 30px rgba(255, 220, 190, 0.04);
}

@keyframes planet-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .cosmic-planet__body {
    animation: none;
  }
}
</style>
