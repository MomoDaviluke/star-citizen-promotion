<!--
  @file 注册视图组件
  @description 用户注册页面
  @version 9.0 - Premium Restraint
-->

<template>
  <div class="register-page">
    <div class="auth-container">
      <div class="auth-card card">
        <div class="auth-card__header">
          <span class="section-label">REGISTER</span>
          <h2>创建账户</h2>
        </div>

        <form
          @submit.prevent="handleRegister"
          class="auth-form"
          :aria-busy="isSubmitting"
        >
          <div class="form-group">
            <label class="form-label" for="username">用户名</label>
            <input
              id="username"
              v-model="form.username"
              class="form-input"
              :class="{ 'form-input--error': errors.username }"
              :aria-invalid="errors.username ? 'true' : 'false'"
              :aria-describedby="errors.username ? 'username-error' : undefined"
              placeholder="选择一个用户名"
              required
              maxlength="30"
            />
            <span v-if="errors.username" id="username-error" class="form-error" role="alert">{{ errors.username }}</span>
          </div>
          <div class="form-group">
            <label class="form-label" for="email">邮箱</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="form-input"
              :class="{ 'form-input--error': errors.email }"
              :aria-invalid="errors.email ? 'true' : 'false'"
              :aria-describedby="errors.email ? 'email-error' : undefined"
              placeholder="your@email.com"
              required
            />
            <span v-if="errors.email" id="email-error" class="form-error" role="alert">{{ errors.email }}</span>
          </div>
          <div class="form-group">
            <label class="form-label" for="password">密码</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="form-input"
              :class="{ 'form-input--error': errors.password }"
              :aria-invalid="errors.password ? 'true' : 'false'"
              :aria-describedby="errors.password ? 'password-error' : undefined"
              placeholder="至少 8 位字符"
              required
              minlength="8"
            />
            <span v-if="errors.password" id="password-error" class="form-error" role="alert">{{ errors.password }}</span>
          </div>
          <div class="form-group">
            <label class="form-label" for="confirmPassword">确认密码</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              class="form-input"
              :class="{ 'form-input--error': errors.confirmPassword }"
              :aria-invalid="errors.confirmPassword ? 'true' : 'false'"
              :aria-describedby="errors.confirmPassword ? 'confirmPassword-error' : undefined"
              placeholder="再次输入密码"
              required
            />
            <span v-if="errors.confirmPassword" id="confirmPassword-error" class="form-error" role="alert">{{ errors.confirmPassword }}</span>
          </div>

          <Transition name="fade">
            <div
              v-if="errorMessage"
              class="form-message form-message--error"
              role="alert"
              aria-live="polite"
            >{{ errorMessage }}</div>
          </Transition>

          <button
            type="submit"
            class="btn-primary form-submit"
            :disabled="isSubmitting"
            :aria-label="isSubmitting ? '正在创建账户' : '注册'"
          >
            {{ isSubmitting ? '注册中...' : '注册' }}
          </button>
        </form>

        <div class="auth-card__footer">
          <span>已有账户？</span>
          <RouterLink to="/login">立即登录</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const form = reactive({ username: '', email: '', password: '', confirmPassword: '' })
const errors = reactive({ username: '', email: '', password: '', confirmPassword: '' })
const isSubmitting = ref(false)
const errorMessage = ref('')

async function handleRegister() {
  errorMessage.value = ''
  errors.username = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''

  if (!form.username.trim()) {
    errors.username = '请输入用户名'
    return
  }
  if (!form.email.trim()) {
    errors.email = '请输入邮箱'
    return
  }
  if (!form.password) {
    errors.password = '请输入密码'
    return
  }
  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
    return
  }
  isSubmitting.value = true
  try {
    await authStore.register({ username: form.username, email: form.email, password: form.password })
    router.push('/')
  } catch (err) {
    errorMessage.value = err.message || '注册失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.register-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px);
  padding: var(--space-8) 0;
}

.auth-container {
  width: 100%;
  max-width: 440px;
}

.auth-card {
  padding: var(--space-8);
}

.auth-card__header {
  margin-bottom: var(--space-6);
}

.auth-card__header h2 {
  margin-top: var(--space-2);
  margin-bottom: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-label);
}

.form-submit {
  width: 100%;
  margin-top: var(--space-2);
}

.form-message {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.form-message--error {
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.2);
  color: var(--color-status-danger);
}

.auth-card__footer {
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-subtle);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-label);
  display: flex;
  justify-content: center;
  gap: var(--space-2);
}

.auth-card__footer a {
  color: var(--color-accent);
  font-weight: 500;
}

.fade-enter-active, .fade-leave-active { transition: opacity var(--duration-fast); }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
