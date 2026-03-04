<template>
  <PageTitle
    title="加入我们"
    subtitle="这里可以填写招募条件、流程、常见问题与报名入口。"
  />

  <section class="grid join-grid">
    <article class="card join-card" :style="{ animationDelay: '0s' }">
      <div class="card-header">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <h3>招募条件</h3>
      </div>
      <ul class="requirement-list">
        <li v-for="(item, index) in requirements" :key="index">
          <span class="check-icon">✓</span>
          <span>{{ item }}</span>
        </li>
      </ul>
    </article>

    <article class="card join-card" :style="{ animationDelay: '0.15s' }">
      <div class="card-header">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <h3>加入流程</h3>
      </div>
      <ol class="process-list">
        <li v-for="(item, index) in process" :key="index">
          <span class="step-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="step-text">{{ item }}</span>
        </li>
      </ol>
    </article>
  </section>

  <section class="cta-section">
    <div class="cta-card">
      <div class="cta-content">
        <span class="cta-badge">ENLIST NOW</span>
        <h2>准备好加入了吗？</h2>
        <p>提交你的申请，开启星际冒险之旅</p>
      </div>
      <a href="#" class="btn btn-primary btn-lg">
        <span class="btn-text">提交申请</span>
        <span class="btn-arrow">→</span>
      </a>
    </div>
  </section>
</template>

<script setup>
import PageTitle from '@/components/common/PageTitle.vue'
import { ref } from 'vue'

const requirements = ref([
  '尊重团队协作与沟通规则',
  '愿意参加基础训练与复盘',
  '每周有稳定在线时间',
  '拥有基础的游戏设备与网络条件'
])

const process = ref([
  '提交申请信息',
  '完成语音面谈',
  '参与试训活动',
  '正式加入团队'
])
</script>

<style scoped>
.join-grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.join-card {
  animation: fadeInUp 0.6s ease both;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.header-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(95, 169, 255, 0.1);
  border: 1px solid rgba(143, 215, 255, 0.2);
  border-radius: 4px;
  color: var(--accent-2);
}

.header-icon svg {
  width: 22px;
  height: 22px;
}

h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.requirement-list,
.process-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.requirement-list li,
.process-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--line);
  color: var(--text-muted);
}

.requirement-list li:last-child,
.process-list li:last-child {
  border-bottom: none;
}

.check-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: rgba(78, 205, 196, 0.15);
  border: 1px solid rgba(78, 205, 196, 0.4);
  border-radius: 3px;
  color: var(--success);
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 2px;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 24px;
  background: rgba(95, 169, 255, 0.1);
  border: 1px solid rgba(143, 215, 255, 0.3);
  border-radius: 3px;
  color: var(--accent-2);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.step-text {
  flex: 1;
}

.cta-section {
  margin-top: 2.5rem;
}

.cta-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 2rem 2.5rem;
  background: linear-gradient(135deg, rgba(95, 169, 255, 0.1), rgba(143, 215, 255, 0.05));
  border: 1px solid rgba(143, 215, 255, 0.25);
  border-radius: 4px;
}

.cta-content {
  flex: 1;
}

.cta-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  background: var(--accent);
  color: #030810;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  border-radius: 2px;
  margin-bottom: 0.75rem;
}

.cta-content h2 {
  margin: 0 0 0.35rem;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.cta-content p {
  margin: 0;
  color: var(--text-muted);
}

.btn-lg {
  padding: 0.85rem 1.75rem;
  font-size: 0.85rem;
}

.btn-arrow {
  margin-left: 0.5rem;
  transition: transform var(--transition-fast);
}

.btn-primary:hover .btn-arrow {
  transform: translateX(4px);
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

@media (max-width: 860px) {
  .cta-card {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }

  .cta-content {
    text-align: center;
  }
}
</style>
