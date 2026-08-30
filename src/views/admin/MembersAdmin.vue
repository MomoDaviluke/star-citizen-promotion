<!--
  @file 成员管理页面
  @description 管理团队成员的CRUD操作
  @module views/admin/MembersAdmin
-->

<template>
  <div class="members-admin">
    <div class="toolbar">
      <div class="filter-group">
        <select v-model="statusFilter" class="filter-select">
          <option value="">全部状态</option>
          <option value="active">活跃</option>
          <option value="inactive">非活跃</option>
        </select>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">添加成员</button>
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>成员</th>
            <th>角色</th>
            <th>状态</th>
            <th>加入时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in filteredMembers" :key="member.id">
            <td data-label="成员">
              <div class="member-info">
                <span class="member-name">{{ member.name }}</span>
              </div>
            </td>
            <td data-label="角色">{{ member.role }}</td>
            <td data-label="状态">
              <span class="status-badge" :class="`status-${member.status}`">
                {{ getMemberStatusLabel(member.status) }}
              </span>
            </td>
            <td data-label="加入时间">{{ formatDate(member.created_at) }}</td>
            <td data-label="操作">
              <div class="action-buttons">
                <button class="btn btn-sm" @click="editMember(member)">编辑</button>
                <button class="btn btn-sm btn-danger" @click="deleteMember(member.id)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredMembers.length === 0" class="empty-state">
        暂无成员数据
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ modalMode === 'edit' ? '编辑成员' : '添加成员' }}</h3>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="saveForm" class="edit-form">
          <div class="form-group">
            <label class="form-label">姓名</label>
            <input v-model="editForm.name" name="name" type="text" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">角色</label>
            <input v-model="editForm.role" name="role" type="text" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">简介</label>
            <textarea v-model="editForm.intro" class="form-input form-textarea" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">头像地址</label>
            <input v-model="editForm.avatar" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">状态</label>
            <select v-model="editForm.status" name="status" class="form-input">
              <option value="active">活跃</option>
              <option value="inactive">非活跃</option>
              <option value="retired">已退役</option>
            </select>
          </div>
          <p v-if="formError" class="form-error">{{ formError }}</p>
          <div class="modal-actions">
            <button type="button" class="btn" @click="closeModal">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="isSaving">
              {{ isSaving ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { createLogger } from '../../utils/logger.js'
const logger = createLogger('MembersAdmin')

/**
 * 成员管理页面逻辑
 * @description 管理团队成员的 CRUD 操作，包括列表展示、状态筛选、编辑和删除
 * @summary 提供完整的成员管理功能，支持按状态筛选和批量操作
 */

import { ref, computed, onMounted } from 'vue'
import { dataService } from '@/services'
import { getMemberStatusLabel } from '@/utils/labelMaps'

/** 成员列表数据 */
const members = ref([])
/** 状态筛选条件：active(活跃)、inactive(非活跃)或空(全部) */
const statusFilter = ref('')
/** 弹窗显隐 */
const showModal = ref(false)
/** 弹窗模式：create(添加) | edit(编辑) */
const modalMode = ref('create')
/** 正在编辑的成员 ID */
const editingId = ref(null)
/** 编辑表单数据 */
const editForm = ref({ name: '', role: '', intro: '', avatar: '', status: 'active' })
/** 表单提交中标志 */
const isSaving = ref(false)
/** 表单错误信息 */
const formError = ref('')

/**
 * 筛选后的成员列表计算属性
 * @description 根据状态筛选条件过滤成员列表
 * @returns {Array} 筛选后的成员数组
 */
const filteredMembers = computed(() => {
  if (!statusFilter.value) return members.value
  return members.value.filter(m => m.status === statusFilter.value)
})

/**
 * 加载成员数据
 * @description 从数据服务获取所有成员列表
 * @async
 */
async function loadMembers() {
  try {
    const response = await dataService.getMembers()
    if (response.success) {
      members.value = response.data
    }
  } catch (error) {
    logger.error('加载成员数据失败:', error)
  }
}

/**
 * 打开新增成员弹窗
 * @description 清空表单并切换到 create 模式
 */
function openCreateModal() {
  modalMode.value = 'create'
  editingId.value = null
  editForm.value = { name: '', role: '', intro: '', avatar: '', status: 'active' }
  formError.value = ''
  showModal.value = true
}

/**
 * 编辑成员
 * @description 打开成员编辑弹窗并回填表单
 * @param {Object} member - 成员对象
 */
function editMember(member) {
  modalMode.value = 'edit'
  editingId.value = member.id
  editForm.value = {
    name: member.name || '',
    role: member.role || '',
    intro: member.intro || '',
    avatar: member.avatar || '',
    status: member.status || 'active'
  }
  formError.value = ''
  showModal.value = true
}

/**
 * 关闭弹窗
 */
function closeModal() {
  showModal.value = false
  formError.value = ''
}

/**
 * 保存表单
 * @description 按弹窗模式调用创建或更新接口，成功后关闭弹窗并刷新列表
 * @async
 */
async function saveForm() {
  isSaving.value = true
  formError.value = ''
  try {
    const payload = { ...editForm.value }
    const response =
      modalMode.value === 'edit'
        ? await dataService.updateMember(editingId.value, payload)
        : await dataService.createMember(payload)
    if (response.success) {
      closeModal()
      await loadMembers()
    } else {
      formError.value = response.error || '保存失败'
    }
  } catch (error) {
    formError.value = error.message || '保存失败，请稍后重试'
    logger.error('保存成员失败:', error)
  } finally {
    isSaving.value = false
  }
}

/**
 * 删除成员
 * @description 确认后删除指定成员，并更新本地列表
 * @param {string} id - 成员唯一标识
 * @async
 */
async function deleteMember(id) {
  if (confirm('确定要删除该成员吗？')) {
    try {
      await dataService.deleteMember(id)
      members.value = members.value.filter(m => m.id !== id)
    } catch (error) {
      logger.error('删除成员失败:', error)
    }
  }
}

/**
 * 格式化日期
 * @description 将 ISO 日期字符串格式化为中文日期格式
 * @param {string} dateStr - ISO 格式日期字符串
 * @returns {string} 格式化后的中文日期
 */
function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

/** 组件挂载时加载成员数据 */
onMounted(() => {
  loadMembers()
})
</script>

<style scoped>
.members-admin {
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
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-body);
  font-size: 0.85rem;
}

.table-container {
  background: rgba(15, 30, 50, 0.6);
  border: 1px solid var(--color-border);
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
  border-bottom: 1px solid var(--color-border);
}

.data-table th {
  background: rgba(95, 169, 255, 0.08);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-dim);
}

.member-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.member-name {
  font-weight: 500;
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
  color: var(--color-status-online);
}

.status-inactive {
  background: rgba(255, 107, 107, 0.15);
  color: var(--color-status-danger);
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

.form-error {
  color: var(--color-status-danger);
  font-size: 0.8rem;
  margin: 0;
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

/*
 * 移动端表格卡片化（≤768px）
 * 将行转为卡片，每个 td 显示为带 label 的块
 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .filter-select {
    width: 100%;
  }

  .btn-primary,
  .btn {
    width: 100%;
    text-align: center;
  }

  .table-container {
    border-radius: 8px;
  }

  .data-table thead {
    display: none;
  }

  .data-table,
  .data-table tbody,
  .data-table tr,
  .data-table td {
    display: block;
    width: 100%;
  }

  .data-table tr {
    margin-bottom: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: rgba(15, 30, 50, 0.4);
  }

  .data-table td {
    padding: 0.625rem 0.875rem;
    border-bottom: 1px solid rgba(95, 169, 255, 0.08);
    text-align: right;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1rem;
  }

  .data-table td::before {
    content: attr(data-label);
    margin-right: auto;
    font-weight: 600;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-dim);
  }

  .data-table td:first-child {
    border-bottom: 1px solid var(--color-border);
    background: rgba(95, 169, 255, 0.05);
  }

  /* 操作按钮区在卡片中保持左对齐 */
  .data-table td:last-child {
    justify-content: flex-end;
  }

  .action-buttons {
    gap: 0.5rem;
  }

  .action-buttons .btn-sm {
    flex: 1;
    padding: 0.5rem 0.75rem;
    min-height: 44px;
    font-size: 0.8rem;
  }
}
</style>
