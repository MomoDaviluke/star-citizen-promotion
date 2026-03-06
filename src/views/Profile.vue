<!--
  @file 个人中心视图组件
  @description 用户个人资料管理和设置
  @module views/Profile
-->

<template>
  <PageTitle
    title="个人中心"
    subtitle="管理您的账户信息和偏好设置"
  />

  <div class="profile-grid">
    <section class="card profile-card">
      <div class="card-header">
        <h3>基本信息</h3>
      </div>
      <form @submit.prevent="updateProfile" class="profile-form">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input
            v-model="profile.username"
            type="text"
            class="form-input"
            placeholder="请输入用户名"
          />
        </div>
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input
            v-model="profile.email"
            type="email"
            class="form-input"
            disabled
          />
          <span class="form-hint">邮箱不可修改</span>
        </div>
        <div class="form-group">
          <label class="form-label">头像 URL</label>
          <input
            v-model="profile.avatar"
            type="url"
            class="form-input"
            placeholder="请输入头像图片地址"
          />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="isUpdating">
            {{ isUpdating ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </form>
    </section>

    <section class="card security-card">
      <div class="card-header">
        <h3>安全设置</h3>
      </div>
      <form @submit.prevent="changePassword" class="security-form">
        <div class="form-group">
          <label class="form-label">当前密码</label>
          <input
            v-model="passwordForm.currentPassword"
            type="password"
            class="form-input"
            placeholder="请输入当前密码"
          />
        </div>
        <div class="form-group">
          <label class="form-label">新密码</label>
          <input
            v-model="passwordForm.newPassword"
            type="password"
            class="form-input"
            placeholder="请输入新密码"
          />
          <span class="form-hint">至少8个字符，包含大小写字母和数字</span>
        </div>
        <div class="form-group">
          <label class="form-label">确认新密码</label>
          <input
            v-model="passwordForm.confirmPassword"
            type="password"
            class="form-input"
            placeholder="请再次输入新密码"
          />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="isChangingPassword">
            {{ isChangingPassword ? '修改中...' : '修改密码' }}
          </button>
        </div>
      </form>
    </section>

    <section class="card danger-zone">
      <div class="card-header">
        <h3>危险操作</h3>
      </div>
      <div class="danger-content">
        <p>注销登录将清除您的会话信息，需要重新登录才能访问需要认证的功能。</p>
        <button class="btn btn-danger" @click="handleLogout">
          退出登录
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import PageTitle from '@/components/common/PageTitle.vue'
import { authService } from '@/services'

const profile = reactive({
  username: '',
  email: '',
  avatar: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const isUpdating = ref(false)
const isChangingPassword = ref(false)

async function loadProfile() {
  const user = authService.getUser()
  if (user) {
    profile.username = user.username || ''
    profile.email = user.email || ''
    profile.avatar = user.avatar || ''
  }
}

async function updateProfile() {
  isUpdating.value = true
  try {
    await authService.updateProfile({
      username: profile.username,
      avatar: profile.avatar
    })
  } catch (error) {
    console.error('更新资料失败:', error)
  } finally {
    isUpdating.value = false
  }
}

async function changePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    alert('两次输入的密码不一致')
    return
  }

  isChangingPassword.value = true
  try {
    await authService.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error) {
    console.error('修改密码失败:', error)
  } finally {
    isChangingPassword.value = false
  }
}

function handleLogout() {
  authService.logout()
  window.location.href = '/'
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.card {
  animation: fadeInUp 0.5s ease both;
}

.card-header {
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--line);
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.profile-form,
.security-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.form-actions {
  margin-top: 0.5rem;
}

.danger-zone {
  border-color: rgba(255, 107, 107, 0.3);
}

.danger-zone .card-header h3 {
  color: var(--danger);
}

.danger-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.danger-content p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.btn-danger {
  background: rgba(255, 107, 107, 0.15);
  border-color: var(--danger);
  color: var(--danger);
}

.btn-danger:hover {
  background: rgba(255, 107, 107, 0.25);
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
