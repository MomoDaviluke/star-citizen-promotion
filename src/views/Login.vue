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
/**
 * 登录视图组件逻辑
 * @description 处理用户登录表单验证、提交和状态管理
 */

import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '@/services'

/** Vue Router 实例，用于页面导航 */
const router = useRouter()
/** 当前路由对象，用于获取查询参数 */
const route = useRoute()

/**
 * 登录表单数据
 * @property {string} email - 用户邮箱
 * @property {string} password - 用户密码
 */
const form = reactive({
  email: '',
  password: ''
})

/**
 * 表单错误信息
 * @property {string} email - 邮箱字段错误提示
 * @property {string} password - 密码字段错误提示
 */
const errors = reactive({
  email: '',
  password: ''
})

/** 是否正在提交登录请求 */
const isSubmitting = ref(false)
/** 登录错误提示信息 */
const loginError = ref('')

/**
 * 处理登录表单提交
 * @description 验证表单数据，调用认证服务进行登录，成功后跳转到目标页面
 * @async
 */
async function handleLogin() {
  // 重置错误信息
  errors.email = ''
  errors.password = ''
  loginError.value = ''

  // 前端基础验证：检查必填字段
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
    // 调用认证服务登录接口
    const response = await authService.login({
      email: form.email,
      password: form.password
    })

    // 登录成功处理：获取重定向地址并跳转
    if (response.success) {
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    } else {
      // 登录失败：显示服务端返回的错误信息
      loginError.value = response.error || '登录失败，请检查邮箱和密码'
    }
  } catch (error) {
    // 网络或服务器异常处理
    loginError.value = error.message || '登录失败，请稍后重试'
  } finally {
    // 无论成功失败，重置提交状态
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
