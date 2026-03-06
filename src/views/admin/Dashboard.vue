<!--
  @file 管理后台仪表盘
  @description 展示站点统计数据和快捷操作入口
  @module views/admin/Dashboard
-->

<template>
  <AdminLayout>
    <div class="dashboard">
      <section class="stats-grid">
        <article
          v-for="(stat, index) in stats"
          :key="stat.label"
          class="stat-card"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div class="stat-icon">{{ stat.icon }}</div>
          <div class="stat-content">
            <h3 class="stat-value">{{ stat.value }}</h3>
            <p class="stat-label">{{ stat.label }}</p>
          </div>
          <div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'">
            <span>{{ stat.trend > 0 ? '↑' : '↓' }}</span>
            <span>{{ Math.abs(stat.trend) }}%</span>
          </div>
        </article>
      </section>

      <section class="dashboard-grid">
        <div class="card recent-applications">
          <div class="card-header">
            <h3>最近申请</h3>
            <RouterLink to="/admin/applications" class="view-all">
              查看全部 →
            </RouterLink>
          </div>
          <div class="application-list">
            <div
              v-for="app in recentApplications"
              :key="app.id"
              class="application-item"
            >
              <div class="app-info">
                <span class="app-name">{{ app.name }}</span>
                <span class="app-email">{{ app.email }}</span>
              </div>
              <div class="app-meta">
                <span class="app-date">{{ formatDate(app.created_at) }}</span>
                <span class="app-status" :class="`status-${app.status}`">
                  {{ statusLabel(app.status) }}
                </span>
              </div>
            </div>
            <div v-if="recentApplications.length === 0" class="empty-state">
              暂无申请记录
            </div>
          </div>
        </div>

        <div class="card quick-actions">
          <div class="card-header">
            <h3>快捷操作</h3>
          </div>
          <div class="action-grid">
            <RouterLink to="/admin/members/new" class="action-item">
              <span class="action-icon">👤</span>
              <span class="action-label">添加成员</span>
            </RouterLink>
            <RouterLink to="/admin/projects/new" class="action-item">
              <span class="action-icon">📋</span>
              <span class="action-label">创建项目</span>
            </RouterLink>
            <RouterLink to="/admin/pilots/new" class="action-item">
              <span class="action-icon">✈</span>
              <span class="action-label">添加飞行员</span>
            </RouterLink>
            <RouterLink to="/admin/settings" class="action-item">
              <span class="action-icon">⚙</span>
              <span class="action-label">站点设置</span>
            </RouterLink>
          </div>
        </div>

        <div class="card activity-log">
          <div class="card-header">
            <h3>活动日志</h3>
          </div>
          <div class="log-list">
            <div
              v-for="(log, index) in activityLogs"
              :key="index"
              class="log-item"
            >
              <span class="log-action">{{ log.action }}</span>
              <span class="log-entity">{{ log.entity }}</span>
              <span class="log-time">{{ log.time }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from './AdminLayout.vue'
import { dataService } from '@/services'

const stats = ref([
  { icon: '👥', label: '活跃成员', value: '0', trend: 0 },
  { icon: '📋', label: '进行中项目', value: '0', trend: 0 },
  { icon: '📝', label: '待审核申请', value: '0', trend: 0 },
  { icon: '✈', label: '王牌飞行员', value: '0', trend: 0 }
])

const recentApplications = ref([])
const activityLogs = ref([])

async function loadDashboardData() {
  try {
    const [statsRes, appsRes] = await Promise.all([
      dataService.getStats(),
      dataService.getApplications({ limit: 5, status: 'pending' })
    ])

    if (statsRes.success) {
      const summary = statsRes.summary || {}
      stats.value = [
        { icon: '👥', label: '活跃成员', value: summary.activeMembers || 0, trend: 5 },
        { icon: '📋', label: '进行中项目', value: summary.activeProjects || 0, trend: 10 },
        { icon: '📝', label: '待审核申请', value: appsRes.data?.length || 0, trend: -2 },
        { icon: '✈', label: '王牌飞行员', value: summary.activePilots || 0, trend: 8 }
      ]
    }

    if (appsRes.success) {
      recentApplications.value = appsRes.data || []
    }
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function statusLabel(status) {
  const labels = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return labels[status] || status
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(15, 30, 50, 0.6);
  border: 1px solid var(--line);
  border-radius: 8px;
  animation: fadeInUp 0.5s ease both;
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(95, 169, 255, 0.1);
  border-radius: 8px;
  font-size: 1.5rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.stat-trend.up {
  color: var(--success);
}

.stat-trend.down {
  color: var(--danger);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.card {
  background: rgba(15, 30, 50, 0.6);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 1.25rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--line);
}

.card-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.view-all {
  font-size: 0.8rem;
  color: var(--accent-2);
}

.application-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.application-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: rgba(95, 169, 255, 0.05);
  border-radius: 4px;
}

.app-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.app-name {
  font-weight: 500;
}

.app-email {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.app-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.app-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.app-status {
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 600;
}

.status-pending {
  background: rgba(255, 159, 67, 0.15);
  color: var(--warning);
}

.status-approved {
  background: rgba(78, 205, 196, 0.15);
  color: var(--success);
}

.status-rejected {
  background: rgba(255, 107, 107, 0.15);
  color: var(--danger);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(95, 169, 255, 0.05);
  border: 1px solid var(--line);
  border-radius: 6px;
  transition: all var(--transition-fast);
}

.action-item:hover {
  background: rgba(95, 169, 255, 0.1);
  border-color: var(--accent);
}

.action-icon {
  font-size: 1.5rem;
}

.action-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--line);
  font-size: 0.85rem;
}

.log-item:last-child {
  border-bottom: none;
}

.log-action {
  color: var(--accent-2);
}

.log-entity {
  flex: 1;
  color: var(--text-muted);
}

.log-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 860px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
