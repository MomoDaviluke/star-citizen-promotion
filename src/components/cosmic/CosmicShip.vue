<!--
  @file CosmicShip 宇宙舰船组件
  @description 支持 SVG 程序化绘制与真实图片素材两种模式，含边缘光、引擎灯、悬停姿态变化
  @module components/cosmic/CosmicShip
-->
<template>
  <div
    class="cosmic-ship"
    :class="{ 'cosmic-ship--hovered': isHovered, 'cosmic-ship--image': !!image }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- 图片素材模式：用于展示 Star Citizen 官方舰船渲染图 -->
    <template v-if="image">
      <div class="cosmic-ship__frame">
        <img
          :src="image"
          :alt="alt || `Spaceship ${registry}`"
          class="cosmic-ship__image"
          loading="lazy"
        />
        <div class="cosmic-ship__image-overlay" aria-hidden="true"></div>
        <div class="cosmic-ship__engine-glow" aria-hidden="true"></div>
      </div>
    </template>

    <!-- SVG 程序化绘制模式：默认降级方案 -->
    <svg
      v-else
      viewBox="0 0 240 80"
      class="cosmic-ship__svg"
      xmlns="http://www.w3.org/2000/svg"
      :aria-label="`Spaceship ${registry}`"
    >
      <defs>
        <!-- 舰体金属渐变 -->
        <linearGradient :id="shipBodyId" x1="0%" y1="0%" x2="100%" y2="50%">
          <stop offset="0%" stop-color="#1a1a24"/>
          <stop offset="50%" stop-color="#3a3a4e"/>
          <stop offset="100%" stop-color="#1a1a24"/>
        </linearGradient>

        <!-- 青色边缘光滤镜 -->
        <filter :id="cyanGlowId" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <!-- 引擎辉光滤镜 -->
        <filter :id="engineGlowId" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- 主舰体 -->
      <path
        d="M20,40 L80,35 L120,25 L200,40 L120,55 L80,45 Z"
        :fill="`url(#${shipBodyId})`"
        stroke="#4a9eff"
        stroke-width="1"
        :filter="`url(#${cyanGlowId})`"
        class="cosmic-ship__hull"
      />

      <!-- 左翼（不对称后掠） -->
      <path
        d="M70,38 L40,15 L90,32 Z"
        fill="#252530"
        stroke="#4a9eff"
        stroke-width="0.8"
        opacity="0.9"
      />

      <!-- 右翼（较短，制造不对称感） -->
      <path
        d="M70,42 L50,68 L95,48 Z"
        fill="#1e1e28"
        stroke="#4a9eff"
        stroke-width="0.8"
        opacity="0.8"
      />

      <!-- 驾驶舱 -->
      <ellipse cx="105" cy="40" rx="12" ry="5" fill="#ffb300" opacity="0.9" :filter="`url(#${engineGlowId})`"/>

      <!-- 主引擎 -->
      <ellipse
        cx="25"
        cy="40"
        rx="8"
        ry="6"
        fill="#ffb300"
        :filter="`url(#${engineGlowId})`"
        class="cosmic-ship__engine"
      />

      <!-- 姿态喷口 -->
      <circle cx="75" cy="30" r="2" fill="#ffb300" opacity="0.7"/>
      <circle cx="78" cy="50" r="2" fill="#ffb300" opacity="0.7"/>

      <!-- 战队铭牌 -->
      <text
        x="150"
        y="55"
        fill="#7a7a94"
        font-family="monospace"
        font-size="6"
        letter-spacing="0.1em"
      >
        {{ registry }}
      </text>
    </svg>
  </div>
</template>

<script setup>
import { ref, useId } from 'vue'

/**
 * 组件 Props 定义
 * @property {string} registry - 舰船注册编号铭牌
 * @property {string} image - 舰船图片素材路径，传入后使用图片模式
 * @property {string} alt - 图片替代文本
 */
defineProps({
  registry: {
    type: String,
    default: 'SNT-001'
  },
  image: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: ''
  }
})

/** 悬停状态，用于触发姿态与光效变化 */
const isHovered = ref(false)

/** 唯一 ID 前缀，避免同一页面多艘舰船共用 SVG filter/gradient ID */
const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
const shipBodyId = `shipBody-${uid}`
const cyanGlowId = `cyanGlow-${uid}`
const engineGlowId = `engineGlow-${uid}`
</script>

<style scoped>
.cosmic-ship {
  width: 240px;
  transition: transform 0.4s var(--ease-out);
  cursor: pointer;
}

.cosmic-ship:hover,
.cosmic-ship--hovered {
  transform: rotate(-3deg) translateY(-4px);
}

/* 图片素材模式：容器适配与遮罩光效 */
.cosmic-ship--image {
  width: min(100%, 520px);
  filter: drop-shadow(0 0 16px rgba(74, 158, 255, 0.18));
  transition: filter 0.4s var(--ease-out), transform 0.4s var(--ease-out);
}

.cosmic-ship--image:hover,
.cosmic-ship--image.cosmic-ship--hovered {
  filter: drop-shadow(0 0 28px rgba(74, 158, 255, 0.35));
}

.cosmic-ship__frame {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.cosmic-ship__image {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.5s var(--ease-out), filter 0.5s var(--ease-out);
}

.cosmic-ship__image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(74, 158, 255, 0.08) 0%,
    transparent 40%,
    transparent 60%,
    rgba(74, 158, 255, 0.08) 100%
  );
  opacity: 0;
  transition: opacity 0.4s var(--ease-out);
  pointer-events: none;
}

.cosmic-ship--image:hover .cosmic-ship__image,
.cosmic-ship--image.cosmic-ship--hovered .cosmic-ship__image {
  transform: scale(1.03);
  filter: brightness(1.1) drop-shadow(0 0 12px rgba(74, 158, 255, 0.25));
}

.cosmic-ship--image:hover .cosmic-ship__image-overlay,
.cosmic-ship--image.cosmic-ship--hovered .cosmic-ship__image-overlay {
  opacity: 1;
}

.cosmic-ship__engine-glow {
  position: absolute;
  left: 8%;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 60%;
  background: radial-gradient(ellipse at center, rgba(74, 158, 255, 0.55), transparent 70%);
  filter: blur(8px);
  opacity: 0.8;
  animation: engine-pulse 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes engine-pulse {
  0%, 100% { opacity: 0.7; transform: translateY(-50%) scaleX(1); }
  50% { opacity: 1; transform: translateY(-50%) scaleX(1.3); }
}

@media (prefers-reduced-motion: reduce) {
  .cosmic-ship__engine-glow {
    animation: none;
  }
}

.cosmic-ship__svg {
  width: 100%;
  height: auto;
  display: block;
}

.cosmic-ship__engine {
  transition: opacity 0.4s var(--ease-out);
}

.cosmic-ship:hover .cosmic-ship__engine,
.cosmic-ship--hovered .cosmic-ship__engine {
  opacity: 1;
  filter: drop-shadow(0 0 8px #ffb300);
}

.cosmic-ship__hull {
  transition: stroke 0.4s var(--ease-out), filter 0.4s var(--ease-out);
}

.cosmic-ship:hover .cosmic-ship__hull,
.cosmic-ship--hovered .cosmic-ship__hull {
  stroke: #6bb3ff;
  filter: drop-shadow(0 0 6px rgba(74, 158, 255, 0.6));
}
</style>
