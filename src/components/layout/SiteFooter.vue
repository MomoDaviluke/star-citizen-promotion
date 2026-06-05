<!--
 * @fileoverview 网站底部组件
 * @description 提供网站页脚，包含品牌信息、快速链接和版权声明
 * @module components/layout/SiteFooter
 * @example
 * <SiteFooter />
 -->

<template>
  <footer class="site-footer">
    <!-- 顶部发光效果 -->
    <div class="footer-glow"></div>

    <!-- 扫描线装饰 -->
    <div class="footer-scanline"></div>

    <div class="container footer-inner">
      <!-- 左侧内容区 -->
      <div class="footer-content">
        <div class="footer-brand">
          <span class="brand-icon">◆</span>
          <span class="brand-text font-tech">星际公民战队</span>
        </div>
        <p class="footer-desc">本页面为团队介绍框架，可按需替换为正式文案与媒体资源。</p>
        <div class="footer-status">
          <span class="status-dot"></span>
          <span class="status-text font-data">SYSTEM OPERATIONAL</span>
        </div>
      </div>

      <!-- 中间快速链接 -->
      <div class="footer-nav">
        <span class="footer-nav-title font-data">QUICK ACCESS</span>
        <div class="footer-links">
          <RouterLink to="/about">关于我们</RouterLink>
          <RouterLink to="/fleet">舰队展示</RouterLink>
          <RouterLink to="/join">加入团队</RouterLink>
          <RouterLink to="/contact">联系方式</RouterLink>
        </div>
      </div>

      <!-- 右侧元信息区 -->
      <div class="footer-meta">
        <span class="footer-id font-data">SYS.PORTAL // V.3.0</span>
        <p class="copyright">© {{ new Date().getFullYear() }} UEE Organization Portal</p>
      </div>
    </div>

    <!-- 顶部分隔线 -->
    <div class="footer-line"></div>

    <!-- 装饰边角 -->
    <div class="footer-corner footer-corner--bl"></div>
    <div class="footer-corner footer-corner--br"></div>
  </footer>
</template>

<style scoped>
/*
 * ============================================
 * 页脚容器样式 — Stellar Nexus 风格
 * ============================================
 */
.site-footer {
  position: relative;
  border-top: 1px solid var(--border-subtle);
  background: linear-gradient(180deg, rgba(4, 8, 16, 0.85), rgba(2, 5, 10, 0.95));
  overflow: hidden;
}

/*
 * --------------------------------------------
 * 顶部发光效果
 * --------------------------------------------
 */
.footer-glow {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  height: 120px;
  background: radial-gradient(ellipse, rgba(124, 58, 237, 0.08), transparent 70%);
  pointer-events: none;
}

/*
 * --------------------------------------------
 * 扫描线装饰
 * --------------------------------------------
 */
.footer-scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(6, 182, 212, 0.015) 2px,
    rgba(6, 182, 212, 0.015) 4px
  );
  pointer-events: none;
}

/*
 * --------------------------------------------
 * 顶部分隔线 — 渐变发光效果
 * --------------------------------------------
 */
.footer-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--nebula-purple), var(--amber-primary), transparent);
  opacity: 0.5;
}

/*
 * --------------------------------------------
 * 装饰边角
 * --------------------------------------------
 */
.footer-corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: var(--amber-primary);
  border-style: solid;
  opacity: 0.4;
}

.footer-corner--bl {
  bottom: 4px;
  left: 4px;
  border-width: 0 0 2px 2px;
}

.footer-corner--br {
  bottom: 4px;
  right: 4px;
  border-width: 0 2px 2px 0;
}

/*
 * --------------------------------------------
 * 页脚内部布局 — 三栏
 * --------------------------------------------
 */
.footer-inner {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 2rem;
  padding: 2rem 0;
}

/*
 * --------------------------------------------
 * 左侧内容区样式
 * --------------------------------------------
 */
.footer-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-icon {
  color: var(--amber-primary);
  font-size: 0.5rem;
}

.brand-text {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.footer-desc {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  max-width: 280px;
}

.footer-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--status-success);
  box-shadow: 0 0 6px var(--status-success);
  animation: status-blink 2s ease-in-out infinite;
}

@keyframes status-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.status-text {
  font-size: 0.6rem;
  color: var(--text-muted);
  letter-spacing: 0.15em;
}

/*
 * --------------------------------------------
 * 中间快速链接
 * --------------------------------------------
 */
.footer-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.footer-nav-title {
  font-size: 0.6rem;
  color: var(--text-muted);
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.footer-links {
  display: flex;
  gap: 1.5rem;
}

.footer-links a {
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-decoration: none;
  transition: color var(--transition-fast);
  position: relative;
}

.footer-links a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--amber-primary);
  transition: width 0.3s ease;
}

.footer-links a:hover {
  color: var(--amber-primary);
}

.footer-links a:hover::after {
  width: 100%;
}

/*
 * --------------------------------------------
 * 右侧元信息区样式
 * --------------------------------------------
 */
.footer-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.footer-id {
  font-size: 0.6rem;
  color: var(--nebula-violet);
  letter-spacing: 0.15em;
  opacity: 0.6;
}

.copyright {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/*
 * --------------------------------------------
 * 响应式布局：移动端样式
 * --------------------------------------------
 */
@media (max-width: 860px) {
  .footer-inner {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 1.5rem;
  }

  .footer-content {
    align-items: center;
  }

  .footer-desc {
    max-width: none;
  }

  .footer-nav {
    align-items: center;
  }

  .footer-meta {
    align-items: center;
  }

  .footer-links {
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }
}
</style>
