<!--
  @file ChatStream 流式消息列表
  @description AI 招募官对话流，复用项目全息 HUD 视觉语言
  @note messages 仅支持追加式更新（无重排/插入/删除），因此 v-for :key 使用索引安全
-->
<template>
  <div class="chat-stream" ref="containerRef">
    <!-- 顶部通信频道 HUD 条 -->
    <div class="chat-stream__header" aria-hidden="true">
      <span class="chat-stream__header-dot"></span>
      <span class="chat-stream__header-text">// COMMS CHANNEL</span>
      <span class="chat-stream__header-line"></span>
    </div>

    <div
      class="chat-stream__body"
      role="log"
      aria-live="polite"
      :aria-busy="isStreaming"
    >
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="chat-message"
        :class="`chat-message--${msg.role}`"
      >
        <!-- assistant 消息四角装饰（全息终端感） -->
        <template v-if="msg.role === 'assistant'">
          <HudCorner position="top-left" size="sm" />
          <HudCorner position="bottom-right" size="sm" />
        </template>

        <div class="chat-message__label">
          <span class="chat-message__prefix" aria-hidden="true">{{ msg.role === 'assistant' ? '>' : '//' }}</span>
          <span class="chat-message__role">{{ msg.role === 'assistant' ? 'AI 指挥官' : '你' }}</span>
        </div>
        <div class="chat-message__content">{{ msg.content }}</div>
      </div>

      <!-- 流式输入指示器 -->
      <div
        v-if="isStreaming && lastMessageEmpty"
        class="chat-message chat-message--assistant chat-message--typing"
      >
        <HudCorner position="top-left" size="sm" />
        <HudCorner position="bottom-right" size="sm" />
        <div class="chat-message__label">
          <span class="chat-message__prefix" aria-hidden="true">></span>
          <span class="chat-message__role">AI 指挥官</span>
        </div>
        <div class="chat-message__content">
          <div class="typing-indicator" aria-label="AI 正在输入">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed, onUnmounted } from 'vue'
import { HudCorner } from '@/components/hud'

const props = defineProps({
  messages: { type: Array, required: true },
  isStreaming: { type: Boolean, default: false },
})

const containerRef = ref(null)

const lastMessageEmpty = computed(() => {
  const last = props.messages[props.messages.length - 1]
  return !!last && last.role === 'assistant' && last.content === ''
})

// 合并滚动：用 requestAnimationFrame 去重，避免流式 token 逐次触发 reflow
let scrollRafId = null

function scrollToBottom() {
  if (scrollRafId !== null) return // 已有 pending rAF，跳过
  scrollRafId = requestAnimationFrame(() => {
    scrollRafId = null
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight
    }
  })
}

// 新消息追加时滚动
watch(
  () => props.messages.length,
  () => { nextTick(scrollToBottom) }
)

// 流式内容变化时也滚动（rAF 内部去重，与上一个 watch 同 tick 不会重复触发）
watch(
  () => props.messages[props.messages.length - 1]?.content,
  () => { nextTick(scrollToBottom) }
)

// 组件卸载时清理 rAF，避免泄漏
onUnmounted(() => {
  if (scrollRafId !== null) {
    cancelAnimationFrame(scrollRafId)
    scrollRafId = null
  }
})
</script>

<style scoped>
.chat-stream {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  background: var(--color-bg-deep);
  border: 1px solid var(--color-border-subtle);
  font-family: var(--font-body);
  color: var(--color-text-body);
}

/* 顶部通信频道 HUD 条 */
.chat-stream__header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(5, 5, 8, 0.88);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-hud-line);
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-text-label);
}

.chat-stream__header-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 8px var(--color-accent);
  animation: gentlePulse 2s ease-in-out infinite;
}

.chat-stream__header-text {
  color: var(--color-text-accent);
}

.chat-stream__header-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--color-hud-line), transparent);
}

.chat-stream__body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 0.875rem;
}

/* 消息条 */
.chat-message {
  position: relative;
  padding: 0.75rem 0.875rem 0.875rem;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-card);
  animation: fadeInUp var(--motion-duration-normal) var(--motion-ease-out) both;
}

/* assistant：全息青色调，左侧竖线，微光晕 */
.chat-message--assistant {
  border-color: var(--color-border-accent);
  border-left: 2px solid var(--color-accent);
  background: linear-gradient(
    90deg,
    var(--color-accent-muted),
    var(--color-bg-card) 45%
  );
  box-shadow: var(--shadow-accent);
}

/* user：琥珀色调，右侧竖线（镜像），右对齐 */
.chat-message--user {
  align-self: flex-end;
  max-width: 85%;
  border-color: var(--color-border-amber);
  border-right: 2px solid var(--color-highlight);
  background: linear-gradient(
    270deg,
    var(--color-highlight-muted),
    var(--color-bg-card) 45%
  );
}

/* 消息标签：等宽字体 + HUD 前缀 */
.chat-message__label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 0.375rem;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.chat-message--assistant .chat-message__label {
  color: var(--color-text-accent);
}

.chat-message--user .chat-message__label {
  color: var(--color-text-highlight);
}

.chat-message__prefix {
  opacity: 0.65;
}

.chat-message__role {
  font-weight: 600;
}

/* 消息内容 */
.chat-message__content {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-text-body);
  white-space: pre-wrap;
  word-break: break-word;
}

/* 打字指示器：HUD 脉冲风格 */
.typing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 6px var(--color-accent);
  animation: typingPulse 1.4s ease-in-out infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingPulse {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  30% {
    opacity: 1;
    transform: scale(1.25);
  }
}

/* 尊重减少动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .chat-message,
  .chat-stream__header-dot,
  .typing-indicator span {
    animation: none;
  }
}
</style>
