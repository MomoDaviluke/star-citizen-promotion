<!--
  @file 管理后台布局组件
  @description 提供管理后台的整体布局结构
  @module views/admin/AdminLayout
-->

<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <span class="sidebar-icon">⚙</span>
        <span class="sidebar-title">管理后台</span>
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <RouterLink to="/" class="back-link">
          <span>←</span>
          <span>返回前台</span>
        </RouterLink>
      </div>
    </aside>

    <main class="admin-main">
      <header class="admin-header">
        <h1 class="page-title">{{ pageTitle }}</h1>
        <div class="header-actions">
          <span class="user-info">
            <span class="user-name">{{ user?.username }}</span>
            <span class="user-role">{{ roleLabel }}</span>
          </span>
          <button class="btn btn-outline" @click="handleLogout">
            退出登录
          </button>
        </div>
      </header>

      <div class="admin-content">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '@/services'

const router = useRouter()
const route = useRoute()

const menuItems = [
  { label: '数据概览', to: '/admin', icon: '📊' },
  { label: '成员管理', to: '/admin/members', icon: '👥' },
  { label: '项目管理', to: '/admin/projects', icon: '📋' },
  { label: '申请审核', to: '/admin/applications', icon: '📝' },
  { label: '飞行员管理', to: '/admin/pilots', icon: '✈' },
  { label: '站点设置', to: '/admin/settings', icon: '⚙' }
]

const user = computed(() => authService.getUser())

const roleLabel = computed(() => {
  const roles = { admin: '管理员', member: '成员', guest: '访客' }
  return roles[user.value?.role] || '未知'
})

const pageTitle = computed(() => {
  const item = menuItems.find(m => m.to === route.path)
  return item?.label || '管理后台'
})

function handleLogout() {
  authService.logout()
  router.push('/')
}
</script>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
  background: var(--bg);
}

.admin-sidebar {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--line);
  background: rgba(4, 8, 16, 0.95);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--line);
}

.sidebar-icon {
  font-size: 1.25rem;
}

.sidebar-title {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  color: var(--text-muted);
  font-size: 0.85rem;
  transition: all var(--transition-fast);
}

.nav-item:hover {
  background: rgba(95, 169, 255, 0.08);
  color: var(--text);
}

.nav-item.router-link-exact-active {
  background: rgba(95, 169, 255, 0.12);
  color: var(--accent-2);
  border-left: 2px solid var(--accent);
}

.nav-icon {
  font-size: 1rem;
}

.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--line);
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.8rem;
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--accent-2);
}

.admin-main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--line);
  background: rgba(4, 8, 16, 0.8);
}

.page-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 500;
}

.user-role {
  font-size: 0.7rem;
  color: var(--accent-2);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.btn-outline {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
}

.admin-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

@media (max-width: 860px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }

  .admin-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 240px;
    transform: translateX(-100%);
    transition: transform var(--transition-normal);
    z-index: 1000;
  }

  .admin-sidebar.open {
    transform: translateX(0);
  }
}
</style>
