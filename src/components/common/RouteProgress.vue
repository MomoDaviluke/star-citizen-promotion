<!--
  @file 路由切换顶部进度条 — NProgress 风格
  @description 不阻塞页面内容，顶部细条动画，路由切换时自动触发
-->

<template>
  <Teleport to="body">
    <div class="route-progress" :class="{ 'is-active': visible }" aria-hidden="true">
      <div class="route-progress__bar" :style="{ width: progress + '%' }"></div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

const visible = ref(false)
const progress = ref(0)
let progressTimer = null
let hideTimer = null

function start() {
  if (visible.value) return
  visible.value = true
  progress.value = 0

  // 模拟进度增长 — 快速到 80% 后等待路由完成
  progressTimer = setInterval(() => {
    if (progress.value < 80) {
      progress.value += Math.random() * 15
    } else if (progress.value < 90) {
      progress.value += Math.random() * 3
    }
  }, 150)
}

function finish() {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
  progress.value = 100

  // 进度条满后淡出
  hideTimer = setTimeout(() => {
    visible.value = false
    progress.value = 0
  }, 300)
}

onUnmounted(() => {
  if (progressTimer) clearInterval(progressTimer)
  if (hideTimer) clearTimeout(hideTimer)
})

defineExpose({ start, finish })
</script>

<style scoped>
.route-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  z-index: 10000;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.route-progress.is-active {
  opacity: 1;
}

.route-progress__bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent), var(--color-accent-bright, #5ae0ff));
  box-shadow: 0 0 8px rgba(var(--raw-cyan-rgb, 74, 158, 255), 0.6);
  transition: width 0.15s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .route-progress {
    transition: none;
  }
  .route-progress__bar {
    transition: none;
  }
}
</style>
