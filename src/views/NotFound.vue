<!--
  @file 404 页面 — 信号丢失/舰船失联主题
  @version 10.0 - Cinematic Sci-Fi Spectacle
-->

<template>
  <div class="not-found">
    <!-- HUD 角标装饰 -->
    <div class="not-found__hud-tl" aria-hidden="true"></div>
    <div class="not-found__hud-br" aria-hidden="true"></div>

    <!-- 扫描线背景 -->
    <div class="not-found__scanlines" aria-hidden="true"></div>

    <div class="not-found__content">
      <!-- 信号丢失图标 -->
      <div class="not-found__signal" aria-hidden="true">
        <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <!-- 中心雷达 -->
          <circle cx="60" cy="60" r="8" opacity="0.4"/>
          <circle cx="60" cy="60" r="20" opacity="0.3"/>
          <circle cx="60" cy="60" r="35" opacity="0.2"/>
          <circle cx="60" cy="60" r="52" opacity="0.1"/>
          <!-- 断裂信号线 -->
          <path d="M60 12v16" opacity="0.6"/>
          <path d="M60 92v16" opacity="0.3"/>
          <!-- 斜杠 — 表示中断 -->
          <path d="M30 30L90 90" stroke-width="2" opacity="0.5" stroke="var(--color-status-danger)"/>
        </svg>
      </div>

      <span class="not-found__code font-data">ERROR 404</span>
      <h1 class="not-found__title">SIGNAL LOST</h1>
      <p class="not-found__subtitle">通讯信号丢失 · 目标坐标未在星图数据库中找到</p>
      <p class="not-found__desc">你访问的页面可能已脱离轨道、被黑洞吞噬，或从未被探索过。建议返回基地重新导航。</p>

      <div class="not-found__actions">
        <RouterLink to="/" class="not-found__btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"/></svg>
          返回基地
        </RouterLink>
        <RouterLink to="/fleet" class="not-found__btn-secondary">
          浏览舰队
        </RouterLink>
      </div>

      <!-- 故障码装饰 -->
      <div class="not-found__fault-code font-data">
        <span class="not-found__fault-dot"></span>
        FAULT CODE: NAV-404-SECTOR-UNKNOWN
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 300px);
  min-height: calc(100dvh - 300px);
  padding: var(--space-8) var(--space-4);
  text-align: center;
  overflow: hidden;
}

/* 扫描线背景 */
.not-found__scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    180deg,
    transparent 0px,
    transparent 3px,
    rgba(var(--raw-cyan-rgb), 0.02) 3px,
    rgba(var(--raw-cyan-rgb), 0.02) 4px
  );
  pointer-events: none;
}

/* HUD 角标 */
.not-found__hud-tl,
.not-found__hud-br {
  position: absolute;
  width: 60px;
  height: 60px;
  border: 1px solid var(--color-border-accent);
  opacity: 0.3;
}

.not-found__hud-tl {
  top: 2rem;
  left: 2rem;
  border-right: none;
  border-bottom: none;
}

.not-found__hud-br {
  bottom: 2rem;
  right: 2rem;
  border-left: none;
  border-top: none;
}

.not-found__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  max-width: 500px;
}

/* 信号丢失图标 */
.not-found__signal {
  width: 120px;
  height: 120px;
  color: var(--color-status-danger);
  margin-bottom: var(--space-2);
  animation: signal-pulse 2s ease-in-out infinite;
}

@keyframes signal-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.03); }
}

.not-found__code {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-status-danger);
  letter-spacing: 0.3em;
  opacity: 0.8;
}

.not-found__title {
  font-family: var(--font-display);
  font-size: var(--text-5xl);
  font-weight: 700;
  color: var(--color-text-heading);
  letter-spacing: -0.02em;
  line-height: 1;
  margin: 0;
}

.not-found__subtitle {
  font-size: var(--text-sm);
  color: var(--color-accent);
  letter-spacing: 0.1em;
  margin: 0;
}

.not-found__desc {
  font-size: var(--text-md);
  color: var(--color-text-body);
  line-height: 1.7;
  margin: var(--space-2) 0 var(--space-4);
}

.not-found__actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
}

.not-found__btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: var(--color-accent);
  color: var(--color-bg-deep);
  font-weight: 600;
  font-size: var(--text-sm);
  letter-spacing: 0.05em;
  border-radius: var(--radius-md);
  transition: all var(--motion-duration-normal) var(--motion-ease-smooth);
}

.not-found__btn-primary:hover {
  background: var(--color-accent-bright);
  box-shadow: 0 0 24px rgba(var(--raw-cyan-rgb), 0.4);
  transform: translateY(-2px);
}

.not-found__btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: var(--space-3) var(--space-6);
  border: 1px solid var(--color-border-hover);
  color: var(--color-text-heading);
  font-weight: 500;
  font-size: var(--text-sm);
  letter-spacing: 0.05em;
  border-radius: var(--radius-md);
  transition: all var(--motion-duration-normal) var(--motion-ease-smooth);
}

.not-found__btn-secondary:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

/* 故障码 */
.not-found__fault-code {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-6);
  font-size: var(--text-xs);
  color: var(--color-text-hint);
  letter-spacing: 0.15em;
}

.not-found__fault-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-status-danger);
  animation: fault-blink 1s ease-in-out infinite;
}

@keyframes fault-blink {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; box-shadow: 0 0 8px var(--color-status-danger); }
}

@media (prefers-reduced-motion: reduce) {
  .not-found__signal,
  .not-found__fault-dot {
    animation: none;
  }
}
</style>
