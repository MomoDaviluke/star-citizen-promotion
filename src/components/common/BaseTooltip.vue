<!--
  @file 统一工具提示组件
  @description 提供悬停提示功能，支持多位置和动画
  @module components/common/BaseTooltip
-->

<template>
  <div class="base-tooltip-wrapper" @mouseenter="showTooltip" @mouseleave="hideTooltip" ref="wrapperRef">
    <!-- 触发元素 -->
    <div class="tooltip-trigger">
      <slot />
    </div>

    <!-- 提示内容 -->
    <Transition name="tooltip-fade">
      <div
        v-if="isVisible"
        class="tooltip-content"
        :class="`tooltip--${position}`"
        :style="tooltipStyle"
        ref="tooltipRef"
      >
        <div class="tooltip-arrow"></div>
        <div class="tooltip-inner">
          <span v-if="icon" class="tooltip-icon">{{ icon }}</span>
          <span class="tooltip-text">
            <slot name="content">{{ content }}</slot>
          </span>
        </div>
        
        <!-- 科幻边框效果 -->
        <div class="tooltip-border-effect"></div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
/**
 * 基础工具提示组件
 * @props {string} content - 提示内容
 * @props {string} icon - 提示图标
 * @props {string} position - 提示位置 (top|bottom|left|right)
 * @props {string} variant - 样式变体 (default|primary|success|warning|danger)
 * @props {number} delay - 显示延迟（毫秒）
 * @props {boolean} disabled - 是否禁用
 * @props {boolean} allowHtml - 是否允许HTML内容
 */

import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  position: {
    type: String,
    default: 'top',
    validator: (value) => ['top', 'bottom', 'left', 'right'].includes(value)
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'primary', 'success', 'warning', 'danger'].includes(value)
  },
  delay: {
    type: Number,
    default: 200
  },
  disabled: {
    type: Boolean,
    default: false
  },
  allowHtml: {
    type: Boolean,
    default: false
  }
})

const isVisible = ref(false)
const wrapperRef = ref(null)
const tooltipRef = ref(null)
const tooltipStyle = ref({})
let showTimer = null
let hideTimer = null

/**
 * 显示提示
 */
function showTooltip() {
  if (props.disabled) return
  
  clearTimeout(hideTimer)
  showTimer = setTimeout(() => {
    isVisible.value = true
    nextTick(() => {
      updatePosition()
    })
  }, props.delay)
}

/**
 * 隐藏提示
 */
function hideTooltip() {
  clearTimeout(showTimer)
  hideTimer = setTimeout(() => {
    isVisible.value = false
  }, 100)
}

/**
 * 更新提示位置
 */
function updatePosition() {
  if (!wrapperRef.value || !tooltipRef.value) return
  
  const wrapperRect = wrapperRef.value.getBoundingClientRect()
  const tooltipRect = tooltipRef.value.getBoundingClientRect()
  
  let top = 0
  let left = 0
  
  switch (props.position) {
    case 'top':
      top = -tooltipRect.height - 8
      left = (wrapperRect.width - tooltipRect.width) / 2
      break
    case 'bottom':
      top = wrapperRect.height + 8
      left = (wrapperRect.width - tooltipRect.width) / 2
      break
    case 'left':
      top = (wrapperRect.height - tooltipRect.height) / 2
      left = -tooltipRect.width - 8
      break
    case 'right':
      top = (wrapperRect.height - tooltipRect.height) / 2
      left = wrapperRect.width + 8
      break
  }
  
  tooltipStyle.value = {
    top: `${top}px`,
    left: `${left}px`
  }
}

// 点击外部关闭
function handleClickOutside(event) {
  if (wrapperRef.value && !wrapperRef.value.contains(event.target)) {
    isVisible.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  clearTimeout(showTimer)
  clearTimeout(hideTimer)
})
</script>

<style scoped>
.base-tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.tooltip-trigger {
  display: inline-block;
}

.tooltip-content {
  position: absolute;
  z-index: var(--z-tooltip);
  padding: 0.5rem 0.75rem;
  background: var(--bg-overlay);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  backdrop-filter: blur(8px);
  box-shadow: var(--glow-primary);
  white-space: nowrap;
  pointer-events: none;
  transition: all var(--transition-fast);
}

/* ========== 样式变体 ========== */
.tooltip--default {
  border-color: var(--border-subtle);
}

.tooltip--primary {
  border-color: rgba(95, 169, 255, 0.4);
  box-shadow: var(--glow-primary);
}

.tooltip--success {
  border-color: rgba(78, 205, 196, 0.4);
  box-shadow: var(--glow-success);
}

.tooltip--warning {
  border-color: rgba(240, 173, 78, 0.4);
}

.tooltip--danger {
  border-color: rgba(255, 107, 107, 0.4);
  box-shadow: var(--glow-danger);
}

/* ========== 箭头 ========== */
.tooltip-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: inherit;
  border: 1px solid inherit;
  transform: rotate(45deg);
}

.tooltip--top .tooltip-arrow {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  border-top: none;
  border-left: none;
}

.tooltip--bottom .tooltip-arrow {
  top: -4px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  border-bottom: none;
  border-right: none;
}

.tooltip--left .tooltip-arrow {
  right: -4px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
  border-right: none;
  border-top: none;
}

.tooltip--right .tooltip-arrow {
  left: -4px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
  border-left: none;
  border-bottom: none;
}

/* ========== 内容 ========== */
.tooltip-inner {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--text-xs);
  color: var(--text-primary);
  line-height: 1.4;
}

.tooltip-icon {
  font-size: 0.875em;
}

/* ========== 科幻边框效果 ========== */
.tooltip-border-effect {
  position: absolute;
  inset: -1px;
  background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
  opacity: 0.1;
  border-radius: inherit;
  mask-image: linear-gradient(90deg, transparent 0%, black 50%, transparent 100%);
  pointer-events: none;
}

/* ========== 动画 ========== */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .tooltip-content {
    padding: 0.375rem 0.625rem;
    font-size: 0.75rem;
  }
}
</style>
