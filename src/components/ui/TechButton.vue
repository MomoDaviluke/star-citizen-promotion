<!--
/**
 * @file TechButton 科技风格按钮组件
 * @description 支持多种变体、尺寸和特效的按钮组件
 * @module components/ui/TechButton
 */
-->
<template>
  <!--
    TechButton - 科技风格按钮组件
    支持多种变体、尺寸和特效
  -->
  <button
    :class="[
      'tech-button',
      `tech-button--${variant}`,
      `tech-button--${size}`,
      { 'tech-button--glow': glow },
      { 'tech-button--block': block },
      { 'tech-button--loading': loading },
      { 'tech-button--disabled': disabled }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <!-- 加载动画 -->
    <span v-if="loading" class="tech-button__loader"></span>

    <!-- 图标 -->
    <span v-if="icon && !loading" class="tech-button__icon">{{ icon }}</span>

    <!-- 文字内容 -->
    <span class="tech-button__text">
      <slot>{{ label }}</slot>
    </span>

    <!-- 装饰边角 -->
    <span class="tech-button__corner tech-button__corner--tl"></span>
    <span class="tech-button__corner tech-button__corner--tr"></span>
    <span class="tech-button__corner tech-button__corner--bl"></span>
    <span class="tech-button__corner tech-button__corner--br"></span>

    <!-- 波纹效果容器 -->
    <span
      v-for="ripple in ripples"
      :key="ripple.id"
      class="tech-button__ripple"
      :style="ripple.style"
    ></span>
  </button>
</template>

<script setup>
/**
 * TechButton - 科技风格按钮
 *
 * @param {string} variant - 变体: 'primary' | 'secondary' | 'danger' | 'ghost'
 * @param {string} size - 尺寸: 'small' | 'normal' | 'large'
 * @param {string} label - 按钮文字
 * @param {string} icon - 图标
 * @param {boolean} glow - 是否启用发光效果
 * @param {boolean} block - 是否块级显示
 * @param {boolean} loading - 是否加载中
 * @param {boolean} disabled - 是否禁用
 */

import { ref } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'danger', 'ghost'].includes(v)
  },
  size: {
    type: String,
    default: 'normal',
    validator: (v) => ['small', 'normal', 'large'].includes(v)
  },
  label: { type: String, default: '' },
  icon: { type: String, default: '' },
  glow: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
});

const emit = defineEmits(['click']);

/** 波纹动画状态列表 */
const ripples = ref([])
let rippleCounter = 0

/**
 * 创建波纹效果
 * @param {MouseEvent} e - 点击事件
 */
function createRipple(e) {
  const btn = e.currentTarget
  const rect = btn.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height) * 2
  const x = e.clientX - rect.left - size / 2
  const y = e.clientY - rect.top - size / 2

  const id = ++rippleCounter
  const ripple = {
    id,
    style: {
      width: `${size}px`,
      height: `${size}px`,
      left: `${x}px`,
      top: `${y}px`
    }
  }

  ripples.value.push(ripple)

  /** 动画结束后移除波纹 DOM */
  setTimeout(() => {
    ripples.value = ripples.value.filter(r => r.id !== id)
  }, 600)
}

function handleClick(e) {
  if (!props.loading && !props.disabled) {
    createRipple(e)
    emit('click', e);
  }
}
</script>

<style scoped>
.tech-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  font-family: var(--font-tech);
  font-size: var(--text-sm);
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-heading);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  overflow: hidden;
  transition: all var(--duration-normal);
  white-space: nowrap;
}

/* 主按钮 - 琥珀色 */
.tech-button--primary {
  background: rgba(245, 158, 11, 0.1);
  border-color: var(--amber-primary);
  color: var(--amber-primary);
  box-shadow:
    0 0 0 1px rgba(245, 158, 11, 0.3),
    0 0 24px rgba(245, 158, 11, 0.15);
  transition: box-shadow 0.3s var(--ease-out), transform 0.3s var(--ease-out), background 0.3s var(--ease-out);
}

.tech-button--primary:hover:not(:disabled) {
  background: rgba(245, 158, 11, 0.2);
  box-shadow:
    0 0 0 1px rgba(245, 158, 11, 0.6),
    0 0 40px rgba(245, 158, 11, 0.35);
  transform: translateY(-2px);
}

/* 副按钮 - 星云紫 */
.tech-button--secondary {
  background: rgba(124, 58, 237, 0.1);
  border-color: var(--nebula-purple);
  color: var(--nebula-purple);
}

.tech-button--secondary:hover:not(:disabled) {
  background: rgba(124, 58, 237, 0.2);
  box-shadow: var(--nebula-purple);
}

/* 危险按钮 */
.tech-button--danger {
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--color-status-danger);
  color: var(--color-status-danger);
}

.tech-button--danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
}

/* 幽灵按钮 */
.tech-button--ghost {
  border-color: var(--color-border);
  color: var(--color-text-label);
}

.tech-button--ghost:hover:not(:disabled) {
  border-color: var(--amber-primary);
  color: var(--amber-primary);
}

/* 尺寸 */
.tech-button--small {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
}

.tech-button--large {
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-base);
}

/* 块级 */
.tech-button--block {
  width: 100%;
}

/* 发光效果 */
.tech-button--glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

.tech-button--secondary.tech-button--glow {
  animation: pulse-glow-cyan 2s ease-in-out infinite;
}

/* 禁用状态 */
.tech-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 加载状态 */
.tech-button--loading .tech-button__text {
  opacity: 0.5;
}

.tech-button__loader {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: radar-sweep 0.8s linear infinite;
}

/* 图标 */
.tech-button__icon {
  font-size: 1.2em;
  line-height: 1;
}

/* 装饰边角 */
.tech-button__corner {
  position: absolute;
  width: 6px;
  height: 6px;
  border-color: currentColor;
  border-style: solid;
  opacity: 0.5;
  transition: all var(--duration-normal);
}

.tech-button__corner--tl {
  top: -1px;
  left: -1px;
  border-width: 1px 0 0 1px;
}

.tech-button__corner--tr {
  top: -1px;
  right: -1px;
  border-width: 1px 1px 0 0;
}

.tech-button__corner--bl {
  bottom: -1px;
  left: -1px;
  border-width: 0 0 1px 1px;
}

.tech-button__corner--br {
  bottom: -1px;
  right: -1px;
  border-width: 0 1px 1px 0;
}

.tech-button:hover:not(:disabled) .tech-button__corner {
  width: 12px;
  height: 12px;
  opacity: 1;
}

/* 点击效果 */
.tech-button:active:not(:disabled) {
  transform: scale(0.98);
}

/* 波纹效果 */
.tech-button__ripple {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent 70%);
  transform: scale(0);
  animation: tech-ripple-expand 0.6s ease-out forwards;
  pointer-events: none;
  z-index: 0;
}

@keyframes tech-ripple-expand {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}
</style>
