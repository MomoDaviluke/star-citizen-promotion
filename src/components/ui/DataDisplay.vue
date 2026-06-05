<template>
  <!--
    DataDisplay - 数据显示器组件
    用于显示科幻风格的数值数据
    支持数字动画、单位显示、标签
  -->
  <div class="data-display">
    <span class="data-display__label font-data">{{ label }}</span>
    <div class="data-display__value">
      <span class="data-display__number font-data">{{ displayValue }}</span>
      <span v-if="unit" class="data-display__unit font-data">{{ unit }}</span>
    </div>
    <div v-if="trend !== null" class="data-display__trend" :class="trendClass">
      <span class="data-display__trend-icon">{{ trendIcon }}</span>
      <span class="data-display__trend-value font-data">{{ Math.abs(trend) }}%</span>
    </div>
  </div>
</template>

<script setup>
/**
 * DataDisplay - 数据显示器组件
 *
 * @param {string} label - 数据标签
 * @param {number|string} value - 数值
 * @param {string} unit - 单位
 * @param {number} trend - 变化趋势百分比 (正数上升，负数下降)
 * @param {boolean} animated - 是否启用数字动画
 * @param {number} decimals - 小数位数
 */

import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  unit: { type: String, default: '' },
  trend: { type: Number, default: null },
  animated: { type: Boolean, default: true },
  decimals: { type: Number, default: 0 }
});

const displayValue = ref('0');
const isAnimating = ref(false);

// 趋势样式
const trendClass = computed(() => {
  if (props.trend === null) return '';
  return props.trend >= 0 ? 'data-display__trend--up' : 'data-display__trend--down';
});

// 趋势图标
const trendIcon = computed(() => {
  if (props.trend === null) return '';
  return props.trend >= 0 ? '▲' : '▼';
});

/**
 * 数字动画
 */
function animateValue(targetValue) {
  if (!props.animated) {
    displayValue.value = formatValue(targetValue);
    return;
  }

  isAnimating.value = true;
  const startValue = parseFloat(displayValue.value) || 0;
  const endValue = parseFloat(targetValue);
  const duration = 1000;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 使用 easeOutExpo 缓动
    const easeProgress = 1 - Math.pow(2, -10 * progress);
    const currentValue = startValue + (endValue - startValue) * easeProgress;

    displayValue.value = formatValue(currentValue);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      isAnimating.value = false;
    }
  }

  requestAnimationFrame(update);
}

/**
 * 格式化数值
 */
function formatValue(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return val;

  return num.toFixed(props.decimals);
}

// 监听数值变化
watch(() => props.value, (newVal) => {
  animateValue(newVal);
}, { immediate: true });

onMounted(() => {
  animateValue(props.value);
});
</script>

<style scoped>
.data-display {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  background: rgba(0, 0, 0, 0.2);
  border-left: 2px solid var(--nebula-purple);
}

.data-display__label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.data-display__value {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
}

.data-display__number {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.05em;
}

.data-display__unit {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.data-display__trend {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
}

.data-display__trend--up {
  color: var(--status-online);
}

.data-display__trend--down {
  color: var(--status-danger);
}

.data-display__trend-icon {
  font-size: 0.6em;
}

.data-display__trend-value {
  letter-spacing: 0.05em;
}
</style>
