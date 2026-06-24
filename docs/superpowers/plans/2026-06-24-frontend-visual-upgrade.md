# 前端视觉升级实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将官网从"可用"升级到"大厂级科幻军事终端视觉"，统一字体与美术资产，重制首页 Hero，全站增加 HUD 装饰系统。

**架构：** 基于现有 Vue 3 + Vite + Pinia 工程，扩展 `src/components/hud/` 装饰组件库，统一 `variables.css` 字体系统，替换 `public/images/ships/` 美术资产，分阶段改造 `Home.vue`、`Fleet.vue`、`ShipDetail.vue` 和全局导航。

**技术栈：** Vue 3 Composition API、Vite、CSS Variables、IntersectionObserver、Canvas/WebGL（星空粒子）、WebP 图片。

---

## 文件清单

### 修改文件

| 文件 | 职责 |
|---|---|
| `src/styles/variables.css` | 统一字体变量为 Rajdhani + Noto Sans SC + JetBrains Mono，新增 HUD Token |
| `src/config/site.config.js` | 移除与 variables.css 冲突的字体配置 |
| `src/App.vue` | 接入全局 `StarMapGrid` 背景与 prefers-reduced-motion |
| `src/views/Home.vue` | 重制 Hero 区，集成数据读数、Ticker、新舰船预览 |
| `src/views/Fleet.vue` | 新舰船图卡片、HUD 角标、分类过渡动画 |
| `src/views/ShipDetail.vue` | HUD 风格数据面板、动态指示灯 |
| `src/components/AppHeader.vue` 或 `src/components/Navigation.vue` | 导航栏 HUD 化 |
| `src/components/Footer.vue` | 增加 faction 标识与 HUD 装饰 |
| `src/data/shipDatabase.js` | 如需调整图片路径或新增元数据 |

### 新建文件

| 文件 | 职责 |
|---|---|
| `src/components/hud/HudCorner.vue` | 斜切角标装饰 |
| `src/components/hud/TechDivider.vue` | 斜切分隔线 |
| `src/components/hud/StarMapGrid.vue` | 星图网格背景 |
| `src/components/hud/StatusPulse.vue` | 脉冲状态指示灯 |
| `src/components/hud/DataTicker.vue` | 滚动数据条 |
| `src/components/hud/Scanline.vue` | 局部扫描线效果 |
| `src/components/hud/ShipCategoryBadge.vue` | 舰船类别徽章 |
| `src/components/home/HeroSection.vue` | 新首页英雄区 |
| `src/components/home/HeroDataPanel.vue` | Hero 数据读数面板 |
| `src/components/home/HeroTicker.vue` | Hero 底部滚动 Ticker |
| `src/components/fleet/ShipCard.vue` | 新 Fleet 舰船卡片 |
| `public/images/ships/*.webp` | 12 张统一风格舰船图 |
| `scripts/generate-ship-images.md` | 舰船图生成/后期流程说明 |

---

## 任务 1：统一 Design Token 字体系统

**文件：**
- 修改：`src/styles/variables.css`

- [ ] **步骤 1：将 `--font-display` 从 Space Grotesk 改为 Rajdhani**

```css
  --font-display: 'Rajdhani', 'Noto Sans SC', system-ui, sans-serif;
  --font-body: 'Noto Sans SC', 'Rajdhani', system-ui, -apple-system, sans-serif;
  --font-data: 'JetBrains Mono', 'Consolas', monospace;
  --font-mono: 'JetBrains Mono', 'Consolas', monospace;
  --font-tech: 'JetBrains Mono', 'Consolas', monospace;
```

- [ ] **步骤 2：在 `:root` 末尾新增 HUD/装饰 Token**

```css
  /* HUD 装饰系统 */
  --color-hud-line: rgba(74, 158, 255, 0.12);
  --color-starfield: rgba(255, 255, 255, 0.4);
  --glow-hud: 0 0 20px rgba(74, 158, 255, 0.1);
  --glow-hud-strong: 0 0 40px rgba(74, 158, 255, 0.15);
```

- [ ] **步骤 3：验证 CSS 无语法错误**

运行：`npx stylelint "src/styles/variables.css"`（若无 stylelint 则跳过）

- [ ] **步骤 4：Commit**

```bash
git add src/styles/variables.css
git commit -m "feat(styles): 统一字体系统为 Rajdhani 并新增 HUD 装饰 Token"
```

---

## 任务 2：清理 site.config.js 字体冲突

**文件：**
- 修改：`src/config/site.config.js`

- [ ] **步骤 1：删除 theme.fonts 中与 variables.css 冲突的字体配置**

将：
```javascript
    fonts: {
      primary: '"Rajdhani", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      mono: '"JetBrains Mono", "Fira Code", monospace'
    },
```

改为：
```javascript
    fonts: {
      // 字体由 src/styles/variables.css 统一管控，避免运行时冲突
      source: 'variables.css'
    },
```

- [ ] **步骤 2：检查是否有代码引用 `siteConfig.theme.fonts.primary`**

运行：`grep -r "theme.fonts" src/`

预期：无引用或仅有本文件定义。

- [ ] **步骤 3：Commit**

```bash
git add src/config/site.config.js
git commit -m "fix(config): 移除与 variables.css 冲突的字体配置"
```

---

## 任务 3：创建 HUD 装饰组件 — HudCorner

**文件：**
- 创建：`src/components/hud/HudCorner.vue`

- [ ] **步骤 1：创建组件文件**

```vue
<!--
  @file HUD 角标装饰
  @description 用于卡片、面板四角的斜切角标，营造军事终端感
-->
<template>
  <div class="hud-corner" :class="[`hud-corner--${position}`, `hud-corner--${size}`]">
    <span class="hud-corner__line hud-corner__line--h"></span>
    <span class="hud-corner__line hud-corner__line--v"></span>
  </div>
</template>

<script setup>
/**
 * @typedef {Object} Props
 * @property {'top-left'|'top-right'|'bottom-left'|'bottom-right'} position - 角标位置
 * @property {'sm'|'md'|'lg'} size - 角标尺寸
 */
const props = defineProps({
  position: { type: String, default: 'top-left' },
  size: { type: String, default: 'md' }
})
</script>

<style scoped>
.hud-corner {
  position: absolute;
  width: var(--corner-size);
  height: var(--corner-size);
  pointer-events: none;
}

.hud-corner--sm { --corner-size: 12px; }
.hud-corner--md { --corner-size: 20px; }
.hud-corner--lg { --corner-size: 32px; }

.hud-corner__line {
  position: absolute;
  background: var(--color-hud-line);
}

.hud-corner__line--h {
  width: 100%;
  height: 1px;
}

.hud-corner__line--v {
  width: 1px;
  height: 100%;
}

.hud-corner--top-left { top: 0; left: 0; }
.hud-corner--top-left .hud-corner__line--h { top: 0; left: 0; }
.hud-corner--top-left .hud-corner__line--v { top: 0; left: 0; }

.hud-corner--top-right { top: 0; right: 0; }
.hud-corner--top-right .hud-corner__line--h { top: 0; right: 0; }
.hud-corner--top-right .hud-corner__line--v { top: 0; right: 0; }

.hud-corner--bottom-left { bottom: 0; left: 0; }
.hud-corner--bottom-left .hud-corner__line--h { bottom: 0; left: 0; }
.hud-corner--bottom-left .hud-corner__line--v { bottom: 0; left: 0; }

.hud-corner--bottom-right { bottom: 0; right: 0; }
.hud-corner--bottom-right .hud-corner__line--h { bottom: 0; right: 0; }
.hud-corner--bottom-right .hud-corner__line--v { bottom: 0; right: 0; }
</style>
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/hud/HudCorner.vue
git commit -m "feat(components): 新增 HUD 角标装饰组件 HudCorner"
```

---

## 任务 4：创建 HUD 装饰组件 — TechDivider

**文件：**
- 创建：`src/components/hud/TechDivider.vue`

- [ ] **步骤 1：创建组件文件**

```vue
<!--
  @file 科技风格分隔线
  @description 带斜切末节的 HUD 分隔线
-->
<template>
  <div class="tech-divider" :class="{ 'tech-divider--vertical': vertical }">
    <span class="tech-divider__line"></span>
    <span class="tech-divider__notch"></span>
  </div>
</template>

<script setup>
const props = defineProps({
  vertical: { type: Boolean, default: false }
})
</script>

<style scoped>
.tech-divider {
  display: flex;
  align-items: center;
  width: 100%;
  height: 1px;
}

.tech-divider--vertical {
  flex-direction: column;
  width: 1px;
  height: 100%;
}

.tech-divider__line {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-hud-line) 10%,
    var(--color-hud-line) 90%,
    transparent 100%
  );
}

.tech-divider--vertical .tech-divider__line {
  width: 1px;
  height: 100%;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--color-hud-line) 10%,
    var(--color-hud-line) 90%,
    transparent 100%
  );
}

.tech-divider__notch {
  width: 6px;
  height: 6px;
  background: var(--color-accent);
  transform: rotate(45deg);
  margin-left: -3px;
  box-shadow: var(--glow-hud);
}

.tech-divider--vertical .tech-divider__notch {
  margin-left: 0;
  margin-top: -3px;
}
</style>
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/hud/TechDivider.vue
git commit -m "feat(components): 新增科技分隔线组件 TechDivider"
```

---

## 任务 5：创建 HUD 装饰组件 — StarMapGrid

**文件：**
- 创建：`src/components/hud/StarMapGrid.vue`

- [ ] **步骤 1：创建组件文件**

```vue
<!--
  @file 星图网格背景
  @description 用于 Hero 等区域的 faint 星图网格背景
-->
<template>
  <div class="star-map" aria-hidden="true">
    <div class="star-map__grid"></div>
    <div class="star-map__dots">
      <span
        v-for="n in dotCount"
        :key="n"
        class="star-map__dot"
        :style="dotStyle(n)"
      ></span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  dotCount: { type: Number, default: 24 }
})

// 预生成固定坐标，避免 SSR/ hydration 不一致
const dots = Array.from({ length: props.dotCount }, (_, i) => ({
  left: `${(i * 37.3) % 100}%`,
  top: `${(i * 61.7) % 100}%`,
  delay: `${(i * 0.7) % 5}s`,
  size: `${1 + (i % 3)}px`
}))

function dotStyle(n) {
  const d = dots[n - 1]
  return {
    left: d.left,
    top: d.top,
    width: d.size,
    height: d.size,
    animationDelay: d.delay
  }
}
</script>

<style scoped>
.star-map {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: -1;
}

.star-map__grid {
  position: absolute;
  inset: -50%;
  background-image:
    linear-gradient(var(--color-hud-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-hud-line) 1px, transparent 1px);
  background-size: 80px 80px;
  transform: perspective(500px) rotateX(60deg);
  opacity: 0.4;
  animation: starMapDrift 60s linear infinite;
}

.star-map__dot {
  position: absolute;
  background: var(--color-starfield);
  border-radius: 50%;
  opacity: 0;
  animation: starMapPulse 4s ease-in-out infinite;
}

@keyframes starMapDrift {
  0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
  100% { transform: perspective(500px) rotateX(60deg) translateY(80px); }
}

@keyframes starMapPulse {
  0%, 100% { opacity: 0; transform: scale(0.8); }
  50% { opacity: 0.8; transform: scale(1.2); }
}
</style>
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/hud/StarMapGrid.vue
git commit -m "feat(components): 新增星图网格背景组件 StarMapGrid"
```

---

## 任务 6：创建 HUD 装饰组件 — StatusPulse

**文件：**
- 创建：`src/components/hud/StatusPulse.vue`

- [ ] **步骤 1：创建组件文件**

```vue
<!--
  @file 脉冲状态指示灯
  @description 用于在线状态、战备率等场景
-->
<template>
  <span class="status-pulse" :class="`status-pulse--${variant}`">
    <span class="status-pulse__dot"></span>
    <span v-if="label" class="status-pulse__label">{{ label }}</span>
  </span>
</template>

<script setup>
const props = defineProps({
  variant: { type: String, default: 'online' }, // online | warning | danger | offline
  label: { type: String, default: '' }
})
</script>

<style scoped>
.status-pulse {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.status-pulse__dot {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-pulse__dot::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  animation: statusPulse 2s ease-in-out infinite;
}

.status-pulse--online .status-pulse__dot { background: var(--color-status-online); }
.status-pulse--online .status-pulse__dot::after { background: rgba(34, 197, 94, 0.3); }

.status-pulse--warning .status-pulse__dot { background: var(--color-status-warning); }
.status-pulse--warning .status-pulse__dot::after { background: rgba(255, 179, 0, 0.3); }

.status-pulse--danger .status-pulse__dot { background: var(--color-status-danger); }
.status-pulse--danger .status-pulse__dot::after { background: rgba(239, 68, 68, 0.3); }

.status-pulse--offline .status-pulse__dot { background: var(--color-status-offline); }
.status-pulse--offline .status-pulse__dot::after { background: rgba(107, 114, 128, 0.3); }

@keyframes statusPulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(2.2); opacity: 0; }
}
</style>
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/hud/StatusPulse.vue
git commit -m "feat(components): 新增脉冲状态灯组件 StatusPulse"
```

---

## 任务 7：创建 HUD 装饰组件 — DataTicker

**文件：**
- 创建：`src/components/hud/DataTicker.vue`

- [ ] **步骤 1：创建组件文件**

```vue
<!--
  @file 滚动数据条
  @description 用于 Hero 底部等位置展示动态状态信息
-->
<template>
  <div class="data-ticker" :class="{ 'data-ticker--vertical': vertical }">
    <div class="data-ticker__track" :style="trackStyle">
      <span
        v-for="(item, idx) in doubledItems"
        :key="idx"
        class="data-ticker__item"
      >
        <span class="data-ticker__dot"></span>
        {{ item }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  vertical: { type: Boolean, default: false },
  duration: { type: Number, default: 30 }
})

const doubledItems = computed(() => [...props.items, ...props.items])

const trackStyle = computed(() => ({
  animationDuration: `${props.duration}s`,
  animationDirection: props.vertical ? 'normal' : 'normal',
  flexDirection: props.vertical ? 'column' : 'row'
}))
</script>

<style scoped>
.data-ticker {
  overflow: hidden;
  white-space: nowrap;
  background: rgba(5, 5, 8, 0.6);
  border-top: 1px solid var(--color-hud-line);
  border-bottom: 1px solid var(--color-hud-line);
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.12em;
  color: var(--color-text-label);
}

.data-ticker--vertical {
  white-space: normal;
}

.data-ticker__track {
  display: inline-flex;
  gap: 2rem;
  padding: 0.75rem 0;
  animation: tickerScroll 30s linear infinite;
}

.data-ticker__item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.data-ticker__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 8px var(--color-accent);
}

@keyframes tickerScroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
</style>
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/hud/DataTicker.vue
git commit -m "feat(components): 新增滚动数据条组件 DataTicker"
```

---

## 任务 8：创建 HUD 装饰组件 — Scanline

**文件：**
- 创建：`src/components/hud/Scanline.vue`

- [ ] **步骤 1：创建组件文件**

```vue
<!--
  @file 局部扫描线效果
  @description 仅在需要的地方叠加扫描线，不再全站固定
-->
<template>
  <div class="scanline" aria-hidden="true"></div>
</template>

<style scoped>
.scanline {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  opacity: 0.06;
}

.scanline::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.5) 2px,
    rgba(0, 0, 0, 0.5) 4px
  );
  animation: scanlineMove 8s linear infinite;
}

@keyframes scanlineMove {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}
</style>
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/hud/Scanline.vue
git commit -m "feat(components): 新增局部扫描线组件 Scanline"
```

---

## 任务 9：创建舰船类别徽章组件

**文件：**
- 创建：`src/components/hud/ShipCategoryBadge.vue`

- [ ] **步骤 1：创建组件文件**

```vue
<!--
  @file 舰船类别徽章
  @description 统一风格的舰船分类标签
-->
<template>
  <span class="ship-category" :class="`ship-category--${categoryEn}`">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  category: { type: String, required: true } // 中文类别
})

const categoryMap = {
  '战斗': { label: 'COMBAT', key: 'combat' },
  '探索': { label: 'EXPLORATION', key: 'exploration' },
  '运输': { label: 'TRANSPORT', key: 'transport' },
  '截击': { label: 'INTERCEPTOR', key: 'interceptor' },
  '竞速': { label: 'RACING', key: 'racing' },
  '军用': { label: 'MILITARY', key: 'military' }
}

const config = computed(() => categoryMap[props.category] || { label: props.category.toUpperCase(), key: 'default' })
const label = computed(() => config.value.label)
const categoryEn = computed(() => config.value.key)
</script>

<style scoped>
.ship-category {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.6rem;
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid currentColor;
  border-radius: var(--radius-sm);
  background: currentColor;
  -webkit-background-clip: text;
  background-clip: text;
  color: var(--color-text-label);
}

.ship-category--combat { color: var(--color-status-danger); background: rgba(239, 68, 68, 0.1); }
.ship-category--exploration { color: var(--color-accent); background: rgba(74, 158, 255, 0.1); }
.ship-category--transport { color: var(--color-highlight); background: rgba(255, 179, 0, 0.1); }
.ship-category--interceptor { color: #a78bfa; background: rgba(167, 139, 250, 0.1); }
.ship-category--racing { color: #f472b6; background: rgba(244, 114, 182, 0.1); }
.ship-category--military { color: #22c55e; background: rgba(34, 197, 94, 0.1); }
</style>
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/hud/ShipCategoryBadge.vue
git commit -m "feat(components): 新增舰船类别徽章组件 ShipCategoryBadge"
```

---

## 任务 10：装饰组件入口导出

**文件：**
- 创建：`src/components/hud/index.js`

- [ ] **步骤 1：创建统一导出文件**

```javascript
/**
 * @file HUD 装饰组件入口
 * @description 统一导出所有 HUD 装饰组件
 */
export { default as HudCorner } from './HudCorner.vue'
export { default as TechDivider } from './TechDivider.vue'
export { default as StarMapGrid } from './StarMapGrid.vue'
export { default as StatusPulse } from './StatusPulse.vue'
export { default as DataTicker } from './DataTicker.vue'
export { default as Scanline } from './Scanline.vue'
export { default as ShipCategoryBadge } from './ShipCategoryBadge.vue'
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/hud/index.js
git commit -m "feat(components): 新增 HUD 组件统一导出入口"
```

---

## 任务 11：验证阶段 1 构建

- [ ] **步骤 1：运行构建**

运行：`npm run build`

预期：构建成功，无字体相关错误。

- [ ] **步骤 2：检查是否有 Space Grotesk 残留**

运行：`grep -r "Space Grotesk" src/ public/`

预期：无匹配结果。

- [ ] **步骤 3：Commit（如修复残留）**

```bash
git commit -m "chore: 清理 Space Grotesk 残留引用"
```

---

## 任务 12：重制首页 HeroSection 组件

**文件：**
- 创建：`src/components/home/HeroSection.vue`
- 修改：`src/views/Home.vue`

- [ ] **步骤 1：创建新 Hero 组件**

```vue
<!--
  @file 首页英雄区
  @description 非对称分层电影构图，包含星云背景、舰船侧影、数据读数、CTA
-->
<template>
  <section class="hero-section">
    <StarMapGrid class="hero-section__grid" />

    <div class="hero-section__ship" aria-hidden="true">
      <img src="/images/sc/sc-matte-painting.jpg" alt="" class="hero-section__ship-img" />
      <div class="hero-section__ship-glow"></div>
    </div>

    <div class="hero-section__content">
      <div class="hero-section__badge">
        <StatusPulse variant="online" label="RECRUITING NOW" />
      </div>

      <h1 class="hero-section__title">
        <span class="hero-section__title-line">STELLAR</span>
        <span class="hero-section__title-line hero-section__title-line--accent">NEXUS</span>
      </h1>

      <TechDivider class="hero-section__divider" />

      <p class="hero-section__tagline">EXPLORE · FIGHT · CONQUER</p>

      <slot name="data-panel"></slot>

      <div class="hero-section__actions">
        <RouterLink to="/join" class="hero-section__btn hero-section__btn--primary">
          START APPLICATION
        </RouterLink>
        <RouterLink to="/fleet" class="hero-section__btn hero-section__btn--ghost">
          EXPLORE FLEET
        </RouterLink>
      </div>
    </div>

    <HudCorner position="top-left" size="lg" class="hero-section__corner hero-section__corner--tl" />
    <HudCorner position="bottom-right" size="lg" class="hero-section__corner hero-section__corner--br" />
  </section>
</template>

<script setup>
import { StarMapGrid, StatusPulse, TechDivider, HudCorner } from '../hud/index.js'
</script>

<style scoped>
.hero-section {
  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  padding: 0 var(--space-8);
  overflow: hidden;
  background: radial-gradient(ellipse at 70% 50%, rgba(74, 158, 255, 0.08) 0%, transparent 50%);
}

.hero-section__grid {
  z-index: 0;
}

.hero-section__ship {
  position: absolute;
  right: -10%;
  top: 50%;
  transform: translateY(-50%);
  width: 65vw;
  max-width: 1100px;
  opacity: 0.7;
  mask-image: linear-gradient(90deg, transparent 0%, black 20%, black 80%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 20%, black 80%, transparent 100%);
}

.hero-section__ship-img {
  width: 100%;
  height: auto;
  filter: grayscale(0.3) contrast(1.1) brightness(0.8);
}

.hero-section__ship-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 50%, rgba(74, 158, 255, 0.2) 0%, transparent 60%);
}

.hero-section__content {
  position: relative;
  z-index: 2;
  max-width: 620px;
}

.hero-section__badge {
  margin-bottom: var(--space-5);
}

.hero-section__title {
  font-family: var(--font-display);
  font-weight: 700;
  line-height: 0.9;
  letter-spacing: 0.08em;
  margin: 0 0 var(--space-4);
}

.hero-section__title-line {
  display: block;
  font-size: clamp(3rem, 8vw, 6rem);
  color: var(--color-text-heading);
}

.hero-section__title-line--accent {
  color: var(--color-accent);
  text-shadow: var(--glow-accent);
}

.hero-section__divider {
  width: 120px;
  margin-bottom: var(--space-5);
}

.hero-section__tagline {
  font-family: var(--font-data);
  font-size: var(--text-lg);
  letter-spacing: 0.2em;
  color: var(--color-text-label);
  margin-bottom: var(--space-6);
}

.hero-section__actions {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.hero-section__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--duration-normal) var(--ease-out);
}

.hero-section__btn--primary {
  background: var(--color-highlight);
  color: var(--color-bg);
  box-shadow: 0 0 20px rgba(255, 179, 0, 0.3);
}

.hero-section__btn--primary:hover {
  background: var(--color-highlight-bright);
  box-shadow: 0 0 30px rgba(255, 179, 0, 0.5);
  transform: translateY(-2px);
}

.hero-section__btn--ghost {
  background: transparent;
  color: var(--color-text-heading);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.hero-section__btn--ghost:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  box-shadow: 0 0 20px rgba(74, 158, 255, 0.15);
}

.hero-section__corner {
  position: absolute;
  z-index: 3;
}

.hero-section__corner--tl { top: 2rem; left: 2rem; }
.hero-section__corner--br { bottom: 2rem; right: 2rem; }

@media (max-width: 1024px) {
  .hero-section {
    grid-template-columns: 1fr;
    padding: var(--space-16) var(--space-5);
  }
  .hero-section__ship {
    width: 120vw;
    right: -30%;
    opacity: 0.4;
  }
  .hero-section__content {
    max-width: 100%;
  }
}
</style>
```

- [ ] **步骤 2：在 Home.vue 中替换原 Hero**

删除原 `<section class="hero">...</section>`，替换为：
```vue
<HeroSection>
  <template #data-panel>
    <HeroDataPanel />
  </template>
</HeroSection>
```

并在 `<script setup>` 中导入：
```javascript
import HeroSection from '../components/home/HeroSection.vue'
import HeroDataPanel from '../components/home/HeroDataPanel.vue'
```

- [ ] **步骤 3：Commit**

```bash
git add src/components/home/HeroSection.vue src/views/Home.vue
git commit -m "feat(home): 重制首页 Hero 为非对称分层电影构图"
```

---

## 任务 13：创建 HeroDataPanel 数据读数面板

**文件：**
- 创建：`src/components/home/HeroDataPanel.vue`

- [ ] **步骤 1：创建组件**

```vue
<!--
  @file Hero 数据读数面板
  @description 展示战队关键数据的小型 HUD 面板
-->
<template>
  <div class="hero-data-panel">
    <div v-for="item in items" :key="item.label" class="hero-data-panel__item">
      <span class="hero-data-panel__value">{{ item.value }}</span>
      <span class="hero-data-panel__label">{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup>
const items = [
  { value: '128', label: 'ACTIVE PILOTS' },
  { value: '2,400+', label: 'FLIGHT HOURS' },
  { value: '12', label: 'COMBAT READY' }
]
</script>

<style scoped>
.hero-data-panel {
  display: flex;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
  padding: var(--space-4) 0;
}

.hero-data-panel__item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.hero-data-panel__value {
  font-family: var(--font-data);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-heading);
  letter-spacing: -0.02em;
}

.hero-data-panel__label {
  font-family: var(--font-data);
  font-size: var(--text-xs);
  color: var(--color-text-label);
  letter-spacing: 0.12em;
}

@media (max-width: 640px) {
  .hero-data-panel {
    gap: var(--space-4);
  }
  .hero-data-panel__value {
    font-size: var(--text-xl);
  }
}
</style>
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/home/HeroDataPanel.vue
git commit -m "feat(home): 新增 Hero 数据读数面板 HeroDataPanel"
```

---

## 任务 14：创建 HeroTicker 并接入 Home.vue

**文件：**
- 创建：`src/components/home/HeroTicker.vue`
- 修改：`src/views/Home.vue`

- [ ] **步骤 1：创建组件**

```vue
<!--
  @file Hero 底部滚动 Ticker
  @description 展示舰队动态状态
-->
<template>
  <DataTicker
    :items="items"
    :duration="40"
    class="hero-ticker"
  />
</template>

<script setup>
import { DataTicker } from '../hud/index.js'

const items = [
  'FLEET ONLINE',
  'RECRUITING NOW',
  'SECTOR 7G CLEARED',
  'PATROL ROUTE ALPHA ACTIVE',
  '2 NEW PILOTS ENLISTED',
  'CARRIER NEXUS DOCKED'
]
</script>

<style scoped>
.hero-ticker {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 4;
}
</style>
```

- [ ] **步骤 2：在 Home.vue 的 HeroSection 后插入 HeroTicker**

```vue
<HeroTicker />
```

并导入：
```javascript
import HeroTicker from '../components/home/HeroTicker.vue'
```

- [ ] **步骤 3：Commit**

```bash
git add src/components/home/HeroTicker.vue src/views/Home.vue
git commit -m "feat(home): 新增 Hero 底部滚动 Ticker"
```

---

## 任务 15：优化星空粒子性能

**文件：**
- 修改：`src/views/Home.vue`

- [ ] **步骤 1：将 DOM 粒子数量上限降低并改用 Canvas（可选）**

简单方案：将 `starCount` 上限从 200 改为 100，移动端从 80 改为 40。

```javascript
const starCount = computed(() => isMobile.value ? 40 : 100)
```

如果希望更好性能，创建 `src/components/effects/StarfieldCanvas.vue` 替代 DOM 方案。

- [ ] **步骤 2：Commit**

```bash
git add src/views/Home.vue
git commit -m "perf(home): 降低星空粒子数量以提升低端设备性能"
```

---

## 任务 16：舰船图资产生产

**文件：**
- 创建：`scripts/generate-ship-images.md`
- 创建/替换：`public/images/ships/*.webp`

- [ ] **步骤 1：编写舰船图生成流程文档**

```markdown
# 舰船图生成流程

## 规格
- 尺寸：1920×1080
- 格式：WebP，质量 90
- 命名：`{slug}.webp`

## 视觉方向
舞台化产品目录：深空黑底 + 单束侧光 + 青色边缘光 + 琥珀指示灯 + 右下角铭牌。

## 获取方案
1. 优先从 Star Citizen 官方截图/社区渲染图获取基础素材
2. 使用 AI 工具统一生成缺失舰船图
3. 统一后期处理：
   - 背景压暗至 #050508
   - 添加青色边缘光（#4a9eff）
   - 添加琥珀指示灯（#ffb300）
   - 右下角添加铭牌：REG: {MANU}-{MODEL}-{CLASS} / {SIZE} / {CREW}
   - 导出 WebP

## 文件清单
- arrow.webp
- 400i.webp
- avenger-stalker.webp
- avenger-titan.webp
- ballista.webp
- caterpillar.webp
- cutlass-black.webp
- freelancer.webp
- gladius.webp
- hawk.webp
- herald.webp
- 350r.webp
```

- [ ] **步骤 2：准备/生成 12 张舰船图**

由于 AI 图像生成不在本工程直接执行，此步骤需要：
- 使用 `byted-seedream-image-generate` 或其他图像生成 skill 生成
- 或使用现有图片经过统一后期处理

临时占位：保留现有 SVG 占位图，直到新图生成完成。

- [ ] **步骤 3：Commit 流程文档**

```bash
git add scripts/generate-ship-images.md
git commit -m "docs(assets): 新增舰船图生成流程文档"
```

---

## 任务 17：替换舰船图片并验证 404

**文件：**
- 替换：`public/images/ships/*.webp`

- [ ] **步骤 1：生成/复制新图到 public/images/ships/**

确保文件名与 `src/data/shipDatabase.js` 中 `image` 字段一致。

- [ ] **步骤 2：验证图片无 404**

运行：`npm run build && npm run preview`

打开浏览器访问 `/fleet`，检查 Network 面板无 404。

- [ ] **步骤 3：Commit**

```bash
git add public/images/ships/
git commit -m "feat(assets): 替换 12 艘舰船图为统一风格高清渲染图"
```

---

## 任务 18：升级 Fleet.vue 舰船卡片

**文件：**
- 创建：`src/components/fleet/ShipCard.vue`
- 修改：`src/views/Fleet.vue`

- [ ] **步骤 1：创建新 ShipCard 组件**

```vue
<!--
  @file 舰队舰船卡片
  @description 新版舰船展示卡片，带 HUD 角标、类别徽章、数据条
-->
<template>
  <div class="ship-card" role="button" tabindex="0" @click="$emit('click')">
    <HudCorner position="top-left" size="sm" />
    <HudCorner position="bottom-right" size="sm" />

    <div class="ship-card__image">
      <img :src="ship.image" :alt="ship.name" loading="lazy" />
      <div class="ship-card__image-overlay"></div>
      <ShipCategoryBadge :category="ship.category" class="ship-card__category" />
    </div>

    <div class="ship-card__content">
      <span class="ship-card__manufacturer font-data">{{ ship.manufacturer }}</span>
      <h3 class="ship-card__name">{{ ship.name }}</h3>
      <p class="ship-card__role">{{ ship.role }}</p>

      <div class="ship-card__specs">
        <div v-for="spec in ship.specs" :key="spec.label" class="ship-card__spec">
          <span class="ship-card__spec-label font-data">{{ spec.label }}</span>
          <div class="spec-bar">
            <div class="spec-bar__fill" :style="{ width: spec.value + '%' }"></div>
          </div>
        </div>
      </div>

      <StatusPulse variant="online" label="COMBAT READY" class="ship-card__status" />
    </div>
  </div>
</template>

<script setup>
import { HudCorner, ShipCategoryBadge, StatusPulse } from '../hud/index.js'

const props = defineProps({
  ship: { type: Object, required: true }
})

defineEmits(['click'])
</script>

<style scoped>
.ship-card {
  position: relative;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
}

.ship-card:hover {
  border-color: rgba(74, 158, 255, 0.3);
  box-shadow: var(--glow-card-hover);
  transform: translateY(-4px);
}

.ship-card__image {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.ship-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-slow) var(--ease-out);
}

.ship-card:hover .ship-card__image img {
  transform: scale(1.05);
}

.ship-card__image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(5, 5, 8, 0.9) 100%);
}

.ship-card__category {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.ship-card__content {
  padding: var(--space-5);
}

.ship-card__manufacturer {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-text-dim);
  margin-bottom: var(--space-1);
}

.ship-card__name {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-heading);
  margin-bottom: var(--space-2);
}

.ship-card__role {
  font-size: var(--text-sm);
  color: var(--color-text-label);
  margin-bottom: var(--space-4);
  line-height: 1.5;
}

.ship-card__specs {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.ship-card__spec {
  display: grid;
  grid-template-columns: 60px 1fr;
  align-items: center;
  gap: var(--space-2);
}

.ship-card__spec-label {
  font-size: var(--text-xs);
  color: var(--color-text-dim);
}

.spec-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.spec-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent), var(--color-accent-bright));
  border-radius: 2px;
}

.ship-card__status {
  color: var(--color-text-dim);
}
</style>
```

- [ ] **步骤 2：在 Fleet.vue 中替换原卡片循环**

将原 `ship-grid` 中的卡片结构替换为：
```vue
<ShipCard
  v-for="ship in filteredShips"
  :key="ship.slug"
  :ship="ship"
  @click="goToShip(ship.slug)"
/>
```

导入：
```javascript
import ShipCard from '../components/fleet/ShipCard.vue'
```

- [ ] **步骤 3：Commit**

```bash
git add src/components/fleet/ShipCard.vue src/views/Fleet.vue
git commit -m "feat(fleet): 升级舰船卡片，新增 HUD 角标与类别徽章"
```

---

## 任务 19：Fleet 分类过渡动画

**文件：**
- 修改：`src/views/Fleet.vue`

- [ ] **步骤 1：为分类切换添加过渡**

在 `ship-grid` 外层包裹 transition-group：
```vue
<TransitionGroup name="ship-list" tag="div" class="ship-grid">
  <ShipCard
    v-for="ship in filteredShips"
    :key="ship.slug"
    :ship="ship"
    @click="goToShip(ship.slug)"
  />
</TransitionGroup>
```

添加样式：
```css
.ship-list-move,
.ship-list-enter-active,
.ship-list-leave-active {
  transition: all 0.4s var(--ease-out);
}

.ship-list-enter-from,
.ship-list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.ship-list-leave-active {
  position: absolute;
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/views/Fleet.vue
git commit -m "feat(fleet): 为分类筛选添加列表过渡动画"
```

---

## 任务 20：ShipDetail 数据面板 HUD 化

**文件：**
- 修改：`src/views/ShipDetail.vue`

- [ ] **步骤 1：在数据面板中加入 StatusPulse 和 HudCorner**

在关键数据项旁边加入：
```vue
<StatusPulse variant="online" label="SYSTEMS NOMINAL" />
```

在数据面板容器四角加入：
```vue
<HudCorner position="top-left" size="sm" />
<HudCorner position="bottom-right" size="sm" />
```

- [ ] **步骤 2：调整数据面板样式**

为数据面板添加 HUD 风格边框：
```css
.ship-detail__panel {
  position: relative;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
}
```

- [ ] **步骤 3：Commit**

```bash
git add src/views/ShipDetail.vue
git commit -m "feat(ship-detail): 数据面板增加 HUD 风格装饰"
```

---

## 任务 21：导航栏 HUD 化

**文件：**
- 修改：`src/components/AppHeader.vue`（或当前导航组件）

- [ ] **步骤 1：读取当前导航组件路径**

运行：`ls src/components/ | grep -i nav`

- [ ] **步骤 2：添加 HUD 装饰**

```vue
<template>
  <header class="app-header">
    <HudCorner position="bottom-left" size="sm" />
    <HudCorner position="bottom-right" size="sm" />
    <!-- 原有导航内容 -->
  </header>
</template>

<script setup>
import { HudCorner } from './hud/index.js'
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-header);
  background: rgba(5, 5, 8, 0.75);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-hud-line);
}
</style>
```

- [ ] **步骤 3：Commit**

```bash
git add src/components/AppHeader.vue
git commit -m "feat(ui): 导航栏增加 HUD 风格毛玻璃和角标装饰"
```

---

## 任务 22：全局 prefers-reduced-motion 支持

**文件：**
- 修改：`src/styles/variables.css` 或 `src/styles/base.css`

- [ ] **步骤 1：添加全局减弱动效规则**

在全局 CSS 中添加：
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/styles/variables.css
git commit -m "feat(a11y): 增加 prefers-reduced-motion 全局支持"
```

---

## 任务 23：最终构建与验收验证

- [ ] **步骤 1：运行生产构建**

运行：`npm run build`

预期：无 TypeScript/Vite 错误。

- [ ] **步骤 2：启动预览并检查关键页面**

运行：`npm run preview`

检查：
- `/` 首页 Hero 正常显示
- `/fleet` 12 张舰船图无 404
- `/fleet/arrow` 详情页正常
- `/members` 成员页无视觉回归
- 移动端布局正常

- [ ] **步骤 3：对比验收标准**

| 验收项 | 状态 |
|---|---|
| 首页 Hero 在 1920×1080 和 375×812 下均有视觉冲击 | 待验证 |
| 12 艘舰船图片风格统一，无 404 | 待验证 |
| Fleet 页面 12 张卡片整齐一致，hover 流畅 | 待验证 |
| 全站字体统一，无 Rajdhani/Space Grotesk 冲突 | 待验证 |
| 新增装饰组件可在 3 个及以上页面复用 | 待验证 |
| `npm run build` 通过 | 待验证 |
| 支持 `prefers-reduced-motion` | 待验证 |
| 主要交互路径无视觉回归 | 待验证 |

- [ ] **步骤 4：最终 Commit（如无修复）**

```bash
git commit --allow-empty -m "chore(release): 前端视觉升级完成"
```
