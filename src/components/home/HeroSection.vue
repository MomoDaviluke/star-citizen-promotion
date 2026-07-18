<!--
  @file 首页英雄区
  @description 非对称分层电影构图，包含星云背景、舰船侧影、数据读数、CTA
-->
<template>
  <section class="hero-section">
    <StarMapGrid class="hero-section__grid" />

    <div class="hero-section__ship" aria-hidden="true">
      <img src="/images/sc/sc-matte-painting.jpg" alt="" class="hero-section__ship-img" />
      <div class="hero-section__ship-glow"></div>
    </div>

    <div class="hero-section__content">
      <div class="hero-section__badge">
        <StatusPulse variant="online" label="RECRUITING NOW" />
      </div>

      <h1 class="hero-section__title">
        <span class="hero-section__title-line">STELLAR</span>
        <span class="hero-section__title-line hero-section__title-line--accent">NEXUS</span>
      </h1>

      <TechDivider class="hero-section__divider" />

      <p class="hero-section__tagline">EXPLORE · FIGHT · CONQUER</p>

      <slot name="data-panel"></slot>

      <div class="hero-section__actions">
        <BaseButton variant="cta" size="lg" @click="router.push('/join')">
          START APPLICATION
        </BaseButton>
        <BaseButton variant="outline" size="lg" @click="router.push('/fleet')">
          EXPLORE FLEET
        </BaseButton>
      </div>
    </div>

    <HudCorner position="top-left" size="lg" class="hero-section__corner hero-section__corner--tl" />
    <HudCorner position="bottom-right" size="lg" class="hero-section__corner hero-section__corner--br" />
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { StarMapGrid, StatusPulse, TechDivider, HudCorner } from '../hud/index.js'
import BaseButton from '../common/BaseButton.vue'

const router = useRouter()
</script>

<style scoped>
.hero-section {
  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  padding: 0 var(--space-8);
  overflow: hidden;
  background: radial-gradient(ellipse at 70% 50%, rgba(74, 158, 255, 0.08) 0%, transparent 50%);
}

.hero-section__grid {
  z-index: 0;
}

.hero-section__ship {
  position: absolute;
  right: -10%;
  top: 50%;
  transform: translateY(-50%);
  width: 65vw;
  max-width: 1100px;
  opacity: 0.7;
  mask-image: linear-gradient(90deg, transparent 0%, black 20%, black 80%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 20%, black 80%, transparent 100%);
}

.hero-section__ship-img {
  width: 100%;
  height: auto;
  filter: grayscale(0.3) contrast(1.1) brightness(0.8);
}

.hero-section__ship-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 50%, rgba(74, 158, 255, 0.2) 0%, transparent 60%);
}

.hero-section__content {
  position: relative;
  z-index: 2;
  max-width: 620px;
}

.hero-section__badge {
  margin-bottom: var(--space-5);
}

.hero-section__title {
  font-family: var(--font-display);
  font-weight: 700;
  line-height: 0.9;
  letter-spacing: 0.08em;
  margin: 0 0 var(--space-4);
}

.hero-section__title-line {
  display: block;
  font-size: clamp(3rem, 8vw, 6rem);
  color: var(--color-text-heading);
}

.hero-section__title-line--accent {
  color: var(--color-accent);
  text-shadow: var(--glow-accent);
}

.hero-section__divider {
  width: 120px;
  margin-bottom: var(--space-5);
}

.hero-section__tagline {
  font-family: var(--font-data);
  font-size: var(--text-lg);
  letter-spacing: 0.2em;
  color: var(--color-text-label);
  margin-bottom: var(--space-6);
}

.hero-section__actions {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.hero-section__corner {
  position: absolute;
  z-index: 3;
}

.hero-section__corner--tl { top: 2rem; left: 2rem; }
.hero-section__corner--br { bottom: 2rem; right: 2rem; }

@media (max-width: 1024px) {
  .hero-section {
    grid-template-columns: 1fr;
    padding: var(--space-16) var(--space-5);
  }
  .hero-section__ship {
    width: 120vw;
    right: -30%;
    opacity: 0.4;
  }
  .hero-section__content {
    max-width: 100%;
  }
}
</style>
