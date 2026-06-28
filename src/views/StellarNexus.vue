<!--
  @file StellarNexus 首页 / 宇宙航行落地页
  @description 站点首页：星云、行星、Star Citizen 官方舰船、全息 HUD、滚动叙事
  本页使用 NASA 公有领域行星纹理与 Star Citizen 官方宣传图作为视觉素材。
  @module views/StellarNexus
-->
<template>
  <main class="stellar-nexus">
    <CosmicNebula class="stellar-nexus__nebula" />
    <CosmicStarfield quality="high" class="stellar-nexus__starfield" />
    <FilmGrain class="stellar-nexus__grain" />

    <!-- Hero / 深空起源 -->
    <section class="stellar-nexus__section stellar-nexus__hero">
      <div class="stellar-nexus__hero-backdrop" aria-hidden="true"></div>
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
      <div
        class="stellar-nexus__hero-ship-bg"
        role="img"
        aria-label="RSI Constellation Andromeda"
      ></div>
      <HudTicker class="stellar-nexus__ticker" />
    </section>

    <!-- Worlds / 行星探索 -->
    <section ref="worldsRef" class="stellar-nexus__section stellar-nexus__worlds">
      <HudPanel class="stellar-nexus__worlds-panel">
        <span class="stellar-nexus__section-index">01</span>
        <h2 class="stellar-nexus__section-title">WORLDS</h2>
        <p class="stellar-nexus__section-desc">
          穿越已知星域，探索每一个可能藏匿资源与机遇的行星。
        </p>
        <div class="stellar-nexus__worlds-data">
          <div class="stellar-nexus__data-row">
            <span class="stellar-nexus__data-key">GRAVITY</span>
            <span class="stellar-nexus__data-value">1.12 G</span>
          </div>
          <div class="stellar-nexus__data-row">
            <span class="stellar-nexus__data-key">ATMOSPHERE</span>
            <span class="stellar-nexus__data-value">BREATHABLE</span>
          </div>
          <div class="stellar-nexus__data-row">
            <span class="stellar-nexus__data-key">RESOURCES</span>
            <span class="stellar-nexus__data-value">RICH</span>
          </div>
        </div>
      </HudPanel>
      <div class="stellar-nexus__worlds-planet-wrap">
        <CosmicPlanet
          size="large"
          variant="mars"
          rotation-duration="110"
          texture="/assets/cosmic/planets/mars.jpg"
          class="stellar-nexus__worlds-planet"
        >
          <template #rings>
            <OrbitalRing :size="560" :count="3" />
          </template>
        </CosmicPlanet>
        <!-- 火卫一 Phobos：不规则小卫星 -->
        <div class="stellar-nexus__mars-moon" aria-hidden="true" />
      </div>
    </section>

    <!-- Route / 航线穿越 -->
    <section ref="routeRef" class="stellar-nexus__section stellar-nexus__route">
      <div class="stellar-nexus__route-visual">
        <CosmicShip
          image="/assets/cosmic/ships/gladius.jpg"
          alt="Aegis Gladius"
          registry="SNT-007"
          class="stellar-nexus__route-ship"
        />
        <svg class="stellar-nexus__route-path" viewBox="0 0 400 200" aria-hidden="true">
          <defs>
            <filter id="route-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            class="stellar-nexus__route-trail"
            d="M20,100 C120,40 280,160 380,100"
            fill="none"
            stroke="rgba(74,158,255,0.45)"
            stroke-width="1.5"
            stroke-dasharray="6 6"
            filter="url(#route-glow)"
          />
          <g class="stellar-nexus__waypoint">
            <circle class="stellar-nexus__waypoint-pulse" cx="120" cy="70" r="10" fill="none" stroke="#4a9eff" stroke-width="1" />
            <circle cx="120" cy="70" r="4" fill="#4a9eff" filter="url(#route-glow)" />
            <text x="120" y="55" fill="#7a7a94" font-size="10" text-anchor="middle">WP-01</text>
          </g>
          <g class="stellar-nexus__waypoint">
            <circle class="stellar-nexus__waypoint-pulse" cx="280" cy="130" r="10" fill="none" stroke="#4a9eff" stroke-width="1" />
            <circle cx="280" cy="130" r="4" fill="#4a9eff" filter="url(#route-glow)" />
            <text x="280" y="155" fill="#7a7a94" font-size="10" text-anchor="middle">WP-02</text>
          </g>
          <g class="stellar-nexus__route-trail-particles" filter="url(#route-glow)">
            <circle cx="60" cy="90" r="1.5" fill="rgba(74,158,255,0.6)" />
            <circle cx="100" cy="55" r="1.2" fill="rgba(74,158,255,0.5)" />
            <circle cx="160" cy="95" r="1.5" fill="rgba(74,158,255,0.55)" />
            <circle cx="240" cy="145" r="1.2" fill="rgba(74,158,255,0.5)" />
            <circle cx="320" cy="115" r="1.5" fill="rgba(74,158,255,0.6)" />
          </g>
        </svg>
      </div>
      <HudPanel class="stellar-nexus__route-panel">
        <span class="stellar-nexus__section-index">02</span>
        <h2 class="stellar-nexus__section-title">ROUTE</h2>
        <p class="stellar-nexus__section-desc">
          从深空集结点出发，沿既定航线穿越小行星带，抵达目标星区。
        </p>
        <div class="stellar-nexus__route-data">
          <div class="stellar-nexus__data-row">
            <span class="stellar-nexus__data-key">ORIGIN</span>
            <span class="stellar-nexus__data-value">STANTON</span>
          </div>
          <div class="stellar-nexus__data-row">
            <span class="stellar-nexus__data-key">DESTINATION</span>
            <span class="stellar-nexus__data-value">PYRO</span>
          </div>
          <div class="stellar-nexus__data-row">
            <span class="stellar-nexus__data-key">DISTANCE</span>
            <span class="stellar-nexus__data-value">47.8 AU</span>
          </div>
        </div>
      </HudPanel>
    </section>

    <!-- Fleet / 舰队编队 -->
    <section ref="fleetRef" class="stellar-nexus__section stellar-nexus__fleet">
      <HudPanel class="stellar-nexus__fleet-panel">
        <span class="stellar-nexus__section-index">03</span>
        <h2 class="stellar-nexus__section-title">FLEET</h2>
        <p class="stellar-nexus__section-desc">
          多舰种协同作战，从截击到重型轰炸，每一艘舰船都已整备完毕。
        </p>
      </HudPanel>
      <div class="stellar-nexus__fleet-formation">
        <TacticalGrid class="stellar-nexus__fleet-grid" />
        <div class="stellar-nexus__fleet-ship-wrap">
          <CosmicShip
            image="/assets/cosmic/ships/gladius.jpg"
            alt="Aegis Gladius"
            registry="SNT-002"
            class="stellar-nexus__fleet-ship"
          />
          <div class="stellar-nexus__ship-plate">
            <span class="stellar-nexus__ship-class">AEGIS GLADIUS</span>
            <span class="stellar-nexus__ship-registry">SNT-002 / INTERCEPTOR</span>
          </div>
        </div>
        <div class="stellar-nexus__fleet-ship-wrap stellar-nexus__fleet-ship-wrap--lead">
          <CosmicShip
            image="/assets/cosmic/ships/hammerhead.png"
            alt="Aegis Hammerhead"
            registry="SNT-003"
            class="stellar-nexus__fleet-ship stellar-nexus__fleet-ship--lead"
          />
          <div class="stellar-nexus__ship-plate">
            <span class="stellar-nexus__ship-class">AEGIS HAMMERHEAD</span>
            <span class="stellar-nexus__ship-registry">SNT-003 / COMBAT READY</span>
          </div>
        </div>
        <div class="stellar-nexus__fleet-ship-wrap">
          <CosmicShip
            image="/assets/cosmic/ships/constellation-andromeda.jpg"
            alt="RSI Constellation Andromeda"
            registry="SNT-004"
            engine-position="right"
            class="stellar-nexus__fleet-ship"
          />
          <div class="stellar-nexus__ship-plate">
            <span class="stellar-nexus__ship-class">RSI CONSTELLATION</span>
            <span class="stellar-nexus__ship-registry">SNT-004 / MULTI-ROLE</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Enlist / 加入战队 -->
    <section ref="enlistRef" class="stellar-nexus__section stellar-nexus__enlist">
      <HudPanel class="stellar-nexus__enlist-panel">
        <span class="stellar-nexus__section-index">04</span>
        <h2 class="stellar-nexus__section-title stellar-nexus__section-title--large">ENLIST</h2>
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

    <!-- 页脚 / 素材声明 -->
    <footer class="stellar-nexus__footer">
      <TacticalGrid class="stellar-nexus__footer-grid" />
      <p class="stellar-nexus__footer-line">
        Star Citizen 舰船图片版权归 Cloud Imperium Games 与 Roberts Space Industries 所有。
      </p>
      <p class="stellar-nexus__footer-line">
        行星纹理来自 NASA / JPL-Caltech 公有领域影像库。
      </p>
      <p class="stellar-nexus__footer-line stellar-nexus__footer-line--dim">
        Stellar Nexus 是非官方粉丝组织，本站不以任何形式营利。
      </p>
    </footer>
  </main>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CosmicNebula from '../components/cosmic/CosmicNebula.vue'
import CosmicStarfield from '../components/cosmic/CosmicStarfield.vue'
import CosmicPlanet from '../components/cosmic/CosmicPlanet.vue'
import CosmicShip from '../components/cosmic/CosmicShip.vue'
import OrbitalRing from '../components/cosmic/OrbitalRing.vue'
import TacticalGrid from '../components/cosmic/TacticalGrid.vue'
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

  // Hero 入场动画：星云、行星、标题、舰船依次浮现
  const heroTl = gsap.timeline({ defaults: { ease: 'power2.out' } })
  heroTl
    .from('.stellar-nexus__nebula', { opacity: 0, duration: 2 }, 0)
    .from('.stellar-nexus__hero-planet-body', { scale: 0.85, opacity: 0, duration: 1.8 }, 0.3)
    .from('.stellar-nexus__title-line', { y: 40, opacity: 0, duration: 1, stagger: 0.15 }, 0.4)
    .from('.stellar-nexus__divider', { scaleX: 0, duration: 0.8 }, 0.8)
    .from('.stellar-nexus__subtitle', { y: 20, opacity: 0, duration: 0.8 }, 1)
    .from('.stellar-nexus__stat', { y: 30, opacity: 0, duration: 0.7, stagger: 0.1 }, 1.2)
    .from('.stellar-nexus__hero-ship', { x: 200, opacity: 0, duration: 2.5, ease: 'power1.out' }, 0.8)

  // 章节滚动动画
  triggers.push(
    ScrollTrigger.create({
      trigger: worldsRef.value,
      start: 'top 80%',
      onEnter: () => gsap.fromTo(
        worldsRef.value.querySelector('.stellar-nexus__worlds-panel'),
        { x: -60, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.9, ease: 'power2.out' }
      )
    }),
    ScrollTrigger.create({
      trigger: worldsRef.value,
      start: 'top 75%',
      onEnter: () => gsap.fromTo(
        worldsRef.value.querySelector('.stellar-nexus__worlds-planet'),
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2, ease: 'back.out(1.2)' }
      )
    }),
    ScrollTrigger.create({
      trigger: routeRef.value,
      start: 'top 80%',
      onEnter: () => {
        const tl = gsap.timeline()
        tl.fromTo(
          routeRef.value.querySelector('.stellar-nexus__route-ship'),
          { x: -200, opacity: 0 },
          { x: 0, opacity: 1, duration: 1.5, ease: 'power1.out' }
        ).fromTo(
          routeRef.value.querySelector('.stellar-nexus__route-path'),
          { opacity: 0 },
          { opacity: 1, duration: 0.8 },
          '-=1'
        )
      }
    }),
    ScrollTrigger.create({
      trigger: fleetRef.value,
      start: 'top 80%',
      onEnter: () => gsap.fromTo(
        fleetRef.value.querySelectorAll('.stellar-nexus__fleet-ship-wrap'),
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15 }
      )
    }),
    ScrollTrigger.create({
      trigger: enlistRef.value,
      start: 'top 80%',
      onEnter: () => gsap.fromTo(
        enlistRef.value.querySelector('.stellar-nexus__enlist-panel'),
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

.stellar-nexus__nebula {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.stellar-nexus__starfield {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
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
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr auto;
  gap: 2rem;
  align-items: center;
  overflow: hidden;
}

.stellar-nexus__hero-backdrop {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(2, 2, 5, 0.92) 0%, rgba(2, 2, 5, 0.72) 35%, rgba(2, 2, 5, 0.25) 60%, rgba(2, 2, 5, 0.55) 100%);
  pointer-events: none;
  z-index: 1;
}

.stellar-nexus__hero-content {
  position: relative;
  grid-column: 1;
  grid-row: 1;
  align-self: end;
  justify-self: start;
  z-index: 3;
  max-width: 720px;
}

.stellar-nexus__title {
  font-family: var(--font-display);
  font-size: clamp(3.2rem, 9vw, 7.5rem);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: 0.1em;
  margin: 0;
  text-shadow:
    0 0 20px rgba(74, 158, 255, 0.25),
    0 0 60px rgba(74, 158, 255, 0.1);
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
  box-shadow: 0 0 12px rgba(74, 158, 255, 0.4);
}

.stellar-nexus__subtitle {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  letter-spacing: 0.25em;
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

.stellar-nexus__hero-ship-bg {
  position: absolute;
  inset: 0;
  background-image: url('/assets/cosmic/ships/constellation-andromeda.jpg');
  background-size: cover;
  background-position: 60% 40%;
  background-repeat: no-repeat;
  filter: brightness(0.55) contrast(1.1) saturate(0.7) sepia(0.2) hue-rotate(165deg);
  opacity: 0.85;
  z-index: 0;
}

.stellar-nexus__ticker {
  grid-column: 1 / -1;
  grid-row: 2;
  align-self: end;
}

/* 章节通用样式 */
.stellar-nexus__section-title {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  margin: 0.5rem 0 1rem;
}

.stellar-nexus__section-title--large {
  font-size: clamp(2.8rem, 7vw, 5rem);
}

.stellar-nexus__section-index {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-accent);
  letter-spacing: 0.1em;
}

.stellar-nexus__section-desc {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-body);
  line-height: 1.8;
  margin: 0 0 1.5rem;
}

.stellar-nexus__data-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(74, 158, 255, 0.1);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
}

.stellar-nexus__data-key {
  color: var(--color-text-dim);
}

.stellar-nexus__data-value {
  color: var(--color-text-heading);
}

/* Worlds 区域 */
.stellar-nexus__worlds {
  justify-content: space-between;
  gap: 3rem;
}

.stellar-nexus__worlds-panel {
  max-width: 420px;
}

.stellar-nexus__worlds-planet-wrap {
  position: relative;
  margin-left: auto;
  width: min(42vw, 520px);
}

.stellar-nexus__worlds-planet {
  width: 100%;
  height: auto;
}

/* 火卫一 Phobos：不规则小卫星，沿椭圆轨道缓慢运行 */
.stellar-nexus__mars-moon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 14px;
  margin: -7px 0 0 -9px;
  border-radius: 45% 55% 40% 60% / 55% 45% 60% 40%;
  background:
    radial-gradient(circle at 30% 30%, rgba(140, 130, 120, 0.8), transparent 40%),
    radial-gradient(circle at 70% 60%, rgba(60, 55, 50, 0.9), transparent 35%),
    linear-gradient(145deg, #6d635a 0%, #3a3430 60%, #1f1c1a 100%);
  box-shadow:
    inset -3px -3px 6px rgba(0, 0, 0, 0.9),
    0 0 10px rgba(0, 0, 0, 0.5);
  opacity: 0.85;
  pointer-events: none;
  transform-origin: center center;
  animation: phobos-orbit 28s linear infinite;
}

@keyframes phobos-orbit {
  0% {
    transform: rotate(0deg) translateX(230px) translateZ(20px) rotate(0deg);
  }
  25% {
    transform: rotate(90deg) translateX(260px) translateZ(-40px) rotate(-90deg);
  }
  50% {
    transform: rotate(180deg) translateX(230px) translateZ(20px) rotate(-180deg);
  }
  75% {
    transform: rotate(270deg) translateX(200px) translateZ(80px) rotate(-270deg);
  }
  100% {
    transform: rotate(360deg) translateX(230px) translateZ(20px) rotate(-360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .stellar-nexus__mars-moon {
    animation: none;
    transform: rotate(45deg) translateX(240px) translateZ(20px) rotate(-45deg);
  }
}

/* Route 区域 */
.stellar-nexus__route {
  justify-content: space-between;
  flex-direction: row-reverse;
  gap: 3rem;
}

.stellar-nexus__route-visual {
  position: relative;
  width: min(45vw, 560px);
}

.stellar-nexus__route-ship {
  position: relative;
  z-index: 2;
  width: 100%;
}

.stellar-nexus__route-path {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: auto;
  transform: translateY(-50%);
  z-index: 1;
  overflow: visible;
}

.stellar-nexus__route-trail {
  animation: route-dash 3s linear infinite;
}

@keyframes route-dash {
  to { stroke-dashoffset: -24; }
}

.stellar-nexus__waypoint-pulse {
  transform-origin: center;
  animation: waypoint-pulse 2s ease-out infinite;
  opacity: 0.6;
}

@keyframes waypoint-pulse {
  0% { transform: scale(0.8); opacity: 0.6; }
  70% { transform: scale(1.6); opacity: 0; }
  100% { transform: scale(1.6); opacity: 0; }
}

.stellar-nexus__route-trail-particles circle {
  animation: particle-twinkle 2.5s ease-in-out infinite;
}

.stellar-nexus__route-trail-particles circle:nth-child(2) { animation-delay: 0.4s; }
.stellar-nexus__route-trail-particles circle:nth-child(3) { animation-delay: 0.8s; }
.stellar-nexus__route-trail-particles circle:nth-child(4) { animation-delay: 1.2s; }
.stellar-nexus__route-trail-particles circle:nth-child(5) { animation-delay: 1.6s; }

@keyframes particle-twinkle {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.85; }
}

.stellar-nexus__route-panel {
  max-width: 420px;
  text-align: right;
}

.stellar-nexus__route-panel .stellar-nexus__data-row {
  flex-direction: row-reverse;
}

/* Fleet 区域 */
.stellar-nexus__fleet {
  flex-direction: column;
  justify-content: center;
  gap: 3rem;
}

.stellar-nexus__fleet-panel {
  max-width: 640px;
  text-align: center;
}

.stellar-nexus__fleet-formation {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3rem;
  flex-wrap: nowrap;
  width: 100%;
  max-width: 1100px;
  padding: 4rem 2rem;
}

.stellar-nexus__fleet-grid {
  border-radius: 12px;
}

.stellar-nexus__fleet-ship-wrap {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* 护航舰：两翼抬高，形成倒 V 编队 */
.stellar-nexus__fleet-ship-wrap:not(.stellar-nexus__fleet-ship-wrap--lead) {
  transform: translateY(-40px);
}

.stellar-nexus__fleet-ship {
  width: min(28vw, 220px);
}

.stellar-nexus__fleet-ship-wrap--lead {
  order: 2;
}

.stellar-nexus__fleet-ship-wrap--lead .stellar-nexus__fleet-ship {
  width: min(45vw, 420px);
}

.stellar-nexus__ship-plate {
  padding: 0.625rem 1rem;
  border: 1px solid rgba(74, 158, 255, 0.25);
  background: rgba(5, 5, 8, 0.65);
  backdrop-filter: blur(6px);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
  text-align: center;
  box-shadow: 0 0 16px rgba(74, 158, 255, 0.08);
}

.stellar-nexus__ship-class {
  display: block;
  color: var(--color-text-heading);
}

.stellar-nexus__ship-registry {
  display: block;
  color: var(--color-text-dim);
  margin-top: 0.25rem;
}

/* Enlist 区域 */
.stellar-nexus__enlist {
  justify-content: center;
}

.stellar-nexus__enlist-panel {
  max-width: 680px;
  width: 100%;
  text-align: center;
  padding: 3rem;
}

.stellar-nexus__actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  flex-wrap: wrap;
}

/* 页脚 / 素材声明 */
.stellar-nexus__footer {
  position: relative;
  z-index: 10;
  padding: 3rem 8vw;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.35));
  overflow: hidden;
}

.stellar-nexus__footer-grid {
  opacity: 0.4;
}

.stellar-nexus__footer-line {
  position: relative;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--color-text-dim);
  line-height: 1.8;
  margin: 0;
}

.stellar-nexus__footer-line--dim {
  color: rgba(255, 255, 255, 0.3);
  margin-top: 0.5rem;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .stellar-nexus__hero {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    text-align: center;
  }

  .stellar-nexus__hero-content {
    grid-column: 1;
    grid-row: 1;
    justify-self: center;
    padding-top: 4rem;
  }

  .stellar-nexus__hero-ship-bg {
    background-position: 55% 20%;
    filter: brightness(0.45) contrast(1.1) saturate(0.7) sepia(0.2) hue-rotate(165deg);
  }

  .stellar-nexus__hero-backdrop {
    background:
      linear-gradient(180deg, rgba(2, 2, 5, 0.95) 0%, rgba(2, 2, 5, 0.72) 25%, rgba(2, 2, 5, 0.35) 55%, rgba(2, 2, 5, 0.75) 100%);
  }

  .stellar-nexus__ticker {
    grid-row: 2;
  }

  .stellar-nexus__divider {
    margin: 1.5rem auto;
  }

  .stellar-nexus__stats {
    justify-content: center;
  }

  .stellar-nexus__worlds {
    flex-direction: column-reverse;
    gap: 2rem;
    text-align: center;
  }

  .stellar-nexus__route {
    flex-direction: column;
    gap: 3rem;
    text-align: center;
  }

  .stellar-nexus__worlds-panel,
  .stellar-nexus__route-panel {
    margin: 0 auto;
  }

  .stellar-nexus__route-panel {
    text-align: center;
  }

  .stellar-nexus__route-panel .stellar-nexus__data-row {
    flex-direction: row;
  }

  .stellar-nexus__worlds-planet-wrap {
    width: min(70vw, 320px);
    margin: 0 auto;
  }

  .stellar-nexus__mars-moon {
    width: 12px;
    height: 10px;
    margin: -5px 0 0 -6px;
  }

  @keyframes phobos-orbit {
    0% {
      transform: rotate(0deg) translateX(140px) translateZ(15px) rotate(0deg);
    }
    25% {
      transform: rotate(90deg) translateX(160px) translateZ(-25px) rotate(-90deg);
    }
    50% {
      transform: rotate(180deg) translateX(140px) translateZ(15px) rotate(-180deg);
    }
    75% {
      transform: rotate(270deg) translateX(120px) translateZ(55px) rotate(-270deg);
    }
    100% {
      transform: rotate(360deg) translateX(140px) translateZ(15px) rotate(-360deg);
    }
  }

  .stellar-nexus__route-visual {
    width: min(80vw, 420px);
    margin: 0 auto;
  }

  .stellar-nexus__fleet-formation {
    flex-wrap: wrap;
    gap: 1.5rem;
    padding: 2rem 1rem;
  }

  .stellar-nexus__fleet-ship-wrap:not(.stellar-nexus__fleet-ship-wrap--lead) {
    transform: translateY(0);
  }

  .stellar-nexus__fleet-ship {
    width: min(40vw, 160px);
  }

  .stellar-nexus__fleet-ship-wrap--lead .stellar-nexus__fleet-ship {
    width: min(55vw, 260px);
  }

  .stellar-nexus__ship-plate {
    font-size: var(--text-xs);
  }
}

@media (prefers-reduced-motion: reduce) {
  .stellar-nexus__route-trail,
  .stellar-nexus__waypoint-pulse,
  .stellar-nexus__route-trail-particles circle {
    animation: none;
  }
}
</style>
