<!--
/**
 * @file StatusIndicator 状态指示器组件
 * @description 显示系统/模块状态，支持多种状态类型和脉冲动画
 * @module components/ui/StatusIndicator
 */
-->
<template>
  <!--
    StatusIndicator - 状态指示器组件
    显示系统/模块状态，支持多种状态类型和动画
  -->
  <div
    :class="[
      'status-indicator',
      `status-indicator--${type}`,
      { 'status-indicator--pulse': pulse },
      { 'status-indicator--small': size === 'small' },
      { 'status-indicator--large': size === 'large' }
    ]"
  >
    <span class="status-indicator__dot"></span>
    <span v-if="label" class="status-indicator__label font-data">{{ label }}</span>
    <span v-if="showText" class="status-indicator__text font-data">{{ statusText }}</span>
  </div>
</template>

<script setup>
/**
 * StatusIndicator - 状态指示器组件
 *
 * @param {string} type - 状态类型: 'online' | 'warning' | 'danger' | 'offline' | 'busy'
 * @param {string} label - 标签文本
 * @param {boolean} pulse - 是否启用脉冲动画
 * @param {boolean} showText - 是否显示状态文本
 * @param {string} size - 尺寸: 'small' | 'normal' | 'large'
 */

import { computed } from 'vue';

const props = defineProps({
  type: {
    type: String,
    default: 'online',
    validator: (v) => ['online', 'warning', 'danger', 'offline', 'busy'].includes(v)
  },
  label: { type: String, default: '' },
  pulse: { type: Boolean, default: true },
  showText: { type: Boolean, default: false },
  size: {
    type: String,
    default: 'normal',
    validator: (v) => ['small', 'normal', 'large'].includes(v)
  }
});

// 状态文本映射
const statusTextMap = {
  online: '在线',
  warning: '警告',
  danger: '危险',
  offline: '离线',
  busy: '忙碌'
};

const statusText = computed(() => statusTextMap[props.type] || props.type);
</script>

<style scoped>
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.status-indicator__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

/* 在线状态 - 绿色 */
.status-indicator--online .status-indicator__dot {
  background: var(--color-status-online);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

/* 警告状态 - 琥珀色 */
.status-indicator--warning .status-indicator__dot {
  background: var(--color-status-warning);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
}

/* 危险状态 - 红色 */
.status-indicator--danger .status-indicator__dot {
  background: var(--color-status-danger);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
}

/* 离线状态 - 灰色 */
.status-indicator--offline .status-indicator__dot {
  background: var(--color-status-offline);
  box-shadow: none;
}

/* 忙碌状态 - 星云紫 */
.status-indicator--busy .status-indicator__dot {
  background: var(--nebula-purple);
  box-shadow: 0 0 8px rgba(124, 58, 237, 0.6);
}

/* 脉冲动画 */
.status-indicator--pulse .status-indicator__dot::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px solid currentColor;
  opacity: 0;
  animation: pulse-ring 2s ease-out infinite;
}

.status-indicator--online .status-indicator__dot::after {
  border-color: var(--color-status-online);
}

.status-indicator--warning .status-indicator__dot::after {
  border-color: var(--color-status-warning);
  animation-duration: 1s;
}

.status-indicator--danger .status-indicator__dot::after {
  border-color: var(--color-status-danger);
  animation-duration: 0.5s;
}

.status-indicator--busy .status-indicator__dot::after {
  border-color: var(--nebula-purple);
  animation-duration: 1.5s;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* 标签 */
.status-indicator__label {
  font-size: var(--text-sm);
  color: var(--color-text-label);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-indicator__text {
  font-size: var(--text-xs);
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* 尺寸变体 */
.status-indicator--small .status-indicator__dot {
  width: 6px;
  height: 6px;
}

.status-indicator--small .status-indicator__label,
.status-indicator--small .status-indicator__text {
  font-size: var(--text-xs);
}

.status-indicator--large .status-indicator__dot {
  width: 14px;
  height: 14px;
}

.status-indicator--large .status-indicator__label {
  font-size: var(--text-base);
}
</style>
