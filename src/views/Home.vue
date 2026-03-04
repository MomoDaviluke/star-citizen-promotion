<template>
  <section
    ref="heroRef"
    class="hero"
    :style="heroTransformStyle"
    @mousemove="handleHeroMove"
    @mouseleave="resetHeroMove"
  >
    <div class="hero-bg">
      <div class="hero-grid"></div>
      <div class="hero-glow hero-glow-1"></div>
      <div class="hero-glow hero-glow-2"></div>
      <div class="hero-lines">
        <span></span><span></span><span></span>
      </div>
    </div>
    <div class="hero-content">
      <div class="hero-badge">
        <span class="badge-icon">◆</span>
        <span class="badge-text">UEE STYLE ORGANIZATION PORTAL</span>
        <span class="badge-icon">◆</span>
      </div>
      <h1 class="hero-title">
        <span class="title-line">星际公民战队</span>
        <span class="title-divider"></span>
        <span class="title-sub">官方招募站</span>
      </h1>
      <p class="hero-desc">
        面向星际公民玩家的团队门户，支持展示组织定位、核心成员、活动任务与招募信息。
      </p>
      <div class="hero-actions">
        <RouterLink to="/about" class="btn btn-primary btn-lg">
          <span class="btn-text">开始探索</span>
          <span class="btn-arrow">→</span>
        </RouterLink>
        <a
          class="btn btn-outline btn-lg"
          href="https://robertsspaceindustries.com/"
          target="_blank"
          rel="noopener"
        >
          <span class="btn-text">官方网站</span>
        </a>
      </div>
    </div>
    <div class="hero-corner hero-corner-tl"></div>
    <div class="hero-corner hero-corner-tr"></div>
    <div class="hero-corner hero-corner-bl"></div>
    <div class="hero-corner hero-corner-br"></div>
  </section>

  <section class="ops-strip">
    <div class="ops-item">
      <span class="ops-label">stardate</span>
      <span class="ops-value">2956.03</span>
    </div>
    <div class="ops-divider"></div>
    <div class="ops-item">
      <span class="ops-label">sector</span>
      <span class="ops-value">pyro fringe</span>
    </div>
    <div class="ops-divider"></div>
    <div class="ops-item">
      <span class="ops-label">operation id</span>
      <span class="ops-value">f8c-alpha</span>
    </div>
  </section>

  <section class="stats grid">
    <article class="card stat-card" v-for="(item, index) in teamStats" :key="item.label" :style="{ animationDelay: `${index * 0.1}s` }">
      <div class="stat-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path v-if="index === 0" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          <path v-else-if="index === 1" d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
          <path v-else d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div class="stat-content">
        <h3 class="stat-value">{{ item.value }}</h3>
        <p class="stat-label">{{ item.label }}</p>
      </div>
    </article>
  </section>

  <section class="ace-section">
    <div class="section-header">
      <div class="section-badge">FEATURED</div>
      <h2 class="section-title">王牌飞行员</h2>
    </div>
    
    <div class="ace-pilot" @mouseenter="stopAutoRotate" @mouseleave="startAutoRotate">
      <div class="ace-media">
        <div class="ace-frame">
          <img :src="currentPilot.image" :alt="currentPilot.ship" />
          <div class="ace-overlay"></div>
        </div>
        <div class="ace-badge">
          <span class="ace-rank">ACE</span>
          <span class="ace-number">#{{ currentPilotIndex + 1 }}</span>
        </div>
      </div>
      <div class="ace-content">
        <div class="ace-header">
          <p class="eyebrow">PILOT PROFILE</p>
          <h3 class="ace-name">{{ currentPilot.name }}</h3>
          <p class="ace-callsign">{{ currentPilot.callsign }}</p>
        </div>
        <div class="ace-info">
          <div class="ace-ship">
            <span class="info-label">座驾</span>
            <span class="info-value">{{ currentPilot.ship }}</span>
          </div>
          <p class="ace-desc">{{ currentPilot.description }}</p>
        </div>
        <div class="ace-controls">
          <button type="button" class="btn btn-nav" @click="prevPilot">
            <span>←</span> 上一位
          </button>
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
          <button type="button" class="btn btn-nav" @click="nextPilot">
            下一位 <span>→</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { acePilots, teamStats } from '@/data/siteContent'

const currentPilotIndex = ref(0)
const heroRef = ref(null)
const heroOffsetX = ref(0)
const heroOffsetY = ref(0)
let pointerFrame = null
let pendingX = 0
let pendingY = 0
let rotateTimer = null

const currentPilot = computed(() => acePilots[currentPilotIndex.value])

const selectPilot = (index) => {
  currentPilotIndex.value = index
}

const handleHeroMove = (event) => {
  if (window.matchMedia('(pointer: coarse)').matches) return

  const el = heroRef.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width - 0.5
  const y = (event.clientY - rect.top) / rect.height - 0.5

  pendingX = x * 6
  pendingY = y * 4

  if (pointerFrame !== null) return

  pointerFrame = window.requestAnimationFrame(() => {
    heroOffsetX.value = pendingX
    heroOffsetY.value = pendingY
    pointerFrame = null
  })
}

const resetHeroMove = () => {
  heroOffsetX.value = 0
  heroOffsetY.value = 0
}

const heroTransformStyle = computed(() => ({
  transform: `perspective(1000px) rotateX(${-heroOffsetY.value}deg) rotateY(${heroOffsetX.value}deg)`
}))

const nextPilot = () => {
  currentPilotIndex.value = (currentPilotIndex.value + 1) % acePilots.length
}

const prevPilot = () => {
  currentPilotIndex.value = (currentPilotIndex.value - 1 + acePilots.length) % acePilots.length
}

const startAutoRotate = () => {
  stopAutoRotate()
  rotateTimer = window.setInterval(() => {
    nextPilot()
  }, 6000)
}

const stopAutoRotate = () => {
  if (rotateTimer !== null) {
    clearInterval(rotateTimer)
    rotateTimer = null
  }
}

onMounted(() => {
  startAutoRotate()
})

onBeforeUnmount(() => {
  stopAutoRotate()
  if (pointerFrame !== null) {
    cancelAnimationFrame(pointerFrame)
    pointerFrame = null
  }
})
</script>

<style scoped>
.hero {
  position: relative;
  padding: 3rem 2.5rem;
  border: 1px solid rgba(143, 215, 255, 0.25);
  border-radius: 4px;
  background: linear-gradient(135deg, rgba(10, 20, 35, 0.9), rgba(5, 12, 25, 0.95));
  box-shadow: var(--glow);
  overflow: hidden;
  transition: transform 0.2s ease;
  will-change: transform;
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.hero-grid {
  position: absolute;
  inset: 0;
  opacity: 0.15;
  background-image:
    linear-gradient(rgba(143, 215, 255, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(143, 215, 255, 0.3) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent);
}

.hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  animation: float 12s ease-in-out infinite;
}

.hero-glow-1 {
  width: 400px;
  height: 400px;
  left: -100px;
  top: -150px;
  background: radial-gradient(circle, rgba(95, 169, 255, 0.25), transparent 70%);
}

.hero-glow-2 {
  width: 300px;
  height: 300px;
  right: -50px;
  bottom: -100px;
  background: radial-gradient(circle, rgba(143, 215, 255, 0.2), transparent 70%);
  animation-delay: -6s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(30px, 20px) scale(1.1);
  }
}

.hero-lines {
  position: absolute;
  inset: 0;
}

.hero-lines span {
  position: absolute;
  background: linear-gradient(90deg, transparent, rgba(143, 215, 255, 0.3), transparent);
  height: 1px;
  width: 100%;
  animation: scanLine 4s linear infinite;
}

.hero-lines span:nth-child(1) { top: 20%; animation-delay: 0s; }
.hero-lines span:nth-child(2) { top: 50%; animation-delay: -1.3s; }
.hero-lines span:nth-child(3) { top: 80%; animation-delay: -2.6s; }

@keyframes scanLine {
  0% {
    opacity: 0;
    transform: translateX(-100%);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(100%);
  }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 1rem;
  background: rgba(95, 169, 255, 0.1);
  border: 1px solid rgba(143, 215, 255, 0.3);
  border-radius: 2px;
  margin-bottom: 1.25rem;
}

.badge-icon {
  color: var(--accent-2);
  font-size: 0.6rem;
  animation: pulse 2s ease-in-out infinite;
}

.badge-text {
  color: var(--accent-2);
  text-transform: uppercase;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.2em;
}

.hero-title {
  margin: 0 0 1rem;
  line-height: 1.2;
}

.title-line {
  display: block;
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #ffffff 0%, var(--accent-2) 50%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-divider {
  display: block;
  width: 80px;
  height: 2px;
  margin: 0.75rem 0;
  background: linear-gradient(90deg, var(--accent-2), transparent);
}

.title-sub {
  display: block;
  font-size: clamp(1.2rem, 3vw, 1.8rem);
  font-weight: 400;
  letter-spacing: 0.15em;
  color: var(--text-muted);
  text-transform: uppercase;
}

.hero-desc {
  max-width: 500px;
  margin: 0 0 1.5rem;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 0.8rem;
}

.btn-outline {
  border-color: rgba(143, 215, 255, 0.4);
  background: rgba(95, 169, 255, 0.05);
}

.btn-outline:hover {
  border-color: var(--accent);
  background: rgba(95, 169, 255, 0.15);
}

.btn-arrow {
  margin-left: 0.5rem;
  transition: transform var(--transition-fast);
}

.btn-primary:hover .btn-arrow {
  transform: translateX(4px);
}

.hero-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: var(--accent-2);
  border-style: solid;
  opacity: 0.6;
}

.hero-corner-tl {
  top: 8px;
  left: 8px;
  border-width: 2px 0 0 2px;
}

.hero-corner-tr {
  top: 8px;
  right: 8px;
  border-width: 2px 2px 0 0;
}

.hero-corner-bl {
  bottom: 8px;
  left: 8px;
  border-width: 0 0 2px 2px;
}

.hero-corner-br {
  bottom: 8px;
  right: 8px;
  border-width: 0 2px 2px 0;
}

.ops-strip {
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
  padding: 0.75rem 1rem;
  background: rgba(10, 20, 35, 0.6);
  border: 1px solid var(--line);
  border-radius: 4px;
}

.ops-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0 1.25rem;
}

.ops-label {
  color: var(--text-muted);
  text-transform: uppercase;
  font-size: 0.6rem;
  letter-spacing: 0.15em;
}

.ops-value {
  color: var(--accent-2);
  text-transform: uppercase;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.ops-divider {
  width: 1px;
  height: 30px;
  background: var(--line);
}

.stats {
  margin-top: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: fadeInUp 0.6s ease both;
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(95, 169, 255, 0.1);
  border: 1px solid rgba(143, 215, 255, 0.2);
  border-radius: 4px;
  color: var(--accent-2);
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-value {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.02em;
}

.stat-label {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.ace-section {
  margin-top: 2.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.section-badge {
  padding: 0.3rem 0.75rem;
  background: var(--accent);
  color: #030810;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  border-radius: 2px;
}

.section-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ace-pilot {
  display: grid;
  grid-template-columns: minmax(300px, 1.2fr) minmax(300px, 1fr);
  gap: 2rem;
  padding: 1.5rem;
  background: linear-gradient(165deg, rgba(15, 30, 50, 0.8), rgba(8, 18, 32, 0.9));
  border: 1px solid var(--line);
  border-radius: 4px;
  animation: fadeInUp 0.8s ease both;
}

.ace-media {
  position: relative;
}

.ace-frame {
  position: relative;
  border: 1px solid rgba(143, 215, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  background: #050a12;
}

.ace-frame img {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 280px;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.ace-pilot:hover .ace-frame img {
  transform: scale(1.03);
}

.ace-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 60%, rgba(5, 10, 20, 0.8) 100%);
  pointer-events: none;
}

.ace-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
}

.ace-rank {
  padding: 0.25rem 0.5rem;
  background: rgba(95, 169, 255, 0.9);
  color: #030810;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  border-radius: 2px;
}

.ace-number {
  color: var(--accent-2);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.ace-content {
  display: flex;
  flex-direction: column;
}

.ace-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--line);
}

.ace-name {
  margin: 0.35rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.ace-callsign {
  margin: 0;
  color: var(--accent-2);
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.ace-info {
  flex: 1;
}

.ace-ship {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.info-label {
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.info-value {
  color: var(--text);
  font-weight: 500;
}

.ace-desc {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
}

.ace-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 1.25rem;
}

.btn-nav {
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: 1px solid var(--line);
  color: var(--text-muted);
  font-size: 0.7rem;
}

.btn-nav:hover {
  border-color: var(--accent);
  color: var(--text);
  background: rgba(95, 169, 255, 0.1);
}

.btn-nav span {
  opacity: 0.6;
}

.pilot-dots {
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  border: 1px solid var(--line);
  background: transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.dot:hover {
  border-color: var(--accent);
}

.dot.active {
  background: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 10px rgba(95, 169, 255, 0.5);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

@media (max-width: 860px) {
  .hero {
    padding: 2rem 1.5rem;
    transform: none !important;
  }

  .ace-pilot {
    grid-template-columns: 1fr;
  }

  .ace-frame img {
    min-height: 200px;
  }

  .ops-strip {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .ops-divider {
    display: none;
  }

  .ops-item {
    padding: 0;
  }
}
</style>
