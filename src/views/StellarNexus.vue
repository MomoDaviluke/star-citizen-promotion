<!--
  @file StellarNexus 宇宙航行落地页
  @description 独立视觉落地页：星空、行星、舰船、全息 HUD、滚动叙事
  @module views/StellarNexus
-->
<template>
  <main class="stellar-nexus">
    <CosmicStarfield quality="high" class="stellar-nexus__starfield" />
    <FilmGrain class="stellar-nexus__grain" />

    <!-- Hero / 深空起源 -->
    <section class="stellar-nexus__section stellar-nexus__hero">
      <div class="stellar-nexus__hero-content">
        <h1 class="stellar-nexus__title">
          <span class="stellar-nexus__title-line">STELLAR</span>
          <span class="stellar-nexus__title-line stellar-nexus__title-line--cyan">NEXUS</span>
        </h1>
        <div class="stellar-nexus__divider"></div>
        <p class="stellar-nexus__subtitle">EXPLORE · FIGHT · CONQUER</p>
        <div class="stellar-nexus__stats">
          <HudPanel class="stellar-nexus__stat">
            <div class="stellar-nexus__stat-value">{{ stats.pilots }}</div>
            <div class="stellar-nexus__stat-label">ACTIVE PILOTS</div>
          </HudPanel>
          <HudPanel class="stellar-nexus__stat">
            <div class="stellar-nexus__stat-value">{{ stats.hours }}+</div>
            <div class="stellar-nexus__stat-label">FLIGHT HOURS</div>
          </HudPanel>
          <HudPanel class="stellar-nexus__stat">
            <div class="stellar-nexus__stat-value">{{ stats.ships }}</div>
            <div class="stellar-nexus__stat-label">COMBAT READY</div>
          </HudPanel>
        </div>
      </div>
      <CosmicShip registry="SNT-001" class="stellar-nexus__hero-ship" />
      <HudTicker class="stellar-nexus__ticker" />
    </section>

    <!-- Worlds / 行星探索 -->
    <section ref="worldsRef" class="stellar-nexus__section stellar-nexus__worlds">
      <div class="stellar-nexus__section-content stellar-nexus__section-content--left">
        <span class="stellar-nexus__section-index">01</span>
        <h2 class="stellar-nexus__section-title">WORLDS</h2>
        <p class="stellar-nexus__section-desc">
          穿越已知星域，探索每一个可能藏匿资源与机遇的行星。
        </p>
      </div>
      <CosmicPlanet size="large" variant="purple" class="stellar-nexus__worlds-planet" />
    </section>

    <!-- Route / 航线穿越 -->
    <section ref="routeRef" class="stellar-nexus__section stellar-nexus__route">
      <CosmicShip registry="SNT-007" class="stellar-nexus__route-ship" />
      <div class="stellar-nexus__section-content stellar-nexus__section-content--right">
        <span class="stellar-nexus__section-index">02</span>
        <h2 class="stellar-nexus__section-title">ROUTE</h2>
        <p class="stellar-nexus__section-desc">
          从深空集结点出发，沿既定航线穿越小行星带，抵达目标星区。
        </p>
      </div>
    </section>

    <!-- Fleet / 舰队编队 -->
    <section ref="fleetRef" class="stellar-nexus__section stellar-nexus__fleet">
      <div class="stellar-nexus__section-content stellar-nexus__section-content--center">
        <span class="stellar-nexus__section-index">03</span>
        <h2 class="stellar-nexus__section-title">FLEET</h2>
        <p class="stellar-nexus__section-desc">
          多舰种协同作战，从截击到重型轰炸，每一艘舰船都已整备完毕。
        </p>
      </div>
      <div class="stellar-nexus__fleet-formation">
        <CosmicShip registry="SNT-002" class="stellar-nexus__fleet-ship" />
        <CosmicShip registry="SNT-003" class="stellar-nexus__fleet-ship stellar-nexus__fleet-ship--lead" />
        <CosmicShip registry="SNT-004" class="stellar-nexus__fleet-ship" />
      </div>
    </section>

    <!-- Enlist / 加入战队 -->
    <section ref="enlistRef" class="stellar-nexus__section stellar-nexus__enlist">
      <HudPanel class="stellar-nexus__enlist-panel">
        <span class="stellar-nexus__section-index">04</span>
        <h2 class="stellar-nexus__section-title">ENLIST</h2>
        <p class="stellar-nexus__section-desc">
          加入 Stellar Nexus，与我们一起书写星际航行的下一章。
        </p>
        <div class="stellar-nexus__actions">
          <TechButton variant="primary" glow size="large" @click="navigateTo('/join')">
            START APPLICATION
          </TechButton>
          <TechButton variant="ghost" size="large" @click="navigateTo('/fleet')">
            EXPLORE FLEET
          </TechButton>
        </div>
      </HudPanel>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CosmicStarfield from '../components/cosmic/CosmicStarfield.vue'
import CosmicPlanet from '../components/cosmic/CosmicPlanet.vue'
import CosmicShip from '../components/cosmic/CosmicShip.vue'
import HudPanel from '../components/cosmic/HudPanel.vue'
import HudTicker from '../components/cosmic/HudTicker.vue'
import FilmGrain from '../components/cosmic/FilmGrain.vue'
import TechButton from '../components/ui/TechButton.vue'

gsap.registerPlugin(ScrollTrigger)

const router = useRouter()

const worldsRef = ref(null)
const routeRef = ref(null)
const fleetRef = ref(null)
const enlistRef = ref(null)

/** 战队公开统计数据 */
const stats = {
  pilots: 128,
  hours: 2400,
  ships: 12
}

let triggers = []

/**
 * 路由跳转辅助函数
 * @param {string} path - 目标路径
 */
function navigateTo(path) {
  router.push(path)
}

onMounted(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) return

  // Hero 入场动画
  const heroTl = gsap.timeline({ defaults: { ease: 'power2.out' } })
  heroTl
    .from('.stellar-nexus__title-line', { y: 40, opacity: 0, duration: 1, stagger: 0.15 }, 0.2)
    .from('.stellar-nexus__divider', { scaleX: 0, duration: 0.8 }, 0.6)
    .from('.stellar-nexus__subtitle', { y: 20, opacity: 0, duration: 0.8 }, 0.8)
    .from('.stellar-nexus__stat', { y: 30, opacity: 0, duration: 0.7, stagger: 0.1 }, 1)
    .from('.stellar-nexus__hero-ship', { x: 200, opacity: 0, duration: 2.5, ease: 'power1.out' }, 0.8)

  // 章节滚动动画
  triggers.push(
    ScrollTrigger.create({
      trigger: worldsRef.value,
      start: 'top 80%',
      onEnter: () => gsap.fromTo(
        worldsRef.value.querySelectorAll('.stellar-nexus__section-content > *'),
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 }
      )
    }),
    ScrollTrigger.create({
      trigger: worldsRef.value,
      start: 'top 75%',
      onEnter: () => gsap.fromTo(
        worldsRef.value.querySelector('.cosmic-planet'),
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2, ease: 'back.out(1.2)' }
      )
    }),
    ScrollTrigger.create({
      trigger: routeRef.value,
      start: 'top 80%',
      onEnter: () => gsap.fromTo(
        routeRef.value.querySelector('.cosmic-ship'),
        { x: -200, opacity: 0 },
        { x: 0, opacity: 1, duration: 1.5, ease: 'power1.out' }
      )
    }),
    ScrollTrigger.create({
      trigger: fleetRef.value,
      start: 'top 80%',
      onEnter: () => gsap.fromTo(
        fleetRef.value.querySelectorAll('.stellar-nexus__fleet-ship'),
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15 }
      )
    }),
    ScrollTrigger.create({
      trigger: enlistRef.value,
      start: 'top 80%',
      onEnter: () => gsap.fromTo(
        enlistRef.value.querySelector('.hud-panel'),
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8 }
      )
    })
  )
})

onUnmounted(() => {
  triggers.forEach((trigger) => trigger.kill())
  triggers = []
})
</script>

<style scoped>
.stellar-nexus {
  position: relative;
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text-heading);
  overflow-x: hidden;
}

.stellar-nexus__starfield {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.stellar-nexus__grain {
  z-index: 50;
}

.stellar-nexus__section {
  position: relative;
  z-index: 10;
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 6rem 8vw;
  box-sizing: border-box;
}

/* Hero 区域 */
.stellar-nexus__hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr auto;
  gap: 2rem;
  align-items: center;
}

.stellar-nexus__hero-content {
  grid-column: 1;
  grid-row: 1;
  align-self: end;
}

.stellar-nexus__title {
  font-family: var(--font-display);
  font-size: clamp(3rem, 8vw, 6.5rem);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: 0.08em;
  margin: 0;
}

.stellar-nexus__title-line {
  display: block;
}

.stellar-nexus__title-line--cyan {
  color: var(--color-accent);
}

.stellar-nexus__divider {
  width: 120px;
  height: 2px;
  background: var(--color-accent);
  margin: 1.5rem 0;
}

.stellar-nexus__subtitle {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  letter-spacing: 0.15em;
  color: var(--color-text-body);
  margin: 0 0 2rem;
}

.stellar-nexus__stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stellar-nexus__stat {
  min-width: 140px;
}

.stellar-nexus__stat-value {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  color: var(--color-text-heading);
}

.stellar-nexus__stat-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  color: var(--color-text-dim);
  margin-top: 0.25rem;
}

.stellar-nexus__hero-ship {
  grid-column: 2;
  grid-row: 1;
  justify-self: center;
  align-self: center;
}

.stellar-nexus__ticker {
  grid-column: 1 / -1;
  grid-row: 2;
  align-self: end;
}

/* 章节通用样式 */
.stellar-nexus__section-content {
  max-width: 480px;
}

.stellar-nexus__section-content--left {
  margin-right: auto;
}

.stellar-nexus__section-content--right {
  margin-left: auto;
  text-align: right;
}

.stellar-nexus__section-content--center {
  margin: 0 auto;
  text-align: center;
}

.stellar-nexus__section-index {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-accent);
  letter-spacing: 0.1em;
}

.stellar-nexus__section-title {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  margin: 0.5rem 0 1rem;
}

.stellar-nexus__section-desc {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-body);
  line-height: 1.7;
  margin: 0;
}

/* Worlds 区域 */
.stellar-nexus__worlds {
  justify-content: space-between;
}

.stellar-nexus__worlds-planet {
  margin-left: auto;
}

/* Route 区域 */
.stellar-nexus__route {
  justify-content: space-between;
  flex-direction: row-reverse;
}

/* Fleet 区域 */
.stellar-nexus__fleet {
  flex-direction: column;
  justify-content: center;
  gap: 3rem;
}

.stellar-nexus__fleet-formation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.stellar-nexus__fleet-ship--lead {
  transform: scale(1.2);
}

/* Enlist 区域 */
.stellar-nexus__enlist {
  justify-content: center;
}

.stellar-nexus__enlist-panel {
  max-width: 600px;
  text-align: center;
}

.stellar-nexus__actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  flex-wrap: wrap;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .stellar-nexus__hero {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    text-align: center;
  }

  .stellar-nexus__hero-content,
  .stellar-nexus__hero-ship {
    grid-column: 1;
  }

  .stellar-nexus__hero-content {
    grid-row: 1;
  }

  .stellar-nexus__hero-ship {
    grid-row: 2;
    justify-self: center;
  }

  .stellar-nexus__ticker {
    grid-row: 3;
  }

  .stellar-nexus__divider {
    margin: 1.5rem auto;
  }

  .stellar-nexus__stats {
    justify-content: center;
  }

  .stellar-nexus__worlds,
  .stellar-nexus__route {
    flex-direction: column;
    gap: 3rem;
    text-align: center;
  }

  .stellar-nexus__section-content--left,
  .stellar-nexus__section-content--right,
  .stellar-nexus__worlds-planet {
    margin: 0 auto;
  }
}
</style>
