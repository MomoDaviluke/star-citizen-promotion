<!--
  @file 联系我们视图组件
  @description Cinematic Sci-Fi — 联系方式与通讯频道
  @version 10.0 - Cinematic Sci-Fi Spectacle
-->

<template>
  <div class="contact-page">

    <section class="page-header">
      <div class="container">
        <span class="section-label">CONTACT</span>
        <h1>联系我们</h1>
        <p class="page-header__desc">通过以下频道与我们取得联系。</p>
      </div>
    </section>

    <section class="contact-content section">
      <div class="container">
        <div class="contact-grid">
          <!-- Channels -->
          <div class="contact-channels">
            <div v-for="channel in channels" :key="channel.name" class="bezel-card">
              <div class="bezel-card__inner channel-card">
                <div class="channel-card__icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div class="channel-card__info">
                  <h3 class="channel-card__name">{{ channel.name }}</h3>
                  <p class="channel-card__desc">{{ channel.description }}</p>
                  <a :href="channel.link" class="channel-card__link" target="_blank" rel="noopener">
                    {{ channel.linkText }}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Info panel -->
          <div class="contact-info-area">
            <div class="bezel-card">
              <div class="bezel-card__inner">
                <h3 class="contact-info__title">合作与咨询</h3>
                <p class="contact-info__text">
                  如果你有战队合作、媒体采访或其他事务需要联系我们，请通过 Discord 或邮件与我们取得联系。
                </p>
                <div class="contact-info__detail">
                  <span class="contact-info__label font-data">EMAIL</span>
                  <span class="contact-info__value">contact@star-citizen-team.cn</span>
                </div>
                <div class="contact-info__detail">
                  <span class="contact-info__label font-data">RESPONSE TIME</span>
                  <span class="contact-info__value">通常 24 小时内回复</span>
                </div>
                <div class="contact-info__detail">
                  <span class="contact-info__label font-data">ACTIVE HOURS</span>
                  <span class="contact-info__value">每日 18:00 - 02:00 CST</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Star Decoration -->
        <div class="star-field">
          <div v-for="n in 12" :key="n" class="star" :class="`star--${n}`"></div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const channels = ref([
  { name: 'Discord', description: '加入我们的 Discord 服务器，实时沟通，参与活动。', link: '#', linkText: '加入服务器' },
  { name: 'QQ 群', description: '国内玩家的主要沟通平台，方便日常交流。', link: '#', linkText: '加入 QQ 群' },
  { name: 'Bilibili', description: '观看我们的舰队战视频和活动回放。', link: '#', linkText: '访问主页' },
])
</script>

<style scoped>
.page-header {
  padding: var(--space-16) 0 var(--space-8);
}

.page-header h1 {
  font-size: var(--text-4xl);
  margin-top: var(--space-2);
  letter-spacing: -0.02em;
}

.page-header__desc {
  font-size: var(--text-md);
  color: var(--color-text-body);
  margin-top: var(--space-2);
}

/* Double-Bezel Glass Card */
.bezel-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-2xl);
  padding: 6px;
}

.bezel-card__inner {
  background: var(--color-bg-deep);
  border-radius: calc(var(--radius-2xl) - 4px);
  padding: var(--space-8);
}

/* Grid Layout — 40/60 */
.contact-grid {
  display: grid;
  grid-template-columns: 40fr 60fr;
  gap: var(--space-8);
  align-items: start;
}

/* Channels */
.contact-channels {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.channel-card {
  display: flex;
  gap: var(--space-5);
  align-items: flex-start;
}

.channel-card__icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent-muted);
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-lg);
  color: var(--color-accent);
  flex-shrink: 0;
  filter: drop-shadow(0 0 8px rgba(var(--raw-cyan-rgb), 0.2));
}

.channel-card__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.channel-card__name {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-heading);
  margin-bottom: 0;
}

.channel-card__desc {
  font-size: var(--text-sm);
  color: var(--color-text-body);
  line-height: 1.6;
}

.channel-card__link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-accent);
  transition: text-shadow var(--duration-fast) var(--ease-out);
}

.channel-card__link:hover {
  text-shadow: 0 0 10px rgba(var(--raw-cyan-rgb), 0.4);
}

/* Info Panel */
.contact-info__title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-heading);
  margin-bottom: var(--space-4);
}

.contact-info__text {
  font-size: var(--text-sm);
  color: var(--color-text-body);
  line-height: 1.7;
  margin-bottom: var(--space-5);
}

.contact-info__detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--color-border);
}

.contact-info__detail:last-child {
  border-bottom: none;
}

.contact-info__label {
  font-size: var(--text-xs);
  color: var(--color-accent);
  letter-spacing: 0.15em;
}

.contact-info__value {
  font-size: var(--text-sm);
  color: var(--color-text-body);
}

/* Star Decoration */
.star-field {
  position: relative;
  height: 80px;
  margin-top: var(--space-12);
  overflow: hidden;
}

.star {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.8), 0 0 12px rgba(var(--raw-cyan-rgb), 0.4);
  animation: starTwinkle 3s ease-in-out infinite;
}

.star--1 { left: 5%; top: 20%; animation-delay: 0s; width: 3px; height: 3px; }
.star--2 { left: 15%; top: 60%; animation-delay: 0.5s; width: 5px; height: 5px; }
.star--3 { left: 25%; top: 30%; animation-delay: 1s; width: 3px; height: 3px; }
.star--4 { left: 35%; top: 70%; animation-delay: 1.5s; width: 4px; height: 4px; }
.star--5 { left: 45%; top: 15%; animation-delay: 0.3s; width: 5px; height: 5px; }
.star--6 { left: 55%; top: 50%; animation-delay: 0.8s; width: 3px; height: 3px; }
.star--7 { left: 65%; top: 25%; animation-delay: 1.2s; width: 4px; height: 4px; }
.star--8 { left: 75%; top: 65%; animation-delay: 1.8s; width: 5px; height: 5px; }
.star--9 { left: 85%; top: 35%; animation-delay: 0.6s; width: 3px; height: 3px; }
.star--10 { left: 92%; top: 55%; animation-delay: 1.3s; width: 4px; height: 4px; }
.star--11 { left: 50%; top: 80%; animation-delay: 2s; width: 3px; height: 3px; }
.star--12 { left: 10%; top: 45%; animation-delay: 0.9s; width: 5px; height: 5px; }

@keyframes starTwinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.3); }
}

@media (max-width: 768px) {
  .contact-grid { grid-template-columns: 1fr; }
  .page-header { padding: var(--space-10) 0 var(--space-6); }
  .bezel-card__inner { padding: var(--space-5); }
}
</style>
