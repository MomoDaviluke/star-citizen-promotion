<!--
  @fileoverview 飞船展示卡片组件 — Stellar Nexus 星渊枢纽风格
  @description 带鼠标视差效果的飞船展示卡片，支持分类标签、数据条动画和发光边框
  @module components/ui/ShipCard
-->

<template>
  <div
    ref="cardRef"
    :class="['ship-card', `ship-card--${categoryClass}`]"
    :style="card3DStyle"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    @mouseenter="handleMouseEnter"
    @click="$emit('click', ship)"
  >
    <!-- 鼠标跟随光照层 -->
    <div class="ship-card__spotlight" :style="spotlightStyle"></div>

    <!-- 飞船图片区域 — 视差容器 -->
    <div class="ship-card__viewport">
      <div class="ship-card__image-wrapper" :style="parallaxStyle">
        <img
          :src="ship.image || '/images/sc/sc-fleet.jpg'"
          :alt="ship.name"
          class="ship-card__image"
          loading="lazy"
        />
      </div>
      <!-- 图片渐变遮罩 -->
      <div class="ship-card__gradient-mask"></div>
      <!-- 全息扫描线 -->
      <div class="ship-card__scanline"></div>
      <!-- 分类标签 -->
      <span :class="['ship-card__category', `ship-card__category--${categoryClass}`, 'font-data']">
        {{ categoryLabel }}
      </span>
    </div>

    <!-- 飞船信息区域 -->
    <div class="ship-card__info">
      <div class="ship-card__header">
        <h3 class="ship-card__name font-tech">{{ ship.name }}</h3>
        <span v-if="ship.callsign" class="ship-card__callsign font-data">{{ ship.callsign }}</span>
      </div>

      <div class="ship-card__model font-data">
        <span class="model-label">MODEL</span>
        <span class="model-value">{{ ship.ship || ship.name }}</span>
      </div>

      <!-- 数据条 -->
      <div v-if="showStats" class="ship-card__stats">
        <div
          v-for="stat in displayStats"
          :key="stat.label"
          class="ship-card__stat"
        >
          <span class="stat-label font-data">{{ stat.label }}</span>
          <div class="stat-bar">
            <div
              class="stat-bar-fill"
              :style="{ width: isHovered ? `${stat.value}%` : '0%' }"
            ></div>
          </div>
          <span class="stat-value font-data">{{ stat.value }}%</span>
        </div>
      </div>

      <!-- 价值信息 -->
      <div v-if="ship.value" class="ship-card__value font-data">
        <span class="value-label">VALUE</span>
        <span class="value-amount">{{ formatUEC(ship.value) }} UEC</span>
      </div>
    </div>

    <!-- 发光边框 -->
    <div class="ship-card__glow-border"></div>

    <!-- 角标装饰 -->
    <div class="ship-card__corner ship-card__corner--tl"></div>
    <div class="ship-card__corner ship-card__corner--tr"></div>
    <div class="ship-card__corner ship-card__corner--bl"></div>
    <div class="ship-card__corner ship-card__corner--br"></div>
  </div>
</template>

<script setup>
/**
 * ShipCard - 飞船展示卡片组件
 *
 * @param {Object} ship - 飞船数据对象
 * @param {string} ship.name - 飞船名称
 * @param {string} ship.ship - 飞船型号
 * @param {string} ship.image - 飞船图片路径
 * @param {string} ship.category - 分类: 'combat' | 'transport' | 'exploration' | 'mining' | 'support'
 * @param {string} ship.callsign - 呼号
 * @param {number} ship.value - 价值 (UEC)
 * @param {boolean} showStats - 是否显示数据条
 */

import { ref, computed } from 'vue'

const props = defineProps({
  ship: { type: Object, required: true },
  showStats: { type: Boolean, default: true }
})

defineEmits(['click'])

const cardRef = ref(null)
const isHovered = ref(false)

/** 视差偏移量 */
const offsetX = ref(0)
const offsetY = ref(0)

/** 3D 旋转角度 */
const rotateX = ref(0)
const rotateY = ref(0)

/** 鼠标跟随光照位置 */
const lightX = ref(50)
const lightY = ref(50)

/** 分类映射表 */
const CATEGORY_MAP = {
  combat: { label: 'COMBAT', class: 'combat', color: 'var(--status-danger)' },
  fighter: { label: 'COMBAT', class: 'combat', color: 'var(--status-danger)' },
  transport: { label: 'TRANSPORT', class: 'transport', color: 'var(--amber-primary)' },
  freight: { label: 'TRANSPORT', class: 'transport', color: 'var(--amber-primary)' },
  exploration: { label: 'EXPLORATION', class: 'exploration', color: 'var(--nebula-purple)' },
  explorer: { label: 'EXPLORATION', class: 'exploration', color: 'var(--nebula-purple)' },
  mining: { label: 'MINING', class: 'mining', color: 'var(--data-flow)' },
  industrial: { label: 'MINING', class: 'mining', color: 'var(--data-flow)' },
  support: { label: 'SUPPORT', class: 'support', color: 'var(--text-secondary)' },
  medical: { label: 'SUPPORT', class: 'support', color: 'var(--text-secondary)' }
}

/** 分类标签文字 */
const categoryLabel = computed(() => {
  const cat = props.ship.category?.toLowerCase()
  return CATEGORY_MAP[cat]?.label || 'VESSEL'
})

/** 分类 CSS 类名 */
const categoryClass = computed(() => {
  const cat = props.ship.category?.toLowerCase()
  return CATEGORY_MAP[cat]?.class || 'default'
})

/** 模拟数据条 — 基于飞船名称生成稳定的随机值 */
const displayStats = computed(() => {
  const seed = hashCode(props.ship.name || '')
  return [
    { label: 'SPEED', value: 40 + (seed % 55) },
    { label: 'SHIELD', value: 35 + ((seed >> 4) % 60) },
    { label: 'FIREPOWER', value: 30 + ((seed >> 8) % 65) }
  ]
})

/** 视差变换样式 */
const parallaxStyle = computed(() => ({
  transform: `translate(${offsetX.value}px, ${offsetY.value}px) scale(${isHovered.value ? 1.08 : 1})`,
  transition: isHovered.value ? 'transform 0.15s ease-out' : 'transform 0.4s ease-out'
}))

/** 卡片 3D 变换样式 */
const card3DStyle = computed(() => ({
  transform: isHovered.value
    ? `perspective(800px) rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg) translateY(-4px)`
    : 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)',
  transition: isHovered.value ? 'transform 0.15s ease-out' : 'transform 0.5s ease-out'
}))

/** 鼠标跟随光照样式 */
const spotlightStyle = computed(() => ({
  background: isHovered.value
    ? `radial-gradient(circle at ${lightX.value}% ${lightY.value}%, rgba(255,255,255,0.08) 0%, transparent 60%)`
    : 'none'
}))

/**
 * 鼠标移动 — 计算3D旋转 + 视差偏移 + 光照位置
 * @description 同时实现三种交互效果：
 *              1. 卡片3D倾斜旋转（rotateX/rotateY）
 *              2. 图片视差偏移（translateX/Y）
 *              3. 鼠标跟随光照（radial-gradient）
 */
function handleMouseMove(e) {
  if (!cardRef.value) return
  const rect = cardRef.value.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const normX = (e.clientX - centerX) / (rect.width / 2)
  const normY = (e.clientY - centerY) / (rect.height / 2)

  offsetX.value = normX * 12
  offsetY.value = normY * 8
  rotateY.value = normX * 8
  rotateX.value = -normY * 6
  lightX.value = ((e.clientX - rect.left) / rect.width) * 100
  lightY.value = ((e.clientY - rect.top) / rect.height) * 100
}

function handleMouseLeave() {
  isHovered.value = false
  offsetX.value = 0
  offsetY.value = 0
  rotateX.value = 0
  rotateY.value = 0
}

function handleMouseEnter() {
  isHovered.value = true
}

/**
 * 简单字符串哈希 — 生成稳定的伪随机数
 * @param {string} str - 输入字符串
 * @returns {number} 哈希值
 */
function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * 格式化 UEC 金额
 * @param {number} value - 金额
 * @returns {string} 格式化后的金额
 */
function formatUEC(value) {
  if (!value) return '0'
  return new Intl.NumberFormat('en-US').format(value)
}
</script>

<style scoped>
.ship-card {
  position: relative;
  background: rgba(17, 24, 39, 0.9);
  border: 1px solid var(--border-medium);
  overflow: hidden;
  cursor: pointer;
  transform-style: preserve-3d;
  will-change: transform;
}

.ship-card:hover {
  border-color: var(--border-strong);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* 鼠标跟随光照层 */
.ship-card__spotlight {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  transition: background 0.15s ease-out;
}

/* ===== 图片视口区域 ===== */
.ship-card__viewport {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.ship-card__image-wrapper {
  position: absolute;
  inset: -20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ship-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ship-card__gradient-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(to top, rgba(17, 24, 39, 1), transparent);
  pointer-events: none;
  z-index: 1;
}

.ship-card__scanline {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  opacity: 0.06;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(6, 182, 212, 0.15) 2px,
    rgba(6, 182, 212, 0.15) 4px
  );
}

/* ===== 分类标签 ===== */
.ship-card__category {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 2px 10px;
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  z-index: 3;
  border: 1px solid;
}

.ship-card__category--combat {
  color: var(--status-danger);
  border-color: var(--status-danger);
  background: rgba(239, 68, 68, 0.15);
}

.ship-card__category--transport {
  color: var(--amber-primary);
  border-color: var(--amber-primary);
  background: rgba(245, 158, 11, 0.15);
}

.ship-card__category--exploration {
  color: var(--nebula-purple);
  border-color: var(--nebula-purple);
  background: rgba(124, 58, 237, 0.15);
}

.ship-card__category--mining {
  color: var(--data-flow);
  border-color: var(--data-flow);
  background: rgba(6, 182, 212, 0.15);
}

.ship-card__category--support,
.ship-card__category--default {
  color: var(--text-secondary);
  border-color: var(--text-secondary);
  background: rgba(156, 163, 175, 0.1);
}

/* ===== 信息区域 ===== */
.ship-card__info {
  position: relative;
  z-index: 2;
  padding: var(--space-4);
}

.ship-card__header {
  margin-bottom: var(--space-2);
}

.ship-card__name {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0;
}

.ship-card__callsign {
  font-size: var(--text-xs);
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.ship-card__model {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: var(--space-3);
}

.model-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.model-value {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* ===== 数据条 ===== */
.ship-card__stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.ship-card__stat {
  display: grid;
  grid-template-columns: 60px 1fr 36px;
  align-items: center;
  gap: var(--space-2);
}

.stat-label {
  font-size: 0.6rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.stat-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  border-radius: 2px;
}

.stat-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--amber-primary), var(--nebula-purple));
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.stat-value {
  font-size: 0.6rem;
  color: var(--text-muted);
  text-align: right;
}

/* ===== 价值信息 ===== */
.ship-card__value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-2);
  border-top: 1px solid var(--border-subtle);
}

.value-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.value-amount {
  font-size: var(--text-sm);
  color: var(--amber-primary);
  font-weight: 500;
}

/* ===== 发光边框 ===== */
.ship-card__glow-border {
  position: absolute;
  inset: 0;
  border: 1px solid transparent;
  background: linear-gradient(
    135deg,
    rgba(245, 158, 11, 0.3),
    transparent 30%,
    transparent 70%,
    rgba(124, 58, 237, 0.3)
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  padding: 1px;
  pointer-events: none;
  z-index: 3;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.ship-card:hover .ship-card__glow-border {
  opacity: 1;
}

/* ===== 角标装饰 ===== */
.ship-card__corner {
  position: absolute;
  width: 14px;
  height: 14px;
  border-color: var(--amber-primary);
  border-style: solid;
  pointer-events: none;
  z-index: 4;
  opacity: 0.4;
  transition: all 0.3s ease;
}

.ship-card__corner--tl {
  top: -1px;
  left: -1px;
  border-width: 2px 0 0 2px;
}

.ship-card__corner--tr {
  top: -1px;
  right: -1px;
  border-width: 2px 2px 0 0;
}

.ship-card__corner--bl {
  bottom: -1px;
  left: -1px;
  border-width: 0 0 2px 2px;
}

.ship-card__corner--br {
  bottom: -1px;
  right: -1px;
  border-width: 0 2px 2px 0;
}

.ship-card:hover .ship-card__corner {
  width: 20px;
  height: 20px;
  opacity: 1;
}

/* ===== 分类变体悬停色 ===== */
.ship-card--combat:hover {
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 0 8px 32px rgba(239, 68, 68, 0.15);
}

.ship-card--combat .ship-card__corner {
  border-color: var(--status-danger);
}

.ship-card--exploration:hover {
  border-color: rgba(124, 58, 237, 0.4);
  box-shadow: 0 8px 32px rgba(124, 58, 237, 0.15);
}

.ship-card--exploration .ship-card__corner {
  border-color: var(--nebula-purple);
}

.ship-card--mining:hover {
  border-color: rgba(6, 182, 212, 0.4);
  box-shadow: 0 8px 32px rgba(6, 182, 212, 0.15);
}

.ship-card--mining .ship-card__corner {
  border-color: var(--data-flow);
}

.ship-card--transport:hover {
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow: 0 8px 32px rgba(245, 158, 11, 0.15);
}

.ship-card--transport .ship-card__corner {
  border-color: var(--amber-primary);
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .ship-card__viewport {
    height: 160px;
  }
}
</style>
