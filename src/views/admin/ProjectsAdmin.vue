<!--
  @file 项目管理页面
  @description 管理活动项目的CRUD操作
  @module views/admin/ProjectsAdmin
-->

<template>
  <AdminLayout>
    <div class="projects-admin">
      <div class="toolbar">
        <div class="filter-group">
          <select v-model="statusFilter" class="filter-select">
            <option value="">全部状态</option>
            <option value="active">进行中</option>
            <option value="completed">已完成</option>
            <option value="paused">已暂停</option>
          </select>
        </div>
        <RouterLink to="/admin/projects/new" class="btn btn-primary">
          创建项目
        </RouterLink>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>项目名称</th>
              <th>描述</th>
              <th>状态</th>
              <th>进度</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in filteredProjects" :key="project.id">
              <td class="project-name">{{ project.name }}</td>
              <td class="project-desc">{{ truncate(project.description, 50) }}</td>
              <td>
                <span class="status-badge" :class="`status-${project.status}`">
                  {{ statusLabel(project.status) }}
                </span>
              </td>
              <td>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: `${project.progress || 0}%` }"></div>
                  <span class="progress-text">{{ project.progress || 0 }}%</span>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-sm" @click="editProject(project)">编辑</button>
                  <button class="btn btn-sm btn-danger" @click="deleteProject(project.id)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredProjects.length === 0" class="empty-state">
          暂无项目数据
        </div>
      </div>

      <div v-if="editingProject" class="modal-overlay" @click.self="closeEdit">
        <div class="modal-content">
          <div class="modal-header">
            <h3>编辑项目</h3>
            <button class="modal-close" @click="closeEdit">&times;</button>
          </div>
          <form @submit.prevent="saveEdit" class="edit-form">
            <div class="form-group">
              <label class="form-label">项目名称</label>
              <input v-model="editForm.name" type="text" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">周期</label>
              <input v-model="editForm.period" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">描述</label>
              <textarea v-model="editForm.description" class="form-input form-textarea" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">状态</label>
              <select v-model="editForm.status" class="form-input">
                <option value="planning">规划中</option>
                <option value="active">进行中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">进度 (%)</label>
              <input v-model.number="editForm.progress" type="number" min="0" max="100" class="form-input" />
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
const logger = createLogger('ProjectsAdmin')

import { ref, computed, onMounted } from 'vue'
import AdminLayout from './AdminLayout.vue'
import { dataService } from '@/services'

const projects = ref([])
const statusFilter = ref('')
const editingProject = ref(null)
const editForm = ref({ name: '', period: '', description: '', status: 'active', progress: 0 })
const isSaving = ref(false)

const filteredProjects = computed(() => {
  if (!statusFilter.value) return projects.value
  return projects.value.filter(p => p.status === statusFilter.value)
})

async function loadProjects() {
  try {
    const response = await dataService.getProjects()
    if (response.success) {
      projects.value = response.data
    }
  } catch (error) {
    logger.error('加载项目数据失败:', error)
  }
}

function editProject(project) {
  editingProject.value = project
  editForm.value = {
    name: project.name || '',
    period: project.period || '',
    description: project.description || '',
    status: project.status || 'active',
    progress: project.progress || 0
  }
}

function closeEdit() {
  editingProject.value = null
}

async function saveEdit() {
  isSaving.value = true
  try {
    const response = await dataService.updateProject(editingProject.value.id, editForm.value)
    if (response.success) {
      const index = projects.value.findIndex(p => p.id === editingProject.value.id)
      if (index !== -1) {
        projects.value[index] = { ...projects.value[index], ...response.data }
      }
      closeEdit()
    }
  } catch (error) {
    logger.error('保存项目失败:', error)
  } finally {
    isSaving.value = false
  }
}

async function deleteProject(id) {
  if (confirm('确定要删除该项目吗？')) {
    try {
      await dataService.deleteProject(id)
      projects.value = projects.value.filter(p => p.id !== id)
    } catch (error) {
      logger.error('删除项目失败:', error)
    }
  }
}

function truncate(text, length) {
  if (!text) return ''
  return text.length > length ? text.slice(0, length) + '...' : text
}

function statusLabel(status) {
  const labels = { active: '进行中', completed: '已完成', paused: '已暂停' }
  return labels[status] || status
}

onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
.projects-admin {
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

.filter-select {
  padding: 0.5rem 0.75rem;
  background: rgba(3, 8, 16, 0.6);
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--text);
  font-size: 0.85rem;
}

.table-container {
  background: rgba(15, 30, 50, 0.6);
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--line);
}

.data-table th {
  background: rgba(95, 169, 255, 0.08);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.project-name {
  font-weight: 500;
}

.project-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 600;
}

.status-active {
  background: rgba(78, 205, 196, 0.15);
  color: var(--success);
}

.status-completed {
  background: rgba(95, 169, 255, 0.15);
  color: var(--accent-2);
}

.status-paused {
  background: rgba(255, 159, 67, 0.15);
  color: var(--warning);
}

.progress-bar {
  position: relative;
  width: 100px;
  height: 8px;
  background: rgba(95, 169, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.65rem;
  color: var(--text-muted);
}

.action-buttons {
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
  border: 1px solid var(--line);
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
  color: var(--text-muted);
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
  color: var(--text-muted);
}

.edit-form .form-input {
  padding: 0.6rem 0.75rem;
  background: rgba(3, 8, 16, 0.6);
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--text);
  font-size: 0.9rem;
}

.edit-form .form-input:focus {
  outline: none;
  border-color: var(--accent);
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
