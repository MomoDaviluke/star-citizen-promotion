<template>
  <PageTitle
    title="联系我们"
    subtitle="替换为你们的 Discord、QQ群、邮箱、B站/微博等官方渠道。"
  />

  <section class="grid contact-grid">
    <article class="card contact-card">
      <h3>联系渠道（占位）</h3>
      <p>Discord：待填</p>
      <p>邮箱：team@example.com</p>
      <p>QQ群：待填</p>
    </article>

    <article class="card contact-card">
      <h3>合作说明（占位）</h3>
      <p>可放置合作方向、商务联系窗口与响应时间说明。</p>
    </article>
  </section>
</template>

<script setup>
import PageTitle from '@/components/common/PageTitle.vue'
</script>

<style scoped>
.contact-grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

h3 {
  margin-top: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

p {
  margin: 0.25rem 0;
  color: var(--text-muted);
}

.contact-card {
  border-top: 2px solid rgba(143, 215, 255, 0.45);
}
</style>
