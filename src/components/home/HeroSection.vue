<!--
  @file Hero 区组件
  @description 全屏沉浸式 Hero — 标题、副标题、行动按钮、背景元素
  @module components/home/HeroSection
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

      <h1 ref="titleRef" class="hero-section__title">
        <span class="hero-section__title-line">STELLAR</span>
        <span class="hero-section__title-line hero-section__title-line--accent">NEXUS</span>
      </h1>

      <TechDivider class="hero-section__divider" />

      <p ref="taglineRef" class="hero-section__tagline">EXPLORE · FIGHT · CONQUER</p>

      <slot name="data-panel"></slot>

      <div ref="actionsRef" class="hero-section__actions">
        <BaseButton variant="cta" size="lg" class="hero-section__cta" @click="router.push('/join')">
          START APPLICATION
        </BaseButton>
        <BaseButton variant="outline" size="lg" @click="router.push('/fleet')">
          EXPLORE FLEET
        </BaseButton>
      </div>
    </div>

    <!-- 滚动指示器：引导用户向下探索 -->
    <div class="hero-section__scroll-indicator" aria-hidden="true">
      <span class="hero-section__scroll-text">SCROLL</span>
      <span class="hero-section__scroll-line"></span>
    </div>

    <HudCorner position="top-left" size="lg" class="hero-section__corner hero-section__corner--tl" />
    <HudCorner position="bottom-right" size="lg" class="hero-section__corner hero-section__corner--br" />
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import { StarMapGrid, StatusPulse, TechDivider, HudCorner } from '../hud/index.js'
import BaseButton from '../common/BaseButton.vue'

const router = useRouter()

// 入场动画 ref
const titleRef = ref(null)
const taglineRef = ref(null)
const actionsRef = ref(null)
let ctx = null

onMounted(() => {
  // prefers-reduced-motion 降级：跳过动画，保持内容可见
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  // 防御性检查：确保所有 ref 已挂载，避免 GSAP 找不到目标抛出错误
  if (!titleRef.value || !taglineRef.value || !actionsRef.value) return

  // 创建 GSAP context，便于组件卸载时统一清理动画资源
  ctx = gsap.context(() => {
    // Hero 标题入场时间轴
    // 顺序：标题逐行滑入 → 副标题淡入 → 按钮组交错出现
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    // 1. 标题逐行从下方滑入（y:60, opacity:0, duration:1, stagger:0.15）
    //    选择 .hero-section__title-line 的两个 span，交错出现形成逐行效果
    tl.from(titleRef.value.querySelectorAll('.hero-section__title-line'), {
      y: 60,
      opacity: 0,
      duration: 1,
      stagger: 0.15
    })
      // 2. 副标题淡入（y:30, opacity:0, duration:0.6）
      //    position '-=0.4' 表示在上一段动画结束前 0.4s 开始，形成重叠过渡
      .from(taglineRef.value, {
        y: 30,
        opacity: 0,
        duration: 0.6
      }, '-=0.4')
      // 3. 按钮组子元素交错出现（y:20, opacity:0, duration:0.5, stagger:0.1）
      //    position '-=0.3' 与副标题动画重叠
      .from(actionsRef.value.children, {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1
      }, '-=0.3')
  })
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<style scoped>
.hero-section {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
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

/* 主 CTA 脉冲呼吸动画：增强视觉吸引力 */
.hero-section__cta {
  animation: cta-pulse 3s ease-in-out infinite;
}

@keyframes cta-pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 179, 0, 0.3), 0 0 0 0 rgba(255, 179, 0, 0.15);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 179, 0, 0.5), 0 0 0 8px rgba(255, 179, 0, 0);
  }
}

/* 滚动指示器：底部居中，引导用户向下 */
.hero-section__scroll-indicator {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  z-index: 3;
  opacity: 0.5;
}

.hero-section__scroll-text {
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.3em;
  color: var(--color-text-label);
}

.hero-section__scroll-line {
  width: 1px;
  height: 40px;
  background: linear-gradient(180deg, var(--color-accent), transparent);
  position: relative;
  overflow: hidden;
}

.hero-section__scroll-line::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 12px;
  background: var(--color-accent);
  animation: scroll-drop 2s ease-in-out infinite;
}

@keyframes scroll-drop {
  0% { transform: translateY(-12px); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(40px); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-section__cta {
    animation: none;
  }
  .hero-section__scroll-line::after {
    animation: none;
    opacity: 0.5;
  }
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
    width: 100vw;
    right: -30%;
    opacity: 0.4;
  }
  .hero-section__content {
    max-width: 100%;
  }
  .hero-section__scroll-indicator {
    display: none;
  }
}
</style>
