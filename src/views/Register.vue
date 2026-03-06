<!--
  @file 注册视图组件
  @description 用户注册页面
  @module views/Register
-->

<template>
  <div class="register-page">
    <div class="register-card card">
      <div class="register-header">
        <span class="register-icon">◆</span>
        <h1>注册</h1>
        <p>创建您的账户以加入我们的团队</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input
            v-model="form.username"
            type="text"
            class="form-input"
            :class="{ 'is-error': errors.username }"
            placeholder="请输入用户名（3-20字符）"
            required
          />
          <span v-if="errors.username" class="form-error">{{ errors.username }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input
            v-model="form.email"
            type="email"
            class="form-input"
            :class="{ 'is-error': errors.email }"
            placeholder="请输入邮箱地址"
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
            placeholder="请输入密码（至少8位）"
            required
          />
          <span class="form-hint">至少8个字符，包含大小写字母和数字</span>
          <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">确认密码</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            class="form-input"
            :class="{ 'is-error': errors.confirmPassword }"
            placeholder="请再次输入密码"
            required
          />
          <span v-if="errors.confirmPassword" class="form-error">{{ errors.confirmPassword }}</span>
        </div>

        <div class="form-error" v-if="registerError">{{ registerError }}</div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="btn-loading">
            <span class="spinner"></span>
            注册中...
          </span>
          <span v-else>注册</span>
        </button>
      </form>

      <div class="register-footer">
        <p>已有账户？</p>
        <RouterLink to="/login" class="link">立即登录</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services'

const router = useRouter()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const isSubmitting = ref(false)
const registerError = ref('')

function validateForm() {
  let isValid = true

  errors.username = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''

  if (!form.username) {
    errors.username = '请输入用户名'
    isValid = false
  } else if (form.username.length < 3 || form.username.length > 20) {
    errors.username = '用户名长度应为3-20个字符'
    isValid = false
  }

  if (!form.email) {
    errors.email = '请输入邮箱'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = '请输入有效的邮箱地址'
    isValid = false
  }

  if (!form.password) {
    errors.password = '请输入密码'
    isValid = false
  } else if (form.password.length < 8) {
    errors.password = '密码长度至少为8个字符'
    isValid = false
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
    errors.password = '密码需包含大小写字母和数字'
    isValid = false
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = '请确认密码'
    isValid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
    isValid = false
  }

  return isValid
}

async function handleRegister() {
  registerError.value = ''

  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    const response = await authService.register({
      username: form.username,
      email: form.email,
      password: form.password
    })

    if (response.success) {
      router.push('/login?registered=true')
    } else {
      registerError.value = response.error || '注册失败，请稍后重试'
    }
  } catch (error) {
    registerError.value = error.message || '注册失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.register-card {
  width: 100%;
  max-width: 400px;
  animation: fadeInUp 0.5s ease both;
}

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.register-icon {
  display: inline-block;
  font-size: 2rem;
  color: var(--accent-2);
  margin-bottom: 0.5rem;
}

.register-header h1 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.register-header p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.register-form {
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

.form-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
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

.register-footer {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--line);
  text-align: center;
}

.register-footer p {
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
