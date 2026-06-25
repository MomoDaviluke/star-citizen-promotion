<!--
  @file 舰船详情页组件
  @description 展示单艘舰船的详细信息，包括大图、参数规格、基本参数、舰船描述和系统状态。
  @version 1.0 - 初始版本
-->

<template>
  <div class="ship-detail-page">
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
          <img :src="ship.image" :alt="ship.name" />
        </div>
        <div class="ship-hero__overlay"></div>
        <div class="ship-hero__content container">
          <ShipCategoryBadge :category="ship.category" class="ship-hero__badge" />
          <h1 class="ship-hero__name">{{ ship.name }}</h1>
          <p class="ship-hero__manufacturer font-data">{{ ship.manufacturer }}</p>
          <p class="ship-hero__role">{{ ship.role }}</p>
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
    </template>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getShipBySlug } from '../data/shipDatabase.js'
import { HudCorner, TechDivider, ShipCategoryBadge, StatusPulse } from '../components/hud/index.js'

const route = useRoute()
const router = useRouter()
const ship = ref(null)

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

// 首次加载
loadShip()

// slug 变化时重新加载（支持同页切换）
watch(() => route.params.slug, loadShip)
</script>

<style scoped>
/* 详情页全局容器 */
.ship-detail-page {
  min-height: 100vh;
  background: var(--color-bg, #050508);
  color: var(--color-text-heading, #ffffff);
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
  min-height: 50vh;
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
  filter: brightness(0.6);
}

.ship-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(5, 5, 8, 1) 0%, rgba(5, 5, 8, 0.3) 50%, rgba(5, 5, 8, 0.6) 100%);
}

.ship-hero__content {
  position: relative;
  z-index: 1;
  padding: var(--space-8) 0;
}

.ship-hero__badge {
  margin-bottom: var(--space-3);
}

.ship-hero__name {
  font-size: var(--text-5xl, 3rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  margin-bottom: var(--space-2);
}

.ship-hero__manufacturer {
  font-size: var(--text-sm);
  color: var(--color-accent);
  letter-spacing: 0.1em;
  margin-bottom: var(--space-3);
}

.ship-hero__role {
  font-size: var(--text-base);
  color: var(--color-text-body);
  max-width: 600px;
  line-height: 1.6;
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
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
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
  border: 1px solid rgba(255, 255, 255, 0.08);
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
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
  background: rgba(255, 255, 255, 0.03);
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
  .ship-hero__name {
    font-size: var(--text-3xl, 2rem);
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
</style>
