<template>
  <PageTitle
    title="团队介绍"
    subtitle="这里放团队成立背景、愿景与核心价值，建议配合时间线与关键里程碑。"
  />

  <section class="grid about-grid">
    <article class="card about-card">
      <h3>我们是谁</h3>
      <p>替换为团队简介：组织定位、风格、主要玩法方向。</p>
    </article>
    <article class="card about-card">
      <h3>我们的目标</h3>
      <p>替换为中长期目标：成员成长、行动规划、对外合作。</p>
    </article>
    <article class="card about-card">
      <h3>文化与纪律</h3>
      <p>替换为行为准则：沟通方式、活动出勤、协作流程。</p>
    </article>
  </section>
</template>

<script setup>
import PageTitle from '@/components/common/PageTitle.vue'
</script>

<style scoped>
.about-grid {
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
}

h3 {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

p {
  margin-bottom: 0;
  color: var(--text-muted);
}

.about-card {
  position: relative;
}

.about-card::before {
  content: '';
  position: absolute;
  left: 1rem;
  top: 1rem;
  width: 40px;
  height: 2px;
  background: var(--accent-2);
}
</style>
