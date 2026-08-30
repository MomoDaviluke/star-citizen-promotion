<template>
  <!--
    StarfieldBg - 星域粒子背景组件
    使用 Canvas 2D 渲染动态星空背景
    支持视差滚动、粒子闪烁、性能分级
  -->
  <div class="starfield-bg">
    <canvas
      ref="canvasRef"
      class="starfield-bg__canvas"
      :style="canvasStyle"
    ></canvas>
    <div class="starfield-bg__overlay"></div>
  </div>
</template>

<script setup>
/**
 * StarfieldBg - 星域背景组件
 *
 * @param {string} quality - 质量级别: 'low' | 'medium' | 'high' | 'ultra'
 * @param {number} speed - 星空移动速度倍率
 * @param {boolean} parallax - 是否启用视差效果
 */

import { ref, onMounted, onUnmounted, computed } from 'vue';
import { ParticleEngine, createStarfield } from '@/utils/effects/ParticleEngine.js';

const props = defineProps({
  quality: {
    type: String,
    default: 'high',
    validator: (v) => ['low', 'medium', 'high', 'ultra'].includes(v)
  },
  speed: { type: Number, default: 1 },
  parallax: { type: Boolean, default: true }
});

const canvasRef = ref(null);
let engine = null;

// 质量配置
const qualityConfig = {
  low: { count: 80, maxSize: 2, blur: false },
  medium: { count: 200, maxSize: 2.5, blur: false },
  high: { count: 400, maxSize: 3, blur: true },
  ultra: { count: 600, maxSize: 4, blur: true }
};

// Canvas 样式
const canvasStyle = computed(() => ({
  filter: qualityConfig[props.quality].blur ? 'blur(0.3px)' : 'none'
}));

/**
 * 初始化星域
 */
function initStarfield() {
  if (!canvasRef.value) return;

  // 环境防御：jsdom 测试环境或禁用 canvas 的浏览器中 getContext 返回 null，
  // 此时静默降级（无星空背景），避免渲染循环抛错拖垮整个组件树
  if (!canvasRef.value.getContext('2d')) return;

  const config = qualityConfig[props.quality];

  // 创建粒子引擎
  engine = new ParticleEngine(canvasRef.value, {
    maxParticles: config.count
  });

  // 创建星空
  createStarfield(engine, {
    count: config.count,
    maxSize: config.maxSize,
    speed: 0.1 * props.speed
  });

  // 启动引擎
  engine.start();
}

/**
 * 处理视差滚动
 */
function handleScroll() {
  if (!props.parallax || !engine) return;

  const scrollY = window.scrollY;
  const parallaxSpeed = 0.3;

  // 调整星空移动速度以产生视差
  engine.particles.forEach((p, i) => {
    if (i % 3 === 0) { // 部分星星产生视差
      p.vy = 0.1 * props.speed + (scrollY * 0.001 * parallaxSpeed);
    }
  });
}

onMounted(() => {
  initStarfield();

  if (props.parallax) {
    window.addEventListener('scroll', handleScroll, { passive: true });
  }
});

onUnmounted(() => {
  if (engine) {
    engine.destroy();
  }

  if (props.parallax) {
    window.removeEventListener('scroll', handleScroll);
  }
});
</script>

<style scoped>
.starfield-bg {
  position: fixed;
  inset: 0;
  z-index: var(--z-bg);
  pointer-events: none;
  overflow: hidden;
}

.starfield-bg__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.starfield-bg__overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 0%,
    var(--raw-void-1) 100%
  );
  opacity: 0.3;
}
</style>
