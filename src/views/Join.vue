<!--
  @file 加入我们视图组件
  @description Cinematic Sci-Fi — 入队申请表单
  @version 10.0 - Cinematic Sci-Fi Spectacle
-->

<template>
  <div class="join-page">

    <section class="page-header">
      <div class="container">
        <span class="section-label">JOIN US</span>
        <h1>加入我们</h1>
        <p class="page-header__desc">成为星际公民战队的一员，与志同道合的飞行员一起探索宇宙。</p>
      </div>
    </section>

    <section class="join-content section">
      <div class="container">
        <div class="join-grid">
          <!-- Requirements Sidebar -->
          <div class="join-sidebar">
            <!-- Requirements Card -->
            <div class="bezel-card">
              <div class="bezel-card__inner">
                <h3 class="join-sidebar__title">招募要求</h3>
                <ul class="requirements-list">
                  <li v-for="req in requirements" :key="req" class="requirements-item">
                    <svg class="requirements-check" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    <span>{{ req }}</span>
                  </li>
                </ul>

                <div class="join-process">
                  <h4 class="join-sidebar__title">加入流程</h4>
                  <div class="process-flow">
                    <div v-for="(step, index) in processSteps" :key="step" class="process-step">
                      <div class="process-step__circle">{{ index + 1 }}</div>
                      <span class="process-step__text">{{ step }}</span>
                      <div v-if="index < processSteps.length - 1" class="process-step__line"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Application Form -->
          <div class="join-form-area">
            <div class="bezel-card">
              <div class="bezel-card__inner">
                <form
                  @submit.prevent="handleSubmit"
                  class="join-form"
                  :aria-busy="isSubmitting"
                >
                  <div v-if="aiPrefilled" class="ai-prefill-banner" role="status">
                    <span class="ai-prefill-banner__icon" aria-hidden="true">◆</span>
                    <span class="ai-prefill-banner__text">AI 招募官已根据对话为你预填游戏经验,请补充完善</span>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="join-name">姓名 <span class="required">*</span></label>
                    <input
                      id="join-name"
                      v-model="form.name"
                      class="form-input"
                      :class="{ 'form-input--error': errors.name, 'form-input--valid': isFieldValid('name') }"
                      :aria-invalid="errors.name ? 'true' : 'false'"
                      :aria-describedby="errors.name ? 'join-name-error' : undefined"
                      placeholder="你的游戏内名称"
                      required
                      maxlength="50"
                      @blur="markTouched('name')"
                    />
                    <span v-if="errors.name" id="join-name-error" class="form-error" role="alert">{{ errors.name }}</span>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="join-email">邮箱 <span class="required">*</span></label>
                    <input
                      id="join-email"
                      v-model="form.email"
                      type="email"
                      class="form-input"
                      :class="{ 'form-input--error': errors.email, 'form-input--valid': isFieldValid('email') }"
                      :aria-invalid="errors.email ? 'true' : 'false'"
                      :aria-describedby="errors.email ? 'join-email-error' : undefined"
                      placeholder="your@email.com"
                      required
                      @blur="markTouched('email')"
                    />
                    <span v-if="errors.email" id="join-email-error" class="form-error" role="alert">{{ errors.email }}</span>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="join-discord">Discord</label>
                    <input
                      id="join-discord"
                      v-model="form.discord"
                      class="form-input"
                      :class="{ 'form-input--error': errors.discord, 'form-input--valid': isFieldValid('discord') }"
                      :aria-invalid="errors.discord ? 'true' : 'false'"
                      :aria-describedby="errors.discord ? 'join-discord-error' : undefined"
                      placeholder="用户名#0000"
                      maxlength="50"
                      @blur="markTouched('discord')"
                    />
                    <span v-if="errors.discord" id="join-discord-error" class="form-error" role="alert">{{ errors.discord }}</span>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="join-experience">游戏经验</label>
                    <textarea
                      id="join-experience"
                      v-model="form.experience"
                      class="form-input form-textarea"
                      placeholder="简述你的星际公民游戏经验..."
                      rows="4"
                      maxlength="500"
                    ></textarea>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="join-reason">加入原因</label>
                    <textarea
                      id="join-reason"
                      v-model="form.reason"
                      class="form-input form-textarea"
                      placeholder="你为什么想加入我们？"
                      rows="3"
                      maxlength="500"
                    ></textarea>
                  </div>

                  <!-- 提交成功完整面板 -->
                  <Transition name="fade">
                    <div v-if="submitSuccess" class="success-panel" role="status" aria-live="polite">
                      <div class="success-panel__icon" aria-hidden="true">
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="32" cy="32" r="28" opacity="0.3"/>
                          <path d="M20 32l8 8 16-16" stroke-width="3"/>
                        </svg>
                      </div>
                      <h3 class="success-panel__title">申请已提交</h3>
                      <p class="success-panel__desc">我们将在 1-3 天内通过邮件审核回复。在此期间，欢迎加入我们的 Discord 频道了解战队动态。</p>
                      <div class="success-panel__next-steps">
                        <div class="success-panel__step">
                          <span class="success-panel__step-num font-data">01</span>
                          <span class="success-panel__step-text">等待邮件审核结果</span>
                        </div>
                        <div class="success-panel__step">
                          <span class="success-panel__step-num font-data">02</span>
                          <span class="success-panel__step-text">加入 Discord 频道互动</span>
                        </div>
                        <div class="success-panel__step">
                          <span class="success-panel__step-num font-data">03</span>
                          <span class="success-panel__step-text">参加新人试飞训练</span>
                        </div>
                      </div>
                      <div class="success-panel__actions">
                        <a href="#" class="success-panel__btn-primary">加入 Discord</a>
                        <button class="success-panel__btn-secondary" @click="resetForm">重新填写</button>
                      </div>
                    </div>
                  </Transition>

                  <!-- 错误消息（保持简单） -->
                  <Transition name="fade">
                    <div
                      v-if="submitMessage && !submitSuccess"
                      class="form-message form-message--error"
                      role="alert"
                      aria-live="polite"
                    >
                      {{ submitMessage }}
                    </div>
                  </Transition>

                  <button
                    type="submit"
                    class="join-submit"
                    :disabled="isSubmitting"
                    :aria-label="isSubmitting ? '正在提交申请' : '提交申请'"
                  >
                    {{ isSubmitting ? '提交中...' : '提交申请' }}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { dataService } from '@/services/dataService'
import { trackEvent } from '@/services/analyticsService'

const route = useRoute()

// AI 画像标签映射(与 ProfilePanel.vue 一致)
const styleLabels = {
  pvp: 'PVP 战斗',
  trade: '贸易货运',
  exploration: '探索',
  mining: '矿业',
}

const skillLabels = {
  beginner: '新手',
  intermediate: '进阶',
  veteran: '老手',
}

const aiPrefilled = ref(false)

const requirements = ref([
  '年满 16 周岁',
  '拥有星际公民游戏账号',
  '有可用的麦克风',
  '能使用 Discord 进行语音通讯',
  '每周至少在线 8 小时',
  '遵守战队规章制度',
])

const processSteps = ref([
  '提交申请表单',
  '指挥官审核（1-3 天）',
  'Discord 面试沟通',
  '试飞期（2 周）',
  '正式入队',
])

const form = reactive({ name: '', email: '', discord: '', experience: '', reason: '' })
const errors = reactive({ name: '', email: '', discord: '' })
const touched = reactive({ name: false, email: false, discord: false })
const isSubmitting = ref(false)
const submitMessage = ref('')
const submitSuccess = ref(false)

/**
 * AI 招募官画像预填
 * @description 从路由 query.ai_profile 读取 JSON 画像,预填到 experience 字段
 *              解析失败静默忽略,不阻塞正常表单流程
 */
onMounted(() => {
  const aiProfile = route.query.ai_profile
  if (!aiProfile || typeof aiProfile !== 'string') return

  try {
    const profile = JSON.parse(decodeURIComponent(aiProfile))

    // 构建 experience 摘要
    const lines = ['[AI 招募官画像]']
    if (profile.skillLevel) {
      lines.push(`技能等级:${skillLabels[profile.skillLevel] || profile.skillLevel}`)
    }
    if (profile.playStyle && Array.isArray(profile.playStyle) && profile.playStyle.length) {
      const styles = profile.playStyle.map(s => styleLabels[s] || s).join('、')
      lines.push(`玩法偏好:${styles}`)
    }
    if (profile.timeCommit) {
      lines.push(`时间投入:${profile.timeCommit}`)
    }
    if (profile.shipPref && Array.isArray(profile.shipPref) && profile.shipPref.length) {
      lines.push(`拥有舰船:${profile.shipPref.join('、')}`)
    }

    // 只有有实质内容时才预填(超过标题行)
    if (lines.length > 1) {
      form.experience = lines.join('\n')
      aiPrefilled.value = true
      // 转化埋点：AI 画像预填成功
      trackEvent('recruiter_profile_prefill', { fields: lines.length - 1 })
    }
  } catch {
    // 忽略解析错误,不预填
  }

  // 转化埋点：进入申请表（漏斗起点）
  trackEvent('application_form_start')
})

/**
 * 判断字段是否通过验证（用于显示成功态）
 */
function isFieldValid(field) {
  if (!touched[field]) return false
  if (errors[field]) return false
  if (field === 'name') return form.name.trim().length > 0
  if (field === 'email') return isValidEmail(form.email)
  if (field === 'discord') return !form.discord.trim() || /^[^#]+(#\d{4})?$/.test(form.discord.trim())
  return false
}

/** 标记字段已交互 */
function markTouched(field) {
  touched[field] = true
}

/**
 * 校验邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * 客户端表单校验
 * @returns {boolean}
 */
function validateForm() {
  errors.name = ''
  errors.email = ''
  errors.discord = ''

  if (!form.name.trim()) {
    errors.name = '请输入姓名'
  }

  if (!form.email.trim()) {
    errors.email = '请输入邮箱'
  } else if (!isValidEmail(form.email)) {
    errors.email = '请输入有效的邮箱地址'
  }

  if (form.discord.trim() && !/^[^#]+(#\d{4})?$/.test(form.discord.trim())) {
    errors.discord = 'Discord 格式不正确'
  }

  return !errors.name && !errors.email && !errors.discord
}

async function handleSubmit() {
  submitMessage.value = ''

  if (!validateForm()) {
    submitSuccess.value = false
    return
  }

  isSubmitting.value = true
  try {
    await dataService.submitApplication(form)
    submitSuccess.value = true
    submitMessage.value = '申请提交成功！我们将在 1-3 天内审核。'
    // 转化埋点：申请提交成功
    trackEvent('application_submit_success', { experience: form.experience, aiPrefilled })
    Object.assign(form, { name: '', email: '', discord: '', experience: '', reason: '' })
  } catch (err) {
    submitSuccess.value = false
    submitMessage.value = err.message || '提交失败，请稍后重试'
    // 转化埋点：申请提交失败
    trackEvent('application_submit_fail', { reason: err.message || 'unknown' })
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 重置表单状态
 */
function resetForm() {
  Object.assign(form, { name: '', email: '', discord: '', experience: '', reason: '' })
  Object.keys(touched).forEach(key => { touched[key] = false })
  submitSuccess.value = false
  submitMessage.value = ''
}
</script>

<style scoped>
.page-header {
  padding: var(--space-16) 0 var(--space-8);
}

.page-header h1 {
  font-size: var(--text-4xl);
  margin-top: var(--space-2);
  letter-spacing: -0.02em;
}

.page-header__desc {
  font-size: var(--text-md);
  color: var(--color-text-body);
  margin-top: var(--space-2);
}

/* Double-Bezel Glass Card */
.bezel-card {
  background: var(--color-bg-glass);
  border: 1px solid var(--color-border-hover);
  border-radius: var(--radius-2xl);
  padding: 6px;
}

.bezel-card__inner {
  background: var(--color-bg-deep);
  border-radius: calc(var(--radius-2xl) - 4px);
  padding: var(--space-8);
}

/* Grid Layout — 35/65 */
.join-grid {
  display: grid;
  grid-template-columns: 35fr 65fr;
  gap: var(--space-8);
  align-items: start;
}

/* Sidebar */
.join-sidebar__title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--color-text-heading);
  margin-bottom: var(--space-5);
}

/* Requirements */
.requirements-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.requirements-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: 1rem;
  color: var(--color-text-body);
  line-height: 1.5;
}

.requirements-check {
  color: var(--color-accent);
  flex-shrink: 0;
  filter: drop-shadow(0 0 6px rgba(var(--raw-cyan-rgb), 0.4));
}

/* Process Flow */
.join-process {
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border);
}

.process-flow {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}

.process-step {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  position: relative;
  padding: var(--space-3) 0;
}

.process-step__circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-data);
  font-size: var(--text-sm);
  font-weight: 700;
  color: #050508;
  background: var(--color-highlight);
  box-shadow: 0 0 16px rgba(var(--raw-amber-rgb), 0.35);
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.process-step__text {
  font-size: var(--text-sm);
  color: var(--color-text-body);
  line-height: 1.4;
}

.process-step__line {
  position: absolute;
  left: 23px;
  top: 48px;
  bottom: -12px;
  width: 2px;
  background: linear-gradient(180deg, rgba(var(--raw-amber-rgb), 0.4), rgba(var(--raw-amber-rgb), 0.1));
  z-index: 1;
}

.process-step:last-child .process-step__line {
  display: none;
}

/* Form Area */
.join-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  font-family: var(--font-data);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-label);
}

.required { color: var(--color-status-danger); }

.form-input--error {
  border-color: var(--color-status-danger) !important;
  box-shadow: 0 0 0 1px var(--color-status-danger), 0 0 12px rgba(239, 68, 68, 0.1) !important;
  animation: input-shake 0.3s ease-in-out;
}

@keyframes input-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* 字段验证通过：青色边框 + 微光 */
.form-input--valid {
  border-color: rgba(34, 197, 94, 0.4) !important;
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.15), 0 0 12px rgba(34, 197, 94, 0.06) !important;
}

.form-error {
  font-size: var(--text-xs);
  color: var(--color-status-danger);
  padding-left: 2px;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

/* AI 预填提示横幅(全息风格,与 AI 组件视觉一致) */
.ai-prefill-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  margin-bottom: 1rem;
  background: var(--color-accent-muted, rgba(0, 200, 255, 0.08));
  border: 1px solid var(--color-border-accent, rgba(0, 200, 255, 0.3));
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--color-text-accent, rgba(0, 255, 200, 0.9));
  font-family: var(--font-data, monospace);
}

.ai-prefill-banner__icon {
  font-size: 0.9rem;
  color: var(--color-accent, #0ff);
}

.ai-prefill-banner__text {
  flex: 1;
}

/* Submit Button — Amber Pill */
.join-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 1rem 2.5rem;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: var(--color-highlight);
  color: #050508;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  margin-top: var(--space-2);
  transition: all var(--duration-fast) var(--ease-out);
}

.join-submit:hover {
  background: var(--color-highlight-bright);
  transform: translateY(-1px);
  box-shadow: var(--glow-amber);
}

.join-submit:active {
  transform: translateY(0);
}

.join-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Form Messages */
.form-message {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.form-message--success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: var(--color-status-online);
}

.form-message--error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--color-status-danger);
}

.fade-enter-active, .fade-leave-active { transition: opacity var(--duration-fast); }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .join-grid { grid-template-columns: 1fr; }
  .page-header { padding: var(--space-10) 0 var(--space-6); }
  .bezel-card__inner { padding: var(--space-5); }
}

/* ═══ 提交成功完整面板 ═══ */
.success-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-8) var(--space-6);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, transparent 60%);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: var(--radius-xl);
}

.success-panel__icon {
  color: rgb(134, 239, 172);
  margin-bottom: var(--space-4);
  animation: success-pop 0.5s var(--motion-ease-smooth);
}

@keyframes success-pop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.success-panel__title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-heading);
  margin-bottom: var(--space-2);
}

.success-panel__desc {
  font-size: var(--text-sm);
  color: var(--color-text-body);
  line-height: 1.7;
  max-width: 420px;
  margin-bottom: var(--space-6);
}

.success-panel__next-steps {
  display: flex;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
  justify-content: center;
}

.success-panel__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.success-panel__step-num {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-accent);
  opacity: 0.6;
}

.success-panel__step-text {
  font-size: var(--text-xs);
  color: var(--color-text-dim);
  letter-spacing: 0.05em;
}

.success-panel__actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
}

.success-panel__btn-primary {
  display: inline-flex;
  align-items: center;
  padding: var(--space-3) var(--space-6);
  background: var(--color-accent);
  color: var(--color-bg-deep);
  font-weight: 600;
  font-size: var(--text-sm);
  border-radius: var(--radius-md);
  transition: all var(--motion-duration-normal) var(--motion-ease-smooth);
}

.success-panel__btn-primary:hover {
  background: var(--color-accent-bright);
  box-shadow: 0 0 24px rgba(var(--raw-cyan-rgb), 0.4);
  transform: translateY(-2px);
}

.success-panel__btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: var(--space-3) var(--space-6);
  background: transparent;
  border: 1px solid var(--color-border-hover);
  color: var(--color-text-heading);
  font-weight: 500;
  font-size: var(--text-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--motion-duration-normal) var(--motion-ease-smooth);
}

.success-panel__btn-secondary:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

@media (prefers-reduced-motion: reduce) {
  .success-panel__icon {
    animation: none;
  }
}
</style>
