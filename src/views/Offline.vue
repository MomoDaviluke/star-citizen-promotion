<!--
/**
 * @file Offline 离线提示页
 * @description PWA 离线时显示的提示页面，告知用户网络不可用
 * @module views/Offline
 */
-->
<template>
  <div class="offline-page">
    <div class="offline-card">
      <div class="offline-icon">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="24" cy="24" r="20" stroke-dasharray="4 4" />
          <path d="M24 4 L24 12 M24 36 L24 44 M4 24 L12 24 M36 24 L44 24" />
          <circle cx="24" cy="24" r="6" fill="var(--nebula-purple)" opacity="0.5" />
          <line x1="8" y1="8" x2="16" y2="16" stroke-width="2" />
        </svg>
      </div>

      <h1 class="offline-title font-display">信号丢失 · SIGNAL LOST</h1>
      <p class="offline-desc">当前处于深空无连接区域，请检查网络后重试</p>
      <p class="offline-sub font-data">OFFLINE · NO CONNECTION</p>

      <button class="offline-retry btn-glow" @click="retry">
        重试连接 · RECONNECT
      </button>
    </div>

    <div class="offline-decor">
      <div class="decor-line decor-line--top"></div>
      <div class="decor-line decor-line--bottom"></div>
    </div>
  </div>
</template>

<script setup>
function retry() {
  if (navigator.onLine) {
    window.location.reload()
  }
}
</script>

<style scoped>
.offline-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--raw-void-1);
  position: relative;
  overflow: hidden;
}

.offline-card {
  text-align: center;
  padding: var(--space-8);
  max-width: 480px;
  position: relative;
  z-index: 1;
}

.offline-icon {
  color: var(--amber-primary);
  width: 80px;
  height: 80px;
  margin: 0 auto var(--space-6);
  animation: offline-pulse 3s ease-in-out infinite;
}

.offline-icon svg {
  width: 100%;
  height: 100%;
}

@keyframes offline-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.offline-title {
  font-size: var(--text-xl);
  color: var(--color-text-heading);
  margin-bottom: var(--space-4);
  letter-spacing: 0.15em;
}

.offline-desc {
  color: var(--color-text-label);
  margin-bottom: var(--space-2);
  font-size: var(--text-md);
}

.offline-sub {
  color: var(--color-text-dim);
  font-size: var(--text-xs);
  margin-bottom: var(--space-6);
  opacity: 0.6;
}

.offline-retry {
  padding: var(--space-3) var(--space-6);
  border: 1px solid var(--amber-primary);
  color: var(--amber-primary);
  font-family: var(--font-tech);
  font-size: var(--text-sm);
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.offline-retry:hover {
  background: rgba(245, 158, 11, 0.1);
  box-shadow: var(--glow-amber);
}

/* 装饰线条 */
.offline-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.decor-line {
  position: absolute;
  left: 10%;
  right: 10%;
  height: 1px;
  opacity: 0.2;
}

.decor-line--top {
  top: 20%;
  background: linear-gradient(90deg, transparent, var(--nebula-purple), transparent);
}

.decor-line--bottom {
  bottom: 20%;
  background: linear-gradient(90deg, transparent, var(--amber-primary), transparent);
}
</style>
