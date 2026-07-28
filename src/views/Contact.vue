<!--
  @file 联系我们视图组件
  @description Cinematic Sci-Fi — 联系方式与通讯频道
  @version 10.0 - Cinematic Sci-Fi Spectacle
-->

<template>
  <div ref="rootRef" class="contact-page">

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
                <div class="channel-card__icon" v-html="channel.icon">
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

    <!-- 站内留言表单 -->
    <section class="contact-form-section section">
      <div class="container">
        <div class="contact-form-wrap">
          <div class="contact-form__header">
            <span class="section-label">// SEND MESSAGE</span>
            <h2>发送站内消息</h2>
            <p class="contact-form__intro">不方便加群？直接给我们留言，我们会通过邮件回复你。</p>
          </div>

          <form class="contact-form" @submit.prevent="handleSubmit">
            <div class="contact-form__row">
              <div class="form-group">
                <label class="form-label" for="contact-name">称呼</label>
                <input
                  id="contact-name"
                  v-model="form.name"
                  class="form-input"
                  type="text"
                  placeholder="你的名称"
                  required
                  maxlength="50"
                />
              </div>
              <div class="form-group">
                <label class="form-label" for="contact-email">邮箱</label>
                <input
                  id="contact-email"
                  v-model="form.email"
                  class="form-input"
                  type="email"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="contact-subject">主题</label>
              <input
                id="contact-subject"
                v-model="form.subject"
                class="form-input"
                type="text"
                placeholder="合作咨询 / 活动邀请 / 其他"
                required
                maxlength="100"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="contact-message">留言内容</label>
              <textarea
                id="contact-message"
                v-model="form.message"
                class="form-input form-input--textarea"
                placeholder="请描述你的需求..."
                required
                rows="5"
                maxlength="1000"
              ></textarea>
            </div>

            <div v-if="formStatus" class="contact-form__status" :class="`contact-form__status--${formStatus.type}`">
              {{ formStatus.message }}
            </div>

            <button type="submit" class="contact-form__submit" :disabled="isSending">
              <span v-if="!isSending">发送消息 · TRANSMIT</span>
              <span v-else>发送中... · TRANSMITTING</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useGSAPReveal } from '@/composables/useGSAPReveal'

const rootRef = ref(null)

// GSAP 滚动入场动画：频道卡片交错 + 信息面板淡入
useGSAPReveal(({ reveal, stagger }) => {
  nextTick(() => {
    if (!rootRef.value) return

    // 频道卡片交错揭示
    const channels = rootRef.value.querySelector('.contact-channels')
    if (channels) {
      stagger(channels, '.bezel-card', {
        animation: 'fadeLeft',
        stagger: 0.15,
        duration: 0.7
      })
    }

    // 信息面板淡入
    const infoPanel = rootRef.value.querySelector('.contact-info-area')
    if (infoPanel) {
      reveal(infoPanel, { animation: 'fadeRight', duration: 0.8 })
    }
  })
})

const channels = ref([
  {
    name: 'Discord',
    description: '加入我们的 Discord 服务器，实时沟通，参与活动。',
    link: '#',
    linkText: '加入服务器',
    icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 4a18 18 0 0 0-4.5-1.5l-.5 1a16 16 0 0 1 3.5 1l1.5-.5z"/><path d="M5 4a18 18 0 0 1 4.5-1.5l.5 1a16 16 0 0 0-3.5 1L5 4z"/><path d="M5 20a18 18 0 0 0 4.5 1.5l.5-1a16 16 0 0 1-3.5-1L5 20z"/><path d="M19 20a18 18 0 0 1-4.5 1.5l-.5-1a16 16 0 0 0 3.5-1l1.5.5z"/><circle cx="9" cy="13" r="1.5" fill="currentColor"/><circle cx="15" cy="13" r="1.5" fill="currentColor"/><path d="M7 5C4 6 3 10 3 14a8 8 0 0 0 3 1"/><path d="M17 5c3 1 4 5 4 9a8 8 0 0 1-3 1"/></svg>'
  },
  {
    name: 'QQ 群',
    description: '国内玩家的主要沟通平台，方便日常交流。',
    link: '#',
    linkText: '加入 QQ 群',
    icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-3.5 0-6 2.5-6 6 0 1-1 2-1 4 0 .8.5 1.5 1.5 1.5L7 17l2-1c1 .5 2 .5 3 .5s2 0 3-.5l2 1 .5-2.5c1 0 1.5-.7 1.5-1.5 0-2-1-3-1-4 0-3.5-2.5-6-6-6z"/><circle cx="9.5" cy="11" r="1" fill="currentColor"/><circle cx="14.5" cy="11" r="1" fill="currentColor"/><path d="M10 14c.5.5 1.2.8 2 .8s1.5-.3 2-.8"/></svg>'
  },
  {
    name: 'Bilibili',
    description: '观看我们的舰队战视频和活动回放。',
    link: '#',
    linkText: '访问主页',
    icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M7 4l3 3M17 4l-3 3"/><circle cx="9" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/><path d="M9.5 16c.5.5 1.2.8 2 .8s1.5-.3 2-.8"/></svg>'
  },
])

// 站内留言表单
const form = ref({ name: '', email: '', subject: '', message: '' })
const isSending = ref(false)
const formStatus = ref(null)

async function handleSubmit() {
  if (isSending.value) return
  isSending.value = true
  formStatus.value = null

  try {
    // 模拟提交（后端 API 未实现时使用前端延迟）
    await new Promise((resolve) => setTimeout(resolve, 1200))
    formStatus.value = { type: 'success', message: '消息已发送 · 我们会在 24 小时内通过邮件回复你。' }
    form.value = { name: '', email: '', subject: '', message: '' }
  } catch {
    formStatus.value = { type: 'error', message: '发送失败 · 请稍后重试或通过 Discord 联系我们。' }
  } finally {
    isSending.value = false
  }
}
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
  background: var(--color-bg-glass);
  border: 1px solid var(--color-border-hover);
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
  .contact-form__row { grid-template-columns: 1fr; }
}

/* ═══ 站内留言表单 ═══ */
.contact-form-section {
  padding-top: var(--space-12);
}

.contact-form-wrap {
  max-width: 640px;
  margin: 0 auto;
}

.contact-form__header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.contact-form__header h2 {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-text-heading);
  margin-top: var(--space-2);
}

.contact-form__intro {
  font-size: var(--text-sm);
  color: var(--color-text-body);
  margin-top: var(--space-2);
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.contact-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  font-size: var(--text-xs);
  color: var(--color-accent);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.form-input {
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-deep);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-heading);
  font-size: var(--text-sm);
  font-family: inherit;
  transition: border-color var(--motion-duration-normal) var(--motion-ease-smooth), box-shadow var(--motion-duration-normal) var(--motion-ease-smooth);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent), 0 0 12px rgba(var(--raw-cyan-rgb), 0.1);
}

.form-input::placeholder {
  color: var(--color-text-hint);
}

.form-input--textarea {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  line-height: 1.6;
}

.contact-form__status {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  text-align: center;
}

.contact-form__status--success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: rgb(134, 239, 172);
}

.contact-form__status--error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: rgb(252, 165, 165);
}

.contact-form__submit {
  padding: var(--space-3) var(--space-6);
  background: var(--color-accent);
  color: var(--color-bg-deep);
  font-weight: 600;
  font-size: var(--text-sm);
  letter-spacing: 0.1em;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--motion-duration-normal) var(--motion-ease-smooth);
  align-self: center;
  min-width: 220px;
}

.contact-form__submit:hover:not(:disabled) {
  background: var(--color-accent-bright);
  box-shadow: 0 0 24px rgba(var(--raw-cyan-rgb), 0.4);
  transform: translateY(-2px);
}

.contact-form__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
