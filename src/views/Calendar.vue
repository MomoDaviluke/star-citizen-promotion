<!--
  @file 活动日历视图组件
  @description 展示战队活动日历，支持月历/列表视图、报名等功能
  @module views/Calendar
-->

<!-- 重复的脚本已被移除 -->

<template>
  <div class="calendar-page">
    <!-- 页面标题区域 -->
    <PageTitle
      title="活动日历"
      subtitle="查看和报名参加战队活动，支持月历和列表视图"
    />

    <!-- 控制栏 -->
    <div class="calendar-controls">
      <div class="nav-group">
        <BaseButton variant="outline" size="sm" @click="goPrev">
          ← 上一{{ viewMode === 'month' ? '月' : viewMode === 'week' ? '周' : '天' }}
        </BaseButton>
        <BaseButton variant="primary" size="sm" @click="goToday">
          今天
        </BaseButton>
        <BaseButton variant="outline" size="sm" @click="goNext">
          下一{{ viewMode === 'month' ? '月' : viewMode === 'week' ? '周' : '天' }} →
        </BaseButton>
        <span class="current-date">{{ formattedDate }}</span>
      </div>

      <div class="view-group">
        <BaseButton
          v-for="mode in viewModes"
          :key="mode.value"
          :variant="viewMode === mode.value ? 'primary' : 'outline'"
          size="sm"
          @click="setViewMode(mode.value)"
        >
          {{ mode.label }}
        </BaseButton>
        <BaseButton v-if="isAdmin" variant="accent" size="sm" @click="showAddDialog = true">
          + 创建活动
        </BaseButton>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载活动数据中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <BaseButton variant="primary" @click="loadData">重试</BaseButton>
    </div>

    <!-- 月历视图 -->
    <div v-else-if="viewMode === 'month'" class="month-view">
      <div class="month-header">
        <div v-for="day in weekDays" :key="day" class="week-day">{{ day }}</div>
      </div>
      <div class="month-grid">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="day-cell"
          :class="{ 'other-month': !day.isCurrentMonth, 'has-events': day.events.length > 0, 'is-today': day.isToday }"
        >
          <span class="day-number">{{ day.date.getDate() }}</span>
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
            <span v-if="day.events.length > 3" class="more-events">+{{ day.events.length - 3 }} 更多</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 列表视图 -->
    <div v-else class="list-view">
      <div v-if="filteredEvents.length === 0" class="empty-state">
        <p>暂无活动</p>
      </div>
      <div v-else class="event-list">
        <BaseCard
          v-for="event in filteredEvents"
          :key="event.id"
          hoverable
          interactive
          @click="selectEvent(event)"
        >
          <template #header>
            <div class="event-time">
              <BaseBadge :variant="getStatusVariant(event.status)">
                {{ getStatusText(event.status) }}
              </BaseBadge>
              <span class="time">{{ formatTime(event.startTime) }}</span>
            </div>
          </template>

          <h3 class="event-title">{{ event.title }}</h3>
          <p class="event-description">{{ event.description }}</p>

          <template #footer>
            <div class="event-meta">
              <span class="meta-item">
                <span class="meta-icon">📍</span>
                {{ event.location || '未指定' }}
              </span>
              <span class="meta-item">
                <span class="meta-icon">👥</span>
                {{ event.participants?.length || 0 }} 人报名
              </span>
            </div>
            <div class="event-actions">
              <BaseButton
                v-if="!isParticipating(event)"
                variant="primary"
                size="sm"
                @click.stop="joinEvent(event.id)"
              >
                报名
              </BaseButton>
              <BaseButton
                v-else
                variant="outline"
                size="sm"
                @click.stop="leaveEvent(event.id)"
              >
                取消报名
              </BaseButton>
            </div>
          </template>
        </BaseCard>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <BaseModal
      v-model="showAddDialog"
      :title="editingEvent ? '编辑活动' : '创建活动'"
      size="lg"
    >
      <form @submit.prevent="saveEvent" class="event-form">
        <div class="form-group">
          <label>活动标题 *</label>
          <input v-model="eventForm.title" type="text" required class="form-input" />
        </div>

        <div class="form-group">
          <label>活动描述</label>
          <textarea v-model="eventForm.description" rows="3" class="form-input"></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>开始时间 *</label>
            <input v-model="eventForm.startTime" type="datetime-local" required class="form-input" />
          </div>
          <div class="form-group">
            <label>结束时间</label>
            <input v-model="eventForm.endTime" type="datetime-local" class="form-input" />
          </div>
        </div>

        <div class="form-group">
          <label>活动地点</label>
          <input v-model="eventForm.location" type="text" class="form-input" />
        </div>

        <div class="form-actions">
          <BaseButton type="button" variant="outline" @click="showAddDialog = false">
            取消
          </BaseButton>
          <BaseButton type="submit" variant="primary">
            {{ editingEvent ? '更新' : '创建' }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- 详情弹窗 -->
    <BaseModal
      v-model="showDetailDialog"
      :title="selectedEvent?.title || '活动详情'"
      size="lg"
    >
      <div v-if="selectedEvent" class="event-detail">
        <div class="detail-header">
          <BaseBadge :variant="getStatusVariant(selectedEvent.status)">
            {{ getStatusText(selectedEvent.status) }}
          </BaseBadge>
          <span class="detail-time">{{ formatDateTime(selectedEvent.startTime) }}</span>
        </div>

        <div class="detail-body">
          <p class="detail-description">{{ selectedEvent.description }}</p>

          <div class="detail-info">
            <div class="info-item">
              <span class="info-label">地点</span>
              <span class="info-value">{{ selectedEvent.location || '未指定' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">报名人数</span>
              <span class="info-value">{{ selectedEvent.participants?.length || 0 }} 人</span>
            </div>
          </div>

          <div v-if="selectedEvent.participants?.length > 0" class="detail-participants">
            <h4>已报名成员</h4>
            <div class="participant-list">
              <span v-for="(id, idx) in selectedEvent.participants" :key="id" class="participant">
                {{ id }}
              </span>
            </div>
          </div>
        </div>

        <div class="detail-actions">
          <BaseButton
            v-if="!isParticipating(selectedEvent)"
            variant="primary"
            @click="joinEvent(selectedEvent.id)"
          >
            报名参加
          </BaseButton>
          <BaseButton
            v-else
            variant="outline"
            @click="leaveEvent(selectedEvent.id)"
          >
            取消报名
          </BaseButton>
          <BaseButton
            v-if="isAdmin"
            variant="outline"
            @click="editEvent(selectedEvent)"
          >
            编辑
          </BaseButton>
          <BaseButton
            v-if="isAdmin"
            variant="danger"
            @click="deleteEvent(selectedEvent.id)"
          >
            删除
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
/**
 * 活动日历视图组件
 * @description 展示战队活动列表，支持视图切换、报名等功能
 */

import { ref, computed, onMounted } from 'vue'
import { useCalendarStore } from '@/stores/calendar'
import { useAuthStore } from '@/stores/auth'
import PageTitle from '@/components/common/PageTitle.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const calendarStore = useCalendarStore()
const authStore = useAuthStore()

// 状态
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
    const date = new Date(year, month - 1, daysInPrevMonth - i)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date()),
      events: getEventsForDate(date)
    })
  }
  
  // 当月
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    days.push({
      date,
      isCurrentMonth: true,
      isToday: isSameDay(date, new Date()),
      events: getEventsForDate(date)
    })
  }
  
  // 下月补充
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date()),
      events: getEventsForDate(date)
    })
  }
  
  return days
})

// 方法
function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

function getEventsForDate(date) {
  const dateStr = date.toDateString()
  return calendarStore.eventsByDate[dateStr] || []
}

async function loadData() {
  await calendarStore.fetchEvents()
}

function setViewMode(mode) {
  calendarStore.setViewMode(mode)
}

function goToday() {
  calendarStore.goToday()
}

function goNext() {
  calendarStore.goNext()
}

function goPrev() {
  calendarStore.goPrev()
}

function selectEvent(event) {
  selectedEvent.value = event
  showDetailDialog.value = true
}

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
    console.error('保存失败:', err)
  }
}

async function joinEvent(eventId) {
  try {
    await calendarStore.joinEvent(eventId)
  } catch (err) {
    console.error('报名失败:', err)
  }
}

async function leaveEvent(eventId) {
  try {
    await calendarStore.leaveEvent(eventId)
  } catch (err) {
    console.error('取消报名失败:', err)
  }
}

async function deleteEvent(eventId) {
  if (!confirm('确定删除此活动？')) return
  
  try {
    await calendarStore.deleteEvent(eventId)
    showDetailDialog.value = false
  } catch (err) {
    console.error('删除失败:', err)
  }
}

function isParticipating(event) {
  const userId = authStore.user?.id
  return userId && event.participants?.includes(userId)
}

function getStatusVariant(status) {
  const map = {
    upcoming: 'primary',
    ongoing: 'success',
    completed: 'default',
    cancelled: 'danger'
  }
  return map[status] || 'default'
}

function getStatusText(status) {
  const map = {
    upcoming: '即将开始',
    ongoing: '进行中',
    completed: '已结束',
    cancelled: '已取消'
  }
  return map[status] || '未知'
}

function formatTime(isoString) {
  const date = new Date(isoString)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

function formatDateTime(isoString) {
  const date = new Date(isoString)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

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
.calendar-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* 控制栏 */
.calendar-controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  align-items: center;
  justify-content: space-between;
}

.nav-group,
.view-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  align-items: center;
}

.current-date {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 var(--space-md);
}

/* 月历视图 */
.month-view {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.month-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--bg-deep);
  border-bottom: 1px solid var(--border-subtle);
}

.week-day {
  padding: 0.75rem;
  text-align: center;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
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
  border-right: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  min-height: 80px;
  transition: background var(--transition-fast);
}

.day-cell:hover {
  background: rgba(95, 169, 255, 0.05);
}

.day-cell.other-month {
  opacity: 0.3;
}

.day-cell.is-today {
  background: rgba(95, 169, 255, 0.1);
}

.day-cell.has-events {
  border-left: 3px solid var(--color-primary);
}

.day-number {
  display: inline-block;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.day-cell.is-today .day-number {
  background: var(--color-primary);
  color: var(--bg-deepest);
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
  font-size: var(--text-xs);
  padding: 0.125rem 0.25rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: all var(--transition-fast);
}

.event-dot:hover {
  transform: scale(1.02);
}

.event-upcoming {
  background: rgba(95, 169, 255, 0.2);
  color: var(--color-primary);
}

.event-ongoing {
  background: rgba(78, 205, 196, 0.2);
  color: var(--color-success);
}

.event-completed {
  background: var(--bg-medium);
  color: var(--text-muted);
}

.event-cancelled {
  background: rgba(255, 107, 107, 0.2);
  color: var(--color-danger);
}

.more-events {
  font-size: var(--text-xs);
  color: var(--text-muted);
  cursor: pointer;
}

/* 列表视图 */
.list-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.event-time {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.time {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.event-title {
  margin: 0 0 0.5rem;
  font-size: var(--text-lg);
  color: var(--text-primary);
}

.event-description {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: 1.5;
}

.event-meta {
  display: flex;
  gap: var(--space-lg);
  font-size: var(--text-sm);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--text-secondary);
}

.meta-icon {
  font-size: var(--text-base);
}

.event-actions {
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

/* 详情弹窗 */
.event-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.detail-time {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.detail-description {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.detail-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.info-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.info-value {
  font-size: var(--text-base);
  color: var(--text-primary);
  font-weight: 500;
}

.detail-participants {
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-subtle);
}

.detail-participants h4 {
  margin: 0 0 0.75rem;
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.participant-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.participant {
  padding: 0.25rem 0.75rem;
  background: var(--bg-medium);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.detail-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-subtle);
}

/* 表单样式 */
.event-form {
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

/* 响应式 */
@media (max-width: 768px) {
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
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .detail-info {
    grid-template-columns: 1fr;
  }
}
</style>
