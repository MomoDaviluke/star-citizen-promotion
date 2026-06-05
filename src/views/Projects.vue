<!--
  @file 活动项目视图组件 - Stellar Nexus 星渊枢纽风格
  @description 展示团队活动项目和任务进度，采用Stellar Nexus视觉系统
  @module views/Projects
  @version 3.0 - Stellar Nexus视觉系统
-->

<template>
  <div class="projects-page">
    <!-- 星云背景装饰 -->
    <div class="page-nebulae">
      <div class="nebula-blob nebula-blob--purple"></div>
      <div class="nebula-blob nebula-blob--cyan"></div>
    </div>

    <!-- MFD风格页面标题 -->
    <PageHeader
      backgroundImage="/images/sc/sc-projects.jpg"
      title="活动项目"
      subtitle="查看团队常规行动、专项训练与赛事任务"
      systemId="SYS.PROJECTS // V.3.0"
    />

    <!-- 任务统计面板 -->
    <section class="stats-section">
      <div class="section-header-mfd" v-scroll-reveal="'fadeUp'">
        <span class="section-id font-data">// MISSION.STATS</span>
        <h2 class="section-title font-tech">任务统计</h2>
      </div>

      <div class="stats-grid" v-scroll-reveal="{ animation: 'fadeUp', delay: 0.15 }">
        <MFDPanel
          v-for="(stat, index) in missionStats"
          :key="stat.label"
          :variant="index === 0 ? 'primary' : 'secondary'"
          :title="stat.label.toUpperCase()"
          :subtitle="'METRIC-' + String(index + 1).padStart(2, '0')"
          :icon="stat.icon"
          :status="'ACTIVE'"
          statusType="online"
          :animated="true"
          class="stat-mfd-panel"
        >
          <div class="stat-content">
            <div class="stat-value font-data">{{ stat.value }}</div>
            <div class="stat-bar">
              <div class="stat-fill" :style="{ width: stat.percentage + '%' }"></div>
            </div>
            <div class="stat-percentage font-data">{{ stat.percentage }}%</div>
          </div>
        </MFDPanel>
      </div>
    </section>

    <!-- 任务列表 - MFD面板风格 -->
    <section class="missions-section">
      <div class="section-header-mfd" v-scroll-reveal="'fadeUp'">
        <span class="section-id font-data">// MISSION.LOG</span>
        <h2 class="section-title font-tech">任务日志</h2>
      </div>

      <div class="missions-grid" v-scroll-reveal="{ animation: 'fadeUp', delay: 0.15 }">
        <MFDPanel
          v-for="(item, index) in projects"
          :key="item.name"
          :variant="getMissionVariant(item.status)"
          :title="item.name.toUpperCase()"
          :subtitle="getStatusText(item.status)"
          :icon="'◈'"
          :status="getStatusText(item.status)"
          :statusType="getStatusType(item.status)"
          :animated="true"
          class="mission-mfd-panel"
        >
          <div class="mission-profile">
            <!-- 任务元数据 -->
            <div class="mission-meta-row">
              <div class="meta-item">
                <span class="meta-label font-data">PERIOD</span>
                <span class="meta-value">{{ item.period }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label font-data">TYPE</span>
                <span class="meta-value mission-tag">MISSION LOG</span>
              </div>
            </div>

            <!-- 任务描述 -->
            <p class="mission-desc">{{ item.description }}</p>

            <!-- 进度条 -->
            <div class="mission-progress">
              <div class="progress-header">
                <span class="progress-label font-data">COMPLETION</span>
                <span class="progress-value font-data">{{ item.progress || 0 }}%</span>
              </div>
              <div class="progress-track">
                <div
                  class="progress-fill"
                  :class="getProgressClass(item.status)"
                  :style="{ width: `${item.progress || 0}%` }"
                ></div>
              </div>
            </div>
          </div>
        </MFDPanel>
      </div>

      <!-- 空状态 -->
      <MFDPanel
        v-if="projects.length === 0 && !isLoading"
        variant="secondary"
        title="NO DATA"
        subtitle="MISSION LOG EMPTY"
        icon="◈"
        status="STANDBY"
        statusType="offline"
        class="empty-mfd-panel"
      >
        <div class="empty-content">
          <div class="empty-icon">◈</div>
          <p class="empty-text">暂无进行中的任务项目</p>
          <p class="empty-subtext">请稍后查看或联系指挥官获取最新任务简报</p>
        </div>
      </MFDPanel>

      <!-- 加载状态 -->
      <MFDPanel
        v-if="isLoading"
        variant="primary"
        title="LOADING"
        subtitle="RETRIEVING DATA"
        icon="◈"
        status="PROCESSING"
        statusType="warning"
        :scanlines="true"
        class="loading-mfd-panel"
      >
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p class="loading-text">正在从战术网络获取任务数据...</p>
        </div>
      </MFDPanel>
    </section>
  </div>
</template>

<script setup>
/**
 * 活动项目视图组件 - Stellar Nexus 星渊枢纽风格
 * @description 展示团队活动项目和任务进度，采用Stellar Nexus视觉系统
 * @version 3.0
 */

import { ref, computed, onMounted } from 'vue'
import { createLogger } from '../utils/logger.js'
import { dataService } from '@/services'
import MFDPanel from '@/components/ui/MFDPanel.vue'
import StatusIndicator from '@/components/ui/StatusIndicator.vue'
import PageHeader from '@/components/common/PageHeader.vue'

const logger = createLogger('Projects')

/** 项目数据 */
const projects = ref([])
/** 加载状态 */
const isLoading = ref(true)

/**
 * 任务统计数据
 * 基于项目数据计算各项指标
 */
const missionStats = computed(() => {
  const total = projects.value.length
  const active = projects.value.filter(p => p.status === 'active').length
  const completed = projects.value.filter(p => p.status === 'completed').length
  const planning = projects.value.filter(p => p.status === 'planning').length

  return [
    { label: 'Total Missions', value: total, percentage: 100, icon: '◈' },
    { label: 'Active', value: active, percentage: total > 0 ? Math.round((active / total) * 100) : 0, icon: '●' },
    { label: 'Completed', value: completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0, icon: '◆' },
    { label: 'Planning', value: planning, percentage: total > 0 ? Math.round((planning / total) * 100) : 0, icon: '○' }
  ]
})

/**
 * 加载项目数据
 * 从数据服务获取任务列表
 */
async function loadProjects() {
  isLoading.value = true
  try {
    const response = await dataService.getProjects()
    projects.value = response.data || []
  } catch (error) {
    logger.error('加载项目数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

/**
 * 获取任务状态样式变体
 * @param {string} status - 任务状态
 * @returns {string} MFD面板变体名称
 */
const getMissionVariant = (status) => {
  const variantMap = {
    active: 'primary',
    planning: 'secondary',
    completed: 'secondary',
    cancelled: 'alert'
  }
  return variantMap[status] || 'secondary'
}

/**
 * 获取任务状态文本
 * @param {string} status - 任务状态
 * @returns {string} 状态文本
 */
const getStatusText = (status) => {
  const statusMap = {
    active: 'ACTIVE',
    planning: 'PLANNING',
    completed: 'COMPLETED',
    cancelled: 'CANCELLED'
  }
  return statusMap[status] || 'UNKNOWN'
}

/**
 * 获取状态指示器类型
 * @param {string} status - 任务状态
 * @returns {string} 状态类型
 */
const getStatusType = (status) => {
  const typeMap = {
    active: 'online',
    planning: 'warning',
    completed: 'offline',
    cancelled: 'danger'
  }
  return typeMap[status] || 'offline'
}

/**
 * 获取进度条样式类
 * @param {string} status - 任务状态
 * @returns {string} CSS类名
 */
const getProgressClass = (status) => {
  const classMap = {
    active: 'progress-fill--active',
    planning: 'progress-fill--planning',
    completed: 'progress-fill--completed',
    cancelled: 'progress-fill--cancelled'
  }
  return classMap[status] || ''
}

onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
/* 页面容器 */
.projects-page {
  padding: 2rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
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

/* MFD风格页面标题 */
.page-header-mfd {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 3rem;
  padding: 2rem;
  padding-bottom: 1.5rem;
  background: linear-gradient(135deg, rgba(12, 20, 36, 0.95), rgba(6, 11, 20, 0.98));
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: var(--radius-md);
  position: relative;
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
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  z-index: 1;
}

.page-id {
  font-size: 0.75rem;
  color: var(--nebula-purple);
  letter-spacing: 0.15em;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-muted);
  margin: 0;
  letter-spacing: 0.05em;
}

.page-header-decoration {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}

.header-line {
  width: 60px;
  height: 2px;
  background: var(--accent);
  opacity: 0.6;
}

/* 区块标题 */
.section-header-mfd {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-left: 1rem;
  border-left: 3px solid var(--accent);
}

.section-id {
  font-size: 0.7rem;
  color: var(--accent);
  letter-spacing: 0.1em;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* 统计区域 */
.stats-section {
  margin-bottom: 3rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
}

.stat-mfd-panel {
  animation: fadeInUp 0.5s ease both;
}

.stat-mfd-panel:nth-child(1) { animation-delay: 0s; }
.stat-mfd-panel:nth-child(2) { animation-delay: 0.1s; }
.stat-mfd-panel:nth-child(3) { animation-delay: 0.2s; }
.stat-mfd-panel:nth-child(4) { animation-delay: 0.3s; }

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.05em;
}

.stat-bar {
  width: 100%;
  height: 4px;
  background: rgba(95, 169, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  border-radius: 2px;
  transition: width 0.5s ease;
}

.stat-percentage {
  font-size: 0.75rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

/* 任务区域 */
.missions-section {
  margin-bottom: 3rem;
}

.missions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.25rem;
}

.mission-mfd-panel {
  animation: fadeInUp 0.6s ease both;
}

.mission-mfd-panel:nth-child(1) { animation-delay: 0s; }
.mission-mfd-panel:nth-child(2) { animation-delay: 0.1s; }
.mission-mfd-panel:nth-child(3) { animation-delay: 0.2s; }
.mission-mfd-panel:nth-child(4) { animation-delay: 0.3s; }
.mission-mfd-panel:nth-child(5) { animation-delay: 0.4s; }
.mission-mfd-panel:nth-child(6) { animation-delay: 0.5s; }

/* 任务档案 */
.mission-profile {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem;
}

.mission-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meta-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.meta-value {
  font-size: 0.8rem;
  color: var(--text-secondary);
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

.mission-desc {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.6;
  font-size: 0.9rem;
}

/* 进度条 */
.mission-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-light);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.progress-value {
  font-size: 0.75rem;
  color: var(--accent);
  font-weight: 600;
  letter-spacing: 0.1em;
}

.progress-track {
  width: 100%;
  height: 4px;
  background: rgba(95, 169, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.progress-fill--active {
  background: linear-gradient(90deg, var(--success), #3ddc97);
}

.progress-fill--planning {
  background: linear-gradient(90deg, var(--accent-warm), #ffd166);
}

.progress-fill--completed {
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
}

.progress-fill--cancelled {
  background: linear-gradient(90deg, var(--danger), #ff6b6b);
}

/* 空状态 */
.empty-mfd-panel {
  margin-top: 2rem;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  color: var(--accent);
  opacity: 0.5;
}

.empty-text {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
}

.empty-subtext {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}

/* 加载状态 */
.loading-mfd-panel {
  margin-top: 2rem;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 2rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 2px solid rgba(95, 169, 255, 0.2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0;
  letter-spacing: 0.05em;
}

/* 动画 */
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .projects-page {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .missions-grid {
    grid-template-columns: 1fr;
  }

  .mission-meta-row {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .page-header-mfd {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .page-header-decoration {
    align-items: flex-start;
  }
}
</style>
