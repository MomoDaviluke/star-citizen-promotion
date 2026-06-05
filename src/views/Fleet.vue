<!--
  @file 舰队展示视图组件 - Stellar Nexus 星渊枢纽风格
  @description 展示战队拥有的所有飞船，采用Stellar Nexus视觉系统
  @module views/Fleet
  @version 3.0 - Stellar Nexus视觉系统
-->

<template>
  <div class="fleet-page">
    <!-- 星云背景装饰 -->
    <div class="page-nebulae">
      <div class="nebula-blob nebula-blob--purple"></div>
      <div class="nebula-blob nebula-blob--cyan"></div>
    </div>

    <!-- 页面标题区域 -->
    <PageHeader
      backgroundImage="/images/sc/sc-fleet.jpg"
      title="舰队展示"
      subtitle="战队飞船资产清单与部署状态监控"
      systemId="SYS.FLEET // V.3.0"
    />

    <!-- 操作栏 -->
    <div class="fleet-controls">
      <!-- 筛选器 -->
      <div class="filter-group">
        <TechButton
          v-for="cat in categories"
          :key="cat.value"
          :variant="filter === cat.value ? 'primary' : 'outline'"
          size="sm"
          @click="setFilter(cat.value)"
        >
          {{ cat.label }}
          <span v-if="cat.count > 0" class="filter-count font-data">{{ cat.count }}</span>
        </TechButton>
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
        <span class="search-icon">◈</span>
      </div>
    </div>

    <!-- 舰队统计 - MFD面板 -->
    <div class="fleet-stats" v-scroll-reveal="{ animation: 'fadeUp', delay: 0.1 }">
      <MFDPanel
        v-for="(stat, index) in fleetStats"
        :key="stat.label"
        :variant="index === 0 ? 'primary' : 'secondary'"
        :title="stat.label.toUpperCase()"
        :subtitle="'METRIC-' + (index + 1)"
        icon="◈"
        :status="'LIVE'"
        statusType="online"
        class="stat-panel"
      >
        <div class="stat-content">
          <span class="stat-value font-data">{{ stat.value }}</span>
          <span class="stat-unit font-data">{{ stat.unit }}</span>
        </div>
      </MFDPanel>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="font-data">加载舰队数据中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <TechButton variant="primary" @click="loadData">重试</TechButton>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredShips.length === 0" class="empty-state">
      <p>暂无飞船数据</p>
      <TechButton v-if="isAdmin" variant="primary" @click="showAddDialog = true">
        添加飞船
      </TechButton>
    </div>

    <!-- 飞船网格 - ShipCard 风格 + 筛选动画过渡 -->
    <TransitionGroup
      v-else
      name="fleet-shuffle"
      tag="div"
      class="fleet-grid"
      v-scroll-reveal="{ animation: 'fadeUp', delay: 0.15 }"
    >
      <ShipCard
        v-for="ship in filteredShips"
        :key="ship.id"
        :ship="{
          ...ship,
          category: ship.category || 'combat'
        }"
        :showStats="true"
        class="fleet-ship-card"
        @click="selectShip(ship)"
      />
    </TransitionGroup>

    <!-- 添加/编辑弹窗 -->
    <BaseModal
      v-model="showAddDialog"
      :title="editingShip ? '编辑飞船' : '添加飞船'"
      size="lg"
    >
      <form @submit.prevent="saveShip" class="ship-form">
        <div class="form-group">
          <label class="font-data">飞船名称 *</label>
          <input v-model="shipForm.name" type="text" required class="form-input" />
        </div>

        <div class="form-group">
          <label class="font-data">呼号</label>
          <input v-model="shipForm.callsign" type="text" class="form-input" />
        </div>

        <div class="form-group">
          <label class="font-data">飞船型号 *</label>
          <input v-model="shipForm.ship" type="text" required class="form-input" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="font-data">类别</label>
            <select v-model="shipForm.category" class="form-input">
              <option value="combat">战斗</option>
              <option value="transport">运输</option>
              <option value="explore">探索</option>
              <option value="support">支援</option>
            </select>
          </div>

          <div class="form-group">
            <label class="font-data">状态</label>
            <select v-model="shipForm.status" class="form-input">
              <option value="available">可用</option>
              <option value="borrowed">出借中</option>
              <option value="inMission">任务中</option>
              <option value="maintenance">维护中</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="font-data">价值 (UEC)</label>
          <input v-model.number="shipForm.value" type="number" min="0" class="form-input" />
        </div>

        <div class="form-group">
          <label class="font-data">图片URL</label>
          <input v-model="shipForm.image" type="text" class="form-input" />
        </div>

        <div class="form-group">
          <label class="font-data">描述</label>
          <textarea v-model="shipForm.description" rows="3" class="form-input"></textarea>
        </div>

        <div class="form-actions">
          <TechButton type="button" variant="outline" @click="showAddDialog = false">
            取消
          </TechButton>
          <TechButton type="submit" variant="primary">
            {{ editingShip ? '更新' : '添加' }}
          </TechButton>
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
          <h3 class="font-tech">{{ selectedShip.name }}</h3>
          <p class="callsign font-data">{{ selectedShip.callsign }}</p>

          <div class="detail-grid">
            <div class="detail-item">
              <span class="label font-data">MODEL</span>
              <span class="value">{{ selectedShip.ship }}</span>
            </div>
            <div class="detail-item">
              <span class="label font-data">CLASS</span>
              <span class="value">{{ getCategoryText(selectedShip.category) }}</span>
            </div>
            <div class="detail-item">
              <span class="label font-data">STATUS</span>
              <StatusIndicator
                :type="getStatusType(selectedShip.status)"
                :label="getStatusText(selectedShip.status)"
                size="small"
              />
            </div>
            <div class="detail-item">
              <span class="label font-data">VALUE</span>
              <span class="value font-data">{{ formatUEC(selectedShip.value) }} UEC</span>
            </div>
          </div>

          <div v-if="selectedShip.description" class="detail-description">
            <h4 class="font-data">DESCRIPTION</h4>
            <p>{{ selectedShip.description }}</p>
          </div>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
/**
 * 舰队展示视图组件 - MFD军事终端风格
 * @description 展示战队飞船列表，支持筛选、搜索、增删改查
 * @version 2.0 - Starship Ark视觉系统
 */

import { ref, computed, onMounted } from 'vue'
import { useFleetStore } from '@/stores/fleet'
import { useAuthStore } from '@/stores/auth'
import { createLogger } from '../utils/logger.js'
import MFDPanel from '@/components/ui/MFDPanel.vue'
import TechButton from '@/components/ui/TechButton.vue'
import StatusIndicator from '@/components/ui/StatusIndicator.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ShipCard from '@/components/ui/ShipCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'

const logger = createLogger('Fleet')

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

const fleetStats = computed(() => [
  { label: '舰队总数', value: totalShips.value.toString(), unit: 'SHIPS' },
  { label: '总价值', value: formatUEC(totalValue.value), unit: 'UEC' },
  { label: '可部署', value: availableCount.value.toString(), unit: 'READY' }
])

const categories = computed(() => [
  { label: '全部', value: 'all', count: fleetStore.ships.length },
  { label: '战斗', value: 'combat', count: fleetStore.shipCategories.combat || 0 },
  { label: '运输', value: 'transport', count: fleetStore.shipCategories.transport || 0 },
  { label: '探索', value: 'explore', count: fleetStore.shipCategories.explore || 0 },
  { label: '支援', value: 'support', count: fleetStore.shipCategories.support || 0 }
])

/**
 * 加载舰队数据
 * @description 调用 store 获取飞船列表，错误由 store 内部捕获并设置到 error 状态
 *              此处仅做静默兜底，防止异步错误冒泡到 ErrorBoundary 组件
 */
async function loadData() {
  try {
    await fleetStore.fetchShips()
  } catch {
    // store 已将错误信息写入 fleetStore.error，页面模板自动展示错误状态
    // 此处不重新抛出，避免触发上层 ErrorBoundary 导致整页白屏
  }
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
    logger.error('保存失败:', err)
  }
}

function getStatusType(status) {
  const map = {
    available: 'online',
    borrowed: 'warning',
    inMission: 'primary',
    maintenance: 'offline'
  }
  return map[status] || 'info'
}

function getShipVariant(status) {
  const map = {
    available: 'primary',
    borrowed: 'secondary',
    inMission: 'primary',
    maintenance: 'secondary'
  }
  return map[status] || 'secondary'
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
/* ========== 页面容器 ========== */
.fleet-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  position: relative;
}

/* 星云背景装饰 */
.page-nebulae {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.nebula-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  animation: nebula-drift 20s ease-in-out infinite;
}

.nebula-blob--purple {
  width: 50vw;
  height: 50vw;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.08), transparent 70%);
  top: -10%;
  right: -10%;
}

.nebula-blob--cyan {
  width: 40vw;
  height: 40vw;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.06), transparent 70%);
  bottom: 10%;
  left: -10%;
  animation-delay: -7s;
}

/* ========== 页面标题区域 ========== */
.page-header-mfd {
  position: relative;
  padding: 2rem;
  margin: -2rem -1.5rem 3rem;
  background: linear-gradient(135deg, rgba(12, 20, 36, 0.95), rgba(6, 11, 20, 0.98));
  border: 1px solid var(--nebula-purple);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.page-header-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.page-header-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.15;
  filter: saturate(0.5) brightness(0.4);
  mix-blend-mode: screen;
}

.page-header-bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(12, 20, 36, 0.9), rgba(6, 11, 20, 0.95));
}

.page-header-mfd::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--nebula-purple), transparent);
  animation: scanLineHorizontal 3s linear infinite;
  z-index: 1;
}

.page-header-content {
  position: relative;
  z-index: 1;
}

.page-id {
  display: block;
  color: var(--nebula-purple);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  margin-bottom: 0.5rem;
}

.page-title {
  margin: 0 0 0.5rem;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-primary);
}

.page-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.6;
}

.page-header-decoration {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-line {
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, var(--nebula-purple), transparent);
}

/* ========== 操作栏 ========== */
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

.filter-count {
  margin-left: 0.25rem;
  padding: 0.1rem 0.4rem;
  background: rgba(124, 58, 237, 0.2);
  border-radius: 2px;
  font-size: 0.65rem;
  color: var(--nebula-violet);
}

.search-box {
  position: relative;
  width: 300px;
}

.search-input {
  width: 100%;
  padding: 0.625rem 1rem 0.625rem 2.5rem;
  background: rgba(10, 20, 35, 0.8);
  border: 1px solid var(--nebula-purple);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  transition: all var(--transition-normal);
}

.search-input:focus {
  outline: none;
  border-color: var(--nebula-violet);
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: var(--nebula-purple);
}

/* ========== 舰队统计 ========== */
.fleet-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-panel {
  transition: transform 0.3s ease;
}

.stat-panel:hover {
  transform: translateY(-4px);
}

.stat-content {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 1rem 0;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.02em;
  line-height: 1;
}

.stat-unit {
  font-size: 0.75rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

/* ========== 飞船网格 ========== */
.fleet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.fleet-ship-card {
  height: 100%;
}

/* ===== 筛选动画过渡 ===== */
.fleet-shuffle-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.fleet-shuffle-leave-active {
  transition: all 0.3s cubic-bezier(0.7, 0, 0.84, 0);
  position: absolute;
}

.fleet-shuffle-enter-from {
  opacity: 0;
  transform: scale(0.85) translateY(20px);
  filter: brightness(1.5) blur(4px);
}

.fleet-shuffle-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-10px);
  filter: brightness(0.5) blur(2px);
}

.fleet-shuffle-move {
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ========== 加载/错误/空状态 ========== */
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
  border-top-color: var(--nebula-violet);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  color: var(--danger);
}

/* ========== 表单样式 ========== */
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
  background: rgba(10, 20, 35, 0.8);
  border: 1px solid var(--nebula-purple);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  transition: all var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--nebula-violet);
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
}

.form-input::placeholder {
  color: var(--text-muted);
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

/* ========== 详情弹窗 — 全息投影风格 ========== */
.ship-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
  position: relative;
}

.ship-detail::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(6, 182, 212, 0.03) 2px,
      rgba(6, 182, 212, 0.03) 4px
    );
  pointer-events: none;
  z-index: 1;
}

.detail-media {
  position: relative;
  overflow: hidden;
}

.detail-media::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(to top, rgba(6, 11, 20, 0.8), transparent);
  pointer-events: none;
}

.detail-media img {
  width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  filter: saturate(0.7) brightness(0.85);
  transition: filter 0.3s ease;
}

.detail-media:hover img {
  filter: saturate(1) brightness(1);
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
  color: var(--nebula-violet);
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

/* ========== 动画 ========== */
@keyframes scanLineHorizontal {
  0% {
    opacity: 0;
    transform: translateX(-100%);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(100%);
  }
}

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
  .ship-detail {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-header-mfd {
    margin: -1rem -1rem 2rem;
    padding: 1.5rem;
  }

  .page-header-decoration {
    display: none;
  }

  .fleet-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }

  .fleet-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .fleet-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .fleet-stats {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 2rem;
  }
}
</style>
