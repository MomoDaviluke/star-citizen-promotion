<!--
  @file 统一徽章组件
  @description 提供标签、状态指示、计数等功能
  @module components/common/BaseBadge
-->

<template>
  <span
    class="base-badge"
    :class="[
      `base-badge--${variant}`,
      `base-badge--${size}`,
      {
        'is-rounded': rounded,
        'is-pill': pill,
        'is-dot': dot,
        'is-outline': outline
      }
    ]"
    :style="customColor ? { backgroundColor: customColor, borderColor: customColor } : {}"
  >
    <!-- 点状样式 -->
    <span v-if="dot" class="badge-dot"></span>
    
    <!-- 图标 -->
    <span v-if="$slots.icon && !dot" class="badge-icon">
      <slot name="icon" />
    </span>

    <!-- 内容 -->
    <span v-if="!dot" class="badge-content">
      <slot>{{ text }}</slot>
    </span>

    <!-- 关闭按钮 -->
    <button
      v-if="closable"
      class="badge-close"
      @click.stop="handleClose"
      aria-label="关闭"
    >
      ×
    </button>
  </span>
</template>

<script setup>
/**
 * 基础徽章组件
 * @props {string} text - 徽章文本
 * @props {string} variant - 样式变体 (primary|secondary|success|warning|danger|info)
 * @props {string} size - 尺寸 (sm|md|lg)
 * @props {boolean} rounded - 是否圆形
 * @props {boolean} pill - 是否药丸形状
 * @props {boolean} dot - 是否点状样式
 * @props {boolean} outline - 是否轮廓样式
 * @props {boolean} closable - 是否可关闭
 * @props {string} customColor - 自定义颜色
 * @emits {close} 关闭事件
 */

defineProps({
  text: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'warning', 'danger', 'info'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  rounded: {
    type: Boolean,
    default: false
  },
  pill: {
    type: Boolean,
    default: false
  },
  dot: {
    type: Boolean,
    default: false
  },
  outline: {
    type: Boolean,
    default: false
  },
  closable: {
    type: Boolean,
    default: false
  },
  customColor: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

/**
 * 处理关闭事件
 * @param {MouseEvent} event - 点击事件
 */
function handleClose(event) {
  emit('close', event)
}
</script>

<style scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: 1.5;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  white-space: nowrap;
}

/* ========== 尺寸变体 ========== */
.base-badge--sm {
  padding: 0.125rem 0.5rem;
  font-size: var(--text-xs);
}

.base-badge--md {
  padding: 0.25rem 0.75rem;
  font-size: var(--text-sm);
}

.base-badge--lg {
  padding: 0.375rem 1rem;
  font-size: var(--text-base);
}

/* ========== 样式变体 ========== */
.base-badge--primary {
  background: rgba(95, 169, 255, 0.2);
  color: var(--color-primary);
  border-color: rgba(95, 169, 255, 0.3);
}

.base-badge--primary.is-outline {
  background: transparent;
}

.base-badge--secondary {
  background: var(--bg-medium);
  color: var(--text-secondary);
  border-color: var(--border-subtle);
}

.base-badge--success {
  background: rgba(78, 205, 196, 0.2);
  color: var(--color-success);
  border-color: rgba(78, 205, 196, 0.3);
}

.base-badge--warning {
  background: rgba(240, 173, 78, 0.2);
  color: var(--color-warning);
  border-color: rgba(240, 173, 78, 0.3);
}

.base-badge--danger {
  background: rgba(255, 107, 107, 0.2);
  color: var(--color-danger);
  border-color: rgba(255, 107, 107, 0.3);
}

.base-badge--info {
  background: rgba(95, 169, 255, 0.2);
  color: var(--color-accent);
  border-color: rgba(95, 169, 255, 0.3);
}

/* ========== 圆角样式 ========== */
.base-badge.is-rounded {
  border-radius: var(--radius-lg);
}

.base-badge.is-pill {
  border-radius: 999px;
}

/* ========== 点状样式 ========== */
.base-badge.is-dot {
  padding: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.base-badge--sm.is-dot {
  width: 6px;
  height: 6px;
}

.base-badge--lg.is-dot {
  width: 12px;
  height: 12px;
}

.badge-dot {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  animation: pulseDot 2s ease-in-out infinite;
}

@keyframes pulseDot {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* ========== 图标 ========== */
.badge-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
}

.badge-icon svg {
  width: 100%;
  height: 100%;
}

/* ========== 关闭按钮 ========== */
.badge-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity var(--transition-fast);
  font-size: 1.125em;
  line-height: 1;
}

.badge-close:hover {
  opacity: 1;
}

/* ========== 科幻光晕效果 ========== */
.base-badge--primary:not(.is-outline):not(.is-dot) {
  box-shadow: 0 0 10px rgba(95, 169, 255, 0.2);
}

.base-badge--success:not(.is-outline):not(.is-dot) {
  box-shadow: 0 0 10px rgba(78, 205, 196, 0.2);
}

.base-badge--warning:not(.is-outline):not(.is-dot) {
  box-shadow: 0 0 10px rgba(240, 173, 78, 0.2);
}

.base-badge--danger:not(.is-outline):not(.is-dot) {
  box-shadow: 0 0 10px rgba(255, 107, 107, 0.2);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .base-badge {
    font-size: var(--text-xs);
  }

  .base-badge--lg {
    font-size: var(--text-sm);
  }
}
</style>
