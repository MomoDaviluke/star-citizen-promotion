<template>
  <PageTitle
    title="活动项目"
    subtitle="用于展示常规行动、专项训练、赛事等内容。"
  />

  <section class="grid projects-grid">
    <article class="card mission-card" v-for="item in projects" :key="item.name">
      <p class="tag">mission log</p>
      <h3>{{ item.name }}</h3>
      <p class="period">{{ item.period }}</p>
      <p>{{ item.description }}</p>
    </article>
  </section>
</template>

<script setup>
import PageTitle from '@/components/common/PageTitle.vue'
import { projects } from '@/data/siteContent'
</script>

<style scoped>
.projects-grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

h3 {
  margin: 0;
  letter-spacing: 0.04em;
}

.period {
  color: var(--accent-2);
  margin: 0.4rem 0;
  text-transform: uppercase;
  font-size: 0.78rem;
  letter-spacing: 0.09em;
}

p {
  margin-bottom: 0;
  color: var(--text-muted);
}

.tag {
  margin: 0 0 0.45rem;
  color: var(--accent);
  text-transform: uppercase;
  font-size: 0.67rem;
  letter-spacing: 0.13em;
}

.mission-card {
  border-left: 2px solid rgba(143, 215, 255, 0.5);
}
</style>
