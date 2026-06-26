<!--
  @file CosmicPlanet 行星组件
  @description 具有体积感、自转、光晕、悬停增强的行星天体
  @module components/cosmic/CosmicPlanet
-->
<template>
  <div
    class="cosmic-planet"
    :class="[`cosmic-planet--${size}`, `cosmic-planet--${variant}`]"
    :style="planetStyle"
  >
    <div class="cosmic-planet__glow"></div>
    <div class="cosmic-planet__body"></div>
    <div class="cosmic-planet__atmosphere"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

/**
 * 组件 Props 定义
 * @property {string} size - 行星尺寸：small / medium / large
 * @property {string} variant - 行星色系：purple / blue
 * @property {number} rotationDuration - 自转周期（秒）
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
    validator: (value) => ['purple', 'blue'].includes(value)
  },
  rotationDuration: {
    type: Number,
    default: 90
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
 * 包含尺寸与 CSS 自定义属性 --rotation-duration
 */
const planetStyle = computed(() => ({
  width: sizeMap[props.size],
  height: sizeMap[props.size],
  '--rotation-duration': `${props.rotationDuration}s`
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

/* 紫色变体：深空星云紫 */
.cosmic-planet--purple .cosmic-planet__body {
  background:
    radial-gradient(circle at 35% 30%, rgba(122, 106, 168, 0.9), transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(26, 18, 48, 1), transparent 60%),
    linear-gradient(135deg, #2a1f4a 0%, #1a1230 50%, #0f0a1c 100%);
  box-shadow: inset -30px -30px 80px rgba(0, 0, 0, 0.9);
}

/* 蓝色变体：科技深蓝 */
.cosmic-planet--blue .cosmic-planet__body {
  background:
    radial-gradient(circle at 35% 30%, rgba(74, 158, 255, 0.5), transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(10, 16, 37, 1), transparent 60%),
    linear-gradient(135deg, #1a2a4a 0%, #0a1025 50%, #050818 100%);
  box-shadow: inset -30px -30px 80px rgba(0, 0, 0, 0.9);
}

.cosmic-planet__glow {
  position: absolute;
  inset: -8%;
  border-radius: 50%;
  filter: blur(20px);
  opacity: 0.4;
  transition: opacity 0.6s var(--ease-out);
}

.cosmic-planet--purple .cosmic-planet__glow {
  background: radial-gradient(circle, rgba(74, 46, 106, 0.6), transparent 70%);
}

.cosmic-planet--blue .cosmic-planet__glow {
  background: radial-gradient(circle, rgba(74, 158, 255, 0.25), transparent 70%);
}

.cosmic-planet:hover .cosmic-planet__glow {
  opacity: 0.65;
}

.cosmic-planet__atmosphere {
  position: absolute;
  inset: -4%;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 40px rgba(74, 158, 255, 0.08);
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
