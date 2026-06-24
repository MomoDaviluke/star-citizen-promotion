<!--
  @file 脉冲状态指示灯
  @description 用于在线状态、战备率等场景
-->
<template>
  <span class="status-pulse" :class="`status-pulse--${variant}`">
    <span class="status-pulse__dot"></span>
    <span v-if="label" class="status-pulse__label">{{ label }}</span>
  </span>
</template>

<script setup>
const props = defineProps({
  variant: { type: String, default: 'online' }, // online | warning | danger | offline
  label: { type: String, default: '' }
})
</script>

<style scoped>
.status-pulse {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.status-pulse__dot {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-pulse__dot::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  animation: statusPulse 2s ease-in-out infinite;
}

.status-pulse--online .status-pulse__dot { background: var(--color-status-online); }
.status-pulse--online .status-pulse__dot::after { background: rgba(34, 197, 94, 0.3); }

.status-pulse--warning .status-pulse__dot { background: var(--color-status-warning); }
.status-pulse--warning .status-pulse__dot::after { background: rgba(255, 179, 0, 0.3); }

.status-pulse--danger .status-pulse__dot { background: var(--color-status-danger); }
.status-pulse--danger .status-pulse__dot::after { background: rgba(239, 68, 68, 0.3); }

.status-pulse--offline .status-pulse__dot { background: var(--color-status-offline); }
.status-pulse--offline .status-pulse__dot::after { background: rgba(107, 114, 128, 0.3); }

@keyframes statusPulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(2.2); opacity: 0; }
}
</style>
