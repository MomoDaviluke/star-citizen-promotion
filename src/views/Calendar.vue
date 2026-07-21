<!--
  @file 活动日历视图组件 - Stellar Nexus 星渊枢纽风格
  @description 展示战队活动日历，采用Stellar Nexus视觉系统
  @module views/Calendar
  @version 3.0 - Stellar Nexus视觉系统
-->

<template>
  <div class="calendar-page">
    <!-- 星云背景装饰 -->
    <div class="page-nebulae">
      <div class="nebula-blob nebula-blob--purple"></div>
      <div class="nebula-blob nebula-blob--cyan"></div>
    </div>

    <!-- MFD风格页面标题 -->
    <PageHeader
      backgroundImage="/images/sc/sc-calendar.jpg"
      title="活动日历"
      subtitle="查看和报名参加战队战术行动与训练任务"
      systemId="SYS.CALENDAR // V.3.0"
    />

    <!-- 控制栏 - MFD风格 -->
    <MFDPanel
      variant="primary"
      title="NAVIGATION"
      subtitle="CALENDAR CONTROLS"
      icon="◈"
      status="ACTIVE"
      statusType="online"
      class="controls-mfd-panel"
    >
      <div class="calendar-controls">
        <div class="nav-group">
          <TechButton variant="outline" size="sm" @click="goPrev">
            ← 上一{{ viewMode === 'month' ? '月' : '阶段' }}
          </TechButton>
          <TechButton variant="primary" size="sm" @click="goToday">
            今天
          </TechButton>
          <TechButton variant="outline" size="sm" @click="goNext">
            下一{{ viewMode === 'month' ? '月' : '阶段' }} →
          </TechButton>
          <span class="current-date font-data">{{ formattedDate }}</span>
        </div>

        <div class="view-group">
          <TechButton
            v-for="mode in viewModes"
            :key="mode.value"
            :variant="viewMode === mode.value ? 'primary' : 'outline'"
            size="sm"
            @click="setViewMode(mode.value)"
          >
            {{ mode.label }}
          </TechButton>
          <TechButton v-if="isAdmin" variant="accent" size="sm" @click="showAddDialog = true">
            + 创建任务
          </TechButton>
        </div>
      </div>
    </MFDPanel>

    <!-- 加载状态 -->
    <MFDPanel
      v-if="loading"
      variant="primary"
      title="LOADING"
      subtitle="RETRIEVING DATA"
      icon="◈"
      status="PROCESSING"
      statusType="warning"
      :scanlines="true"
      class="loading-mfd-panel"
    >
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-text">正在从战术网络获取任务数据...</p>
      </div>
    </MFDPanel>

    <!-- 错误状态 -->
    <MFDPanel
      v-else-if="error"
      variant="alert"
      title="ERROR"
      subtitle="DATA RETRIEVAL FAILED"
      icon="◈"
      status="FAILED"
      statusType="danger"
      class="error-mfd-panel"
    >
      <div class="error-content">
        <p class="error-message">{{ error }}</p>
        <TechButton variant="primary" @click="loadData">重试</TechButton>
      </div>
    </MFDPanel>

    <!-- 月历视图 -->
    <div v-else-if="viewMode === 'month'" class="month-view">
      <MFDPanel
        variant="primary"
        title="MONTHLY OVERVIEW"
        :subtitle="formattedDate.toUpperCase()"
        icon="◈"
        status="ACTIVE"
        statusType="online"
        class="month-mfd-panel"
      >
        <div class="month-header">
          <div v-for="day in weekDays" :key="day" class="week-day font-data">{{ day }}</div>
        </div>
        <div class="month-grid">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="day-cell"
            :class="{ 'other-month': !day.isCurrentMonth, 'has-events': day.events.length > 0, 'is-today': day.isToday }"
          >
            <span class="day-number font-data">{{ day.date.getDate() }}</span>
            <div class="day-events">
              <div
                v-for="event in day.events.slice(0, 3)"
                :key="event.id"
                class="event-dot"
                :class="`event-${event.status || 'upcoming'}`"
                @click="selectEvent(event)"
              >
                {{ event.title }}
              </div>
              <span v-if="day.events.length > 3" class="more-events font-data">+{{ day.events.length - 3 }} 更多</span>
            </div>
          </div>
        </div>
      </MFDPanel>
    </div>

    <!-- 列表视图 -->
    <div v-else class="list-view">
      <div class="section-header-mfd" v-scroll-reveal="'fadeUp'">
        <span class="section-id font-data">// MISSION.LIST</span>
        <h2 class="section-title font-tech">任务列表</h2>
      </div>

      <MFDPanel
        v-if="filteredEvents.length === 0"
        variant="secondary"
        title="NO DATA"
        subtitle="MISSION LOG EMPTY"
        icon="◈"
        status="STANDBY"
        statusType="offline"
        class="empty-mfd-panel"
      >
        <div class="empty-content">
          <div class="empty-icon">◈</div>
          <p class="empty-text">暂无活动任务</p>
          <p class="empty-subtext">请稍后查看或联系指挥官获取最新任务简报</p>
        </div>
      </MFDPanel>

      <div v-else class="event-list">
        <MFDPanel
          v-for="event in filteredEvents"
          :key="event.id"
          :variant="getStatusVariant(event.status) === 'primary' ? 'primary' : 'secondary'"
          :title="event.title.toUpperCase()"
          :subtitle="formatTime(event.startTime)"
          :icon="'◈'"
          :status="getStatusText(event.status).toUpperCase()"
          :statusType="getStatusType(event.status)"
          :animated="true"
          class="event-mfd-panel"
          @click="selectEvent(event)"
        >
          <div class="event-profile">
            <p class="event-description">{{ event.description }}</p>
            <div class="event-meta-row">
              <div class="meta-item">
                <span class="meta-label font-data">LOCATION</span>
                <span class="meta-value">{{ event.location || '未指定' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label font-data">PARTICIPANTS</span>
                <span class="meta-value font-data">{{ event.participants?.length || 0 }}</span>
              </div>
            </div>
            <div class="event-actions">
              <TechButton
                v-if="!isParticipating(event)"
                variant="primary"
                size="sm"
                @click.stop="joinEvent(event.id)"
              >
                报名参加
              </TechButton>
              <TechButton
                v-else
                variant="outline"
                size="sm"
                @click.stop="leaveEvent(event.id)"
              >
                取消报名
              </TechButton>
            </div>
          </div>
        </MFDPanel>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <BaseModal
      v-model="showAddDialog"
      :title="editingEvent ? '编辑任务' : '创建任务'"
      size="lg"
    >
      <form @submit.prevent="saveEvent" class="event-form">
        <div class="form-group">
          <label class="form-label font-data">任务标题 *</label>
          <input v-model="eventForm.title" type="text" required class="form-input" />
        </div>

        <div class="form-group">
          <label class="form-label font-data">任务描述</label>
          <textarea v-model="eventForm.description" rows="3" class="form-input"></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label font-data">开始时间 *</label>
            <input v-model="eventForm.startTime" type="datetime-local" required class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label font-data">结束时间</label>
            <input v-model="eventForm.endTime" type="datetime-local" class="form-input" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label font-data">任务地点</label>
          <input v-model="eventForm.location" type="text" class="form-input" />
        </div>

        <div class="form-actions">
          <TechButton type="button" variant="outline" @click="showAddDialog = false">
            取消
          </TechButton>
          <TechButton type="submit" variant="primary">
            {{ editingEvent ? '更新' : '创建' }}
          </TechButton>
        </div>
      </form>
    </BaseModal>

    <!-- 详情弹窗 -->
    <BaseModal
      v-model="showDetailDialog"
      :title="selectedEvent?.title || '任务详情'"
      size="lg"
    >
      <div v-if="selectedEvent" class="event-detail">
        <div class="detail-header">
          <StatusIndicator
            :type="getStatusType(selectedEvent.status)"
            :label="getStatusText(selectedEvent.status).toUpperCase()"
            size="small"
          />
          <span class="detail-time font-data">{{ formatDateTime(selectedEvent.startTime) }}</span>
        </div>

        <div class="detail-body">
          <p class="detail-description">{{ selectedEvent.description }}</p>

          <div class="detail-info">
            <div class="info-item">
              <span class="info-label font-data">LOCATION</span>
              <span class="info-value">{{ selectedEvent.location || '未指定' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label font-data">PARTICIPANTS</span>
              <span class="info-value font-data">{{ selectedEvent.participants?.length || 0 }}</span>
            </div>
          </div>

          <div v-if="selectedEvent.participants?.length > 0" class="detail-participants">
            <h4 class="font-tech">已报名成员</h4>
            <div class="participant-list">
              <span v-for="id in selectedEvent.participants" :key="id" class="participant font-data">
                {{ id }}
              </span>
            </div>
          </div>
        </div>

        <div class="detail-actions">
          <TechButton
            v-if="!isParticipating(selectedEvent)"
            variant="primary"
            @click="joinEvent(selectedEvent.id)"
          >
            报名参加
          </TechButton>
          <TechButton
            v-else
            variant="outline"
            @click="leaveEvent(selectedEvent.id)"
          >
            取消报名
          </TechButton>
          <TechButton
            v-if="isAdmin"
            variant="outline"
            @click="editEvent(selectedEvent)"
          >
            编辑
          </TechButton>
          <TechButton
            v-if="isAdmin"
            variant="outline"
            class="danger"
            @click="deleteEvent(selectedEvent.id)"
          >
            删除
          </TechButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
/**
 * 活动日历视图组件 - Stellar Nexus 星渊枢纽风格
 * @description 展示战队活动日历，采用Stellar Nexus视觉系统
 * @version 3.0
 */

import { ref, computed, onMounted } from 'vue'
import { useCalendarStore } from '@/stores/calendar'
import { useAuthStore } from '@/stores/auth'
import { createLogger } from '../utils/logger.js'
import MFDPanel from '@/components/ui/MFDPanel.vue'
import StatusIndicator from '@/components/ui/StatusIndicator.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import TechButton from '@/components/ui/TechButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const logger = createLogger('Calendar')
const calendarStore = useCalendarStore()
const authStore = useAuthStore()

// 弹窗状态
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const editingEvent = ref(null)
const selectedEvent = ref(null)

// 表单数据
const eventForm = ref({
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  location: ''
})

// 视图模式
const viewMode = computed(() => calendarStore.viewMode)
const viewModes = [
  { label: '月历', value: 'month' },
  { label: '列表', value: 'list' }
]

// 星期标题
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// 计算属性
const loading = computed(() => calendarStore.loading)
const error = computed(() => calendarStore.error)
const filteredEvents = computed(() => calendarStore.filteredEvents)
const isAdmin = computed(() => authStore.isAdmin)

const formattedDate = computed(() => {
  const date = calendarStore.currentDate
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
})

const calendarDays = computed(() => {
  const date = calendarStore.currentDate
  const year = date.getFullYear()
  const month = date.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const days = []

  // 上月补充
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrevMonth - i)
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, new Date()),
      events: getEventsForDate(d)
    })
  }

  // 当月
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i)
    days.push({
      date: d,
      isCurrentMonth: true,
      isToday: isSameDay(d, new Date()),
      events: getEventsForDate(d)
    })
  }

  // 下月补充
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, new Date()),
      events: getEventsForDate(d)
    })
  }

  return days
})

/**
 * 判断是否为同一天
 * @param {Date} d1 - 日期1
 * @param {Date} d2 - 日期2
 * @returns {boolean}
 */
function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

/**
 * 获取指定日期的活动
 * @param {Date} date - 日期
 * @returns {Array} 活动列表
 */
function getEventsForDate(date) {
  const dateStr = date.toDateString()
  return calendarStore.eventsByDate[dateStr] || []
}

/**
 * 加载活动数据
 * @description 调用 store 获取活动列表，错误由 store 内部捕获并设置到 error 状态
 *              此处仅做静默兜底，防止异步错误冒泡到 ErrorBoundary 组件
 */
async function loadData() {
  try {
    await calendarStore.fetchEvents()
  } catch {
    // store 已将错误信息写入 calendarStore.error，页面模板自动展示错误状态
    // 此处不重新抛出，避免触发上层 ErrorBoundary 导致整页白屏
  }
}

/**
 * 设置视图模式
 * @param {string} mode - 视图模式
 */
function setViewMode(mode) {
  calendarStore.setViewMode(mode)
}

/**
 * 跳转到今天
 */
function goToday() {
  calendarStore.goToday()
}

/**
 * 跳转到下一页
 */
function goNext() {
  calendarStore.goNext()
}

/**
 * 跳转到上一页
 */
function goPrev() {
  calendarStore.goPrev()
}

/**
 * 选择活动
 * @param {Object} event - 活动对象
 */
function selectEvent(event) {
  selectedEvent.value = event
  showDetailDialog.value = true
}

/**
 * 编辑活动
 * @param {Object} event - 活动对象
 */
function editEvent(event) {
  editingEvent.value = event.id
  eventForm.value = {
    title: event.title,
    description: event.description || '',
    startTime: formatDateTimeLocal(event.startTime),
    endTime: formatDateTimeLocal(event.endTime),
    location: event.location || ''
  }
  showDetailDialog.value = false
  showAddDialog.value = true
}

/**
 * 重置表单
 */
function resetForm() {
  editingEvent.value = null
  eventForm.value = {
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: ''
  }
}

/**
 * 保存活动
 */
async function saveEvent() {
  try {
    const formData = {
      ...eventForm.value,
      startTime: new Date(eventForm.value.startTime).toISOString(),
      endTime: eventForm.value.endTime ? new Date(eventForm.value.endTime).toISOString() : null
    }

    if (editingEvent.value) {
      await calendarStore.updateEvent(editingEvent.value, formData)
    } else {
      await calendarStore.createEvent(formData)
    }
    showAddDialog.value = false
    resetForm()
  } catch (err) {
    logger.error('保存失败:', err)
  }
}

/**
 * 报名参加活动
 * @param {string} eventId - 活动ID
 */
async function joinEvent(eventId) {
  try {
    await calendarStore.joinEvent(eventId)
  } catch (err) {
    logger.error('报名失败:', err)
  }
}

/**
 * 取消报名
 * @param {string} eventId - 活动ID
 */
async function leaveEvent(eventId) {
  try {
    await calendarStore.leaveEvent(eventId)
  } catch (err) {
    logger.error('取消报名失败:', err)
  }
}

/**
 * 删除活动
 * @param {string} eventId - 活动ID
 */
async function deleteEvent(eventId) {
  if (!confirm('确定删除此任务？')) return

  try {
    await calendarStore.deleteEvent(eventId)
    showDetailDialog.value = false
  } catch (err) {
    logger.error('删除失败:', err)
  }
}

/**
 * 检查是否已报名
 * @param {Object} event - 活动对象
 * @returns {boolean}
 */
function isParticipating(event) {
  const userId = authStore.user?.id
  return userId && event.participants?.includes(userId)
}

/**
 * 获取状态变体
 * @param {string} status - 状态
 * @returns {string}
 */
function getStatusVariant(status) {
  const map = {
    upcoming: 'primary',
    ongoing: 'success',
    completed: 'default',
    cancelled: 'danger'
  }
  return map[status] || 'default'
}

/**
 * 获取状态文本
 * @param {string} status - 状态
 * @returns {string}
 */
function getStatusText(status) {
  const map = {
    upcoming: '即将开始',
    ongoing: '进行中',
    completed: '已结束',
    cancelled: '已取消'
  }
  return map[status] || '未知'
}

/**
 * 获取状态类型
 * @param {string} status - 状态
 * @returns {string}
 */
function getStatusType(status) {
  const map = {
    upcoming: 'warning',
    ongoing: 'online',
    completed: 'offline',
    cancelled: 'danger'
  }
  return map[status] || 'offline'
}

/**
 * 格式化时间
 * @param {string} isoString - ISO时间字符串
 * @returns {string}
 */
function formatTime(isoString) {
  const date = new Date(isoString)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

/**
 * 格式化日期时间
 * @param {string} isoString - ISO时间字符串
 * @returns {string}
 */
function formatDateTime(isoString) {
  const date = new Date(isoString)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

/**
 * 格式化为本地日期时间
 * @param {string} isoString - ISO时间字符串
 * @returns {string}
 */
function formatDateTimeLocal(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* 页面容器 */
.calendar-page {
  padding: 2rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
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

/* MFD风格页面标题 */
.page-header-mfd {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1rem;
  padding: 2rem;
  padding-bottom: 1.5rem;
  background: linear-gradient(135deg, rgba(12, 20, 36, 0.95), rgba(6, 11, 20, 0.98));
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: var(--radius-md);
  position: relative;
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
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  z-index: 1;
}

.page-id {
  font-size: 0.75rem;
  color: var(--nebula-purple);
  letter-spacing: 0.15em;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-muted);
  margin: 0;
  letter-spacing: 0.05em;
}

.page-header-decoration {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}

.header-line {
  width: 60px;
  height: 2px;
  background: var(--accent);
  opacity: 0.6;
}

/* 区块标题 */
.section-header-mfd {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-left: 1rem;
  border-left: 3px solid var(--accent);
}

.section-id {
  font-size: 0.7rem;
  color: var(--accent);
  letter-spacing: 0.1em;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* 控制面板 */
.controls-mfd-panel {
  margin-bottom: 1rem;
}

.calendar-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
}

.nav-group,
.view-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.current-date {
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent);
  margin: 0 0.5rem;
  letter-spacing: 0.1em;
}

/* 加载/错误状态 */
.loading-content,
.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 2rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 2px solid rgba(95, 169, 255, 0.2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0;
  letter-spacing: 0.05em;
}

.error-message {
  color: var(--danger);
  font-size: 0.9rem;
}

/* 月历视图 */
.month-view {
  animation: fadeInUp 0.5s ease both;
}

.month-mfd-panel {
  padding: 1rem;
}

.month-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: rgba(17, 24, 39, 0.5);
  border-bottom: 1px solid var(--border-medium);
  margin-bottom: 0.5rem;
}

.week-day {
  padding: 0.75rem;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  min-height: 500px;
}

.day-cell {
  padding: 0.5rem;
  border-right: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
  min-height: 80px;
  transition: background var(--duration-fast), border-color var(--duration-fast), box-shadow 0.3s ease;
}

.day-cell:hover {
  background: rgba(124, 58, 237, 0.06);
  border-color: rgba(124, 58, 237, 0.15);
  box-shadow: inset 0 0 20px rgba(124, 58, 237, 0.05);
}

.day-cell.other-month {
  opacity: 0.3;
}

.day-cell.is-today {
  background: rgba(95, 169, 255, 0.1);
}

.day-cell.has-events {
  border-left: 3px solid var(--accent);
}

.day-number {
  display: inline-block;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.day-cell.is-today .day-number {
  background: var(--accent);
  color: var(--void-deepest);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.event-dot {
  font-size: 0.7rem;
  padding: 0.25rem 0.375rem;
  min-height: 28px;
  display: flex;
  align-items: center;
  border-radius: 2px;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: all var(--duration-fast);
}

.event-dot:hover {
  transform: translateX(3px);
  box-shadow: 0 0 8px rgba(124, 58, 237, 0.3);
}

.event-upcoming {
  background: rgba(95, 169, 255, 0.2);
  color: var(--accent);
}

.event-ongoing {
  background: rgba(78, 205, 196, 0.2);
  color: var(--success);
}

.event-completed {
  background: rgba(148, 163, 184, 0.1);
  color: var(--text-muted);
}

.event-cancelled {
  background: rgba(255, 107, 107, 0.2);
  color: var(--danger);
}

.more-events {
  font-size: 0.65rem;
  color: var(--text-muted);
  cursor: pointer;
}

/* 列表视图 */
.list-view {
  animation: fadeInUp 0.5s ease both;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-mfd-panel {
  cursor: pointer;
  transition: transform var(--duration-fast);
}

.event-mfd-panel:hover {
  transform: translateY(-2px);
}

.event-profile {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem;
}

.event-description {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.5;
  font-size: 0.9rem;
}

.event-meta-row {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meta-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.meta-value {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.event-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-light);
}

/* 空状态 */
.empty-mfd-panel {
  margin-top: 1rem;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  color: var(--accent);
  opacity: 0.5;
}

.empty-text {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
}

.empty-subtext {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}

/* 详情弹窗 */
.event-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-light);
}

.detail-time {
  font-size: 0.85rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-description {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.detail-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: rgba(17, 24, 39, 0.5);
  border: 1px solid var(--border-light);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.info-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.info-value {
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 500;
}

.detail-participants {
  padding-top: 1rem;
  border-top: 1px solid var(--border-light);
}

.detail-participants h4 {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
}

.participant-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.participant {
  padding: 0.25rem 0.75rem;
  background: rgba(95, 169, 255, 0.1);
  border: 1px solid var(--border-light);
  border-radius: 2px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.detail-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--border-light);
}

/* 表单样式 */
.event-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.form-input {
  padding: 0.625rem 1rem;
  background: rgba(17, 24, 39, 0.5);
  border: 1px solid var(--border-light);
  border-radius: 2px;
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--nebula-violet);
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2), 0 0 20px rgba(124, 58, 237, 0.08);
}

.form-input textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-light);
}

/* 动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .calendar-page {
    padding: 1rem;
    padding-top: calc(1rem + env(safe-area-inset-top, 0px));
    padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  }

  .page-title {
    font-size: 1.75rem;
  }

  .calendar-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .nav-group,
  .view-group {
    justify-content: center;
  }

  .month-grid {
    min-height: auto;
  }

  .day-cell {
    min-height: 60px;
    padding: 0.25rem;
  }

  .event-dot {
    font-size: 0.625rem;
    min-height: 24px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .detail-info {
    grid-template-columns: 1fr;
  }

  .event-meta-row {
    flex-direction: column;
    gap: 0.5rem;
  }
}

/*
 * 窄屏（≤480px）月历水平滚动方案
 * 7 列网格在 375px 屏幕每格仅 ~50px，无法显示事件
 * 改为水平滚动 + 最小列宽，保持日历结构可用
 */
@media (max-width: 480px) {
  .page-header-mfd {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .page-header-decoration {
    align-items: flex-start;
  }

  .month-view {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin: 0 -1rem;
    padding: 0 0.5rem;
  }

  .month-header,
  .month-grid {
    min-width: 480px;
  }

  .month-grid {
    min-height: 350px;
  }

  .day-cell {
    min-height: 56px;
  }

  .week-day {
    padding: 0.5rem 0.25rem;
    font-size: 0.65rem;
  }
}
</style>
