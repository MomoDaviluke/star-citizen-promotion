<!--
  @file 成员管理页面
  @description 管理团队成员的CRUD操作
  @module views/admin/MembersAdmin
-->

<template>
  <AdminLayout>
    <div class="members-admin">
      <div class="toolbar">
        <div class="filter-group">
          <select v-model="statusFilter" class="filter-select">
            <option value="">全部状态</option>
            <option value="active">活跃</option>
            <option value="inactive">非活跃</option>
          </select>
        </div>
        <RouterLink to="/admin/members/new" class="btn btn-primary">
          添加成员
        </RouterLink>
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
              <td>
                <div class="member-info">
                  <span class="member-name">{{ member.name }}</span>
                </div>
              </td>
              <td>{{ member.role }}</td>
              <td>
                <span class="status-badge" :class="`status-${member.status}`">
                  {{ statusLabel(member.status) }}
                </span>
              </td>
              <td>{{ formatDate(member.created_at) }}</td>
              <td>
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
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from './AdminLayout.vue'
import { dataService } from '@/services'

const members = ref([])
const statusFilter = ref('')

const filteredMembers = computed(() => {
  if (!statusFilter.value) return members.value
  return members.value.filter(m => m.status === statusFilter.value)
})

async function loadMembers() {
  try {
    const response = await dataService.getMembers()
    if (response.success) {
      members.value = response.data
    }
  } catch (error) {
    console.error('加载成员数据失败:', error)
  }
}

function editMember(member) {
  console.log('编辑成员:', member)
}

async function deleteMember(id) {
  if (confirm('确定要删除该成员吗？')) {
    try {
      await dataService.deleteMember(id)
      members.value = members.value.filter(m => m.id !== id)
    } catch (error) {
      console.error('删除成员失败:', error)
    }
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function statusLabel(status) {
  const labels = { active: '活跃', inactive: '非活跃' }
  return labels[status] || status
}

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
  color: var(--success);
}

.status-inactive {
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
