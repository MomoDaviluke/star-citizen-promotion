<!--
  @file 加入我们视图组件 - Stellar Nexus 星渊枢纽风格
  @description 展示招募条件、加入流程和申请表单，采用Stellar Nexus视觉系统
  @module views/Join
  @version 3.0 - Stellar Nexus视觉系统
-->

<template>
  <div class="join-page">
    <!-- 星云背景装饰 -->
    <div class="page-nebulae">
      <div class="nebula-blob nebula-blob--purple"></div>
      <div class="nebula-blob nebula-blob--cyan"></div>
    </div>

    <!-- 页面标题区域 -->
    <PageHeader
      backgroundImage="/images/sc/sc-join.jpg"
      title="加入我们"
      subtitle="提交入队申请，开启星际冒险之旅"
      systemId="SYS.RECRUITMENT // V.3.0"
    />

    <!-- 招募条件和流程卡片 - MFD风格 -->
    <div class="join-info">
      <div class="section-header-mfd" v-scroll-reveal="'fadeUp'">
        <span class="section-id font-data">// RECRUITMENT.PROTOCOL</span>
        <h2 class="section-title font-tech">招募协议</h2>
      </div>

      <div class="join-grid" v-scroll-reveal="{ animation: 'fadeUp', delay: 0.15 }">
        <!-- 招募条件 -->
        <MFDPanel
          variant="primary"
          title="REQUIREMENTS"
          subtitle="QUALIFICATION CHECKLIST"
          icon="◈"
          status="ACTIVE"
          statusType="online"
          :animated="true"
          class="join-mfd-panel"
        >
          <div class="join-content">
            <ul class="requirement-list">
              <li v-for="(item, index) in requirements" :key="index">
                <span class="check-icon font-data">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="item-text">{{ item }}</span>
              </li>
            </ul>
          </div>
        </MFDPanel>

        <!-- 加入流程 -->
        <MFDPanel
          variant="secondary"
          title="PROCESS"
          subtitle="ENLISTMENT PROCEDURE"
          icon="◈"
          status="STANDBY"
          statusType="warning"
          :animated="true"
          class="join-mfd-panel"
        >
          <div class="join-content">
            <div class="process-timeline">
              <div
                v-for="(item, index) in process"
                :key="index"
                class="process-step"
                :class="{ 'process-step--active': index === 0 }"
              >
                <div class="step-marker">
                  <span class="step-number font-data">{{ String(index + 1).padStart(2, '0') }}</span>
                  <div v-if="index < process.length - 1" class="step-connector"></div>
                </div>
                <div class="step-content">
                  <span class="step-text">{{ item }}</span>
                </div>
              </div>
            </div>
          </div>
        </MFDPanel>
      </div>
    </div>

    <!-- 申请表单 - MFD风格 -->
    <div class="form-section">
      <div class="section-header-mfd" v-scroll-reveal="'fadeUp'">
        <span class="section-id font-data">// APPLICATION.FORM</span>
        <h2 class="section-title font-tech">提交申请</h2>
      </div>

      <MFDPanel
        variant="primary"
        title="ENLISTMENT APPLICATION"
        subtitle="REQUIRED FIELDS MARKED WITH *"
        icon="◈"
        status="READY"
        statusType="online"
        class="form-mfd-panel"
      >
        <div class="form-content">
          <p class="form-subtitle">请填写以下信息，我们会尽快与您联系</p>

          <form @submit.prevent="handleSubmit" class="application-form">
            <div class="form-row">
              <div class="form-group">
                <label for="name" class="form-label font-data">
                  NAME <span class="required">*</span>
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
                <label for="email" class="form-label font-data">
                  EMAIL <span class="required">*</span>
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
                <label for="discord" class="form-label font-data">DISCORD ID</label>
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
                <label for="availability" class="form-label font-data">AVAILABILITY</label>
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
              <label for="experience" class="form-label font-data">EXPERIENCE</label>
              <textarea
                id="experience"
                v-model="form.experience"
                class="form-input form-textarea"
                placeholder="请描述您的 Star Citizen 游戏经验（如有）"
                rows="3"
                maxlength="500"
              ></textarea>
              <span class="form-hint font-data">{{ form.experience?.length || 0 }}/500</span>
            </div>

            <div class="form-group">
              <label for="reason" class="form-label font-data">REASON FOR JOINING</label>
              <textarea
                id="reason"
                v-model="form.reason"
                class="form-input form-textarea"
                placeholder="请描述您想加入团队的原因"
                rows="3"
                maxlength="500"
              ></textarea>
              <span class="form-hint font-data">{{ form.reason?.length || 0 }}/500</span>
            </div>

            <div class="form-actions">
              <TechButton
                type="submit"
                variant="primary"
                size="lg"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting" class="btn-loading">
                  <span class="spinner"></span>
                  <span class="font-data">提交中...</span>
                </span>
                <span v-else class="btn-content">
                  <span class="font-data">提交申请</span>
                  <span class="btn-arrow">→</span>
                </span>
              </TechButton>
            </div>
          </form>

          <!-- 提交成功提示 -->
          <Transition name="fade">
            <div v-if="submitSuccess" class="success-message">
              <div class="success-icon">✓</div>
              <h3 class="font-tech">申请提交成功！</h3>
              <p>我们会尽快审核您的申请，并通过邮件与您联系。</p>
              <TechButton variant="outline" @click="resetForm">再次申请</TechButton>
            </div>
          </Transition>

          <!-- 提交失败提示 -->
          <Transition name="fade">
            <div v-if="submitError" class="error-message">
              <div class="error-icon">!</div>
              <h3 class="font-tech">提交失败</h3>
              <p>{{ submitError }}</p>
              <TechButton variant="outline" @click="submitError = null">重试</TechButton>
            </div>
          </Transition>
        </div>
      </MFDPanel>
    </div>
  </div>
</template>

<script setup>
/**
 * 加入我们视图组件 - MFD军事终端风格
 * @description 展示招募条件、加入流程和申请表单
 * @version 2.0 - Starship Ark视觉系统
 */

import { ref, reactive } from 'vue'
import { dataService } from '@/services'
import MFDPanel from '@/components/ui/MFDPanel.vue'
import TechButton from '@/components/ui/TechButton.vue'
import StatusIndicator from '@/components/ui/StatusIndicator.vue'
import PageHeader from '@/components/common/PageHeader.vue'

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

/** 申请表单数据 */
const form = reactive({
  name: '',
  email: '',
  discord: '',
  availability: '',
  experience: '',
  reason: ''
})

/** 表单验证错误信息 */
const errors = reactive({
  name: '',
  email: ''
})

/** 是否正在提交申请 */
const isSubmitting = ref(false)
/** 是否提交成功 */
const submitSuccess = ref(false)
/** 提交错误信息 */
const submitError = ref(null)

/**
 * 验证申请表单
 * @returns {boolean} 验证通过返回 true
 */
function validateForm() {
  let isValid = true

  // 重置错误信息
  errors.name = ''
  errors.email = ''

  // 姓名验证
  if (!form.name.trim()) {
    errors.name = '请输入姓名'
    isValid = false
  } else if (form.name.length > 50) {
    errors.name = '姓名不能超过 50 个字符'
    isValid = false
  }

  // 邮箱验证
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
 * 处理申请表单提交
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
 * 重置申请表单
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
/* ========== 页面容器 ========== */
.join-page {
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

/* ========== 区域标题 ========== */
.section-header-mfd {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
}

.section-id {
  color: var(--nebula-purple);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
}

.section-title {
  margin: 0;
  font-size: clamp(1.2rem, 2.5vw, 1.6rem);
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--text-primary);
}

/* ========== 招募协议 ========== */
.join-info {
  margin-bottom: 3rem;
}

.join-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.join-mfd-panel {
  transition: transform 0.3s ease;
}

.join-mfd-panel:hover {
  transform: translateY(-4px);
}

.join-content {
  padding: 0.5rem 0;
}

/* ========== 需求列表 ========== */
.requirement-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.requirement-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(10, 20, 35, 0.6);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.requirement-list li:hover {
  border-color: var(--nebula-purple);
  background: rgba(124, 58, 237, 0.05);
}

.check-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(124, 58, 237, 0.15);
  border: 1px solid var(--nebula-purple);
  border-radius: 3px;
  color: var(--nebula-violet);
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}

.item-text {
  flex: 1;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

/* ========== 流程时间线 ========== */
.process-timeline {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.process-step {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(10, 20, 35, 0.6);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.process-step:hover {
  border-color: var(--nebula-purple);
  background: rgba(124, 58, 237, 0.05);
}

.process-step--active {
  border-color: var(--nebula-purple);
  background: rgba(124, 58, 237, 0.08);
}

.step-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(124, 58, 237, 0.15);
  border: 1px solid var(--nebula-purple);
  border-radius: 3px;
  color: var(--nebula-violet);
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.step-connector {
  width: 1px;
  height: 20px;
  background: linear-gradient(to bottom, var(--nebula-purple), transparent);
}

.step-content {
  flex: 1;
  padding-top: 0.25rem;
}

.step-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

/* ========== 表单区域 ========== */
.form-section {
  margin-bottom: 3rem;
}

.form-mfd-panel {
  position: relative;
  overflow: hidden;
}

.form-content {
  padding: 0.5rem 0;
}

.form-subtitle {
  margin: 0 0 2rem;
  color: var(--text-muted);
  font-size: 0.9rem;
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
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
}

.required {
  color: var(--danger);
}

.form-input {
  padding: 0.75rem 1rem;
  background: rgba(10, 20, 35, 0.8);
  border: 1px solid var(--nebula-purple);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.95rem;
  font-family: var(--font-mono);
  transition: all var(--transition-fast);
  position: relative;
}

.form-input::placeholder {
  color: var(--text-muted);
  opacity: 0.6;
}

.form-input:focus {
  outline: none;
  border-color: var(--nebula-violet);
  box-shadow:
    0 0 0 2px rgba(124, 58, 237, 0.2),
    0 0 15px rgba(124, 58, 237, 0.15),
    inset 0 0 10px rgba(124, 58, 237, 0.05);
  animation: input-focus-pulse 2s ease-in-out infinite;
}

@keyframes input-focus-pulse {
  0%, 100% {
    box-shadow:
      0 0 0 2px rgba(124, 58, 237, 0.2),
      0 0 15px rgba(124, 58, 237, 0.15),
      inset 0 0 10px rgba(124, 58, 237, 0.05);
  }
  50% {
    box-shadow:
      0 0 0 2px rgba(124, 58, 237, 0.3),
      0 0 25px rgba(124, 58, 237, 0.25),
      inset 0 0 15px rgba(124, 58, 237, 0.08);
  }
}

.form-input.is-error {
  border-color: var(--danger);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2306b6d4' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
}

.form-error {
  font-size: 0.8rem;
  color: var(--danger);
}

.form-hint {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-align: right;
  letter-spacing: 0.05em;
}

.form-actions {
  margin-top: 1rem;
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

/* ========== 成功/错误消息 ========== */
.success-message,
.error-message {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: rgba(5, 12, 25, 0.98);
  backdrop-filter: blur(8px);
  text-align: center;
  padding: 2rem;
  z-index: 10;
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
  background: rgba(124, 58, 237, 0.15);
  border: 2px solid var(--nebula-violet);
  color: var(--nebula-violet);
}

.error-icon {
  background: rgba(239, 68, 68, 0.15);
  border: 2px solid var(--danger);
  color: var(--danger);
}

.success-message h3,
.error-message h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.success-message p,
.error-message p {
  margin: 0;
  color: var(--text-muted);
  max-width: 300px;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ========== 响应式适配 ========== */
@media (max-width: 768px) {
  .page-header-mfd {
    margin: -1rem -1rem 2rem;
    padding: 1.5rem;
  }

  .page-header-decoration {
    display: none;
  }

  .join-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    text-align: center;
  }
}
</style>
