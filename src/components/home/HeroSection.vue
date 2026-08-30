<!--
  @file Hero 区组件
  @description 全屏沉浸式 Hero — 标题、副标题、行动按钮、背景元素
  @module components/home/HeroSection
-->
<template>
  <section ref="sectionRef" class="hero-section">
    <StarfieldBg class="hero-section__starfield" quality="medium" :parallax="false" />

    <StarMapGrid class="hero-section__grid" />

    <div ref="shipRef" class="hero-section__ship" aria-hidden="true">
      <img src="/images/sc/sc-matte-painting.jpg" alt="" class="hero-section__ship-img" />
      <div class="hero-section__ship-glow"></div>
      <div class="hero-section__ship-scan"></div>
      <!-- HUD 目标标注：连接船图与界面，强化"追踪锁定"叙事 -->
      <div class="hero-section__ship-tag">
        <span class="hero-section__ship-tag-line"></span>
        <span class="hero-section__ship-tag-box">
          <span class="hero-section__ship-tag-id">TGT-04 // FLAGSHIP</span>
          <span class="hero-section__ship-tag-data">SECTOR 7G · VEL 210 · HDG 047</span>
        </span>
      </div>
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
import StarfieldBg from '../effects/StarfieldBg.vue'

const router = useRouter()

// 入场动画 ref
const titleRef = ref(null)
const taglineRef = ref(null)
const actionsRef = ref(null)
const sectionRef = ref(null)
const shipRef = ref(null)
let ctx = null
// 鼠标响应监听器（不属于 GSAP 动画资源，手动管理清理）
let pointerCleanup = null

onMounted(() => {
  const section = sectionRef.value
  // prefers-reduced-motion 降级：跳过动画，保持内容可见
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  // 防御性检查：确保关键 ref 已挂载，避免 GSAP 找不到目标抛出错误
  if (!section || !titleRef.value || !taglineRef.value || !actionsRef.value) return

  const ship = shipRef.value
  const shipImg = section.querySelector('.hero-section__ship-img')
  const grid = section.querySelector('.hero-section__grid')

  ctx = gsap.context(() => {
    /* ── 1. 入场主时间轴：7 幕分幕编排（总时长约 2.4s） ── */
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    // 幕 1：星图网格淡入
    tl.fromTo(grid, { opacity: 0 }, { opacity: 1, duration: 1.2 }, 0)

    // 幕 2：舰船图 clip-path 揭示 + 轻微右移入场
    if (ship) {
      tl.fromTo(ship,
        { clipPath: 'inset(0 100% 0 0)', x: 40, opacity: 0.3 },
        { clipPath: 'inset(0 0% 0 0)', x: 0, opacity: 0.7, duration: 1.4, ease: 'power2.inOut' }, 0.2)
    }

    // 幕 3：badge 扫描线显现（scaleX 0→1，左锚点展开）
    tl.from('.hero-section__badge',
      { scaleX: 0, opacity: 0, transformOrigin: 'left center', duration: 0.5 }, 0.9)

    // 幕 4：标题逐行滑入（保留既有节奏）
    tl.from(titleRef.value.querySelectorAll('.hero-section__title-line'),
      { y: 60, opacity: 0, duration: 1, stagger: 0.15 }, 1.1)

    // 幕 5：分隔线展开 + 副标题滑入
    tl.from('.hero-section__divider',
      { scaleX: 0, opacity: 0, transformOrigin: 'left center', duration: 0.5 }, '-=0.5')
      .from(taglineRef.value,
        { y: 30, opacity: 0, duration: 0.6 }, '-=0.3')

    // 幕 6：数据面板淡入（slot 内 HeroDataPanel 自带数值递增）
    tl.from('.hero-data-panel',
      { y: 20, opacity: 0, duration: 0.5 }, '-=0.2')

    // 幕 7：按钮组交错出现
    tl.from(actionsRef.value.children,
      { y: 20, opacity: 0, duration: 0.5, stagger: 0.1 }, '-=0.3')

    /* ── 2. 滚动视差：船图容器随滚动下移 + 缩放 + 淡出 ──
     * 仅作用于 ship 容器（y/scale/opacity）；鼠标响应作用于内层 img 与网格，
     * 分层避免与视差抢占同一属性 */
    if (ship) {
      gsap.fromTo(ship,
        { y: 0, scale: 1, opacity: 0.7 },
        {
          y: 120, scale: 0.92, opacity: 0.3, ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: 1
          }
        })
    }

    /* ── 3. 鼠标响应（仅 ≥1025px 桌面档）：quickTo 内建 rAF 节流 ── */
    if (window.matchMedia('(min-width: 1025px)').matches && shipImg && grid) {
      const imgX = gsap.quickTo(shipImg, 'x', { duration: 0.6, ease: 'power3.out' })
      const imgY = gsap.quickTo(shipImg, 'y', { duration: 0.6, ease: 'power3.out' })
      const gridX = gsap.quickTo(grid, 'x', { duration: 0.8, ease: 'power3.out' })
      const gridY = gsap.quickTo(grid, 'y', { duration: 0.8, ease: 'power3.out' })

      const onMove = (e) => {
        // 归一化指针位置到 -0.5 ~ 0.5
        const nx = e.clientX / window.innerWidth - 0.5
        const ny = e.clientY / window.innerHeight - 0.5
        imgX(nx * -16) // 船图反向微移，幅度 ≤16px
        imgY(ny * -10)
        gridX(nx * -8) // 网格反向幅度减半，形成前后景纵深
        gridY(ny * -5)
      }
      const onLeave = () => {
        imgX(0)
        imgY(0)
        gridX(0)
        gridY(0)
      }
      section.addEventListener('pointermove', onMove)
      section.addEventListener('pointerleave', onLeave)
      // 手动管理清理（context fn 执行期间 ctx 尚未赋值，不能用 ctx.add）
      pointerCleanup = () => {
        section.removeEventListener('pointermove', onMove)
        section.removeEventListener('pointerleave', onLeave)
      }
    }
  }, section)
})

onUnmounted(() => {
  pointerCleanup?.()
  ctx?.revert()
})
</script>

<style scoped>
.hero-section {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0 var(--space-8);
  overflow: hidden;
}

/* 底部渐变过渡：衔接下一 section，消除硬切边缘 */
.hero-section::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 140px;
  background: linear-gradient(180deg, transparent, var(--color-bg, #050508));
  z-index: 2;
  pointer-events: none;
}

/* 星域粒子背景：限定在 hero 区（覆盖组件默认 fixed） */
.hero-section__starfield {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-section__grid {
  position: absolute;
  inset: 0;
  z-index: 0;
}

/* 船图全屏铺满作背景层 */
.hero-section__ship {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  opacity: 0.65;
}

.hero-section__ship-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 40%;
  display: block;
  /* 色调统一：压向冷蓝，与 UI 主题色系一致，消除"贴图感" */
  filter: grayscale(0.4) contrast(1.15) brightness(0.7) saturate(1.3) hue-rotate(-10deg);
}

.hero-section__ship-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at center 40%, rgba(74, 158, 255, 0.15) 0%, transparent 60%),
    linear-gradient(180deg, rgba(5, 5, 8, 0.5) 0%, transparent 40%, transparent 60%, rgba(5, 5, 8, 0.6) 100%);
}

/* 扫描光束：周期性掠过船体，强化传感器扫描叙事 */
.hero-section__ship-scan {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 28%;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(74, 158, 255, 0.04) 30%,
    rgba(74, 158, 255, 0.1) 50%,
    rgba(74, 158, 255, 0.04) 70%,
    transparent 100%);
  animation: hero-ship-scan 6s linear infinite;
  pointer-events: none;
}

@keyframes hero-ship-scan {
  from { transform: translateX(-110%); }
  to { transform: translateX(460%); }
}

/* HUD 目标标注：锁定框风格，连接船图与界面数据层 */
.hero-section__ship-tag {
  position: absolute;
  top: 20%;
  right: 15%;
  display: flex;
  align-items: flex-start;
  gap: var(--space-2, 8px);
  pointer-events: none;
}

.hero-section__ship-tag-line {
  width: 1px;
  height: 42px;
  background: linear-gradient(180deg, rgba(74, 158, 255, 0.7), rgba(74, 158, 255, 0.1));
  transform: rotate(32deg);
  transform-origin: top center;
}

.hero-section__ship-tag-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-2, 8px) var(--space-3, 12px);
  border: 1px solid rgba(74, 158, 255, 0.35);
  background: rgba(5, 10, 20, 0.55);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.hero-section__ship-tag-id {
  font-family: var(--font-data);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--color-accent, #4a9eff);
  white-space: nowrap;
}

.hero-section__ship-tag-data {
  font-family: var(--font-data);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--color-text-label, #b8b8cc);
  opacity: 0.75;
  white-space: nowrap;
}

/* 文字内容居中覆盖在船图之上，偏上定位 */
.hero-section__content {
  position: relative;
  z-index: 3;
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
  padding-top: 18vh;
}

.hero-section__badge {
  margin-bottom: var(--space-5);
  display: flex;
  justify-content: center;
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
  /* 6vw 而非 8vw：窄窗口下标题随宽度温和收缩，避免挤压 Hero 一屏内容 */
  font-size: clamp(2.75rem, 6vw, 6rem);
  color: var(--color-text-heading);
}

.hero-section__title-line--accent {
  color: var(--color-accent);
  text-shadow: var(--glow-accent);
}

.hero-section__divider {
  width: 120px;
  margin: 0 auto var(--space-5);
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
  justify-content: center;
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
  .hero-section__ship-scan {
    animation: none;
    opacity: 0;
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
    padding: var(--space-16) var(--space-5);
  }
  .hero-section__ship {
    opacity: 0.45;
  }
  /* 移动/平板端隐藏 HUD 标注：船图为弱化背景，标注无锚点意义 */
  .hero-section__ship-tag {
    display: none;
  }
  .hero-section__content {
    max-width: 100%;
    /* 10vh 而非 14vh：矮窗口下内容更靠上，减少溢出一屏需滚动才能看全 */
    padding-top: 10vh;
  }
  .hero-section__scroll-indicator {
    display: none;
  }
}

/* 窄窗船图缓解裁切：竖长视口下 cover 仅露 ~33% 宽度，
   改为 75% 高度带显示更多船体，底部由 ship-glow 渐变与 ::after 过渡衔接 */
@media (max-width: 768px) {
  .hero-section__ship-img {
    height: 75%;
  }
}

/* 超宽屏：hero 主标题与船图随容器扩张，保持电影级比例 */
@media (min-width: 1920px) {
  .hero-section__title-line {
    font-size: clamp(2.75rem, 6vw, 7rem);
  }
}
</style>
