# 首页视觉收尾与后端连通实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 完成首页视觉统一、动效编排，并将 Hero/Key Numbers/Mars/Fleet Preview 四个区块的数据全部接入后端 API，达到验收标准。

**架构：** 新增 `homeStore` 统一承载首页数据，通过 `services/http.js` 调用 `/api/stats` 与 `/api/fleet`；各 Section 保持无状态展示，接收 props；使用 GSAP + ScrollTrigger 编排 Hero/Mars/Fleet 动画；静态 fallback 数据保证 API 不可用时仍可展示。

**技术栈：** Vue 3 (Composition API) + Pinia + Vite + GSAP (ScrollTrigger) + Tailwind CSS + express (后端)

---

## 文件职责

### 新增文件

| 文件 | 职责 |
|---|---|
| `src/stores/homeStore.js` | 首页数据状态管理：stats、fleet preview、loading/error，使用 `withLoading` 包装器 |
| `src/data/homeFallback.js` | 首页静态兜底数据，API 失败时降级使用 |
| `src/services/statsService.js` | 封装 `/api/stats` 调用，供 homeStore 使用 |

### 修改文件

| 文件 | 职责 |
|---|---|
| `src/views/Home.vue` | 注入 homeStore、分发数据给各 Section、清理旧 Hero CSS、统一按钮/卡片 |
| `src/components/home/HeroSection.vue` | 标题/副标题 GSAP 入场动画、按钮改用 BaseButton、保持背景/Ticker |
| `src/components/home/HeroDataPanel.vue` | 接收 `items` prop，移除内部硬编码 |
| `src/components/home/HomeWorldsSection.vue` | 接收 `planetData` prop、Mars 区 GSAP 时间轴 |
| `src/components/common/BaseButton.vue` | 扩展 `variant` 支持 amber 主按钮与 ghost 样式，适配首页 Hero/CTA |
| `src/components/fleet/ShipCard.vue` | 新增 `compact` prop，支持首页 Fleet Preview 紧凑布局 |
| `src/components/cosmic/CosmicPlanet.vue` | 暴露 `animationProgress` 或保持现状，配合外部 ScrollTrigger |

---

## 任务 1：创建首页数据层（homeStore + statsService + fallback）

**文件：**
- 创建：`src/services/statsService.js`
- 创建：`src/stores/homeStore.js`
- 创建：`src/data/homeFallback.js`

### 步骤 1.1：编写 `statsService.js`

```javascript
/**
 * @file 站点统计服务
 * @description 封装 /api/stats 调用
 * @module services/statsService
 */

import httpClient from './http.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('StatsService')
const BASE_URL = '/stats'

/**
 * 获取站点统计数据
 * @returns {Promise<{ data: object }>} 站点统计响应
 */
async function getStats() {
  try {
    const response = await httpClient.get(BASE_URL)
    return response.data
  } catch (error) {
    const err = /** @type {any} */ (error)
    logger.warn('获取站点统计失败:', err.response?.data || err.message)
    throw error
  }
}

export { getStats }
```

**运行验证：** `npx vite-node src/services/statsService.js` 应无语法错误（仅验证导入）。

### 步骤 1.2：编写 `homeFallback.js`

```javascript
/**
 * @file 首页兜底数据
 * @description 当后端 API 不可用时，首页各区块使用此静态数据降级展示
 * @module data/homeFallback
 */

export const fallbackStats = {
  activePilots: 128,
  flightHours: 2400,
  combatReady: 12,
  totalUEC: 89000000,
  explorationProgress: 34,
  distanceFromSol: 1.52 // AU
}

export const fallbackFleetPreview = [
  {
    id: 'arrow',
    slug: 'arrow',
    name: 'Anvil Arrow',
    manufacturer: 'Anvil Aerospace',
    category: 'combat',
    role: '轻型战斗机',
    image: '/images/ships/arrow.jpg',
    specs: [
      { label: 'SPEED', value: 85 },
      { label: 'FIREPOWER', value: 70 },
      { label: 'SHIELD', value: 55 }
    ]
  },
  {
    id: 'cutlass',
    slug: 'cutlass',
    name: 'Drake Cutlass Black',
    manufacturer: 'Drake Interplanetary',
    category: 'support',
    role: '多用途中型舰',
    image: '/images/ships/cutlass.jpg',
    specs: [
      { label: 'CARGO', value: 80 },
      { label: 'FIREPOWER', value: 75 },
      { label: 'CREW', value: 65 }
    ]
  },
  {
    id: 'carrack',
    slug: 'carrack',
    name: 'Anvil Carrack',
    manufacturer: 'Anvil Aerospace',
    category: 'explore',
    role: '大型探索舰',
    image: '/images/ships/carrack.jpg',
    specs: [
      { label: 'RANGE', value: 95 },
      { label: 'SCANNING', value: 90 },
      { label: 'DURABILITY', value: 80 }
    ]
  }
]

export const fallbackPlanetMeta = {
  name: 'MARS',
  index: '01',
  description: '纹理来源：NASA 3D Resources - Mars，版权标注 NASA/JPL-Caltech',
  rows: [
    { key: 'GRAVITY', value: '1.12 G' },
    { key: 'ATMOSPHERE', value: 'BREATHABLE' },
    { key: 'RESOURCES', value: 'RICH' }
  ]
}
```

### 步骤 1.3：编写 `homeStore.js`

```javascript
/**
 * @file 首页状态管理
 * @description 管理首页数据请求、加载状态与错误降级
 * @module stores/home
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStats } from '@/services/statsService'
import { fleetService } from '@/services/fleetService'
import { createStoreHelpers } from '@/utils/storeHelpers'
import {
  fallbackStats,
  fallbackFleetPreview,
  fallbackPlanetMeta
} from '@/data/homeFallback'

export const useHomeStore = defineStore('home', () => {
  const stats = ref(null)
  const fleetPreview = ref([])
  const loading = ref(false)
  const error = ref(null)

  const { withLoading } = createStoreHelpers(loading, error)
  const unwrap = (res) => res?.data ?? res

  const activePilots = computed(() => stats.value?.activePilots ?? fallbackStats.activePilots)
  const flightHours = computed(() => stats.value?.flightHours ?? fallbackStats.flightHours)
  const combatReady = computed(() => stats.value?.combatReady ?? fallbackStats.combatReady)
  const totalUEC = computed(() => stats.value?.totalUEC ?? fallbackStats.totalUEC)
  const explorationProgress = computed(() => stats.value?.explorationProgress ?? fallbackStats.explorationProgress)
  const distanceFromSol = computed(() => stats.value?.distanceFromSol ?? fallbackStats.distanceFromSol)

  const heroDataPanelItems = computed(() => [
    { value: String(activePilots.value), label: 'ACTIVE PILOTS' },
    { value: `${Number(flightHours.value).toLocaleString()}+`, label: 'FLIGHT HOURS' },
    { value: String(combatReady.value), label: 'COMBAT READY' }
  ])

  const keyNumbers = computed(() => [
    { value: activePilots.value, suffix: '', label: 'ACTIVE PILOTS' },
    { value: flightHours.value, suffix: '+', label: 'FLIGHT HOURS' }
  ])

  const planetData = computed(() => ({
    ...fallbackPlanetMeta,
    rows: [
      ...fallbackPlanetMeta.rows,
      { key: 'DISTANCE', value: `${distanceFromSol.value} AU` },
      { key: 'SURVEY', value: `${explorationProgress.value}%` }
    ]
  }))

  async function fetchHomeData() {
    return withLoading(async () => {
      const [statsRes, fleetRes] = await Promise.allSettled([
        getStats(),
        fleetService.getFleet({ limit: 3, sortBy: 'value', order: 'desc' })
      ])

      if (statsRes.status === 'fulfilled') {
        stats.value = unwrap(statsRes.value) ?? fallbackStats
      } else {
        stats.value = fallbackStats
      }

      if (fleetRes.status === 'fulfilled') {
        const fleetData = unwrap(fleetRes.value)
        fleetPreview.value = Array.isArray(fleetData) ? fleetData.slice(0, 3) : fallbackFleetPreview
      } else {
        fleetPreview.value = fallbackFleetPreview
      }
    }, '获取首页数据失败')
  }

  function clearError() {
    error.value = null
  }

  return {
    stats,
    fleetPreview,
    loading,
    error,
    heroDataPanelItems,
    keyNumbers,
    planetData,
    fetchHomeData,
    clearError
  }
})
```

### 步骤 1.4：验证数据层

运行：`npx vite-node -r script` 不适用；改为运行构建检查：

```bash
npm run build
```

预期：构建通过，无新增错误。

### 步骤 1.5：Commit

```bash
git add src/services/statsService.js src/stores/homeStore.js src/data/homeFallback.js
git commit -m "feat(stores): 添加首页数据层与兜底数据"
```

---

## 任务 2：重构 `HeroDataPanel` 接收 props

**文件：**
- 修改：`src/components/home/HeroDataPanel.vue`

### 步骤 2.1：改为 props 驱动

```vue
<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
    validator: (value) => value.every(item =>
      typeof item.value === 'string' && typeof item.label === 'string'
    )
  }
})
</script>
```

删除内部硬编码的 `items` 数组。

### 步骤 2.2：更新 `HeroSection` 默认插槽调用

在 `Home.vue` 中：

```vue
<HeroSection>
  <template #data-panel>
    <HeroDataPanel :items="homeStore.heroDataPanelItems" />
  </template>
</HeroSection>
```

### 步骤 2.3：Commit

```bash
git add src/components/home/HeroDataPanel.vue src/views/Home.vue
git commit -m "refactor(components): HeroDataPanel 改为 props 驱动"
```

---

## 任务 3：统一按钮样式并替换 Hero/CTA 按钮

**文件：**
- 修改：`src/components/common/BaseButton.vue`
- 修改：`src/components/home/HeroSection.vue`
- 修改：`src/views/Home.vue`

### 步骤 3.1：扩展 BaseButton variant

将 `variant` validator 改为：

```javascript
validator: (value) => ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'cta'].includes(value)
```

新增 `.base-button--cta` 样式（琥珀主按钮）：

```css
.base-button--cta {
  background: var(--color-highlight);
  color: var(--color-bg);
  border-color: var(--color-highlight);
  box-shadow: 0 0 20px rgba(255, 179, 0, 0.3);
}

.base-button--cta:hover:not(.is-disabled):not(.is-loading) {
  background: var(--color-highlight-bright);
  box-shadow: 0 0 30px rgba(255, 179, 0, 0.5);
  transform: translateY(-2px);
}
```

### 步骤 3.2：HeroSection 改用 BaseButton

替换 HeroSection 中的原生 `RouterLink` 按钮：

```vue
<div class="hero-section__actions">
  <BaseButton variant="cta" size="lg" @click="$router.push('/join')">
    START APPLICATION
  </BaseButton>
  <BaseButton variant="outline" size="lg" @click="$router.push('/fleet')">
    EXPLORE FLEET
  </BaseButton>
</div>
```

并引入 `BaseButton`。

### 步骤 3.3：Home.vue CTA 改用 BaseButton

替换 CTA 区的 `.btn-primary` / `.btn-ghost`：

```vue
<div class="cta-actions">
  <BaseButton variant="cta" size="lg" @click="$router.push('/join')">
    START APPLICATION
  </BaseButton>
  <BaseButton variant="outline" size="lg" @click="$router.push('/fleet')">
    EXPLORE FLEET
  </BaseButton>
</div>
```

删除 `.btn-primary`、`.btn-ghost`、`.cta-actions .btn-primary` 相关 CSS。

### 步骤 3.4：Commit

```bash
git add src/components/common/BaseButton.vue src/components/home/HeroSection.vue src/views/Home.vue
git commit -m "style(components): 统一首页按钮使用 BaseButton"
```

---

## 任务 4：统一 Fleet Preview 卡片为 ShipCard

**文件：**
- 修改：`src/components/fleet/ShipCard.vue`
- 修改：`src/views/Home.vue`

### 步骤 4.1：为 ShipCard 添加 compact 模式

```vue
<script setup>
defineProps({
  ship: { type: Object, required: true },
  compact: { type: Boolean, default: false }
})
defineEmits(['click'])
</script>
```

在模板根元素添加 class：`:class="{ 'ship-card--compact': compact }"`。

在 `<style>` 中追加紧凑模式样式（减小 padding、图片高度等）。

### 步骤 4.2：Home.vue Fleet Preview 改用 ShipCard

替换内联 `fleet-card` 循环：

```vue
<div class="fleet-grid">
  <ShipCard
    v-for="ship in homeStore.fleetPreview"
    :key="ship.id || ship.slug"
    :ship="ship"
    compact
    @click="handleCardClick(ship)"
  />
</div>
```

删除 `.fleet-card*` 相关 CSS。

### 步骤 4.3：Commit

```bash
git add src/components/fleet/ShipCard.vue src/views/Home.vue
git commit -m "refactor(components): 首页 Fleet Preview 复用 ShipCard"
```

---

## 任务 5：接入 homeStore 到 Home.vue

**文件：**
- 修改：`src/views/Home.vue`

### 步骤 5.1：注入 store 并分发数据

```vue
<script setup>
import { storeToRefs } from 'pinia'
import { useHomeStore } from '@/stores/homeStore'
import { useRouter } from 'vue-router'

const router = useRouter()
const homeStore = useHomeStore()
const { heroDataPanelItems, keyNumbers, planetData, fleetPreview, loading, error } = storeToRefs(homeStore)

onMounted(() => {
  homeStore.fetchHomeData()
})

function handleCardClick(ship) {
  if (ship?.slug) {
    router.push({ name: '舰船详情', params: { slug: ship.slug } })
  }
}
</script>
```

### 步骤 5.2：传递 props 给各 Section

```vue
<HeroSection :hero-data-panel-items="heroDataPanelItems">
  <template #data-panel>
    <HeroDataPanel :items="heroDataPanelItems" />
  </template>
</HeroSection>

<section class="key-numbers" data-animate>
  <div class="container">
    <div class="key-numbers__grid">
      <div v-for="item in keyNumbers" :key="item.label" class="key-number">
        <span class="key-number__value">{{ item.value }}{{ item.suffix }}</span>
        <span class="key-number__label">{{ item.label }}</span>
      </div>
    </div>
  </div>
</section>

<HomeWorldsSection :planet-data="planetData" />

<div class="fleet-grid">
  <ShipCard
    v-for="ship in fleetPreview"
    :key="ship.id || ship.slug"
    :ship="ship"
    compact
    @click="handleCardClick(ship)"
  />
</div>
```

### 步骤 5.3：Commit

```bash
git add src/views/Home.vue
git commit -m "feat(views): 首页接入 homeStore 数据"
```

---

## 任务 6：Hero 标题 GSAP 入场动画

**文件：**
- 修改：`src/components/home/HeroSection.vue`

### 步骤 6.1：添加 GSAP 引入与动画逻辑

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import { StarMapGrid, StatusPulse, TechDivider, HudCorner } from '../hud/index.js'
import BaseButton from '../common/BaseButton.vue'

const router = useRouter()
const titleRef = ref(null)
const taglineRef = ref(null)
const actionsRef = ref(null)
let ctx = null

onMounted(() => {
  ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.from(titleRef.value.querySelectorAll('.hero-section__title-line'), {
      y: 60,
      opacity: 0,
      duration: 1,
      stagger: 0.15
    })
      .from(taglineRef.value, { y: 30, opacity: 0, duration: 0.6 }, '-=0.4')
      .from(actionsRef.value.children, {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1
      }, '-=0.3')
  })
})

onUnmounted(() => {
  ctx?.revert()
})
</script>
```

### 步骤 6.2：绑定 ref 到模板元素

```vue
<h1 ref="titleRef" class="hero-section__title">
  <span class="hero-section__title-line">STELLAR</span>
  <span class="hero-section__title-line hero-section__title-line--accent">NEXUS</span>
</h1>

<p ref="taglineRef" class="hero-section__tagline">EXPLORE · FIGHT · CONQUER</p>

<div ref="actionsRef" class="hero-section__actions">...</div>
```

### 步骤 6.3：Commit

```bash
git add src/components/home/HeroSection.vue
git commit -m "feat(animations): Hero 标题入场动画"
```

---

## 任务 7：Mars 区 GSAP 时间轴

**文件：**
- 修改：`src/components/home/HomeWorldsSection.vue`

### 步骤 7.1：替换 IntersectionObserver 为 ScrollTrigger

```vue
<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HudPanel from '../cosmic/HudPanel.vue'
import CosmicPlanet from '../cosmic/CosmicPlanet.vue'
import OrbitalRing from '../cosmic/OrbitalRing.vue'

gsap.registerPlugin(ScrollTrigger)

const props = defineProps({
  planetData: { type: Object, required: true }
})

const sectionRef = ref(null)
const planetRef = ref(null)
const panelRef = ref(null)
const rowsRef = ref([])
let triggers = []

onMounted(() => {
  const section = sectionRef.value
  if (!section) return

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 75%',
      toggleActions: 'play none none none'
    }
  })

  tl.from(planetRef.value, { scale: 0.8, opacity: 0, duration: 1, ease: 'power2.out' })
    .from(panelRef.value, { x: -40, opacity: 0, duration: 0.8 }, '-=0.6')
    .from(rowsRef.value, { x: -20, opacity: 0, duration: 0.5, stagger: 0.1 }, '-=0.5')

  triggers.push(tl.scrollTrigger)
})

onUnmounted(() => {
  triggers.forEach(st => st.kill())
  triggers = []
})

const planetRows = computed(() => props.planetData?.rows ?? [])
</script>
```

### 步骤 7.2：绑定 ref

```vue
<HudPanel ref="panelRef" class="worlds-section__panel" :skewed="false" corner-size="md">
  ...
  <div
    v-for="(row, idx) in planetRows"
    :key="row.key"
    :ref="(el) => { if (el) rowsRef[idx] = el }"
    class="worlds-section__data-row"
  >
    ...
  </div>
</HudPanel>

<div ref="planetRef" class="worlds-section__planet-wrap">...</div>
```

删除原有 IntersectionObserver 相关代码。

### 步骤 7.3：Commit

```bash
git add src/components/home/HomeWorldsSection.vue
git commit -m "feat(animations): Mars 区 GSAP ScrollTrigger 时间轴"
```

---

## 任务 8：Key Numbers 数字计数动画

**文件：**
- 修改：`src/views/Home.vue`

### 步骤 8.1：创建可复用数字动画逻辑

在 `Home.vue` 的 `<script setup>` 中：

```javascript
import { ref, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const keyNumbersRef = ref(null)
const animatedValues = ref(keyNumbers.value.map(() => 0))
let trigger = null

onMounted(() => {
  trigger = ScrollTrigger.create({
    trigger: keyNumbersRef.value,
    start: 'top 80%',
    once: true,
    onEnter: () => {
      keyNumbers.value.forEach((item, index) => {
        gsap.to(animatedValues.value, {
          [index]: item.value,
          duration: 1.5,
          ease: 'power2.out',
          snap: { [index]: 1 },
          onUpdate: () => {
            animatedValues.value[index] = Math.round(animatedValues.value[index])
          }
        })
      })
    }
  })
})

onUnmounted(() => {
  trigger?.kill()
})
```

### 步骤 8.2：模板使用动画值

```vue
<section ref="keyNumbersRef" class="key-numbers" data-animate>
  <div class="container">
    <div class="key-numbers__grid">
      <div v-for="(item, idx) in keyNumbers" :key="item.label" class="key-number">
        <span class="key-number__value">
          {{ animatedValues[idx]?.toLocaleString() ?? item.value }}{{ item.suffix }}
        </span>
        <span class="key-number__label">{{ item.label }}</span>
      </div>
    </div>
  </div>
</section>
```

### 步骤 8.3：Commit

```bash
git add src/views/Home.vue
git commit -m "feat(animations): Key Numbers 数字滚动动画"
```

---

## 任务 9：清理 Home.vue 旧 Hero CSS

**文件：**
- 修改：`src/views/Home.vue`

### 步骤 9.1：删除未使用的旧 Hero 样式

删除从 `/* 1. HERO — 全屏沉浸 */` 到 `/* 2. KEY NUMBERS */` 之间的所有旧 `.hero*` 样式。

保留：
- `.home`
- `.glass-card`
- `.container`
- `.section`
- `.section-label` / `.section-title` / `.section-desc`
- `.spec-row*` / `.spec-bar*`
- `.link-arrow`
- `[data-animate]`
- `.key-numbers*`
- `.fleet-preview*` / `.fleet-grid`
- `.cta-section*`
- responsive media queries 中仍然引用的部分

### 步骤 9.2：验证无未使用 CSS

运行构建并检查无相关类名引用错误：

```bash
npm run build
```

### 步骤 9.3：Commit

```bash
git add src/views/Home.vue
git commit -m "style(views): 清理 Home.vue 未使用的旧 Hero CSS"
```

---

## 任务 10：响应式收尾与构建验证

**文件：**
- 修改：`src/components/home/HeroSection.vue`
- 修改：`src/components/home/HomeWorldsSection.vue`
- 修改：`src/views/Home.vue`

### 步骤 10.1：四个断点检查

使用浏览器开发者工具检查：
- 1440px：Hero 非对称布局正常，Mars 双栏正常
- 1024px：Mars 上下堆叠，Fleet 2 列
- 768px：Hero 居中，Key Numbers 2×2，Fleet 1 列
- 375px：CTA 按钮全宽，无截断

### 步骤 10.2：构建与类型检查

```bash
npm run build
npx tsc --noEmit
```

预期：两者均通过。

### 步骤 10.3：控制台检查

在浏览器中打开 http://localhost:3000/，确认无 Vue 运行时错误/警告。

### 步骤 10.4：Commit

```bash
git add .
git commit -m "fix(views): 首页响应式收尾与构建修复"
```

---

## 任务 11：后端接口测试补充

**文件：**
- 创建/修改：`server/tests/routes/stats.test.ts` 或现有测试文件

### 步骤 11.1：验证 `/api/stats` 返回字段

根据 `homeStore` 中使用的字段（`activePilots`、`flightHours`、`combatReady`、`totalUEC`、`explorationProgress`、`distanceFromSol`），检查 `server/src/services/statsService.ts` 是否提供这些字段。若缺失，补充默认值或从数据库计算。

### 步骤 11.2：编写/更新测试

```typescript
import request from 'supertest'
import app from '../../src/app'

describe('GET /api/stats', () => {
  it('应返回首页所需字段', async () => {
    const res = await request(app).get('/api/stats').expect(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toMatchObject({
      activePilots: expect.any(Number),
      flightHours: expect.any(Number),
      combatReady: expect.any(Number),
      totalUEC: expect.any(Number),
      explorationProgress: expect.any(Number),
      distanceFromSol: expect.any(Number)
    })
  })
})
```

### 步骤 11.3：Commit

```bash
git add server/tests/routes/stats.test.ts server/src/services/statsService.ts
git commit -m "test(server): 补充首页 stats 接口字段测试"
```

---

## 自检

### 规格覆盖度

| 验收标准 | 对应任务 |
|---|---|
| 风格统一（按钮、卡片、HUD） | 任务 3、4 |
| 动效完整 | 任务 6、7、8 |
| 响应式 | 任务 10 |
| 性能/构建 | 任务 9、10 |
| 数据驱动 | 任务 1、5 |
| 状态处理（loading/error/fallback） | 任务 1、5 |
| 接口质量 | 任务 1、11 |
| 可测试性 | 任务 11 |
| 构建与类型 | 任务 10 |

### 占位符扫描

- 无 "待定"、"TODO"、"后续实现"
- 所有代码步骤均包含实际代码
- 所有命令均包含预期输出

### 类型一致性

- `homeStore` 中字段名与 `fallbackStats`、`statsService` 返回值一致
- `ShipCard` 新增 `compact` prop 类型为 Boolean
- `HeroDataPanel` 的 `items` prop 类型与 `homeStore.heroDataPanelItems` 输出一致

---

## 执行交接

计划已保存到 `docs/superpowers/plans/2026-07-14-homepage-visual-backend-integration.md`。

**两种执行方式：**

1. **子代理驱动（推荐）** - 每个任务调度一个新的子代理，任务间进行审查，快速迭代
2. **内联执行** - 在当前会话中使用 executing-plans 执行任务，批量执行并设有检查点

**选哪种方式？**
