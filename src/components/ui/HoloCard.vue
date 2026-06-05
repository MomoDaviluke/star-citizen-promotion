<template>
  <!--
    HoloCard - 全息投影卡片组件
    模拟科幻电影中的全息投影效果
    支持3D倾斜交互、发光边框、扫描线等特效
  -->
  <div
    ref="cardRef"
    :class="[
      'holo-card',
      { 'holo-card--interactive': interactive },
      { 'holo-card--glitching': isGlitching }
    ]"
    :style="cardStyle"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    @mouseenter="handleMouseEnter"
  >
    <!-- 全息边框 -->
    <div class="holo-card__border"></div>

    <!-- 卡片内容 -->
    <div class="holo-card__content">
      <slot></slot>
    </div>

    <!-- 全息扫描线 -->
    <div class="holo-card__scanline"></div>

    <!-- 底部发光 -->
    <div class="holo-card__glow"></div>

    <!-- 鼠标追踪光晕 -->
    <div
      v-if="interactive"
      class="holo-card__spotlight"
      :style="spotlightStyle"
    ></div>

    <!-- 角标装饰 -->
    <div class="holo-card__decoration holo-card__decoration--tl"></div>
    <div class="holo-card__decoration holo-card__decoration--tr"></div>
    <div class="holo-card__decoration holo-card__decoration--bl"></div>
    <div class="holo-card__decoration holo-card__decoration--br"></div>
  </div>
</template>

<script setup>
/**
 * HoloCard - 全息投影卡片组件
 *
 * @param {boolean} interactive - 是否启用3D倾斜交互
 * @param {number} tiltAmount - 倾斜角度 (默认: 10)
 * @param {boolean} glitchOnHover - 悬停时是否触发 glitch 效果
 * @param {string} glowColor - 发光颜色
 */

import { ref, computed } from 'vue';

const props = defineProps({
  interactive: { type: Boolean, default: true },
  tiltAmount: { type: Number, default: 10 },
  glitchOnHover: { type: Boolean, default: false },
  glowColor: { type: String, default: 'var(--nebula-purple)' }
});

const cardRef = ref(null);
const tiltX = ref(0);
const tiltY = ref(0);
const isGlitching = ref(false);
const isHovered = ref(false);
const spotlightX = ref(50);
const spotlightY = ref(50);

// 卡片3D变换样式
const cardStyle = computed(() => {
  if (!props.interactive) return {};

  return {
    transform: `perspective(1000px) rotateX(${tiltX.value}deg) rotateY(${tiltY.value}deg) scale3d(${isHovered.value ? 1.02 : 1}, ${isHovered.value ? 1.02 : 1}, 1)`,
    '--glow-color': props.glowColor
  };
});

/** 鼠标追踪光晕样式 — 径向渐变跟随鼠标位置 */
const spotlightStyle = computed(() => ({
  background: `radial-gradient(circle 200px at ${spotlightX.value}% ${spotlightY.value}%, var(--glow-color, var(--nebula-purple)), transparent 70%)`,
  opacity: isHovered.value ? 0.15 : 0
}));

/**
 * 处理鼠标移动 - 计算3D倾斜角度
 */
function handleMouseMove(e) {
  if (!props.interactive || !cardRef.value) return;

  const rect = cardRef.value.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const percentX = (e.clientX - centerX) / (rect.width / 2);
  const percentY = (e.clientY - centerY) / (rect.height / 2);

  tiltY.value = percentX * props.tiltAmount;
  tiltX.value = -percentY * props.tiltAmount;

  /** 更新光晕追踪位置（百分比坐标） */
  spotlightX.value = ((e.clientX - rect.left) / rect.width) * 100;
  spotlightY.value = ((e.clientY - rect.top) / rect.height) * 100;
}

/**
 * 处理鼠标离开 - 重置倾斜
 */
function handleMouseLeave() {
  if (!props.interactive) return;

  tiltX.value = 0;
  tiltY.value = 0;
  isHovered.value = false;
  isGlitching.value = false;
}

/**
 * 处理鼠标进入
 */
function handleMouseEnter() {
  isHovered.value = true;

  // 触发 glitch 效果
  if (props.glitchOnHover) {
    isGlitching.value = true;
    setTimeout(() => {
      isGlitching.value = false;
    }, 300);
  }
}
</script>

<style scoped>
.holo-card {
  position: relative;
  background: rgba(6, 182, 212, 0.03);
  border: 1px solid rgba(6, 182, 212, 0.2);
  overflow: hidden;
  transition: transform 0.15s ease-out;
  transform-style: preserve-3d;
}

/* 全息边框 */
.holo-card__border {
  position: absolute;
  inset: 0;
  border: 1px solid transparent;
  background: linear-gradient(
    135deg,
    rgba(6, 182, 212, 0.3),
    transparent 30%,
    transparent 70%,
    rgba(6, 182, 212, 0.3)
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
  z-index: 2;
}

/* 卡片内容 */
.holo-card__content {
  position: relative;
  z-index: 1;
  padding: var(--space-5);
  transform: translateZ(20px);
}

/* 全息扫描线 */
.holo-card__scanline {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
  opacity: 0.1;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(6, 182, 212, 0.1) 2px,
    rgba(6, 182, 212, 0.1) 4px
  );
  animation: scanline 6s linear infinite;
}

/* 底部发光 */
.holo-card__glow {
  position: absolute;
  bottom: -50%;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 100%;
  background: radial-gradient(
    ellipse at center,
    var(--glow-color, var(--nebula-purple)) 0%,
    transparent 70%
  );
  opacity: 0.15;
  pointer-events: none;
  z-index: 0;
  transition: opacity var(--duration-normal);
}

.holo-card:hover .holo-card__glow {
  opacity: 0.25;
}

/* 鼠标追踪光晕 */
.holo-card__spotlight {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  transition: opacity 0.3s ease;
  mix-blend-mode: screen;
}

/* 角标装饰 */
.holo-card__decoration {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: rgba(6, 182, 212, 0.4);
  border-style: solid;
  pointer-events: none;
  z-index: 4;
  transition: all var(--duration-normal);
}

.holo-card__decoration--tl {
  top: 8px;
  left: 8px;
  border-width: 2px 0 0 2px;
}

.holo-card__decoration--tr {
  top: 8px;
  right: 8px;
  border-width: 2px 2px 0 0;
}

.holo-card__decoration--bl {
  bottom: 8px;
  left: 8px;
  border-width: 0 0 2px 2px;
}

.holo-card__decoration--br {
  bottom: 8px;
  right: 8px;
  border-width: 0 2px 2px 0;
}

.holo-card:hover .holo-card__decoration {
  width: 30px;
  height: 30px;
  border-color: rgba(6, 182, 212, 0.7);
}

/* Glitch 效果 */
.holo-card--glitching {
  animation: hologram-glitch 0.3s ease-in-out;
}

/* 交互状态 */
.holo-card--interactive {
  cursor: pointer;
}

.holo-card--interactive:hover {
  border-color: rgba(6, 182, 212, 0.4);
  box-shadow:
    0 0 30px rgba(6, 182, 212, 0.1),
    inset 0 0 30px rgba(6, 182, 212, 0.05);
}

/* 响应式 */
@media (max-width: 768px) {
  .holo-card__content {
    padding: var(--space-4);
  }

  .holo-card--interactive {
    transform: none !important;
  }
}
</style>
