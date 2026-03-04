<template>
  <PageTitle
    title="核心成员"
    subtitle="你可以在 src/data/siteContent.js 中维护成员数据，页面会自动渲染。"
  />

  <section class="grid members-grid">
    <article class="card member-card" v-for="(item, index) in members" :key="item.name" :style="{ animationDelay: `${index * 0.1}s` }">
      <div class="member-header">
        <div class="member-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
          </svg>
        </div>
        <div class="member-status">
          <span class="status-dot"></span>
          <span class="status-text">ONLINE</span>
        </div>
      </div>
      <div class="member-info">
        <p class="member-id">pilot profile</p>
        <h3>{{ item.name }}</h3>
        <p class="role">{{ item.role }}</p>
        <p class="intro">{{ item.intro }}</p>
      </div>
      <div class="member-footer">
        <div class="footer-stat">
          <span class="stat-value">128</span>
          <span class="stat-label">MISSIONS</span>
        </div>
        <div class="footer-divider"></div>
        <div class="footer-stat">
          <span class="stat-value">A+</span>
          <span class="stat-label">RATING</span>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup>
import PageTitle from '@/components/common/PageTitle.vue'
import { members } from '@/data/siteContent'
</script>

<style scoped>
.members-grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.member-card {
  display: flex;
  flex-direction: column;
  animation: fadeInUp 0.6s ease both;
}

.member-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.member-avatar {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(95, 169, 255, 0.15), rgba(143, 215, 255, 0.05));
  border: 1px solid rgba(143, 215, 255, 0.3);
  border-radius: 4px;
  color: var(--accent-2);
}

.member-avatar svg {
  width: 28px;
  height: 28px;
}

.member-status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.6rem;
  background: rgba(78, 205, 196, 0.1);
  border: 1px solid rgba(78, 205, 196, 0.3);
  border-radius: 3px;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: var(--success);
  border-radius: 50%;
  animation: statusPulse 2s ease-in-out infinite;
}

@keyframes statusPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(78, 205, 196, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(78, 205, 196, 0);
  }
}

.status-text {
  color: var(--success);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.member-info {
  flex: 1;
}

.member-id {
  margin: 0 0 0.35rem;
  color: var(--accent);
  text-transform: uppercase;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.15em;
}

h3 {
  margin: 0 0 0.35rem;
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.role {
  margin: 0 0 0.5rem;
  color: var(--accent-2);
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.intro {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

.member-footer {
  display: flex;
  align-items: center;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--line);
}

.footer-stat {
  flex: 1;
  text-align: center;
}

.footer-stat:first-child {
  text-align: left;
}

.footer-stat:last-child {
  text-align: right;
}

.stat-value {
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}

.stat-label {
  font-size: 0.6rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.footer-divider {
  width: 1px;
  height: 30px;
  background: var(--line);
  margin: 0 1rem;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
