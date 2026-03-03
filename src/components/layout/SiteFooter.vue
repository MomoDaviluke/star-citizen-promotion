<template>
  <footer class="site-footer">
    <div class="container footer-inner">
      <p>© {{ new Date().getFullYear() }} 星际公民团队站</p>
      <p>本页面为团队介绍框架，可按需替换为正式文案与媒体资源。</p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  border-top: 1px solid var(--line);
  background: linear-gradient(90deg, rgba(16, 25, 42, 0.55), rgba(8, 14, 23, 0.75));
}

.footer-inner {
  padding: 1rem 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.footer-inner p {
  margin: 0.2rem 0;
}
</style>
