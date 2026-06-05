<!--
  @fileoverview 页面头部公共组件 — Stellar Nexus 星渊枢纽风格
  @description 统一的页面头部组件，包含背景图、标题、副标题、装饰线和状态指示器
  @module components/common/PageHeader
-->

<template>
  <div class="page-header-mfd">
    <div class="page-header-bg">
      <img :src="backgroundImage" alt="" aria-hidden="true" />
      <div class="page-header-bg-overlay"></div>
    </div>
    <div class="page-header-content">
      <span class="page-id font-data">{{ systemId }}</span>
      <h1 class="page-title font-tech">{{ title }}</h1>
      <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
    </div>
    <div class="page-header-decoration">
      <div class="header-line"></div>
      <StatusIndicator type="online" label="系统在线" :pulse="true" />
    </div>
  </div>
</template>

<script setup>
/**
 * PageHeader - 页面头部公共组件
 *
 * @param {string} backgroundImage - 背景图片路径
 * @param {string} title - 页面标题
 * @param {string} subtitle - 页面副标题（可选）
 * @param {string} systemId - 系统标识（如 SYS.ABOUT // V.3.0）
 */

import StatusIndicator from '@/components/ui/StatusIndicator.vue'

defineProps({
  backgroundImage: { type: String, default: '/images/sc/sc-hero.jpg' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  systemId: { type: String, default: 'SYS.GENERAL // V.1.0' }
})
</script>

<style scoped>
.page-header-mfd {
  position: relative;
  padding: 3rem 2rem 2rem;
  margin: -1rem -1rem 2rem;
  overflow: hidden;
  border-bottom: 1px solid var(--border-medium);
}

.page-header-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.page-header-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.4) brightness(0.3);
}

.page-header-bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(6, 11, 20, 0.95) 0%,
    rgba(10, 20, 40, 0.85) 50%,
    rgba(6, 11, 20, 0.95) 100%
  );
}

.page-header-content {
  position: relative;
  z-index: 1;
  max-width: 600px;
}

.page-id {
  display: block;
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.15em;
  margin-bottom: 0.5rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0 0 0.5rem;
}

.page-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.page-header-decoration {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.header-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--border-medium), transparent);
}

@media (max-width: 768px) {
  .page-header-mfd {
    padding: 2rem 1.5rem 1.5rem;
    margin: -1rem -1rem 1.5rem;
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>
