<!--
  @file 活动项目视图组件
  @description 展示战队活动项目
  @version 9.0 - Premium Restraint
-->

<template>
  <div class="projects-page">

    <section class="page-header">
      <div class="container">
        <span class="section-label">OPERATIONS</span>
        <h1>活动项目</h1>
        <p class="page-header__desc">我们的作战行动与协作项目。</p>
      </div>
    </section>

    <section class="projects-content section">
      <div class="container">
        <!-- 状态筛选栏 -->
        <div class="filter-bar">
          <button
            v-for="filter in statusFilters"
            :key="filter"
            class="filter-btn"
            :class="{ 'filter-btn--active': activeFilter === filter }"
            @click="activeFilter = filter"
          >
            {{ filter }}
          </button>
        </div>
        <div class="projects-grid">
          <div v-for="project in filteredProjects" :key="project.name" class="project-card card">
            <div class="project-card__header">
              <span class="tag" :class="`tag--${project.status}`">{{ getProjectStatusLabel(project.status) }}</span>
              <span class="project-card__date font-data">{{ project.date }}</span>
            </div>
            <h3 class="project-card__name">{{ project.name }}</h3>
            <p class="project-card__desc">{{ project.description }}</p>
            <div class="project-card__meta">
              <span class="project-card__meta-item font-data">{{ project.members }} 人参与</span>
              <span class="project-card__meta-item font-data">{{ project.type }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getProjectStatusLabel } from '@/utils/labelMaps'

const projects = ref([
  { name: '商船护航 Alpha', status: 'active', date: '2026.07', description: 'Stanton 星系定期商船护航任务，保障贸易航线安全。', members: 24, type: '周期任务' },
  { name: '矿区防御 Bravo', status: 'active', date: '2026.06', description: 'Yela 小行星带矿区防御行动，防止海盗骚扰。', members: 16, type: '防御任务' },
  { name: 'Pyro 远征 III', status: 'active', date: '2026.05', description: '第三季度大规模 Pyro 星系探索远征，开辟新据点。', members: 48, type: '探索任务' },
  { name: '舰队战演习 2026', status: 'completed', date: '2026.04', description: '年度舰队战大规模演习，测试指挥体系与协作能力。', members: 64, type: '训练任务' },
  { name: '新人训练营 #12', status: 'active', date: '2026.07', description: '为期两周的新飞行员培训计划，涵盖基础飞行与战术。', members: 12, type: '培训计划' },
  { name: '星际联赛 S4', status: 'planning', date: '2026.09', description: '第四季社区竞技联赛，与其他战队联合举办。', members: 32, type: '竞技活动' },
  { name: 'Deep Space Recon', status: 'planning', date: '2026.08', description: '未探索星系深度侦察任务，收集星图数据。', members: 20, type: '探索任务' },
  { name: '基地建设 Gamma', status: 'completed', date: '2026.03', description: 'Lagrangian 点前哨站建设，扩展舰队后勤网络。', members: 28, type: '建设任务' },
])

// 状态筛选
const statusFilters = ['全部', '进行中', '规划中', '已完成']
const statusMap = { '全部': null, '进行中': 'active', '规划中': 'planning', '已完成': 'completed' }
const activeFilter = ref('全部')

const filteredProjects = computed(() => {
  const status = statusMap[activeFilter.value]
  if (!status) return projects.value
  return projects.value.filter((p) => p.status === status)
})
</script>

<style scoped>
.page-header {
  padding: var(--space-16) 0 var(--space-8);
}

.page-header h1 { font-size: var(--text-4xl); margin-top: var(--space-2); }
.page-header__desc { font-size: var(--text-md); color: var(--color-text-body); margin-top: var(--space-2); }

/* 状态筛选栏 */
.filter-bar {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}

.filter-btn {
  padding: var(--space-2) var(--space-4);
  background: transparent;
  border: 1px solid var(--color-border-subtle);
  border-radius: 999px;
  color: var(--color-text-body);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--motion-duration-normal) var(--motion-ease-smooth);
}

.filter-btn:hover {
  border-color: var(--color-border-hover);
  color: var(--color-text-heading);
}

.filter-btn--active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-bg-deep);
  font-weight: 500;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

.project-card {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.project-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-card__date {
  font-size: var(--text-xs);
  color: var(--color-text-dim);
}

.project-card__name {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-heading);
  margin-bottom: 0;
}

.project-card__desc {
  font-size: var(--text-base);
  color: var(--color-text-body);
  line-height: 1.7;
  max-width: 55ch;
}

.project-card__meta {
  display: flex;
  gap: var(--space-4);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border-subtle);
}

.project-card__meta-item {
  font-size: var(--text-xs);
  color: var(--color-text-dim);
}

.tag--active { border-color: rgba(34, 197, 94, 0.3); color: var(--color-status-online); background: rgba(34, 197, 94, 0.08); }
.tag--planning { border-color: rgba(var(--raw-gold-rgb), 0.3); color: var(--color-accent); background: var(--color-accent-muted); }
.tag--completed { border-color: var(--color-border-subtle); color: var(--color-text-dim); background: var(--color-bg-elevated); }

@media (max-width: 768px) {
  .projects-grid { grid-template-columns: 1fr; }
  .page-header { padding: var(--space-10) 0 var(--space-6); }
}
</style>
