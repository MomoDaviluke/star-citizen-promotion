<!--
  @file 活动项目视图组件
  @description 展示团队活动项目和任务进度
  @module views/Projects
-->

<template>
  <PageTitle
    title="活动项目"
    subtitle="用于展示常规行动、专项训练、赛事等内容。"
  />

  <!-- 项目卡片网格 -->
  <section class="grid projects-grid">
    <article
      class="card mission-card"
      v-for="(item, index) in projects"
      :key="item.name"
      :style="{ animationDelay: `${index * 0.1}s` }"
    >
      <div class="mission-header">
        <div class="mission-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="mission-meta">
          <span class="mission-tag">mission log</span>
          <span class="mission-status" :class="getStatusClass(index)">ACTIVE</span>
        </div>
      </div>
      <h3>{{ item.name }}</h3>
      <div class="mission-period">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>{{ item.period }}</span>
      </div>
      <p>{{ item.description }}</p>
      <div class="mission-footer">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${(index + 1) * 25}%` }"></div>
        </div>
        <span class="progress-text">{{ (index + 1) * 25 }}% COMPLETE</span>
      </div>
    </article>
  </section>
</template>

<script setup>
/**
 * 活动项目视图组件
 * @description 展示团队活动项目和任务进度
 */

import PageTitle from '@/components/common/PageTitle.vue'
import { projects } from '@/data/siteContent'

/**
 * 获取项目状态样式类
 * @param {number} index - 项目索引
 * @returns {string} 状态样式类名
 */
const getStatusClass = (index) => {
  const classes = ['status-active', 'status-pending', 'status-scheduled']
  return classes[index % classes.length]
}
</script>

<style scoped>
/* 项目卡片网格 */
.projects-grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.mission-card {
  position: relative;
  border-left: 3px solid var(--accent);
  animation: fadeInUp 0.6s ease both;
}

.mission-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.mission-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(95, 169, 255, 0.1);
  border: 1px solid rgba(143, 215, 255, 0.2);
  border-radius: 4px;
  color: var(--accent-2);
}

.mission-icon svg {
  width: 22px;
  height: 22px;
}

.mission-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
}

.mission-tag {
  padding: 0.2rem 0.5rem;
  background: rgba(95, 169, 255, 0.1);
  border: 1px solid rgba(143, 215, 255, 0.3);
  border-radius: 2px;
  color: var(--accent);
  text-transform: uppercase;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.mission-status {
  padding: 0.2rem 0.5rem;
  border-radius: 2px;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.status-active {
  background: rgba(78, 205, 196, 0.15);
  border: 1px solid rgba(78, 205, 196, 0.4);
  color: var(--success);
}

.status-pending {
  background: rgba(255, 159, 67, 0.15);
  border: 1px solid rgba(255, 159, 67, 0.4);
  color: var(--accent-warm);
}

.status-scheduled {
  background: rgba(95, 169, 255, 0.15);
  border: 1px solid rgba(95, 169, 255, 0.4);
  color: var(--accent);
}

h3 {
  margin: 0 0 0.75rem;
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.mission-period {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: var(--accent-2);
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mission-period svg {
  width: 16px;
  height: 16px;
  opacity: 0.7;
}

p {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.6;
}

.mission-footer {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--line);
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(95, 169, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  border-radius: 2px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
