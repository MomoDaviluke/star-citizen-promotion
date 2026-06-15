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
                <form @submit.prevent="handleSubmit" class="join-form">
                  <div class="form-group">
                    <label class="form-label">姓名 <span class="required">*</span></label>
                    <input v-model="form.name" class="form-input" placeholder="你的游戏内名称" required maxlength="50" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">邮箱 <span class="required">*</span></label>
                    <input v-model="form.email" type="email" class="form-input" placeholder="your@email.com" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Discord</label>
                    <input v-model="form.discord" class="form-input" placeholder="用户名#0000" maxlength="50" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">游戏经验</label>
                    <textarea v-model="form.experience" class="form-input form-textarea" placeholder="简述你的星际公民游戏经验..." rows="4" maxlength="500"></textarea>
                  </div>
                  <div class="form-group">
                    <label class="form-label">加入原因</label>
                    <textarea v-model="form.reason" class="form-input form-textarea" placeholder="你为什么想加入我们？" rows="3" maxlength="500"></textarea>
                  </div>

                  <Transition name="fade">
                    <div v-if="submitMessage" class="form-message" :class="submitSuccess ? 'form-message--success' : 'form-message--error'">
                      {{ submitMessage }}
                    </div>
                  </Transition>

                  <button type="submit" class="join-submit" :disabled="isSubmitting">
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
import { ref, reactive } from 'vue'

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
const isSubmitting = ref(false)
const submitMessage = ref('')
const submitSuccess = ref(false)

async function handleSubmit() {
  isSubmitting.value = true
  submitMessage.value = ''
  try {
    const { httpClient } = await import('@/services/http')
    await httpClient.post('/api/applications', form)
    submitSuccess.value = true
    submitMessage.value = '申请提交成功！我们将在 1-3 天内审核。'
    Object.assign(form, { name: '', email: '', discord: '', experience: '', reason: '' })
  } catch (err) {
    submitSuccess.value = false
    submitMessage.value = err.message || '提交失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
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
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
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

.form-textarea {
  resize: vertical;
  min-height: 100px;
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
</style>
