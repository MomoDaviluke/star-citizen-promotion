<!--
  @file 统一弹窗组件
  @description 提供模态对话框，支持多种尺寸和动画效果
  @module components/common/BaseModal
-->

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="handleOverlayClick">
        <div
          class="modal-container"
          :class="[
            `modal--${size}`,
            {
              'modal--fullscreen': fullscreen,
              'is-draggable': draggable
            }
          ]"
          ref="modalRef"
          @mousedown="handleDragStart"
        >
          <!-- 弹窗头部 -->
          <header v-if="!hideHeader" class="modal-header">
            <div class="modal-title-wrapper">
              <span v-if="icon" class="modal-icon">{{ icon }}</span>
              <h3 class="modal-title">
                <slot name="title">{{ title }}</slot>
              </h3>
            </div>
            
            <div class="modal-actions">
              <slot name="actions" />
              <button
                v-if="closable"
                class="modal-close"
                @click="close"
                aria-label="关闭弹窗"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </header>

          <!-- 弹窗内容 -->
          <div class="modal-body" :style="{ maxHeight: bodyMaxHeight }">
            <slot />
          </div>

          <!-- 弹窗底部 -->
          <footer v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </footer>

          <!-- 科幻边框效果 -->
          <div class="modal-border-effect"></div>
          
          <!-- 角落装饰 -->
          <span class="modal-corner modal-corner-tl"></span>
          <span class="modal-corner modal-corner-tr"></span>
          <span class="modal-corner modal-corner-bl"></span>
          <span class="modal-corner modal-corner-br"></span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * 基础弹窗组件
 * @props {boolean} modelValue - 弹窗显示状态（v-model）
 * @props {string} title - 弹窗标题
 * @props {string} icon - 标题图标
 * @props {string} size - 弹窗尺寸 (sm|md|lg|xl|full)
 * @props {boolean} fullscreen - 是否全屏
 * @props {boolean} closable - 是否可关闭
 * @props {boolean} hideHeader - 是否隐藏头部
 * @props {boolean} hideOverlay - 是否隐藏遮罩层
 * @props {boolean} persistent - 是否点击遮罩层不关闭
 * @props {boolean} draggable - 是否可拖拽
 * @props {string} bodyMaxHeight - 内容区域最大高度
 * @emits {update:modelValue} 更新显示状态
 * @emits {open} 弹窗打开事件
 * @emits {close} 弹窗关闭事件
 */

import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl', 'full'].includes(value)
  },
  fullscreen: {
    type: Boolean,
    default: false
  },
  closable: {
    type: Boolean,
    default: true
  },
  hideHeader: {
    type: Boolean,
    default: false
  },
  hideOverlay: {
    type: Boolean,
    default: false
  },
  persistent: {
    type: Boolean,
    default: false
  },
  draggable: {
    type: Boolean,
    default: false
  },
  bodyMaxHeight: {
    type: String,
    default: '60vh'
  }
})

const emit = defineEmits(['update:modelValue', 'open', 'close'])

const modalRef = ref(null)
let dragState = null

/**
 * 关闭弹窗
 */
function close() {
  if (!props.closable) return
  emit('update:modelValue', false)
  emit('close')
}

/**
 * 处理遮罩层点击
 * @param {MouseEvent} event - 点击事件
 */
function handleOverlayClick() {
  if (props.persistent) return
  close()
}

/**
 * 处理拖拽开始
 * @param {MouseEvent} event - 鼠标事件
 */
function handleDragStart(event) {
  if (!props.draggable || event.target.closest('.modal-close')) return
  
  const modal = modalRef.value
  if (!modal) return
  
  const rect = modal.getBoundingClientRect()
  dragState = {
    startX: event.clientX,
    startY: event.clientY,
    initialX: rect.left,
    initialY: rect.top
  }
  
  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
}

/**
 * 处理拖拽移动
 * @param {MouseEvent} event - 鼠标事件
 */
function handleDragMove(event) {
  if (!dragState) return
  
  const deltaX = event.clientX - dragState.startX
  const deltaY = event.clientY - dragState.startY
  
  const modal = modalRef.value
  if (modal) {
    modal.style.transform = `translate(${deltaX}px, ${deltaY}px)`
  }
}

/**
 * 处理拖拽结束
 */
function handleDragEnd() {
  dragState = null
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
}

/**
 * 监听ESC键关闭弹窗
 * @param {KeyboardEvent} event - 键盘事件
 */
function handleKeydown(event) {
  if (event.key === 'Escape' && props.closable && !props.persistent) {
    close()
  }
}

// 监听显示状态变化
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    emit('open')
    document.addEventListener('keydown', handleKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(3, 8, 16, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: 1rem;
}

.modal-container {
  position: relative;
  background: linear-gradient(165deg, rgba(15, 30, 50, 0.95), rgba(8, 18, 32, 0.98));
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  box-shadow: var(--glow-accent), 0 20px 60px rgba(0, 0, 0, 0.5);
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all var(--transition-normal);
}

/* ========== 尺寸变体 ========== */
.modal--sm {
  width: 400px;
}

.modal--md {
  width: 600px;
}

.modal--lg {
  width: 800px;
}

.modal--xl {
  width: 1000px;
}

.modal--fullscreen,
.modal--full {
  width: 95vw;
  height: 95vh;
  max-width: none;
  max-height: none;
}

/* ========== 弹窗头部 ========== */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-subtle);
  background: rgba(10, 20, 35, 0.5);
}

.modal-title-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(95, 169, 255, 0.1);
  border: 1px solid rgba(143, 215, 255, 0.2);
  border-radius: var(--radius-sm);
  font-size: 1.125rem;
}

.modal-title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.05em;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.modal-close:hover {
  background: rgba(255, 107, 107, 0.1);
  border-color: var(--color-status-danger);
  color: var(--color-status-danger);
}

.modal-close svg {
  width: 18px;
  height: 18px;
}

/* ========== 弹窗内容 ========== */
.modal-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  position: relative;
  z-index: 2;
}

/* ========== 弹窗底部 ========== */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-subtle);
  background: rgba(10, 20, 35, 0.3);
  position: relative;
  z-index: 2;
}

/* ========== 科幻边框效果 ========== */
.modal-border-effect {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--color-accent), transparent, var(--color-accent));
  opacity: 0;
  transition: opacity var(--transition-slow);
  mask-image: linear-gradient(90deg, transparent 0%, black 50%, transparent 100%);
  pointer-events: none;
  z-index: 1;
}

.modal-container:hover .modal-border-effect {
  opacity: 0.1;
}

/* ========== 角落装饰 ========== */
.modal-corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: var(--color-accent);
  border-style: solid;
  opacity: 0.6;
  transition: opacity var(--transition-fast);
  z-index: 3;
}

.modal-container:hover .modal-corner {
  opacity: 1;
}

.modal-corner-tl {
  top: 8px;
  left: 8px;
  border-width: 2px 0 0 2px;
}

.modal-corner-tr {
  top: 8px;
  right: 8px;
  border-width: 2px 2px 0 0;
}

.modal-corner-bl {
  bottom: 8px;
  left: 8px;
  border-width: 0 0 2px 2px;
}

.modal-corner-br {
  bottom: 8px;
  right: 8px;
  border-width: 0 2px 2px 0;
}

/* ========== 动画 ========== */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity var(--transition-normal);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: all var(--transition-normal);
}

.modal-fade-enter-from .modal-container {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

.modal-fade-leave-to .modal-container {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

/* ========== 可拖拽样式 ========== */
.modal-container.is-draggable {
  cursor: move;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-container {
    max-width: 100%;
    max-height: 100%;
  }

  .modal--sm,
  .modal--md,
  .modal--lg,
  .modal--xl {
    width: 100%;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .modal-footer {
    padding: 0.75rem 1rem;
  }
}
</style>
