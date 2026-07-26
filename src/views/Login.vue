<!--
  @file 登录视图组件 - Cinematic Sci-Fi Spectacle
  @description 全息访问终端，用户登录页面
  @version 10.0 - Cinematic Sci-Fi Spectacle
-->

<template>
  <div class="login-page">
    <div class="login-stage">
      <div class="bezel-card login-card">
        <div class="bezel-card__inner">
          <!-- Terminal Status -->
          <div class="terminal-status">
            <span class="terminal-status__dot"></span>
            <span class="terminal-status__text font-data">SECURE LINK</span>
          </div>

          <!-- Terminal Identity -->
          <div class="login-id">
            <svg class="login-id__shield" width="32" height="32" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 3L4 7.5V13C4 19.075 8.16 24.69 14 26C19.84 24.69 24 19.075 24 13V7.5L14 3Z"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linejoin="round"
              />
              <path
                d="M14 3L4 7.5V13C4 19.075 8.16 24.69 14 26C19.84 24.69 24 19.075 24 13V7.5L14 3Z"
                fill="currentColor"
                fill-opacity="0.08"
              />
              <path
                d="M11 14L13.5 16.5L18 11"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span class="login-id__text font-data">ACCESS TERMINAL v6.0</span>
          </div>

          <form
            @submit.prevent="handleLogin"
            class="login-form"
            :aria-busy="isSubmitting"
          >
            <div class="login-form__group">
              <label for="email" class="login-form__label font-data">EMAIL</label>
              <input
                id="email"
                name="email"
                v-model="form.email"
                type="email"
                class="holo-input"
                :class="{ 'holo-input--error': errors.email }"
                :aria-invalid="errors.email ? 'true' : 'false'"
                :aria-describedby="errors.email ? 'email-error' : undefined"
                placeholder="请输入邮箱"
                required
              />
              <span v-if="errors.email" id="email-error" class="login-form__error" role="alert">{{ errors.email }}</span>
            </div>

            <div class="login-form__group">
              <label for="password" class="login-form__label font-data">PASSWORD</label>
              <input
                id="password"
                name="password"
                v-model="form.password"
                type="password"
                class="holo-input"
                :class="{ 'holo-input--error': errors.password }"
                :aria-invalid="errors.password ? 'true' : 'false'"
                :aria-describedby="errors.password ? 'password-error' : undefined"
                placeholder="请输入密码"
                required
              />
              <span v-if="errors.password" id="password-error" class="login-form__error" role="alert">{{ errors.password }}</span>
            </div>

            <!-- Global Error -->
            <Transition name="holo-fade">
              <div
                v-if="loginError"
                class="login-alert"
                role="alert"
                aria-live="polite"
              >
                <svg class="login-alert__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 4.5V8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <circle cx="8" cy="11.5" r="0.75" fill="currentColor"/>
                </svg>
                <span class="login-alert__text">{{ loginError }}</span>
              </div>
            </Transition>

            <button
              type="submit"
              class="login-submit"
              :disabled="isSubmitting"
              :aria-label="isSubmitting ? '正在验证登录信息' : '登录'"
            >
              <span v-if="isSubmitting" class="btn-loading">
                <span class="spinner"></span>
                <span class="font-data">验证中...</span>
              </span>
              <span v-else class="btn-content">
                <span class="font-data">登录</span>
                <span class="btn-arrow">&#8594;</span>
              </span>
            </button>
          </form>

          <div class="login-footer">
            <span class="login-footer__text">还没有账户？</span>
            <RouterLink to="/register" class="login-footer__link">立即注册</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: ''
})

const errors = reactive({
  email: '',
  password: ''
})

const isSubmitting = ref(false)
const loginError = ref('')

/**
 * 校验登录后的跳转目标，防止 Open Redirect 攻击
 * @description 仅允许以 / 开头的站内相对路径，拒绝 // 协议头、javascript: 等危险值
 * @param {unknown} path - 路由查询参数中的 redirect
 * @returns {boolean}
 */
function isSafeRedirect(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !path.includes(':')
}

async function handleLogin() {
  errors.email = ''
  errors.password = ''
  loginError.value = ''

  if (!form.email) {
    errors.email = '请输入邮箱'
    return
  }
  if (!form.password) {
    errors.password = '请输入密码'
    return
  }

  isSubmitting.value = true

  try {
    await authStore.login({
      email: form.email,
      password: form.password
    })

    // 对 redirect 参数做白名单校验，防止 Open Redirect
    const redirect = isSafeRedirect(route.query.redirect) ? route.query.redirect : '/'
    await router.push(redirect)
  } catch (error) {
    loginError.value = error.message || '登录失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
}

.login-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
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
  position: relative;
}

.login-card {
  width: 100%;
  max-width: 480px;
}

/* Terminal Status */
.terminal-status {
  position: absolute;
  top: var(--space-4);
  right: var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  z-index: 5;
}

.terminal-status__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-status-online);
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
  animation: breathe 2s ease-in-out infinite;
}

.terminal-status__text {
  font-size: var(--text-xs);
  letter-spacing: 0.15em;
  color: var(--color-status-online);
  text-transform: uppercase;
  opacity: 0.7;
}

@keyframes breathe {
  0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(34, 197, 94, 0.6); }
  50% { opacity: 0.5; box-shadow: 0 0 4px rgba(34, 197, 94, 0.3); }
}

/* Terminal Identity */
.login-id {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.login-id__shield {
  color: var(--color-accent);
  filter: drop-shadow(0 0 6px rgba(var(--raw-cyan-rgb), 0.3));
  flex-shrink: 0;
}

.login-id__text {
  font-size: var(--text-xs);
  letter-spacing: 0.18em;
  color: var(--color-text-dim);
  text-transform: uppercase;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.login-form__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.login-form__label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-label);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.login-form__error {
  font-size: var(--text-xs);
  color: var(--color-status-danger);
  padding-left: 2px;
}

/* Holo Input Error State */
.holo-input--error {
  border-bottom-color: var(--color-status-danger) !important;
  box-shadow: 0 1px 0 0 var(--color-status-danger), 0 0 12px rgba(239, 68, 68, 0.1) !important;
}

/* Error Alert — Amber */
.login-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: rgba(var(--raw-amber-rgb), 0.08);
  border: 1px solid rgba(var(--raw-amber-rgb), 0.2);
  border-left: 2px solid rgba(var(--raw-amber-rgb), 0.6);
  border-radius: var(--radius-sm);
}

.login-alert__icon {
  flex-shrink: 0;
  color: var(--color-highlight);
  margin-top: 1px;
}

.login-alert__text {
  font-size: var(--text-sm);
  color: var(--color-highlight);
  line-height: 1.5;
}

/* Submit Button — Amber Pill */
.login-submit {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.login-submit:hover {
  background: var(--color-highlight-bright);
  transform: translateY(-1px);
  box-shadow: var(--glow-amber);
}

.login-submit:active {
  transform: translateY(0);
}

.login-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(5, 5, 8, 0.25);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.btn-arrow {
  transition: transform var(--duration-fast);
}

.login-submit:hover .btn-arrow {
  transform: translateX(4px);
}

/* Footer */
.login-footer {
  margin-top: var(--space-8);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.login-footer__text {
  font-size: var(--text-sm);
  color: var(--color-text-dim);
}

.login-footer__link {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-accent);
  letter-spacing: 0.02em;
  transition: color var(--duration-fast), text-shadow var(--duration-normal);
}

.login-footer__link:hover {
  color: var(--color-accent-bright);
  text-shadow: 0 0 12px rgba(var(--raw-cyan-rgb), 0.35);
}

/* Transitions */
.holo-fade-enter-active,
.holo-fade-leave-active {
  transition: opacity 0.3s ease;
}

.holo-fade-enter-from,
.holo-fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .terminal-status__text {
    display: none;
  }

  .bezel-card__inner {
    padding: var(--space-6);
  }

  /* iOS 防止输入框聚焦缩放 */
  .holo-input {
    font-size: 16px;
    min-height: 44px;
  }

  .login-submit {
    min-height: 44px;
  }
}

@media (max-width: 480px) {
  .bezel-card__inner {
    padding: var(--space-5);
  }

  /* 窄屏时增加底部 safe-area 间距，避免被 home indicator 遮挡 */
  .login-page {
    padding-bottom: calc(var(--space-8) + env(safe-area-inset-bottom, 0px));
  }
}
</style>
