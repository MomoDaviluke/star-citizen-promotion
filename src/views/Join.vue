<!--
  @file 加入我们视图组件
  @description 展示招募条件、加入流程和申请表单
  @module views/Join
-->

<template>
  <PageTitle
    title="加入我们"
    subtitle="填写申请表单，开启你的星际冒险之旅。"
  />

  <!-- 招募条件和流程卡片 -->
  <section class="grid join-grid">
    <article class="card join-card" :style="{ animationDelay: '0s' }">
      <div class="card-header">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <h3>招募条件</h3>
      </div>
      <ul class="requirement-list">
        <li v-for="(item, index) in requirements" :key="index">
          <span class="check-icon">✓</span>
          <span>{{ item }}</span>
        </li>
      </ul>
    </article>

    <article class="card join-card" :style="{ animationDelay: '0.15s' }">
      <div class="card-header">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <h3>加入流程</h3>
      </div>
      <ol class="process-list">
        <li v-for="(item, index) in process" :key="index">
          <span class="step-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="step-text">{{ item }}</span>
        </li>
      </ol>
    </article>
  </section>

  <!-- 申请表单 -->
  <section class="form-section">
    <div class="card form-card">
      <h2 class="form-title">提交申请</h2>
      <p class="form-subtitle">请填写以下信息，我们会尽快与您联系</p>

      <form @submit.prevent="handleSubmit" class="application-form">
        <div class="form-row">
          <div class="form-group">
            <label for="name" class="form-label">
              姓名 <span class="required">*</span>
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              class="form-input"
              :class="{ 'is-error': errors.name }"
              placeholder="请输入您的姓名"
              required
              maxlength="50"
            />
            <span v-if="errors.name" class="form-error">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label for="email" class="form-label">
              邮箱 <span class="required">*</span>
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="form-input"
              :class="{ 'is-error': errors.email }"
              placeholder="请输入您的邮箱"
              required
            />
            <span v-if="errors.email" class="form-error">{{ errors.email }}</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="discord" class="form-label">Discord</label>
            <input
              id="discord"
              v-model="form.discord"
              type="text"
              class="form-input"
              placeholder="请输入您的 Discord ID"
              maxlength="50"
            />
          </div>

          <div class="form-group">
            <label for="availability" class="form-label">在线时间</label>
            <select id="availability" v-model="form.availability" class="form-input form-select">
              <option value="">请选择</option>
              <option value="weekdays">工作日晚上</option>
              <option value="weekends">周末全天</option>
              <option value="flexible">时间灵活</option>
              <option value="limited">时间有限</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="experience" class="form-label">游戏经验</label>
          <textarea
            id="experience"
            v-model="form.experience"
            class="form-input form-textarea"
            placeholder="请描述您的 Star Citizen 游戏经验（如有）"
            rows="3"
            maxlength="500"
          ></textarea>
          <span class="form-hint">{{ form.experience?.length || 0 }}/500</span>
        </div>

        <div class="form-group">
          <label for="reason" class="form-label">加入原因</label>
          <textarea
            id="reason"
            v-model="form.reason"
            class="form-input form-textarea"
            placeholder="请描述您想加入团队的原因"
            rows="3"
            maxlength="500"
          ></textarea>
          <span class="form-hint">{{ form.reason?.length || 0 }}/500</span>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary btn-lg"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="btn-loading">
              <span class="spinner"></span>
              提交中...
            </span>
            <span v-else class="btn-content">
              <span class="btn-text">提交申请</span>
              <span class="btn-arrow">→</span>
            </span>
          </button>
        </div>
      </form>

      <!-- 提交成功提示 -->
      <Transition name="fade">
        <div v-if="submitSuccess" class="success-message">
          <div class="success-icon">✓</div>
          <h3>申请提交成功！</h3>
          <p>我们会尽快审核您的申请，并通过邮件与您联系。</p>
          <button @click="resetForm" class="btn btn-secondary">再次申请</button>
        </div>
      </Transition>

      <!-- 提交失败提示 -->
      <Transition name="fade">
        <div v-if="submitError" class="error-message">
          <div class="error-icon">!</div>
          <h3>提交失败</h3>
          <p>{{ submitError }}</p>
          <button @click="submitError = null" class="btn btn-secondary">重试</button>
        </div>
      </Transition>
    </div>
  </section>
</template>

<script setup>
/**
 * 加入我们视图组件
 * @description 展示招募条件、加入流程和申请表单
 */

import PageTitle from '@/components/common/PageTitle.vue'
import { ref, reactive } from 'vue'
import { dataService } from '@/services'

/** 招募条件列表 */
const requirements = ref([
  '尊重团队协作与沟通规则',
  '愿意参加基础训练与复盘',
  '每周有稳定在线时间',
  '拥有基础的游戏设备与网络条件'
])

/** 加入流程步骤 */
const process = ref([
  '提交申请信息',
  '完成语音面谈',
  '参与试训活动',
  '正式加入团队'
])

/** 表单数据 */
const form = reactive({
  name: '',
  email: '',
  discord: '',
  availability: '',
  experience: '',
  reason: ''
})

/** 表单验证错误 */
const errors = reactive({
  name: '',
  email: ''
})

/** 提交状态 */
const isSubmitting = ref(false)
const submitSuccess = ref(false)
const submitError = ref(null)

/**
 * 验证表单
 * @returns {boolean} 是否验证通过
 */
function validateForm() {
  let isValid = true

  errors.name = ''
  errors.email = ''

  if (!form.name.trim()) {
    errors.name = '请输入姓名'
    isValid = false
  } else if (form.name.length > 50) {
    errors.name = '姓名不能超过 50 个字符'
    isValid = false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email.trim()) {
    errors.email = '请输入邮箱'
    isValid = false
  } else if (!emailRegex.test(form.email)) {
    errors.email = '请输入有效的邮箱地址'
    isValid = false
  }

  return isValid
}

/**
 * 提交表单
 */
async function handleSubmit() {
  if (!validateForm()) return

  isSubmitting.value = true
  submitError.value = null

  try {
    const response = await dataService.submitApplication({
      name: form.name.trim(),
      email: form.email.trim(),
      discord: form.discord.trim() || null,
      availability: form.availability || null,
      experience: form.experience.trim() || null,
      reason: form.reason.trim() || null
    })

    if (response.success) {
      submitSuccess.value = true
    } else {
      submitError.value = response.error || '提交失败，请稍后重试'
    }
  } catch (error) {
    submitError.value = error.message || '网络错误，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 重置表单
 */
function resetForm() {
  form.name = ''
  form.email = ''
  form.discord = ''
  form.availability = ''
  form.experience = ''
  form.reason = ''
  errors.name = ''
  errors.email = ''
  submitSuccess.value = false
  submitError.value = null
}
</script>

<style scoped>
/* 卡片网格布局 */
.join-grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.join-card {
  animation: fadeInUp 0.6s ease both;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.header-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(95, 169, 255, 0.1);
  border: 1px solid rgba(143, 215, 255, 0.2);
  border-radius: 4px;
  color: var(--accent-2);
}

.header-icon svg {
  width: 22px;
  height: 22px;
}

h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.requirement-list,
.process-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.requirement-list li,
.process-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--line);
  color: var(--text-muted);
}

.requirement-list li:last-child,
.process-list li:last-child {
  border-bottom: none;
}

.check-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: rgba(78, 205, 196, 0.15);
  border: 1px solid rgba(78, 205, 196, 0.4);
  border-radius: 3px;
  color: var(--success);
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 2px;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 24px;
  background: rgba(95, 169, 255, 0.1);
  border: 1px solid rgba(143, 215, 255, 0.3);
  border-radius: 3px;
  color: var(--accent-2);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.step-text {
  flex: 1;
}

/* 表单区域 */
.form-section {
  margin-top: 2.5rem;
}

.form-card {
  position: relative;
  overflow: hidden;
}

.form-title {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.form-subtitle {
  margin: 0 0 2rem;
  color: var(--text-muted);
}

.application-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text);
  letter-spacing: 0.02em;
}

.required {
  color: var(--danger);
}

.form-input {
  padding: 0.75rem 1rem;
  background: rgba(3, 8, 16, 0.6);
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--text);
  font-size: 0.95rem;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-input::placeholder {
  color: var(--text-muted);
  opacity: 0.6;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(95, 169, 255, 0.15);
}

.form-input.is-error {
  border-color: var(--danger);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238fd7ff' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
}

.form-error {
  font-size: 0.8rem;
  color: var(--danger);
}

.form-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: right;
}

.form-actions {
  margin-top: 1rem;
}

.btn-lg {
  padding: 0.85rem 1.75rem;
  font-size: 0.85rem;
  min-width: 180px;
}

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-arrow {
  transition: transform var(--transition-fast);
}

.btn-primary:hover .btn-arrow {
  transform: translateX(4px);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 成功/错误消息 */
.success-message,
.error-message {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: rgba(3, 8, 16, 0.98);
  backdrop-filter: blur(8px);
  text-align: center;
  padding: 2rem;
}

.success-icon,
.error-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: 700;
}

.success-icon {
  background: rgba(78, 205, 196, 0.15);
  border: 2px solid var(--success);
  color: var(--success);
}

.error-icon {
  background: rgba(255, 107, 107, 0.15);
  border: 2px solid var(--danger);
  color: var(--danger);
}

.success-message h3,
.error-message h3 {
  margin: 0;
  font-size: 1.25rem;
  text-transform: none;
  letter-spacing: 0;
}

.success-message p,
.error-message p {
  margin: 0;
  color: var(--text-muted);
  max-width: 300px;
}

/* 过渡动画 */
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式适配 */
@media (max-width: 860px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    text-align: center;
  }
}
</style>
