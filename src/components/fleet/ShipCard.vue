<!--
  @file 舰队舰船卡片
  @description 新版舰船展示卡片，带双层 HUD 边框、角标、类别徽章与数据条
-->
<template>
  <div
    class="ship-card"
    role="button"
    tabindex="0"
    @click="$emit('click')"
    @keydown.enter="$emit('click')"
  >
    <div class="ship-card__shell">
      <div class="ship-card__core">
        <HudCorner position="top-left" size="sm" class="ship-card__corner ship-card__corner--tl" />
        <HudCorner position="bottom-right" size="sm" class="ship-card__corner ship-card__corner--br" />

        <!-- Ship image area -->
        <div class="ship-card__image">
          <img :src="ship.image" :alt="ship.name" loading="lazy" />
          <div class="ship-card__scanline" aria-hidden="true"></div>
        </div>

        <div class="ship-card__content">
          <div class="ship-card__meta">
            <span class="ship-card__model font-data">{{ ship.manufacturer }}</span>
            <ShipCategoryBadge :category="ship.category" />
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
</template>

<script setup>
import { HudCorner, ShipCategoryBadge } from '../hud/index.js'

defineProps({
  ship: { type: Object, required: true }
})

defineEmits(['click'])
</script>

<style scoped>
.ship-card {
  cursor: pointer;
}

.ship-card__shell {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-2xl);
  padding: 6px;
  transition:
    border-color var(--motion-duration-fast) var(--motion-ease-out),
    box-shadow var(--motion-duration-fast) var(--motion-ease-out),
    transform var(--motion-duration-fast) var(--motion-ease-spring);
}

.ship-card:hover .ship-card__shell {
  border-color: rgba(74, 158, 255, 0.3);
  box-shadow: 0 0 32px rgba(74, 158, 255, 0.15), 0 0 60px rgba(74, 158, 255, 0.06);
  transform: translateY(-4px);
}

.ship-card__core {
  position: relative;
  background: var(--color-bg-card);
  border-radius: calc(var(--radius-2xl) - 4px);
  overflow: hidden;
}

.ship-card__corner {
  position: absolute;
  z-index: 3;
}

.ship-card__corner--tl { top: 0.75rem; left: 0.75rem; }
.ship-card__corner--br { bottom: 0.75rem; right: 0.75rem; }

.ship-card__image {
  position: relative;
  height: 220px;
  overflow: hidden;
  background: var(--color-bg-deep);
}

.ship-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--motion-duration-slow) var(--motion-ease-smooth);
}

.ship-card:hover .ship-card__image img {
  transform: scale(1.06);
}

.ship-card__scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(74, 158, 255, 0.03) 2px,
    rgba(74, 158, 255, 0.03) 4px
  );
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--motion-duration-fast) var(--motion-ease-out);
}

.ship-card:hover .ship-card__scanline {
  opacity: 1;
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
  background: linear-gradient(90deg, var(--color-accent), rgba(74, 158, 255, 0.4));
  border-radius: 2px;
  transition: width var(--motion-duration-slow) var(--motion-ease-smooth);
  box-shadow: 0 0 8px rgba(74, 158, 255, 0.4), 0 0 16px rgba(74, 158, 255, 0.15);
}
</style>
