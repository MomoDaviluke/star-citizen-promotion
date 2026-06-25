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
        <div class="projects-grid">
          <div v-for="project in projects" :key="project.name" class="project-card card">
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
import { ref } from 'vue'
import { getProjectStatusLabel } from '@/utils/labelMaps'

const projects = ref([
  { name: '商船护航 Alpha', status: 'active', date: '2024.12', description: 'Stanton 星系定期商船护航任务，保障贸易航线安全。', members: 24, type: '周期任务' },
  { name: '矿区防御 Bravo', status: 'active', date: '2024.11', description: 'Yela 小行星带矿区防御行动，防止海盗骚扰。', members: 16, type: '防御任务' },
  { name: 'Pyro 远征', status: 'planning', date: '2025.01', description: '首次大规模 Pyro 星系探索远征，开辟新据点。', members: 48, type: '探索任务' },
  { name: '舰队战演习', status: 'completed', date: '2024.10', description: '年度舰队战大规模演习，测试指挥体系与协作能力。', members: 64, type: '训练任务' },
  { name: '新人训练营', status: 'active', date: '2024.12', description: '为期两周的新飞行员培训计划，涵盖基础飞行与战术。', members: 12, type: '培训计划' },
  { name: '社区联赛', status: 'planning', date: '2025.02', description: '与其他战队联合举办的社区竞技联赛。', members: 32, type: '竞技活动' },
])
</script>

<style scoped>
.page-header {
  padding: var(--space-16) 0 var(--space-8);
}

.page-header h1 { font-size: var(--text-4xl); margin-top: var(--space-2); }
.page-header__desc { font-size: var(--text-md); color: var(--color-text-body); margin-top: var(--space-2); }

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
  font-size: var(--text-sm);
  color: var(--color-text-body);
  line-height: 1.6;
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
.tag--completed { border-color: var(--color-border-subtle); color: var(--color-text-dim); background: rgba(255, 255, 255, 0.03); }

@media (max-width: 768px) {
  .projects-grid { grid-template-columns: 1fr; }
  .page-header { padding: var(--space-10) 0 var(--space-6); }
}
</style>
