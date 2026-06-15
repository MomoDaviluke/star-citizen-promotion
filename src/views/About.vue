<!--
  @file 关于我们视图组件
  @description Cinematic Sci-Fi — 团队介绍、数据面板、发展历程
  @version 10.0 - Cinematic Sci-Fi
-->

<template>
  <div class="about-page">

    <!-- Hero: Full-width 50vh background -->
    <section class="hero">
      <div class="hero__bg"></div>
      <div class="hero__overlay"></div>
      <div class="hero__content container">
        <span class="pill-badge">// ARCHIVE</span>
        <h1>关于我们</h1>
      </div>
    </section>

    <!-- Two-column: Dossier + Stats -->
    <section class="dossier-section section">
      <div class="container">
        <div class="two-col">
          <!-- Left 60%: Dossier cards -->
          <div class="two-col__left">
            <div v-for="(item, i) in aboutItems" :key="item.title" class="dossier-card">
              <!-- Double-Bezel outer shell -->
              <div class="bezel-shell">
                <!-- Double-Bezel inner core -->
                <div class="bezel-core">
                  <span class="dossier-card__label font-data">DOSSIER-{{ String(i + 1).padStart(2, '0') }}</span>
                  <h3 class="dossier-card__title">{{ item.title }}</h3>
                  <p class="dossier-card__text">{{ item.content }}</p>
                  <!-- Watermark index -->
                  <span class="dossier-card__watermark">{{ String(i + 1).padStart(2, '0') }}</span>
                </div>
              </div>
              <!-- Left cyan border with glow -->
              <div class="dossier-card__border-glow"></div>
            </div>
          </div>

          <!-- Right 40%: Sticky data panel -->
          <div class="two-col__right">
            <div class="data-panel">
              <div class="data-panel__inner">
                <div v-for="stat in teamMetrics" :key="stat.label" class="data-stat">
                  <span class="data-stat__value font-data">{{ stat.value }}</span>
                  <span class="data-stat__label font-data">{{ stat.label }}</span>
                  <div class="data-stat__bar">
                    <div class="data-stat__bar-fill" :style="{ width: stat.barWidth + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Timeline -->
    <section class="timeline-section section">
      <div class="container">
        <div class="section-header">
          <span class="pill-badge">TIMELINE.LOG</span>
          <h2>发展历程</h2>
        </div>

        <div class="timeline">
          <div v-for="(item, i) in timeline" :key="i" class="timeline-node">
            <div class="timeline-node__dot"></div>
            <div v-if="i < timeline.length - 1" class="timeline-node__line"></div>
            <div class="timeline-node__content">
              <span class="timeline-node__date font-data">{{ item.date }}</span>
              <h4 class="timeline-node__title">{{ item.title }}</h4>
              <p class="timeline-node__desc">{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const teamMetrics = ref([
  { value: '128', label: 'ACTIVE MEMBERS', barWidth: 85 },
  { value: '47', label: 'MISSIONS', barWidth: 62 },
  { value: '36', label: 'SHIPS', barWidth: 48 },
  { value: '87%', label: 'WIN RATE', barWidth: 87 },
])

const aboutItems = ref([
  { title: '我们的使命', content: '打造星际公民中最专业、最有凝聚力的战队。我们追求卓越的团队协作，在每一次任务中展现专业素养。' },
  { title: '我们的文化', content: '开放、包容、互助。无论你是新手还是老兵，都能在这里找到属于自己的位置，与志同道合的飞行员一起成长。' },
  { title: '我们的优势', content: '完善的指挥体系、丰富的任务经验、专业的训练计划。从商船护航到大规模舰队战，我们都能胜任。' },
])

const timeline = ref([
  { date: '2020.03', title: '战队成立', desc: '五名志同道合的飞行员在 Stanton 星系相遇，决定组建战队。' },
  { date: '2020.09', title: '首次大规模行动', desc: '组织 30 人舰队完成首次商船护航任务，确立了战队的核心作战模式。' },
  { date: '2021.06', title: '成员突破 50', desc: '战队规模持续扩大，建立了完善的招募和培训体系。' },
  { date: '2022.01', title: '舰队编制完成', desc: '完成主力舰队编制，涵盖战斗、运输、采矿、侦察四大类别。' },
  { date: '2023.08', title: '百人里程碑', desc: '活跃成员突破 100 人，成为星际公民社区中最具影响力的战队之一。' },
  { date: '2024.12', title: '新征程', desc: '持续扩展行动范围，探索 Pyro 星系，开启战队发展的新篇章。' },
])
</script>

<style scoped>
/* ── Hero ── */
.hero {
  position: relative;
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero__bg {
  position: absolute;
  inset: 0;
  background: url('/images/sc/sc-about.jpg') center / cover no-repeat;
}

.hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 5, 8, 0.8) 0%, rgba(5, 5, 8, 0.95) 100%);
}

.hero__content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.hero__content h1 {
  font-size: var(--text-4xl);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #fff;
  margin-top: var(--space-3);
}

/* ── Pill Badge ── */
.pill-badge {
  display: inline-block;
  padding: 6px 20px;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-accent);
  border: 1px solid rgba(74, 158, 255, 0.3);
  border-radius: 999px;
  background: rgba(74, 158, 255, 0.08);
}

/* ── Two-column layout ── */
.two-col {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: var(--space-12);
  align-items: start;
}

/* ── Double-Bezel Card ── */
.bezel-shell {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-2xl);
  padding: 6px;
}

.bezel-core {
  background: var(--color-bg-card);
  border-radius: calc(var(--radius-2xl) - 4px);
  padding: var(--space-6);
  position: relative;
  overflow: hidden;
}

/* ── Dossier Card ── */
.dossier-card {
  position: relative;
  margin-bottom: var(--space-5);
}

.dossier-card:last-child {
  margin-bottom: 0;
}

.dossier-card__label {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-accent);
  letter-spacing: 0.2em;
  margin-bottom: var(--space-2);
}

.dossier-card__title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: #fff;
  margin-bottom: var(--space-3);
  letter-spacing: -0.02em;
}

.dossier-card__text {
  font-size: var(--text-base);
  color: var(--color-text-body);
  line-height: 1.8;
  max-width: 55ch;
}

.dossier-card__watermark {
  position: absolute;
  right: var(--space-5);
  bottom: -0.2em;
  font-family: var(--font-display);
  font-size: 8rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.03);
  line-height: 1;
  pointer-events: none;
  user-select: none;
}

.dossier-card__border-glow {
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: var(--color-accent);
  border-radius: 1px;
  box-shadow: 0 0 12px rgba(74, 158, 255, 0.7), 0 0 32px rgba(74, 158, 255, 0.3), 0 0 60px rgba(74, 158, 255, 0.1);
}

/* ── Data Panel (Sticky) ── */
.data-panel {
  position: sticky;
  top: var(--space-6);
}

.data-panel__inner {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-2xl);
  padding: 6px;
}

.data-panel__inner > .data-stat:first-child .data-stat__inner {
  border-radius: calc(var(--radius-2xl) - 4px) calc(var(--radius-2xl) - 4px) 0 0;
}

.data-panel__inner > .data-stat:last-child .data-stat__inner {
  border-radius: 0 0 calc(var(--radius-2xl) - 4px) calc(var(--radius-2xl) - 4px);
}

.data-stat {
  padding: 6px;
}

.data-stat:first-child {
  padding-top: 6px;
}

.data-stat__inner {
  background: var(--color-bg-card);
  padding: var(--space-5);
}

.data-stat__value {
  display: block;
  font-size: var(--text-5xl);
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.03em;
  line-height: 1.1;
  text-shadow: 0 0 20px rgba(74, 158, 255, 0.25), 0 0 40px rgba(74, 158, 255, 0.1);
}

.data-stat__label {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-accent);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-top: var(--space-1);
  margin-bottom: var(--space-3);
}

.data-stat__bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
}

.data-stat__bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent), rgba(74, 158, 255, 0.4));
  border-radius: 2px;
  transition: width 0.8s var(--ease-smooth);
}

/* ── Timeline ── */
.timeline-section {
  padding-top: 0;
}

.section-header {
  margin-bottom: var(--space-8);
}

.section-header h2 {
  font-size: var(--text-3xl);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-top: var(--space-3);
  margin-bottom: 0;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 700px;
}

.timeline-node {
  display: flex;
  gap: var(--space-5);
  padding-bottom: var(--space-6);
  position: relative;
}

.timeline-node__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent);
  flex-shrink: 0;
  margin-top: 4px;
  box-shadow: 0 0 12px rgba(74, 158, 255, 0.5), 0 0 32px rgba(74, 158, 255, 0.2);
}

.timeline-node__line {
  position: absolute;
  left: 6px;
  top: 22px;
  bottom: 0;
  width: 1px;
  background: linear-gradient(180deg, rgba(74, 158, 255, 0.3), rgba(74, 158, 255, 0.05));
}

.timeline-node__content {
  flex: 1;
  padding-bottom: var(--space-2);
}

.timeline-node__date {
  font-size: var(--text-xs);
  color: var(--color-accent);
  letter-spacing: 0.15em;
  display: block;
  margin-bottom: var(--space-1);
}

.timeline-node__title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: #fff;
  margin-bottom: var(--space-1);
}

.timeline-node__desc {
  font-size: var(--text-sm);
  color: var(--color-text-body);
  line-height: 1.7;
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .two-col {
    grid-template-columns: 1fr;
    gap: var(--space-8);
  }

  .data-panel {
    position: static;
  }

  .data-panel__inner {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  .data-stat__value {
    font-size: var(--text-3xl);
  }
}

@media (max-width: 768px) {
  .hero {
    min-height: 40vh;
  }

  .hero__content h1 {
    font-size: var(--text-3xl);
  }

  .dossier-card__title {
    font-size: var(--text-xl);
  }

  .dossier-card__watermark {
    font-size: 5rem;
  }

  .data-panel__inner {
    grid-template-columns: 1fr 1fr;
  }

  .data-stat__value {
    font-size: var(--text-2xl);
  }
}
</style>
