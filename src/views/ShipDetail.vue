<!--
  @file 舰船详情页组件
  @description 展示单艘舰船的详细信息，包括大图、参数规格、基本参数、舰船描述和系统状态。
  @version 1.0 - 初始版本
-->

<template>
  <div ref="rootRef" class="ship-detail-page">
    <!-- 加载状态 -->
    <div v-if="!ship" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="font-data">数据加载中 · LOADING...</p>
    </div>

    <!-- 未找到舰船 -->
    <div v-else-if="ship.notFound" class="not-found-state">
      <div class="not-found-icon">⚠</div>
      <h2>舰船数据未找到 · SHIP NOT FOUND</h2>
      <p>该舰船尚未录入舰队数据库</p>
      <button class="btn-back" @click="goBack">返回舰队 · BACK TO FLEET</button>
    </div>

    <!-- 舰船详情内容 -->
    <template v-else>
      <!-- 顶部导航 -->
      <nav class="detail-nav">
        <div class="container">
          <button class="nav-back" @click="goBack">
            <span class="nav-back__arrow">←</span>
            <span>返回舰队 · FLEET</span>
          </button>
          <div class="nav-breadcrumb font-data">
            <span>舰队 · FLEET</span>
            <span class="breadcrumb-sep">/</span>
            <span class="breadcrumb-current">{{ ship.name }}</span>
          </div>
        </div>
      </nav>

      <!-- 主图区域 -->
      <section class="ship-hero">
        <div class="ship-hero__bg">
          <img :src="ship.image" :alt="ship.name" width="800" height="450" loading="eager" decoding="async" />
        </div>
        <div class="ship-hero__overlay"></div>
        <div class="ship-hero__vignette" aria-hidden="true"></div>
        <div class="ship-hero__scanline" aria-hidden="true"></div>
        <div class="ship-hero__frame" aria-hidden="true">
          <span class="ship-hero__frame-corner ship-hero__frame-corner--tl" />
          <span class="ship-hero__frame-corner ship-hero__frame-corner--tr" />
          <span class="ship-hero__frame-corner ship-hero__frame-corner--bl" />
          <span class="ship-hero__frame-corner ship-hero__frame-corner--br" />
        </div>
        <div class="ship-hero__content container">
          <div class="ship-hero__top-meta">
            <ShipCategoryBadge :category="ship.category" class="ship-hero__badge" />
            <span class="ship-hero__registry font-data">{{ shipRegistry }}</span>
          </div>
          <h1 class="ship-hero__name">{{ ship.name }}</h1>
          <p class="ship-hero__manufacturer font-data">{{ ship.manufacturer }}</p>
          <p class="ship-hero__role">{{ ship.role }}</p>

          <div class="ship-hero__data-strip">
            <div v-for="item in heroDataStrip" :key="item.label" class="data-strip__item">
              <span class="data-strip__label font-data">{{ item.label }}</span>
              <span class="data-strip__value font-data">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 核心参数 -->
      <section class="ship-specs section">
        <div class="container">
          <h2 class="section-title font-data">// 核心参数 · SPECIFICATIONS</h2>
          <div class="specs-grid">
            <div v-for="spec in ship.specs" :key="spec.label" class="spec-item">
              <HudCorner position="top-left" size="sm" class="spec-item__corner spec-item__corner--tl" />
              <HudCorner position="bottom-right" size="sm" class="spec-item__corner spec-item__corner--br" />
              <div class="spec-item__header">
                <span class="spec-item__label font-data">{{ spec.label }}</span>
                <span class="spec-item__value font-data">{{ spec.value }}%</span>
              </div>
              <TechDivider direction="horizontal" class="spec-item__divider" />
              <div class="spec-bar-lg">
                <div
                  class="spec-bar-lg__fill"
                  :style="{ width: spec.value + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 详细信息 -->
      <section class="ship-info section">
        <div class="container">
          <div class="info-grid">
            <!-- 左侧：基本参数 -->
            <div class="info-panel">
              <HudCorner position="top-left" size="md" class="info-panel__corner info-panel__corner--tl" />
              <HudCorner position="bottom-right" size="md" class="info-panel__corner info-panel__corner--br" />
              <h2 class="section-title font-data">// 基本参数 · GENERAL</h2>
              <div class="info-table">
                <div v-for="item in ship.details" :key="item.label" class="info-row">
                  <span class="info-row__label font-data">{{ item.label }}</span>
                  <span class="info-row__value">{{ item.value }}</span>
                </div>
              </div>
            </div>

            <!-- 右侧：舰船描述 -->
            <div class="info-panel">
              <HudCorner position="top-left" size="md" class="info-panel__corner info-panel__corner--tl" />
              <HudCorner position="bottom-right" size="md" class="info-panel__corner info-panel__corner--br" />
              <h2 class="section-title font-data">// 舰船档案 · DOSSIER</h2>
              <div class="ship-description">
                <p v-for="(para, i) in ship.description" :key="i">{{ para }}</p>
              </div>

              <!-- 状态指示灯 -->
              <div class="status-indicators">
                <h3 class="font-data" style="margin-bottom: var(--space-3);">// 系统状态 · STATUS</h3>
                <div class="status-grid">
                  <div v-for="status in ship.systemStatus" :key="status.label" class="status-item">
                    <StatusPulse
                      :variant="status.level === 'green' ? 'online' : status.level === 'yellow' ? 'warning' : 'danger'"
                      size="sm"
                      class="status-item__pulse"
                    />
                    <span class="status-item__label font-data">{{ status.label }}</span>
                    <span class="status-item__value font-data">{{ status.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 同类型舰船推荐 -->
      <section v-if="relatedShips.length" class="related-ships section">
        <div class="container">
          <h2 class="section-title font-data">// 同类舰船 · RELATED VESSELS</h2>
          <div class="related-grid">
            <RouterLink
              v-for="rShip in relatedShips"
              :key="rShip.slug"
              :to="`/fleet/${rShip.slug}`"
              class="related-card"
            >
              <div class="related-card__image">
                <img :src="rShip.image" :alt="rShip.name" width="144" height="144" loading="lazy" decoding="async" />
              </div>
              <div class="related-card__info">
                <span class="related-card__category font-data">{{ rShip.categoryEn }}</span>
                <h3 class="related-card__name">{{ rShip.name }}</h3>
                <p class="related-card__role">{{ rShip.role }}</p>
              </div>
              <div class="related-card__arrow" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getShipBySlug, shipList } from '../data/shipDatabase.js'
import { HudCorner, TechDivider, ShipCategoryBadge, StatusPulse } from '../components/hud/index.js'
import { useGSAPReveal } from '@/composables/useGSAPReveal'
import shipDatabase from '../data/shipDatabase.js'

const route = useRoute()
const router = useRouter()
const ship = ref(null)
const rootRef = ref(null)

// GSAP 滚动入场动画：参数条填充 + 区块揭示
useGSAPReveal(({ reveal, stagger, barFill }) => {
  nextTick(() => {
    if (!rootRef.value || !ship.value || ship.value.notFound) return

    // 核心参数条从 0 填充到目标值
    const specBars = rootRef.value.querySelectorAll('.spec-bar-lg__fill')
    specBars.forEach((el) => {
      const targetWidth = el.style.width
      el.style.width = '0%'
      barFill(el, {
        width: targetWidth,
        duration: 1.2,
        start: 'top 80%'
      })
    })

    // 参数卡片交错揭示
    const specsGrid = rootRef.value.querySelector('.specs-grid')
    if (specsGrid) {
      stagger(specsGrid, '.spec-item', {
        animation: 'scaleIn',
        stagger: 0.1,
        duration: 0.6
      })
    }

    // 信息面板交错揭示
    const infoGrid = rootRef.value.querySelector('.info-grid')
    if (infoGrid) {
      stagger(infoGrid, '.info-panel', {
        animation: 'fadeUp',
        stagger: 0.15,
        duration: 0.7
      })
    }
  })
})

/**
 * 根据路由 slug 加载舰船数据
 * 若 slug 不存在，则返回 notFound 标记用于展示空状态
 */
function loadShip() {
  const slug = route.params.slug
  const found = getShipBySlug(slug)
  ship.value = found || { notFound: true }
}

/**
 * 返回舰队列表页
 */
function goBack() {
  router.push({ name: 'Fleet' })
}

/**
 * 同类型舰船推荐 — 排除当前舰船，取同 category 的最多 3 艘
 * 若同类型不足 3 艘，用其他类型补齐
 */
const relatedShips = computed(() => {
  if (!ship.value || ship.value.notFound) return []
  const currentSlug = route.params.slug
  const sameCategory = shipList
    .filter((slug) => slug !== currentSlug && shipDatabase[slug].category === ship.value.category)
    .map((slug) => ({ slug, ...shipDatabase[slug] }))
  // 同类型不足时用其他类型补齐
  if (sameCategory.length >= 3) return sameCategory.slice(0, 3)
  const others = shipList
    .filter((slug) => slug !== currentSlug && shipDatabase[slug].category !== ship.value.category)
    .map((slug) => ({ slug, ...shipDatabase[slug] }))
  return [...sameCategory, ...others].slice(0, 3)
})

/**
 * 生成舰船注册号，用于 Hero 装饰性数据展示
 * 格式：REG-4F-XXX，取舰船名首字母大写并补齐至 3 位
 */
const shipRegistry = computed(() => {
  if (!ship.value || ship.value.notFound) return 'REG-4F-???'
  const prefix = ship.value.name
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X')
  return `REG-4F-${prefix}`
})

/**
 * Hero 底部快速数据条：船员、长度、战斗评级
 * 从 details 数组中按中文标签提取，缺失时显示 --
 */
const heroDataStrip = computed(() => {
  if (!ship.value || ship.value.notFound) return []
  const find = (key) => ship.value.details.find((d) => d.label.includes(key))?.value || '--'
  return [
    { label: 'CREW', value: find('船员') },
    { label: 'LENGTH', value: find('长度') },
    { label: 'RATING', value: find('战斗评级') }
  ]
})

// 首次加载
loadShip()

// slug 变化时重新加载（支持同页切换）
watch(() => route.params.slug, loadShip)
</script>

<style scoped>
/* 详情页全局容器 */
.ship-detail-page {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-bg-primary, #050508);
  color: var(--color-text-primary, #ffffff);
}

/* ── 加载状态 ── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  gap: var(--space-4);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 2px solid rgba(74, 158, 255, 0.2);
  border-top-color: var(--color-accent, #4a9eff);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── 未找到状态 ── */
.not-found-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: var(--space-4);
  text-align: center;
}

.not-found-icon {
  font-size: 3rem;
  color: var(--color-highlight, #ffb300);
}

.btn-back {
  margin-top: var(--space-4);
  padding: 0.75rem 2rem;
  font-family: var(--font-data);
  font-size: var(--text-sm);
  color: var(--color-accent);
  background: rgba(74, 158, 255, 0.1);
  border: 1px solid rgba(74, 158, 255, 0.3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.btn-back:hover {
  background: rgba(74, 158, 255, 0.2);
  border-color: rgba(74, 158, 255, 0.5);
}

/* ── 顶部导航 ── */
.detail-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: var(--space-3) 0;
  background: rgba(5, 5, 8, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border-subtle);
}

.detail-nav .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-back {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.5rem 1rem;
  font-family: var(--font-data);
  font-size: var(--text-sm);
  color: var(--color-accent);
  background: transparent;
  border: 1px solid rgba(74, 158, 255, 0.2);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.nav-back:hover {
  background: rgba(74, 158, 255, 0.1);
  border-color: rgba(74, 158, 255, 0.4);
}

.nav-breadcrumb {
  font-size: var(--text-xs);
  color: var(--color-text-dim);
  letter-spacing: 0.08em;
}

.breadcrumb-sep {
  margin: 0 var(--space-2);
  color: rgba(255, 255, 255, 0.2);
}

.breadcrumb-current {
  color: var(--color-accent);
}

/* ── 主图区域 ── */
.ship-hero {
  position: relative;
  min-height: 55vh;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.ship-hero__bg {
  position: absolute;
  inset: 0;
}

.ship-hero__bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.55) saturate(0.85);
  transform: scale(1.02);
  transition: transform 8s var(--ease-smooth), filter 0.6s var(--ease-out);
}

.ship-hero:hover .ship-hero__bg img {
  transform: scale(1.06);
  filter: brightness(0.6) saturate(0.9);
}

.ship-hero__overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(0deg, rgba(5, 5, 8, 1) 0%, rgba(5, 5, 8, 0.25) 55%, rgba(5, 5, 8, 0.55) 100%),
    radial-gradient(ellipse at 50% 100%, rgba(74, 158, 255, 0.08) 0%, transparent 55%);
  z-index: 1;
}

/* 电影级暗角：四角压暗 + 底部强化淡出 */
.ship-hero__vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  background:
    radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(5, 5, 8, 0.65) 100%),
    linear-gradient(180deg, transparent 30%, rgba(5, 5, 8, 0.9) 100%);
}

/* 军事 HUD 扫描线：仅在 hover 时轻微显现，避免常态干扰阅读 */
.ship-hero__scanline {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(74, 158, 255, 0.04) 2px,
    rgba(74, 158, 255, 0.04) 4px
  );
  opacity: 0.4;
  mix-blend-mode: overlay;
}

/* 图片边框角标：与 ShipCard 统一设计语言 */
.ship-hero__frame {
  position: absolute;
  inset: 1.5rem;
  pointer-events: none;
  z-index: 4;
}

.ship-hero__frame-corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: rgba(74, 158, 255, 0.25);
  border-style: solid;
  transition: border-color 0.4s var(--ease-out);
}

.ship-hero__frame-corner--tl {
  top: 0;
  left: 0;
  border-width: 2px 0 0 2px;
}
.ship-hero__frame-corner--tr {
  top: 0;
  right: 0;
  border-width: 2px 2px 0 0;
}
.ship-hero__frame-corner--bl {
  bottom: 0;
  left: 0;
  border-width: 0 0 2px 2px;
}
.ship-hero__frame-corner--br {
  bottom: 0;
  right: 0;
  border-width: 0 2px 2px 0;
}

.ship-hero:hover .ship-hero__frame-corner {
  border-color: rgba(74, 158, 255, 0.5);
}

.ship-hero__content {
  position: relative;
  z-index: 5;
  padding: var(--space-10) 0 var(--space-8);
}

.ship-hero__top-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.ship-hero__badge {
  margin-bottom: 0;
}

.ship-hero__registry {
  padding: 0.35rem 0.75rem;
  font-size: var(--text-xs);
  letter-spacing: 0.15em;
  color: var(--color-text-dim);
  background: var(--color-bg-glass);
  border: 1px solid var(--color-border-hover);
  border-radius: var(--radius-sm);
}

.ship-hero__name {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 6vw, var(--text-5xl, 3.5rem));
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-text-heading);
  margin-bottom: var(--space-3);
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
}

.ship-hero__manufacturer {
  font-size: var(--text-sm);
  color: var(--color-accent);
  letter-spacing: 0.15em;
  margin-bottom: var(--space-3);
}

.ship-hero__role {
  font-size: var(--text-md);
  color: var(--color-text-body);
  max-width: 640px;
  line-height: 1.7;
  margin-bottom: var(--space-6);
}

/* Hero 底部快速数据条 */
.ship-hero__data-strip {
  display: inline-flex;
  gap: var(--space-1);
  padding: var(--space-1);
  background: rgba(5, 5, 8, 0.6);
  border: 1px solid var(--color-border-hover);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.data-strip__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 90px;
  padding: var(--space-2) var(--space-3);
  text-align: center;
  border-right: 1px solid var(--color-border-subtle);
}

.data-strip__item:last-child {
  border-right: none;
}

.data-strip__label {
  font-size: 10px;
  color: var(--color-text-dim);
  letter-spacing: 0.1em;
}

.data-strip__value {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-heading);
}

/* ── 区块标题 ── */
.section-title {
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--color-accent);
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid rgba(74, 158, 255, 0.15);
}

/* ── 核心参数 ── */
.ship-specs {
  padding-top: var(--space-8);
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-5);
}

.spec-item {
  position: relative;
  padding: var(--space-4);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
}

.spec-item__corner {
  position: absolute;
  z-index: 1;
}

.spec-item__corner--tl { top: 0.75rem; left: 0.75rem; }
.spec-item__corner--br { bottom: 0.75rem; right: 0.75rem; }

.spec-item__divider {
  margin: var(--space-2) 0;
}

.spec-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.spec-item__label {
  font-size: var(--text-xs);
  color: var(--color-text-dim);
  letter-spacing: 0.08em;
}

.spec-item__value {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-accent);
}

.spec-bar-lg {
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.spec-bar-lg__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent), var(--color-highlight, #ffb300));
  border-radius: 3px;
  transition: width 1s var(--ease-out);
}

/* ── 详细信息 ── */
.ship-info {
  padding: var(--space-8) 0 var(--space-12);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-6);
}

.info-panel {
  position: relative;
  padding: var(--space-5);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
}

.info-panel__corner {
  position: absolute;
  z-index: 1;
}

.info-panel__corner--tl { top: 1rem; left: 1rem; }
.info-panel__corner--br { bottom: 1rem; right: 1rem; }

.info-table {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row__label {
  font-size: var(--text-xs);
  color: var(--color-text-dim);
  letter-spacing: 0.08em;
}

.info-row__value {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-primary);
}

.ship-description {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.ship-description p {
  font-size: var(--text-sm);
  color: var(--color-text-body);
  line-height: 1.8;
}

/* ── 状态指示灯 ── */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-3);
}

.status-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
}

.status-item__pulse {
  flex-shrink: 0;
}

.status-item__label {
  font-size: var(--text-xs);
  color: var(--color-text-dim);
}

.status-item__value {
  margin-left: auto;
  font-size: var(--text-xs);
  font-weight: 600;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .ship-hero {
    min-height: 65vh;
  }

  .ship-hero__frame {
    inset: 1rem;
  }

  .ship-hero__top-meta {
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .ship-hero__name {
    font-size: var(--text-3xl, 2rem);
  }

  .ship-hero__data-strip {
    flex-wrap: wrap;
    width: 100%;
  }

  .data-strip__item {
    flex: 1 1 calc(33.333% - var(--space-1));
    min-width: 80px;
    border-right: none;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .data-strip__item:last-child {
    border-bottom: none;
  }

  .detail-nav .container {
    flex-direction: column;
    gap: var(--space-3);
    align-items: flex-start;
  }

  .specs-grid,
  .status-grid {
    grid-template-columns: 1fr;
  }
}

/* ═══ 同类型舰船推荐区 ═══ */
.related-ships {
  padding-top: var(--space-12);
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
  margin-top: var(--space-6);
}

.related-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  transition: all var(--motion-duration-normal) var(--motion-ease-smooth);
  overflow: hidden;
}

.related-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(var(--raw-cyan-rgb), 0.05) 0%, transparent 60%);
  opacity: 0;
  transition: opacity var(--motion-duration-normal) var(--motion-ease-smooth);
}

.related-card:hover {
  border-color: var(--color-border-accent);
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(var(--raw-cyan-rgb), 0.1);
}

.related-card:hover::before {
  opacity: 1;
}

.related-card__image {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg-deep);
}

.related-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--motion-duration-slow) var(--motion-ease-smooth);
}

.related-card:hover .related-card__image img {
  transform: scale(1.1);
}

.related-card__info {
  flex: 1;
  min-width: 0;
}

.related-card__category {
  font-size: var(--text-xs);
  color: var(--color-accent);
  letter-spacing: 0.15em;
}

.related-card__name {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-heading);
  margin: var(--space-1) 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.related-card__role {
  font-size: var(--text-xs);
  color: var(--color-text-body);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.related-card__arrow {
  color: var(--color-text-hint);
  transition: all var(--motion-duration-normal) var(--motion-ease-smooth);
  flex-shrink: 0;
}

.related-card:hover .related-card__arrow {
  color: var(--color-accent);
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
