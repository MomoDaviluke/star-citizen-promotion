<template>
  <footer class="site-footer">
    <div class="site-footer__inner container">
      <!-- Brand -->
      <div class="site-footer__brand">
        <div class="site-footer__logo">
          <span class="site-footer__logo-white">STELLAR</span>
          <span class="site-footer__logo-cyan">NEXUS</span>
        </div>
        <p class="site-footer__desc">星际公民战队 · 官方招募站</p>
        <p class="site-footer__tagline">EXPLORE · FIGHT · CONQUER</p>
      </div>

      <!-- Navigation -->
      <div class="site-footer__links">
        <h4 class="site-footer__heading">NAVIGATION</h4>
        <nav class="site-footer__nav">
          <router-link to="/">首页</router-link>
          <router-link to="/about">关于</router-link>
          <router-link to="/fleet">舰队</router-link>
          <router-link to="/members">成员</router-link>
          <router-link to="/join">加入</router-link>
          <router-link to="/contact">联系</router-link>
        </nav>
      </div>

      <!-- Channels -->
      <div class="site-footer__links">
        <h4 class="site-footer__heading">CHANNELS</h4>
        <div class="site-footer__nav">
          <a
            v-for="channel in channels"
            :key="channel.label"
            :href="channel.href"
            :aria-disabled="channel.href === '#' ? 'true' : undefined"
            :tabindex="channel.href === '#' ? -1 : undefined"
            @click="handleChannelClick(channel)"
          >
            {{ channel.label }}
          </a>
        </div>
      </div>
    </div>

    <!-- Bottom -->
    <div class="site-footer__bottom container">
      <div class="site-footer__divider"></div>
      <p class="site-footer__copyright">&copy; {{ year }} Stellar Nexus. All rights reserved.</p>
      <p class="site-footer__disclaimer">
        Stellar Nexus 是 Star Citizen 玩家组织网站，所有官方素材版权归 Cloud Imperium Games 所有
      </p>
    </div>
  </footer>
</template>

<script setup>
import { siteConfig } from '../../config/site.config.js'
import { trackEvent } from '../../services/analyticsService.js'

const year = new Date().getFullYear()
const channels = [
  { label: 'Discord', href: siteConfig.siteInfo.discord || '#' },
  { label: 'QQ 群', href: siteConfig.siteInfo.qqGroup ? `https://qm.qq.com/cgi-bin/qm/qr?k=${siteConfig.siteInfo.qqGroup}` : '#' },
  { label: 'Bilibili', href: siteConfig.contact.socialLinks.find((l) => l.platform === 'bilibili')?.url || '#' }
]

/**
 * 外链点击埋点
 * @description 记录 Discord/QQ 群等社群渠道的引流点击，验证社群闭环
 */
function handleChannelClick(channel) {
  if (channel.href === '#') return
  trackEvent('external_link_click', { channel: channel.label })
}
</script>

<style scoped>
.site-footer {
  position: relative;
  background: rgba(5, 5, 8, 0.8);
  border-top: 1px solid transparent;
  border-image: linear-gradient(90deg, transparent, rgba(var(--raw-cyan-rgb), 0.3), transparent) 1;
  margin-top: var(--space-16);
}

.site-footer__inner {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: var(--space-12);
  padding-top: 6rem;
  padding-bottom: 2rem;
}

/* Brand */
.site-footer__brand {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.site-footer__logo {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.site-footer__logo-white {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: 0.15em;
  color: #ffffff;
}

.site-footer__logo-cyan {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--color-accent);
  text-shadow: 0 0 12px rgba(var(--raw-cyan-rgb), 0.4);
}

.site-footer__desc {
  font-size: var(--text-sm);
  color: var(--raw-gray-3);
  line-height: 1.6;
}

.site-footer__tagline {
  font-family: var(--font-data);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.25em;
  color: var(--color-accent);
  text-shadow: 0 0 8px rgba(var(--raw-cyan-rgb), 0.3);
}

/* Headings */
.site-footer__heading {
  font-family: var(--font-data);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin-bottom: var(--space-5);
}

/* Links */
.site-footer__nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.site-footer__nav a {
  font-size: var(--text-sm);
  color: var(--raw-gray-2);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-out),
              text-shadow var(--duration-fast) var(--ease-out);
  line-height: 1.5;
}

.site-footer__nav a:hover {
  color: var(--color-accent);
  text-shadow: 0 0 8px rgba(var(--raw-cyan-rgb), 0.3);
}

/* Bottom */
.site-footer__bottom {
  padding-top: var(--space-4);
  padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
}

.site-footer__divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--raw-cyan-rgb), 0.3), transparent);
  margin-bottom: var(--space-4);
}

.site-footer__copyright {
  font-size: var(--text-xs);
  color: var(--color-text-dim);
  letter-spacing: 0.02em;
  text-align: center;
}

.site-footer__disclaimer {
  max-width: 640px;
  margin: var(--space-2) auto 0;
  font-size: 11px;
  color: var(--color-text-dim);
  line-height: 1.6;
  text-align: center;
  opacity: 0.7;
}

/* Mobile */
@media (max-width: 768px) {
  .site-footer__inner {
    grid-template-columns: 1fr;
    gap: var(--space-8);
    padding-top: var(--space-10);
  }
}
</style>
