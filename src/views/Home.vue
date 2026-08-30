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

    <!-- ═══ 2. KEY NUMBERS — 四个核心数据（全出血背景带） ═══ -->
    <section ref="keyNumbersRef" class="key-numbers section-bleed">
      <div class="key-numbers__bg" aria-hidden="true"></div>
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
    <section ref="fleetPreviewRef" class="fleet-preview section" data-animate>
      <div class="fleet-preview__bg" aria-hidden="true">
        <img
          src="/images/sc/sc-fleet.jpg"
          alt=""
          class="fleet-preview__bg-img"
          loading="lazy"
          decoding="async"
        />
        <div class="fleet-preview__bg-scrim"></div>
      </div>
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
      <div class="cta-section__bg" aria-hidden="true">
        <img
          src="/images/sc/sc-space-collection.jpg"
          alt=""
          class="cta-section__bg-img"
          loading="lazy"
          decoding="async"
        />
        <div class="cta-section__bg-scrim"></div>
      </div>
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">READY TO JOIN?</h2>
          <p class="cta-desc">加入我们的行列，与百名飞行员一起征服星辰大海。</p>
          <div class="cta-actions">
            <BaseButton variant="cta" size="lg" @click="handleJoinClick">
              START APPLICATION
            </BaseButton>
            <BaseButton variant="outline" size="lg" @click="router.push('/fleet')">
              EXPLORE FLEET
            </BaseButton>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ 6. AI 招募官入口 — 右下角浮动触发器 + 全息终端 ═══ -->
    <button
      v-if="!showRecruiter"
      class="recruiter-trigger"
      type="button"
      aria-label="打开 AI 招募官对话"
      @click="showRecruiter = true"
    >
      <span class="recruiter-trigger__icon" aria-hidden="true">◆</span>
      <span class="recruiter-trigger__text">与 AI 指挥官对话</span>
    </button>

    <RecruiterTerminal
      :is-open="showRecruiter"
      @close="showRecruiter = false"
    />

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import shipDatabase, { recommendedShips } from '../data/shipDatabase.js'
import { useHomeStore } from '../stores/homeStore'
import { useGSAPReveal } from '@/composables/useGSAPReveal'
import { trackEvent } from '@/services/analyticsService'
import HeroSection from '../components/home/HeroSection.vue'
import HeroDataPanel from '../components/home/HeroDataPanel.vue'
import HeroTicker from '../components/home/HeroTicker.vue'
import HomeWorldsSection from '../components/home/HomeWorldsSection.vue'
import BaseButton from '../components/common/BaseButton.vue'
import ShipCard from '../components/fleet/ShipCard.vue'
import RecruiterTerminal from '@/components/ai/RecruiterTerminal.vue'

const router = useRouter()
// AI 招募官终端显隐状态
const showRecruiter = ref(false)
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

/**
 * 点击 CTA「START APPLICATION」
 * @description 记录申请入口点击（转化漏斗第一层），再跳转申请表
 */
function handleJoinClick() {
  trackEvent('application_form_start', { source: 'home_cta' })
  router.push('/join')
}

const keyNumbersRef = ref(null)
const rootRef = ref(null)
const fleetPreviewRef = ref(null)

// 统一使用 GSAP ScrollTrigger 管理所有滚动动画（替代 IntersectionObserver）
useGSAPReveal(({ countUp, reveal, parallax }) => {
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

  // 舰队展厅背景微视差：反向缓移（distance 为负 = 向上），抵消滚动产生纵深
  if (fleetPreviewRef.value) {
    const bg = fleetPreviewRef.value.querySelector('.fleet-preview__bg-img')
    if (bg) {
      parallax(bg, {
        distance: -60,
        trigger: fleetPreviewRef.value,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      })
    }
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
  position: relative;
  padding: var(--space-16) 0 var(--space-10);
}

/* 全出血背景带：铺满视口宽度，内容仍由 .container 约束居中 */
.key-numbers__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(180deg, transparent 0%, rgba(10, 10, 16, 0.85) 18%, rgba(10, 10, 16, 0.85) 82%, transparent 100%),
    radial-gradient(ellipse 70% 90% at 50% 50%, rgba(var(--raw-cyan-rgb), 0.06) 0%, transparent 70%);
}

/* 星点质感：多组径向渐变模拟远星分布，填补数据带空隙 */
.key-numbers__bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 15% 30%, rgba(255, 255, 255, 0.5) 50%, transparent 51%),
    radial-gradient(1px 1px at 28% 70%, rgba(255, 255, 255, 0.35) 50%, transparent 51%),
    radial-gradient(1.5px 1.5px at 42% 22%, rgba(255, 255, 255, 0.45) 50%, transparent 51%),
    radial-gradient(1px 1px at 58% 65%, rgba(255, 255, 255, 0.4) 50%, transparent 51%),
    radial-gradient(1px 1px at 71% 35%, rgba(255, 255, 255, 0.5) 50%, transparent 51%),
    radial-gradient(1.5px 1.5px at 85% 60%, rgba(255, 255, 255, 0.35) 50%, transparent 51%),
    radial-gradient(1px 1px at 92% 25%, rgba(255, 255, 255, 0.4) 50%, transparent 51%);
  opacity: 0.5;
}

.key-numbers .container {
  position: relative;
  z-index: 1;
}

.key-numbers .section-divider {
  position: relative;
  z-index: 1;
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
  /* 8vw 而非 10vw：窄窗口下数字温和收缩，避免数据带过高挤压阅读 */
  font-size: clamp(3rem, 8vw, 8rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--color-text-heading);
}

/* 超宽屏：关键数字随容器扩张 */
@media (min-width: 1920px) {
  .key-number__value {
    font-size: clamp(3rem, 8vw, 9rem);
  }
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

/* 舰队展厅：背景层视差容器（背景铺满 section，内容 container 提层居中） */
.fleet-preview {
  position: relative;
  overflow: hidden;
}

.fleet-preview__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

/* 舰队场景背景图：低亮度冷蓝处理，营造沉浸式舰队展厅氛围 */
.fleet-preview__bg-img {
  position: absolute;
  left: 0;
  right: 0;
  top: -8%;
  bottom: -8%;
  width: 100%;
  height: 116%;
  object-fit: cover;
  object-position: center 45%;
  filter: grayscale(0.35) contrast(1.1) brightness(0.4) saturate(1.2) hue-rotate(-8deg);
}

/* 蒙版：上下渐隐融入页面，中段叠加青色光晕强化科技感 */
.fleet-preview__bg-scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, var(--color-bg, #050508) 0%, rgba(5, 5, 8, 0.55) 20%, rgba(5, 5, 8, 0.55) 80%, var(--color-bg, #050508) 100%),
    radial-gradient(ellipse 60% 70% at 50% 50%, rgba(74, 158, 255, 0.08) 0%, transparent 65%);
}

.fleet-preview .container {
  position: relative;
  z-index: 1;
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
  overflow: hidden;
}

/* CTA 星云氛围背景：低亮度太空场景 + 渐变蒙版 */
.cta-section__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.cta-section__bg-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 50%;
  filter: grayscale(0.3) contrast(1.1) brightness(0.4) saturate(1.2);
}

.cta-section__bg-scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, var(--color-bg, #050508) 0%, rgba(5, 5, 8, 0.5) 25%, rgba(5, 5, 8, 0.5) 75%, var(--color-bg, #050508) 100%),
    radial-gradient(ellipse 50% 60% at 50% 50%, rgba(255, 179, 0, 0.05) 0%, transparent 65%);
}

.cta-section .container {
  position: relative;
  z-index: 1;
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

  /* 窄窗背景横幅带：内容纵向堆叠使 section 变高，cover 会把 16:9 舰队图
     裁到仅剩 ~14%。改为按原图比例铺一条全宽横幅（完整可见），
     下方由 scrim 渐变融入深色底，避免灾难性裁切 */
  .fleet-preview__bg-img {
    top: 0;
    bottom: auto;
    height: auto;
    aspect-ratio: 16 / 9;
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

  /* CTA 背景：窄窗按钮纵排使 section 变高，同样改 16:9 横幅带完整显示星云图 */
  .cta-section__bg-img {
    bottom: auto;
    height: auto;
    aspect-ratio: 16 / 9;
  }
}

/*
 * ≤600px 阅读层级收缩
 * 卡片单列（2 列时每卡仅 ~240px 规格表拥挤）+ 标题降档 40px→32px
 */
@media (max-width: 600px) {
  .fleet-grid {
    grid-template-columns: 1fr;
    max-width: 360px;
    margin-inline: auto;
  }

  .section-title {
    font-size: var(--text-2xl);
  }

  .cta-title {
    font-size: var(--text-2xl);
  }
}

/*
 * 窄屏单列降级（≤480px）
 * fleet-grid 单列已上移至 ≤600px 断点，此处仅保留数据带降级
 */
@media (max-width: 480px) {
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

/* ═══════════════════════════════════════════════════════════
   6. AI 招募官入口 — 右下角浮动触发器
   复用全息 HUD 视觉语言：青色边框 + 玻璃模糊 + 等宽字体 + 脉冲光晕
   z-index 低于 RecruiterTerminal(--z-modal)，由 v-if 控制互斥显示
   ═══════════════════════════════════════════════════════════ */

.recruiter-trigger {
  position: fixed;
  bottom: var(--space-5);
  right: var(--space-5);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--color-bg-overlay);
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-sm);
  color: var(--color-text-accent);
  font-family: var(--font-data);
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
  cursor: pointer;
  z-index: var(--z-overlay);
  backdrop-filter: blur(var(--blur-header));
  -webkit-backdrop-filter: blur(var(--blur-header));
  transition:
    background var(--motion-duration-fast) var(--motion-ease-out),
    border-color var(--motion-duration-fast) var(--motion-ease-out),
    box-shadow var(--motion-duration-fast) var(--motion-ease-out),
    color var(--motion-duration-fast) var(--motion-ease-out),
    transform var(--motion-duration-fast) var(--motion-ease-out);
}

.recruiter-trigger:hover {
  background: var(--color-accent-muted);
  border-color: var(--color-accent);
  color: var(--color-accent-bright);
  box-shadow: var(--shadow-accent);
  transform: translateY(-1px);
}

.recruiter-trigger:focus-visible {
  outline: 1px solid var(--color-accent-bright);
  outline-offset: 2px;
}

.recruiter-trigger:active {
  transform: translateY(0);
}

.recruiter-trigger__icon {
  font-size: var(--text-md);
  line-height: 1;
  color: var(--color-accent);
  animation: recruiter-pulse 2s var(--motion-ease-in-out) infinite;
}

.recruiter-trigger:hover .recruiter-trigger__icon {
  color: var(--color-accent-bright);
}

.recruiter-trigger__text {
  text-transform: uppercase;
}

@keyframes recruiter-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* 窄屏：仅显示图标，节省空间 */
@media (max-width: 480px) {
  .recruiter-trigger {
    padding: var(--space-3);
  }

  .recruiter-trigger__text {
    display: none;
  }
}

/* 尊重减少动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .recruiter-trigger,
  .recruiter-trigger__icon {
    transition: none;
    animation: none;
  }

  .recruiter-trigger:hover {
    transform: none;
  }
}
</style>
