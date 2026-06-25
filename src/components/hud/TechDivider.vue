<!--
  @file 科技风格分隔线
  @description 带斜切末节的 HUD 分隔线
-->
<template>
  <div class="tech-divider" :class="{ 'tech-divider--vertical': vertical }">
    <span class="tech-divider__line"></span>
    <span class="tech-divider__notch"></span>
  </div>
</template>

<script setup>
defineProps({
  vertical: { type: Boolean, default: false }
})
</script>

<style scoped>
.tech-divider {
  display: flex;
  align-items: center;
  width: 100%;
  height: 1px;
}

.tech-divider--vertical {
  flex-direction: column;
  width: 1px;
  height: 100%;
}

.tech-divider__line {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-hud-line) 10%,
    var(--color-hud-line) 90%,
    transparent 100%
  );
}

.tech-divider--vertical .tech-divider__line {
  width: 1px;
  height: 100%;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--color-hud-line) 10%,
    var(--color-hud-line) 90%,
    transparent 100%
  );
}

.tech-divider__notch {
  width: 6px;
  height: 6px;
  background: var(--color-accent);
  transform: rotate(45deg);
  margin-left: -3px;
  box-shadow: var(--glow-hud);
}

.tech-divider--vertical .tech-divider__notch {
  margin-left: 0;
  margin-top: -3px;
}
</style>
