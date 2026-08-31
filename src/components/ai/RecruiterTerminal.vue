<!--
  @file RecruiterTerminal 全息终端容器
  @description AI 招募官容器组件，组合 HoloAvatar / ChatStream / QuickSuggestions / ProfilePanel + useAiRecruiter
  @note 复用项目全息 HUD 视觉语言（青色配色 + 角标 + 扫描线 + 等宽字体 + 玻璃质感），颜色全部走项目 CSS 变量
-->

<template>
  <Transition name="terminal">
    <div
      v-if="isOpen"
      class="recruiter-terminal"
      :class="{ fullscreen: isFullscreen }"
      role="dialog"
      aria-modal="true"
      aria-label="AI 招募官终端"
    >
      <!-- 四角 HUD 装饰 -->
      <HudCorner position="top-left" size="md" />
      <HudCorner position="top-right" size="md" />
      <HudCorner position="bottom-left" size="md" />
      <HudCorner position="bottom-right" size="md" />
      <!-- 局部扫描线叠加 -->
      <Scanline />

      <div class="terminal-header">
        <HoloAvatar :is-active="!activeStreaming" />
        <div class="header-info">
          <div class="header-title">// {{ isAgentMode ? 'AI 指挥官 · AGENT' : 'AI 指挥官' }}</div>
          <div class="header-status">
            <span
              class="header-status__dot"
              :class="{ online: !activeStreaming, streaming: activeStreaming }"
              aria-hidden="true"
            ></span>
            <span class="header-status__text">{{ activeStreaming ? '通讯中...' : '在线' }}</span>
          </div>
        </div>
        <!-- 模式切换：对话（RAG 会话）/ Agent（MCP 工具调用） -->
        <div class="mode-switch" role="tablist" aria-label="对话模式切换">
          <button
            class="mode-switch__btn"
            role="tab"
            :class="{ 'mode-switch__btn--active': mode === 'chat' }"
            :aria-selected="mode === 'chat'"
            :disabled="activeStreaming"
            @click="mode = 'chat'"
          >
            对话
          </button>
          <button
            class="mode-switch__btn"
            role="tab"
            :class="{ 'mode-switch__btn--active': mode === 'agent' }"
            :aria-selected="mode === 'agent'"
            :disabled="activeStreaming"
            @click="mode = 'agent'"
          >
            AGENT
          </button>
        </div>
        <div class="header-actions">
          <button
            class="action-btn"
            @click="toggleFullscreen"
            :title="isFullscreen ? '退出全屏' : '全屏'"
            :aria-label="isFullscreen ? '退出全屏' : '全屏'"
          >
            {{ isFullscreen ? '⊟' : '⊞' }}
          </button>
          <button
            class="action-btn"
            @click="close"
            title="关闭"
            aria-label="关闭终端"
          >
            ×
          </button>
        </div>
      </div>

      <div class="terminal-body">
        <div class="chat-area">
          <ChatStream :messages="activeMessages" :is-streaming="activeStreaming" />
        </div>
        <aside class="side-panel" v-if="!isAgentMode">
          <ProfilePanel :profile="profile" />
        </aside>
      </div>

      <div class="terminal-footer">
        <QuickSuggestions
          v-if="!isAgentMode"
          :suggestions="suggestions"
          :disabled="activeStreaming"
          @select="handleSuggestion"
        />
        <div class="input-area">
          <input
            v-model="inputText"
            type="text"
            class="chat-input"
            :placeholder="isAgentMode ? '// 问 Agent 一个问题（可查询实时舰队数据）...' : '// 输入消息...'"
            aria-label="输入消息给 AI 指挥官"
            :disabled="activeStreaming"
            maxlength="500"
            @keyup.enter="handleSend"
          />
          <button
            class="send-btn"
            :disabled="activeStreaming || !inputText.trim()"
            @click="handleSend"
          >
            {{ activeStreaming ? '...' : '发送' }}
          </button>
        </div>
        <div
          v-if="activeError"
          class="error-bar"
          role="alert"
          aria-live="assertive"
        >
          <span class="error-bar__prefix" aria-hidden="true">!</span>
          <span class="error-bar__text">{{ activeError }}</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import HoloAvatar from './HoloAvatar.vue'
import ChatStream from './ChatStream.vue'
import QuickSuggestions from './QuickSuggestions.vue'
import ProfilePanel from './ProfilePanel.vue'
import { HudCorner, Scanline } from '@/components/hud'
import { useAiRecruiter } from '@/composables/useAiRecruiter'
import { useMcpAgent } from '@/composables/useMcpAgent'
import { trackEvent } from '@/services/analyticsService'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const router = useRouter()
const isFullscreen = ref(false)
const inputText = ref('')

/** 对话模式：chat = RAG 会话（recruiter），agent = MCP 工具调用循环 */
const mode = ref('chat')
const isAgentMode = computed(() => mode.value === 'agent')

const {
  messages,
  profile,
  suggestions,
  isStreaming,
  error,
  initSession,
  sendMessage,
} = useAiRecruiter()

const agent = useMcpAgent()

/** 按模式切换到当前激活的会话状态 */
const activeMessages = computed(() => (isAgentMode.value ? agent.messages.value : messages.value))
const activeError = computed(() => (isAgentMode.value ? agent.error.value : error.value))
const activeStreaming = computed(() => (isAgentMode.value ? agent.isStreaming.value : isStreaming.value))

onMounted(() => {
  initSession()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

function close() {
  emit('close')
}

function handleKeydown(e) {
  if (e.key === 'Escape' && props.isOpen) {
    close()
  }
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || activeStreaming.value) return
  inputText.value = ''

  if (isAgentMode.value) {
    // 转化埋点：Agent 对话轮次（含工具调用轨迹）
    trackEvent('agent_chat_turn', { messageLength: text.length })
    await agent.sendMessage(text)
    return
  }

  await sendMessage(text)
  // 转化埋点：招募官对话轮次
  trackEvent('recruiter_chat_turn', { messageLength: text.length, totalMessages: messages.value.length })
}

async function handleSuggestion(text) {
  if (text === '提交申请') {
    // 转化埋点：通过招募官引导进入申请
    trackEvent('recruiter_profile_prefill', { via: 'suggestion' })
    // 跳转到申请页，携带画像数据
    const profileQuery = encodeURIComponent(JSON.stringify({
      playStyle: profile.playStyle,
      timeCommit: profile.timeCommit,
      shipPref: profile.shipPref,
      skillLevel: profile.skillLevel,
    }))
    router.push(`/join?ai_profile=${profileQuery}`)
    close()
    return
  }
  await sendMessage(text)
}
</script>

<style scoped>
/* ============================================================
 * 容器 —— 全息玻璃质感浮层（青色边框 + 角标 + 扫描线 + 玻璃模糊）
 * ============================================================ */
.recruiter-terminal {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  width: min(440px, calc(100vw - 3rem));
  height: min(620px, calc(100vh - 3rem));
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  background: var(--color-bg-overlay);
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-md);
  backdrop-filter: blur(var(--blur-header));
  -webkit-backdrop-filter: blur(var(--blur-header));
  box-shadow: var(--shadow-accent), 0 8px 40px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  transition:
    width var(--motion-duration-slow) var(--motion-ease-out),
    height var(--motion-duration-slow) var(--motion-ease-out),
    right var(--motion-duration-slow) var(--motion-ease-out),
    bottom var(--motion-duration-slow) var(--motion-ease-out),
    border-radius var(--motion-duration-slow) var(--motion-ease-out);
}

/* 全屏态：覆盖视口 */
.recruiter-terminal.fullscreen {
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  border-color: var(--color-border-accent);
}

/* ============================================================
 * 顶部 Header —— 等宽字体 HUD 风格（标题 + 状态指示 + 操作按钮）
 * ============================================================ */
.terminal-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  background: rgba(5, 5, 8, 0.6);
  border-bottom: 1px solid var(--color-hud-line);
}

.header-info {
  flex: 1;
  min-width: 0;
}

.header-title {
  font-family: var(--font-data);
  font-size: var(--text-sm);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-text-accent);
  text-shadow: 0 0 8px rgba(var(--raw-cyan-rgb), 0.3);
}

.header-status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.2rem;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-label);
}

.header-status__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  transition: background var(--motion-duration-normal) var(--motion-ease-out),
              box-shadow var(--motion-duration-normal) var(--motion-ease-out);
}

/* 在线：青色脉冲 */
.header-status__dot.online {
  background: var(--color-accent);
  box-shadow: 0 0 8px var(--color-accent);
  animation: status-pulse 2s var(--motion-ease-in-out) infinite;
}

/* 通讯中：琥珀色更快脉冲 */
.header-status__dot.streaming {
  background: var(--color-highlight);
  box-shadow: 0 0 8px var(--color-highlight);
  animation: status-pulse 1s var(--motion-ease-in-out) infinite;
}

.header-status__text {
  opacity: 0.85;
}

.header-actions {
  display: flex;
  gap: 0.375rem;
  flex-shrink: 0;
}

/* ============================================================
 * 模式切换（对话 / AGENT）—— HUD 分段按钮
 * ============================================================ */
.mode-switch {
  display: inline-flex;
  flex-shrink: 0;
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.mode-switch__btn {
  padding: 0.25rem 0.625rem;
  background: transparent;
  border: none;
  color: var(--color-text-label);
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background var(--motion-duration-fast) var(--motion-ease-out),
    color var(--motion-duration-fast) var(--motion-ease-out),
    box-shadow var(--motion-duration-fast) var(--motion-ease-out);
}

.mode-switch__btn + .mode-switch__btn {
  border-left: 1px solid var(--color-border-accent);
}

.mode-switch__btn--active {
  background: var(--color-accent-muted);
  color: var(--color-accent-bright);
  box-shadow: inset 0 0 12px rgba(var(--raw-cyan-rgb), 0.15);
}

.mode-switch__btn:not(.mode-switch__btn--active):hover:not(:disabled) {
  color: var(--color-text-accent);
}

.mode-switch__btn:focus-visible {
  outline: 1px solid var(--color-accent-bright);
  outline-offset: -1px;
}

.mode-switch__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* HUD 风格操作按钮：透明背景 + 青色边框 + hover 光晕 */
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-sm);
  color: var(--color-text-accent);
  font-family: var(--font-data);
  font-size: var(--text-md);
  line-height: 1;
  cursor: pointer;
  transition:
    background var(--motion-duration-fast) var(--motion-ease-out),
    border-color var(--motion-duration-fast) var(--motion-ease-out),
    box-shadow var(--motion-duration-fast) var(--motion-ease-out),
    color var(--motion-duration-fast) var(--motion-ease-out);
}

.action-btn:hover {
  background: var(--color-accent-muted);
  border-color: var(--color-accent);
  color: var(--color-accent-bright);
  box-shadow: var(--shadow-accent);
}

.action-btn:focus-visible {
  outline: 1px solid var(--color-accent-bright);
  outline-offset: 2px;
}

.action-btn:active {
  transform: translateY(1px);
}

/* ============================================================
 * 主体 —— 左侧聊天流 + 右侧画像面板
 * ============================================================ */
.terminal-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.chat-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.side-panel {
  flex-shrink: 0;
  width: 220px;
  border-left: 1px solid var(--color-hud-line);
  overflow-y: auto;
}

/* ============================================================
 * 底部 Footer —— 快捷建议 + 输入框 + 错误条
 * ============================================================ */
.terminal-footer {
  position: relative;
  z-index: 1;
  border-top: 1px solid var(--color-hud-line);
  background: rgba(5, 5, 8, 0.6);
}

.input-area {
  display: flex;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
}

/* HUD 终端输入框：等宽字体 + 青色光晕 focus */
.chat-input {
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-deep);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
  color: var(--color-text-body);
  font-family: var(--font-data);
  font-size: var(--text-sm);
  letter-spacing: 0.02em;
  transition:
    border-color var(--motion-duration-fast) var(--motion-ease-out),
    box-shadow var(--motion-duration-fast) var(--motion-ease-out);
}

.chat-input::placeholder {
  color: var(--color-text-dim);
  font-family: var(--font-data);
  opacity: 0.7;
}

.chat-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent), 0 0 12px rgba(var(--raw-cyan-rgb), 0.2);
}

.chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* HUD 发送按钮：青色边框 + hover 光晕填充 */
.send-btn {
  flex-shrink: 0;
  padding: 0.5rem 1.1rem;
  background: transparent;
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-sm);
  color: var(--color-text-accent);
  font-family: var(--font-data);
  font-size: var(--text-sm);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background var(--motion-duration-fast) var(--motion-ease-out),
    border-color var(--motion-duration-fast) var(--motion-ease-out),
    box-shadow var(--motion-duration-fast) var(--motion-ease-out),
    color var(--motion-duration-fast) var(--motion-ease-out);
}

.send-btn:hover:not(:disabled) {
  background: var(--color-accent-muted);
  border-color: var(--color-accent);
  color: var(--color-accent-bright);
  box-shadow: var(--shadow-accent);
}

.send-btn:focus-visible {
  outline: 1px solid var(--color-accent-bright);
  outline-offset: 2px;
}

.send-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 错误条：红色 HUD 警告条 */
.error-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(var(--raw-amber-rgb), 0.1);
  border-top: 1px solid var(--color-border-amber);
  color: var(--color-text-highlight);
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
}

.error-bar__prefix {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1px solid var(--color-highlight);
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.7rem;
  flex-shrink: 0;
}

.error-bar__text {
  flex: 1;
}

/* ============================================================
 * 开合过渡动画（Vue <Transition>）
 * ============================================================ */
.terminal-enter-active,
.terminal-leave-active {
  transition:
    opacity var(--motion-duration-normal) var(--motion-ease-out),
    transform var(--motion-duration-normal) var(--motion-ease-out);
}

.terminal-enter-from,
.terminal-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
}

/* 状态点脉冲 */
@keyframes status-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* ============================================================
 * 响应式：小屏幕隐藏画像面板，终端铺满可用空间
 * ============================================================ */
@media (max-width: 640px) {
  .recruiter-terminal:not(.fullscreen) {
    width: calc(100vw - 1rem);
    height: calc(100vh - 1rem);
    right: 0.5rem;
    bottom: 0.5rem;
  }
  .side-panel {
    display: none;
  }
}

/* ============================================================
 * 尊重减少动效偏好
 * ============================================================ */
@media (prefers-reduced-motion: reduce) {
  .recruiter-terminal,
  .recruiter-terminal.fullscreen {
    transition: none;
  }
  .terminal-enter-active,
  .terminal-leave-active {
    transition: opacity 0.01ms linear;
  }
  .terminal-enter-from,
  .terminal-leave-to {
    transform: none;
  }
  .header-status__dot.online,
  .header-status__dot.streaming {
    animation: none;
  }
  .action-btn,
  .chat-input,
  .send-btn,
  .mode-switch__btn {
    transition: none;
  }
}
</style>
