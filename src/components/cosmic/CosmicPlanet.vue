<!--
  @file CosmicPlanet 行星组件
  @description 具有体积感、自转、光晕、悬停增强的行星天体
  支持 CSS 程序化渐变、Canvas 程序化生成与真实纹理贴图三种模式
  @module components/cosmic/CosmicPlanet
-->
<template>
  <div
    ref="planetRef"
    class="cosmic-planet"
    :class="[
      `cosmic-planet--${size}`,
      `cosmic-planet--${variant}`,
      { 'cosmic-planet--textured': shouldUseTexture }
    ]"
    :style="planetStyle"
  >
    <div class="cosmic-planet__glow"></div>
    <!--
      纹理模式：优先使用 CSS background-image 旋转贴图，性能远高于 Canvas 逐像素渲染。
      无纹理时才走 Canvas 程序化生成。
    -->
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
import { PlanetRenderer } from '@/services/planet/index.js'

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
  '--planet-texture': shouldUseTexture.value ? `url(${props.texture})` : 'none'
}))

/**
 * 纹理懒加载控制
 * 仅当行星进入视口且纹理图片预加载完成后，才应用 textured 样式。
 * 避免首屏直接下载可能很大的 NASA 纹理，同时防止未进入视口时无效渲染。
 */
const planetRef = ref(null)
const isTextureReady = ref(false)
const marsCanvas = ref(null)
let planetRenderer = null

const shouldUseTexture = computed(() => !!props.texture && isTextureReady.value)

/**
 * 创建并初始化 PlanetRenderer 实例
 * 将 Canvas 渲染、纹理懒加载、可见性观察等逻辑委托给渲染服务层
 */
function createRenderer() {
  if (!planetRef.value) return

  planetRenderer = new PlanetRenderer({
    container: planetRef.value,
    canvas: marsCanvas.value,
    variant: props.variant,
    size: canvasSize.value,
    rotationDuration: props.rotationDuration,
    texture: props.texture
  })

  planetRenderer.setTextureReadyCallback((ready) => {
    isTextureReady.value = ready
  })

  planetRenderer.init()
}

/**
 * 释放当前渲染器并清理资源
 */
function disposeRenderer() {
  if (planetRenderer) {
    planetRenderer.dispose()
    planetRenderer = null
  }
}

onMounted(() => {
  createRenderer()
})

onUnmounted(() => {
  disposeRenderer()
})

watch(
  () => [props.variant, props.texture, props.size, props.rotationDuration],
  () => {
    isTextureReady.value = false
    disposeRenderer()
    createRenderer()
  }
)
</script>

<style scoped>
.cosmic-planet {
  position: relative;
  border-radius: 50%;
  transform-style: preserve-3d;
  transition: transform 0.6s var(--ease-out), filter 0.6s var(--ease-out);
  contain: layout paint;
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
.cosmic-planet--textured.cosmic-planet--mars .cosmic-planet__body {
  background-size: auto 100%;
  background-repeat: repeat-x;
  animation: mars-texture-rotate var(--rotation-duration) linear infinite;
  box-shadow:
    inset -40px -40px 100px rgba(0, 0, 0, 0.85),
    inset 15px 15px 50px rgba(0, 0, 0, 0.35);
}

@keyframes mars-texture-rotate {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

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

/* 火星变体：Canvas 绘制真实 NASA 纹理球体 */
.cosmic-planet--mars .cosmic-planet__canvas {
  border-radius: 50%;
  box-shadow:
    inset -40px -40px 100px rgba(0, 0, 0, 0.85),
    inset 15px 15px 50px rgba(0, 0, 0, 0.35);
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
