<!--
  @file 404 页面视图组件
  @description 页面未找到时的错误提示页面
  @module views/NotFound
-->

<template>
  <section class="not-found">
    <!-- 视觉装饰层 -->
    <div class="error-visual">
      <div class="error-grid"></div>
      <div class="error-glow"></div>
      <div class="error-scanline"></div>
    </div>

    <!-- 错误内容 -->
    <div class="error-content">
      <p class="error-code">SIGNAL LOST</p>
      <h1 class="error-number">404</h1>
      <p class="error-message">页面不存在，可能已被移动或删除。</p>
      <div class="error-actions">
        <RouterLink to="/" class="btn btn-primary">
          <span class="btn-text">返回首页</span>
          <span class="btn-arrow">→</span>
        </RouterLink>
      </div>
    </div>

    <!-- 页脚信息 -->
    <div class="error-footer">
      <span class="error-id">ERR:NAVIGATION_FAILED</span>
      <span class="error-separator">|</span>
      <span class="error-timestamp">{{ timestamp }}</span>
    </div>
  </section>
</template>

<script setup>
/**
 * 404 页面视图组件
 * @description 显示页面未找到错误，提供返回首页的导航
 */

import { ref, onMounted } from 'vue'

/** 星历时间戳 */
const timestamp = ref('')

/**
 * 组件挂载时生成时间戳
 */
onMounted(() => {
  const now = new Date()
  timestamp.value = `STARDATE ${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
})
</script>

<style scoped>
/* 404 页面容器 */
.not-found {
  position: relative;
  text-align: center;
  padding: 3rem 2rem;
  max-width: 600px;
  margin-inline: auto;
  background: linear-gradient(165deg, rgba(15, 30, 50, 0.8), rgba(8, 18, 32, 0.9));
  border: 1px solid var(--line);
  border-radius: 4px;
  overflow: hidden;
}

/* 视觉装饰层 */
.error-visual {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.error-grid {
  position: absolute;
  inset: 0;
  opacity: 0.1;
  background-image:
    linear-gradient(rgba(143, 215, 255, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(143, 215, 255, 0.3) 1px, transparent 1px);
  background-size: 30px 30px;
}

.error-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255, 107, 107, 0.15), transparent 70%);
  filter: blur(40px);
}

.error-scanline {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(0, 0, 0, 0.03) 50%);
  background-size: 100% 4px;
  animation: scanline 10s linear infinite;
}

@keyframes scanline {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 0 100%;
  }
}

/* 错误内容 */
.error-content {
  position: relative;
  z-index: 1;
}

.error-code {
  margin: 0 0 0.5rem;
  color: var(--danger);
  text-transform: uppercase;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.error-number {
  margin: 0;
  font-size: clamp(4rem, 15vw, 7rem);
  font-weight: 700;
  letter-spacing: 0.1em;
  background: linear-gradient(135deg, var(--text) 0%, var(--danger) 50%, var(--accent-warm) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 60px rgba(255, 107, 107, 0.3);
}

.error-message {
  margin: 0.75rem 0 1.5rem;
  color: var(--text-muted);
  font-size: 1rem;
}

.error-actions {
  display: flex;
  justify-content: center;
}

.btn-arrow {
  margin-left: 0.5rem;
  transition: transform var(--transition-fast);
}

.btn-primary:hover .btn-arrow {
  transform: translateX(4px);
}

/* 页脚信息 */
.error-footer {
  position: relative;
  z-index: 1;
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--line);
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.error-separator {
  opacity: 0.4;
}
</style>
