<!--
 * @fileoverview 网站头部导航组件
 * @description 提供响应式导航栏，包含品牌标识、导航链接和移动端菜单
 * @module components/layout/SiteHeader
 * @example
 * <SiteHeader />
 -->

<template>
  <header class="site-header">
    <!-- 背景层 -->
    <div class="header-bg"></div>

    <div class="container header-inner">
      <!-- 品牌标识 -->
      <RouterLink class="brand" to="/">
        <span class="brand-icon">◆</span>
        <span class="brand-text">星际公民团队站</span>
      </RouterLink>

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
        <!-- 导航悬停发光效果 -->
        <div class="nav-glow"></div>

        <!-- 导航链接列表 -->
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          @click="menuOpen = false"
        >
          <span class="link-indicator"></span>
          <span class="link-text">{{ item.label }}</span>
          <span class="link-underline"></span>
        </RouterLink>
      </nav>
    </div>

    <!-- 底部分隔线 -->
    <div class="header-line"></div>
  </header>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { navItems } from '@/data/siteContent'

/** 当前路由对象 */
const route = useRoute()

/** 移动端菜单展开状态 */
const menuOpen = ref(false)

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
</script>

<style scoped>
/*
 * ============================================
 * 头部容器样式
 * 使用 sticky 定位实现滚动时固定
 * ============================================
 */
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--line);
  overflow: hidden;
}

/*
 * --------------------------------------------
 * 背景层样式
 * 包含渐变背景和顶部发光效果
 * --------------------------------------------
 */
.header-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(4, 8, 16, 0.95), rgba(8, 15, 28, 0.92));
  backdrop-filter: blur(12px);
  z-index: -1;
}

.header-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(95, 169, 255, 0.05) 0%, transparent 100%),
    radial-gradient(ellipse 50% 100% at 50% 0%, rgba(95, 169, 255, 0.08), transparent);
}

/*
 * --------------------------------------------
 * 底部分隔线
 * 渐变发光效果
 * --------------------------------------------
 */
.header-line {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(143, 215, 255, 0.3), transparent);
}

/*
 * --------------------------------------------
 * 头部内部布局
 * --------------------------------------------
 */
.header-inner {
  min-height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

/*
 * --------------------------------------------
 * 品牌标识样式
 * --------------------------------------------
 */
.brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.9rem;
  color: var(--text);
  transition: color var(--transition-fast);
}

.brand:hover {
  color: var(--accent-2);
}

.brand-icon {
  color: var(--accent-2);
  font-size: 0.6rem;
  animation: pulse 2s ease-in-out infinite;
}

.brand-text {
  position: relative;
}

/*
 * --------------------------------------------
 * 导航菜单样式
 * --------------------------------------------
 */
.nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  position: relative;
}

.nav-glow {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 200px;
  height: 100%;
  transform: translate(-50%, -50%);
  background: radial-gradient(ellipse, rgba(95, 169, 255, 0.1), transparent 70%);
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.nav:hover .nav-glow {
  opacity: 1;
}

/*
 * --------------------------------------------
 * 导航链接样式
 * 包含悬停指示器和下划线动画
 * --------------------------------------------
 */
.nav-link {
  position: relative;
  padding: 0.5rem 0.9rem;
  border-radius: 3px;
  color: var(--text-muted);
  text-transform: uppercase;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  transition: color var(--transition-fast);
  overflow: hidden;
}

.link-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 0;
  background: var(--accent-2);
  transition: height var(--transition-fast);
  box-shadow: 0 0 8px rgba(143, 215, 255, 0.5);
}

.link-text {
  position: relative;
  z-index: 1;
}

.link-underline {
  position: absolute;
  bottom: 0.35rem;
  left: 0.9rem;
  right: 0.9rem;
  height: 1px;
  background: var(--accent-2);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--transition-fast);
}

.nav-link:hover {
  color: var(--text);
}

.nav-link:hover .link-indicator {
  height: 60%;
}

.nav-link:hover .link-underline {
  transform: scaleX(1);
}

/*
 * --------------------------------------------
 * 当前激活链接样式
 * --------------------------------------------
 */
.nav-link.router-link-active {
  color: var(--text);
  background: rgba(95, 169, 255, 0.08);
}

.nav-link.router-link-active .link-indicator {
  height: 60%;
}

.nav-link.router-link-active::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid rgba(143, 215, 255, 0.2);
  border-radius: 3px;
  pointer-events: none;
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
  width: 36px;
  height: 36px;
  padding: 8px;
  border: 1px solid var(--line);
  background: rgba(95, 169, 255, 0.05);
  border-radius: 4px;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.menu-toggle:hover {
  background: rgba(95, 169, 255, 0.1);
  border-color: var(--accent);
}

.toggle-bar {
  display: block;
  width: 100%;
  height: 2px;
  background: var(--text);
  border-radius: 1px;
  transition: transform var(--transition-fast), opacity var(--transition-fast);
}

/*
 * --------------------------------------------
 * 汉堡菜单展开动画
 * 三条横线变形为 X
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

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
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
    left: -1.25rem;
    right: -1.25rem;
    top: 100%;
    flex-direction: column;
    gap: 0.25rem;
    padding: 1rem;
    background: rgba(4, 8, 16, 0.98);
    border: 1px solid var(--line);
    border-top: none;
    border-radius: 0 0 8px 8px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition:
      opacity var(--transition-fast),
      visibility var(--transition-fast),
      transform var(--transition-fast);
  }

  .nav.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .nav-glow {
    display: none;
  }

  .nav-link {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 4px;
  }

  .nav-link.router-link-active::before {
    border-radius: 4px;
  }
}
</style>
