<!--
  @file 首页视图组件
  @description SpaceX-style minimal landing — 沉浸、留白、内容即视觉
  @version 11.0 - SpaceX Minimal
-->

<template>
  <div class="home">

    <!-- ═══ 1. HERO — 100vh 全屏沉浸 ═══ -->
    <section class="hero">
      <div class="hero__bg">
        <img src="/images/sc/sc-matte-painting.jpg" alt="" class="hero__bg-img" />
        <div class="hero__bg-overlay"></div>
      </div>

      <div class="hero__content">
        <h1 class="hero__title">STELLAR<br/>NEXUS</h1>
        <p class="hero__tagline">EXPLORE · FIGHT · CONQUER</p>
      </div>

      <div class="hero__scroll">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M7 10l5 5 5-5"/>
        </svg>
      </div>
    </section>

    <!-- ═══ 2. KEY NUMBERS — 两个核心数据 ═══ -->
    <section class="key-numbers" data-animate>
      <div class="container">
        <div class="key-numbers__grid">
          <div class="key-number">
            <span class="key-number__value">128</span>
            <span class="key-number__label">ACTIVE PILOTS</span>
          </div>
          <div class="key-number">
            <span class="key-number__value">2,400+</span>
            <span class="key-number__label">FLIGHT HOURS</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ 3. FLEET PREVIEW — 3 张舰船卡片 ═══ -->
    <section class="fleet-preview section" data-animate>
      <div class="container">
        <div class="fleet-preview__header">
          <span class="section-label">// FLEET REGISTRY</span>
          <h2 class="section-title">舰队展厅</h2>
        </div>

        <div class="fleet-grid">
          <div
            v-for="(ship, idx) in fleetShips"
            :key="idx"
            class="fleet-card"
            :class="{ 'is-tapped': tappedIndex === idx }"
            @click="toggleCard(idx)"
          >
            <div class="fleet-card__img-wrap">
              <img :src="ship.image" :alt="ship.name" class="fleet-card__img" loading="lazy" />
            </div>
            <div class="fleet-card__body">
              <h3 class="fleet-card__name">{{ ship.name }}</h3>
              <span class="fleet-card__role">{{ ship.role }}</span>
              <span class="fleet-card__hint">explore →</span>
              <div class="fleet-card__specs">
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

        <div class="fleet-preview__more">
          <RouterLink to="/fleet" class="link-arrow">查看全部舰队 →</RouterLink>
        </div>
      </div>
    </section>

    <!-- ═══ 4. CTA — 页面底部行动号召 ═══ -->
    <section class="cta-section" data-animate>
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">READY TO JOIN?</h2>
          <p class="cta-desc">加入我们的行列，与百名飞行员一起征服星辰大海。</p>
          <div class="cta-actions">
            <RouterLink to="/join" class="btn-primary">START APPLICATION</RouterLink>
            <RouterLink to="/fleet" class="btn-ghost">EXPLORE FLEET</RouterLink>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { onMounted } from 'vue'

const fleetShips = ref([
  {
    name: 'Aegis Hammerhead',
    role: '重型护卫舰 · Capital',
    image: '/images/sc/sc-bengal.jpg',
    specs: [
      { label: '火力', value: 92 },
      { label: '防御', value: 88 },
      { label: '机动', value: 35 },
    ]
  },
  {
    name: 'RSI Constellation',
    role: '多功能巡洋舰 · Large',
    image: '/images/sc/sc-constellation.jpg',
    specs: [
      { label: '火力', value: 70 },
      { label: '防御', value: 65 },
      { label: '机动', value: 55 },
    ]
  },
  {
    name: 'Anvil Arrow',
    role: '轻型战斗机 · Small',
    image: '/images/sc/sc-buccaneer.jpg',
    specs: [
      { label: '火力', value: 55 },
      { label: '防御', value: 30 },
      { label: '机动', value: 95 },
    ]
  },
])

const tappedIndex = ref(null)

function toggleCard(idx) {
  // accordion: 展开新卡片时自动收起其他
  if (tappedIndex.value === idx) {
    tappedIndex.value = null
  } else {
    tappedIndex.value = idx
  }
}

// 入场动画 — IntersectionObserver
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
}

.section-title {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--color-text-heading);
  letter-spacing: -0.02em;
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

.spec-bar {
  flex: 1;
  height: 3px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
}

.spec-bar__fill {
  height: 100%;
  background: var(--color-accent);
  border-radius: 2px;
  transition: width 0.8s var(--ease-smooth);
}

/* Buttons */
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

/* Arrow link */
.link-arrow {
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--color-accent);
  text-decoration: none;
  transition: all var(--duration-normal) var(--ease-smooth);
}

.link-arrow:hover {
  color: var(--color-accent-bright);
  letter-spacing: 0.1em;
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
   1. HERO — 全屏沉浸
   ═══════════════════════════════════════════════════════════ */

.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding-bottom: 12vh;
  padding-left: clamp(2rem, 8vw, 120px);
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
  filter: brightness(0.5) saturate(0.9);
}

.hero__bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    var(--color-bg) 0%,
    rgba(5, 5, 8, 0.6) 40%,
    transparent 100%
  );
}

.hero__content {
  position: relative;
  z-index: 1;
  text-align: left;
}

.hero__title {
  font-family: var(--font-display);
  font-size: var(--text-hero);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
  color: #ffffff;
}

.hero__tagline {
  font-family: var(--font-data);
  font-size: var(--text-sm);
  letter-spacing: 0.3em;
  color: var(--raw-gray-3);
  margin-top: var(--space-4);
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
   2. KEY NUMBERS — 两个核心数据
   ═══════════════════════════════════════════════════════════ */

.key-numbers {
  padding: var(--space-16) 0 var(--space-12);
}

.key-numbers__grid {
  display: flex;
  justify-content: center;
  gap: var(--space-16);
}

.key-number {
  text-align: center;
}

.key-number__value {
  display: block;
  font-family: var(--font-display);
  font-size: clamp(4rem, 10vw, 8rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--color-text-heading);
}

.key-number__label {
  display: block;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.2em;
  color: var(--color-text-label);
  margin-top: var(--space-3);
}

/* ═══════════════════════════════════════════════════════════
   3. FLEET PREVIEW — 3 张舰船卡片
   ═══════════════════════════════════════════════════════════ */

.fleet-preview__header {
  margin-bottom: var(--space-10);
}

.fleet-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.fleet-card {
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  transition: all var(--duration-normal) var(--ease-smooth);
  cursor: pointer;
}

.fleet-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.fleet-card__img-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.fleet-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s var(--ease-smooth);
}

.fleet-card:hover .fleet-card__img {
  transform: scale(1.03);
}

.fleet-card__body {
  padding: var(--space-5);
}

.fleet-card__name {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-heading);
  margin-bottom: var(--space-1);
  letter-spacing: -0.01em;
}

.fleet-card__role {
  display: block;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  color: var(--color-text-label);
  margin-bottom: var(--space-4);
}

.fleet-card__specs {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s var(--ease-out);
}

.fleet-card__hint {
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  /* 不用opacity，按主题切颜色，保证浅色模式对比度 */
  color: var(--color-text-hint);
  transition: color 0.2s var(--ease-smooth);
}

.fleet-card:hover .fleet-card__hint,
.fleet-card.is-tapped .fleet-card__hint {
  opacity: 0;
  height: 0;
  overflow: hidden;
  margin: 0;
}

.fleet-card:hover .fleet-card__specs,
.fleet-card.is-tapped .fleet-card__specs {
  max-height: 200px;
}

.fleet-preview__more {
  text-align: center;
  margin-top: var(--space-10);
}

/* ═══════════════════════════════════════════════════════════
   4. CTA — 页面底部行动号召
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

.cta-title {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: 700;
  color: var(--color-text-heading);
  letter-spacing: -0.02em;
  margin-bottom: var(--space-4);
}

.cta-desc {
  font-size: var(--text-md);
  color: var(--color-text-body);
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
  .fleet-grid {
    grid-template-columns: 1fr;
    max-width: 600px;
    margin-inline: auto;
  }

  .key-numbers__grid {
    gap: var(--space-10);
  }
}

@media (max-width: 768px) {
  .container {
    padding-inline: 1.25rem;
  }

  .section {
    padding: var(--space-10) 0;
  }

  .hero {
    padding-left: 1.25rem;
    padding-bottom: 8vh;
  }

  .hero__title {
    font-size: clamp(2.5rem, 12vw, 4rem);
  }

  .key-numbers {
    padding: var(--space-10) 0 var(--space-8);
  }

  .key-numbers__grid {
    flex-direction: column;
    gap: var(--space-8);
  }

  .key-number__value {
    font-size: clamp(3rem, 15vw, 5rem);
  }

  .fleet-card__specs {
    max-height: none;
    margin-top: var(--space-3);
  }

  .cta-title {
    font-size: var(--text-3xl);
  }

  .cta-actions {
    flex-direction: column;
    width: 100%;
    max-width: 280px;
  }

  .cta-actions .btn-primary,
  .cta-actions .btn-ghost {
    width: 100%;
    justify-content: center;
  }
}
</style>
