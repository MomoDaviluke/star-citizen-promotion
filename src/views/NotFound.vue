<template>
  <section class="card not-found">
    <p class="code">ERROR SIGNAL</p>
    <h1>404</h1>
    <p>页面不存在，可能已被移动或删除。</p>
    <RouterLink to="/" class="btn">返回首页</RouterLink>
  </section>
</template>

<style scoped>
.not-found {
  text-align: center;
  padding: 2.5rem 1rem;
  max-width: 680px;
  margin-inline: auto;
}

h1 {
  font-size: 3rem;
  margin: 0;
  color: var(--accent-2);
}

p {
  margin: 0.6rem 0 1rem;
  color: var(--text-muted);
}

.code {
  margin: 0;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.72rem;
}
</style>
