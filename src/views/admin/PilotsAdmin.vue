<!--
  @file 飞行员管理页面
  @description 管理王牌飞行员的CRUD操作
  @module views/admin/PilotsAdmin
-->

<template>
  <AdminLayout>
    <div class="pilots-admin">
      <div class="toolbar">
        <div class="search-group">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="搜索飞行员..."
          />
        </div>
        <RouterLink to="/admin/pilots/new" class="btn btn-primary">
          添加飞行员
        </RouterLink>
      </div>

      <div class="pilots-grid">
        <div
          v-for="pilot in filteredPilots"
          :key="pilot.id"
          class="pilot-card"
        >
          <div class="pilot-avatar">
            <span class="avatar-placeholder">{{ pilot.name?.charAt(0) || '?' }}</span>
          </div>
          <div class="pilot-info">
            <h4 class="pilot-name">{{ pilot.name }}</h4>
            <p class="pilot-callsign">{{ pilot.callsign }}</p>
            <p class="pilot-specialty">{{ pilot.specialty || '通用飞行员' }}</p>
          </div>
          <div class="pilot-stats">
            <div class="stat">
              <span class="stat-value">{{ pilot.missions || 0 }}</span>
              <span class="stat-label">任务</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ pilot.hours || 0 }}</span>
              <span class="stat-label">小时</span>
            </div>
          </div>
          <div class="pilot-actions">
            <button class="btn btn-sm" @click="editPilot(pilot)">编辑</button>
            <button class="btn btn-sm btn-danger" @click="deletePilot(pilot.id)">删除</button>
          </div>
        </div>
      </div>

      <div v-if="filteredPilots.length === 0" class="empty-state">
        暂无飞行员数据
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from './AdminLayout.vue'
import { dataService } from '@/services'

const pilots = ref([])
const searchQuery = ref('')

const filteredPilots = computed(() => {
  if (!searchQuery.value) return pilots.value
  const query = searchQuery.value.toLowerCase()
  return pilots.value.filter(p =>
    p.name?.toLowerCase().includes(query) ||
    p.callsign?.toLowerCase().includes(query)
  )
})

async function loadPilots() {
  try {
    const response = await dataService.getPilots()
    if (response.success) {
      pilots.value = response.data
    }
  } catch (error) {
    console.error('加载飞行员数据失败:', error)
  }
}

function editPilot(pilot) {
  console.log('编辑飞行员:', pilot)
}

async function deletePilot(id) {
  if (confirm('确定要删除该飞行员吗？')) {
    try {
      await dataService.deletePilot(id)
      pilots.value = pilots.value.filter(p => p.id !== id)
    } catch (error) {
      console.error('删除飞行员失败:', error)
    }
  }
}

onMounted(() => {
  loadPilots()
})
</script>

<style scoped>
.pilots-admin {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.search-input {
  padding: 0.5rem 0.75rem;
  background: rgba(3, 8, 16, 0.6);
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--text);
  font-size: 0.85rem;
  width: 250px;
}

.pilots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.pilot-card {
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  background: rgba(15, 30, 50, 0.6);
  border: 1px solid var(--line);
  border-radius: 8px;
  transition: border-color var(--transition-fast);
}

.pilot-card:hover {
  border-color: var(--accent);
}

.pilot-avatar {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
  background: rgba(95, 169, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-placeholder {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--accent-2);
}

.pilot-info {
  margin-bottom: 1rem;
}

.pilot-name {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.pilot-callsign {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
  color: var(--accent-2);
}

.pilot-specialty {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.pilot-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.pilot-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.35rem 0.6rem;
  font-size: 0.7rem;
}

.btn-danger {
  background: rgba(255, 107, 107, 0.2);
  border-color: var(--danger);
  color: var(--danger);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
}
</style>
