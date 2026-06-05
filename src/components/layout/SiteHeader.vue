<!--
 * @fileoverview MFD风格导航栏组件
 * @description 科幻军事终端风格的响应式导航栏
 * @module components/layout/SiteHeader
 * @version 3.0 - 星舰方舟版本
-->

<template>
  <header class="site-header" :class="{ 'header-scrolled': isScrolled }">
    <!-- 背景层 -->
    <div class="header-bg"></div>

    <!-- 顶部装饰线 -->
    <div class="header-accent-line"></div>

    <div class="container header-inner">
      <!-- 品牌标识 -->
      <RouterLink class="brand" to="/">
        <span class="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </span>
        <div class="brand-text">
          <span class="brand-title font-tech">星际公民战队</span>
          <span class="brand-subtitle font-data">STAR CITIZEN SQUADRON</span>
        </div>
      </RouterLink>

      <!-- 系统状态显示 -->
      <div class="header-status hide-mobile">
        <StatusIndicator type="online" label="系统在线" :pulse="false" size="small" />
        <span class="header-time font-data">{{ currentTime }}</span>
        <ThemeToggle />
      </div>

      <!-- 移动端菜单切换按钮 -->
      <button
        class="menu-toggle"
        type="button"
        @click="menuOpen = !menuOpen"
        :aria-expanded="menuOpen"
        aria-label="切换导航菜单"
      >
        <span class="toggle-bar"></span>
        <span class="toggle-bar"></span>
        <span class="toggle-bar"></span>
      </button>

      <!-- 导航菜单 -->
      <nav class="nav" :class="{ open: menuOpen }">
        <!-- 导航链接列表 -->
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link font-tech"
          @click="menuOpen = false"
        >
          <span class="link-indicator"></span>
          <span class="link-text">{{ item.label }}</span>
          <span class="link-id font-data">{{ item.id }}</span>
        </RouterLink>
      </nav>
    </div>

    <!-- 底部分隔线 -->
    <div class="header-line"></div>

    <!-- 装饰边角 -->
    <div class="header-corner header-corner--tl"></div>
    <div class="header-corner header-corner--tr"></div>
  </header>
</template>

<script setup>
/**
 * MFD风格网站头部导航组件
 * @description 提供科幻军事终端风格的响应式导航栏
 */

import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { navItems } from '@/data/siteContent'
import StatusIndicator from '@/components/ui/StatusIndicator.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

/** 当前路由对象 */
const route = useRoute()

/** 移动端菜单展开状态 */
const menuOpen = ref(false)

/** 滚动状态 */
const isScrolled = ref(false)

/** 当前时间 */
const currentTime = ref('')

/**
 * 更新时间
 */
function updateTime() {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  currentTime.value = `${hours}:${minutes}:${seconds}`
}

/** 时间更新定时器 */
let timeInterval = null

/**
 * 监听路由变化
 * @description 路由切换时自动关闭移动端菜单
 */
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  }
)

/**
 * 处理滚动事件
 * @description 检测页面滚动位置，添加滚动状态类
 */
const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

/** 组件挂载时添加监听 */
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

/** 组件卸载时移除监听 */
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
/*
 * ============================================
 * MFD风格头部容器
 * ============================================
 */
.site-header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  border-bottom: 1px solid var(--border-subtle);
  overflow: hidden;
  transition: border-color var(--duration-normal);
}

.site-header.header-scrolled {
  border-color: var(--border-medium);
}

.site-header.header-scrolled .header-bg {
  background: linear-gradient(90deg, rgba(10, 14, 23, 0.98), rgba(17, 24, 39, 0.96));
  backdrop-filter: blur(24px);
}

.site-header.header-scrolled .header-accent-line {
  opacity: 1;
  animation: accent-pulse 2s ease-in-out infinite;
}

@keyframes accent-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/*
 * --------------------------------------------
 * 背景层样式
 * --------------------------------------------
 */
.header-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(10, 14, 23, 0.95), rgba(17, 24, 39, 0.92));
  backdrop-filter: blur(16px);
  z-index: -1;
}

.header-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(245, 158, 11, 0.04) 0%, transparent 100%),
    radial-gradient(ellipse 50% 100% at 50% 0%, rgba(6, 182, 212, 0.08), transparent);
}

/*
 * --------------------------------------------
 * 顶部装饰线
 * --------------------------------------------
 */
.header-accent-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    var(--amber-primary) 20%,
    var(--nebula-purple) 50%,
    var(--amber-primary) 80%,
    transparent 100%
  );
  opacity: 0.6;
}

/*
 * --------------------------------------------
 * 底部分隔线
 * --------------------------------------------
 */
.header-line {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--amber-primary), transparent);
  opacity: 0.4;
}

/*
 * --------------------------------------------
 * 装饰边角
 * --------------------------------------------
 */
.header-corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: var(--amber-primary);
  border-style: solid;
  opacity: 0.5;
}

.header-corner--tl {
  top: 4px;
  left: 4px;
  border-width: 2px 0 0 2px;
}

.header-corner--tr {
  top: 4px;
  right: 4px;
  border-width: 2px 2px 0 0;
}

/*
 * --------------------------------------------
 * 头部内部布局
 * --------------------------------------------
 */
.header-inner {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 0 var(--space-4);
}

/*
 * --------------------------------------------
 * 品牌标识样式
 * --------------------------------------------
 */
.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  position: relative;
}

.brand:hover {
  opacity: 0.9;
}

.brand-icon {
  color: var(--amber-primary);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: breathe 3s ease-in-out infinite;
}

.brand-icon svg {
  width: 100%;
  height: 100%;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-title {
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-primary);
}

.brand-subtitle {
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  color: var(--text-muted);
  opacity: 0.7;
}

/*
 * --------------------------------------------
 * 系统状态显示
 * --------------------------------------------
 */
.header-status {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-left: auto;
  margin-right: var(--space-4);
}

.header-time {
  font-size: var(--text-xs);
  color: var(--nebula-violet);
  letter-spacing: 0.1em;
  min-width: 70px;
  text-align: right;
}

/*
 * --------------------------------------------
 * 导航菜单样式
 * --------------------------------------------
 */
.nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  position: relative;
}

/*
 * --------------------------------------------
 * 导航链接样式 - MFD风格
 * --------------------------------------------
 */
.nav-link {
  position: relative;
  padding: var(--space-2) var(--space-3);
  color: var(--text-secondary);
  text-transform: uppercase;
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.12em;
  transition: all var(--duration-fast);
  overflow: hidden;
  border: 1px solid transparent;
  text-decoration: none;
}

.link-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 0;
  background: var(--amber-primary);
  transition: height var(--duration-fast);
  box-shadow: 0 0 8px var(--amber-glow);
}

.link-text {
  position: relative;
  z-index: 1;
}

.link-id {
  position: absolute;
  right: 4px;
  top: 2px;
  font-size: 0.5rem;
  color: var(--text-dim);
  opacity: 0.5;
}

.nav-link:hover {
  color: var(--amber-primary);
  background: rgba(245, 158, 11, 0.05);
  border-color: rgba(245, 158, 11, 0.2);
}

.nav-link:hover .link-indicator {
  height: 60%;
}

/*
 * --------------------------------------------
 * 当前激活链接样式
 * --------------------------------------------
 */
.nav-link.router-link-active {
  color: var(--amber-primary);
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.3);
}

.nav-link.router-link-active .link-indicator {
  height: 60%;
}

/*
 * --------------------------------------------
 * 移动端菜单切换按钮
 * --------------------------------------------
 */
.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  width: 40px;
  height: 40px;
  padding: 10px;
  border: 1px solid var(--border-subtle);
  background: rgba(245, 158, 11, 0.05);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.menu-toggle:hover {
  background: rgba(245, 158, 11, 0.1);
  border-color: var(--amber-primary);
}

.toggle-bar {
  display: block;
  width: 100%;
  height: 2px;
  background: var(--text-primary);
  border-radius: 1px;
  transition: transform var(--duration-fast), opacity var(--duration-fast);
}

/*
 * --------------------------------------------
 * 汉堡菜单展开动画
 * --------------------------------------------
 */
.menu-toggle[aria-expanded="true"] .toggle-bar:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.menu-toggle[aria-expanded="true"] .toggle-bar:nth-child(2) {
  opacity: 0;
}

.menu-toggle[aria-expanded="true"] .toggle-bar:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

/*
 * --------------------------------------------
 * 响应式布局：移动端样式
 * --------------------------------------------
 */
@media (max-width: 860px) {
  .menu-toggle {
    display: flex;
  }

  .header-inner {
    min-height: 64px;
    position: relative;
  }

  .nav {
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-4);
    background: rgba(10, 14, 23, 0.98);
    border: 1px solid var(--border-subtle);
    border-top: none;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all var(--duration-fast);
  }

  .nav.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .nav-link {
    width: 100%;
    padding: var(--space-3) var(--space-4);
  }
}

@media (max-width: 480px) {
  .brand-title {
    font-size: var(--text-xs);
  }

  .brand-subtitle {
    display: none;
  }

  .brand-icon {
    width: 24px;
    height: 24px;
  }
}
</style>
