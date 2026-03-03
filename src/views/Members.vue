<template>
  <PageTitle
    title="核心成员"
    subtitle="你可以在 src/data/siteContent.js 中维护成员数据，页面会自动渲染。"
  />

  <section class="grid members-grid">
    <article class="card member-card" v-for="item in members" :key="item.name">
      <p class="id">pilot profile</p>
      <h3>{{ item.name }}</h3>
      <p class="role">{{ item.role }}</p>
      <p>{{ item.intro }}</p>
    </article>
  </section>
</template>

<script setup>
import PageTitle from '@/components/common/PageTitle.vue'
import { members } from '@/data/siteContent'
</script>

<style scoped>
.members-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

h3 {
  margin: 0;
  letter-spacing: 0.05em;
}

.role {
  color: var(--accent-2);
  margin: 0.35rem 0;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
}

p {
  margin: 0;
  color: var(--text-muted);
}

.id {
  margin-bottom: 0.5rem;
  color: var(--accent);
  text-transform: uppercase;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
}

.member-card {
  position: relative;
  overflow: hidden;
}

.member-card::after {
  content: '';
  position: absolute;
  right: -30px;
  top: -30px;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(143, 215, 255, 0.26), transparent 70%);
}
</style>
