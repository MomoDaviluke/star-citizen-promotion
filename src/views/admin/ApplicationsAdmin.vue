<!--
  @file 申请管理页面
  @description 管理入队申请，支持审核、拒绝等操作
  @module views/admin/ApplicationsAdmin
-->

<template>
  <AdminLayout>
    <div class="applications-admin">
      <div class="toolbar">
        <div class="filter-group">
          <select v-model="statusFilter" class="filter-select">
            <option value="">全部状态</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>
        <div class="search-group">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="搜索姓名或邮箱..."
          />
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>申请人</th>
              <th>联系方式</th>
              <th>游戏经验</th>
              <th>提交时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="app in filteredApplications" :key="app.id">
              <td>
                <div class="applicant-info">
                  <span class="applicant-name">{{ app.name }}</span>
                  <span class="applicant-discord" v-if="app.discord">
                    Discord: {{ app.discord }}
                  </span>
                </div>
              </td>
              <td>
                <a :href="`mailto:${app.email}`" class="email-link">
                  {{ app.email }}
                </a>
              </td>
              <td>
                <span class="experience-preview" :title="app.experience">
                  {{ truncate(app.experience, 30) || '未填写' }}
                </span>
              </td>
              <td>{{ formatDate(app.created_at) }}</td>
              <td>
                <span class="status-badge" :class="`status-${app.status}`">
                  {{ statusLabel(app.status) }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    class="btn btn-sm"
                    @click="viewApplication(app)"
                    title="查看详情"
                  >
                    查看
                  </button>
                  <button
                    v-if="app.status === 'pending'"
                    class="btn btn-sm btn-success"
                    @click="updateStatus(app.id, 'approved')"
                    title="通过申请"
                  >
                    通过
                  </button>
                  <button
                    v-if="app.status === 'pending'"
                    class="btn btn-sm btn-danger"
                    @click="updateStatus(app.id, 'rejected')"
                    title="拒绝申请"
                  >
                    拒绝
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredApplications.length === 0" class="empty-state">
          暂无申请记录
        </div>
      </div>

      <div class="pagination" v-if="pagination.total > pagination.limit">
        <button
          class="btn btn-sm"
          :disabled="pagination.offset === 0"
          @click="loadPage(pagination.offset - pagination.limit)"
        >
          上一页
        </button>
        <span class="page-info">
          {{ pagination.offset + 1 }} - {{ Math.min(pagination.offset + pagination.limit, pagination.total) }} / {{ pagination.total }}
        </span>
        <button
          class="btn btn-sm"
          :disabled="!pagination.hasMore"
          @click="loadPage(pagination.offset + pagination.limit)"
        >
          下一页
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="selectedApplication" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>申请详情</h3>
            <button class="modal-close" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <div class="detail-row">
              <span class="detail-label">姓名</span>
              <span class="detail-value">{{ selectedApplication.name }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">邮箱</span>
              <span class="detail-value">{{ selectedApplication.email }}</span>
            </div>
            <div class="detail-row" v-if="selectedApplication.discord">
              <span class="detail-label">Discord</span>
              <span class="detail-value">{{ selectedApplication.discord }}</span>
            </div>
            <div class="detail-row" v-if="selectedApplication.availability">
              <span class="detail-label">在线时间</span>
              <span class="detail-value">{{ availabilityLabel(selectedApplication.availability) }}</span>
            </div>
            <div class="detail-row" v-if="selectedApplication.experience">
              <span class="detail-label">游戏经验</span>
              <p class="detail-text">{{ selectedApplication.experience }}</p>
            </div>
            <div class="detail-row" v-if="selectedApplication.reason">
              <span class="detail-label">加入原因</span>
              <p class="detail-text">{{ selectedApplication.reason }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="closeModal">关闭</button>
            <template v-if="selectedApplication.status === 'pending'">
              <button
                class="btn btn-danger"
                @click="updateStatus(selectedApplication.id, 'rejected')"
              >
                拒绝
              </button>
              <button
                class="btn btn-primary"
                @click="updateStatus(selectedApplication.id, 'approved')"
              >
                通过
              </button>
            </template>
          </div>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from './AdminLayout.vue'
import { dataService } from '@/services'

const applications = ref([])
const statusFilter = ref('')
const searchQuery = ref('')
const selectedApplication = ref(null)
const pagination = ref({
  total: 0,
  limit: 20,
  offset: 0,
  hasMore: false
})

const filteredApplications = computed(() => {
  let result = applications.value

  if (statusFilter.value) {
    result = result.filter(app => app.status === statusFilter.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(app =>
      app.name.toLowerCase().includes(query) ||
      app.email.toLowerCase().includes(query)
    )
  }

  return result
})

async function loadApplications(offset = 0) {
  try {
    const response = await dataService.getApplications({
      limit: pagination.value.limit,
      offset
    })

    if (response.success) {
      applications.value = response.data
      pagination.value = response.pagination
    }
  } catch (error) {
    console.error('加载申请列表失败:', error)
  }
}

async function updateStatus(id, status) {
  try {
    const response = await dataService.updateApplicationStatus(id, status)
    if (response.success) {
      const index = applications.value.findIndex(app => app.id === id)
      if (index > -1) {
        applications.value[index] = response.data
      }
      if (selectedApplication.value?.id === id) {
        selectedApplication.value = response.data
      }
    }
  } catch (error) {
    console.error('更新状态失败:', error)
  }
}

function loadPage(offset) {
  loadApplications(offset)
}

function viewApplication(app) {
  selectedApplication.value = app
}

function closeModal() {
  selectedApplication.value = null
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function truncate(text, length) {
  if (!text) return ''
  return text.length > length ? text.slice(0, length) + '...' : text
}

function statusLabel(status) {
  const labels = { pending: '待审核', approved: '已通过', rejected: '已拒绝' }
  return labels[status] || status
}

function availabilityLabel(value) {
  const labels = {
    weekdays: '工作日晚上',
    weekends: '周末全天',
    flexible: '时间灵活',
    limited: '时间有限'
  }
  return labels[value] || value
}

onMounted(() => {
  loadApplications()
})
</script>

<style scoped>
.applications-admin {
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

.filter-group,
.search-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-select,
.search-input {
  padding: 0.5rem 0.75rem;
  background: rgba(3, 8, 16, 0.6);
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--text);
  font-size: 0.85rem;
}

.search-input {
  width: 250px;
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

.data-table td {
  font-size: 0.9rem;
}

.data-table tbody tr:hover {
  background: rgba(95, 169, 255, 0.05);
}

.applicant-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.applicant-name {
  font-weight: 500;
}

.applicant-discord {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.email-link {
  color: var(--accent-2);
}

.experience-preview {
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

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.35rem 0.6rem;
  font-size: 0.7rem;
}

.btn-success {
  background: rgba(78, 205, 196, 0.2);
  border-color: var(--success);
  color: var(--success);
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

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.page-info {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 500px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--line);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.modal-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
}

.modal-body {
  padding: 1.25rem;
}

.detail-row {
  margin-bottom: 1rem;
}

.detail-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.25rem;
}

.detail-value {
  font-size: 0.95rem;
}

.detail-text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-muted);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--line);
}
</style>
