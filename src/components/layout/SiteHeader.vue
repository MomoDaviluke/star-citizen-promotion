<template>
  <header class="site-header">
    <div class="container header-inner">
      <RouterLink class="brand" to="/">星际公民团队站</RouterLink>
      <button class="menu-toggle" type="button" @click="menuOpen = !menuOpen">
        {{ menuOpen ? 'close' : 'menu' }}
      </button>
      <nav class="nav" :class="{ open: menuOpen }">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          @click="menuOpen = false"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { navItems } from '@/data/siteContent'

const route = useRoute()
const menuOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  }
)
</script>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(10px);
  background: linear-gradient(90deg, rgba(7, 11, 20, 0.9), rgba(11, 21, 35, 0.78));
  border-bottom: 1px solid var(--line);
}

.header-inner {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.brand {
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.95rem;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.menu-toggle {
  display: none;
  border: 1px solid var(--line);
  background: rgba(95, 169, 255, 0.08);
  color: var(--text);
  border-radius: 8px;
  padding: 0.35rem 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
}

.nav-link {
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  color: var(--text-muted);
  border: 1px solid transparent;
  text-transform: uppercase;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  position: relative;
  overflow: hidden;
}

.nav-link::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 0%, rgba(143, 215, 255, 0.2) 50%, transparent 100%);
  transform: translateX(-140%);
  transition: transform 0.35s ease;
}

.nav-link:hover::after {
  transform: translateX(140%);
}

.nav-link.router-link-active {
  color: var(--text);
  border-color: var(--line);
  background: rgba(95, 169, 255, 0.14);
  box-shadow: 0 0 0 1px rgba(143, 215, 255, 0.16);
}

@media (max-width: 860px) {
  .menu-toggle {
    display: inline-block;
  }

  .header-inner {
    min-height: 68px;
    position: relative;
  }

  .nav {
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    display: none;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.65rem;
    border: 1px solid var(--line);
    border-radius: 0 0 10px 10px;
    background: rgba(7, 12, 20, 0.95);
  }

  .nav.open {
    display: flex;
  }
}
</style>
