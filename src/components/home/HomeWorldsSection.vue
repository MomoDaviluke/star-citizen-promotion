<!--
  @file 首页星球预览板块
  @description 展示 NASA 真实火星纹理与轨道环全息数据面板
  @module components/home/HomeWorldsSection
-->
<template>
  <section
    ref="sectionRef"
    class="worlds-section section"
    data-animate
    aria-labelledby="worlds-title"
  >
    <div class="worlds-section__nebula" aria-hidden="true" />
    <div class="worlds-section__grid" aria-hidden="true" />

    <div class="container">
      <div class="worlds-section__header">
        <span class="section-label">// WORLDS</span>
        <h2 id="worlds-title" class="section-title">行星探索</h2>
        <p class="section-desc">穿越已知星域，探索每一个可能藏匿资源与机遇的行星</p>
      </div>

      <div class="worlds-section__body">
        <HudPanel class="worlds-section__panel" :skewed="false" corner-size="md">
          <span class="worlds-section__index">01</span>
          <h3 class="worlds-section__panel-title">MARS</h3>
          <p class="worlds-section__panel-desc">
            纹理来源：NASA 3D Resources - Mars，版权标注 NASA/JPL-Caltech
          </p>
          <div class="worlds-section__data">
            <div
              v-for="(row, idx) in planetData"
              :key="row.key"
              class="worlds-section__data-row"
              :style="{ '--stagger': idx }"
            >
              <span class="worlds-section__data-key">{{ row.key }}</span>
              <span class="worlds-section__data-value">{{ row.value }}</span>
            </div>
          </div>
        </HudPanel>

        <div class="worlds-section__planet-wrap" aria-hidden="true">
          <CosmicPlanet
            size="large"
            variant="mars"
            rotation-duration="110"
            texture="/assets/cosmic/planets/mars.jpg"
            class="worlds-section__planet"
          >
            <template #rings>
              <OrbitalRing :size="560" :count="3" />
            </template>
          </CosmicPlanet>
          <div class="worlds-section__moon" aria-hidden="true" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import HudPanel from '../cosmic/HudPanel.vue'
import CosmicPlanet from '../cosmic/CosmicPlanet.vue'
import OrbitalRing from '../cosmic/OrbitalRing.vue'

/**
 * 行星核心数据
 * 集中管理以避免模板硬编码，便于后续扩展为多行星数据驱动渲染
 */
const planetData = [
  { key: 'GRAVITY', value: '1.12 G' },
  { key: 'ATMOSPHERE', value: 'BREATHABLE' },
  { key: 'RESOURCES', value: 'RICH' }
]

const sectionRef = ref(null)
let observer = null

onMounted(() => {
  // 当板块进入视口时添加可见类，触发滚动入场动画
  if (!sectionRef.value || typeof IntersectionObserver === 'undefined') return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  )

  observer.observe(sectionRef.value)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<style scoped>
/*
  性能策略：
  1. content-visibility: auto — 未进入视口时浏览器可跳过布局和绘制，显著降低首屏渲染成本
  2. contain-intrinsic-size — 为 content-visibility 提供占位尺寸，避免滚动条跳动
  3. contain: layout paint — 限制星球容器的重排/重绘范围
  4. prefers-reduced-motion — 所有持续动画在减少动效偏好下降级为静态
*/
.worlds-section {
  position: relative;
  overflow: hidden;
  content-visibility: auto;
  contain-intrinsic-size: auto 900px;
}

/*
  深空星云背景：仅使用 CSS 多层径向渐变实现，无 Canvas/视频开销。
  色调与火星呼应（橙红 + 深紫），形成电影感史诗氛围。
*/
.worlds-section__nebula {
  position: absolute;
  inset: -10%;
  pointer-events: none;
  background:
    radial-gradient(
      ellipse 80% 60% at 75% 45%,
      rgba(180, 70, 40, 0.12) 0%,
      transparent 55%
    ),
    radial-gradient(
      ellipse 60% 80% at 25% 60%,
      rgba(80, 40, 120, 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse 50% 50% at 50% 100%,
      rgba(74, 158, 255, 0.05) 0%,
      transparent 45%
    );
  filter: blur(40px);
  opacity: 0.8;
  animation: nebula-drift 60s ease-in-out infinite alternate;
}

@keyframes nebula-drift {
  0% { transform: translate(-2%, -1%) scale(1); }
  100% { transform: translate(2%, 1%) scale(1.05); }
}

/*
  精密网格覆盖层：低对比度经纬线，强化 HUD/军事终端风格。
  使用 repeating-linear-gradient 而非图片，体积为零。
*/
.worlds-section__grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 79px,
      rgba(74, 158, 255, 0.04) 80px
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 79px,
      rgba(74, 158, 255, 0.04) 80px
    );
  mask-image: radial-gradient(ellipse at 70% 50%, black 0%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at 70% 50%, black 0%, transparent 70%);
  opacity: 0.5;
}

.worlds-section__header {
  text-align: center;
  margin-bottom: var(--space-10);
  position: relative;
  z-index: 1;
}

.worlds-section__body {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-12);
  position: relative;
  z-index: 1;
}

.worlds-section__panel {
  max-width: 380px;
  width: 100%;
  position: relative;
}

/*
  HUD 面板左侧装饰条：模拟数据读取光带，增强全息感。
  动画仅在板块可见后触发，避免离屏时无效渲染。
*/
.worlds-section.is-visible .worlds-section__panel::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--color-accent) 40%,
    var(--color-highlight) 60%,
    transparent 100%
  );
  opacity: 0.8;
  animation: data-pulse 3s ease-in-out infinite;
}

@keyframes data-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.worlds-section__index {
  display: block;
  font-family: var(--font-data);
  font-size: var(--text-sm);
  color: var(--color-accent);
  letter-spacing: 0.1em;
  margin-bottom: var(--space-2);
}

.worlds-section__panel-title {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--color-text-heading);
  letter-spacing: 0.08em;
  margin: 0 0 var(--space-2);
  text-shadow: 0 0 24px rgba(180, 70, 40, 0.35);
}

.worlds-section__panel-desc {
  font-size: var(--text-xs);
  color: var(--color-text-dim);
  margin-bottom: var(--space-6);
  line-height: 1.6;
}

.worlds-section__data {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.worlds-section__data-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) 0;
  border-bottom: 1px solid rgba(74, 158, 255, 0.1);
  font-family: var(--font-data);
  font-size: var(--text-sm);
  letter-spacing: 0.05em;
  opacity: 0;
  transform: translateX(-12px);
  transition:
    opacity 0.5s var(--ease-out) calc(var(--stagger, 0) * 120ms),
    transform 0.5s var(--ease-out) calc(var(--stagger, 0) * 120ms);
}

.worlds-section.is-visible .worlds-section__data-row {
  opacity: 1;
  transform: translateX(0);
}

.worlds-section__data-key {
  color: var(--color-text-label);
}

.worlds-section__data-value {
  color: var(--color-text-heading);
  text-shadow: 0 0 12px rgba(74, 158, 255, 0.25);
}

.worlds-section__planet-wrap {
  position: relative;
  width: min(42vw, 520px);
  aspect-ratio: 1 / 1;
  flex-shrink: 0;
  contain: layout paint;
}

.worlds-section__planet {
  width: 100%;
  height: 100%;
  will-change: transform;
}

/* 火卫一 Phobos：不规则小卫星 */
.worlds-section__moon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 14px;
  margin: -7px 0 0 -9px;
  border-radius: 45% 55% 40% 60% / 55% 45% 60% 40%;
  background:
    radial-gradient(circle at 30% 30%, rgba(140, 130, 120, 0.8), transparent 40%),
    radial-gradient(circle at 70% 60%, rgba(60, 55, 50, 0.9), transparent 35%),
    linear-gradient(145deg, #6d635a 0%, #3a3430 60%, #1f1c1a 100%);
  box-shadow:
    inset -3px -3px 6px rgba(0, 0, 0, 0.9),
    0 0 10px rgba(0, 0, 0, 0.5);
  opacity: 0.85;
  pointer-events: none;
  transform-origin: center center;
  animation: phobos-orbit 28s linear infinite;
  will-change: transform;
}

@keyframes phobos-orbit {
  0% {
    transform: rotate(0deg) translateX(230px) translateZ(20px) rotate(0deg);
  }
  25% {
    transform: rotate(90deg) translateX(260px) translateZ(-40px) rotate(-90deg);
  }
  50% {
    transform: rotate(180deg) translateX(230px) translateZ(20px) rotate(-180deg);
  }
  75% {
    transform: rotate(270deg) translateX(200px) translateZ(80px) rotate(-270deg);
  }
  100% {
    transform: rotate(360deg) translateX(230px) translateZ(20px) rotate(-360deg);
  }
}

@media (max-width: 1024px) {
  .worlds-section__body {
    flex-direction: column-reverse;
    gap: var(--space-10);
  }

  .worlds-section__panel {
    max-width: 520px;
  }

  .worlds-section__planet-wrap {
    width: min(55vw, 420px);
  }

  @keyframes phobos-orbit {
    0% {
      transform: rotate(0deg) translateX(180px) translateZ(20px) rotate(0deg);
    }
    25% {
      transform: rotate(90deg) translateX(200px) translateZ(-40px) rotate(-90deg);
    }
    50% {
      transform: rotate(180deg) translateX(180px) translateZ(20px) rotate(-180deg);
    }
    75% {
      transform: rotate(270deg) translateX(160px) translateZ(80px) rotate(-270deg);
    }
    100% {
      transform: rotate(360deg) translateX(180px) translateZ(20px) rotate(-360deg);
    }
  }
}

@media (max-width: 768px) {
  .worlds-section__nebula {
    opacity: 0.5;
    filter: blur(30px);
  }

  .worlds-section__grid {
    opacity: 0.25;
  }

  .worlds-section__planet-wrap {
    width: min(70vw, 320px);
  }

  .worlds-section__moon {
    width: 12px;
    height: 10px;
    margin: -5px 0 0 -6px;
  }

  @keyframes phobos-orbit {
    0% {
      transform: rotate(0deg) translateX(140px) translateZ(15px) rotate(0deg);
    }
    25% {
      transform: rotate(90deg) translateX(160px) translateZ(-25px) rotate(-90deg);
    }
    50% {
      transform: rotate(180deg) translateX(140px) translateZ(15px) rotate(-180deg);
    }
    75% {
      transform: rotate(270deg) translateX(120px) translateZ(55px) rotate(-270deg);
    }
    100% {
      transform: rotate(360deg) translateX(140px) translateZ(15px) rotate(-360deg);
    }
  }
}

/* 尊重减少动画偏好：禁用持续动画，保持内容可见 */
@media (prefers-reduced-motion: reduce) {
  .worlds-section__nebula,
  .worlds-section__moon {
    animation: none;
  }

  .worlds-section.is-visible .worlds-section__panel::before {
    animation: none;
    opacity: 0.6;
  }

  .worlds-section__data-row {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
