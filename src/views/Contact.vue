<template>
  <PageTitle
    title="联系我们"
    subtitle="替换为你们的 Discord、QQ群、邮箱、B站/微博等官方渠道。"
  />

  <section class="grid contact-grid">
    <article class="card contact-card" :style="{ animationDelay: '0s' }">
      <div class="contact-header">
        <div class="contact-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
        </div>
        <h3>联系渠道</h3>
      </div>
      <div class="contact-list">
        <div class="contact-item">
          <span class="item-label">Discord</span>
          <span class="item-value">待填</span>
        </div>
        <div class="contact-item">
          <span class="item-label">邮箱</span>
          <span class="item-value">team@example.com</span>
        </div>
        <div class="contact-item">
          <span class="item-label">QQ群</span>
          <span class="item-value">待填</span>
        </div>
      </div>
    </article>

    <article class="card contact-card" :style="{ animationDelay: '0.15s' }">
      <div class="contact-header">
        <div class="contact-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <h3>合作说明</h3>
      </div>
      <p class="contact-desc">
        可放置合作方向、商务联系窗口与响应时间说明。我们欢迎与其他组织建立长期合作关系，共同探索星际公民的无限可能。
      </p>
      <div class="response-time">
        <span class="response-label">响应时间</span>
        <span class="response-value">24-48 小时</span>
      </div>
    </article>
  </section>

  <section class="social-section">
    <h3 class="social-title">关注我们</h3>
    <div class="social-links">
      <a href="#" class="social-link" aria-label="Bilibili">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/>
        </svg>
      </a>
      <a href="#" class="social-link" aria-label="Weibo">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.18.573h.014zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.579-.18-.405-.649.388-1.032.425-1.922.006-2.556-.786-1.19-2.936-1.129-5.411-.032 0 0-.775.34-.578-.275.381-1.207.324-2.218-.27-2.8-1.346-1.32-4.927.046-8.003 3.055C1.355 10.308 0 12.318 0 14.054c0 3.32 4.246 5.339 8.398 5.339 5.449 0 9.07-3.174 9.07-5.693 0-1.523-1.287-2.387-2.387-2.751zm2.467-4.354c-.576-.635-1.434-.958-2.336-.881-.203.017-.354.19-.337.386.017.196.19.347.386.33.642-.055 1.252.176 1.662.629.41.453.558 1.066.405 1.684-.049.193.067.39.26.44.03.008.06.011.09.011.161 0 .308-.109.35-.271.213-.861.006-1.728-.58-2.328zm1.918-1.997c-1.096-1.209-2.727-1.823-4.439-1.677-.203.017-.354.19-.337.386.017.196.19.347.386.33 1.416-.121 2.77.386 3.673 1.382.903.996 1.265 2.354.991 3.729-.04.194.086.384.28.424.024.005.049.007.073.007.168 0 .316-.118.352-.288.33-1.649-.106-3.286-1.379-4.293z"/>
        </svg>
      </a>
      <a href="#" class="social-link" aria-label="Twitter">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </a>
    </div>
  </section>
</template>

<script setup>
import PageTitle from '@/components/common/PageTitle.vue'
</script>

<style scoped>
.contact-grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.contact-card {
  animation: fadeInUp 0.6s ease both;
}

.contact-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--line);
}

.contact-icon {
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

.contact-icon svg {
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

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(95, 169, 255, 0.05);
  border: 1px solid var(--line);
  border-radius: 4px;
}

.item-label {
  color: var(--text-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.item-value {
  color: var(--text);
  font-weight: 500;
}

.contact-desc {
  margin: 0 0 1.25rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.response-time {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(78, 205, 196, 0.08);
  border: 1px solid rgba(78, 205, 196, 0.2);
  border-radius: 4px;
}

.response-label {
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.response-value {
  color: var(--success);
  font-weight: 600;
}

.social-section {
  margin-top: 2.5rem;
  text-align: center;
}

.social-title {
  margin: 0 0 1.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--text-muted);
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.social-link {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(95, 169, 255, 0.08);
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--text-muted);
  transition: all var(--transition-fast);
}

.social-link svg {
  width: 22px;
  height: 22px;
}

.social-link:hover {
  background: rgba(95, 169, 255, 0.15);
  border-color: var(--accent);
  color: var(--accent-2);
  transform: translateY(-2px);
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
