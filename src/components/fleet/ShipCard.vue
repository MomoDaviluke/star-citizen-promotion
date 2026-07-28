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
          <!-- 骨架占位：图片加载前显示 HUD 风格占位 -->
          <div v-if="!imageLoaded" class="ship-card__skeleton" aria-hidden="true">
            <svg class="ship-card__skeleton-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M32 8L52 28v20L32 56 12 48V28z" opacity="0.3"/>
              <path d="M32 8v48M12 28h40" opacity="0.2"/>
            </svg>
            <div class="ship-card__skeleton-shimmer"></div>
          </div>
          <img
            :src="ship.image"
            :alt="ship.name"
            width="400"
            height="225"
            loading="lazy"
            decoding="async"
            :class="{ 'is-loaded': imageLoaded }"
            @load="imageLoaded = true"
            @error="imageLoaded = true"
          />
          <div class="ship-card__image-frame" aria-hidden="true">
            <span class="ship-card__frame-corner ship-card__frame-corner--tl" />
            <span class="ship-card__frame-corner ship-card__frame-corner--tr" />
            <span class="ship-card__frame-corner ship-card__frame-corner--bl" />
            <span class="ship-card__frame-corner ship-card__frame-corner--br" />
          </div>
          <div class="ship-card__vignette" aria-hidden="true"></div>
          <div class="ship-card__reflection" aria-hidden="true"></div>
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
import { ref } from 'vue'
import { HudCorner, ShipCategoryBadge } from '../hud/index.js'

defineProps({
  ship: { type: Object, required: true }
})

defineEmits(['click'])

// 图片加载状态：加载前显示骨架占位
const imageLoaded = ref(false)
</script>

<style scoped>
.ship-card {
  cursor: pointer;
}

.ship-card__shell {
  background: var(--color-bg-glass);
  border: 1px solid var(--color-border-hover);
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
  background:
    linear-gradient(135deg, rgba(74, 158, 255, 0.05) 0%, transparent 50%),
    var(--color-bg-deep);
}

/* 图片加载前的骨架占位：HUD 风格飞船轮廓 + 扫光 */
.ship-card__skeleton {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(135deg, rgba(74, 158, 255, 0.05) 0%, transparent 50%),
    var(--color-bg-deep);
  overflow: hidden;
}

.ship-card__skeleton-icon {
  width: 64px;
  height: 64px;
  color: var(--color-accent);
  opacity: 0.2;
}

.ship-card__skeleton-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(74, 158, 255, 0.06) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  animation: skeleton-shimmer 1.8s infinite;
}

@keyframes skeleton-shimmer {
  100% { transform: translateX(100%); }
}

.ship-card__image img {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition:
    opacity var(--motion-duration-slow) var(--motion-ease-smooth),
    transform var(--motion-duration-slow) var(--motion-ease-smooth),
    filter var(--motion-duration-slow) var(--motion-ease-smooth);
}

.ship-card__image img.is-loaded {
  opacity: 1;
}

.ship-card:hover .ship-card__image img {
  transform: scale(1.06);
  filter: brightness(1.08) contrast(1.04);
}

/* 舰船图片边框角标：强化 HUD 军事终端风格 */
.ship-card__image-frame {
  position: absolute;
  inset: 0.75rem;
  pointer-events: none;
  z-index: 4;
}

.ship-card__frame-corner {
  position: absolute;
  width: 16px;
  height: 16px;
  border-color: rgba(74, 158, 255, 0.35);
  border-style: solid;
  transition: border-color var(--motion-duration-fast) var(--motion-ease-out);
}

.ship-card__frame-corner--tl {
  top: 0;
  left: 0;
  border-width: 2px 0 0 2px;
}
.ship-card__frame-corner--tr {
  top: 0;
  right: 0;
  border-width: 2px 2px 0 0;
}
.ship-card__frame-corner--bl {
  bottom: 0;
  left: 0;
  border-width: 0 0 2px 2px;
}
.ship-card__frame-corner--br {
  bottom: 0;
  right: 0;
  border-width: 0 2px 2px 0;
}

.ship-card:hover .ship-card__frame-corner {
  border-color: rgba(74, 158, 255, 0.65);
}

/* 暗角 + 底部淡出：电影级产品目录打光 */
.ship-card__vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
  background:
    radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(5, 5, 8, 0.55) 100%),
    linear-gradient(180deg, transparent 50%, rgba(5, 5, 8, 0.85) 100%);
  opacity: 0.9;
  transition: opacity var(--motion-duration-fast) var(--motion-ease-out);
}

.ship-card:hover .ship-card__vignette {
  opacity: 0.75;
}

/* 底部反光条：模拟展示台光泽 */
.ship-card__reflection {
  position: absolute;
  bottom: 0;
  left: 5%;
  right: 5%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(74, 158, 255, 0.35) 50%,
    transparent 100%
  );
  box-shadow: 0 0 12px rgba(74, 158, 255, 0.25);
  pointer-events: none;
  z-index: 4;
  opacity: 0.6;
  transition: opacity var(--motion-duration-fast) var(--motion-ease-out);
}

.ship-card:hover .ship-card__reflection {
  opacity: 1;
}

.ship-card__scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(74, 158, 255, 0.04) 2px,
    rgba(74, 158, 255, 0.04) 4px
  );
  pointer-events: none;
  opacity: 0;
  z-index: 4;
  transition: opacity var(--motion-duration-fast) var(--motion-ease-out);
}

.ship-card:hover .ship-card__scanline {
  opacity: 1;
}

@keyframes image-shimmer {
  100% { transform: translateX(100%); }
}

@media (prefers-reduced-motion: reduce) {
  .ship-card__image img {
    transition: none;
  }

  .ship-card__skeleton-shimmer {
    animation: none;
  }
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
  color: var(--color-text-heading);
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
  background: var(--color-border-subtle);
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
