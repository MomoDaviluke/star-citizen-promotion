<!--
  @file 星图网格背景
  @description 用于 Hero 等区域的 faint 星图网格背景
-->
<template>
  <div class="star-map" aria-hidden="true">
    <div class="star-map__grid"></div>
    <div class="star-map__dots">
      <span
        v-for="n in dotCount"
        :key="n"
        class="star-map__dot"
        :style="dotStyle(n)"
      ></span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  dotCount: { type: Number, default: 24 }
})

// 预生成固定坐标，避免 SSR/ hydration 不一致
const dots = Array.from({ length: props.dotCount }, (_, i) => ({
  left: `${(i * 37.3) % 100}%`,
  top: `${(i * 61.7) % 100}%`,
  delay: `${(i * 0.7) % 5}s`,
  size: `${1 + (i % 3)}px`
}))

function dotStyle(n) {
  const d = dots[n - 1]
  return {
    left: d.left,
    top: d.top,
    width: d.size,
    height: d.size,
    animationDelay: d.delay
  }
}
</script>

<style scoped>
.star-map {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: -1;
}

.star-map__grid {
  position: absolute;
  inset: -50%;
  background-image:
    linear-gradient(var(--color-hud-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-hud-line) 1px, transparent 1px);
  background-size: 80px 80px;
  transform: perspective(500px) rotateX(60deg);
  opacity: 0.4;
  animation: starMapDrift 60s linear infinite;
}

.star-map__dot {
  position: absolute;
  background: var(--color-starfield);
  border-radius: 50%;
  opacity: 0;
  animation: starMapPulse 4s ease-in-out infinite;
}

@keyframes starMapDrift {
  0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
  100% { transform: perspective(500px) rotateX(60deg) translateY(80px); }
}

@keyframes starMapPulse {
  0%, 100% { opacity: 0; transform: scale(0.8); }
  50% { opacity: 0.8; transform: scale(1.2); }
}
</style>
