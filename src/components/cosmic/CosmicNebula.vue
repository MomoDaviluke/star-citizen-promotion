<!--
  @file CosmicNebula 星云背景组件
  @description 使用 CSS 多层径向渐变模拟星云，GPU 合成，性能远高于 Canvas
  @module components/cosmic/CosmicNebula
-->
<template>
  <div class="cosmic-nebula" aria-hidden="true">
    <div class="cosmic-nebula__layer cosmic-nebula__layer--back"></div>
    <div class="cosmic-nebula__layer cosmic-nebula__layer--mid"></div>
    <div class="cosmic-nebula__layer cosmic-nebula__layer--front"></div>
    <div class="cosmic-nebula__dust"></div>
  </div>
</template>

<style scoped>
.cosmic-nebula {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 30% 30%, #0a0f1a 0%, transparent 55%),
    radial-gradient(ellipse at 70% 80%, #05070d 0%, transparent 50%),
    #020205;
}

.cosmic-nebula__layer,
.cosmic-nebula__dust {
  position: absolute;
  inset: 0;
}

/* 后层：大紫星云 */
.cosmic-nebula__layer--back {
  background:
    radial-gradient(circle at 25% 35%, rgba(138, 43, 226, 0.22) 0%, transparent 45%),
    radial-gradient(circle at 75% 25%, rgba(138, 43, 226, 0.14) 0%, transparent 40%);
}

/* 中层：蓝色星云 */
.cosmic-nebula__layer--mid {
  background:
    radial-gradient(circle at 40% 60%, rgba(74, 158, 255, 0.16) 0%, transparent 38%),
    radial-gradient(circle at 70% 40%, rgba(74, 158, 255, 0.12) 0%, transparent 35%);
}

/* 前层：青色星云 */
.cosmic-nebula__layer--front {
  background:
    radial-gradient(circle at 60% 70%, rgba(6, 182, 212, 0.13) 0%, transparent 32%),
    radial-gradient(circle at 30% 50%, rgba(6, 182, 212, 0.09) 0%, transparent 28%);
}

/* 尘埃带 */
.cosmic-nebula__dust {
  background:
    linear-gradient(135deg, transparent 0%, rgba(74, 158, 255, 0.03) 35%, rgba(138, 43, 226, 0.02) 55%, transparent 100%);
  opacity: 0.7;
}
</style>
