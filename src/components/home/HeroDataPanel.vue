<!--
  @file Hero 数据读数面板
  @description 展示战队关键数据的小型 HUD 面板
-->
<template>
  <div class="hero-data-panel">
    <div v-for="item in items" :key="item.label" class="hero-data-panel__item">
      <span class="hero-data-panel__value">{{ item.value }}</span>
      <span class="hero-data-panel__label">{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup>
/**
 * Hero 数据面板组件
 * @props {Array<{value: string, label: string}>} items - 数据条目
 */
defineProps({
  items: {
    type: Array,
    required: true,
    validator: (value) => value.every(item =>
      typeof item.value === 'string' && typeof item.label === 'string'
    )
  }
})
</script>

<style scoped>
.hero-data-panel {
  display: flex;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
  padding: var(--space-4) 0;
}

.hero-data-panel__item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.hero-data-panel__value {
  font-family: var(--font-data);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-heading);
  letter-spacing: -0.02em;
}

.hero-data-panel__label {
  font-family: var(--font-data);
  font-size: var(--text-xs);
  color: var(--color-text-label);
  letter-spacing: 0.12em;
}

@media (max-width: 640px) {
  .hero-data-panel {
    gap: var(--space-4);
  }
  .hero-data-panel__value {
    font-size: var(--text-xl);
  }
}
</style>
