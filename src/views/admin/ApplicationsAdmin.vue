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
              <td data-label="申请人">
                <div class="applicant-info">
                  <span class="applicant-name">{{ app.name }}</span>
                  <span class="applicant-discord" v-if="app.discord">
                    Discord: {{ app.discord }}
                  </span>
                </div>
              </td>
              <td data-label="联系方式">
                <a :href="`mailto:${app.email}`" class="email-link">
                  {{ app.email }}
                </a>
              </td>
              <td data-label="游戏经验">
                <span class="experience-preview" :title="app.experience">
                  {{ truncate(app.experience, 30) || '未填写' }}
                </span>
              </td>
              <td data-label="提交时间">{{ formatDate(app.created_at) }}</td>
              <td data-label="状态">
                <span class="status-badge" :class="`status-${app.status}`">
                  {{ getApplicationStatusLabel(app.status) }}
                </span>
              </td>
              <td data-label="操作">
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
              <span class="detail-value">{{ getAvailabilityLabel(selectedApplication.availability) }}</span>
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
import { createLogger } from '../../utils/logger.js'
const logger = createLogger('ApplicationsAdmin')

/**
 * 申请审核管理页面逻辑
 * @description 管理入队申请的审核流程，包括列表展示、状态筛选、搜索和审核操作
 * @summary 提供完整的申请审核工作流，支持分页、搜索和状态管理
 */

import { ref, computed, onMounted } from 'vue'
import AdminLayout from './AdminLayout.vue'
import { dataService } from '@/services'
import { getApplicationStatusLabel, getAvailabilityLabel } from '@/utils/labelMaps'

/** 申请列表数据 */
const applications = ref([])
/** 状态筛选条件：pending(待审核)、approved(已通过)、rejected(已拒绝)或空(全部) */
const statusFilter = ref('')
/** 搜索关键词 */
const searchQuery = ref('')
/** 当前选中的申请详情（用于弹窗展示） */
const selectedApplication = ref(null)
/**
 * 分页信息
 * @property {number} total - 总记录数
 * @property {number} limit - 每页条数
 * @property {number} offset - 当前偏移量
 * @property {boolean} hasMore - 是否还有更多数据
 */
const pagination = ref({
  total: 0,
  limit: 20,
  offset: 0,
  hasMore: false
})

/**
 * 筛选后的申请列表计算属性
 * @description 根据状态筛选和搜索关键词过滤申请列表
 * @returns {Array} 筛选后的申请数组
 */
const filteredApplications = computed(() => {
  let result = applications.value

  // 按状态筛选
  if (statusFilter.value) {
    result = result.filter(app => app.status === statusFilter.value)
  }

  // 按姓名或邮箱搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(app =>
      app.name.toLowerCase().includes(query) ||
      app.email.toLowerCase().includes(query)
    )
  }

  return result
})

/**
 * 加载申请列表
 * @description 从数据服务获取申请列表，支持分页
 * @param {number} offset - 分页偏移量
 * @async
 */
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
    logger.error('加载申请列表失败:', error)
  }
}

/**
 * 更新申请状态
 * @description 审核申请，更新为通过或拒绝状态
 * @param {string} id - 申请唯一标识
 * @param {string} status - 新状态：approved 或 rejected
 * @async
 */
async function updateStatus(id, status) {
  try {
    const response = await dataService.updateApplicationStatus(id, status)
    if (response.success) {
      // 更新本地列表中对应申请的状态
      const index = applications.value.findIndex(app => app.id === id)
      if (index > -1) {
        applications.value[index] = response.data
      }
      // 如果当前弹窗展示的是该申请，同步更新弹窗数据
      if (selectedApplication.value?.id === id) {
        selectedApplication.value = response.data
      }
    }
  } catch (error) {
    logger.error('更新状态失败:', error)
  }
}

/**
 * 加载指定分页页码
 * @description 根据偏移量加载对应页码的数据
 * @param {number} offset - 分页偏移量
 */
function loadPage(offset) {
  loadApplications(offset)
}

/**
 * 查看申请详情
 * @description 打开申请详情弹窗
 * @param {Object} app - 申请对象
 */
function viewApplication(app) {
  selectedApplication.value = app
}

/**
 * 关闭详情弹窗
 * @description 清空当前选中的申请，关闭弹窗
 */
function closeModal() {
  selectedApplication.value = null
}

/**
 * 格式化日期时间
 * @description 将 ISO 日期字符串格式化为中文日期时间格式
 * @param {string} dateStr - ISO 格式日期字符串
 * @returns {string} 格式化后的中文日期时间
 */
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

/**
 * 截断文本
 * @description 将长文本截断为指定长度并添加省略号
 * @param {string} text - 原始文本
 * @param {number} length - 最大长度
 * @returns {string} 截断后的文本
 */
function truncate(text, length) {
  if (!text) return ''
  return text.length > length ? text.slice(0, length) + '...' : text
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

/*
 * 移动端表格卡片化（≤768px）
 * 将 6 列表格转为卡片，避免 375px 屏横向溢出
 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .filter-group,
  .search-group {
    width: 100%;
  }

  .filter-select,
  .search-input {
    width: 100%;
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
    border: 1px solid var(--line);
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
    color: var(--text-muted);
  }

  .data-table td:first-child {
    border-bottom: 1px solid var(--line);
    background: rgba(95, 169, 255, 0.05);
  }

  .action-buttons {
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .action-buttons .btn-sm {
    padding: 0.5rem 0.75rem;
    min-height: 44px;
    font-size: 0.8rem;
  }

  .pagination {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .pagination .btn-sm {
    min-height: 44px;
    padding: 0.5rem 1rem;
  }

  .modal-content {
    width: 95%;
  }

  .modal-footer {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }

  .modal-footer .btn {
    width: 100%;
    min-height: 44px;
  }
}
</style>
