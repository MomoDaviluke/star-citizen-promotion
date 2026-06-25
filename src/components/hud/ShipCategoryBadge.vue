<!--
  @file 舰船类别徽章
  @description 统一风格的舰船分类标签
-->
<template>
  <span class="ship-category" :class="`ship-category--${categoryEn}`">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  category: { type: String, required: true } // 中文类别
})

const categoryMap = {
  '战斗': { label: 'COMBAT', key: 'combat' },
  '探索': { label: 'EXPLORATION', key: 'exploration' },
  '运输': { label: 'TRANSPORT', key: 'transport' },
  '截击': { label: 'INTERCEPTOR', key: 'interceptor' },
  '竞速': { label: 'RACING', key: 'racing' },
  '军用': { label: 'MILITARY', key: 'military' }
}

const config = computed(() => categoryMap[props.category] || { label: props.category.toUpperCase(), key: 'default' })
const label = computed(() => config.value.label)
const categoryEn = computed(() => config.value.key)
</script>

<style scoped>
.ship-category {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.6rem;
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid currentColor;
  border-radius: var(--radius-sm);
  background: currentColor;
  -webkit-background-clip: text;
  background-clip: text;
  color: var(--color-text-label);
}

.ship-category--combat { color: var(--color-status-danger); background: rgba(239, 68, 68, 0.1); }
.ship-category--exploration { color: var(--color-accent); background: rgba(74, 158, 255, 0.1); }
.ship-category--transport { color: var(--color-highlight); background: rgba(255, 179, 0, 0.1); }
.ship-category--interceptor { color: #a78bfa; background: rgba(167, 139, 250, 0.1); }
.ship-category--racing { color: #f472b6; background: rgba(244, 114, 182, 0.1); }
.ship-category--military { color: #22c55e; background: rgba(34, 197, 94, 0.1); }
</style>
