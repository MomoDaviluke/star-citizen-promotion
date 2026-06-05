<!--
 * @fileoverview PWA 更新提示与离线就绪通知组件
 * @description 监听 Service Worker 状态，向用户提示新版本可用或应用已离线可用
-->

<template>
  <Teleport to="body">
    <!-- 新版本就绪 -->
    <Transition name="pwa-toast">
      <div v-if="needRefresh" class="pwa-toast pwa-toast--update" role="alert" aria-live="polite">
        <div class="pwa-toast__content">
          <div class="pwa-toast__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </div>
          <div class="pwa-toast__body">
            <div class="pwa-toast__title font-tech">新版本就绪</div>
            <div class="pwa-toast__desc">应用已有更新，刷新以加载最新内容</div>
          </div>
        </div>
        <div class="pwa-toast__actions">
          <button class="pwa-toast__btn pwa-toast__btn--primary" @click="onUpdate">
            立即更新
          </button>
          <button class="pwa-toast__btn" @click="onDismissUpdate">
            稍后
          </button>
        </div>
      </div>
    </Transition>

    <!-- 离线就绪 -->
    <Transition name="pwa-toast">
      <div v-if="offlineReady" class="pwa-toast pwa-toast--offline" role="status" aria-live="polite">
        <div class="pwa-toast__content">
          <div class="pwa-toast__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div class="pwa-toast__body">
            <div class="pwa-toast__title font-tech">离线可用</div>
            <div class="pwa-toast__desc">应用已缓存，无网络也能访问</div>
          </div>
        </div>
        <button class="pwa-toast__close" @click="onDismissOffline" aria-label="关闭">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { usePwa } from '../composables/usePwa.js'

const { needRefresh, offlineReady, applyUpdate, dismissUpdate, dismissOfflineReady } = usePwa()

async function onUpdate() {
  await applyUpdate()
}

function onDismissUpdate() {
  dismissUpdate()
}

function onDismissOffline() {
  dismissOfflineReady()
}
</script>

<style scoped>
.pwa-toast {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  z-index: var(--z-modal);
  min-width: 320px;
  max-width: 420px;
  padding: var(--space-4);
  background: var(--void-surface);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    var(--glow-nebula);
  backdrop-filter: blur(12px);
}

.pwa-toast--update {
  border-color: var(--amber-primary);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    var(--glow-amber);
}

.pwa-toast--offline {
  border-color: var(--status-online);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(16, 185, 129, 0.3);
}

.pwa-toast__content {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
}

.pwa-toast__icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pwa-toast--update .pwa-toast__icon {
  color: var(--amber-primary);
}

.pwa-toast--offline .pwa-toast__icon {
  color: var(--status-online);
}

.pwa-toast__icon svg {
  width: 100%;
  height: 100%;
}

.pwa-toast__body {
  flex: 1;
  min-width: 0;
}

.pwa-toast__title {
  font-size: var(--text-sm);
  color: var(--text-primary);
  letter-spacing: 0.1em;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.pwa-toast__desc {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  line-height: 1.5;
}

.pwa-toast__actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding-left: 36px; /* 对齐 icon + gap */
}

.pwa-toast__btn {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-xs);
  font-family: var(--font-tech);
  letter-spacing: 0.05em;
  border: 1px solid var(--border-medium);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.pwa-toast__btn:hover {
  border-color: var(--text-primary);
  color: var(--text-primary);
}

.pwa-toast__btn--primary {
  border-color: var(--amber-primary);
  color: var(--amber-primary);
}

.pwa-toast__btn--primary:hover {
  background: rgba(245, 158, 11, 0.1);
  box-shadow: var(--glow-amber);
}

.pwa-toast__close {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast);
}

.pwa-toast__close:hover {
  color: var(--text-primary);
}

.pwa-toast__close svg {
  width: 14px;
  height: 14px;
}

/* 入场/出场动画 */
.pwa-toast-enter-active,
.pwa-toast-leave-active {
  transition: all var(--duration-normal);
}

.pwa-toast-enter-from,
.pwa-toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 移动端适配 */
@media (max-width: 640px) {
  .pwa-toast {
    left: var(--space-4);
    right: var(--space-4);
    bottom: var(--space-4);
    min-width: 0;
    max-width: none;
  }
}
</style>
