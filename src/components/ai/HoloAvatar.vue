<!--
  @file HoloAvatar 全息头像
  @description AI 指挥官全息头像，复用项目全息 HUD 视觉语言（青色配色 + 扫描线 + 脉冲环 + 网格）
  @note active 状态下视觉增强：更亮配色、更强光晕、更快脉冲与扫描；颜色全部走项目 CSS 变量
-->
<template>
  <div
    class="holo-avatar"
    :class="{ active: isActive }"
    role="img"
    :aria-label="isActive ? 'AI 指挥官在线，全息头像已激活' : 'AI 指挥官待机，全息头像休眠'"
  >
    <div class="avatar-ring" aria-hidden="true"></div>
    <div class="avatar-core" aria-hidden="true">
      <div class="avatar-scanline"></div>
      <div class="avatar-grid"></div>
      <div class="avatar-icon">{{ isActive ? '◆' : '◇' }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isActive: { type: Boolean, default: false },
})
</script>

<style scoped>
.holo-avatar {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}

/* 脉冲环 —— 全息边框呼吸 */
.avatar-ring {
  position: absolute;
  inset: 0;
  border: 1px solid var(--color-border-accent);
  border-radius: 50%;
  animation: avatar-ring-pulse 3s var(--motion-ease-in-out) infinite;
}

.holo-avatar.active .avatar-ring {
  border-color: var(--color-accent-bright);
  box-shadow: var(--glow-accent);
  animation-duration: 1.6s;
}

/* 核心球体 —— 径向辉光 + 扫描线 + 网格 + 图标 */
.avatar-core {
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 50% 40%,
    var(--color-accent-muted) 0%,
    rgba(var(--raw-cyan-rgb), 0.05) 60%,
    transparent 100%
  );
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow var(--motion-duration-normal) var(--motion-ease-out),
              background var(--motion-duration-normal) var(--motion-ease-out);
}

.holo-avatar.active .avatar-core {
  background: radial-gradient(
    circle at 50% 40%,
    rgba(var(--raw-cyan-rgb), 0.28) 0%,
    rgba(var(--raw-cyan-rgb), 0.08) 60%,
    transparent 100%
  );
  box-shadow: var(--shadow-accent), inset 0 0 16px rgba(var(--raw-cyan-rgb), 0.15);
}

/* 扫描线 —— 自上而下扫过 */
.avatar-scanline {
  position: absolute;
  inset: 0;
  height: 30%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(var(--raw-cyan-rgb), 0.18) 50%,
    transparent 100%
  );
  animation: avatar-scan 2s var(--motion-ease-linear) infinite;
}

.holo-avatar.active .avatar-scanline {
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(var(--raw-cyan-rgb), 0.32) 50%,
    transparent 100%
  );
  animation-duration: 1.2s;
}

/* HUD 网格 —— 全息投影质感 */
.avatar-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--color-hud-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-hud-line) 1px, transparent 1px);
  background-size: 8px 8px;
  opacity: 0.5;
  transition: opacity var(--motion-duration-normal) var(--motion-ease-out);
}

.holo-avatar.active .avatar-grid {
  opacity: 0.75;
}

/* 中心图标 —— 菱形状态指示（实心=激活，空心=待机） */
.avatar-icon {
  position: relative;
  z-index: 1;
  font-family: var(--font-data);
  font-size: 1.5rem;
  line-height: 1;
  color: var(--color-accent-dim);
  text-shadow: 0 0 8px rgba(var(--raw-cyan-rgb), 0.4);
  transition: color var(--motion-duration-normal) var(--motion-ease-out),
              text-shadow var(--motion-duration-normal) var(--motion-ease-out),
              transform var(--motion-duration-normal) var(--motion-ease-out);
}

.holo-avatar.active .avatar-icon {
  color: var(--color-accent-bright);
  text-shadow:
    0 0 8px rgba(var(--raw-cyan-rgb), 0.7),
    0 0 20px rgba(var(--raw-cyan-rgb), 0.4);
  transform: scale(1.08);
}

@keyframes avatar-ring-pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.06); opacity: 0.85; }
}

@keyframes avatar-scan {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(333%); }
}

/* 尊重减少动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .avatar-ring,
  .avatar-scanline {
    animation: none;
  }
  .avatar-core,
  .avatar-grid,
  .avatar-icon {
    transition: none;
  }
  .avatar-icon {
    transform: none;
  }
}
</style>
