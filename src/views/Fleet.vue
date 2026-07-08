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
            <span class="stats-bar__value font-data">{{ stat.value }}</span>
            <span class="stats-bar__label font-data">{{ stat.label }}</span>
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
            @click="activeCategory = cat"
          >
            {{ cat }}
          </button>
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

// 根据真实舰船数据计算统计信息
const fleetStats = computed(() => {
  const ships = Object.values(shipDatabase)
  const manufacturers = new Set(ships.map((s) => s.manufacturer.split('·')[0].trim()))
  return [
    { value: String(ships.length), label: '在役舰船' },
    { value: String(getCategories().length), label: '舰船类别' },
    { value: String(manufacturers.size), label: '制造商' },
    { value: '100%', label: '战备率' },
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
  gap: var(--space-1);
  flex: 1;
  text-align: center;
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

/* ── Filter ── */
.fleet-filter {
  padding: var(--space-6) 0 0;
}

.filter-group {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.6rem 1.5rem;
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-label);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  white-space: nowrap;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.filter-btn:hover {
  border-color: rgba(74, 158, 255, 0.3);
  color: #fff;
}

.filter-btn--active {
  background: rgba(74, 158, 255, 0.1);
  border-color: rgba(74, 158, 255, 0.4);
  color: var(--color-accent);
  box-shadow: 0 0 12px rgba(74, 158, 255, 0.15);
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

  .ship-grid {
    grid-template-columns: 1fr;
  }

  .stats-bar__value {
    font-size: var(--text-2xl);
  }
}
</style>
