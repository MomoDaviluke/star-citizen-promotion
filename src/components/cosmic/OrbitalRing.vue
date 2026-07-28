<!--
  @file OrbitalRing 轨道环组件
  @description SVG 轨道环与缓慢移动的数据点
  @module components/cosmic/OrbitalRing
-->
<template>
  <svg
    class="orbital-ring"
    :viewBox="`0 0 ${size} ${size}`"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g :transform="`translate(${size / 2}, ${size / 2})`">
      <circle
        v-for="n in count"
        :key="n"
        class="orbital-ring__ring"
        :r="radius(n)"
        fill="none"
        stroke="rgba(74, 158, 255, 0.18)"
        stroke-width="1"
        stroke-dasharray="4 6"
      />
      <circle
        v-for="n in count"
        :key="`dot-${n}`"
        class="orbital-ring__dot"
        :r="2"
        fill="#4a9eff"
        :style="dotStyle(n)"
      />
    </g>
  </svg>
</template>

<script setup>
const props = defineProps({
  size: { type: Number, default: 520 },
  count: { type: Number, default: 2 },
  gap: { type: Number, default: 28 }
})

function radius(n) {
  return (props.size / 2) - 12 - (n - 1) * props.gap
}

function dotStyle(n) {
  const r = radius(n)
  const duration = 80 + n * 30
  return {
    offsetPath: `path('M ${-r} 0 A ${r} ${r} 0 1 1 ${r} 0 A ${r} ${r} 0 1 1 ${-r} 0')`,
    animation: `orbit-travel ${duration}s linear infinite`,
    animationDelay: `${n * -15}s`
  }
}
</script>

<style scoped>
.orbital-ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.orbital-ring__dot {
  will-change: offset-distance;
}

@keyframes orbit-travel {
  0% { offset-distance: 0%; }
  100% { offset-distance: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .orbital-ring__dot {
    animation: none;
  }
}
</style>
