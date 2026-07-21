<!--
  @file 404 页面
  @version 9.0 - Premium Restraint
-->

<template>
  <div class="not-found">
    <div class="not-found__content">
      <span class="not-found__code font-data">404</span>
      <h1>页面未找到</h1>
      <p class="not-found__desc">你访问的页面不存在或已被移除。</p>
      <RouterLink to="/" class="btn-primary">返回首页</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 300px);
  min-height: calc(100dvh - 300px);
  padding: var(--space-8) 0;
  text-align: center;
}

.not-found__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.not-found__code {
  font-size: 6rem;
  font-weight: 700;
  color: var(--color-accent);
  line-height: 1;
  opacity: 0.3;
}

.not-found h1 {
  margin-bottom: 0;
}

.not-found__desc {
  font-size: var(--text-md);
  color: var(--color-text-body);
  margin-bottom: var(--space-2);
}
</style>
