<!--
  @file 首页视图组件
  @description 网站首页，Stellar Nexus 星渊枢纽视觉系统 - 融合星云紫雾、星门启动、全息扫描
  @module views/Home
  @version 5.0 - Stellar Nexus 版本
-->

<template>
  <div class="home-page">
    <!-- 英雄区域：星门启动 + 星云粒子场 -->
    <section
      ref="heroRef"
      class="hero"
      :style="heroTransformStyle"
      @mousemove="handleHeroMove"
      @mouseleave="resetHeroMove"
    >
      <!-- 星云背景层 -->
      <div class="hero-nebulae">
        <div class="nebula-blob nebula-blob--purple"></div>
        <div class="nebula-blob nebula-blob--cyan"></div>
        <div class="nebula-blob nebula-blob--amber"></div>
      </div>

      <!-- 星际公民背景图 -->
      <div class="hero-bg-image">
        <img src="/images/sc/sc-hero.jpg" alt="" aria-hidden="true" />
        <div class="hero-bg-overlay"></div>
      </div>

      <!-- 星门光环 -->
      <div class="star-gate">
        <div class="gate-ring"></div>
        <div class="gate-ring"></div>
        <div class="gate-ring"></div>
        <div class="gate-spin"></div>
        <div class="gate-spin gate-spin--reverse"></div>
      </div>

      <!-- 浮动粒子 -->
      <div class="hero-particles">
        <div v-for="n in 20" :key="n" class="hero-particle" :style="getParticleStyle(n)"></div>
      </div>

      <!-- 全息扫描线 -->
      <div class="hero-scan-line"></div>

      <!-- 英雄区域内容 -->
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-icon">◆</span>
          <span class="badge-text font-data">UEE STYLE ORGANIZATION PORTAL</span>
          <span class="badge-icon">◆</span>
        </div>

        <h1 class="hero-title">
          <span class="title-main font-tech">星际公民战队</span>
          <div class="title-divider"></div>
          <span class="title-sub font-tech">官方招募站</span>
        </h1>

        <p class="hero-desc">
          面向星际公民玩家的精英团队门户，展示组织定位、核心成员、活动任务与招募信息。加入我们，征服星辰大海。
        </p>

        <div class="hero-actions">
          <RouterLink to="/join" class="btn btn-primary btn-lg btn-glow font-tech" v-ripple>
            <span class="btn-text">立即加入</span>
            <span class="btn-arrow">→</span>
          </RouterLink>
          <RouterLink to="/about" class="btn btn-outline btn-lg font-tech" v-ripple>
            <span class="btn-text">探索团队</span>
          </RouterLink>
        </div>
      </div>

      <!-- MFD风格角落装饰 -->
      <div class="mfd-corner mfd-corner--tl">
        <span class="corner-id font-data">SYS-01</span>
      </div>
      <div class="mfd-corner mfd-corner--tr">
        <span class="corner-status font-data">ONLINE</span>
      </div>
      <div class="mfd-corner mfd-corner--bl"></div>
      <div class="mfd-corner mfd-corner--br"></div>

      <!-- 系统状态栏 -->
      <div class="hero-status-bar">
        <div class="status-item">
          <StatusIndicator type="online" label="系统在线" :pulse="true" size="small" />
        </div>
        <div class="status-divider"></div>
        <div class="status-item font-data">
          <span class="status-label">SECTOR</span>
          <span class="status-value">PYRO-7</span>
        </div>
        <div class="status-divider"></div>
        <div class="status-item font-data">
          <span class="status-label">COORDS</span>
          <span class="status-value">45.22.91</span>
        </div>
        <div class="status-divider"></div>
        <div class="status-item font-data">
          <span class="status-label">TIME</span>
          <span class="status-value">{{ currentTime }}</span>
        </div>
      </div>

      <!-- 底部滚动提示 -->
      <div class="scroll-indicator">
        <span class="scroll-text font-data">向下滚动</span>
        <span class="scroll-line"></span>
      </div>
    </section>

    <!-- 操作信息条：MFD数据流风格 -->
    <section
      ref="opsStripRef"
      class="ops-strip"
      v-scroll-reveal="'fadeUp'"
    >
      <MFDPanel
        variant="secondary"
        title="TACTICAL DATA"
        subtitle="REAL-TIME"
        icon="◈"
        status="LIVE"
        statusType="online"
        :scanlines="true"
        class="ops-mfd-panel"
      >
        <div class="ops-grid">
          <DataDisplay label="STARDATE" value="2956.05" type="primary" />
          <DataDisplay label="SECTOR" value="PYRO FRINGE" type="secondary" />
          <DataDisplay label="OP ID" value="F8C-ALPHA" type="primary" />
          <DataDisplay label="STATUS" value="RECRUITING" type="success" />
        </div>
      </MFDPanel>
    </section>

    <!-- 团队统计卡片 - MFD风格 -->
    <section class="stats-section" ref="statsSectionRef">
      <div class="section-header" v-scroll-reveal="'fadeUp'">
        <span class="section-eyebrow font-data">// OVERVIEW</span>
        <h2 class="section-title font-tech">团队数据</h2>
        <div class="section-line"></div>
      </div>
      <div class="stats-grid">
        <MFDPanel
          v-for="(item, index) in teamStats"
          :key="item.label"
          :variant="index === 0 ? 'primary' : 'secondary'"
          :title="item.label.toUpperCase()"
          :subtitle="'INDEX-' + (index + 1)"
          :status="'ACTIVE'"
          statusType="online"
          :animated="true"
          class="stat-mfd-panel"
          :style="{ animationDelay: `${index * 0.15}s` }"
        >
          <div class="stat-value-display">
            <span class="stat-number font-data">{{ item.value }}</span>
            <span class="stat-unit font-data">UNITS</span>
          </div>
        </MFDPanel>
      </div>
    </section>

    <!-- 任务概览仪表盘 -->
    <section class="dashboard-section" ref="dashboardRef">
      <div class="section-header" v-scroll-reveal="'fadeUp'">
        <span class="section-eyebrow font-data">// MISSION CONTROL</span>
        <h2 class="section-title font-tech">任务控制台</h2>
        <div class="section-line"></div>
      </div>

      <div class="dashboard-grid">
        <!-- 任务完成率环形图 -->
        <MFDPanel
          variant="primary"
          title="MISSION STATUS"
          subtitle="COMPLETION RATE"
          icon="◉"
          status="ACTIVE"
          statusType="online"
          :animated="true"
          class="dashboard-mfd"
          v-scroll-reveal="{ animation: 'fadeLeft', delay: 0.15 }"
        >
          <div class="ring-chart">
            <svg viewBox="0 0 120 120" class="ring-svg">
              <circle cx="60" cy="60" r="50" class="ring-bg" />
              <circle cx="60" cy="60" r="50" class="ring-fill" :style="missionRingStyle" />
              <circle cx="60" cy="60" r="38" class="ring-bg ring-bg--inner" />
              <circle cx="60" cy="60" r="38" class="ring-fill ring-fill--inner" :style="combatRingStyle" />
            </svg>
            <div class="ring-center">
              <span class="ring-value font-data">{{ missionRateDisplay }}%</span>
              <span class="ring-label font-data">MISSIONS</span>
            </div>
          </div>
          <div class="ring-legend">
            <div class="legend-item">
              <span class="legend-dot legend-dot--primary"></span>
              <span class="legend-text font-data">任务完成率 {{ missionRateDisplay }}%</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-dot--cyan"></span>
              <span class="legend-text font-data">战斗胜率 {{ combatRateDisplay }}%</span>
            </div>
          </div>
        </MFDPanel>

        <!-- 最新动态 -->
        <MFDPanel
          variant="secondary"
          title="LATEST INTEL"
          subtitle="FEED"
          icon="◈"
          status="LIVE"
          statusType="online"
          :scanlines="true"
          :collapsible="true"
          class="dashboard-mfd"
          v-scroll-reveal="{ animation: 'fadeUp', delay: 0.25 }"
        >
          <div class="intel-feed">
            <div
              v-for="(item, idx) in intelFeed"
              :key="idx"
              :class="['intel-item', `intel-item--${item.type}`]"
            >
              <span class="intel-time font-data">{{ item.time }}</span>
              <span class="intel-dot"></span>
              <span class="intel-text">{{ item.text }}</span>
            </div>
          </div>
        </MFDPanel>

        <!-- 在线成员 -->
        <MFDPanel
          variant="secondary"
          title="CREW STATUS"
          subtitle="ONLINE"
          icon="◈"
          status="CONNECTED"
          statusType="online"
          :animated="true"
          class="dashboard-mfd"
          v-scroll-reveal="{ animation: 'fadeRight', delay: 0.35 }"
        >
          <div class="crew-list">
            <div v-for="member in onlineCrew" :key="member.name" class="crew-item">
              <StatusIndicator type="online" :pulse="true" size="small" />
              <span class="crew-name font-data">{{ member.name }}</span>
              <span class="crew-role font-data">{{ member.role }}</span>
            </div>
          </div>
          <div class="crew-total font-data">
            <span class="crew-total-label">ONLINE</span>
            <span class="crew-total-value">{{ onlineCrew.length }} / {{ totalCrewCount }}</span>
          </div>
        </MFDPanel>
      </div>
    </section>

    <!-- 王牌飞行员展示区 - 全息投影风格 -->
    <section class="ace-section" ref="aceSectionRef">
      <div class="section-header" v-scroll-reveal="'fadeUp'">
        <span class="section-eyebrow font-data">// FEATURED</span>
        <h2 class="section-title font-tech">王牌飞行员</h2>
        <div class="section-line"></div>
      </div>

      <HoloCard
        :interactive="true"
        :tiltAmount="8"
        :glitchOnHover="true"
        glowColor="var(--amber-primary)"
        class="ace-holo-card"
        v-scroll-reveal="{ animation: 'scaleIn', delay: 0.2 }"
        @mouseenter="stopAutoRotate"
        @mouseleave="startAutoRotate"
      >
        <div class="ace-pilot">
          <!-- 左侧：飞行员图像 -->
          <div class="ace-media">
            <div class="ace-frame scan-overlay">
              <img :src="currentPilot.image" :alt="currentPilot.ship" />
              <div class="ace-overlay"></div>
              <div class="ace-scan-line"></div>
              <!-- 切换时的闪光效果 -->
              <div v-if="pilotTransitioning" class="ace-flash"></div>
            </div>
            <div class="ace-badge">
              <span class="ace-rank font-tech">ACE</span>
              <span class="ace-number font-data">#{{ currentPilotIndex + 1 }}</span>
            </div>
            <!-- 飞行员状态指示器 -->
            <div class="ace-status-bar">
              <span class="status-segment" v-for="n in 5" :key="n" :class="{ active: n <= 3 }"></span>
            </div>
          </div>

          <!-- 右侧：飞行员信息 -->
          <div class="ace-content">
            <div class="ace-header">
              <p class="eyebrow font-data">PILOT PROFILE // CLASSIFIED</p>
              <h3 class="ace-name font-tech">{{ currentPilot.name }}</h3>
              <p class="ace-callsign font-data">{{ currentPilot.callsign }}</p>
            </div>

            <div class="ace-info">
              <MFDPanel variant="secondary" title="SHIP DATA" icon="◈" class="ship-panel">
                <div class="ship-data">
                  <span class="info-label font-data">座驾</span>
                  <span class="info-value font-tech">{{ currentPilot.ship }}</span>
                </div>
                <p class="ace-desc">{{ currentPilot.description }}</p>
              </MFDPanel>
            </div>

            <!-- 飞行员数据条 -->
            <div class="ace-stats">
              <div class="ace-stat-item">
                <span class="stat-bar-label font-data">COMBAT</span>
                <div class="stat-bar">
                  <div class="stat-bar-fill" :style="{ width: `${85 + currentPilotIndex * 5}%` }"></div>
                </div>
                <span class="stat-bar-value font-data">{{ 85 + currentPilotIndex * 5 }}%</span>
              </div>
              <div class="ace-stat-item">
                <span class="stat-bar-label font-data">MOBILITY</span>
                <div class="stat-bar">
                  <div class="stat-bar-fill" :style="{ width: `${75 + currentPilotIndex * 8}%` }"></div>
                </div>
                <span class="stat-bar-value font-data">{{ 75 + currentPilotIndex * 8 }}%</span>
              </div>
              <div class="ace-stat-item">
                <span class="stat-bar-label font-data">TACTICS</span>
                <div class="stat-bar">
                  <div class="stat-bar-fill" :style="{ width: `${90 - currentPilotIndex * 3}%` }"></div>
                </div>
                <span class="stat-bar-value font-data">{{ 90 - currentPilotIndex * 3 }}%</span>
              </div>
            </div>

            <!-- 控制按钮 -->
            <div class="ace-controls">
              <TechButton variant="outline" size="small" @click="prevPilot">
                ← PREV
              </TechButton>
              <div class="pilot-dots">
                <button
                  v-for="(pilot, index) in acePilots"
                  :key="pilot.callsign"
                  type="button"
                  class="dot"
                  :class="{ active: index === currentPilotIndex }"
                  @click="selectPilot(index)"
                  :aria-label="`切换到 ${pilot.name}`"
                />
              </div>
              <TechButton variant="outline" size="small" @click="nextPilot">
                NEXT →
              </TechButton>
            </div>
          </div>
        </div>
      </HoloCard>
    </section>

    <!-- 飞船展示区 - 全息投影风格 -->
    <section class="fleet-showcase" ref="fleetShowcaseRef">
      <div class="section-header" v-scroll-reveal="'fadeUp'">
        <span class="section-eyebrow font-data">// FLEET</span>
        <h2 class="section-title font-tech">舰船展示</h2>
        <div class="section-line"></div>
      </div>

      <div class="fleet-gallery">
        <!-- 主展示舰船 -->
        <MFDPanel
          variant="primary"
          title="SHIP SPECIFICATIONS"
          subtitle="HOLOGRAPHIC DISPLAY"
          icon="◈"
          status="ONLINE"
          statusType="online"
          :scanlines="true"
          class="fleet-mfd-panel"
          v-scroll-reveal="{ animation: 'fadeLeft', delay: 0.2 }"
        >
          <div class="fleet-viewer">
            <!-- 飞船图像容器 -->
            <div
              class="ship-viewport"
              @mousemove="handleShipRotate"
              @mouseleave="resetShipRotate"
            >
              <div class="ship-model" :style="shipTransformStyle">
                <img
                  src="/images/sc/sc-constellation.jpg"
                  alt="Constellation"
                  class="ship-image"
                />
                    <!-- 扫描线 -->
                <div class="ship-scan"></div>
              </div>

              <!-- 引擎粒子拖尾 Canvas -->
              <canvas ref="engineCanvasRef" class="ship-engine-canvas"></canvas>

              <!-- 旋转指示器 -->
              <div class="rotate-hint font-data">
                <span>◄ DRAG TO ROTATE ►</span>
              </div>
            </div>

            <!-- 飞船数据 -->
            <div class="ship-specs">
              <div class="spec-item">
                <span class="spec-label font-data">MODEL</span>
                <span class="spec-value font-tech">CONSTELLATION ANDROMEDA</span>
              </div>
              <div class="spec-item">
                <span class="spec-label font-data">ROLE</span>
                <span class="spec-value font-tech">MULTI-ROLE EXPLORER</span>
              </div>
              <div class="spec-item">
                <span class="spec-label font-data">MAX SPEED</span>
                <span class="spec-value font-tech">1,050 M/S</span>
              </div>
              <div class="spec-item">
                <span class="spec-label font-data">SHIELD</span>
                <span class="spec-value font-tech">S3 x2</span>
              </div>
              <div class="spec-item">
                <span class="spec-label font-data">WEAPONS</span>
                <span class="spec-value font-tech">S5 x4 + S3 x2</span>
              </div>
            </div>
          </div>
        </MFDPanel>

        <!-- 舰船画廊 -->
        <div class="fleet-cards" v-scroll-reveal="{ animation: 'fadeRight', delay: 0.3 }">
          <ShipCard
            v-for="(ship, idx) in fleetShips"
            :key="idx"
            :ship="ship"
            :showStats="false"
            class="fleet-ship-card"
          />
        </div>
      </div>
    </section>

    <!-- 行动号召区域 - MFD风格 -->
    <section class="cta-section" ref="ctaSectionRef">
      <MFDPanel
        variant="alert"
        title="RECRUITMENT PROTOCOL"
        subtitle="PRIORITY: HIGH"
        icon="⚠"
        status="ACTIVE"
        statusType="warning"
        class="cta-mfd-panel"
        v-scroll-reveal="{ animation: 'scaleIn', delay: 0.15 }"
      >
        <div class="cta-content">
          <div class="cta-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 class="cta-title font-tech">准备好加入了吗？</h2>
          <p class="cta-desc">
            成为星际公民战队的一员，与志同道合的飞行员一起探索宇宙、执行任务、建立传奇。
          </p>
          <div class="cta-actions">
            <TechButton variant="primary" size="large" glow to="/join">
              <template #icon>→</template>
              开始申请
            </TechButton>
            <TechButton variant="ghost" size="large" to="/about">
              探索团队
            </TechButton>
          </div>
        </div>
      </MFDPanel>
    </section>
  </div>
</template>

<script setup>
/**
 * 首页视图组件
 * @description Stellar Nexus 星渊枢纽视觉系统 - 融合星云紫雾、星门启动、全息扫描
 * @version 5.0 - Stellar Nexus 版本
 */

import { computed, onBeforeUnmount, onMounted, ref, nextTick, watch } from 'vue'
import { dataService } from '@/services'
import { createLogger } from '../utils/logger.js'
import { useGSAPReveal } from '../composables/useGSAPReveal.js'
import { useParallax } from '../composables/useParallax.js'
import { useEffectQuality } from '../composables/useEffectQuality.js'
import gsap from 'gsap'

import StatusIndicator from '@/components/ui/StatusIndicator.vue'
import MFDPanel from '@/components/ui/MFDPanel.vue'
import HoloCard from '@/components/ui/HoloCard.vue'
import TechButton from '@/components/ui/TechButton.vue'
import DataDisplay from '@/components/ui/DataDisplay.vue'
import ShipCard from '@/components/ui/ShipCard.vue'

const logger = createLogger('Home')

/** ========== 视差效果 ========== */
const { addParallax } = useParallax()

/** ========== 效果质量检测 ========== */
const { shouldDisableCanvas, maxParticleCount } = useEffectQuality()

/** ========== 英雄区域 GSAP 入场序列控制 ========== */
const heroReady = ref(false)
const heroTimeline = ref(null)

/**
 * 初始化英雄区域 GSAP 入场序列
 * @description 编排星门展开 → 标题解码 → 内容渐入的完整入场动画
 *              使用 GSAP Timeline 精确控制各元素的出现时序和缓动
 */
function initHeroSequence() {
  const hero = heroRef.value
  if (!hero) return

  const tl = gsap.timeline({
    defaults: { ease: 'power2.out' },
    onComplete: () => { heroReady.value = true }
  })

  heroTimeline.value = tl

  tl.fromTo('.hero-badge', { opacity: 0, y: 20, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.6 }, 0.3)
    .fromTo('.title-main', { opacity: 0, y: 40, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, y: 0, clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'power3.out' }, 0.5)
    .fromTo('.title-divider', { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.8 }, 1.2)
    .fromTo('.title-sub', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, 1.5)
    .fromTo('.hero-desc', { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.7 }, 1.8)
    .fromTo('.hero-actions', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 2.1)
    .fromTo('.hero-status-bar', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5 }, 2.3)
    .fromTo('.scroll-indicator', { opacity: 0 }, { opacity: 0.6, duration: 0.5 }, 2.6)
    .fromTo('.mfd-corner', { opacity: 0, scale: 0.5 }, { opacity: 0.6, scale: 1, duration: 0.4, stagger: 0.08 }, 0.8)
}

/** ========== 仪表盘环形图递增动画 ========== */
const missionRateDisplay = ref(0)
const combatRateDisplay = ref(0)
const missionRate = ref(87)
const combatRate = ref(73)
const dashboardVisible = ref(false)

const missionRingStyle = computed(() => {
  const circumference = 2 * Math.PI * 50
  const offset = circumference * (1 - missionRateDisplay.value / 100)
  return { strokeDasharray: `${circumference}`, strokeDashoffset: `${offset}` }
})

const combatRingStyle = computed(() => {
  const circumference = 2 * Math.PI * 38
  const offset = circumference * (1 - combatRateDisplay.value / 100)
  return { strokeDasharray: `${circumference}`, strokeDashoffset: `${offset}` }
})

/**
 * 启动仪表盘数据递增动画
 * @description 当仪表盘区域进入视口时，环形图从0递增到目标值
 */
function animateDashboard() {
  if (dashboardVisible.value) return
  dashboardVisible.value = true

  gsap.to({ val: 0 }, {
    val: missionRate.value,
    duration: 2,
    ease: 'power2.out',
    onUpdate: function () {
      missionRateDisplay.value = Math.round(this.targets()[0].val)
    }
  })

  gsap.to({ val: 0 }, {
    val: combatRate.value,
    duration: 2.2,
    ease: 'power2.out',
    delay: 0.3,
    onUpdate: function () {
      combatRateDisplay.value = Math.round(this.targets()[0].val)
    }
  })
}

/** ========== 飞船展示区引擎粒子拖尾 ========== */
const engineCanvasRef = ref(null)
let engineCtx = null
let engineParticles = []
let engineAnimFrame = null

/**
 * 引擎粒子类
 * @description 模拟飞船引擎尾焰的粒子效果，包含位置、速度、生命周期和颜色
 */
class EngineParticle {
  constructor(x, y) {
    this.x = x
    this.y = y
    // 引擎尾焰：向下喷射，轻微左右扩散
    this.vx = (Math.random() - 0.5) * 1.5
    this.vy = Math.random() * 2 + 2
    this.life = 1
    this.decay = Math.random() * 0.015 + 0.01
    // 更大的粒子尺寸
    this.size = Math.random() * 4 + 2
    // 蓝白色调引擎尾焰
    this.hue = Math.random() > 0.3 ? 210 : 190
    this.lightness = Math.random() * 30 + 60
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.life -= this.decay
    // 粒子逐渐变小
    this.size *= 0.97
    // 尾焰扩散
    this.vx *= 1.02
  }

  draw(ctx) {
    if (this.life <= 0) return
    ctx.save()
    ctx.globalAlpha = this.life * 0.6
    // 核心亮白色
    ctx.fillStyle = `hsl(${this.hue}, 70%, ${this.lightness}%)`
    ctx.shadowColor = `hsl(${this.hue}, 80%, 70%)`
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

/**
 * 初始化引擎粒子 Canvas
 * @description 低端设备跳过 Canvas 初始化以节省性能
 */
function initEngineCanvas() {
  if (shouldDisableCanvas.value) return

  const canvas = engineCanvasRef.value
  if (!canvas) return

  const parent = canvas.parentElement
  canvas.width = parent.offsetWidth
  canvas.height = parent.offsetHeight
  engineCtx = canvas.getContext('2d')

  animateEngine()
}

/**
 * 引擎粒子动画循环
 */
function animateEngine() {
  if (!engineCtx) return

  const canvas = engineCanvasRef.value
  engineCtx.clearRect(0, 0, canvas.width, canvas.height)

  const centerX = canvas.width / 2
  const emitY = canvas.height * 0.88

  for (let i = 0; i < 2; i++) {
    engineParticles.push(new EngineParticle(
      centerX + (Math.random() - 0.5) * 30,
      emitY + (Math.random() - 0.5) * 10
    ))
  }

  engineParticles = engineParticles.filter(p => p.life > 0)
  engineParticles.forEach(p => {
    p.update()
    p.draw(engineCtx)
  })

  if (engineParticles.length > maxParticleCount.value) {
    engineParticles = engineParticles.slice(-Math.floor(maxParticleCount.value * 0.75))
  }

  engineAnimFrame = requestAnimationFrame(animateEngine)
}

/**
 * 清理引擎粒子动画
 */
function cleanupEngineCanvas() {
  if (engineAnimFrame) {
    cancelAnimationFrame(engineAnimFrame)
    engineAnimFrame = null
  }
  engineParticles = []
  engineCtx = null
}

/** 最新动态数据 */
const intelFeed = ref([
  { time: '14:32', text: 'Bengal 航母编队完成 Pyro 星域巡逻任务', type: 'mission' },
  { time: '13:15', text: '新飞行员 Viper-7 通过入队审核', type: 'recruit' },
  { time: '12:48', text: 'Buccaneer 中队击退 Vanduul 侦察队', type: 'combat' },
  { time: '11:20', text: 'Prospector 采矿船在 Daymar 发现稀有矿脉', type: 'discovery' },
  { time: '10:05', text: '组织资金池新增 2,400,000 UEC', type: 'economy' },
  { time: '09:30', text: 'Constellation 探索队发现未知跳跃点信号', type: 'discovery' },
])

/** 在线成员数据 */
const onlineCrew = ref([
  { name: 'GHOST-1', role: 'CMDR' },
  { name: 'VIPER-7', role: 'PILOT' },
  { name: 'HAWK-3', role: 'GUNNER' },
  { name: 'RAVEN-9', role: 'ENG' },
  { name: 'STORM-2', role: 'MEDIC' },
])

const totalCrewCount = ref(42)

/** ========== 实时时钟 ========== */
const currentTime = ref('')
let timeTimer = null

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
}

/** ========== 飞船展示旋转状态 ========== */
const shipRotateX = ref(0)
const shipRotateY = ref(0)

const shipTransformStyle = computed(() => ({
  transform: `
    perspective(1000px)
    rotateY(${shipRotateY.value}deg)
    rotateX(${-shipRotateX.value}deg)
    scale3d(1.1, 1.1, 1.1)
  `
}))

function handleShipRotate(e) {
  const el = e.currentTarget
  const rect = el.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5

  shipRotateY.value = x * 30 // 左右旋转范围
  shipRotateX.value = y * 15 // 上下旋转范围
}

function resetShipRotate() {
  shipRotateY.value = 0
  shipRotateX.value = 0
}

/** ========== 数据状态 ========== */

/** 团队统计数据 */
const teamStats = ref([])

/** 王牌飞行员数据 */
const acePilots = ref([])

/** 数据加载状态 */
const isLoading = ref(true)

/** 数据加载错误 */
const loadError = ref(null)

/** 当前选中的飞行员索引 */
const currentPilotIndex = ref(0)

/** 飞行员切换过渡状态 */
const pilotTransitioning = ref(false)

/** ========== DOM 引用 ========== */

/** 英雄区域 DOM 引用 */
const heroRef = ref(null)

/** 操作信息条 DOM 引用 */
const opsStripRef = ref(null)

/** 统计区域 DOM 引用 */
const statsSectionRef = ref(null)

/** 统计卡片 DOM 引用数组 */
const statCardRefs = ref([])

/** 飞行员区域 DOM 引用 */
const aceSectionRef = ref(null)

/** CTA 区域 DOM 引用 */
const ctaSectionRef = ref(null)

/** 仪表盘区域 DOM 引用 */
const dashboardRef = ref(null)

/** 仪表盘视口观察器 */
let dashboardObserver = null

/**
 * 初始化仪表盘视口观察器
 * @description 当仪表盘区域进入视口时触发环形图递增动画
 */
function initDashboardObserver() {
  const dashboard = dashboardRef.value
  if (!dashboard) return

  dashboardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateDashboard()
          dashboardObserver.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
  )

  dashboardObserver.observe(dashboard)
}

/** ========== GSAP 滚动揭示动画 ========== */

/** GSAP Reveal 实例，用于统计卡片交错动画 */
const gsapReveal = useGSAPReveal(({ stagger, countUp }) => {
  /** 统计卡片交错动画 */
  const statsGrid = document.querySelector('.stats-grid')
  if (statsGrid) {
    stagger(statsGrid, '.stat-mfd-panel', { animation: 'fadeUp', stagger: 0.12 })
  }

  /** 统计数字递增动画 */
  document.querySelectorAll('.stat-number').forEach(el => {
    const text = el.textContent.trim()
    const num = parseInt(text, 10)
    if (!isNaN(num) && num > 0) {
      countUp(el, { endValue: num, duration: 2, suffix: '' })
    }
  })
})

/** ========== 3D 视差效果状态 ========== */

/** 英雄区域 X 轴偏移量 */
const heroOffsetX = ref(0)

/** 英雄区域 Y 轴偏移量 */
const heroOffsetY = ref(0)

/** 鼠标移动动画帧 ID */
let pointerFrame = null

/** 待处理的 X 坐标 */
let pendingX = 0

/** 待处理的 Y 坐标 */
let pendingY = 0

/** ========== 自动轮播 ========== */

/** 自动轮播定时器 ID */
let rotateTimer = null

/** 飞行员切换过渡定时器 */
let transitionTimer = null

/** 当前飞行员信息（计算属性） */
const currentPilot = computed(() => acePilots.value[currentPilotIndex.value] || {})

/**
 * 设置统计卡片引用
 * @param {HTMLElement} el - DOM 元素
 * @param {number} index - 索引
 */
function setStatCardRef(el, index) {
  if (el) {
    statCardRefs.value[index] = el
  }
}

/**
 * 生成英雄区域粒子样式
 * @param {number} n - 粒子序号
 * @returns {Object} 粒子样式对象
 */
const getParticleStyle = (n) => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  animationDelay: `${Math.random() * 8}s`,
  animationDuration: `${4 + Math.random() * 6}s`,
  '--tx': `${(Math.random() - 0.5) * 200}px`,
  '--ty': `${(Math.random() - 0.5) * 200}px`,
  opacity: `${0.3 + Math.random() * 0.7}`
})

/**
 * 生成 CTA 区域粒子样式
 * @param {number} n - 粒子序号
 * @returns {Object} 粒子样式对象
 */
const getCtaParticleStyle = (n) => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  animationDelay: `${Math.random() * 6}s`,
  animationDuration: `${3 + Math.random() * 4}s`,
  '--tx': `${(Math.random() - 0.5) * 100}px`,
  '--ty': `${(Math.random() - 0.5) * 100}px`
})

/**
 * 加载页面数据
 */
async function loadData() {
  isLoading.value = true
  loadError.value = null

  try {
    const [statsResult, pilotsResult] = await Promise.all([
      dataService.getStats(),
      dataService.getPilots()
    ])

    teamStats.value = statsResult.stats || []
    acePilots.value = pilotsResult.data || []
  } catch (error) {
    logger.error('加载首页数据失败:', error)
    loadError.value = error.message
  } finally {
    isLoading.value = false
  }
}

/**
 * 选择指定索引的飞行员（带动画过渡）
 * @param {number} index - 飞行员索引
 */
const selectPilot = (index) => {
  if (index === currentPilotIndex.value) return

  // 触发过渡动画
  pilotTransitioning.value = true

  setTimeout(() => {
    currentPilotIndex.value = index

    // 清除过渡状态
    setTimeout(() => {
      pilotTransitioning.value = false
    }, 300)
  }, 200)
}

/**
 * 处理英雄区域鼠标移动
 * @description 实现 3D 视差效果，使用 requestAnimationFrame 优化性能
 * @param {MouseEvent} event - 鼠标事件
 */
const handleHeroMove = (event) => {
  if (window.matchMedia('(pointer: coarse)').matches) return

  const el = heroRef.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width - 0.5
  const y = (event.clientY - rect.top) / rect.height - 0.5

  pendingX = x * 8
  pendingY = y * 6

  if (pointerFrame !== null) return

  pointerFrame = window.requestAnimationFrame(() => {
    heroOffsetX.value = pendingX
    heroOffsetY.value = pendingY
    pointerFrame = null
  })
}

/**
 * 重置英雄区域位置
 * @description 鼠标离开时恢复初始状态
 */
const resetHeroMove = () => {
  heroOffsetX.value = 0
  heroOffsetY.value = 0
}

/** 英雄区域 3D 变换样式（计算属性） */
const heroTransformStyle = computed(() => ({
  transform: `perspective(1200px) rotateX(${-heroOffsetY.value}deg) rotateY(${heroOffsetX.value}deg)`
}))

/**
 * 切换到下一位飞行员
 */
const nextPilot = () => {
  if (acePilots.value.length === 0) return
  selectPilot((currentPilotIndex.value + 1) % acePilots.value.length)
}

/**
 * 切换到上一位飞行员
 */
const prevPilot = () => {
  if (acePilots.value.length === 0) return
  selectPilot((currentPilotIndex.value - 1 + acePilots.value.length) % acePilots.value.length)
}

/**
 * 启动自动轮播
 */
const startAutoRotate = () => {
  stopAutoRotate()
  rotateTimer = window.setInterval(() => {
    nextPilot()
  }, 6000)
}

/**
 * 停止自动轮播
 */
const stopAutoRotate = () => {
  if (rotateTimer !== null) {
    clearInterval(rotateTimer)
    rotateTimer = null
  }
}

/**
 * 初始化统计卡片的批量揭示动画
 */
function initStatCardAnimations() {
  nextTick(() => {
    statCardRefs.value.forEach((el, index) => {
      if (!el) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                el.classList.add('animated')
                el.classList.add('animate-hologram-reveal')
              }, index * 150)
              observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.15, rootMargin: '0px 0px -30px 0px' }
      )

      observer.observe(el)
    })
  })
}

/** 组件挂载时加载数据并启动动画 */
onMounted(async () => {
  await loadData()
  startAutoRotate()

  nextTick(() => {
    /** 初始化英雄区域 GSAP 入场序列 */
    initHeroSequence()

    /** 初始化统计卡片动画 */
    initStatCardAnimations()

    /** 初始化实时时钟 */
    updateTime()
    timeTimer = window.setInterval(updateTime, 1000)

    /** 初始化仪表盘区域视口观察器 */
    initDashboardObserver()

    /** 初始化引擎粒子 Canvas */
    initEngineCanvas()

    /** 初始化英雄区域视差效果 */
    if (heroRef.value) {
      addParallax(heroRef.value, { speed: 0.15, ease: 0.08 })
    }
  })
})

/** 组件卸载时清理资源 */
onBeforeUnmount(() => {
  stopAutoRotate()
  if (transitionTimer) {
    clearTimeout(transitionTimer)
  }
  if (pointerFrame !== null) {
    cancelAnimationFrame(pointerFrame)
    pointerFrame = null
  }
  if (timeTimer) {
    clearInterval(timeTimer)
    timeTimer = null
  }
  if (heroTimeline.value) {
    heroTimeline.value.kill()
    heroTimeline.value = null
  }
  cleanupEngineCanvas()
  if (dashboardObserver) {
    dashboardObserver.disconnect()
    dashboardObserver = null
  }
})

/** ========== 舰船画廊数据 ========== */
const fleetShips = ref([
  { name: 'BENGAL', role: 'CARRIER', image: '/images/sc/sc-bengal.jpg', category: 'combat' },
  { name: 'BUCCANEER', role: 'FIGHTER', image: '/images/sc/sc-buccaneer.jpg', category: 'combat' },
  { name: 'CONSTELLATION', role: 'EXPLORER', image: '/images/sc/sc-constellation.jpg', category: 'exploration' },
  { name: 'PROSPECTOR', role: 'MINING', image: '/images/sc/sc-spaceship-4k.jpg', category: 'mining' },
])
</script>

<style scoped>
/* ========== 页面容器 ========== */
.home-page {
  position: relative;
}

/* ========== 英雄区域 - Stellar Nexus 风格 ========== */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 6rem 2rem 3rem;
  margin: -2rem -1.5rem 0;
  width: calc(100% + 3rem);
  transition: transform 0.3s ease;
  will-change: transform;
}

/* 星云背景层 */
.hero-nebulae {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.nebula-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  animation: nebula-drift 20s ease-in-out infinite;
}

.nebula-blob--purple {
  width: 60vw;
  height: 60vw;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.15), transparent 70%);
  top: -20%;
  left: -10%;
  animation-delay: 0s;
}

.nebula-blob--cyan {
  width: 50vw;
  height: 50vw;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.1), transparent 70%);
  bottom: -15%;
  right: -10%;
  animation-delay: -7s;
}

.nebula-blob--amber {
  width: 35vw;
  height: 35vw;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.08), transparent 70%);
  top: 40%;
  left: 35%;
  animation-delay: -14s;
}

/* 星际公民背景图 */
.hero-bg-image {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.hero-bg-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.25;
  filter: saturate(0.6) brightness(0.5);
  mix-blend-mode: screen;
}

.hero-bg-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, var(--void-deepest) 70%),
    linear-gradient(180deg, rgba(6, 11, 20, 0.3) 0%, rgba(6, 11, 20, 0.8) 100%);
}

/* 星门光环 */
.star-gate {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80vmin;
  height: 80vmin;
  pointer-events: none;
  z-index: 1;
}

.gate-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 1px solid rgba(124, 58, 237, 0.3);
  animation: gate-expand 3s ease-out forwards;
  transform-origin: center;
}

.gate-ring:nth-child(2) {
  animation-delay: 0.3s;
  border-color: rgba(6, 182, 212, 0.2);
}

.gate-ring:nth-child(3) {
  animation-delay: 0.6s;
  border-color: rgba(245, 158, 11, 0.15);
}

.gate-spin {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60%;
  height: 60%;
  border-radius: 50%;
  border: 1px dashed rgba(124, 58, 237, 0.15);
  animation: gate-rotate 30s linear infinite;
}

.gate-spin--reverse {
  width: 45%;
  height: 45%;
  border-color: rgba(6, 182, 212, 0.1);
  animation-direction: reverse;
  animation-duration: 25s;
}

/* 浮动粒子 */
.hero-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.hero-particle {
  position: absolute;
  width: 3px;
  height: 3px;
  background: var(--nebula-violet);
  border-radius: 50%;
  animation: float-particle 8s ease-in-out infinite;
  box-shadow: 0 0 6px var(--nebula-glow);
}

/* 全息扫描线 */
.hero-scan-line {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(124, 58, 237, 0.03) 50%,
    transparent 100%
  );
  animation: scan-line-vertical 4s linear infinite;
  pointer-events: none;
  z-index: 2;
}

/* MFD风格角落装饰 */
.mfd-corner {
  position: absolute;
  width: 40px;
  height: 40px;
  border-color: var(--nebula-purple);
  border-style: solid;
  opacity: 0.6;
  transition: opacity var(--duration-normal);
  z-index: 3;
}

.hero:hover .mfd-corner {
  opacity: 0.9;
}

.mfd-corner--tl {
  top: 16px;
  left: 16px;
  border-width: 2px 0 0 2px;
}

.mfd-corner--tr {
  top: 16px;
  right: 16px;
  border-width: 2px 2px 0 0;
}

.mfd-corner--bl {
  bottom: 16px;
  left: 16px;
  border-width: 0 0 2px 2px;
}

.mfd-corner--br {
  bottom: 16px;
  right: 16px;
  border-width: 0 2px 2px 0;
}

.corner-id,
.corner-status {
  position: absolute;
  font-size: 0.6rem;
  letter-spacing: 0.15em;
  opacity: 0.8;
}

.corner-id {
  top: -20px;
  left: 0;
  color: var(--nebula-purple);
}

.corner-status {
  top: -20px;
  right: 0;
  color: var(--status-online);
}

/* 系统状态栏 */
.hero-status-bar {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0.5rem 1rem;
  background: rgba(12, 20, 36, 0.85);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  backdrop-filter: blur(20px) saturate(150%);
  z-index: 3;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.75rem;
}

.status-label {
  color: var(--text-muted);
  font-size: 0.6rem;
  letter-spacing: 0.15em;
  margin-right: 0.5rem;
}

.status-value {
  color: var(--nebula-violet);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.status-divider {
  width: 1px;
  height: 20px;
  background: var(--border-medium);
}

/* 英雄区域内容 */
.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 750px;
  padding: 2rem;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1.25rem;
  background: rgba(124, 58, 237, 0.08);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: var(--radius-sm);
  margin-bottom: 1.5rem;
  backdrop-filter: blur(10px);
}

.badge-icon {
  color: var(--nebula-purple);
  font-size: 0.6rem;
  animation: breathe 2s ease-in-out infinite;
}

.badge-text {
  color: var(--nebula-violet);
  text-transform: uppercase;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.2em;
}

.hero-title {
  margin: 0 0 1.25rem;
  line-height: 1.15;
}

.title-main {
  display: block;
  font-size: clamp(2.8rem, 7vw, 5rem);
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #ffffff 0%, var(--nebula-mist) 40%, var(--nebula-violet) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 30px var(--nebula-glow));
}

.title-divider {
  display: block;
  width: 120px;
  height: 2px;
  margin: 1rem auto;
  background: linear-gradient(90deg, transparent, var(--nebula-purple), var(--nebula-violet), transparent);
  transform-origin: center;
}

.title-sub {
  display: block;
  font-size: clamp(1.2rem, 3vw, 2rem);
  font-weight: 400;
  letter-spacing: 0.25em;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.hero-desc {
  max-width: 540px;
  margin: 0 auto 2rem;
  color: var(--text-secondary);
  font-size: 1.05rem;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
}

.btn-lg {
  padding: 0.85rem 2rem;
  font-size: 0.85rem;
}

.btn-glow {
  position: relative;
}

.btn-glow::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, var(--nebula-purple), var(--nebula-violet));
  border-radius: inherit;
  opacity: 0;
  filter: blur(15px);
  transition: opacity var(--duration-normal);
  z-index: -1;
}

.btn-glow:hover::before {
  opacity: 0.6;
}

.btn-arrow {
  margin-left: 0.5rem;
  transition: transform var(--duration-fast);
}

.btn-primary:hover .btn-arrow {
  transform: translateX(4px);
}

/* 滚动指示器 */
.scroll-indicator {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  z-index: 3;
}

.scroll-text {
  font-size: 0.65rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.scroll-line {
  width: 1px;
  height: 40px;
  background: linear-gradient(180deg, var(--nebula-purple), transparent);
  animation: breathe 2s ease-in-out infinite;
}

/* ========== 操作信息条 ========== */
.ops-strip {
  margin-top: 2rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
  padding: 1rem 1.5rem;
  background: rgba(12, 20, 36, 0.6);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  backdrop-filter: blur(20px) saturate(150%);
}

.ops-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0 1.5rem;
}

.ops-label {
  color: var(--text-muted);
  text-transform: uppercase;
  font-size: 0.65rem;
  letter-spacing: 0.15em;
}

.ops-value {
  color: var(--nebula-violet);
  text-transform: uppercase;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.ops-value-live {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--status-online);
}

.live-dot {
  width: 8px;
  height: 8px;
  background: var(--status-online);
  border-radius: 50%;
  animation: breathe 2s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
}

.ops-divider {
  width: 1px;
  height: 35px;
  background: var(--border-medium);
}

/* ========== 统计区域 ========== */
.stats-section {
  margin-top: 4rem;
}

.section-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  text-align: center;
}

.section-eyebrow {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--nebula-purple);
}

.section-title {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-primary);
}

.section-line {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--nebula-purple), var(--nebula-violet), transparent);
  margin-top: 0.5rem;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  background: rgba(12, 20, 36, 0.6);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  backdrop-filter: blur(20px);
}

.stat-card:hover {
  transform: translateY(-4px);
  border-color: var(--nebula-purple);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3), 0 0 20px var(--nebula-glow);
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: var(--radius-sm);
  color: var(--nebula-purple);
  flex-shrink: 0;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  margin: 0 0 0.25rem;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.02em;
}

.stat-label {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.stat-glow {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.08), transparent 70%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover .stat-glow {
  opacity: 1;
}

.card-corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: rgba(124, 58, 237, 0.3);
  border-style: solid;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover .card-corner {
  opacity: 1;
}

.card-corner-tl {
  top: 8px;
  left: 8px;
  border-width: 1px 0 0 1px;
}

.card-corner-br {
  bottom: 8px;
  right: 8px;
  border-width: 0 1px 1px 0;
}

/* ========== 任务控制台仪表盘 ========== */
.dashboard-section {
  margin-top: 5rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1.5rem;
}

.dashboard-mfd {
  height: 100%;
}

/* 环形图 */
.ring-chart {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-4) 0;
}

.ring-svg {
  width: 140px;
  height: 140px;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.06);
  stroke-width: 6;
}

.ring-bg--inner {
  stroke-width: 4;
}

.ring-fill {
  fill: none;
  stroke: var(--amber-primary);
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.ring-fill--inner {
  stroke: var(--data-flow);
  stroke-width: 4;
}

.ring-center {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.ring-value {
  font-size: var(--text-2xl);
  color: var(--text-primary);
  font-weight: 700;
}

.ring-label {
  font-size: 0.55rem;
  color: var(--text-muted);
  letter-spacing: 0.15em;
}

.ring-legend {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0 var(--space-4) var(--space-3);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot--primary {
  background: var(--amber-primary);
  box-shadow: 0 0 6px var(--amber-primary);
}

.legend-dot--cyan {
  background: var(--data-flow);
  box-shadow: 0 0 6px var(--data-flow);
}

.legend-text {
  font-size: 0.7rem;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
}

/* 最新动态 */
.intel-feed {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.intel-item {
  display: grid;
  grid-template-columns: 44px 12px 1fr;
  align-items: start;
  gap: var(--space-2);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border-subtle);
}

.intel-item:last-child {
  border-bottom: none;
}

.intel-time {
  font-size: 0.6rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.intel-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
  margin-top: 4px;
}

.intel-item--mission .intel-dot { background: var(--amber-primary); box-shadow: 0 0 4px var(--amber-primary); }
.intel-item--combat .intel-dot { background: var(--status-danger); box-shadow: 0 0 4px var(--status-danger); }
.intel-item--discovery .intel-dot { background: var(--nebula-purple); box-shadow: 0 0 4px var(--nebula-purple); }
.intel-item--recruit .intel-dot { background: var(--status-success); box-shadow: 0 0 4px var(--status-success); }
.intel-item--economy .intel-dot { background: var(--data-flow); box-shadow: 0 0 4px var(--data-flow); }

.intel-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* 在线成员 */
.crew-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.crew-item {
  display: grid;
  grid-template-columns: 20px 1fr auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
}

.crew-name {
  font-size: 0.8rem;
  color: var(--text-primary);
  letter-spacing: 0.05em;
}

.crew-role {
  font-size: 0.6rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.crew-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-3);
  margin-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
}

.crew-total-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.crew-total-value {
  font-size: 0.85rem;
  color: var(--data-flow);
  font-weight: 600;
}

/* ========== 王牌飞行员区域 ========== */
.ace-section {
  margin-top: 5rem;
}

.section-badge {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  background: rgba(124, 58, 237, 0.9);
  color: var(--void-deepest);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  border-radius: var(--radius-sm);
}

.ace-pilot {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
  padding: 2rem;
  background: rgba(12, 20, 36, 0.6);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.ace-media {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.ace-frame {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.ace-frame img {
  width: 100%;
  height: 100%;
  min-height: 320px;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.ace-pilot:hover .ace-frame img {
  transform: scale(1.03);
}

.ace-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(6, 11, 20, 0.9) 100%);
  pointer-events: none;
}

.ace-scan-line {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(124, 58, 237, 0.03) 50%,
    transparent 100%
  );
  animation: scan-line-vertical 3s linear infinite;
  pointer-events: none;
}

/* 切换闪光效果 */
.ace-flash {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.2);
  animation: fadeIn 0.2s ease forwards;
  pointer-events: none;
}

.ace-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: rgba(6, 11, 20, 0.8);
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: var(--radius-sm);
  backdrop-filter: blur(10px);
}

.ace-rank {
  padding: 0.2rem 0.5rem;
  background: var(--nebula-purple);
  color: var(--void-deepest);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  border-radius: 2px;
}

.ace-number {
  color: var(--nebula-violet);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.ace-hologram-effect {
  position: absolute;
  inset: -2px;
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: var(--radius-md);
  opacity: 0;
  transition: opacity var(--duration-normal);
  pointer-events: none;
  box-shadow: 0 0 15px var(--nebula-glow);
}

.ace-pilot:hover .ace-hologram-effect {
  opacity: 1;
  animation: hologramFlicker 3s ease-in-out infinite;
}

/* 飞行员状态指示器 */
.ace-status-bar {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  gap: 4px;
}

.status-segment {
  flex: 1;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  transition: background 0.3s ease;
}

.status-segment.active {
  background: var(--nebula-purple);
  box-shadow: 0 0 8px var(--nebula-glow);
}

.ace-content {
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.ace-header {
  margin-bottom: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border-medium);
}

.eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--nebula-purple);
}

.ace-name {
  margin: 0.5rem 0;
  font-size: 1.6rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--text-primary);
}

.ace-callsign {
  margin: 0;
  color: var(--nebula-violet);
  font-size: 0.9rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.ace-info {
  flex: 1;
}

.ace-ship {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.info-label {
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.info-value {
  color: var(--text-primary);
  font-weight: 500;
}

.ace-desc {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

/* 飞行员数据条 */
.ace-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.25rem 0;
  padding: 1rem;
  background: rgba(10, 20, 35, 0.4);
  border: 1px solid rgba(143, 215, 255, 0.1);
  border-radius: var(--radius-sm);
}

.ace-stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-bar-label {
  width: 40px;
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.stat-bar {
  flex: 1;
  height: 4px;
  background: rgba(143, 215, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--nebula-purple), var(--nebula-violet));
  border-radius: 2px;
  transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 0 10px var(--nebula-glow);
}

.ace-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-medium);
}

.pilot-dots {
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid var(--border-medium);
  background: transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;
}

.dot:hover {
  border-color: var(--nebula-purple);
  background: rgba(124, 58, 237, 0.2);
}

.dot.active {
  background: var(--nebula-purple);
  border-color: var(--nebula-purple);
  box-shadow: 0 0 10px var(--nebula-glow);
}

/* ========== CTA 区域 ========== */
.cta-section {
  position: relative;
  margin-top: 5rem;
  padding: 4rem 2rem;
  text-align: center;
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: var(--radius-md);
  background:
    radial-gradient(ellipse 70% 50% at 50% 0%, rgba(124, 58, 237, 0.1), transparent),
    linear-gradient(180deg, rgba(12, 20, 36, 0.9), rgba(6, 11, 20, 0.95));
  overflow: hidden;
}

.cta-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.cta-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 300px;
  background: radial-gradient(ellipse, rgba(124, 58, 237, 0.15), transparent 70%);
  filter: blur(60px);
}

/* CTA 粒子效果 */
.cta-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.cta-particles span {
  position: absolute;
  width: 2px;
  height: 2px;
  background: rgba(143, 215, 255, 0.4);
  border-radius: 50%;
  animation: particle 5s linear infinite;
  opacity: 0;
}

.cta-content {
  position: relative;
  z-index: 1;
  max-width: 600px;
  margin: 0 auto;
}

.cta-title {
  margin: 0 0 1rem;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #ffffff 0%, var(--nebula-mist) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cta-desc {
  margin: 0 0 2rem;
  color: var(--text-secondary);
  font-size: 1.05rem;
  line-height: 1.7;
}

.cta-corner {
  position: absolute;
  width: 25px;
  height: 25px;
  border-color: rgba(124, 58, 237, 0.3);
  border-style: solid;
}

.cta-corner-tl {
  top: 10px;
  left: 10px;
  border-width: 2px 0 0 2px;
}

.cta-corner-tr {
  top: 10px;
  right: 10px;
  border-width: 2px 2px 0 0;
}

.cta-corner-bl {
  bottom: 10px;
  left: 10px;
  border-width: 0 0 2px 2px;
}

.cta-corner-br {
  bottom: 10px;
  right: 10px;
  border-width: 0 2px 2px 0;
}

/* ========== 飞船展示区 ========== */
.fleet-showcase {
  margin-top: 5rem;
}

.fleet-gallery {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.fleet-mfd-panel {
  overflow: visible;
}

.fleet-viewer {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  padding: 1rem;
}

.ship-viewport {
  position: relative;
  min-height: 400px;
  background: radial-gradient(ellipse at center, rgba(124, 58, 237, 0.05), transparent 70%);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ship-viewport:active {
  cursor: grabbing;
}

.ship-model {
  position: relative;
  transition: transform 0.1s ease-out;
  will-change: transform;
}

.ship-image {
  max-width: 100%;
  height: auto;
  max-height: 350px;
  object-fit: contain;
  filter: drop-shadow(0 0 30px var(--nebula-glow));
}

.ship-scan {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(124, 58, 237, 0.03) 50%,
    transparent 100%
  );
  animation: scan-line-vertical 4s linear infinite;
  pointer-events: none;
}

/* 引擎粒子拖尾 Canvas */
.ship-engine-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
  mix-blend-mode: screen;
}

.rotate-hint {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  color: var(--text-muted);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  opacity: 0.6;
  pointer-events: none;
}

.ship-specs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.spec-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: rgba(12, 20, 36, 0.6);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast);
}

.spec-item:hover {
  border-color: var(--nebula-purple);
  background: rgba(124, 58, 237, 0.05);
}

.spec-label {
  color: var(--text-muted);
  font-size: 0.65rem;
  letter-spacing: 0.15em;
}

.spec-value {
  color: var(--nebula-violet);
  font-size: 0.9rem;
  letter-spacing: 0.05em;
}

/* 舰船画廊卡片 */
.fleet-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}

.fleet-ship-card {
  height: 100%;
}

/* ========== 统计区域新样式 ========== */
.stat-value-display {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 1rem 0;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.02em;
  line-height: 1;
}

.stat-unit {
  font-size: 0.75rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

/* ========== 操作信息条新样式 ========== */
.ops-mfd-panel {
  width: 100%;
}

.ops-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  padding: 0.5rem 0;
}

/* ========== CTA区域新样式 ========== */
.cta-mfd-panel {
  width: 100%;
}

.cta-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(124, 58, 237, 0.1);
  border: 1px solid var(--border-medium);
  border-radius: 50%;
  color: var(--nebula-purple);
}

.cta-icon svg {
  width: 32px;
  height: 32px;
}

.cta-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

/* ========== 响应式布局 ========== */
@media (max-width: 768px) {
  .hero {
    min-height: 90vh;
    padding: 1.5rem;
    margin: -1rem -1rem 0;
    width: calc(100% + 2rem);
  }

  .hero-content {
    padding: 1rem;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .hero-status-bar {
    display: none;
  }

  .btn-lg {
    width: 100%;
    max-width: 280px;
  }

  .ops-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .ace-pilot {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .ace-frame img {
    min-height: 240px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .fleet-viewer {
    grid-template-columns: 1fr;
  }

  .fleet-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .ship-viewport {
    min-height: 280px;
  }

  .cta-section {
    padding: 3rem 1.5rem;
  }

  .cta-actions {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .hero-badge {
    padding: 0.4rem 0.8rem;
  }

  .badge-text {
    font-size: 0.6rem;
  }

  .ops-grid {
    grid-template-columns: 1fr;
  }

  .ace-controls {
    flex-wrap: wrap;
    justify-content: center;
  }

  .ace-stats {
    padding: 0.75rem;
  }

  .ship-specs {
    gap: 0.5rem;
  }

  .spec-item {
    padding: 0.5rem;
  }
}
</style>
