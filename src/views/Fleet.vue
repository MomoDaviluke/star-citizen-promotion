<!--
  @file 舰队展示视图组件
  @description 展示战队拥有的所有飞船，支持筛选、搜索、查看详情
  @module views/Fleet
-->

<!-- 重复的脚本已被移除 -->

<template>
  <div class="fleet-page">
    <!-- 页面标题区域 -->
    <PageTitle
      title="舰队展示"
      subtitle="展示战队拥有的所有飞船，支持按类别筛选和搜索"
    />

    <!-- 操作栏 -->
    <div class="fleet-controls">
      <!-- 筛选器 -->
      <div class="filter-group">
        <BaseButton
          v-for="cat in categories"
          :key="cat.value"
          :variant="filter === cat.value ? 'primary' : 'outline'"
          size="sm"
          @click="setFilter(cat.value)"
        >
          {{ cat.label }}
          <BaseBadge v-if="cat.count > 0" :text="cat.count.toString()" variant="primary" size="sm" />
        </BaseButton>
      </div>

      <!-- 搜索框 -->
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索飞船..."
          class="search-input"
          @input="setSearchQuery(searchQuery)"
        />
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <!-- 舰队统计 -->
    <div class="fleet-stats grid">
      <BaseCard variant="primary" hoverable>
        <div class="stat-item">
          <span class="stat-label">舰队总数</span>
          <span class="stat-value">{{ totalShips }}</span>
        </div>
      </BaseCard>
      <BaseCard variant="success" hoverable>
        <div class="stat-item">
          <span class="stat-label">总价值</span>
          <span class="stat-value">{{ formatUEC(totalValue) }} UEC</span>
        </div>
      </BaseCard>
      <BaseCard variant="warning" hoverable>
        <div class="stat-item">
          <span class="stat-label">可部署</span>
          <span class="stat-value">{{ availableCount }}</span>
        </div>
      </BaseCard>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载舰队数据中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <BaseButton variant="primary" @click="loadData">重试</BaseButton>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredShips.length === 0" class="empty-state">
      <p>暂无飞船数据</p>
      <BaseButton v-if="isAdmin" variant="primary" @click="showAddDialog = true">
        添加飞船
      </BaseButton>
    </div>

    <!-- 飞船网格 -->
    <div v-else class="fleet-grid grid">
      <BaseCard
        v-for="ship in filteredShips"
        :key="ship.id"
        hoverable
        interactive
        show-corners
        @click="selectShip(ship)"
      >
        <template #media>
          <div class="ship-image">
            <img :src="ship.image || '/placeholder-ship.jpg'" :alt="ship.name" />
            <BaseBadge
              :variant="getStatusVariant(ship.status)"
              class="ship-status"
            >
              {{ getStatusText(ship.status) }}
            </BaseBadge>
          </div>
        </template>

        <h3 class="ship-name">{{ ship.name }}</h3>
        <p class="ship-callsign">{{ ship.callsign }}</p>

        <div class="ship-info">
          <div class="info-item">
            <span class="info-label">型号</span>
            <span class="info-value">{{ ship.ship }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">类别</span>
            <span class="info-value">{{ getCategoryText(ship.category) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">价值</span>
            <span class="info-value">{{ formatUEC(ship.value) }} UEC</span>
          </div>
        </div>

        <template #footer>
          <div class="card-actions">
            <BaseButton variant="outline" size="sm" @click.stop="viewShipDetail(ship)">
              查看详情
            </BaseButton>
            <BaseButton
              v-if="isAdmin"
              variant="primary"
              size="sm"
              @click.stop="editShip(ship)"
            >
              编辑
            </BaseButton>
          </div>
        </template>
      </BaseCard>
    </div>

    <!-- 添加/编辑弹窗 -->
    <BaseModal
      v-model="showAddDialog"
      :title="editingShip ? '编辑飞船' : '添加飞船'"
      size="lg"
    >
      <form @submit.prevent="saveShip" class="ship-form">
        <div class="form-group">
          <label>飞船名称 *</label>
          <input v-model="shipForm.name" type="text" required class="form-input" />
        </div>

        <div class="form-group">
          <label>呼号</label>
          <input v-model="shipForm.callsign" type="text" class="form-input" />
        </div>

        <div class="form-group">
          <label>飞船型号 *</label>
          <input v-model="shipForm.ship" type="text" required class="form-input" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>类别</label>
            <select v-model="shipForm.category" class="form-input">
              <option value="combat">战斗</option>
              <option value="transport">运输</option>
              <option value="explore">探索</option>
              <option value="support">支援</option>
            </select>
          </div>

          <div class="form-group">
            <label>状态</label>
            <select v-model="shipForm.status" class="form-input">
              <option value="available">可用</option>
              <option value="borrowed">出借中</option>
              <option value="inMission">任务中</option>
              <option value="maintenance">维护中</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>价值 (UEC)</label>
          <input v-model.number="shipForm.value" type="number" min="0" class="form-input" />
        </div>

        <div class="form-group">
          <label>图片URL</label>
          <input v-model="shipForm.image" type="text" class="form-input" />
        </div>

        <div class="form-group">
          <label>描述</label>
          <textarea v-model="shipForm.description" rows="3" class="form-input"></textarea>
        </div>

        <div class="form-actions">
          <BaseButton type="button" variant="outline" @click="showAddDialog = false">
            取消
          </BaseButton>
          <BaseButton type="submit" variant="primary">
            {{ editingShip ? '更新' : '添加' }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- 详情弹窗 -->
    <BaseModal
      v-model="showDetailDialog"
      :title="selectedShip?.name || '飞船详情'"
      size="lg"
    >
      <div v-if="selectedShip" class="ship-detail">
        <div class="detail-media">
          <img :src="selectedShip.image || '/placeholder-ship.jpg'" :alt="selectedShip.name" />
        </div>

        <div class="detail-info">
          <h3>{{ selectedShip.name }}</h3>
          <p class="callsign">{{ selectedShip.callsign }}</p>

          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">型号</span>
              <span class="value">{{ selectedShip.ship }}</span>
            </div>
            <div class="detail-item">
              <span class="label">类别</span>
              <span class="value">{{ getCategoryText(selectedShip.category) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">状态</span>
              <BaseBadge :variant="getStatusVariant(selectedShip.status)">
                {{ getStatusText(selectedShip.status) }}
              </BaseBadge>
            </div>
            <div class="detail-item">
              <span class="label">价值</span>
              <span class="value">{{ formatUEC(selectedShip.value) }} UEC</span>
            </div>
          </div>

          <div v-if="selectedShip.description" class="detail-description">
            <h4>描述</h4>
            <p>{{ selectedShip.description }}</p>
          </div>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
/**
 * 舰队展示视图组件
 * @description 展示战队飞船列表，支持筛选、搜索、增删改查
 */

import { ref, computed, onMounted } from 'vue'
import { useFleetStore } from '@/stores/fleet'
import { useAuthStore } from '@/stores/auth'
import PageTitle from '@/components/common/PageTitle.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const fleetStore = useFleetStore()
const authStore = useAuthStore()

// 状态
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const editingShip = ref(null)
const selectedShip = ref(null)
const searchQuery = ref('')

// 表单数据
const shipForm = ref({
  name: '',
  callsign: '',
  ship: '',
  category: 'combat',
  status: 'available',
  value: 0,
  image: '',
  description: ''
})

// 计算属性
const loading = computed(() => fleetStore.loading)
const error = computed(() => fleetStore.error)
const filter = computed(() => fleetStore.filter)
const filteredShips = computed(() => fleetStore.filteredShips)
const totalShips = computed(() => fleetStore.ships.length)
const totalValue = computed(() => fleetStore.totalValue)
const isAdmin = computed(() => authStore.isAdmin)

const availableCount = computed(() =>
  fleetStore.ships.filter(s => s.status === 'available').length
)

const categories = computed(() => [
  { label: '全部', value: 'all', count: fleetStore.ships.length },
  { label: '战斗', value: 'combat', count: fleetStore.shipCategories.combat || 0 },
  { label: '运输', value: 'transport', count: fleetStore.shipCategories.transport || 0 },
  { label: '探索', value: 'explore', count: fleetStore.shipCategories.explore || 0 },
  { label: '支援', value: 'support', count: fleetStore.shipCategories.support || 0 }
])

// 方法
async function loadData() {
  await fleetStore.fetchShips()
}

function setFilter(value) {
  fleetStore.setFilter(value)
}

function setSearchQuery(query) {
  fleetStore.setSearchQuery(query)
}

function selectShip(ship) {
  selectedShip.value = ship
  showDetailDialog.value = true
}

function viewShipDetail(ship) {
  selectedShip.value = ship
  showDetailDialog.value = true
}

function editShip(ship) {
  editingShip.value = ship.id
  shipForm.value = { ...ship }
  showAddDialog.value = true
}

function resetForm() {
  editingShip.value = null
  shipForm.value = {
    name: '',
    callsign: '',
    ship: '',
    category: 'combat',
    status: 'available',
    value: 0,
    image: '',
    description: ''
  }
}

async function saveShip() {
  try {
    if (editingShip.value) {
      await fleetStore.updateShip(editingShip.value, shipForm.value)
    } else {
      await fleetStore.addShip(shipForm.value)
    }
    showAddDialog.value = false
    resetForm()
  } catch (err) {
    console.error('保存失败:', err)
  }
}

function getStatusVariant(status) {
  const map = {
    available: 'success',
    borrowed: 'warning',
    inMission: 'primary',
    maintenance: 'danger'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    available: '可用',
    borrowed: '出借中',
    inMission: '任务中',
    maintenance: '维护中'
  }
  return map[status] || '未知'
}

function getCategoryText(category) {
  const map = {
    combat: '战斗',
    transport: '运输',
    explore: '探索',
    support: '支援'
  }
  return map[category] || '其他'
}

function formatUEC(value) {
  if (!value) return '0'
  return value.toLocaleString()
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.fleet-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* 操作栏 */
.fleet-controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  align-items: center;
  justify-content: space-between;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.search-box {
  position: relative;
  width: 300px;
}

.search-input {
  width: 100%;
  padding: 0.625rem 1rem 0.625rem 2.5rem;
  background: var(--bg-medium);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: all var(--transition-normal);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--glow-primary);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--text-sm);
}

/* 舰队统计 */
.fleet-stats {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.stat-value {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--text-primary);
}

/* 飞船网格 */
.fleet-grid {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

/* 飞船卡片 */
.ship-image {
  position: relative;
  margin: -1.5rem -1.5rem 1rem;
  overflow: hidden;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.ship-image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.ship-image:hover img {
  transform: scale(1.05);
}

.ship-status {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.ship-name {
  margin: 0 0 0.25rem;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.ship-callsign {
  margin: 0 0 1rem;
  font-size: var(--text-sm);
  color: var(--text-accent);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.ship-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: 500;
}

.card-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}

/* 加载/错误/空状态 */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-2xl);
  color: var(--text-muted);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-subtle);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  color: var(--color-danger);
}

/* 表单样式 */
.ship-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-group label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-input {
  padding: 0.625rem 1rem;
  background: var(--bg-deep);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: all var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(95, 169, 255, 0.2);
}

.form-input select,
.form-input textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-subtle);
}

/* 详情弹窗 */
.ship-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
}

.detail-media img {
  width: 100%;
  height: auto;
  border-radius: var(--radius-md);
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.detail-info h3 {
  margin: 0;
  font-size: var(--text-2xl);
  color: var(--text-primary);
}

.callsign {
  margin: 0;
  color: var(--text-accent);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.detail-item .label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-item .value {
  font-size: var(--text-base);
  color: var(--text-primary);
  font-weight: 500;
}

.detail-description h4 {
  margin: 0 0 0.5rem;
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.detail-description p {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.6;
}

/* 响应式 */
@media (max-width: 1024px) {
  .ship-detail {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .fleet-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }

  .fleet-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
