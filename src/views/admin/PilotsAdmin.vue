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

      <div v-if="editingPilot" class="modal-overlay" @click.self="closeEdit">
        <div class="modal-content">
          <div class="modal-header">
            <h3>编辑飞行员</h3>
            <button class="modal-close" @click="closeEdit">&times;</button>
          </div>
          <form @submit.prevent="saveEdit" class="edit-form">
            <div class="form-group">
              <label class="form-label">名称</label>
              <input v-model="editForm.name" type="text" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">呼号</label>
              <input v-model="editForm.callsign" type="text" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">驾驶飞船</label>
              <input v-model="editForm.ship" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">描述</label>
              <textarea v-model="editForm.description" class="form-input form-textarea" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">任务数</label>
              <input v-model.number="editForm.missions" type="number" min="0" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">击杀数</label>
              <input v-model.number="editForm.kills" type="number" min="0" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">状态</label>
              <select v-model="editForm.status" class="form-input">
                <option value="active">活跃</option>
                <option value="inactive">非活跃</option>
                <option value="kia">KIA</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn" @click="closeEdit">取消</button>
              <button type="submit" class="btn btn-primary" :disabled="isSaving">
                {{ isSaving ? '保存中...' : '保存' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { createLogger } from '../../utils/logger.js'
const logger = createLogger('PilotsAdmin')

import { ref, computed, onMounted } from 'vue'
import AdminLayout from './AdminLayout.vue'
import { dataService } from '@/services'

const pilots = ref([])
const searchQuery = ref('')
const editingPilot = ref(null)
const editForm = ref({})
const isSaving = ref(false)

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
    logger.error('加载飞行员数据失败:', error)
  }
}

function editPilot(pilot) {
  editingPilot.value = pilot
  editForm.value = {
    name: pilot.name || '',
    callsign: pilot.callsign || '',
    ship: pilot.ship || '',
    description: pilot.description || '',
    missions: pilot.missions || 0,
    kills: pilot.kills || 0,
    status: pilot.status || 'active'
  }
}

function closeEdit() {
  editingPilot.value = null
}

async function saveEdit() {
  isSaving.value = true
  try {
    const response = await dataService.updatePilot(editingPilot.value.id, editForm.value)
    if (response.success) {
      const index = pilots.value.findIndex(p => p.id === editingPilot.value.id)
      if (index !== -1) {
        pilots.value[index] = { ...pilots.value[index], ...response.data }
      }
      closeEdit()
    }
  } catch (error) {
    logger.error('保存飞行员失败:', error)
  } finally {
    isSaving.value = false
  }
}

async function deletePilot(id) {
  if (confirm('确定要删除该飞行员吗？')) {
    try {
      await dataService.deletePilot(id)
      pilots.value = pilots.value.filter(p => p.id !== id)
    } catch (error) {
      logger.error('删除飞行员失败:', error)
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
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-body);
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
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition: border-color var(--duration-fast);
}

.pilot-card:hover {
  border-color: var(--color-accent);
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
  color: var(--color-highlight);
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
  color: var(--color-highlight);
}

.pilot-specialty {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.pilot-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
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
  color: var(--color-text-dim);
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
  border-color: var(--color-status-danger);
  color: var(--color-status-danger);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-dim);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(15, 30, 50, 0.95);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.modal-close {
  background: none;
  border: none;
  color: var(--color-text-dim);
  font-size: 1.25rem;
  cursor: pointer;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.edit-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.edit-form .form-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-dim);
}

.edit-form .form-input {
  padding: 0.6rem 0.75rem;
  background: rgba(3, 8, 16, 0.6);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-body);
  font-size: 0.9rem;
}

.edit-form .form-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.edit-form .form-textarea {
  resize: vertical;
  min-height: 60px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
</style>
