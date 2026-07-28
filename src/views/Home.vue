<!--
  @file 首页视图组件
  @description Cinematic Sci-Fi Landing — 沉浸式星际体验
  @module views/Home
  @version 12.0 - Glassmorphism Enhanced
-->

<template>
  <div ref="rootRef" class="home">

    <!-- ═══ 1. HERO — 100vh 全屏沉浸 ═══ -->
    <HeroSection>
      <template #data-panel>
        <HeroDataPanel :items="heroDataPanelItems" />
      </template>
    </HeroSection>

    <HeroTicker />

    <!-- ═══ 2. KEY NUMBERS — 四个核心数据 ═══ -->
    <section ref="keyNumbersRef" class="key-numbers">
      <div class="container">
        <div class="key-numbers__grid">
          <div v-for="item in keyNumbers" :key="item.label" class="key-number">
            <span
              class="key-number__value"
              :data-count-target="item.value"
              :data-count-suffix="item.suffix"
            >{{ item.value }}{{ item.suffix }}</span>
            <span class="key-number__label">{{ item.label }}</span>
          </div>
        </div>
      </div>
      <div class="section-divider" aria-hidden="true">
        <span class="section-divider__line"></span>
        <span class="section-divider__diamond"></span>
        <span class="section-divider__line"></span>
      </div>
    </section>

    <!-- ═══ 3. PLANET EXPLORATION — 火星预览板块 ═══ -->
    <HomeWorldsSection :planet-data="planetData" />

    <!-- ═══ 4. FLEET PREVIEW — 3 张舰船卡片 ═══ -->
    <section class="fleet-preview section" data-animate>
      <div class="container">
        <div class="fleet-preview__header">
          <span class="section-label">// FLEET REGISTRY</span>
          <h2 class="section-title">舰队展厅</h2>
          <p class="section-desc">第四舰队的主力舰船阵容，从轻型战斗机到豪华探索舰，每一艘都经过实战调校</p>
        </div>

        <div class="fleet-grid">
          <ShipCard
            v-for="ship in fleetShips"
            :key="ship.slug"
            :ship="ship"
            @click="handleCardClick(ship.slug)"
          />
        </div>

        <div class="fleet-preview__more">
          <RouterLink to="/fleet" class="link-arrow">
            <span>进入舰队展厅 · ENTER HANGAR</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- ═══ 5. CTA — 页面底部行动号召 ═══ -->
    <section class="cta-section" data-animate>
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">READY TO JOIN?</h2>
          <p class="cta-desc">加入我们的行列，与百名飞行员一起征服星辰大海。</p>
          <div class="cta-actions">
            <BaseButton variant="cta" size="lg" @click="router.push('/join')">
              START APPLICATION
            </BaseButton>
            <BaseButton variant="outline" size="lg" @click="router.push('/fleet')">
              EXPLORE FLEET
            </BaseButton>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import shipDatabase, { recommendedShips } from '../data/shipDatabase.js'
import { useHomeStore } from '../stores/homeStore'
import { useGSAPReveal } from '@/composables/useGSAPReveal'
import HeroSection from '../components/home/HeroSection.vue'
import HeroDataPanel from '../components/home/HeroDataPanel.vue'
import HeroTicker from '../components/home/HeroTicker.vue'
import HomeWorldsSection from '../components/home/HomeWorldsSection.vue'
import BaseButton from '../components/common/BaseButton.vue'
import ShipCard from '../components/fleet/ShipCard.vue'

const router = useRouter()
const homeStore = useHomeStore()
const { heroDataPanelItems, keyNumbers, planetData } = storeToRefs(homeStore)

// 首页舰队预览：从统一数据库取推荐舰船，传完整对象给 ShipCard
const fleetShips = computed(() =>
  recommendedShips.slice(0, 3).map((slug) => ({
    slug,
    ...shipDatabase[slug]
  }))
)

/**
 * 点击首页舰队卡片，跳转舰船详情
 * @param {string} slug - 舰船 slug
 */
function handleCardClick(slug) {
  if (slug) {
    router.push({ name: '舰船详情', params: { slug } })
  }
}

const keyNumbersRef = ref(null)
const rootRef = ref(null)

// 统一使用 GSAP ScrollTrigger 管理所有滚动动画（替代 IntersectionObserver）
useGSAPReveal(({ countUp, reveal }) => {
  // Key Numbers 数字计数动画
  if (keyNumbersRef.value) {
    const valueEls = keyNumbersRef.value.querySelectorAll('.key-number__value')
    valueEls.forEach((el) => {
      const target = Number(el.dataset.countTarget || 0)
      const suffix = el.dataset.countSuffix || ''
      countUp(el, {
        endValue: target,
        duration: 1.5,
        ease: 'power2.out',
        suffix,
        start: 'top 80%'
      })
    })
  }

  // [data-animate] 区块滚动揭示动画 — 统一到 GSAP，不再用 IntersectionObserver
  if (rootRef.value) {
    const sections = rootRef.value.querySelectorAll('[data-animate]')
    sections.forEach((el) => {
      reveal(el, {
        animation: 'fadeUp',
        duration: 0.8,
        start: 'top 85%'
      })
    })
  }
})

onMounted(() => {
  homeStore.fetchHomeData()
})

// 组件卸载时由 useGSAPReveal 自动清理 ScrollTrigger 实例
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
  margin-bottom: var(--space-2);
}

.section-desc {
  font-size: var(--text-md);
  color: var(--color-text-label);
  margin-top: var(--space-2);
}

/* Arrow link */
.link-arrow {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
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
  gap: 1rem;
}

.link-arrow svg {
  transition: transform 0.2s var(--ease-smooth);
}

.link-arrow:hover svg {
  transform: translateX(4px);
}

/* Entrance animation — 初始隐藏态，GSAP fromTo 接管动画 */
[data-animate] {
  opacity: 0;
}

[data-animate].is-visible {
  opacity: 1;
}

/* 尊重减少动画偏好：禁用滚动入场动画，保持内容可见 */
@media (prefers-reduced-motion: reduce) {
  [data-animate] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

/* 无 JS 时保持内容可见 */
@media (scripting: none) {
  [data-animate] {
    opacity: 1;
    transform: none;
  }
}

/* ═══════════════════════════════════════════════════════════
   2. KEY NUMBERS — 四个核心数据
   ═══════════════════════════════════════════════════════════ */

.key-numbers {
  padding: var(--space-16) 0 var(--space-10);
}

/* 区间过渡装饰：线条 + 菱形 + 线条，填补区块间视觉空洞 */
.section-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-12);
  opacity: 0.4;
}

.section-divider__line {
  width: 80px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-border-strong), transparent);
}

.section-divider__diamond {
  width: 6px;
  height: 6px;
  background: var(--color-accent);
  transform: rotate(45deg);
  box-shadow: 0 0 8px rgba(var(--raw-cyan-rgb), 0.4);
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
   4. FLEET PREVIEW — 3 张舰船卡片
   ═══════════════════════════════════════════════════════════ */

.fleet-preview__header {
  margin-bottom: var(--space-10);
}

.fleet-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.fleet-preview__more {
  text-align: center;
  margin-top: var(--space-10);
}

/* ═══════════════════════════════════════════════════════════
   5. CTA — 页面底部行动号召
   ═══════════════════════════════════════════════════════════ */

.cta-section {
  padding: var(--space-16) 0;
  position: relative;
}

.cta-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-border), transparent);
}

.cta-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-12);
  background: rgba(15, 15, 24, 0.4);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-2xl);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  position: relative;
}

/* 顶部渐变border */
.cta-content::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 20%;
  right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(74, 158, 255, 0.3), transparent);
  border-radius: 1px;
}

/* 底部微光呼应Hero方向 */
.cta-content::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: radial-gradient(
    ellipse at 15% 100%,
    rgba(74, 158, 255, 0.06) 0%,
    transparent 60%
  );
  pointer-events: none;
  border-radius: var(--radius-2xl);
  z-index: -1;
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
    grid-template-columns: repeat(2, 1fr);
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

  /* Key Numbers 改为 2×2 网格（原为 flex column 1 列） */
  .key-numbers__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-8);
  }

  .key-numbers {
    padding: var(--space-10) 0 var(--space-8);
  }

  .key-number__value {
    font-size: clamp(3rem, 15vw, 5rem);
  }

  .cta-title {
    font-size: var(--text-3xl);
  }

  .cta-actions {
    flex-direction: column;
    width: 100%;
    max-width: 280px;
  }
}

/*
 * 窄屏单列降级（≤480px）
 * fleet-grid 由 2 列转为 1 列，确保 375px 屏卡片可读
 */
@media (max-width: 480px) {
  .fleet-grid {
    grid-template-columns: 1fr;
    max-width: 360px;
  }

  .key-numbers__grid {
    grid-template-columns: 1fr;
  }

  .key-number__value {
    font-size: clamp(2.5rem, 18vw, 4rem);
  }

  .cta-content {
    padding: var(--space-8) var(--space-4);
  }
}
</style>
