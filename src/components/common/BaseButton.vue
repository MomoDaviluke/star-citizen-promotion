<!--
  @file 统一按钮组件
  @description 提供多种样式变体的按钮组件，统一网站按钮风格
  @module components/common/BaseButton
-->

<template>
  <button
    class="base-button"
    :class="[
      `base-button--${variant}`,
      `base-button--${size}`,
      {
        'is-disabled': disabled,
        'is-loading': loading,
        'is-icon-only': iconOnly
      }
    ]"
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
  >
    <!-- 加载指示器 -->
    <span v-if="loading" class="button-loader">
      <span class="loader-spinner"></span>
    </span>

    <!-- 左侧图标 -->
    <span v-if="$slots.icon && !loading && iconPosition === 'left'" class="button-icon button-icon--left">
      <slot name="icon" />
    </span>

    <!-- 按钮文本 -->
    <span v-if="!iconOnly" class="button-text">
      <slot />
    </span>

    <!-- 右侧图标 -->
    <span v-if="$slots.icon && !loading && iconPosition === 'right'" class="button-icon button-icon--right">
      <slot name="icon" />
    </span>

    <!-- 科幻边框效果 -->
    <span v-if="variant === 'primary' || variant === 'cta' || variant === 'accent'" class="button-border-effect"></span>
  </button>
</template>

<script setup>
/**
 * 基础按钮组件
 * @props {string} variant - 按钮样式变体 (primary|secondary|outline|ghost|danger|success|cta)
 * @props {string} size - 按钮尺寸 (sm|md|lg|xl)
 * @props {boolean} disabled - 是否禁用
 * @props {boolean} loading - 是否加载中
 * @props {boolean} iconOnly - 是否仅显示图标
 * @props {string} iconPosition - 图标位置 (left|right)
 * @props {string} type - 按钮类型 (button|submit|reset)
 * @emits {click} 点击事件
 */

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'cta'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  iconOnly: {
    type: Boolean,
    default: false
  },
  iconPosition: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'right'].includes(value)
  },
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value)
  }
})

const emit = defineEmits(['click'])

/**
 * 处理点击事件
 * @param {MouseEvent} event - 点击事件
 */
function handleClick(event) {
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<style scoped>
.base-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  font-family: inherit;
  font-size: var(--text-base);
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 0.05em;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-normal);
  overflow: hidden;
  user-select: none;
  white-space: nowrap;
}

/* ========== 尺寸变体 ========== */
.base-button--sm {
  padding: 0.375rem 0.75rem;
  font-size: var(--text-sm);
}

.base-button--md {
  padding: 0.625rem 1.25rem;
  font-size: var(--text-base);
}

.base-button--lg {
  padding: 0.875rem 1.75rem;
  font-size: var(--text-lg);
}

.base-button--xl {
  padding: 1rem 2rem;
  font-size: var(--text-xl);
}

/* ========== 样式变体 ========== */
/* 主要按钮 */
.base-button--primary {
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-bright));
  color: var(--color-bg);
  border-color: var(--color-accent);
  box-shadow: var(--glow-accent);
}

.base-button--primary:hover:not(.is-disabled):not(.is-loading) {
  transform: translateY(-2px);
  box-shadow: var(--glow-accent);
}

.base-button--primary:active:not(.is-disabled):not(.is-loading) {
  transform: translateY(0);
}

/* 次要按钮 */
.base-button--secondary {
  background: var(--color-bg-mid);
  color: var(--color-text-heading);
  border-color: var(--color-border);
}

.base-button--secondary:hover:not(.is-disabled):not(.is-loading) {
  background: var(--color-bg-elevated);
  border-color: var(--color-accent);
}

/* 轮廓按钮 */
.base-button--outline {
  background: transparent;
  color: var(--color-accent);
  border-color: var(--color-border);
}

.base-button--outline:hover:not(.is-disabled):not(.is-loading) {
  background: rgba(95, 169, 255, 0.1);
  border-color: var(--color-accent);
}

/* 幽灵按钮 */
.base-button--ghost {
  background: transparent;
  color: var(--color-text-label);
  border-color: transparent;
}

.base-button--ghost:hover:not(.is-disabled):not(.is-loading) {
  background: rgba(95, 169, 255, 0.05);
  color: var(--color-text-heading);
}

/* 危险按钮 */
.base-button--danger {
  background: var(--color-status-danger);
  color: white;
  border-color: var(--color-status-danger);
}

.base-button--danger:hover:not(.is-disabled):not(.is-loading) {
  background: #ff5252;
  box-shadow: var(--glow-status-danger);
}

/* CTA 按钮 — 琥珀色主行动按钮，用于 Hero 和 CTA 区 */
.base-button--cta {
  background: var(--color-highlight);
  color: var(--color-bg);
  border-color: var(--color-highlight);
  box-shadow: 0 0 20px rgba(255, 179, 0, 0.3);
}

.base-button--cta:hover:not(.is-disabled):not(.is-loading) {
  background: var(--color-highlight-bright);
  box-shadow: 0 0 30px rgba(255, 179, 0, 0.5);
  transform: translateY(-2px);
}

.base-button--cta:active:not(.is-disabled):not(.is-loading) {
  transform: translateY(0);
}

/* 成功按钮 */
.base-button--success {
  background: var(--color-status-online);
  color: var(--color-bg);
  border-color: var(--color-status-online);
}

.base-button--success:hover:not(.is-disabled):not(.is-loading) {
  background: #3dd9c4;
  box-shadow: var(--glow-status-success);
}

/* ========== 禁用状态 ========== */
.base-button.is-disabled,
.base-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* ========== 加载状态 ========== */
.base-button.is-loading {
  cursor: wait;
  position: relative;
}

.button-loader {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.loader-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ========== 图标 ========== */
.button-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25em;
  height: 1.25em;
}

.button-icon svg {
  width: 100%;
  height: 100%;
}

.base-button.is-icon-only {
  aspect-ratio: 1;
  padding: 0.625rem;
}

/* ========== 科幻边框效果 ========== */
.button-border-effect {
  position: absolute;
  inset: -1px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
  opacity: 0;
  transition: opacity var(--duration-normal);
  mask-image: linear-gradient(90deg, transparent 0%, black 50%, transparent 100%);
  pointer-events: none;
  z-index: -1;
}

.base-button:hover .button-border-effect {
  opacity: 0.3;
}

/* ========== 动画 ========== */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ========== 响应式 ========== */
/*
 * 移动端触控目标优化（WCAG 2.5.5）
 * 桌面端按钮通常 30~48px 高度，移动端需保证 ≥44px 最小触控目标
 * 因此移动端应增大而非缩小尺寸，与桌面端相反
 */
@media (max-width: 768px) {
  .base-button {
    min-height: 44px;
    padding: 0.75rem 1.25rem;
    font-size: var(--text-base);
  }

  /* sm 在移动端不再使用紧凑尺寸 */
  .base-button--sm {
    padding: 0.75rem 1rem;
    min-height: 44px;
    font-size: var(--text-sm);
  }

  .base-button--lg {
    padding: 0.875rem 1.5rem;
    min-height: 48px;
    font-size: var(--text-lg);
  }

  .base-button--xl {
    padding: 1rem 1.75rem;
    min-height: 52px;
    font-size: var(--text-xl);
  }

  /* 仅图标按钮：触控目标必须 ≥44×44px */
  .base-button.is-icon-only {
    width: 44px;
    height: 44px;
    min-height: 44px;
    padding: 0;
  }
}
</style>
