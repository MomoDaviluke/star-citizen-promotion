<!--
  @file 局部扫描线效果
  @description 仅在需要的地方叠加扫描线，不再全站固定
-->
<template>
  <div class="scanline" aria-hidden="true"></div>
</template>

<style scoped>
.scanline {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  opacity: 0.06;
}

.scanline::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.5) 2px,
    rgba(0, 0, 0, 0.5) 4px
  );
  animation: scanlineMove 8s linear infinite;
}

@keyframes scanlineMove {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}
</style>
