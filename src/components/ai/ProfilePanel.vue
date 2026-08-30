<!--
  @file ProfilePanel 实时画像面板
  @description AI 招募官对话过程中实时展示用户画像，复用项目全息 HUD 视觉语言（青色配色 + 等宽字体 + 脉冲指示 + 角标装饰 + 扫描加载）
  @note profile 由 useAiRecruiter composable 维护，结构：{ playStyle: string[], timeCommit: string, shipPref: string[], skillLevel: string }
        画像更新时通过 aria-live="polite" 播报，符合用户 DES-05 无障碍偏好；颜色全部走项目 CSS 变量
-->
<template>
  <section
    class="profile-panel"
    :class="{ 'profile-panel--active': hasData }"
    role="region"
    aria-label="用户画像面板"
  >
    <HudCorner position="top-left" size="sm" />
    <HudCorner position="bottom-right" size="sm" />

    <header class="profile-panel__header">
      <span
        class="profile-panel__status-dot"
        :class="{ active: hasData }"
        aria-hidden="true"
      ></span>
      <span class="profile-panel__header-label">// USER PROFILE</span>
      <span class="profile-panel__header-line" aria-hidden="true"></span>
    </header>

    <div class="profile-panel__body" aria-live="polite">
      <div v-if="profile.playStyle.length" class="profile-section">
        <span class="profile-section__label">玩法偏好</span>
        <div class="profile-section__tag-cloud">
          <span
            v-for="style in profile.playStyle"
            :key="style"
            class="profile-tag"
          >
            {{ styleLabels[style] || style }}
          </span>
        </div>
      </div>

      <div v-if="profile.timeCommit" class="profile-section">
        <span class="profile-section__label">时间投入</span>
        <span class="profile-section__value">{{ profile.timeCommit }}</span>
      </div>

      <div v-if="profile.shipPref.length" class="profile-section">
        <span class="profile-section__label">舰船偏好</span>
        <div class="profile-section__tag-cloud">
          <span
            v-for="ship in profile.shipPref"
            :key="ship"
            class="profile-tag"
          >{{ ship }}</span>
        </div>
      </div>

      <div v-if="profile.skillLevel" class="profile-section">
        <span class="profile-section__label">技能等级</span>
        <span class="profile-section__value">{{ skillLabels[profile.skillLevel] || profile.skillLevel }}</span>
      </div>

      <div v-if="!hasData" class="profile-panel__empty">
        <div class="profile-panel__empty-scan" aria-hidden="true"></div>
        <span class="profile-panel__empty-text">等待对话数据...</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { HudCorner } from '@/components/hud'

const props = defineProps({
  profile: { type: Object, required: true },
})

const styleLabels = {
  pvp: 'PVP 战斗',
  trade: '贸易货运',
  exploration: '探索',
  mining: '矿业',
}

const skillLabels = {
  beginner: '新手',
  intermediate: '进阶',
  veteran: '老手',
}

const hasData = computed(() => {
  return (
    props.profile.playStyle.length > 0 ||
    props.profile.timeCommit ||
    props.profile.shipPref.length > 0 ||
    props.profile.skillLevel
  )
})
</script>

<style scoped>
.profile-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
  font-family: var(--font-body);
  color: var(--color-text-body);
  overflow: hidden;
  transition: border-color var(--motion-duration-normal) var(--motion-ease-out),
              box-shadow var(--motion-duration-normal) var(--motion-ease-out);
}

/* 激活态：青色边框 + 微光晕 */
.profile-panel--active {
  border-color: var(--color-border-accent);
  box-shadow: var(--shadow-accent);
}

/* 顶部 HUD 条：脉冲点 + 等宽字体标签 + 渐隐线 */
.profile-panel__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(5, 5, 8, 0.5);
  border-bottom: 1px solid var(--color-hud-line);
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-text-accent);
}

/* 状态点：待机暗淡，激活青色脉冲 */
.profile-panel__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-dim);
  transition: background var(--motion-duration-normal) var(--motion-ease-out),
              box-shadow var(--motion-duration-normal) var(--motion-ease-out);
}

.profile-panel__status-dot.active {
  background: var(--color-accent);
  box-shadow: 0 0 8px var(--color-accent);
  animation: profile-dot-pulse 2s var(--motion-ease-in-out) infinite;
}

.profile-panel__header-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--color-hud-line), transparent);
}

/* 主体：垂直堆叠的画像区段 */
.profile-panel__body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.875rem 0.875rem 1rem;
  min-height: 4rem;
}

/* 区段：等宽小写标签 + 内容，更新时淡入 */
.profile-section {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  animation: fadeInUp var(--motion-duration-normal) var(--motion-ease-out) both;
}

.profile-section__label {
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  text-transform: lowercase;
  color: var(--color-text-label);
  opacity: 0.85;
}

.profile-section__value {
  font-family: var(--font-data);
  font-size: var(--text-sm);
  color: var(--color-text-accent);
  text-shadow: 0 0 6px rgba(var(--raw-cyan-rgb), 0.25);
}

/* 标签云：自动换行 */
.profile-section__tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

/* HUD 风格标签：青色边框 + 微光晕 */
.profile-tag {
  padding: 0.2rem 0.55rem;
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-sm);
  background: var(--color-accent-muted);
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.04em;
  color: var(--color-text-accent);
  box-shadow: 0 0 6px rgba(var(--raw-cyan-rgb), 0.08);
}

/* 空状态：扫描线掠过 + 等待文字 */
.profile-panel__empty {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 0.5rem;
  overflow: hidden;
}

.profile-panel__empty-scan {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(var(--raw-cyan-rgb), 0.12) 50%,
    transparent 100%
  );
  animation: profile-scan 2s var(--motion-ease-linear) infinite;
  pointer-events: none;
}

.profile-panel__empty-text {
  position: relative;
  z-index: 1;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-dim);
  opacity: 0.7;
}

@keyframes profile-dot-pulse {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes profile-scan {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

/* 尊重减少动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .profile-panel__status-dot.active,
  .profile-panel__empty-scan,
  .profile-section {
    animation: none;
  }
  .profile-panel {
    transition: none;
  }
}
</style>
