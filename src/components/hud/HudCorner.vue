<!--
  @file HUD 角标装饰
  @description 用于卡片、面板四角的斜切角标，营造军事终端感
-->
<template>
  <div class="hud-corner" :class="[`hud-corner--${position}`, `hud-corner--${size}`]">
    <span class="hud-corner__line hud-corner__line--h"></span>
    <span class="hud-corner__line hud-corner__line--v"></span>
  </div>
</template>

<script setup>
/**
 * @typedef {Object} Props
 * @property {'top-left'|'top-right'|'bottom-left'|'bottom-right'} position - 角标位置
 * @property {'sm'|'md'|'lg'} size - 角标尺寸
 */
const props = defineProps({
  position: { type: String, default: 'top-left' },
  size: { type: String, default: 'md' }
})
</script>

<style scoped>
.hud-corner {
  position: absolute;
  width: var(--corner-size);
  height: var(--corner-size);
  pointer-events: none;
}

.hud-corner--sm { --corner-size: 12px; }
.hud-corner--md { --corner-size: 20px; }
.hud-corner--lg { --corner-size: 32px; }

.hud-corner__line {
  position: absolute;
  background: var(--color-hud-line);
}

.hud-corner__line--h {
  width: 100%;
  height: 1px;
}

.hud-corner__line--v {
  width: 1px;
  height: 100%;
}

.hud-corner--top-left { top: 0; left: 0; }
.hud-corner--top-left .hud-corner__line--h { top: 0; left: 0; }
.hud-corner--top-left .hud-corner__line--v { top: 0; left: 0; }

.hud-corner--top-right { top: 0; right: 0; }
.hud-corner--top-right .hud-corner__line--h { top: 0; right: 0; }
.hud-corner--top-right .hud-corner__line--v { top: 0; right: 0; }

.hud-corner--bottom-left { bottom: 0; left: 0; }
.hud-corner--bottom-left .hud-corner__line--h { bottom: 0; left: 0; }
.hud-corner--bottom-left .hud-corner__line--v { bottom: 0; left: 0; }

.hud-corner--bottom-right { bottom: 0; right: 0; }
.hud-corner--bottom-right .hud-corner__line--h { bottom: 0; right: 0; }
.hud-corner--bottom-right .hud-corner__line--v { bottom: 0; right: 0; }
</style>
