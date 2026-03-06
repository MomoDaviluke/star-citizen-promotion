<!--
  @file 站点设置页面
  @description 管理站点配置和系统设置
  @module views/admin/Settings
-->

<template>
  <AdminLayout>
    <div class="settings-admin">
      <section class="card">
        <div class="card-header">
          <h3>站点信息</h3>
        </div>
        <form @submit.prevent="saveSiteSettings" class="settings-form">
          <div class="form-group">
            <label class="form-label">站点名称</label>
            <input
              v-model="settings.siteName"
              type="text"
              class="form-input"
              placeholder="请输入站点名称"
            />
          </div>
          <div class="form-group">
            <label class="form-label">站点描述</label>
            <textarea
              v-model="settings.siteDescription"
              class="form-input form-textarea"
              placeholder="请输入站点描述"
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">联系邮箱</label>
            <input
              v-model="settings.contactEmail"
              type="email"
              class="form-input"
              placeholder="请输入联系邮箱"
            />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="isSaving">
              {{ isSaving ? '保存中...' : '保存设置' }}
            </button>
          </div>
        </form>
      </section>

      <section class="card">
        <div class="card-header">
          <h3>功能开关</h3>
        </div>
        <div class="feature-toggles">
          <div class="toggle-item">
            <div class="toggle-info">
              <span class="toggle-label">AI 服务</span>
              <span class="toggle-desc">启用 AI 辅助功能</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="features.enableAI" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="toggle-item">
            <div class="toggle-info">
              <span class="toggle-label">用户认证</span>
              <span class="toggle-desc">启用用户登录注册功能</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="features.enableAuth" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="toggle-item">
            <div class="toggle-info">
              <span class="toggle-label">实时通知</span>
              <span class="toggle-desc">启用 WebSocket 实时通知</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="features.enableNotifications" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </section>

      <section class="card danger-zone">
        <div class="card-header">
          <h3>危险操作</h3>
        </div>
        <div class="danger-content">
          <div class="danger-item">
            <div class="danger-info">
              <span class="danger-label">重置数据库</span>
              <span class="danger-desc">清除所有数据并重新初始化数据库</span>
            </div>
            <button class="btn btn-danger" @click="resetDatabase">
              重置数据库
            </button>
          </div>
          <div class="danger-item">
            <div class="danger-info">
              <span class="danger-label">清除缓存</span>
              <span class="danger-desc">清除所有缓存数据</span>
            </div>
            <button class="btn btn-danger" @click="clearCache">
              清除缓存
            </button>
          </div>
        </div>
      </section>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AdminLayout from './AdminLayout.vue'
import { siteConfig } from '@/config/site.config.js'

const settings = reactive({
  siteName: '',
  siteDescription: '',
  contactEmail: ''
})

const features = reactive({
  enableAI: true,
  enableAuth: true,
  enableNotifications: true
})

const isSaving = ref(false)

function loadSettings() {
  settings.siteName = siteConfig.siteInfo.name
  settings.siteDescription = siteConfig.siteInfo.description
  settings.contactEmail = siteConfig.siteInfo.email

  features.enableAI = siteConfig.features.enableAI
  features.enableAuth = siteConfig.features.enableAuth
  features.enableNotifications = siteConfig.features.enableNotifications
}

async function saveSiteSettings() {
  isSaving.value = true
  try {
    console.log('保存设置:', settings)
    await new Promise(resolve => setTimeout(resolve, 500))
    alert('设置已保存')
  } catch (error) {
    console.error('保存设置失败:', error)
  } finally {
    isSaving.value = false
  }
}

function resetDatabase() {
  if (confirm('确定要重置数据库吗？此操作不可恢复！')) {
    console.log('重置数据库')
    alert('数据库重置请求已提交')
  }
}

function clearCache() {
  if (confirm('确定要清除缓存吗？')) {
    console.log('清除缓存')
    alert('缓存已清除')
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-admin {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: rgba(15, 30, 50, 0.6);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 1.25rem;
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

.settings-form {
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
}

.form-input:focus {
  outline: none;
  border-color: var(--accent);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  margin-top: 0.5rem;
}

.feature-toggles {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--line);
}

.toggle-item:last-child {
  border-bottom: none;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.toggle-label {
  font-weight: 500;
}

.toggle-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: rgba(95, 169, 255, 0.2);
  border-radius: 24px;
  transition: 0.3s;
}

.toggle-slider::before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: var(--text);
  border-radius: 50%;
  transition: 0.3s;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--accent);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(24px);
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

.danger-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: rgba(255, 107, 107, 0.05);
  border: 1px solid rgba(255, 107, 107, 0.2);
  border-radius: 6px;
}

.danger-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.danger-label {
  font-weight: 500;
}

.danger-desc {
  font-size: 0.8rem;
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
</style>
