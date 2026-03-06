<!--
  @file 申请状态查询视图组件
  @description 用户查询入队申请状态
  @module views/ApplicationStatus
-->

<template>
  <PageTitle
    title="申请状态"
    subtitle="查询您的入队申请进度"
  />

  <section class="card query-card">
    <div class="card-header">
      <h3>查询申请</h3>
    </div>
    <form @submit.prevent="queryApplication" class="query-form">
      <div class="form-group">
        <label class="form-label">申请邮箱</label>
        <input
          v-model="queryEmail"
          type="email"
          class="form-input"
          placeholder="请输入您提交申请时使用的邮箱"
          required
        />
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="isQuerying">
          {{ isQuerying ? '查询中...' : '查询状态' }}
        </button>
      </div>
    </form>
  </section>

  <Transition name="fade">
    <section v-if="application" class="card result-card">
      <div class="card-header">
        <h3>申请详情</h3>
      </div>
      <div class="result-content">
        <div class="status-banner" :class="`status-${application.status}`">
          <span class="status-icon">{{ statusIcon }}</span>
          <span class="status-text">{{ statusText }}</span>
        </div>

        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">申请人</span>
            <span class="detail-value">{{ application.name }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">提交时间</span>
            <span class="detail-value">{{ formatDate(application.created_at) }}</span>
          </div>
          <div class="detail-item" v-if="application.discord">
            <span class="detail-label">Discord</span>
            <span class="detail-value">{{ application.discord }}</span>
          </div>
          <div class="detail-item" v-if="application.availability">
            <span class="detail-label">在线时间</span>
            <span class="detail-value">{{ availabilityLabel }}</span>
          </div>
          <div class="detail-item full" v-if="application.experience">
            <span class="detail-label">游戏经验</span>
            <p class="detail-text">{{ application.experience }}</p>
          </div>
          <div class="detail-item full" v-if="application.reason">
            <span class="detail-label">加入原因</span>
            <p class="detail-text">{{ application.reason }}</p>
          </div>
        </div>

        <div v-if="application.status === 'approved'" class="next-steps">
          <h4>下一步</h4>
          <p>恭喜！您的申请已通过审核。请加入我们的 Discord 服务器完成后续流程。</p>
          <a href="#" class="btn btn-primary">加入 Discord</a>
        </div>

        <div v-if="application.status === 'rejected'" class="next-steps">
          <h4>说明</h4>
          <p>很遗憾，您的申请未能通过审核。您可以在一段时间后重新提交申请。</p>
          <RouterLink to="/join" class="btn btn-outline">重新申请</RouterLink>
        </div>
      </div>
    </section>
  </Transition>

  <Transition name="fade">
    <section v-if="notFound" class="card not-found-card">
      <div class="not-found-content">
        <span class="not-found-icon">🔍</span>
        <h3>未找到申请记录</h3>
        <p>请确认您输入的邮箱地址是否正确，或</p>
        <RouterLink to="/join" class="btn btn-primary">提交新申请</RouterLink>
      </div>
    </section>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import PageTitle from '@/components/common/PageTitle.vue'
import { dataService } from '@/services'

const queryEmail = ref('')
const application = ref(null)
const notFound = ref(false)
const isQuerying = ref(false)

const statusIcon = computed(() => {
  const icons = {
    pending: '⏳',
    approved: '✓',
    rejected: '✕'
  }
  return icons[application.value?.status] || '?'
})

const statusText = computed(() => {
  const texts = {
    pending: '审核中',
    approved: '已通过',
    rejected: '未通过'
  }
  return texts[application.value?.status] || '未知'
})

const availabilityLabel = computed(() => {
  const labels = {
    weekdays: '工作日晚上',
    weekends: '周末全天',
    flexible: '时间灵活',
    limited: '时间有限'
  }
  return labels[application.value?.availability] || application.value?.availability
})

async function queryApplication() {
  if (!queryEmail.value) return

  isQuerying.value = true
  notFound.value = false
  application.value = null

  try {
    const response = await dataService.getApplicationByEmail(queryEmail.value)
    if (response.success && response.data) {
      application.value = response.data
    } else {
      notFound.value = true
    }
  } catch (error) {
    notFound.value = true
  } finally {
    isQuerying.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.query-card,
.result-card,
.not-found-card {
  animation: fadeInUp 0.5s ease both;
}

.query-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-input {
  padding: 0.75rem 1rem;
  background: rgba(3, 8, 16, 0.6);
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--text);
  font-size: 0.95rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent);
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.status-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.25rem;
  border-radius: 8px;
  text-align: center;
}

.status-pending {
  background: rgba(255, 159, 67, 0.1);
  border: 1px solid rgba(255, 159, 67, 0.3);
}

.status-approved {
  background: rgba(78, 205, 196, 0.1);
  border: 1px solid rgba(78, 205, 196, 0.3);
}

.status-rejected {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
}

.status-icon {
  font-size: 1.5rem;
}

.status-text {
  font-size: 1.1rem;
  font-weight: 600;
}

.status-pending .status-text { color: var(--warning); }
.status-approved .status-text { color: var(--success); }
.status-rejected .status-text { color: var(--danger); }

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item.full {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
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

.next-steps {
  padding: 1.25rem;
  background: rgba(95, 169, 255, 0.05);
  border: 1px solid var(--line);
  border-radius: 8px;
  text-align: center;
}

.next-steps h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.next-steps p {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.not-found-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
}

.not-found-icon {
  font-size: 3rem;
}

.not-found-content h3 {
  margin: 0;
}

.not-found-content p {
  margin: 0;
  color: var(--text-muted);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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
</style>
