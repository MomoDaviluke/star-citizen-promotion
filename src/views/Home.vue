<!--
  @file 首页视图组件
  @description Cinematic Sci-Fi Spectacle — 电影级科幻视觉首页
  @version 10.0 - Cinematic Sci-Fi
-->

<template>
  <div class="home">

    <!-- ═══ 1. HERO — 100vh 全屏 ═══ -->
    <section class="hero">
      <div class="hero__bg">
        <img src="/images/sc/sc-hero.jpg" alt="" class="hero__bg-img" />
        <div class="hero__bg-overlay"></div>
        <div class="hero__bg-orb hero__bg-orb--cyan"></div>
        <div class="hero__bg-orb hero__bg-orb--amber"></div>
      </div>

      <div class="hero__content">
        <span class="hero__pill">// STAR CITIZEN GUILD</span>
        <h1 class="hero__title">STELLAR<br/>NEXUS</h1>
        <p class="hero__subtitle">EXPLORE &middot; FIGHT &middot; CONQUER</p>
        <div class="hero__actions">
          <RouterLink to="/join" class="btn-amber">加入战队</RouterLink>
          <RouterLink to="/fleet" class="btn-ghost">浏览舰队</RouterLink>
        </div>
      </div>

      <div class="hero__scroll">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M7 10l5 5 5-5"/>
        </svg>
      </div>
    </section>

    <!-- ═══ 2. STATS STRIP — 横向指标条 ═══ -->
    <section class="stats-strip" data-animate>
      <div class="stats-strip__line"></div>
      <div class="container">
        <div class="stats-strip__grid">
          <div v-for="(stat, i) in statsData" :key="i" class="stats-strip__item">
            <span class="stats-strip__value font-data">{{ stat.value }}</span>
            <span class="stats-strip__label">{{ stat.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ 3. FLEET SHOWCASE — 非对称 Bento 网格 ═══ -->
    <section class="fleet-showcase section" data-animate>
      <div class="container">
        <span class="section-label">// FLEET REGISTRY</span>
        <h2 class="section-title">舰队展厅</h2>

        <div class="bento-grid">
          <!-- 大卡片 -->
          <div class="bento-main bezel">
            <div class="bezel__inner">
              <div class="bento-main__img-wrap">
                <img src="/images/sc/sc-bengal.jpg" alt="Aegis Hammerhead" class="bento-main__img" loading="lazy" />
              </div>
              <div class="bento-main__info">
                <span class="bento-main__role">重型护卫舰</span>
                <h3 class="bento-main__name">Aegis Hammerhead</h3>
                <div class="bento-main__specs">
                  <div v-for="(spec, si) in fleetShips[0].specs" :key="si" class="spec-row">
                    <span class="spec-row__label">{{ spec.label }}</span>
                    <div class="spec-bar">
                      <div class="spec-bar__fill" :style="{ width: spec.value + '%' }"></div>
                    </div>
                    <span class="spec-row__val font-data">{{ spec.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧两张小卡片 -->
          <div class="bento-side">
            <div v-for="(ship, idx) in fleetShips.slice(1, 3)" :key="idx" class="bento-card bezel">
              <div class="bezel__inner">
                <div class="bento-card__header">
                  <span class="bento-card__role">{{ ship.role }}</span>
                  <span class="bento-card__class">{{ ship.class }}</span>
                </div>
                <h4 class="bento-card__name">{{ ship.name }}</h4>
                <div class="bento-card__specs">
                  <div v-for="(spec, si) in ship.specs" :key="si" class="spec-row">
                    <span class="spec-row__label">{{ spec.label }}</span>
                    <div class="spec-bar">
                      <div class="spec-bar__fill" :style="{ width: spec.value + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ 4. FEATURED PILOT — 分屏布局 ═══ -->
    <section class="pilot-section section" data-animate>
      <div class="container">
        <div class="pilot-grid">
          <div class="pilot-portrait">
            <div class="pilot-portrait__frame">
              <img :src="currentPilot.avatar" :alt="currentPilot.name" class="pilot-portrait__img" loading="lazy" />
            </div>
          </div>

          <div class="pilot-detail">
            <span class="section-label">// ACE PILOT</span>
            <h2 class="pilot-detail__name">{{ currentPilot.name }}</h2>
            <span class="pilot-detail__callsign font-data">{{ currentPilot.callsign }}</span>

            <div class="pilot-detail__ship">
              <span class="pilot-detail__ship-label">当前座驾</span>
              <span class="pilot-detail__ship-name">{{ currentPilot.ship }}</span>
            </div>

            <div class="pilot-detail__stats">
              <div v-for="(stat, si) in currentPilot.stats" :key="si" class="spec-row spec-row--wide">
                <span class="spec-row__label">{{ stat.label }}</span>
                <div class="spec-bar">
                  <div class="spec-bar__fill spec-bar__fill--cyan" :style="{ width: stat.value + '%' }"></div>
                </div>
                <span class="spec-row__val font-data">{{ stat.value }}%</span>
              </div>
            </div>

            <div class="pilot-nav">
              <button
                v-for="(_, idx) in acePilots"
                :key="idx"
                class="pilot-nav__dot"
                :class="{ 'pilot-nav__dot--active': idx === currentPilotIndex }"
                @click="currentPilotIndex = idx"
              ></button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ 5. SHIP GALLERY — 4卡片网格 ═══ -->
    <section class="gallery-section section" data-animate>
      <div class="container">
        <span class="section-label">// SHIP DATABASE</span>
        <h2 class="section-title">舰船图鉴</h2>

        <div class="gallery-grid">
          <div v-for="(ship, idx) in galleryShips" :key="idx" class="gallery-card bezel">
            <div class="bezel__inner">
              <div class="gallery-card__img-wrap">
                <img :src="ship.image" :alt="ship.name" class="gallery-card__img" loading="lazy" />
              </div>
              <div class="gallery-card__body">
                <h4 class="gallery-card__name">{{ ship.name }}</h4>
                <span class="gallery-card__role">{{ ship.role }}</span>
                <div class="gallery-card__readiness">
                  <span class="gallery-card__readiness-label font-data">READINESS</span>
                  <div class="spec-bar spec-bar--amber">
                    <div class="spec-bar__fill spec-bar__fill--amber" :style="{ width: ship.readiness + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ 6. CTA SECTION — 居中大标题 ═══ -->
    <section class="cta-section" data-animate>
      <div class="container">
        <div class="cta-content">
          <div class="cta-line"></div>
          <h2 class="cta-title">READY TO JOIN?</h2>
          <p class="cta-desc">加入我们的行列，与百名飞行员一起征服星辰大海。<br/>我们正在寻找有经验、有热情的飞行员。</p>
          <div class="cta-actions">
            <RouterLink to="/join" class="btn-amber">START APPLICATION</RouterLink>
            <RouterLink to="/fleet" class="btn-ghost">EXPLORE FLEET</RouterLink>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const statsData = ref([
  { value: '128', label: 'ACTIVE PILOTS' },
  { value: '47', label: 'MISSIONS COMPLETE' },
  { value: '36', label: 'FLEET VESSELS' },
  { value: '87%', label: 'WIN RATE' },
])

const fleetShips = ref([
  {
    name: 'Aegis Hammerhead',
    role: '重型护卫舰',
    class: 'Capital',
    specs: [
      { label: '火力', value: 92 },
      { label: '防御', value: 88 },
      { label: '机动', value: 35 },
    ]
  },
  {
    name: 'RSI Constellation',
    role: '多功能巡洋舰',
    class: 'Large',
    specs: [
      { label: '火力', value: 70 },
      { label: '防御', value: 65 },
      { label: '机动', value: 55 },
    ]
  },
  {
    name: 'Anvil Arrow',
    role: '轻型战斗机',
    class: 'Small',
    specs: [
      { label: '火力', value: 55 },
      { label: '防御', value: 30 },
      { label: '机动', value: 95 },
    ]
  },
  {
    name: 'MISC Prospector',
    role: '工业采矿船',
    class: 'Medium',
    specs: [
      { label: '采矿', value: 85 },
      { label: '防御', value: 25 },
      { label: '机动', value: 60 },
    ]
  },
])

const acePilots = ref([
  {
    name: 'Nova Spectre',
    callsign: 'NS-7741',
    role: '舰队指挥官',
    avatar: '/images/sc/sc-members.jpg',
    ship: 'Aegis Hammerhead',
    missions: 312,
    hours: 890,
    stats: [
      { label: '战斗', value: 94 },
      { label: '指挥', value: 98 },
      { label: '导航', value: 87 },
      { label: '生存', value: 91 },
    ]
  },
  {
    name: 'Iron Viper',
    callsign: 'IV-3302',
    role: '战斗机王牌',
    avatar: '/images/sc/sc-members.jpg',
    ship: 'Anvil Arrow',
    missions: 287,
    hours: 756,
    stats: [
      { label: '战斗', value: 97 },
      { label: '指挥', value: 72 },
      { label: '导航', value: 85 },
      { label: '生存', value: 88 },
    ]
  },
  {
    name: 'Ghost Rider',
    callsign: 'GR-0019',
    role: '侦察专家',
    avatar: '/images/sc/sc-projects.jpg',
    ship: 'RSI Constellation',
    missions: 245,
    hours: 620,
    stats: [
      { label: '战斗', value: 78 },
      { label: '指挥', value: 80 },
      { label: '导航', value: 96 },
      { label: '生存', value: 92 },
    ]
  },
])

const currentPilotIndex = ref(0)
const currentPilot = computed(() => acePilots.value[currentPilotIndex.value])

const galleryShips = ref([
  { name: 'Aegis Hammerhead', role: '重型护卫舰', image: '/images/sc/sc-bengal.jpg', readiness: 95 },
  { name: 'RSI Constellation', role: '多功能巡洋舰', image: '/images/sc/sc-constellation.jpg', readiness: 82 },
  { name: 'Anvil Arrow', role: '轻型战斗机', image: '/images/sc/sc-buccaneer.jpg', readiness: 90 },
  { name: 'MISC Prospector', role: '工业采矿船', image: '/images/sc/sc-spaceship-4k.jpg', readiness: 78 },
])

// 入场动画 — IntersectionObserver
import { onMounted } from 'vue'

onMounted(() => {
  const sections = document.querySelectorAll('[data-animate]')
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1 })

  sections.forEach((s) => observer.observe(s))
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════
   BASE / SHARED
   ═══════════════════════════════════════════════════════════ */

.home {
  overflow-x: hidden;
  background: var(--color-bg);
}

.container {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: 2rem;
}

.section {
  padding: var(--space-12) 0;
}

.section-label {
  display: block;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.2em;
  color: var(--color-accent);
  margin-bottom: var(--space-3);
  text-shadow: 0 0 12px rgba(0, 229, 255, 0.4), 0 0 32px rgba(0, 229, 255, 0.15);
}

.section-title {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--color-text-heading);
  letter-spacing: -0.02em;
  margin-bottom: var(--space-10);
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.08);
}

/* Double-Bezel Glass Card */
.bezel {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-2xl);
  padding: 6px;
  transition: border-color var(--duration-normal) var(--ease-smooth),
              box-shadow var(--duration-normal) var(--ease-smooth),
              transform var(--duration-normal) var(--ease-smooth);
}

.bezel:hover {
  border-color: rgba(0, 229, 255, 0.25);
  box-shadow: 0 0 32px rgba(0, 229, 255, 0.12), var(--glow-card-hover);
}

.bezel__inner {
  background: var(--color-bg-mid);
  border-radius: calc(var(--radius-2xl) - 6px);
  padding: var(--space-6);
  box-shadow: var(--shadow-inset);
}

/* Spec bars */
.spec-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.spec-row__label {
  font-family: var(--font-data);
  font-size: var(--text-xs);
  color: var(--color-text-label);
  letter-spacing: 0.05em;
  min-width: 3rem;
}

.spec-row__val {
  font-size: var(--text-xs);
  color: var(--color-text-label);
  min-width: 2rem;
  text-align: right;
}

.spec-bar {
  flex: 1;
  height: 3px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
}

.spec-bar__fill {
  height: 100%;
  background: var(--color-accent-secondary);
  border-radius: 2px;
  transition: width 0.8s var(--ease-smooth);
}

.spec-bar__fill--cyan {
  background: var(--color-accent);
}

.spec-bar__fill--amber {
  background: var(--color-accent-secondary);
}

/* Buttons */
.btn-amber {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: var(--color-accent-secondary);
  color: var(--raw-void-1);
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-smooth);
  text-decoration: none;
}

.btn-amber:hover {
  background: var(--color-accent-secondary-bright);
  box-shadow: var(--glow-amber);
  transform: translateY(-2px);
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: transparent;
  color: var(--color-accent);
  border: 1px solid var(--color-accent);
  border-radius: 9999px;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-smooth);
  text-decoration: none;
}

.btn-ghost:hover {
  background: var(--color-accent-muted);
  box-shadow: var(--glow-cyan);
  transform: translateY(-2px);
}

/* Entrance animation */
[data-animate] {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s var(--ease-smooth), transform 0.8s var(--ease-smooth);
}

[data-animate].is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* ═══════════════════════════════════════════════════════════
   1. HERO
   ═══════════════════════════════════════════════════════════ */

.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 12vh;
  overflow: hidden;
}

.hero__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero__bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.4) saturate(0.8);
}

.hero__bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    var(--color-bg) 0%,
    rgba(5, 5, 8, 0.85) 40%,
    rgba(5, 5, 8, 0.5) 70%,
    transparent 100%
  );
}

.hero__bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
}

.hero__bg-orb--cyan {
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(0, 229, 255, 0.18) 0%, transparent 70%);
  top: 10%;
  left: -10%;
}

.hero__bg-orb--amber {
  width: 700px;
  height: 700px;
  background: radial-gradient(circle, rgba(255, 179, 0, 0.14) 0%, transparent 70%);
  bottom: 5%;
  right: -5%;
}

.hero__content {
  position: relative;
  z-index: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero__pill {
  display: inline-block;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.25em;
  color: var(--color-accent);
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 9999px;
  padding: 0.375rem 1rem;
  margin-bottom: var(--space-5);
}

.hero__title {
  font-family: var(--font-display);
  font-size: var(--text-hero);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: #ffffff;
  margin-bottom: var(--space-4);
  text-shadow: 0 0 80px rgba(0, 229, 255, 0.1);
}

.hero__subtitle {
  font-family: var(--font-data);
  font-size: var(--text-md);
  letter-spacing: 0.3em;
  color: var(--raw-gray-2);
  margin-bottom: var(--space-8);
}

.hero__actions {
  display: flex;
  gap: var(--space-4);
}

.hero__scroll {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  color: var(--raw-gray-3);
  animation: scrollFloat 2.5s ease-in-out infinite;
}

@keyframes scrollFloat {
  0%, 100% { opacity: 0.4; transform: translateX(-50%) translateY(0); }
  50% { opacity: 1; transform: translateX(-50%) translateY(8px); }
}

/* ═══════════════════════════════════════════════════════════
   2. STATS STRIP
   ═══════════════════════════════════════════════════════════ */

.stats-strip {
  padding: var(--space-10) 0;
  position: relative;
  background: linear-gradient(180deg, rgba(0, 229, 255, 0.03) 0%, transparent 100%);
}

.stats-strip__line {
  width: 6rem;
  height: 1px;
  background: var(--color-accent);
  margin: 0 auto var(--space-8);
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.3);
}

.stats-strip__grid {
  display: flex;
  justify-content: center;
  gap: var(--space-12);
}

.stats-strip__item {
  text-align: center;
}

.stats-strip__value {
  display: block;
  font-size: var(--text-4xl);
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
  font-family: var(--font-display);
}

.stats-strip__label {
  display: block;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.2em;
  color: var(--color-accent);
  text-transform: uppercase;
  margin-top: var(--space-2);
}

/* ═══════════════════════════════════════════════════════════
   3. FLEET SHOWCASE — Bento Grid
   ═══════════════════════════════════════════════════════════ */

.bento-grid {
  display: grid;
  grid-template-columns: 7fr 5fr;
  gap: var(--space-4);
}

.bento-main__img-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: calc(var(--radius-2xl) - 6px - var(--space-6));
  overflow: hidden;
  margin-bottom: var(--space-5);
}

.bento-main__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s var(--ease-smooth);
}

.bento-main:hover .bento-main__img {
  transform: scale(1.03);
}

.bento-main__role {
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.15em;
  color: var(--color-accent-secondary);
  text-transform: uppercase;
}

.bento-main__name {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: #ffffff;
  margin: var(--space-2) 0 var(--space-4);
  letter-spacing: -0.01em;
}

.bento-side {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.bento-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.bento-card__role {
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  color: var(--color-text-label);
  text-transform: uppercase;
}

.bento-card__class {
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  color: var(--color-accent);
  padding: 2px 10px;
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-sm);
}

.bento-card__name {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  color: #ffffff;
  margin-bottom: var(--space-4);
}

/* ═══════════════════════════════════════════════════════════
   4. FEATURED PILOT
   ═══════════════════════════════════════════════════════════ */

.pilot-grid {
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: var(--space-10);
  align-items: center;
}

.pilot-portrait__frame {
  position: relative;
  border-radius: var(--radius-xl);
  overflow: hidden;
  aspect-ratio: 3 / 4;
  border: 2px solid rgba(255, 179, 0, 0.3);
  box-shadow: 0 0 40px rgba(255, 179, 0, 0.25), 0 0 80px rgba(255, 179, 0, 0.1), var(--glow-amber);
}

.pilot-portrait__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pilot-detail__name {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: #ffffff;
  margin: var(--space-2) 0 var(--space-1);
  letter-spacing: -0.02em;
}

.pilot-detail__callsign {
  font-family: var(--font-data);
  font-size: var(--text-md);
  color: var(--color-accent);
  letter-spacing: 0.15em;
}

.pilot-detail__ship {
  margin: var(--space-6) 0;
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-lg);
}

.pilot-detail__ship-label {
  display: block;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.15em;
  color: var(--color-text-label);
  text-transform: uppercase;
  margin-bottom: var(--space-1);
}

.pilot-detail__ship-name {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  color: #ffffff;
}

.pilot-detail__stats {
  margin-top: var(--space-5);
}

.spec-row--wide {
  gap: var(--space-4);
}

.spec-row--wide .spec-row__label {
  min-width: 4rem;
}

.pilot-nav {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-6);
}

.pilot-nav__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-smooth);
}

.pilot-nav__dot--active {
  background: var(--color-accent);
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.4);
}

.pilot-nav__dot:hover:not(.pilot-nav__dot--active) {
  background: rgba(255, 255, 255, 0.3);
}

/* ═══════════════════════════════════════════════════════════
   5. SHIP GALLERY
   ═══════════════════════════════════════════════════════════ */

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

.gallery-card__img-wrap {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: calc(var(--radius-2xl) - 6px - var(--space-6));
  overflow: hidden;
  margin-bottom: var(--space-4);
}

.gallery-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s var(--ease-smooth);
}

.gallery-card:hover .gallery-card__img {
  transform: scale(1.05);
}

.gallery-card:hover {
  transform: translateY(-12px);
  box-shadow: 0 0 32px rgba(0, 229, 255, 0.15), 0 20px 60px rgba(0, 0, 0, 0.5);
}

.gallery-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.gallery-card__name {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  color: #ffffff;
}

.gallery-card__role {
  display: inline-block;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  color: var(--color-accent-secondary);
  background: var(--color-accent-secondary-muted);
  border: 1px solid var(--color-border-amber);
  border-radius: 9999px;
  padding: 2px 12px;
  width: fit-content;
}

.gallery-card__readiness {
  margin-top: var(--space-2);
}

.gallery-card__readiness-label {
  display: block;
  font-size: var(--text-xs);
  letter-spacing: 0.15em;
  color: var(--color-text-label);
  margin-bottom: var(--space-1);
}

.spec-bar--amber {
  height: 4px;
}

/* ═══════════════════════════════════════════════════════════
   6. CTA SECTION
   ═══════════════════════════════════════════════════════════ */

.cta-section {
  padding: var(--space-16) 0;
}

.cta-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cta-line {
  width: 8rem;
  height: 4px;
  background: linear-gradient(90deg, transparent, var(--color-accent-secondary), transparent);
  margin-bottom: var(--space-8);
  box-shadow: 0 0 24px rgba(255, 179, 0, 0.35), 0 0 48px rgba(255, 179, 0, 0.15);
}

.cta-title {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  margin-bottom: var(--space-4);
}

.cta-desc {
  font-size: var(--text-md);
  color: var(--raw-gray-2);
  line-height: 1.8;
  max-width: 50ch;
  margin-bottom: var(--space-8);
}

.cta-actions {
  display: flex;
  gap: var(--space-4);
}

/* ═══════════════════════════════════════════════════════════
   RESPONSIVE
   ═══════════════════════════════════════════════════════════ */

@media (max-width: 1024px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }

  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .pilot-grid {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }

  .pilot-portrait__frame {
    aspect-ratio: 16 / 9;
    max-width: 500px;
  }
}

@media (max-width: 768px) {
  .container {
    padding-inline: 1.25rem;
  }

  .section {
    padding: var(--space-10) 0;
  }

  .hero__title {
    font-size: clamp(2.5rem, 10vw, 4rem);
  }

  .hero__actions {
    flex-direction: column;
    width: 100%;
    max-width: 280px;
  }

  .hero__actions .btn-amber,
  .hero__actions .btn-ghost {
    width: 100%;
    justify-content: center;
  }

  .stats-strip__grid {
    flex-wrap: wrap;
    gap: var(--space-8);
  }

  .stats-strip__item {
    flex: 1 1 40%;
  }

  .stats-strip__value {
    font-size: var(--text-3xl);
  }

  .gallery-grid {
    grid-template-columns: 1fr;
  }

  .cta-title {
    font-size: var(--text-3xl);
  }

  .cta-actions {
    flex-direction: column;
    width: 100%;
    max-width: 280px;
  }

  .cta-actions .btn-amber,
  .cta-actions .btn-ghost {
    width: 100%;
    justify-content: center;
  }
}
</style>
