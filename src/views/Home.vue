<!--
  @file 首页视图组件
  @description Cinematic Sci-Fi Landing — 沉浸式星际体验
  @version 12.0 - Glassmorphism Enhanced
-->

<template>
  <div class="home">

    <!-- ═══ 1. HERO — 100vh 全屏沉浸 ═══ -->
    <section class="hero">
      <!-- 星空粒子背景 — 3层深度，移动端自动减量 -->
      <div class="hero__stars">
        <div v-for="n in starCount" :key="n" class="star" :class="starClass(n)" :style="starStyle(n)"></div>
      </div>

      <div class="hero__bg">
        <img src="/images/sc/sc-matte-painting.jpg" alt="" class="hero__bg-img" />
        <div class="hero__bg-overlay"></div>
        <div class="hero__bg-gradient"></div>
        <div class="hero__bg-glow"></div>
      </div>

      <div class="hero__content">
        <div class="hero__badge">
          <span class="hero__badge-dot"></span>
          <span>RECRUITING NOW</span>
        </div>
        <h1 class="hero__title">
          <span class="hero__title-line">STELLAR</span>
          <span class="hero__title-line hero__title-line--accent">NEXUS</span>
        </h1>
        <p class="hero__tagline">EXPLORE · FIGHT · CONQUER</p>
        <div class="hero__actions">
          <RouterLink to="/join" class="btn-primary">START APPLICATION</RouterLink>
          <RouterLink to="/fleet" class="btn-ghost">EXPLORE FLEET</RouterLink>
        </div>
      </div>

      <div class="hero__scroll">
        <div class="hero__scroll-line"></div>
        <span class="hero__scroll-text">SCROLL</span>
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
          <p class="section-desc">我们的主力舰船阵容，每一艘都经过精心调校</p>
        </div>

        <div class="fleet-grid">
          <div
            v-for="(ship, idx) in fleetShips"
            :key="idx"
            class="fleet-card glass-card"
            :class="{ 'is-tapped': tappedIndex === idx }"
            @click="toggleCard(idx)"
          >
            <div class="fleet-card__img-wrap">
              <img :src="ship.image" :alt="ship.name" class="fleet-card__img" :style="ship.imgFilter ? { filter: ship.imgFilter } : {}" loading="lazy" />
              <div class="fleet-card__img-overlay"></div>
            </div>
            <div class="fleet-card__body">
              <div class="fleet-card__header">
                <h3 class="fleet-card__name">{{ ship.name }}</h3>
                <span class="fleet-card__role">{{ ship.role }}</span>
              </div>
              <span class="fleet-card__hint">
                <span>explore</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
              <div class="fleet-card__specs">
                <div v-for="(spec, si) in ship.specs" :key="si" class="spec-row">
                  <span class="spec-row__label">{{ spec.label }}</span>
                  <div class="spec-bar">
                    <div class="spec-bar__fill" :style="{ '--fill-width': spec.value + '%' }"></div>
                  </div>
                  <span class="spec-row__value">{{ spec.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="fleet-preview__more">
          <RouterLink to="/fleet" class="link-arrow">
            <span>查看全部舰队</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </RouterLink>
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
import { ref, computed } from 'vue'
import { onMounted } from 'vue'

// 移动端粒子减量
const isMobile = ref(false)
const starCount = computed(() => isMobile.value ? 80 : 200)

// 预生成星星样式，避免 Math.random() 导致每次渲染结果不同
// 3层深度粒子系统 — far(小慢多) / mid / near(大快少)
const starLayers = [
  { count: 120, sizeRange: [0.8, 1.5], speedRange: [4, 7], cls: 'star--far' },
  { count: 60,  sizeRange: [1.5, 2.5], speedRange: [3, 5], cls: 'star--mid' },
  { count: 20,  sizeRange: [2.5, 3.5], speedRange: [2, 3.5], cls: 'star--near' },
]

const starStyles = []
const starClassMap = []
for (const layer of starLayers) {
  for (let i = 0; i < layer.count; i++) {
    const size = layer.sizeRange[0] + Math.random() * (layer.sizeRange[1] - layer.sizeRange[0])
    const x = Math.random() * 100
    const y = Math.random() * 100
    const delay = Math.random() * layer.speedRange[1]
    const duration = layer.speedRange[0] + Math.random() * (layer.speedRange[1] - layer.speedRange[0])
    starStyles.push({
      width: `${size}px`,
      height: `${size}px`,
      left: `${x}%`,
      top: `${y}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    })
    starClassMap.push(layer.cls)
  }
}

function starStyle(n) {
  return starStyles[n - 1] || {}
}
function starClass(n) {
  return starClassMap[n - 1] || ''
}

const fleetShips = ref([
  {
    name: 'Aegis Hammerhead',
    role: '重型护卫舰 · Capital',
    image: '/images/sc/sc-bengal.jpg',
    imgFilter: 'brightness(1.15)',
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
    image: '/images/ships/arrow.webp',
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

// 入场动画 — IntersectionObserver + 移动端检测
onMounted(() => {
  isMobile.value = window.innerWidth <= 768
  window.addEventListener('resize', () => { isMobile.value = window.innerWidth <= 768 })

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

/* Glassmorphism 卡片基础 */
.glass-card {
  background: rgba(15, 15, 24, 0.6);
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.glass-card:hover {
  background: rgba(22, 22, 34, 0.7);
  border-color: rgba(74, 158, 255, 0.2);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.4),
    0 0 30px rgba(74, 158, 255, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
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

.spec-row__value {
  font-family: var(--font-data);
  font-size: var(--text-xs);
  color: var(--color-text-dim);
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
  background: var(--color-accent);
  border-radius: 2px;
  transition: width 0.8s var(--ease-smooth);
}

/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-bright) 100%);
  color: #000000;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-smooth);
  text-decoration: none;
  box-shadow: 0 4px 20px rgba(74, 158, 255, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(74, 158, 255, 0.4);
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
  box-shadow: var(--glow-accent);
  transform: translateY(-2px);
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

/* 星空粒子 — 3层深度 */
.hero__stars {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.star {
  position: absolute;
  background: #ffffff;
  border-radius: 50%;
  opacity: 0;
}

.star--far {
  animation: starFar 5s ease-in-out infinite;
  box-shadow: none;
}

.star--mid {
  animation: starMid 4s ease-in-out infinite;
  box-shadow: 0 0 2px rgba(255, 255, 255, 0.3);
}

.star--near {
  animation: starNear 3s ease-in-out infinite;
  box-shadow: 0 0 6px rgba(74, 158, 255, 0.4), 0 0 2px rgba(255, 255, 255, 0.6);
}

@keyframes starFar {
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.1); }
}

@keyframes starMid {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.15); }
}

@keyframes starNear {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.3); }
}

.hero__bg {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.hero__bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.38) saturate(0.75);
  animation: bgDrift 32s ease-in-out infinite;
}

@keyframes bgDrift {
  0%, 100% { transform: scale(1.02) translate(0, 0); }
  33% { transform: scale(1.04) translate(-0.3%, 0.2%); }
  66% { transform: scale(1.03) translate(0.2%, -0.15%); }
}

.hero__bg-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      to top,
      var(--color-bg) 0%,
      rgba(5, 5, 8, 0.6) 35%,
      rgba(5, 5, 8, 0.2) 60%,
      transparent 100%
    ),
    linear-gradient(
      135deg,
      rgba(5, 5, 8, 0.4) 0%,
      transparent 50%
    );
}

.hero__bg-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      ellipse at 30% 50%,
      rgba(74, 158, 255, 0.08) 0%,
      transparent 60%
    ),
    radial-gradient(
      ellipse at 80% 20%,
      rgba(167, 139, 250, 0.03) 0%,
      transparent 50%
    );
}

/* 主光源 — 左下角偏亮光束 */
.hero__bg-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 15% 85%,
    rgba(74, 158, 255, 0.12) 0%,
    rgba(74, 158, 255, 0.04) 30%,
    transparent 60%
  );
  animation: glowBreathe 8s ease-in-out infinite;
  will-change: opacity;
}

@keyframes glowBreathe {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.hero__content {
  position: relative;
  z-index: 2;
  text-align: left;
  max-width: 800px;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1.25rem;
  background: rgba(74, 158, 255, 0.08);
  border: 1px solid rgba(74, 158, 255, 0.15);
  border-radius: 9999px;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.15em;
  color: var(--color-accent);
  margin-bottom: var(--space-8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* ═══ Mobile — 粒子减半 + 去重特效 ═══ */
@media (max-width: 768px) {
  .star--far {
    display: none;
  }

  .star--mid {
    animation-duration: 6s;
    box-shadow: none;
  }

  .star--near {
    animation-duration: 5s;
    box-shadow: 0 0 3px rgba(74, 158, 255, 0.3);
  }

  .hero__badge {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  .hero__bg-img {
    animation: none;
    filter: brightness(0.35) saturate(0.7);
  }

  .hero__bg-glow {
    animation: none;
    opacity: 0.8;
  }
}

.hero__badge-dot {
  width: 8px;
  height: 8px;
  background: var(--color-accent);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.hero__title {
  font-family: var(--font-display);
  font-size: var(--text-hero);
  font-weight: 700;
  line-height: 0.92;
  letter-spacing: -0.03em;
  color: #ffffff;
  margin-bottom: var(--space-4);
  text-shadow: 0 0 40px rgba(74, 158, 255, 0.15);
}

.hero__title-line {
  display: block;
}

.hero__title-line--accent {
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-bright) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 20px rgba(74, 158, 255, 0.25));
}

.hero__tagline {
  font-family: var(--font-data);
  font-size: var(--text-sm);
  letter-spacing: 0.35em;
  color: var(--color-text-dim);
  margin-bottom: var(--space-10);
  text-shadow: 0 0 12px rgba(74, 158, 255, 0.1);
}

.hero__actions {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.hero__scroll {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.hero__scroll-line {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, transparent, var(--color-accent));
  animation: scrollLine 2s ease-in-out infinite;
}

@keyframes scrollLine {
  0% { transform: scaleY(0); transform-origin: top; }
  50% { transform: scaleY(1); transform-origin: top; }
  51% { transform: scaleY(1); transform-origin: bottom; }
  100% { transform: scaleY(0); transform-origin: bottom; }
}

.hero__scroll-text {
  font-family: var(--font-data);
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--color-text-dim);
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
  transition: all var(--duration-normal) var(--ease-smooth);
  cursor: pointer;
  position: relative;
}

.fleet-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius-xl);
  padding: 1px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 50%,
    rgba(74, 158, 255, 0.1) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--duration-normal);
}

.fleet-card:hover::before {
  opacity: 1;
}

.fleet-card:hover {
  transform: translateY(-8px);
}

.fleet-card__img-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  position: relative;
}

.fleet-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s var(--ease-smooth);
}

.fleet-card__img-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(15, 15, 24, 0.8) 0%, transparent 50%);
  pointer-events: none;
}

.fleet-card:hover .fleet-card__img {
  transform: scale(1.08);
}

.fleet-card__body {
  padding: var(--space-5);
  position: relative;
}

.fleet-card__header {
  margin-bottom: var(--space-4);
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
}

.fleet-card__specs {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s var(--ease-out), opacity 0.3s ease;
  opacity: 0;
}

.fleet-card__hint {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  color: var(--color-accent);
  opacity: 0.85;
  padding-bottom: 2px;
  border-bottom: 1px solid rgba(74, 158, 255, 0.3);
  transition: all 0.2s var(--ease-smooth);
}

.fleet-card__hint:hover {
  opacity: 1;
  border-bottom-color: var(--color-accent);
}

.fleet-card__hint svg {
  transition: transform 0.2s var(--ease-smooth);
}

.fleet-card:hover .fleet-card__hint svg {
  transform: translateX(4px);
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
  opacity: 1;
}

/* spec条填充动画 — 容器展开后再填充 */
.fleet-card .spec-bar__fill {
  width: 0 !important;
  transition: width 0.6s var(--ease-smooth) 0.15s;
}

.fleet-card:hover .spec-bar__fill,
.fleet-card.is-tapped .spec-bar__fill {
  width: var(--fill-width) !important;
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

/* CTA按钮加重glow */
.cta-actions .btn-primary {
  box-shadow: 0 0 24px rgba(74, 158, 255, 0.25), 0 4px 20px rgba(74, 158, 255, 0.3);
}

.cta-actions .btn-primary:hover {
  box-shadow: 0 0 32px rgba(74, 158, 255, 0.4), 0 8px 30px rgba(74, 158, 255, 0.4);
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
