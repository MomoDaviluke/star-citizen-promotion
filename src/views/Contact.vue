<!--
  @file 联系我们视图组件 - Stellar Nexus 星渊枢纽风格
  @description 展示联系方式和社交媒体链接，采用Stellar Nexus视觉系统
  @module views/Contact
  @version 3.0 - Stellar Nexus视觉系统
-->

<template>
  <div class="contact-page">
    <!-- 星云背景装饰 -->
    <div class="page-nebulae">
      <div class="nebula-blob nebula-blob--purple"></div>
      <div class="nebula-blob nebula-blob--cyan"></div>
    </div>

    <!-- MFD风格页面标题 -->
    <PageHeader
      backgroundImage="/images/sc/sc-contact.jpg"
      title="联系我们"
      subtitle="通过战术通讯网络与指挥部建立连接"
      systemId="SYS.CONTACT // V.3.0"
    />

    <!-- 通讯频道 - MFD面板 -->
    <section class="channels-section">
      <div class="section-header-mfd" v-scroll-reveal="'fadeUp'">
        <span class="section-id font-data">// COMMS.CHANNELS</span>
        <h2 class="section-title font-tech">通讯频道</h2>
      </div>

      <div class="channels-grid" v-scroll-reveal="{ animation: 'fadeUp', delay: 0.15 }">
        <MFDPanel
          v-for="(channel, index) in channels"
          :key="channel.name"
          :variant="index === 0 ? 'primary' : 'secondary'"
          :title="channel.name.toUpperCase()"
          :subtitle="'CHANNEL-' + String(index + 1).padStart(2, '0')"
          :icon="channel.icon"
          :status="channel.status"
          :statusType="channel.statusType"
          :animated="true"
          class="channel-mfd-panel"
        >
          <div class="channel-content">
            <div class="channel-value font-data">{{ channel.value }}</div>
            <p class="channel-desc">{{ channel.description }}</p>
            <div class="channel-meta">
              <DataDisplay
                :label="'PRIORITY'"
                :value="channel.priority"
                :type="index === 0 ? 'primary' : 'secondary'"
              />
            </div>
          </div>
        </MFDPanel>
      </div>
    </section>

    <!-- 合作信息 - MFD面板 -->
    <section class="cooperation-section">
      <div class="section-header-mfd" v-scroll-reveal="'fadeUp'">
        <span class="section-id font-data">// ALLIANCE.PROTOCOL</span>
        <h2 class="section-title font-tech">合作说明</h2>
      </div>

      <MFDPanel
        variant="primary"
        title="ALLIANCE INFO"
        subtitle="COOPERATION PROTOCOL"
        icon="◈"
        status="ACTIVE"
        statusType="online"
        :animated="true"
        class="cooperation-mfd-panel"
      >
        <div class="cooperation-content">
          <p class="cooperation-desc">
            我们欢迎与其他组织建立长期合作关系，共同探索星际公民的无限可能。
            无论是联合行动、资源共享还是技术交流，我们都持开放态度。
          </p>

          <div class="cooperation-metrics">
            <div class="metric-item">
              <span class="metric-label font-data">RESPONSE TIME</span>
              <span class="metric-value font-data">24-48 HRS</span>
            </div>
            <div class="metric-item">
              <span class="metric-label font-data">AVAILABILITY</span>
              <span class="metric-value font-data">UTC+8 09:00-23:00</span>
            </div>
            <div class="metric-item">
              <span class="metric-label font-data">STATUS</span>
              <StatusIndicator type="online" label="ACCEPTING" size="small" />
            </div>
          </div>
        </div>
      </MFDPanel>
    </section>

    <!-- 社交媒体 - MFD风格 -->
    <section class="social-section">
      <div class="section-header-mfd">
        <span class="section-id font-data">// SOCIAL.LINKS</span>
        <h2 class="section-title font-tech">关注频道</h2>
      </div>

      <div class="social-grid">
        <a
          v-for="(link, index) in socialLinks"
          :key="link.name"
          :href="link.url"
          class="social-mfd-link"
          :aria-label="link.name"
          target="_blank"
          rel="noopener noreferrer"
        >
          <MFDPanel
            variant="secondary"
            :title="link.name.toUpperCase()"
            :subtitle="'FEED-' + String(index + 1).padStart(2, '0')"
            :icon="link.icon"
            status="LIVE"
            statusType="online"
            :animated="true"
            class="social-mfd-panel"
          >
            <div class="social-content">
              <div class="social-icon" v-html="link.svg"></div>
              <span class="social-handle font-data">{{ link.handle }}</span>
            </div>
          </MFDPanel>
        </a>
      </div>
    </section>
  </div>
</template>

<script setup>
/**
 * 联系我们视图组件 - Stellar Nexus 星渊枢纽风格
 * @description 展示联系方式和社交媒体链接，采用Stellar Nexus视觉系统
 * @version 3.0
 */

import MFDPanel from '@/components/ui/MFDPanel.vue'
import StatusIndicator from '@/components/ui/StatusIndicator.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import DataDisplay from '@/components/ui/DataDisplay.vue'

/**
 * 通讯频道数据
 * 定义所有可用的联系方式和通讯渠道
 */
const channels = [
  {
    name: 'Discord',
    value: '待填',
    description: '主要战术通讯频道，实时语音与文字交流',
    icon: '◈',
    status: 'ONLINE',
    statusType: 'online',
    priority: 'P1'
  },
  {
    name: 'Email',
    value: 'team@example.com',
    description: '正式通讯与文件传输渠道',
    icon: '●',
    status: 'ACTIVE',
    statusType: 'online',
    priority: 'P2'
  },
  {
    name: 'QQ Group',
    value: '待填',
    description: '中文社区主要聚集地，日常交流与公告发布',
    icon: '◆',
    status: 'STANDBY',
    statusType: 'warning',
    priority: 'P2'
  }
]

/**
 * 社交媒体链接数据
 * 定义所有社交媒体平台链接
 */
const socialLinks = [
  {
    name: 'Bilibili',
    url: '#',
    handle: '@待填',
    icon: '▶',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/></svg>`
  },
  {
    name: 'Weibo',
    url: '#',
    handle: '@待填',
    icon: '◎',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.18.573h.014zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.579-.18-.405-.649.388-1.032.425-1.922.006-2.556-.786-1.19-2.936-1.129-5.411-.032 0 0-.775.34-.578-.275.381-1.207.324-2.218-.27-2.8-1.346-1.32-4.927.046-8.003 3.055C1.355 10.308 0 12.318 0 14.054c0 3.32 4.246 5.339 8.398 5.339 5.449 0 9.07-3.174 9.07-5.693 0-1.523-1.287-2.387-2.387-2.751zm2.467-4.354c-.576-.635-1.434-.958-2.336-.881-.203.017-.354.19-.337.386.017.196.19.347.386.33.642-.055 1.252.176 1.662.629.41.453.558 1.066.405 1.684-.049.193.067.39.26.44.03.008.06.011.09.011.161 0 .308-.109.35-.271.213-.861.006-1.728-.58-2.328zm1.918-1.997c-1.096-1.209-2.727-1.823-4.439-1.677-.203.017-.354.19-.337.386.017.196.19.347.386.33 1.416-.121 2.77.386 3.673 1.382.903.996 1.265 2.354.991 3.729-.04.194.086.384.28.424.024.005.049.007.073.007.168 0 .316-.118.352-.288.33-1.649-.106-3.286-1.379-4.293z"/></svg>`
  },
  {
    name: 'Twitter',
    url: '#',
    handle: '@待填',
    icon: '◆',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
  }
]
</script>

<style scoped>
/* 页面容器 */
.contact-page {
  padding: 2rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
}

/* 星云背景装饰 */
.page-nebulae {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.nebula-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  animation: nebula-drift 20s ease-in-out infinite;
}

.nebula-blob--purple {
  width: 50vw;
  height: 50vw;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.08), transparent 70%);
  top: -10%;
  right: -10%;
}

.nebula-blob--cyan {
  width: 40vw;
  height: 40vw;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.06), transparent 70%);
  bottom: 10%;
  left: -10%;
  animation-delay: -7s;
}

/* MFD风格页面标题 */
.page-header-mfd {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 3rem;
  padding: 2rem;
  padding-bottom: 1.5rem;
  background: linear-gradient(135deg, rgba(12, 20, 36, 0.95), rgba(6, 11, 20, 0.98));
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: var(--radius-md);
  position: relative;
  overflow: hidden;
}

.page-header-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.page-header-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.15;
  filter: saturate(0.5) brightness(0.4);
  mix-blend-mode: screen;
}

.page-header-bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(12, 20, 36, 0.9), rgba(6, 11, 20, 0.95));
}

.page-header-mfd::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--nebula-purple), transparent);
  animation: scanLineHorizontal 3s linear infinite;
  z-index: 1;
}

.page-header-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  z-index: 1;
}

.page-id {
  font-size: 0.75rem;
  color: var(--nebula-purple);
  letter-spacing: 0.15em;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-muted);
  margin: 0;
  letter-spacing: 0.05em;
}

.page-header-decoration {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}

.header-line {
  width: 60px;
  height: 2px;
  background: var(--accent);
  opacity: 0.6;
}

/* 区块标题 */
.section-header-mfd {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-left: 1rem;
  border-left: 3px solid var(--accent);
}

.section-id {
  font-size: 0.7rem;
  color: var(--accent);
  letter-spacing: 0.1em;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* 通讯频道区域 */
.channels-section {
  margin-bottom: 3rem;
}

.channels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.channel-mfd-panel {
  animation: fadeInUp 0.5s ease both;
}

.channel-mfd-panel:nth-child(1) { animation-delay: 0s; }
.channel-mfd-panel:nth-child(2) { animation-delay: 0.1s; }
.channel-mfd-panel:nth-child(3) { animation-delay: 0.2s; }

.channel-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem;
}

.channel-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.05em;
  word-break: break-all;
}

.channel-desc {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.5;
  font-size: 0.85rem;
}

.channel-meta {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-light);
}

/* 合作信息区域 */
.cooperation-section {
  margin-bottom: 3rem;
}

.cooperation-mfd-panel {
  animation: fadeInUp 0.6s ease both;
}

.cooperation-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.5rem;
}

.cooperation-desc {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.7;
  font-size: 0.95rem;
}

.cooperation-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-light);
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.metric-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.metric-value {
  font-size: 0.9rem;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
}

/* 社交媒体区域 */
.social-section {
  margin-bottom: 3rem;
}

.social-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
}

.social-mfd-link {
  text-decoration: none;
  color: inherit;
  display: block;
  transition: transform var(--duration-fast);
}

.social-mfd-link:hover {
  transform: translateY(-4px);
}

.social-mfd-panel {
  animation: fadeInUp 0.5s ease both;
  height: 100%;
}

.social-mfd-panel:nth-child(1) { animation-delay: 0s; }
.social-mfd-panel:nth-child(2) { animation-delay: 0.1s; }
.social-mfd-panel:nth-child(3) { animation-delay: 0.2s; }

.social-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
}

.social-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.social-icon svg {
  width: 28px;
  height: 28px;
}

.social-handle {
  font-size: 0.85rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

/* 动画 */
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

/* 响应式 */
@media (max-width: 768px) {
  .contact-page {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .channels-grid {
    grid-template-columns: 1fr;
  }

  .cooperation-metrics {
    grid-template-columns: 1fr;
  }

  .social-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .social-grid {
    grid-template-columns: 1fr;
  }

  .page-header-mfd {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .page-header-decoration {
    align-items: flex-start;
  }
}
</style>
