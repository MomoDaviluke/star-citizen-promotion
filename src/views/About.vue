<!--
  @file 团队介绍视图组件 - Stellar Nexus 星渊枢纽风格
  @description 展示团队背景、愿景、价值观和发展历程，采用Stellar Nexus视觉系统
  @module views/About
  @version 3.0 - Stellar Nexus视觉系统
-->

<template>
  <div class="about-page">
    <!-- 星云背景装饰 -->
    <div class="page-nebulae">
      <div class="nebula-blob nebula-blob--purple"></div>
      <div class="nebula-blob nebula-blob--cyan"></div>
    </div>

    <!-- 页面标题区域 -->
    <PageHeader
      backgroundImage="/images/sc/sc-about.jpg"
      title="团队介绍"
      subtitle="了解我们的组织背景、愿景与核心价值"
      systemId="SYS.ABOUT // V.3.0"
    />

    <!-- 团队介绍卡片 - MFD面板风格 -->
    <section class="about-section">
      <div class="section-header-mfd" v-scroll-reveal="'fadeUp'">
        <span class="section-id font-data">// ORG.OVERVIEW</span>
        <h2 class="section-title font-tech">组织概览</h2>
      </div>

      <div class="about-grid" v-scroll-reveal="{ animation: 'fadeUp', delay: 0.2 }">
        <MFDPanel
          v-for="(item, index) in aboutItems"
          :key="item.title"
          :variant="index === 0 ? 'primary' : 'secondary'"
          :title="item.title.toUpperCase()"
          :subtitle="'MODULE-' + (index + 1)"
          :icon="getAboutIcon(index)"
          :status="'ACTIVE'"
          statusType="online"
          :animated="true"
          class="about-mfd-panel"
        >
          <div class="about-content">
            <p class="about-text">{{ item.content }}</p>
            <div class="about-metrics">
              <DataDisplay
                :label="'PRIORITY'"
                :value="(index + 1) + '.0'"
                :type="index === 0 ? 'primary' : 'secondary'"
              />
            </div>
          </div>
        </MFDPanel>
      </div>
    </section>

    <!-- 发展历程时间线 - MFD风格 -->
    <section class="timeline-section">
      <div class="section-header-mfd" v-scroll-reveal="'fadeUp'">
        <span class="section-id font-data">// TIMELINE.LOG</span>
        <h2 class="section-title font-tech">发展历程</h2>
      </div>

      <MFDPanel
        variant="primary"
        title="HISTORICAL DATA"
        subtitle="CHRONOLOGICAL RECORD"
        icon="◈"
        status="ARCHIVED"
        statusType="offline"
        :scanlines="true"
        class="timeline-mfd-panel"
        v-scroll-reveal="{ animation: 'fadeLeft', delay: 0.2 }"
      >
        <div class="timeline-container">
          <div
            v-for="(item, index) in timeline"
            :key="index"
            class="timeline-item"
            :class="{ 'timeline-item--active': index === timeline.length - 1 }"
          >
            <div class="timeline-marker">
              <div class="marker-node">
                <span class="marker-index font-data">{{ String(index + 1).padStart(2, '0') }}</span>
              </div>
              <div v-if="index < timeline.length - 1" class="marker-connector"></div>
            </div>
            <div class="timeline-content">
              <div class="timeline-meta">
                <span class="timeline-stardate font-data">STARDATE {{ item.date }}</span>
                <StatusIndicator
                  :type="index === timeline.length - 1 ? 'online' : 'offline'"
                  :label="index === timeline.length - 1 ? 'CURRENT' : 'COMPLETED'"
                  size="small"
                />
              </div>
              <h4 class="timeline-title font-tech">{{ item.title }}</h4>
              <p class="timeline-desc">{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </MFDPanel>
    </section>

    <!-- 团队统计数据 - MFD风格 -->
    <section class="team-stats-section">
      <div class="section-header-mfd" v-scroll-reveal="'fadeUp'">
        <span class="section-id font-data">// METRICS.REALTIME</span>
        <h2 class="section-title font-tech">团队指标</h2>
      </div>

      <div class="team-stats-grid" v-scroll-reveal="{ animation: 'fadeUp', delay: 0.2 }">
        <MFDPanel
          v-for="(stat, index) in teamMetrics"
          :key="stat.label"
          variant="secondary"
          :title="stat.label"
          :subtitle="'METRIC-' + (index + 1)"
          icon="◈"
          :status="'LIVE'"
          statusType="online"
          class="team-stat-panel"
        >
          <div class="team-stat-value">
            <span class="stat-number-large font-data">{{ stat.value }}</span>
            <span class="stat-trend font-data" :class="stat.trend > 0 ? 'trend-up' : 'trend-down'">
              {{ stat.trend > 0 ? '▲' : '▼' }} {{ Math.abs(stat.trend) }}%
            </span>
          </div>
          <div class="stat-bar-container">
            <div class="stat-progress-bar">
              <div class="stat-progress-fill" :style="{ width: stat.percentage + '%' }"></div>
            </div>
            <span class="stat-percentage font-data">{{ stat.percentage }}%</span>
          </div>
        </MFDPanel>
      </div>
    </section>
  </div>
</template>

<script setup>
/**
 * 团队介绍视图组件 - Stellar Nexus 星渊枢纽风格
 * @description 展示团队信息和发展历程时间线，采用Stellar Nexus视觉系统
 * @version 3.0 - Stellar Nexus视觉系统
 */

import { ref } from 'vue'
import MFDPanel from '@/components/ui/MFDPanel.vue'
import StatusIndicator from '@/components/ui/StatusIndicator.vue'
import DataDisplay from '@/components/ui/DataDisplay.vue'
import PageHeader from '@/components/common/PageHeader.vue'

/** 获取关于卡片图标 */
function getAboutIcon(index) {
  const icons = ['◈', '◉', '◆']
  return icons[index] || '◈'
}

/** 团队介绍内容项 */
const aboutItems = ref([
  {
    title: '我们是谁',
    content: '一支专注于星际公民深度体验的组织，致力于在宇宙中建立强大的团队力量。我们由经验丰富的飞行员、战术专家和工程师组成，在斯坦顿星系及周边区域执行各类任务。'
  },
  {
    title: '我们的目标',
    content: '成为服务器中最具影响力的组织之一，在贸易、战斗、探索等各个领域建立卓越声誉。我们追求成员的共同成长，通过系统化训练和实战积累经验。'
  },
  {
    title: '文化与纪律',
    content: '强调团队协作、尊重与专业精神。我们要求成员保持活跃参与，遵守组织纪律，在行动中服从指挥。同时鼓励创新思维和战术讨论。'
  }
])

/** 发展历程时间线数据 */
const timeline = ref([
  { date: '2954.Q1', title: '组织成立', desc: '在斯坦顿星系正式组建核心团队，确立组织架构和发展方向' },
  { date: '2954.Q3', title: '首次大型行动', desc: '完成首次跨星系护航任务，获得客户高度评价' },
  { date: '2955.Q2', title: '成员突破', desc: '团队规模扩展至20名活跃成员，建立完整的训练体系' },
  { date: '2956.Q1', title: '战略升级', desc: '开启Pyro星系探索计划，部署多艘主力舰船' }
])

/** 团队统计数据 */
const teamMetrics = ref([
  { label: '活跃成员', value: '24', trend: 12, percentage: 80 },
  { label: '完成任务', value: '156', trend: 8, percentage: 65 },
  { label: '舰队规模', value: '18', trend: 5, percentage: 45 },
  { label: '胜率', value: '87%', trend: 3, percentage: 87 }
])
</script>

<style scoped>
/* ========== 页面容器 ========== */
.about-page {
  position: relative;
}

/* 星云背景装饰 */
.page-nebulae {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.nebula-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  animation: nebula-drift 20s ease-in-out infinite;
}

.nebula-blob--purple {
  width: 50vw;
  height: 50vw;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.08), transparent 70%);
  top: -10%;
  right: -10%;
}

.nebula-blob--cyan {
  width: 40vw;
  height: 40vw;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.06), transparent 70%);
  bottom: 10%;
  left: -10%;
  animation-delay: -7s;
}

/* ========== 页面标题区域 ========== */
.page-header-mfd {
  position: relative;
  padding: 2rem;
  margin: -2rem -1.5rem 3rem;
  background: linear-gradient(135deg, rgba(12, 20, 36, 0.95), rgba(6, 11, 20, 0.98));
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: var(--radius-md);
  overflow: hidden;
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
  opacity: 0.15;
  filter: saturate(0.5) brightness(0.4);
  mix-blend-mode: screen;
}

.page-header-bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(12, 20, 36, 0.9), rgba(6, 11, 20, 0.95));
}

.page-header-mfd::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--nebula-purple), transparent);
  animation: scanLineHorizontal 3s linear infinite;
  z-index: 1;
}

.page-header-content {
  position: relative;
  z-index: 1;
}

.page-id {
  display: block;
  color: var(--nebula-purple);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  margin-bottom: 0.5rem;
}

.page-title {
  margin: 0 0 0.5rem;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-primary);
}

.page-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.6;
}

.page-header-decoration {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 1;
}

.header-line {
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, var(--nebula-purple), transparent);
}

/* ========== 区域标题 ========== */
.section-header-mfd {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
}

.section-id {
  color: var(--nebula-purple);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
}

.section-title {
  margin: 0;
  font-size: clamp(1.2rem, 2.5vw, 1.6rem);
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--text-primary);
}

/* ========== 团队介绍区域 ========== */
.about-section {
  margin-bottom: 3rem;
}

.about-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.about-mfd-panel {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.about-mfd-panel:hover {
  transform: translateY(-4px);
}

.about-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.about-text {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 0.95rem;
}

.about-metrics {
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-subtle);
}

/* ========== 时间线区域 ========== */
.timeline-section {
  margin-bottom: 3rem;
}

.timeline-mfd-panel {
  overflow: visible;
}

.timeline-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 1rem 0;
}

.timeline-item {
  display: flex;
  gap: 1.5rem;
  padding: 1.25rem 0;
  position: relative;
}

.timeline-item--active {
  background: rgba(124, 58, 237, 0.03);
  margin: 0 -1rem;
  padding: 1.25rem 1rem;
  border-radius: var(--radius-sm);
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 40px;
}

.marker-node {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(12, 20, 36, 0.8);
  border: 1px solid var(--nebula-purple);
  border-radius: var(--radius-sm);
}

.marker-index {
  color: var(--nebula-violet);
  font-size: 0.7rem;
  font-weight: 600;
}

.marker-connector {
  width: 1px;
  flex: 1;
  min-height: 30px;
  background: linear-gradient(180deg, var(--nebula-purple), transparent);
  margin-top: 0.5rem;
}

.timeline-item:last-child .marker-connector {
  display: none;
}

.timeline-content {
  flex: 1;
}

.timeline-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.timeline-stardate {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 2px;
  color: var(--nebula-violet);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.timeline-title {
  margin: 0 0 0.35rem;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-primary);
}

.timeline-desc {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
}

/* ========== 团队统计区域 ========== */
.team-stats-section {
  margin-bottom: 3rem;
}

.team-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.team-stat-panel {
  transition: transform 0.3s ease;
}

.team-stat-panel:hover {
  transform: translateY(-4px);
}

.team-stat-value {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.stat-number-large {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.02em;
  line-height: 1;
}

.stat-trend {
  font-size: 0.75rem;
  font-weight: 600;
}

.trend-up {
  color: var(--status-online);
}

.trend-down {
  color: var(--amber-primary);
}

.stat-bar-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(124, 58, 237, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.stat-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--nebula-purple), var(--nebula-violet));
  border-radius: 2px;
  transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 0 10px var(--nebula-glow);
}

.stat-percentage {
  color: var(--text-muted);
  font-size: 0.7rem;
  min-width: 35px;
  text-align: right;
}

/* ========== 动画 ========== */
@keyframes scanLineHorizontal {
  0% {
    opacity: 0;
    transform: translateX(-100%);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(100%);
  }
}

/* ========== 响应式布局 ========== */
@media (max-width: 768px) {
  .page-header-mfd {
    margin: -1rem -1rem 2rem;
    padding: 1.5rem;
  }

  .page-header-decoration {
    display: none;
  }

  .about-grid {
    grid-template-columns: 1fr;
  }

  .team-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .timeline-item {
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .team-stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-number-large {
    font-size: 2rem;
  }
}
</style>
