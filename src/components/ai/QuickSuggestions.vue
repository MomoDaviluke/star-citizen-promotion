<!--
  @file QuickSuggestions 快捷气泡
  @description AI 招募官快捷问题建议，复用项目全息 HUD 视觉语言（青色配色 + 等宽字体 + 光晕交互）
  @note 空列表时容器整体隐藏，避免显示空 HUD 边框；颜色全部走项目 CSS 变量
-->
<template>
  <div
    v-if="suggestions.length"
    class="quick-suggestions"
    role="group"
    aria-label="快捷问题建议"
  >
    <span class="quick-suggestions__label" aria-hidden="true">
      <span class="quick-suggestions__dot"></span>
      <span class="quick-suggestions__label-text">// QUICK COMMS</span>
    </span>
    <button
      v-for="suggestion in suggestions"
      :key="suggestion"
      class="suggestion-bubble"
      :disabled="disabled"
      :aria-label="`发送建议问题：${suggestion}`"
      @click="$emit('select', suggestion)"
    >
      <span class="suggestion-bubble__prefix" aria-hidden="true">»</span>
      <span class="suggestion-bubble__text">{{ suggestion }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  suggestions: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
})
defineEmits(['select'])
</script>

<style scoped>
.quick-suggestions {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid var(--color-hud-line);
  background: linear-gradient(180deg, transparent, var(--color-accent-muted));
}

/* HUD 标签：等宽字体 + 脉冲点 + 通信频道文字 */
.quick-suggestions__label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-text-accent);
  opacity: 0.7;
}

.quick-suggestions__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 8px var(--color-accent);
  animation: qs-pulse 2s var(--motion-ease-in-out) infinite;
}

/* 气泡：HUD 终端风格胶囊 */
.suggestion-bubble {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4rem 0.9rem;
  background: transparent;
  border: 1px solid var(--color-border-accent);
  border-radius: 20px;
  color: var(--color-text-accent);
  font-family: var(--font-data);
  font-size: var(--text-sm);
  letter-spacing: 0.04em;
  cursor: pointer;
  overflow: hidden;
  transition:
    background var(--motion-duration-fast) var(--motion-ease-out),
    border-color var(--motion-duration-fast) var(--motion-ease-out),
    box-shadow var(--motion-duration-fast) var(--motion-ease-out),
    transform var(--motion-duration-fast) var(--motion-ease-out),
    color var(--motion-duration-fast) var(--motion-ease-out);
}

.suggestion-bubble__prefix {
  font-size: 0.85em;
  opacity: 0.55;
  transition: opacity var(--motion-duration-fast) var(--motion-ease-out);
}

.suggestion-bubble__text {
  position: relative;
  z-index: 1;
}

/* hover 扫描线掠过装饰 */
.suggestion-bubble::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(var(--raw-cyan-rgb), 0.2) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  transition: transform var(--motion-duration-normal) var(--motion-ease-out);
  pointer-events: none;
}

.suggestion-bubble:hover:not(:disabled) {
  background: var(--color-accent-muted);
  border-color: var(--color-accent);
  color: var(--color-accent-bright);
  box-shadow: var(--shadow-accent), 0 0 12px rgba(var(--raw-cyan-rgb), 0.25);
  transform: translateY(-1px);
}

.suggestion-bubble:hover:not(:disabled)::before {
  transform: translateX(100%);
}

.suggestion-bubble:hover:not(:disabled) .suggestion-bubble__prefix {
  opacity: 1;
}

.suggestion-bubble:focus-visible {
  outline: 1px solid var(--color-accent-bright);
  outline-offset: 2px;
}

.suggestion-bubble:active:not(:disabled) {
  transform: translateY(0);
}

.suggestion-bubble:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@keyframes qs-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); }
}

/* 尊重减少动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .suggestion-bubble,
  .suggestion-bubble::before,
  .suggestion-bubble__prefix {
    transition: none;
  }
  .suggestion-bubble:hover:not(:disabled) {
    transform: none;
  }
  .suggestion-bubble:hover:not(:disabled)::before {
    display: none;
  }
  .quick-suggestions__dot {
    animation: none;
  }
}
</style>
