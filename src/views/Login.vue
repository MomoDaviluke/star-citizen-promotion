<!--
  @file 登录视图组件
  @description 用户登录页面
  @module views/Login
-->

<template>
  <div class="login-page">
    <div class="login-card card">
      <div class="login-header">
        <span class="login-icon">◆</span>
        <h1>登录</h1>
        <p>登录您的账户以访问管理功能</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input
            v-model="form.email"
            type="email"
            class="form-input"
            :class="{ 'is-error': errors.email }"
            placeholder="请输入邮箱"
            required
          />
          <span v-if="errors.email" class="form-error">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <input
            v-model="form.password"
            type="password"
            class="form-input"
            :class="{ 'is-error': errors.password }"
            placeholder="请输入密码"
            required
          />
          <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
        </div>

        <div class="form-error" v-if="loginError">{{ loginError }}</div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="btn-loading">
            <span class="spinner"></span>
            登录中...
          </span>
          <span v-else>登录</span>
        </button>
      </form>

      <div class="login-footer">
        <p>还没有账户？</p>
        <RouterLink to="/register" class="link">立即注册</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '@/services'

const router = useRouter()
const route = useRoute()

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
    const response = await authService.login({
      email: form.email,
      password: form.password
    })

    if (response.success) {
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    } else {
      loginError.value = response.error || '登录失败，请检查邮箱和密码'
    }
  } catch (error) {
    loginError.value = error.message || '登录失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.login-card {
  width: 100%;
  max-width: 400px;
  animation: fadeInUp 0.5s ease both;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-icon {
  display: inline-block;
  font-size: 2rem;
  color: var(--accent-2);
  margin-bottom: 0.5rem;
}

.login-header h1 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.login-header p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 500;
}

.form-input {
  padding: 0.75rem 1rem;
  background: rgba(3, 8, 16, 0.6);
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--text);
  font-size: 0.95rem;
  transition: border-color var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--accent);
}

.form-input.is-error {
  border-color: var(--danger);
}

.form-error {
  font-size: 0.8rem;
  color: var(--danger);
}

.btn-block {
  width: 100%;
  padding: 0.85rem;
  font-size: 0.9rem;
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

.login-footer {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--line);
  text-align: center;
}

.login-footer p {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.link {
  color: var(--accent-2);
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
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
</style>
