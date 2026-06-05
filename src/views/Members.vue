<!--
  @file 核心成员视图组件 - Stellar Nexus 星渊枢纽风格
  @description 展示团队核心成员信息卡片，采用Stellar Nexus视觉系统
  @module views/Members
  @version 3.0 - Stellar Nexus视觉系统
-->

<template>
  <div class="members-page">
    <!-- 星云背景装饰 -->
    <div class="page-nebulae">
      <div class="nebula-blob nebula-blob--purple"></div>
      <div class="nebula-blob nebula-blob--cyan"></div>
    </div>

    <!-- 页面标题区域 -->
    <PageHeader
      backgroundImage="/images/sc/sc-members.jpg"
      title="核心成员"
      subtitle="团队精英飞行员与指挥人员档案"
      systemId="SYS.MEMBERS // V.3.0"
    />

    <!-- 成员统计概览 -->
    <section class="members-overview">
      <div class="section-header-mfd" v-scroll-reveal="'fadeUp'">
        <span class="section-id font-data">// PERSONNEL.OVERVIEW</span>
        <h2 class="section-title font-tech">人员概览</h2>
      </div>

      <div class="overview-grid" v-scroll-reveal="{ animation: 'fadeUp', delay: 0.15 }">
        <MFDPanel
          v-for="(stat, index) in memberStats"
          :key="stat.label"
          :variant="index === 0 ? 'primary' : 'secondary'"
          :title="stat.label.toUpperCase()"
          :subtitle="'METRIC-' + (index + 1)"
          icon="◈"
          :status="'LIVE'"
          statusType="online"
          class="overview-panel"
        >
          <div class="overview-value">
            <span class="overview-number font-data">{{ stat.value }}</span>
            <span class="overview-unit font-data">{{ stat.unit }}</span>
          </div>
        </MFDPanel>
      </div>
    </section>

    <!-- 成员卡片网格 - MFD风格 -->
    <section class="members-section">
      <div class="section-header-mfd" v-scroll-reveal="'fadeUp'">
        <span class="section-id font-data">// PERSONNEL.RECORDS</span>
        <h2 class="section-title font-tech">成员档案</h2>
      </div>

      <div class="members-grid" v-scroll-reveal="{ animation: 'fadeUp', delay: 0.15 }">
        <MFDPanel
          v-for="(item, index) in members"
          :key="item.name"
          :variant="index % 2 === 0 ? 'primary' : 'secondary'"
          :title="item.name.toUpperCase()"
          :subtitle="item.role.toUpperCase()"
          :icon="'◈'"
          :status="'ACTIVE'"
          statusType="online"
          :animated="true"
          class="member-mfd-panel"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div class="member-profile">
            <!-- 成员头像和状态 -->
            <div class="member-header">
              <div class="member-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
                </svg>
              </div>
              <div class="member-status-badge">
                <StatusIndicator type="online" label="ONLINE" size="small" />
              </div>
            </div>

            <!-- 成员信息 -->
            <div class="member-info">
              <p class="member-id font-data">PILOT PROFILE // CLASSIFIED</p>
              <h3 class="member-name font-tech">{{ item.name }}</h3>
              <p class="member-role font-data">{{ item.role }}</p>
              <p class="member-intro">{{ item.intro }}</p>
            </div>

            <!-- 成员数据 -->
            <div class="member-stats">
              <div class="member-stat-item">
                <span class="stat-label font-data">MISSIONS</span>
                <span class="stat-value font-data">{{ 100 + index * 28 }}</span>
              </div>
              <div class="member-stat-item">
                <span class="stat-label font-data">RATING</span>
                <span class="stat-value font-data">{{ ['A+', 'A', 'B+', 'A', 'A+'][index % 5] }}</span>
              </div>
              <div class="member-stat-item">
                <span class="stat-label font-data">HOURS</span>
                <span class="stat-value font-data">{{ 200 + index * 45 }}</span>
              </div>
            </div>

            <!-- 能力条 -->
            <div class="member-abilities">
              <div class="ability-item">
                <span class="ability-label font-data">COMBAT</span>
                <div class="ability-bar">
                  <div class="ability-fill" :style="{ width: `${75 + (index * 5) % 25}%` }"></div>
                </div>
                <span class="ability-value font-data">{{ 75 + (index * 5) % 25 }}%</span>
              </div>
              <div class="ability-item">
                <span class="ability-label font-data">PILOT</span>
                <div class="ability-bar">
                  <div class="ability-fill" :style="{ width: `${80 + (index * 3) % 20}%` }"></div>
                </div>
                <span class="ability-value font-data">{{ 80 + (index * 3) % 20 }}%</span>
              </div>
              <div class="ability-item">
                <span class="ability-label font-data">TACTICS</span>
                <div class="ability-bar">
                  <div class="ability-fill" :style="{ width: `${70 + (index * 7) % 30}%` }"></div>
                </div>
                <span class="ability-value font-data">{{ 70 + (index * 7) % 30 }}%</span>
              </div>
            </div>
          </div>
        </MFDPanel>
      </div>
    </section>
  </div>
</template>

<script setup>
/**
 * 核心成员视图组件 - MFD军事终端风格
 * @description 从API或数据文件读取并展示团队成员信息
 * @version 2.0 - Starship Ark视觉系统
 */

import { ref, onMounted } from 'vue'
import { dataService } from '@/services'
import { createLogger } from '../utils/logger.js'
import MFDPanel from '@/components/ui/MFDPanel.vue'
import StatusIndicator from '@/components/ui/StatusIndicator.vue'
import PageHeader from '@/components/common/PageHeader.vue'

const logger = createLogger('Members')

/** 成员统计数据 */
const memberStats = ref([
  { label: '活跃成员', value: '24', unit: 'PILOTS' },
  { label: '在线人数', value: '18', unit: 'ONLINE' },
  { label: '任务完成', value: '156', unit: 'MISSIONS' },
  { label: '平均评级', value: 'A', unit: 'RATING' }
])

/** 成员数据 */
const members = ref([])

/** 加载状态 */
const isLoading = ref(true)

/**
 * 加载成员数据
 */
async function loadMembers() {
  isLoading.value = true
  try {
    const response = await dataService.getMembers()
    members.value = response.data || []
  } catch (error) {
    logger.error('加载成员数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadMembers()
})
</script>

<style scoped>
/* ========== 页面容器 ========== */
.members-page {
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
  border: 1px solid var(--nebula-purple);
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

/* ========== 成员筛选 ========== */
.members-overview {
  margin-bottom: 3rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.overview-panel {
  transition: transform 0.3s ease;
}

.overview-panel:hover {
  transform: translateY(-4px);
}

.overview-value {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 1rem 0;
}

.overview-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.02em;
  line-height: 1;
}

.overview-unit {
  font-size: 0.75rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

/* ========== 成员网格 ========== */
.members-section {
  margin-bottom: 3rem;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}

.member-mfd-panel {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.member-mfd-panel:hover {
  transform: translateY(-4px);
}

/* ========== 成员档案 ========== */
.member-profile {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.member-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.member-avatar {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(124, 58, 237, 0.05));
  border: 1px solid var(--nebula-purple);
  border-radius: var(--radius-sm);
  color: var(--nebula-violet);
}

.member-avatar svg {
  width: 28px;
  height: 28px;
}

.member-status-badge {
  display: flex;
  align-items: center;
}

/* ========== 成员信息 ========== */
.member-info {
  flex: 1;
}

.member-id {
  margin: 0 0 0.35rem;
  color: var(--nebula-purple);
  text-transform: uppercase;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.15em;
}

.member-name {
  margin: 0 0 0.35rem;
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-primary);
}

.member-role {
  margin: 0 0 0.5rem;
  color: var(--nebula-violet);
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.member-intro {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

/* ========== 成员统计 ========== */
.member-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(10, 20, 35, 0.6);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.member-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
}

.member-stat-item .stat-label {
  color: var(--text-muted);
  font-size: 0.6rem;
  letter-spacing: 0.1em;
}

.member-stat-item .stat-value {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 700;
}

/* ========== 能力条 ========== */
.member-abilities {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ability-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ability-label {
  width: 50px;
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.ability-bar {
  flex: 1;
  height: 4px;
  background: rgba(124, 58, 237, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.ability-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--nebula-purple), var(--nebula-violet));
  border-radius: 2px;
  transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 0 10px var(--nebula-glow);
}

.ability-value {
  width: 35px;
  font-size: 0.7rem;
  color: var(--text-muted);
  text-align: right;
  flex-shrink: 0;
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

  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .members-grid {
    grid-template-columns: 1fr;
  }

  .member-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }

  .overview-number {
    font-size: 2rem;
  }

  .member-stats {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .member-stat-item {
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>
