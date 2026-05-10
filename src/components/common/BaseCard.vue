<!--
  @file 统一卡片组件
  @description 提供科幻风格卡片容器，支持悬停效果和多种变体
  @module components/common/BaseCard
-->

<template>
  <div
    class="base-card"
    :class="[
      `base-card--${variant}`,
      {
        'is-hoverable': hoverable,
        'is-flat': flat,
        'is-interactive': interactive
      }
    ]"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 科幻边框效果 -->
    <div v-if="showBorderEffect && (hoverable || interactive)" class="card-border-effect"></div>

    <!-- 扫描线效果 -->
    <div v-if="showScanLines" class="card-scan-lines"></div>

    <!-- 卡片头部 -->
    <header v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 v-if="title" class="card-title">{{ title }}</h3>
        <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
      </slot>
    </header>

    <!-- 卡片媒体区域 -->
    <div v-if="$slots.media" class="card-media">
      <slot name="media" />
    </div>

    <!-- 卡片内容 -->
    <div class="card-body">
      <slot />
    </div>

    <!-- 卡片底部 -->
    <footer v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </footer>

    <!-- 角落装饰 -->
    <template v-if="showCorners && (hoverable || interactive)">
      <span class="card-corner card-corner-tl"></span>
      <span class="card-corner card-corner-tr"></span>
      <span class="card-corner card-corner-bl"></span>
      <span class="card-corner card-corner-br"></span>
    </template>

    <!-- 加载状态 -->
    <div v-if="loading" class="card-loading">
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 基础卡片组件
 * @props {string} variant - 卡片样式变体 (default|primary|success|warning|danger)
 * @props {string} title - 卡片标题
 * @props {string} subtitle - 卡片副标题
 * @props {boolean} hoverable - 是否可悬停
 * @props {boolean} interactive - 是否可交互（点击效果）
 * @props {boolean} flat - 是否扁平样式（无阴影）
 * @props {boolean} loading - 是否加载中
 * @props {boolean} showBorderEffect - 是否显示边框效果
 * @props {boolean} showScanLines - 是否显示扫描线
 * @props {boolean} showCorners - 是否显示角落装饰
 * @emits {click} 点击事件
 * @emits {mouseenter} 鼠标进入事件
 * @emits {mouseleave} 鼠标离开事件
 */

import { ref } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'primary', 'success', 'warning', 'danger'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  hoverable: {
    type: Boolean,
    default: false
  },
  interactive: {
    type: Boolean,
    default: false
  },
  flat: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  showBorderEffect: {
    type: Boolean,
    default: true
  },
  showScanLines: {
    type: Boolean,
    default: false
  },
  showCorners: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click', 'mouseenter', 'mouseleave'])

/**
 * 处理点击事件
 * @param {MouseEvent} event - 点击事件
 */
function handleClick(event) {
  if (props.interactive) {
    emit('click', event)
  }
}

/**
 * 处理鼠标进入事件
 * @param {MouseEvent} event - 鼠标进入事件
 */
function handleMouseEnter(event) {
  emit('mouseenter', event)
}

/**
 * 处理鼠标离开事件
 * @param {MouseEvent} event - 鼠标离开事件
 */
function handleMouseLeave(event) {
  emit('mouseleave', event)
}
</script>

<style scoped>
.base-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all var(--transition-normal);
}

/* ========== 变体样式 ========== */
.base-card--default {
  background: var(--bg-card);
}

.base-card--primary {
  border-color: rgba(95, 169, 255, 0.3);
}

.base-card--primary:hover {
  border-color: var(--color-primary);
}

.base-card--success {
  border-color: rgba(78, 205, 196, 0.3);
}

.base-card--success:hover {
  border-color: var(--color-success);
}

.base-card--warning {
  border-color: rgba(240, 173, 78, 0.3);
}

.base-card--warning:hover {
  border-color: var(--color-warning);
}

.base-card--danger {
  border-color: rgba(255, 107, 107, 0.3);
}

.base-card--danger:hover {
  border-color: var(--color-danger);
}

/* ========== 悬停效果 ========== */
.base-card.is-hoverable:hover {
  transform: translateY(-4px);
  box-shadow: var(--glow-primary);
  border-color: var(--border-medium);
}

.base-card.is-hoverable:hover .card-border-effect {
  opacity: 0.2;
}

/* ========== 交互效果 ========== */
.base-card.is-interactive {
  cursor: pointer;
}

.base-card.is-interactive:active {
  transform: translateY(-2px);
}

/* ========== 扁平样式 ========== */
.base-card.is-flat {
  box-shadow: none;
}

.base-card.is-flat:hover {
  box-shadow: none;
}

/* ========== 科幻边框效果 ========== */
.card-border-effect {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
  opacity: 0;
  transition: opacity var(--transition-normal);
  mask-image: linear-gradient(90deg, transparent 0%, black 50%, transparent 100%);
  pointer-events: none;
  z-index: 0;
}

/* ========== 扫描线效果 ========== */
.card-scan-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.05;
  background-image: linear-gradient(
    0deg,
    transparent 50%,
    rgba(95, 169, 255, 0.1) 50%
  );
  background-size: 100% 4px;
  z-index: 1;
}

/* ========== 卡片头部 ========== */
.card-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-subtle);
}

.card-title {
  margin: 0 0 0.25rem;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.05em;
}

.card-subtitle {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

/* ========== 卡片媒体区域 ========== */
.card-media {
  margin: -1.5rem -1.5rem 1rem;
  overflow: hidden;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.card-media img {
  display: block;
  width: 100%;
  height: auto;
  transition: transform var(--transition-slow);
}

.base-card:hover .card-media img {
  transform: scale(1.05);
}

/* ========== 卡片内容 ========== */
.card-body {
  flex: 1;
  position: relative;
  z-index: 2;
}

/* ========== 卡片底部 ========== */
.card-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

/* ========== 角落装饰 ========== */
.card-corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: var(--color-primary);
  border-style: solid;
  opacity: 0.5;
  transition: opacity var(--transition-fast);
  z-index: 3;
}

.base-card:hover .card-corner {
  opacity: 1;
}

.card-corner-tl {
  top: 8px;
  left: 8px;
  border-width: 2px 0 0 2px;
}

.card-corner-tr {
  top: 8px;
  right: 8px;
  border-width: 2px 2px 0 0;
}

.card-corner-bl {
  bottom: 8px;
  left: 8px;
  border-width: 0 0 2px 2px;
}

.card-corner-br {
  bottom: 8px;
  right: 8px;
  border-width: 0 2px 2px 0;
}

/* ========== 加载状态 ========== */
.card-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(3, 8, 16, 0.8);
  z-index: 10;
  border-radius: var(--radius-md);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-subtle);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .base-card {
    padding: 1rem;
  }

  .card-header {
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
  }

  .card-media {
    margin: -1rem -1rem 0.75rem;
  }
}
</style>
