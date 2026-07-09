<!--
  @file 舰队展示视图组件
  @description Cinematic Sci-Fi — 展示战队所有飞船
  @version 10.0 - Cinematic Sci-Fi
-->

<template>
  <div class="fleet-page">

    <!-- Hero banner: 40vh -->
    <section class="hero">
      <div class="hero__bg"></div>
      <div class="hero__overlay"></div>
      <div class="hero__content container">
        <span class="pill-badge">// FLEET REGISTRY</span>
        <h1>舰队展厅</h1>
        <p class="hero__tagline">
          每一艘舰船都是星海中淬炼出的钢铁意志，在第四舰队麾下等待下一次跃迁指令
        </p>
        <p class="hero__tagline-en font-data">
          EVERY VESSEL IS A STEEL WILL FORGED AMONG THE STARS
        </p>
        <TechDivider class="hero__divider" />
      </div>
      <HudCorner position="top-left" size="md" class="hero__corner hero__corner--tl" />
      <HudCorner position="bottom-right" size="md" class="hero__corner hero__corner--br" />
    </section>

    <!-- Stats bar -->
    <section class="fleet-stats">
      <div class="container">
        <div class="stats-bar">
          <div v-for="stat in fleetStats" :key="stat.label" class="stats-bar__item">
            <span class="stats-bar__icon" aria-hidden="true">
              <svg v-if="stat.icon === 'ships'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 17h18l-2-8H5L3 17z" />
                <path d="M7 9V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
              </svg>
              <svg v-else-if="stat.icon === 'classes'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              <svg v-else-if="stat.icon === 'makers'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </span>
            <span class="stats-bar__value font-data">{{ stat.value }}</span>
            <span class="stats-bar__label font-data">{{ stat.label }}</span>
            <span class="stats-bar__label-en font-data">{{ stat.labelEn }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Category filter -->
    <section class="fleet-filter">
      <div class="container">
        <div class="filter-group">
          <button
            v-for="cat in categories"
            :key="cat"
            class="filter-btn"
            :class="{ 'filter-btn--active': activeCategory === cat }"
            :aria-pressed="activeCategory === cat"
            :style="activeCategory === cat ? filterStyle(cat) : null"
            @click="activeCategory = cat"
          >
            <span class="filter-btn__icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path v-if="filterMeta[cat]?.icon === 'all'" d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
                <path v-else-if="filterMeta[cat]?.icon === 'combat'" d="M12 3a9 9 0 1 0 9 9M12 3v4M12 3L9 6m3-3l3 3M3 12h4M3 12l3 3M3 12l3-3" />
                <path v-else-if="filterMeta[cat]?.icon === 'exploration'" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4v4l3 3" />
                <path v-else-if="filterMeta[cat]?.icon === 'transport'" d="M3 6h18v12H3zM8 6v12M16 6v12M3 10h18M3 14h18" />
                <path v-else-if="filterMeta[cat]?.icon === 'interceptor'" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                <path v-else-if="filterMeta[cat]?.icon === 'racing'" d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
                <circle v-else cx="12" cy="12" r="9" />
              </svg>
            </span>
            <span class="filter-btn__label">{{ cat }}</span>
            <span class="filter-btn__en">{{ filterMeta[cat]?.labelEn || cat.toUpperCase() }}</span>
          </button>
        </div>

        <div class="filter-status font-data" aria-live="polite">
          <span class="filter-status__count">{{ filteredShips.length }}</span>
          <span class="filter-status__text">艘舰船 · UNITS</span>
          <span v-if="activeCategory !== '全部'" class="filter-status__category">
            / {{ activeCategory }}
          </span>
        </div>
      </div>
    </section>

    <!-- Ship grid -->
    <section class="fleet-grid-section section" aria-live="polite" aria-atomic="false">
      <div class="container">
        <p class="visually-hidden">当前显示 {{ filteredShips.length }} 艘舰船</p>
        <TransitionGroup name="ship-list" tag="div" class="ship-grid">
          <ShipCard
            v-for="ship in filteredShips"
            :key="ship.slug"
            :ship="ship"
            @click="goToShip(ship.slug)"
          />
        </TransitionGroup>

        <!-- 空状态：当前筛选条件下无舰船 -->
        <div v-if="filteredShips.length === 0" class="empty-state">
          <div class="empty-state__icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25">
              <circle cx="12" cy="12" r="9" />
              <path d="M9 9l6 6M15 9l-6 6" />
            </svg>
          </div>
          <h3 class="empty-state__title">未找到匹配舰船 · NO MATCHING UNITS</h3>
          <p class="empty-state__desc">当前分类下暂无在役舰船，请切换其他分类查看。</p>
          <button class="empty-state__reset" @click="activeCategory = '全部'">
            查看全部舰队 · VIEW ALL
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import shipDatabase, { shipList, getCategories } from '../data/shipDatabase.js'
import { HudCorner, TechDivider } from '../components/hud/index.js'
import ShipCard from '../components/fleet/ShipCard.vue'

const router = useRouter()

// 分类：全部 + 数据库中实际存在的分类
const activeCategory = ref('全部')
const categories = computed(() => ['全部', ...getCategories()])

/**
 * 筛选按钮元数据：图标、英文标签与主题色
 * 用于统一按钮视觉语言，与 ShipCategoryBadge 的配色体系保持一致
 */
const filterMeta = {
  '全部': { icon: 'all', labelEn: 'ALL', color: '#4a9eff' },
  '战斗': { icon: 'combat', labelEn: 'COMBAT', color: '#ef4444' },
  '探索': { icon: 'exploration', labelEn: 'EXPLORATION', color: '#4a9eff' },
  '运输': { icon: 'transport', labelEn: 'TRANSPORT', color: '#ffb300' },
  '截击': { icon: 'interceptor', labelEn: 'INTERCEPTOR', color: '#a78bfa' },
  '竞速': { icon: 'racing', labelEn: 'RACING', color: '#f472b6' }
}

/**
 * 根据分类返回激活态按钮的动态样式
 * @param {string} cat - 分类名称
 * @returns {object} CSS 样式对象
 */
function filterStyle(cat) {
  const meta = filterMeta[cat]
  if (!meta) return {}
  return {
    '--filter-active-color': meta.color,
    '--filter-active-bg': `${meta.color}1A`,
    '--filter-active-glow': `${meta.color}26`
  }
}

/**
 * 舰队展厅顶部统计信息
 * 为每个指标配置图标与英文标签，强化 HUD 数据面板风格
 */
const fleetStats = computed(() => {
  const ships = Object.values(shipDatabase)
  const manufacturers = new Set(ships.map((s) => s.manufacturer.split('·')[0].trim()))
  return [
    { value: String(ships.length), label: '在役舰船', labelEn: 'IN SERVICE', icon: 'ships' },
    { value: String(getCategories().length), label: '舰船类别', labelEn: 'CLASSES', icon: 'classes' },
    { value: String(manufacturers.size), label: '制造商', labelEn: 'MAKERS', icon: 'makers' },
    { value: '100%', label: '战备率', labelEn: 'READINESS', icon: 'readiness' }
  ]
})

// 从统一数据库构建展示列表，保留前三个 specs 作为卡片摘要
const ships = computed(() =>
  shipList.map((slug) => {
    const s = shipDatabase[slug]
    return {
      slug,
      name: s.name,
      manufacturer: s.manufacturer,
      category: s.category,
      role: s.role,
      image: s.image,
      specs: s.specs.slice(0, 3),
    }
  })
)

const filteredShips = computed(() => {
  if (activeCategory.value === '全部') return ships.value
  return ships.value.filter((s) => s.category === activeCategory.value)
})

/**
 * 点击舰船卡片进入详情页
 * @param {string} slug - 舰船唯一标识
 */
function goToShip(slug) {
  router.push({ name: '舰船详情', params: { slug } })
}
</script>

<style scoped>
/* ── Hero ── */
.hero {
  position: relative;
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero__bg {
  position: absolute;
  inset: 0;
  background: url('/images/sc/sc-fleet.jpg') center / cover no-repeat;
}

.hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 5, 8, 0.75) 0%, rgba(5, 5, 8, 0.95) 100%);
}

.hero__content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.hero__content h1 {
  font-size: var(--text-4xl);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #fff;
  margin-top: var(--space-3);
  text-shadow: 0 0 40px rgba(74, 158, 255, 0.25);
}

.hero__tagline {
  max-width: 560px;
  margin: var(--space-4) auto 0;
  font-size: var(--text-md);
  color: var(--color-text-body);
  line-height: 1.7;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
}

.hero__tagline-en {
  max-width: 560px;
  margin: var(--space-3) auto 0;
  font-size: var(--text-xs);
  letter-spacing: 0.2em;
  color: var(--color-text-dim);
  opacity: 0.8;
}

.hero__divider {
  width: 120px;
  margin: var(--space-5) auto 0;
}

.hero__corner {
  position: absolute;
  z-index: 2;
}

.hero__corner--tl { top: 1.5rem; left: 1.5rem; }
.hero__corner--br { bottom: 1.5rem; right: 1.5rem; }

/* 仅对辅助技术可见 */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ── Pill Badge ── */
.pill-badge {
  display: inline-block;
  padding: 6px 20px;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-accent);
  border: 1px solid rgba(74, 158, 255, 0.3);
  border-radius: 999px;
  background: rgba(74, 158, 255, 0.08);
}

/* ── Stats Bar ── */
.stats-bar {
  display: flex;
  gap: var(--space-8);
  padding: var(--space-5) var(--space-6);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-2xl);
}

.stats-bar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  flex: 1;
  text-align: center;
}

.stats-bar__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-bottom: var(--space-1);
  color: var(--color-accent);
  background: rgba(74, 158, 255, 0.08);
  border: 1px solid rgba(74, 158, 255, 0.15);
  border-radius: 50%;
}

.stats-bar__value {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.02em;
}

.stats-bar__label {
  font-size: var(--text-xs);
  color: var(--color-accent);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.stats-bar__label-en {
  font-size: 10px;
  color: var(--color-text-dim);
  letter-spacing: 0.1em;
  opacity: 0.7;
}

/* ── Filter ── */
.fleet-filter {
  padding: var(--space-6) 0 0;
}

.fleet-filter .container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.filter-group {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem 0.55rem 0.75rem;
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-label);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  white-space: nowrap;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.filter-btn__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-dim);
  transition: color var(--duration-fast) var(--ease-out);
}

.filter-btn__en {
  font-family: var(--font-data);
  font-size: 10px;
  color: var(--color-text-dim);
  letter-spacing: 0.05em;
  opacity: 0.7;
  transition: color var(--duration-fast) var(--ease-out);
}

.filter-btn:hover {
  border-color: rgba(74, 158, 255, 0.3);
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.filter-btn:hover .filter-btn__icon,
.filter-btn:hover .filter-btn__en {
  color: #fff;
}

.filter-btn--active {
  background: var(--filter-active-bg, rgba(74, 158, 255, 0.1));
  border-color: var(--filter-active-color, var(--color-accent));
  color: var(--filter-active-color, var(--color-accent));
  box-shadow:
    0 0 16px var(--filter-active-glow, rgba(74, 158, 255, 0.15)),
    inset 0 0 12px var(--filter-active-glow, rgba(74, 158, 255, 0.08));
}

.filter-btn--active .filter-btn__icon,
.filter-btn--active .filter-btn__en {
  color: var(--filter-active-color, var(--color-accent));
}

.filter-status {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  font-family: var(--font-data);
  color: var(--color-text-label);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
}

.filter-status__count {
  font-size: var(--text-lg);
  font-weight: 700;
  color: #fff;
}

.filter-status__text {
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
}

.filter-status__category {
  font-size: var(--text-xs);
  color: var(--color-accent);
  letter-spacing: 0.05em;
}

/* ── Ship Grid ── */
.ship-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5);
}

/* ── TransitionGroup animations ── */
.ship-list-move,
.ship-list-enter-active,
.ship-list-leave-active {
  transition: all 0.5s var(--ease-smooth);
}

.ship-list-enter-from,
.ship-list-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.96);
}

.ship-list-leave-active {
  position: absolute;
}

/* ── Empty State ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-6);
  text-align: center;
  color: var(--color-text-label);
}

.empty-state__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin-bottom: var(--space-5);
  color: var(--color-text-dim);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
}

.empty-state__title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-heading);
  margin-bottom: var(--space-2);
}

.empty-state__desc {
  max-width: 420px;
  font-size: var(--text-sm);
  color: var(--color-text-body);
  line-height: 1.7;
  margin-bottom: var(--space-5);
}

.empty-state__reset {
  padding: 0.75rem 1.75rem;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-accent);
  background: rgba(74, 158, 255, 0.08);
  border: 1px solid rgba(74, 158, 255, 0.3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.empty-state__reset:hover {
  background: rgba(74, 158, 255, 0.15);
  border-color: rgba(74, 158, 255, 0.5);
  box-shadow: 0 0 20px rgba(74, 158, 255, 0.15);
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .stats-bar {
    flex-wrap: wrap;
    gap: var(--space-5);
  }

  .stats-bar__item {
    flex: 0 0 calc(50% - var(--space-3));
  }
}

@media (max-width: 768px) {
  .hero {
    min-height: 35vh;
  }

  .hero__content h1 {
    font-size: var(--text-3xl);
  }

  .fleet-filter .container {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    justify-content: center;
  }

  .filter-status {
    align-self: center;
  }

  .filter-btn {
    flex: 1 1 auto;
    justify-content: center;
  }

  .ship-grid {
    grid-template-columns: 1fr;
  }

  .stats-bar__value {
    font-size: var(--text-2xl);
  }
}
</style>
