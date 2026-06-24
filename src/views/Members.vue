<!--
  @file 核心成员视图组件
  @description Cinematic Sci-Fi — 展示团队核心成员信息
  @version 10.0 - Cinematic Sci-Fi
-->

<template>
  <div class="members-page">

    <!-- Page header -->
    <section class="page-header">
      <div class="container">
        <span class="pill-badge">// PILOT DATABASE</span>
        <h1>飞行员档案</h1>
      </div>
    </section>

    <!-- Stats bar -->
    <section class="members-stats">
      <div class="container">
        <div class="stats-bar">
          <div v-for="stat in memberStats" :key="stat.label" class="stats-bar__item">
            <span class="stats-bar__value font-data">{{ stat.value }}</span>
            <span class="stats-bar__label font-data">{{ stat.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Member grid -->
    <section class="members-grid-section section">
      <div class="container">
        <div class="members-grid">
          <div v-for="(member, i) in members" :key="member.name" class="member-card">
            <!-- Double-Bezel outer shell -->
            <div class="bezel-shell">
              <!-- Double-Bezel inner core -->
              <div class="bezel-core">
                <!-- Avatar with conic-gradient ring -->
                <div class="member-card__avatar-ring">
                  <div class="member-card__avatar">
                    <img :src="member.avatar || '/images/pilots/default-avatar.svg'" :alt="member.name" loading="lazy" />
                  </div>
                </div>

                <div class="member-card__info">
                  <h3 class="member-card__name">{{ member.name }}</h3>
                  <span class="member-card__callsign font-data">{{ member.callsign || `PILOT-${String(i + 1).padStart(3, '0')}` }}</span>
                  <span class="amber-pill">{{ member.role }}</span>
                </div>

                <!-- Stats row -->
                <div class="member-card__stats">
                  <div class="member-card__stat">
                    <span class="member-card__stat-val font-data">{{ 100 + i * 28 }}</span>
                    <span class="member-card__stat-lbl font-data">MISSIONS</span>
                  </div>
                  <div class="member-card__stat">
                    <span class="member-card__stat-val font-data">{{ ['A+', 'A', 'B+', 'A', 'A+'][i % 5] }}</span>
                    <span class="member-card__stat-lbl font-data">RATING</span>
                  </div>
                  <div class="member-card__stat">
                    <span class="member-card__stat-val font-data">{{ 200 + i * 45 }}</span>
                    <span class="member-card__stat-lbl font-data">HOURS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const memberStats = ref([
  { value: '128', label: '活跃成员' },
  { value: '24', label: '核心成员' },
  { value: '6', label: '指挥官' },
  { value: '4', label: '小队' },
])

const members = ref([])

onMounted(async () => {
  try {
    const { dataService } = await import('@/services/dataService')
    const data = await dataService.getMembers()
    members.value = Array.isArray(data) ? data : data?.data || []
  } catch {
    members.value = []
  }
})
</script>

<style scoped>
/* ── Page Header ── */
.page-header {
  padding: var(--space-16) 0 var(--space-8);
  background: linear-gradient(180deg, rgba(74, 158, 255, 0.04) 0%, transparent 100%);
}

.page-header h1 {
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

/* ── Stats Bar ── */
.stats-bar {
  display: flex;
  gap: var(--space-8);
  padding: var(--space-5) var(--space-6);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-2xl);
}

.stats-bar__item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
  text-align: center;
}

.stats-bar__value {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.02em;
}

.stats-bar__label {
  font-size: var(--text-xs);
  color: var(--color-accent);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

/* ── Double-Bezel Card ── */
.bezel-shell {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-2xl);
  padding: 6px;
  transition: border-color var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out),
              transform var(--duration-normal) var(--ease-out);
}

.member-card:hover .bezel-shell {
  border-color: rgba(74, 158, 255, 0.3);
  box-shadow: 0 0 32px rgba(74, 158, 255, 0.15), 0 0 60px rgba(74, 158, 255, 0.06), 0 8px 32px rgba(0, 0, 0, 0.4);
  transform: translateY(-8px);
}

.bezel-core {
  background: var(--color-bg-card);
  border-radius: calc(var(--radius-2xl) - 4px);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-4);
}

/* ── Member Grid ── */
.members-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
}

/* ── Avatar with rotating conic-gradient ring ── */
.member-card__avatar-ring {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  padding: 3px;
  background: conic-gradient(
    from 0deg,
    var(--color-accent),
    rgba(74, 158, 255, 0.3) 20%,
    transparent 40%,
    var(--color-highlight),
    rgba(255, 179, 0, 0.3) 70%,
    transparent 80%,
    var(--color-accent)
  );
  animation: ringRotate 6s linear infinite;
  filter: drop-shadow(0 0 8px rgba(74, 158, 255, 0.3)) drop-shadow(0 0 16px rgba(255, 179, 0, 0.15));
}

@keyframes ringRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.member-card__avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-bg-deep);
}

.member-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ── Member Info ── */
.member-card__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.member-card__name {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  color: #fff;
  margin-bottom: 0;
  letter-spacing: -0.01em;
}

.member-card__callsign {
  font-size: var(--text-xs);
  color: var(--color-accent);
  letter-spacing: 0.15em;
}

.amber-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 12px;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-highlight);
  border: 1px solid rgba(255, 179, 0, 0.3);
  border-radius: 999px;
  background: rgba(255, 179, 0, 0.1);
}

/* ── Stats Row ── */
.member-card__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  width: 100%;
}

.member-card__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.member-card__stat-val {
  font-size: var(--text-base);
  font-weight: 700;
  color: #fff;
}

.member-card__stat-lbl {
  font-size: 0.625rem;
  color: var(--color-text-dim);
  letter-spacing: 0.12em;
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .members-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-bar {
    flex-wrap: wrap;
    gap: var(--space-5);
  }

  .stats-bar__item {
    flex: 0 0 calc(50% - var(--space-4));
  }
}

@media (max-width: 768px) {
  .members-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    padding: var(--space-10) 0 var(--space-6);
  }

  .page-header h1 {
    font-size: var(--text-3xl);
  }

  .stats-bar__value {
    font-size: var(--text-xl);
  }
}
</style>
