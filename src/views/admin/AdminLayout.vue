<!--
  @file 管理后台布局组件
  @description 提供管理后台的整体布局结构
  @module views/admin/AdminLayout
-->

<template>
  <div class="admin-layout">
    <!-- 移动端遮罩层 -->
    <Transition name="overlay-fade">
      <div
        v-if="sidebarOpen"
        class="sidebar-overlay"
        @click="closeSidebar"
        aria-hidden="true"
      ></div>
    </Transition>

    <aside class="admin-sidebar" :class="{ 'is-open': sidebarOpen }">
      <div class="sidebar-header">
        <span class="sidebar-icon">⚙</span>
        <span class="sidebar-title">管理后台</span>
      </div>

      <nav class="sidebar-nav" @click="handleNavClick">
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
        <RouterLink to="/" class="back-link" @click="closeSidebar">
          <span>←</span>
          <span>返回前台</span>
        </RouterLink>
      </div>
    </aside>

    <main class="admin-main">
      <header class="admin-header">
        <div class="header-left">
          <button
            class="sidebar-toggle"
            type="button"
            :aria-expanded="sidebarOpen"
            aria-label="切换导航菜单"
            @click="toggleSidebar"
          >
            <span class="sidebar-toggle-bar"></span>
            <span class="sidebar-toggle-bar"></span>
            <span class="sidebar-toggle-bar"></span>
          </button>
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
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
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
/**
 * 管理后台布局组件逻辑
 * @description 提供管理后台的整体布局结构，包括侧边栏导航、顶部栏和用户操作
 * @summary 作为所有管理后台页面的父布局组件，提供统一的导航和用户信息展示
 */

import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '@/services'
import { useAuthStore } from '@/stores/auth'
import { getUserRoleLabel } from '@/utils/labelMaps'

/** 认证状态仓库 */
const authStore = useAuthStore()

/** Vue Router 实例，用于页面导航 */
const router = useRouter()
/** 当前路由对象，用于获取当前路径 */
const route = useRoute()

/** 移动端侧边栏展开状态 */
const sidebarOpen = ref(false)

/**
 * 侧边栏菜单项配置
 * @description 定义管理后台的导航菜单结构
 * @property {string} label - 菜单项显示名称
 * @property {string} to - 路由路径
 * @property {string} icon - 图标表情符号
 */
const menuItems = [
  { label: '数据概览', to: '/admin', icon: '📊' },
  { label: '成员管理', to: '/admin/members', icon: '👥' },
  { label: '项目管理', to: '/admin/projects', icon: '📋' },
  { label: '申请审核', to: '/admin/applications', icon: '📝' },
  { label: '飞行员管理', to: '/admin/pilots', icon: '✈' },
  { label: '站点设置', to: '/admin/settings', icon: '⚙' },
  { label: '系统监控', to: '/admin/monitor', icon: '📡' }
]

/**
 * 当前登录用户信息
 * @description 从认证仓库读取。此前直接调用 authService.getUser()，
 *              该方法并不存在，会在渲染期抛错并让整个后台布局白屏。
 */
const user = computed(() => authStore.user)

const roleLabel = computed(() => getUserRoleLabel(user.value?.role))

/**
 * 当前页面标题计算属性
 * @description 根据当前路由路径匹配对应的菜单项标题
 * @returns {string} 当前页面标题
 */
const pageTitle = computed(() => {
  const item = menuItems.find(m => m.to === route.path)
  return item?.label || '管理后台'
})

/**
 * 切换侧边栏展开状态
 */
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

/**
 * 关闭侧边栏
 */
function closeSidebar() {
  sidebarOpen.value = false
}

/**
 * 处理侧边栏导航点击事件
 * @description 仅当点击 RouterLink 时关闭侧边栏
 * @param {MouseEvent} event - 点击事件
 */
function handleNavClick(event) {
  if (event.target.closest('.nav-item')) {
    closeSidebar()
  }
}

/**
 * 处理用户登出
 * @description 清除认证状态并跳转到首页
 */
function handleLogout() {
  authService.logout()
  router.push('/')
}

// 路由切换时关闭侧边栏（保险机制）
watch(() => route.path, () => {
  closeSidebar()
})

// 监听 ESC 键关闭侧边栏
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebarOpen.value) {
      closeSidebar()
    }
  })
}
</script>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-bg);
}

.admin-sidebar {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
  background: rgba(4, 8, 16, 0.95);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
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
  min-height: 44px;
  color: var(--color-text-dim);
  font-size: 0.85rem;
  transition: all var(--duration-fast);
}

.nav-item:hover {
  background: rgba(95, 169, 255, 0.08);
  color: var(--color-text-body);
}

.nav-item.router-link-exact-active {
  background: rgba(95, 169, 255, 0.12);
  color: var(--color-highlight);
  border-left: 2px solid var(--color-accent);
}

.nav-icon {
  font-size: 1rem;
}

.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  color: var(--color-text-dim);
  font-size: 0.8rem;
  transition: color var(--duration-fast);
}

.back-link:hover {
  color: var(--color-highlight);
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
  gap: 1rem;
  padding: 1rem 1.5rem;
  padding-top: calc(1rem + env(safe-area-inset-top, 0px));
  border-bottom: 1px solid var(--color-border);
  background: rgba(4, 8, 16, 0.8);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.sidebar-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 44px;
  height: 44px;
  padding: 0 10px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm, 4px);
  cursor: pointer;
  transition: background var(--duration-fast);
}

.sidebar-toggle:hover {
  background: rgba(95, 169, 255, 0.08);
}

.sidebar-toggle-bar {
  display: block;
  width: 22px;
  height: 2px;
  background: var(--color-text-body);
  border-radius: 1px;
}

.page-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  color: var(--color-highlight);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.btn-outline {
  padding: 0.5rem 1rem;
  min-height: 44px;
  font-size: 0.75rem;
}

.admin-content {
  flex: 1;
  padding: 1.5rem;
  padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
  overflow-y: auto;
}

/* 移动端遮罩层 */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 999;
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity var(--motion-duration-fast, 0.2s);
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

@media (max-width: 860px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }

  .sidebar-toggle {
    display: flex;
  }

  .admin-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: min(280px, 80vw);
    padding-top: env(safe-area-inset-top, 0px);
    transform: translateX(-100%);
    transition: transform var(--motion-duration-normal, 0.3s) var(--motion-ease-out, ease-out);
    z-index: 1000;
  }

  .admin-sidebar.is-open {
    transform: translateX(0);
  }

  .admin-header {
    padding: 0.75rem 1rem;
    padding-top: calc(0.75rem + env(safe-area-inset-top, 0px));
  }

  .header-actions {
    gap: 0.5rem;
  }

  .user-info {
    display: none;
  }

  .admin-content {
    padding: 1rem;
    padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1rem;
  }

  .btn-outline {
    padding: 0.5rem 0.75rem;
    font-size: 0.7rem;
  }
}
</style>
