<template>
  <header class="site-header" :class="{ 'site-header--scrolled': isScrolled }">
    <div class="site-header__pill">
      <!-- Logo -->
      <router-link to="/" class="site-header__logo" aria-label="返回首页">
        <span class="site-header__logo-white">STELLAR</span>
        <span class="site-header__logo-cyan">NEXUS</span>
        <StatusPulse variant="online" size="sm" class="site-header__status" />
      </router-link>

      <TechDivider vertical class="site-header__divider" />

      <!-- Navigation -->
      <nav id="site-nav" class="site-header__nav" :class="{ 'site-header__nav--open': isMobileMenuOpen }">
        <router-link
          v-for="(link, index) in navLinks"
          :key="link.path"
          :to="link.path"
          class="site-header__link"
          :class="{ 'site-header__link--active': isActive(link.path) }"
          :style="{ '--link-index': index }"
          :aria-current="isActive(link.path) ? 'page' : undefined"
          @click="isMobileMenuOpen = false"
        >
          {{ link.label }}
        </router-link>
      </nav>

      <TechDivider vertical class="site-header__divider site-header__divider--right" />

      <!-- Actions -->
      <div class="site-header__actions">
        <button class="site-header__theme-btn" @click="toggleTheme" :aria-label="isDark ? '切换亮色主题' : '切换暗色主题'">
          <svg v-if="isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
        <button
          class="site-header__menu-btn"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          aria-label="菜单"
          :aria-expanded="isMobileMenuOpen"
          aria-controls="site-nav"
        >
          <span class="hamburger" :class="{ 'hamburger--open': isMobileMenuOpen }">
            <span></span><span></span><span></span>
          </span>
        </button>
      </div>
    </div>

    <HudCorner position="bottom-left" size="sm" class="site-header__corner site-header__corner--bl" />
    <HudCorner position="bottom-right" size="sm" class="site-header__corner site-header__corner--br" />
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from '../../composables/useTheme'
import { TechDivider, StatusPulse, HudCorner } from '../hud/index.js'

const route = useRoute()
const { isDark: isDarkFn, toggle } = useTheme()
const isDark = computed(isDarkFn)
const isMobileMenuOpen = ref(false)
const isScrolled = ref(false)

const navLinks = [
  { path: '/', label: '首页' },
  { path: '/about', label: '关于' },
  { path: '/fleet', label: '舰队' },
  { path: '/members', label: '成员' },
  { path: '/join', label: '加入' },
  { path: '/contact', label: '联系' },
]

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function toggleTheme() {
  toggle()
}

function onScroll() {
  isScrolled.value = window.scrollY > 10
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-header);
  padding: 16px 0 0;
  padding-top: calc(16px + env(safe-area-inset-top, 0px));
  pointer-events: none;
}

.site-header__corner {
  position: absolute;
  bottom: 0;
  z-index: 1;
}

.site-header__corner--bl { left: 1rem; }
.site-header__corner--br { right: 1rem; }

.site-header__pill {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: fit-content;
  margin: 0 auto;
  height: 56px;
  padding: 0 1.5rem;
  gap: var(--space-6);
  background: rgba(5, 5, 8, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
  transition: background var(--duration-normal) var(--ease-out),
              border-color var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out);
}

.site-header--scrolled .site-header__pill {
  background: rgba(5, 5, 8, 0.95);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(var(--raw-cyan-rgb), 0.05);
}

/* Logo */
.site-header__logo {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  text-decoration: none;
  flex-shrink: 0;
}

.site-header__status {
  margin-left: var(--space-2);
}

.site-header__divider {
  height: 24px;
  opacity: 0.6;
}

.site-header__divider--right {
  margin-left: auto;
}

.site-header__logo-white {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: #ffffff;
}

.site-header__logo-cyan {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--color-accent);
  text-shadow: 0 0 12px rgba(var(--raw-cyan-rgb), 0.4);
}

/* Navigation */
.site-header__nav {
  display: flex;
  align-items: center;
  gap: 0.125rem;
}

.site-header__link {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  position: relative;
  transition: color var(--duration-fast) var(--ease-out),
              text-shadow var(--duration-fast) var(--ease-out);
}

.site-header__link:hover {
  color: #ffffff;
  text-shadow: 0 0 12px rgba(var(--raw-cyan-rgb), 0.5);
}

.site-header__link--active {
  color: #ffffff;
}

.site-header__link--active::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: var(--color-accent);
  border-radius: 1px;
  box-shadow: 0 0 8px rgba(var(--raw-cyan-rgb), 0.6);
}

/* Actions */
.site-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.site-header__theme-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.5);
  transition: color var(--duration-fast) var(--ease-out),
              background var(--duration-fast) var(--ease-out);
}

.site-header__theme-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.06);
}

/* Hamburger */
.site-header__menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.5);
}

.hamburger {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 16px;
}

.hamburger span {
  display: block;
  height: 1.5px;
  background: currentColor;
  border-radius: 1px;
  transition: all var(--duration-fast) var(--ease-out);
}

.hamburger--open span:nth-child(1) {
  transform: translateY(5.5px) rotate(45deg);
}

.hamburger--open span:nth-child(2) {
  opacity: 0;
}

.hamburger--open span:nth-child(3) {
  transform: translateY(-5.5px) rotate(-45deg);
}

/* Mobile */
@media (max-width: 768px) {
  .site-header__pill {
    width: calc(100% - 2rem);
    max-width: none;
    justify-content: space-between;
    border-radius: var(--radius-xl);
    margin: 0 auto;
    padding: 0 0.75rem;
  }

  .site-header__menu-btn {
    display: inline-flex;
  }

  .site-header__nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    padding-left: env(safe-area-inset-left, 0px);
    padding-right: env(safe-area-inset-right, 0px);
    background: rgba(5, 5, 8, 0.97);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--duration-normal) var(--ease-out);
    z-index: 200;
  }

  .site-header__nav--open {
    opacity: 1;
    pointer-events: auto;
  }

  .site-header__nav--open .site-header__link {
    animation: linkReveal 0.4s var(--ease-out) both;
    animation-delay: calc(var(--link-index) * 80ms + 0.15s);
  }

  .site-header__link {
    font-size: 1.5rem;
    letter-spacing: 0.25em;
    padding: 1rem 2rem;
    min-height: 44px;
    display: flex;
    align-items: center;
  }
}

@keyframes linkReveal {
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
