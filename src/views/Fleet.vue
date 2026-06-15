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
      </div>
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
            @click="activeCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>
    </section>

    <!-- Ship grid -->
    <section class="fleet-grid-section section">
      <div class="container">
        <div class="ship-grid">
          <div v-for="ship in filteredShips" :key="ship.name" class="ship-card">
            <!-- Double-Bezel outer shell -->
            <div class="bezel-shell">
              <!-- Double-Bezel inner core -->
              <div class="bezel-core">
                <!-- Ship image area -->
                <div class="ship-card__image">
                  <img :src="ship.image" :alt="ship.name" loading="lazy" />
                </div>

                <div class="ship-card__content">
                  <div class="ship-card__meta">
                    <span class="ship-card__model font-data">{{ ship.manufacturer }}</span>
                    <span class="amber-pill">{{ ship.category }}</span>
                  </div>
                  <h3 class="ship-card__name">{{ ship.name }}</h3>
                  <p class="ship-card__role">{{ ship.role }}</p>

                  <!-- Readiness bars -->
                  <div class="ship-card__specs">
                    <div v-for="spec in ship.specs" :key="spec.label" class="ship-card__spec">
                      <span class="ship-card__spec-label font-data">{{ spec.label }}</span>
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
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const activeCategory = ref('全部')
const categories = ['全部', '战斗', '运输', '采矿', '侦察']

const fleetStats = ref([
  { value: '12', label: '在役舰船' },
  { value: '4', label: '舰船类别' },
  { value: '6', label: '制造商' },
  { value: '100%', label: '战备率' },
])

const ships = ref([
  {
    name: 'Aegis Hammerhead',
    manufacturer: 'Aegis Dynamics',
    category: '战斗',
    role: '重型护卫舰 — 多炮塔反战斗机平台',
    image: '/images/sc/sc-bengal.jpg',
    specs: [
      { label: '火力', value: 92 },
      { label: '防御', value: 88 },
      { label: '机动', value: 35 },
    ]
  },
  {
    name: 'RSI Constellation Andromeda',
    manufacturer: 'Roberts Space Industries',
    category: '运输',
    role: '多功能巡洋舰 — 运输与战斗兼备',
    image: '/images/sc/sc-constellation.jpg',
    specs: [
      { label: '火力', value: 70 },
      { label: '防御', value: 65 },
      { label: '货仓', value: 60 },
    ]
  },
  {
    name: 'Anvil Arrow',
    manufacturer: 'Anvil Aerospace',
    category: '战斗',
    role: '轻型战斗机 — 高机动空优战机',
    image: '/images/sc/sc-buccaneer.jpg',
    specs: [
      { label: '火力', value: 55 },
      { label: '机动', value: 95 },
      { label: '防御', value: 30 },
    ]
  },
  {
    name: 'MISC Prospector',
    manufacturer: 'MISC',
    category: '采矿',
    role: '工业采矿船 — 小型矿物开采',
    image: '/images/sc/sc-spaceship-4k.jpg',
    specs: [
      { label: '采矿', value: 85 },
      { label: '防御', value: 25 },
      { label: '机动', value: 60 },
    ]
  },
  {
    name: 'Drake Cutlass Black',
    manufacturer: 'Drake Interplanetary',
    category: '战斗',
    role: '中型突击舰 — 多用途战斗运输',
    image: '/images/sc/sc-bengal.jpg',
    specs: [
      { label: '火力', value: 72 },
      { label: '防御', value: 50 },
      { label: '货仓', value: 45 },
    ]
  },
  {
    name: 'Aegis Vanguard Sentinel',
    manufacturer: 'Aegis Dynamics',
    category: '侦察',
    role: '电子战机 — 长距离拦截与电子战',
    image: '/images/sc/sc-constellation.jpg',
    specs: [
      { label: '火力', value: 78 },
      { label: '防御', value: 70 },
      { label: '续航', value: 88 },
    ]
  },
])

const filteredShips = computed(() => {
  if (activeCategory.value === '全部') return ships.value
  return ships.value.filter(s => s.category === activeCategory.value)
})
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
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 999px;
  background: rgba(0, 229, 255, 0.08);
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
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.filter-btn:hover {
  border-color: rgba(0, 229, 255, 0.3);
  color: #fff;
}

.filter-btn--active {
  background: rgba(0, 229, 255, 0.1);
  border-color: rgba(0, 229, 255, 0.4);
  color: var(--color-accent);
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.15);
}

/* ── Double-Bezel Card ── */
.bezel-shell {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-2xl);
  padding: 6px;
  transition: border-color var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out);
}

.ship-card:hover .bezel-shell {
  border-color: rgba(0, 229, 255, 0.3);
  box-shadow: 0 0 32px rgba(0, 229, 255, 0.15), 0 0 60px rgba(0, 229, 255, 0.06);
}

.bezel-core {
  background: var(--color-bg-card);
  border-radius: calc(var(--radius-2xl) - 4px);
  overflow: hidden;
}

/* ── Ship Grid ── */
.ship-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5);
}

/* ── Ship Card ── */
.ship-card__image {
  height: 220px;
  overflow: hidden;
  background: var(--color-bg-deep);
}

.ship-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s var(--ease-smooth);
}

.ship-card:hover .ship-card__image img {
  transform: scale(1.06);
}

.ship-card__content {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.ship-card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ship-card__model {
  font-size: var(--text-xs);
  color: var(--color-accent);
  letter-spacing: 0.12em;
}

.amber-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 12px;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-highlight);
  border: 1px solid rgba(255, 179, 0, 0.3);
  border-radius: 999px;
  background: rgba(255, 179, 0, 0.1);
}

.ship-card__name {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.01em;
  margin-bottom: 0;
}

.ship-card__role {
  font-size: var(--text-sm);
  color: var(--color-text-body);
  line-height: 1.6;
}

/* ── Spec Bars ── */
.ship-card__specs {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.ship-card__spec {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ship-card__spec-label {
  font-size: var(--text-xs);
  color: var(--color-text-dim);
  letter-spacing: 0.08em;
}

.spec-bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
}

.spec-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent), rgba(0, 229, 255, 0.4));
  border-radius: 2px;
  transition: width 0.6s var(--ease-smooth);
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.4), 0 0 16px rgba(0, 229, 255, 0.15);
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
