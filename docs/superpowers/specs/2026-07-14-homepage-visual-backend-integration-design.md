# 首页视觉收尾与后端连通设计方案

## 背景与目标

当前项目（star-citizen-promotion）前端首页已完成主要视觉结构：Hero 区、Key Numbers、Mars 星球展示、Fleet 预览、CTA。但仍存在数据硬编码、视觉风格不统一、部分动效未编排、旧 CSS 冗余等问题。本文档确定首页的视觉收尾方案与后端数据连通方案，作为后续实现与验收的依据。

## 验收标准

### 视觉展示
1. 首页 Hero、Key Numbers、Mars、Fleet Preview、CTA 五个区块的按钮主色、卡片圆角/描边、发光色、字体层级一致。
2. Hero 标题/副标题有入场动画；Key Numbers 数字有计数动画；Mars 星球/轨道/卫星有可见运动；Fleet 卡片悬停有反馈；滚动触发无卡顿。
3. 在 1440px / 1024px / 768px / 375px 四个断点下，无元素重叠、截断或可读性问题。
4. 本地 `vite build` 通过，首页 LCP < 2.5s，控制台无 Vue 运行时错误/警告（后端未启动的预期警告除外）。
5. 移除 Home.vue 中未使用的旧 Hero CSS，统一使用现有设计系统变量和组件。

### 后端连通
6. Hero 数据面板、Key Numbers、Mars 区数据、Fleet 预览卡片 100% 来自 `/api/*`，不再在组件中硬编码业务数据。
7. 数据加载有 HUD 风格骨架屏/loading，错误/空状态有降级显示，不白屏。
8. 本地 API 响应时间 < 500ms；失败时前端可优雅降级到静态 fallback。
9. 新增/修改的后端路由有单元测试；前端 API 调用层有类型定义。

### 通用
10. `vite build` 和 `tsc --noEmit` 均通过，无类型错误。

## 总体推进方案

采用 **页面驱动** 方案：按页面逐个交付，先完成首页，再进入舰队页等后续页面。每个页面同时做视觉收尾与后端数据打通，验收通过后再进入下一页面。

选择理由：首页已完成约 70%，优先把首页做到可交付能立即验证视觉方向；同时沉淀可复用组件，供后续页面直接使用。

## 详细设计

### 第一节：首页数据架构

#### 数据接口

复用/新增以下后端接口，全部走现有 `services/http.js`：

| 首页区块 | 数据来源 | 说明 |
|---|---|---|
| Hero 数据面板 | `GET /api/stats` | 成员数、舰队数、活动数、总 UEC 等 |
| Key Numbers | `GET /api/stats` | 同上，取子集 |
| Mars 区 HUD 数据 | `GET /api/stats` + 静态元信息 | 轨道半径、重力、温度等行星参数硬编码为展示元数据；实时数据（如日距、探索进度）来自 stats |
| Fleet 预览卡片 | `GET /api/fleet?limit=3` | 取 3 艘推荐舰船，后端已支持分页 |

#### 前端数据流

- 新增 `src/stores/homeStore.js`：使用 Pinia + `withLoading` 包装器管理首页 3 个数据请求。
- 在 `Home.vue` 的 `onMounted` 中统一触发 `homeStore.fetchHomeData()`。
- 各 Section 通过 props 接收数据，保持无状态展示。
- 错误处理：任一接口失败时，该区块显示 HUD 风格错误提示，不影响其他区块；首次加载使用骨架屏。

#### 静态 fallback

- 在 `src/data/homeFallback.js` 保留一组兜底数据（当前硬编码内容），当 API 不可用时降级显示，避免白屏。

### 第二节：视觉统一方案

#### 问题

- Hero CTA 按钮是琥珀色，CTA 区按钮是蓝色。
- 首页 Fleet Preview 用自定义卡片，舰队页用 `ShipCard.vue`，两套样式。
- Home.vue 残留旧 Hero CSS，和新设计系统变量重复。

#### 改动

1. **按钮统一**
   - 扩展 `BaseButton.vue` 的 `variant` props：`primary`（琥珀主按钮）、`secondary`（幽灵边框）、`cta`（CTA 区专用，统一为琥珀）。
   - Hero 和 CTA 区统一使用 `variant="primary"`，确保整个首页主 CTA 同色。

2. **卡片统一**
   - 首页 Fleet Preview 改用复用组件 `ShipCard.vue`（已存在），不再单独写卡片。
   - 如果 `ShipCard` 缺少首页需要的紧凑布局，新增 `compact` prop 控制高度/字号。

3. **清理冗余**
   - 删除 `Home.vue` 中未使用的 `.hero__stars`、`.hero__bg-*`、`.hero__grid` 等旧 CSS。
   - 所有颜色使用 `src/styles/variables.css` 中已定义的 semantic token（`--color-primary` 等）。

4. **HUD 装饰统一**
   - Hero 数据面板和 Mars 区 HUD 面板统一使用 `HudPanel.vue`。
   - 统一 corner accent、边框发光、扫描线高度。

### 第三节：动效增强方案

#### 问题

- Hero 标题/副标题缺少分字/逐行动画，冲击力不够。
- Mars 区当前用简单 IntersectionObserver 触发，缺少时间轴编排。
- Key Numbers 数字进入视口时机和 Mars 动画没有联动。

#### 改动

1. **Hero 标题入场**
   - 使用 GSAP SplitText 或手动按行/词拆分 `h1` 和 `p`。
   - 时间轴：`h1` 逐词从下方滑入 + 透明度 → 0.3s 后副标题逐行淡入 → 再 0.3s 后数据面板从右侧滑入。
   - 保留当前 StarMapGrid 背景微动和 Ticker 滚动。

2. **Key Numbers 数字动画**
   - 进入视口时触发 `gsap.to()` 从 0 计数到目标值。
   - 增加“数字闪烁/扫描”效果：计数完成后 0.2s 内亮度提升再恢复。

3. **Mars 区时间轴**
   - 创建 `gsap.timeline({ scrollTrigger: ... })`。
   - 顺序：星球从 0.8 缩放到 1 + 淡入 → 轨道环旋转启动 → 火卫一（Phobos）开始绕轨 → HUD 面板从右侧滑入。
   - 保留现有 CSS 关键帧作为 fallback，JS 失败时仍有基础动画。

4. **Fleet 预览卡片**
   - 进入视口时卡片依次从下方 stagger 出现。
   - 悬停时增加扫描线高亮和边框发光增强。

5. **性能保护**
   - 所有 ScrollTrigger 在组件卸载时 `kill()`。
   - 使用 `prefers-reduced-motion` 媒体查询降级为简单淡入。

### 第四节：响应式与性能

#### 响应式策略

- **1440px+**：当前桌面布局，保持非对称 Hero 和双栏 Mars。
- **1024px**：Hero 标题字号缩小 15%，Mars 区改为上下堆叠（星球在上，HUD 在下），Fleet 卡片 3 列 → 2 列。
- **768px**：Hero 改为垂直居中布局，Key Numbers 2×2 网格，Fleet 卡片 1 列。
- **375px**：简化 HUD 面板内边距，CTA 按钮全宽，字号进一步收缩。

#### 性能优化

- **清理冗余 CSS**：删除 Home.vue 旧 Hero 样式，预计减少 ~5-10KB。
- **图片优化**：Mars 纹理、Hero 背景图使用 `loading="lazy"` 和适当 `sizes` 属性。
- **GSAP 按需注册**：仅注册 ScrollTrigger，不引入未使用插件。
- **构建验证**：每次改动后运行 `vite build` + `tsc --noEmit`。

### 第五节：实施顺序

按风险从低到高、效果从明显到细节推进：

1. **数据层**：创建 `homeStore.js` + `homeFallback.js`，接入 `/api/stats` 和 `/api/fleet`。
2. **视觉统一**：统一按钮、复用 ShipCard、清理 Home.vue 旧 CSS。
3. **动效增强**：Hero 标题、Key Numbers、Mars 时间轴、Fleet 卡片 stagger。
4. **响应式收尾**：4 个断点调试。
5. **验证**：构建、类型检查、浏览器控制台检查。

## 涉及文件

### 新增
- `src/stores/homeStore.js`
- `src/data/homeFallback.js`

### 修改
- `src/views/Home.vue`（Key Numbers、Fleet Preview、CTA 当前为内联区块，实现时可能提取为独立组件）
- `src/components/home/HeroSection.vue`
- `src/components/home/HeroDataPanel.vue`
- `src/components/home/HomeWorldsSection.vue`
- `src/components/common/BaseButton.vue`
- `src/components/fleet/ShipCard.vue`
- `src/components/cosmic/CosmicPlanet.vue`
- `src/services/http.js`（类型定义补充）
- 后端相关路由测试文件

## 风险与注意事项

1. **GSAP SplitText 为商业插件**：若未购买许可证，需手动实现分词/分行逻辑，避免使用商业插件。
2. **ShipCard 改造影响舰队页**：为 ShipCard 新增 `compact` prop 时，需确保舰队页默认布局不受影响。
3. **后端数据格式**：`/api/stats` 返回字段需与前端展示字段对齐，若字段缺失需在实现阶段确认。
4. **旧 CSS 清理**：删除 Home.vue 旧 Hero 样式前，需确认无其他组件或路由依赖这些类名。
