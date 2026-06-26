<!--
  @file TacticalGrid 战术网格组件
  @description CSS 渐变战术网格背景 + 缓慢扫描高光线
  @module components/cosmic/TacticalGrid
-->
<template>
  <div class="tactical-grid" aria-hidden="true">
    <div class="tactical-grid__lines"></div>
    <div class="tactical-grid__scan"></div>
  </div>
</template>

<style scoped>
.tactical-grid {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.tactical-grid__lines {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(74, 158, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(74, 158, 255, 0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 75%);
}

.tactical-grid__scan {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(74, 158, 255, 0.4), transparent);
  box-shadow: 0 0 20px rgba(74, 158, 255, 0.2);
  animation: grid-scan 5s linear infinite;
  opacity: 0.6;
}

@keyframes grid-scan {
  0% { top: -5%; opacity: 0; }
  10% { opacity: 0.6; }
  90% { opacity: 0.6; }
  100% { top: 105%; opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .tactical-grid__scan {
    animation: none;
  }
}
</style>
