<template>
  <div class="app-shell">
    <div class="tech-overlay" aria-hidden="true">
      <div class="tech-grid"></div>
      <div class="tech-glow tech-glow-1"></div>
      <div class="tech-glow tech-glow-2"></div>
    </div>
    <SiteHeader />
    <main class="container page-main">
      <router-view v-slot="{ Component, route }">
        <PageTransition :key="route.path">
          <component :is="Component" :key="route.path" />
        </PageTransition>
      </router-view>
    </main>
    <SiteFooter />
    <LoadingIndicator ref="loadingIndicator" />
  </div>
</template>

<script setup>
import { ref, onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import SiteHeader from './components/layout/SiteHeader.vue'
import SiteFooter from './components/layout/SiteFooter.vue'
import PageTransition from './components/common/PageTransition.vue'
import LoadingIndicator from './components/common/LoadingIndicator.vue'
import { aiService } from './services'

const router = useRouter()
const loadingIndicator = ref(null)
const isPageLoading = ref(false)

provide('isPageLoading', isPageLoading)

router.beforeEach((to, from, next) => {
  isPageLoading.value = true
  next()
})

router.afterEach(() => {
  isPageLoading.value = false
})

onMounted(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  if (prefersReducedMotion) {
    document.documentElement.style.setProperty('--transition-normal', '0.01ms')
    document.documentElement.style.setProperty('--transition-slow', '0.01ms')
  }
  
  if ('connection' in navigator) {
    const connection = navigator.connection
    if (connection.saveData || connection.effectiveType === 'slow-2g') {
      document.body.classList.add('reduce-motion')
    }
  }
})

const showLoading = (text) => {
  if (loadingIndicator.value) {
    loadingIndicator.value.startLoading()
  }
}

const hideLoading = () => {
  if (loadingIndicator.value) {
    loadingIndicator.value.stopLoading()
  }
}

provide('loading', { showLoading, hideLoading })
provide('aiService', aiService)
</script>

<style scoped>
.tech-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}

.tech-grid {
  position: absolute;
  inset: 0;
  opacity: 0.08;
  background-image:
    linear-gradient(rgba(143, 215, 255, 0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(143, 215, 255, 0.15) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: linear-gradient(180deg, black 0%, transparent 80%);
}

.tech-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  will-change: transform;
}

.tech-glow-1 {
  width: 500px;
  height: 500px;
  left: -150px;
  top: -150px;
  background: radial-gradient(circle, rgba(95, 169, 255, 0.12), transparent 70%);
}

.tech-glow-2 {
  width: 400px;
  height: 400px;
  right: -100px;
  bottom: -100px;
  background: radial-gradient(circle, rgba(143, 215, 255, 0.08), transparent 70%);
}

.tech-particles {
  display: none;
}

.page-main {
  padding-block: 2rem 4rem;
  position: relative;
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .tech-glow,
  .tech-particles {
    animation: none;
  }
}
</style>
