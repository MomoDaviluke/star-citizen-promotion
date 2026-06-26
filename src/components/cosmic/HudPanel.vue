<!--
  @file HudPanel 全息 HUD 面板
  @description 斜切边角、四角括号的 HUD 信息面板
  @module components/cosmic/HudPanel
-->
<template>
  <div class="hud-panel" :class="{ 'hud-panel--skewed': skewed }">
    <div class="hud-panel__accent-bar" aria-hidden="true"></div>
    <div class="hud-panel__scanline" aria-hidden="true"></div>
    <HudCorner position="top-left" :size="cornerSize" />
    <HudCorner position="top-right" :size="cornerSize" />
    <HudCorner position="bottom-left" :size="cornerSize" />
    <HudCorner position="bottom-right" :size="cornerSize" />
    <div class="hud-panel__content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import HudCorner from '../hud/HudCorner.vue'

/**
 * 组件 Props 定义
 * @property {boolean} skewed - 是否应用 12° 斜切效果
 * @property {string} cornerSize - 四角括号尺寸：sm / md / lg
 */
defineProps({
  skewed: {
    type: Boolean,
    default: true
  },
  cornerSize: {
    type: String,
    default: 'sm'
  }
})
</script>

<style scoped>
.hud-panel {
  position: relative;
  background: rgba(5, 5, 8, 0.6);
  border: 1px solid rgba(74, 158, 255, 0.2);
  padding: 1.25rem 1.5rem;
  backdrop-filter: blur(8px);
  transition: border-color 0.3s var(--ease-out), box-shadow 0.3s var(--ease-out);
}

.hud-panel--skewed {
  transform: skewX(-12deg);
}

.hud-panel--skewed .hud-panel__content {
  transform: skewX(12deg);
}

.hud-panel:hover {
  border-color: rgba(74, 158, 255, 0.4);
  box-shadow: 0 0 30px rgba(74, 158, 255, 0.08);
}

.hud-panel__content {
  position: relative;
  z-index: 1;
}

.hud-panel__accent-bar {
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  background: linear-gradient(180deg, transparent, var(--color-accent), transparent);
  opacity: 0.7;
  z-index: 0;
}

.hud-panel__scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(74, 158, 255, 0.03) 2px,
    rgba(74, 158, 255, 0.03) 4px
  );
  pointer-events: none;
  opacity: 0.5;
  z-index: 0;
}
</style>
