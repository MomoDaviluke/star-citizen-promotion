<template>
  <div
    :class="[
      'holo-card',
      `holo-card--${variant}`,
      {
        'holo-card--floating': floatAnimation,
        'holo-card--scanline': showScanline,
      }
    ]"
    :style="cardStyle"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <!-- 角标装饰 -->
    <slot name="corner-decoration">
      <div v-if="showCorner" class="holo-card__corner" />
    </slot>

    <!-- 状态指示灯 -->
    <slot name="status-indicator">
      <span v-if="status" :class="['holo-card__status', `holo-card__status--${status}`]" />
    </slot>

    <!-- 头部区域 -->
    <div v-if="title || label || $slots.header" class="holo-card__header">
      <slot name="header">
        <span v-if="label" class="holo-card__label">{{ label }}</span>
        <h3 v-if="title" class="holo-card__title">{{ title }}</h3>
      </slot>
    </div>

    <!-- 主体内容 -->
    <div class="holo-card__body">
      <slot />
    </div>

    <!-- 底部操作区 -->
    <div v-if="$slots.footer" class="holo-card__footer">
      <slot name="footer" />
    </div>

    <!-- 扫描线效果 -->
    <div v-if="showScanline" class="holo-card__scanline" />

    <!-- 横扫光效 -->
    <div class="holo-card__sweep" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'terminal', 'pilot', 'ship'].includes(v)
  },
  title: String,
  label: String,
  status: String,
  showCorner: {
    type: Boolean,
    default: true
  },
  showScanline: {
    type: Boolean,
    default: false
  },
  floatAnimation: {
    type: Boolean,
    default: false
  },
  staggerIndex: {
    type: Number,
    default: 0
  }
})

const mouseX = ref(0.5)
const mouseY = ref(0.5)
const isHovered = ref(false)

function onMouseMove(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  mouseX.value = (e.clientX - rect.left) / rect.width
  mouseY.value = (e.clientY - rect.top) / rect.height
  isHovered.value = true
}

function onMouseLeave() {
  mouseX.value = 0.5
  mouseY.value = 0.5
  isHovered.value = false
}

const cardStyle = computed(() => {
  const stagger = props.staggerIndex * 0.1
  return {
    '--stagger-delay': `${stagger}s`,
    '--mouse-x': mouseX.value,
    '--mouse-y': mouseY.value,
    animationDelay: `${stagger}s`,
  }
})
</script>

<style scoped>
.holo-card {
  position: relative;
  background: var(--color-bg-card);
  backdrop-filter: blur(var(--blur-card));
  -webkit-backdrop-filter: blur(var(--blur-card));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  overflow: hidden;
  transition: border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease, transform 0.3s ease;
  animation: holo-enter 0.6s ease-out both;
  animation-delay: var(--stagger-delay, 0s);
}

.holo-card:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--glow-card-hover);
  background: var(--color-bg-card-hover);
  transform: translateY(-2px);
}

/* --- Floating animation --- */
.holo-card--floating {
  animation: holo-float var(--float-duration) ease-in-out infinite, holo-enter 0.6s ease-out both;
}

/* --- Variant: terminal --- */
.holo-card--terminal {
  clip-path: polygon(
    12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px),
    calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px
  );
  border-radius: 0;
  background: rgba(12, 20, 36, 0.85);
}

.holo-card--terminal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
  opacity: 0.5;
}

/* --- Variant: pilot --- */
.holo-card--pilot {
  text-align: center;
  padding: var(--space-6) var(--space-5);
}

/* --- Variant: ship --- */
.holo-card--ship {
  clip-path: polygon(
    10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px),
    calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px
  );
  border-radius: 0;
}

/* --- Corner decoration --- */
.holo-card__corner {
  position: absolute;
  top: 0;
  left: 0;
  width: 16px;
  height: 16px;
  border-top: 1px solid var(--color-accent);
  border-left: 1px solid var(--color-accent);
  opacity: 0.5;
  transition: opacity 0.3s ease, width 0.3s ease, height 0.3s ease;
  pointer-events: none;
}

.holo-card:hover .holo-card__corner {
  opacity: 1;
  width: 24px;
  height: 24px;
}

/* --- Status indicator --- */
.holo-card__status {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: breathe 2s ease-in-out infinite;
}

.holo-card__status--online {
  background: var(--color-status-online);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.holo-card__status--warning {
  background: var(--color-status-warning);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
}

.holo-card__status--offline {
  background: var(--color-status-offline);
  box-shadow: 0 0 8px rgba(107, 114, 128, 0.4);
}

.holo-card__status--danger {
  background: var(--color-status-danger);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
  animation: breathe 0.5s ease-in-out infinite;
}

/* --- Header --- */
.holo-card__header {
  margin-bottom: var(--space-4);
}

.holo-card__label {
  display: block;
  font-family: var(--font-tech);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-text-label);
  margin-bottom: var(--space-1);
}

.holo-card__title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-heading);
  line-height: 1.2;
}

/* --- Body --- */
.holo-card__body {
  color: var(--color-text-body);
  font-size: var(--text-base);
  line-height: 1.6;
}

/* --- Footer --- */
.holo-card__footer {
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-subtle);
}

/* --- Scanline effect --- */
.holo-card__scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(var(--raw-cyan-rgb), 0.015) 2px,
    rgba(var(--raw-cyan-rgb), 0.015) 4px
  );
  pointer-events: none;
}

/* --- Sweep light effect --- */
.holo-card__sweep {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 30%;
  background: linear-gradient(90deg, transparent, rgba(var(--raw-cyan-rgb), 0.03), transparent);
  animation: scan-sweep 6s ease-in-out infinite;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.holo-card:hover .holo-card__sweep {
  opacity: 1;
}

/* --- Keyframes --- */
@keyframes holo-enter {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes holo-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes scan-sweep {
  0% { left: -30%; }
  100% { left: 100%; }
}

@keyframes breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
