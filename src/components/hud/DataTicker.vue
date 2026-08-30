<!--
  @file 滚动数据条
  @description 用于 Hero 底部等位置展示动态状态信息
-->
<template>
  <div class="data-ticker" :class="{ 'data-ticker--vertical': vertical }">
    <div class="data-ticker__track" :style="trackStyle">
      <span
        v-for="(item, idx) in doubledItems"
        :key="idx"
        class="data-ticker__item"
      >
        <span class="data-ticker__dot"></span>
        {{ item }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  vertical: { type: Boolean, default: false },
  duration: { type: Number, default: 30 }
})

const doubledItems = computed(() => [...props.items, ...props.items])

const trackStyle = computed(() => ({
  animationDuration: `${props.duration}s`,
  animationDirection: props.vertical ? 'normal' : 'normal',
  flexDirection: props.vertical ? 'column' : 'row'
}))
</script>

<style scoped>
.data-ticker {
  overflow: hidden;
  white-space: nowrap;
  background: rgba(5, 5, 8, 0.6);
  border-top: 1px solid var(--color-hud-line);
  border-bottom: 1px solid var(--color-hud-line);
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.12em;
  color: var(--color-text-label);
}

.data-ticker--vertical {
  white-space: normal;
}

.data-ticker__track {
  display: inline-flex;
  gap: 2rem;
  padding: 0.75rem 0;
  animation: tickerScroll 30s linear infinite;
}

.data-ticker__item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.data-ticker__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 8px var(--color-accent);
}

@keyframes tickerScroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
</style>
