<!--
  @file HudTicker 滚动数据条
  @description 底部无限水平滚动的 HUD 状态数据条
  @module components/cosmic/HudTicker
-->
<template>
  <div class="hud-ticker">
    <div class="hud-ticker__track">
      <div class="hud-ticker__content">
        <span v-for="(item, index) in items" :key="index" class="hud-ticker__item">
          <span class="hud-ticker__dot"></span>
          {{ item }}
        </span>
      </div>
      <div class="hud-ticker__content" aria-hidden="true">
        <span v-for="(item, index) in items" :key="`dup-${index}`" class="hud-ticker__item">
          <span class="hud-ticker__dot"></span>
          {{ item }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 组件 Props 定义
 * @property {string[]} items - 滚动显示的文本条目数组
 */
defineProps({
  items: {
    type: Array,
    default: () => [
      'FLEET ONLINE',
      'SECTOR 7G CLEARED',
      'RECRUITING NOW',
      'SYSTEMS NOMINAL'
    ]
  }
})
</script>

<style scoped>
.hud-ticker {
  position: relative;
  overflow: hidden;
  border-top: 1px solid rgba(74, 158, 255, 0.15);
  background: rgba(5, 5, 8, 0.5);
  padding: 0.75rem 0;
}

.hud-ticker__track {
  display: flex;
  width: max-content;
  animation: ticker-scroll 30s linear infinite;
}

.hud-ticker__content {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.hud-ticker__item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 2rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  color: var(--color-text-body);
}

.hud-ticker__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-highlight);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes ticker-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

@media (prefers-reduced-motion: reduce) {
  .hud-ticker__track {
    animation: none;
  }
}
</style>
