<!--
  @file CosmicPlanet 行星组件
  @description 具有体积感、自转、光晕、悬停增强的行星天体
  支持 CSS 程序化渐变与 NASA 真实纹理贴图两种模式
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
    <div class="cosmic-planet__body"></div>
    <div class="cosmic-planet__atmosphere"></div>
    <div class="cosmic-planet__rings">
      <slot name="rings"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

/**
 * 组件 Props 定义
 * @property {string} size - 行星尺寸：small / medium / large
 * @property {string} variant - 行星色系：purple / blue
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
  small: '180px',
  medium: '320px',
  large: '480px'
}

/**
 * 计算行星容器样式
 * 包含尺寸、CSS 自定义属性 --rotation-duration、以及真实纹理路径
 */
const planetStyle = computed(() => ({
  width: sizeMap[props.size],
  height: sizeMap[props.size],
  '--rotation-duration': `${props.rotationDuration}s`,
  '--planet-texture': props.texture ? `url(${props.texture})` : 'none'
}))
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

/* 火星变体：赤红荒漠 */
.cosmic-planet--mars:not(.cosmic-planet--textured) .cosmic-planet__body {
  background:
    radial-gradient(circle at 35% 30%, rgba(210, 90, 50, 0.65), transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(70, 20, 15, 1), transparent 60%),
    linear-gradient(135deg, #6d2418 0%, #3a120c 50%, #1a0806 100%);
  box-shadow: inset -30px -30px 80px rgba(0, 0, 0, 0.9);
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
