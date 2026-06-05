<template>
  <!--
    MFD (Multi-Functional Display) 面板组件
    模拟星际公民飞船内的多功能显示屏风格
    支持多种变体：primary(主面板), secondary(副面板), alert(警报面板)
  -->
  <div
    :class="[
      'mfd-panel',
      `mfd-panel--${variant}`,
      { 'mfd-panel--animated': animated },
      { 'mfd-panel--collapsed': isCollapsed }
    ]"
    :style="customStyles"
  >
    <!-- 面板顶部标题栏 -->
    <div v-if="title || $slots.header" class="mfd-panel__header" @click="toggleCollapse">
      <div class="mfd-panel__corner mfd-panel__corner--tl"></div>
      <div class="mfd-panel__corner mfd-panel__corner--tr"></div>

      <slot name="header">
        <div class="mfd-panel__title">
          <span class="mfd-panel__title-icon" v-if="icon">{{ icon }}</span>
          <span class="mfd-panel__title-text font-tech">{{ title }}</span>
        </div>
        <div v-if="subtitle" class="mfd-panel__subtitle font-data">
          {{ subtitle }}
        </div>
      </slot>

      <!-- 展开/折叠指示器 -->
      <span v-if="collapsible" class="mfd-panel__toggle font-data">
        {{ isCollapsed ? '▸' : '▾' }}
      </span>
    </div>

    <!-- 面板内容区域 — 支持折叠动画 -->
    <div class="mfd-panel__content-wrapper" :style="contentWrapperStyle">
      <div class="mfd-panel__content" ref="contentRef">
        <slot></slot>
      </div>
    </div>

    <!-- 面板底部状态栏 -->
    <div v-if="$slots.footer || status" class="mfd-panel__footer">
      <slot name="footer">
        <div class="mfd-panel__status">
          <span class="status-dot" :class="statusType"></span>
          <span class="mfd-panel__status-text font-data">{{ status }}</span>
        </div>
      </slot>
    </div>

    <!-- 装饰性边角 -->
    <div class="mfd-panel__corner mfd-panel__corner--bl"></div>
    <div class="mfd-panel__corner mfd-panel__corner--br"></div>

    <!-- 扫描线效果 -->
    <div v-if="scanlines" class="mfd-panel__scanlines"></div>
  </div>
</template>

<script setup>
/**
 * MFDPanel - 多功能显示面板组件
 *
 * @param {string} variant - 面板变体: 'primary' | 'secondary' | 'alert'
 * @param {string} title - 面板标题
 * @param {string} subtitle - 副标题
 * @param {string} icon - 标题图标
 * @param {string} status - 状态文本
 * @param {string} statusType - 状态类型: 'online' | 'warning' | 'danger' | 'offline'
 * @param {boolean} animated - 是否启用入场动画
 * @param {boolean} scanlines - 是否显示扫描线
 * @param {boolean} collapsible - 是否可折叠
 * @param {boolean} defaultCollapsed - 默认是否折叠
 * @param {Object} customStyles - 自定义样式
 */

import { ref, computed, onMounted, nextTick } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'alert'].includes(v)
  },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' },
  status: { type: String, default: '' },
  statusType: {
    type: String,
    default: 'online',
    validator: (v) => ['online', 'warning', 'danger', 'offline'].includes(v)
  },
  animated: { type: Boolean, default: true },
  scanlines: { type: Boolean, default: false },
  collapsible: { type: Boolean, default: false },
  defaultCollapsed: { type: Boolean, default: false },
  customStyles: { type: Object, default: () => ({}) }
});

/** 折叠状态 */
const isCollapsed = ref(props.defaultCollapsed)

/** 内容区域 DOM 引用 */
const contentRef = ref(null)

/** 内容区域高度（用于折叠动画） */
const contentHeight = ref(0)

/** 内容区域包裹器样式 — 控制折叠动画 */
const contentWrapperStyle = computed(() => {
  if (!props.collapsible) return {}
  return {
    maxHeight: isCollapsed.value ? '0px' : `${contentHeight.value}px`,
    overflow: 'hidden',
    transition: 'max-height 0.4s ease'
  }
})

/**
 * 切换折叠状态
 */
function toggleCollapse() {
  if (!props.collapsible) return
  isCollapsed.value = !isCollapsed.value
}

onMounted(() => {
  /** 测量内容区域实际高度 */
  nextTick(() => {
    if (contentRef.value) {
      contentHeight.value = contentRef.value.scrollHeight
    }
  })
})
</script>

<style scoped>
.mfd-panel {
  position: relative;
  background: rgba(17, 24, 39, 0.85);
  border: 1px solid var(--border-medium);
  backdrop-filter: blur(10px);
  overflow: hidden;
  transition: all var(--duration-normal);
}

/* 主面板变体 - 琥珀色主题 */
.mfd-panel--primary {
  border-color: var(--border-medium);
}

.mfd-panel--primary .mfd-panel__header {
  border-bottom-color: var(--border-medium);
}

.mfd-panel--primary .mfd-panel__corner::before,
.mfd-panel--primary .mfd-panel__corner::after {
  border-color: var(--amber-primary);
}

/* 副面板变体 - 青蓝色主题 */
.mfd-panel--secondary {
  border-color: var(--nebula-purple);
}

.mfd-panel--secondary .mfd-panel__header {
  border-bottom-color: var(--nebula-purple);
}

.mfd-panel--secondary .mfd-panel__corner::before,
.mfd-panel--secondary .mfd-panel__corner::after {
  border-color: var(--nebula-purple);
}

.mfd-panel--secondary .mfd-panel__title-text {
  color: var(--nebula-purple);
}

/* 警报面板变体 */
.mfd-panel--alert {
  border-color: rgba(239, 68, 68, 0.4);
  animation: warning-flash 2s ease-in-out infinite;
}

.mfd-panel--alert .mfd-panel__header {
  border-bottom-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
}

.mfd-panel--alert .mfd-panel__corner::before,
.mfd-panel--alert .mfd-panel__corner::after {
  border-color: var(--status-danger);
}

.mfd-panel--alert .mfd-panel__title-text {
  color: var(--status-danger);
}

/* 面板头部 */
.mfd-panel__header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  background: rgba(0, 0, 0, 0.2);
}

.mfd-panel__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.mfd-panel__title-icon {
  font-size: var(--text-lg);
  opacity: 0.8;
}

.mfd-panel__title-text {
  font-size: var(--text-sm);
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--amber-primary);
}

.mfd-panel__subtitle {
  font-size: var(--text-xs);
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

/* 面板内容 */
.mfd-panel__content {
  padding: var(--space-4);
  position: relative;
  z-index: 1;
}

/* 折叠状态 */
.mfd-panel--collapsed .mfd-panel__header {
  border-bottom-color: transparent;
}

.mfd-panel__toggle {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-left: auto;
  transition: transform 0.3s ease;
}

.mfd-panel__header {
  cursor: default;
}

.mfd-panel--collapsed .mfd-panel__header,
.mfd-panel:has(.mfd-panel__toggle) .mfd-panel__header {
  cursor: pointer;
}

/* 面板底部 */
.mfd-panel__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-4);
  border-top: 1px solid var(--border-subtle);
  background: rgba(0, 0, 0, 0.2);
}

.mfd-panel__status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.mfd-panel__status-text {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* 装饰边角 */
.mfd-panel__corner {
  position: absolute;
  width: 12px;
  height: 12px;
  z-index: 2;
}

.mfd-panel__corner::before,
.mfd-panel__corner::after {
  content: '';
  position: absolute;
  border-style: solid;
  transition: all var(--duration-normal);
}

.mfd-panel__corner--tl {
  top: -1px;
  left: -1px;
}

.mfd-panel__corner--tl::before {
  top: 0;
  left: 0;
  width: 100%;
  border-width: 2px 0 0 0;
}

.mfd-panel__corner--tl::after {
  top: 0;
  left: 0;
  height: 100%;
  border-width: 0 0 0 2px;
}

.mfd-panel__corner--tr {
  top: -1px;
  right: -1px;
}

.mfd-panel__corner--tr::before {
  top: 0;
  right: 0;
  width: 100%;
  border-width: 2px 0 0 0;
}

.mfd-panel__corner--tr::after {
  top: 0;
  right: 0;
  height: 100%;
  border-width: 0 2px 0 0;
}

.mfd-panel__corner--bl {
  bottom: -1px;
  left: -1px;
}

.mfd-panel__corner--bl::before {
  bottom: 0;
  left: 0;
  width: 100%;
  border-width: 0 0 2px 0;
}

.mfd-panel__corner--bl::after {
  bottom: 0;
  left: 0;
  height: 100%;
  border-width: 0 0 0 2px;
}

.mfd-panel__corner--br {
  bottom: -1px;
  right: -1px;
}

.mfd-panel__corner--br::before {
  bottom: 0;
  right: 0;
  width: 100%;
  border-width: 0 0 2px 0;
}

.mfd-panel__corner--br::after {
  bottom: 0;
  right: 0;
  height: 100%;
  border-width: 0 2px 0 0;
}

/* 扫描线效果 */
.mfd-panel__scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
  opacity: 0.05;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(6, 182, 212, 0.1) 2px,
    rgba(6, 182, 212, 0.1) 4px
  );
}

/* 入场动画 */
.mfd-panel--animated {
  animation: panel-slide-up var(--duration-launch) ease-out;
}

/* 悬停效果 */
.mfd-panel:hover {
  border-color: var(--border-strong);
  box-shadow: var(--glow-amber);
}

.mfd-panel--secondary:hover {
  box-shadow: var(--glow-cyan);
}

/* 响应式 */
@media (max-width: 768px) {
  .mfd-panel__header {
    padding: var(--space-2) var(--space-3);
  }

  .mfd-panel__content {
    padding: var(--space-3);
  }
}
</style>
