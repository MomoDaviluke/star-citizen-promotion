<!--
  @file 团队介绍视图组件
  @description 展示团队背景、愿景、价值观和发展历程
  @module views/About
-->

<template>
  <PageTitle
    title="团队介绍"
    subtitle="这里放团队成立背景、愿景与核心价值，建议配合时间线与关键里程碑。"
  />

  <!-- 团队介绍卡片 -->
  <section class="grid about-grid">
    <article
      class="card about-card"
      v-for="(item, index) in aboutItems"
      :key="item.title"
      :style="{ animationDelay: `${index * 0.15}s` }"
    >
      <div class="card-header">
        <span class="card-number">0{{ index + 1 }}</span>
        <div class="card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path v-if="index === 0" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            <path v-else-if="index === 1" d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"/>
            <path v-else d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
      </div>
      <h3>{{ item.title }}</h3>
      <p>{{ item.content }}</p>
      <div class="card-footer">
        <span class="footer-line"></span>
      </div>
    </article>
  </section>

  <!-- 发展历程时间线 -->
  <section class="timeline">
    <div class="timeline-header">
      <span class="timeline-label">HISTORY</span>
      <h2>发展历程</h2>
    </div>
    <div class="timeline-items">
      <div class="timeline-item" v-for="(item, index) in timeline" :key="index">
        <div class="timeline-marker">
          <span class="marker-dot"></span>
          <span class="marker-line"></span>
        </div>
        <div class="timeline-content">
          <span class="timeline-date">{{ item.date }}</span>
          <h4>{{ item.title }}</h4>
          <p>{{ item.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
/**
 * 团队介绍视图组件
 * @description 展示团队信息和发展历程时间线
 */

import PageTitle from '@/components/common/PageTitle.vue'
import { ref } from 'vue'

/** 团队介绍内容项 */
const aboutItems = ref([
  { title: '我们是谁', content: '替换为团队简介：组织定位、风格、主要玩法方向。' },
  { title: '我们的目标', content: '替换为中长期目标：成员成长、行动规划、对外合作。' },
  { title: '文化与纪律', content: '替换为行为准则：沟通方式、活动出勤、协作流程。' }
])

/** 发展历程时间线数据 */
const timeline = ref([
  { date: '2954.Q1', title: '组织成立', desc: '在斯坦顿星系正式组建核心团队' },
  { date: '2954.Q3', title: '首次大型行动', desc: '完成首次跨星系护航任务' },
  { date: '2955.Q2', title: '成员突破', desc: '团队规模扩展至20名活跃成员' },
  { date: '2956.Q1', title: '战略升级', desc: '开启Pyro星系探索计划' }
])
</script>

<style scoped>
/* 团队介绍卡片网格 */
.about-grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.about-card {
  animation: fadeInUp 0.6s ease both;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.card-number {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.1em;
}

.card-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(95, 169, 255, 0.1);
  border: 1px solid rgba(143, 215, 255, 0.2);
  border-radius: 4px;
  color: var(--accent-2);
}

.card-icon svg {
  width: 20px;
  height: 20px;
}

h3 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

p {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.6;
}

.card-footer {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--line);
}

.footer-line {
  display: block;
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, var(--accent-2), transparent);
}

/* 时间线区域 */
.timeline {
  margin-top: 3rem;
  padding: 2rem;
  background: linear-gradient(165deg, rgba(15, 30, 50, 0.6), rgba(8, 18, 32, 0.8));
  border: 1px solid var(--line);
  border-radius: 4px;
}

.timeline-header {
  margin-bottom: 2rem;
}

.timeline-label {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  background: rgba(95, 169, 255, 0.1);
  border: 1px solid rgba(143, 215, 255, 0.3);
  border-radius: 2px;
  color: var(--accent-2);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.timeline-header h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.timeline-items {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.timeline-item {
  display: flex;
  gap: 1.5rem;
  padding: 1rem 0;
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.marker-dot {
  width: 12px;
  height: 12px;
  background: var(--accent);
  border: 2px solid var(--accent-2);
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(95, 169, 255, 0.4);
}

.marker-line {
  width: 2px;
  flex: 1;
  background: linear-gradient(180deg, var(--accent), transparent);
  margin-top: 0.5rem;
}

.timeline-item:last-child .marker-line {
  display: none;
}

.timeline-content {
  flex: 1;
  padding-bottom: 0.5rem;
}

.timeline-date {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: rgba(95, 169, 255, 0.1);
  border-radius: 2px;
  color: var(--accent-2);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
}

.timeline-content h4 {
  margin: 0 0 0.35rem;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.timeline-content p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
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

/* 响应式适配 */
@media (max-width: 860px) {
  .timeline {
    padding: 1.5rem;
  }

  .timeline-item {
    gap: 1rem;
  }
}
</style>
