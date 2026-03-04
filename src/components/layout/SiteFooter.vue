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

    <div class="container footer-inner">
      <!-- 左侧内容区 -->
      <div class="footer-content">
        <div class="footer-brand">
          <span class="brand-icon">◆</span>
          <span class="brand-text">星际公民团队站</span>
        </div>
        <p class="footer-desc">本页面为团队介绍框架，可按需替换为正式文案与媒体资源。</p>
      </div>

      <!-- 右侧元信息区 -->
      <div class="footer-meta">
        <!-- 快速链接 -->
        <div class="footer-links">
          <RouterLink to="/about">关于我们</RouterLink>
          <RouterLink to="/join">加入团队</RouterLink>
          <RouterLink to="/contact">联系方式</RouterLink>
        </div>

        <!-- 版权声明 -->
        <p class="copyright">© {{ new Date().getFullYear() }} UEE Organization Portal</p>
      </div>
    </div>

    <!-- 顶部分隔线 -->
    <div class="footer-line"></div>
  </footer>
</template>

<style scoped>
/*
 * ============================================
 * 页脚容器样式
 * ============================================
 */
.site-footer {
  position: relative;
  border-top: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(4, 8, 16, 0.8), rgba(2, 5, 10, 0.95));
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
  width: 400px;
  height: 100px;
  background: radial-gradient(ellipse, rgba(95, 169, 255, 0.1), transparent 70%);
  pointer-events: none;
}

/*
 * --------------------------------------------
 * 顶部分隔线
 * 渐变发光效果
 * --------------------------------------------
 */
.footer-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(143, 215, 255, 0.3), transparent);
}

/*
 * --------------------------------------------
 * 页脚内部布局
 * --------------------------------------------
 */
.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 1.5rem 0;
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
  color: var(--accent-2);
  font-size: 0.5rem;
}

.brand-text {
  color: var(--text);
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.footer-desc {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.8rem;
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
  gap: 0.75rem;
}

/*
 * --------------------------------------------
 * 快速链接样式
 * --------------------------------------------
 */
.footer-links {
  display: flex;
  gap: 1.5rem;
}

.footer-links a {
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: color var(--transition-fast);
}

.footer-links a:hover {
  color: var(--accent-2);
}

/*
 * --------------------------------------------
 * 版权声明样式
 * --------------------------------------------
 */
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
    flex-direction: column;
    text-align: center;
    gap: 1.25rem;
  }

  .footer-content {
    align-items: center;
  }

  .footer-meta {
    align-items: center;
  }

  .footer-links {
    gap: 1rem;
  }
}
</style>
