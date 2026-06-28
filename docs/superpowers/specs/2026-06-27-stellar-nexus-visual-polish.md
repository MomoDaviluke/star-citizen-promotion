# Stellar Nexus 首页视觉精修规格

**日期**：2026-06-27  
**状态**：已批准（用户回复“全部”）  
**范围**：基于 2026-06-26 重设计成果，对行星、舰船、背景、Fleet、Route、HUD、CTA 进行美术精修。

---

## 设计目标

在保持“A 风格电影史诗 + C 风格硬核战术”融合的前提下，解决当前页面存在的“塑料感”、“素材色调脱节”、“背景仍偏空”、“移动端失衡”等问题，使首页更接近国际大厂级的太空史诗视觉品质。

---

## 改进项

### 1. 行星辉光与色彩（CosmicPlanet.vue）

**问题**：紫色变体经过 `hue-rotate(60deg) saturate(1.3)` 后呈现高饱和洋红，像霓虹灯而非天体大气辉光。

**方案**：
- 纹理模式下色调映射改为 `hue-rotate(30deg) saturate(0.9) contrast(1.1)`，保留纹理细节同时偏向蓝紫。
- 叠加层由紫色改为蓝紫渐变 `rgba(74, 158, 255, 0.25)` + `rgba(138, 43, 226, 0.2)`。
- glow 颜色从 `rgba(74, 46, 106, 0.7)` 调整为 `rgba(80, 70, 160, 0.35)`，opacity 从 0.55 降至 0.4。
- 在星球边缘新增极细白色大气辉光 `box-shadow: 0 0 20px rgba(255,255,255,0.08)`。

### 2. 舰船图片统一色调与引擎光位置（CosmicShip.vue）

**问题**：现有舰船素材偏灰、偏暗，与青蓝色调脱节；引擎光固定 `left: 8%` 对右向飞船会穿帮。

**方案**：
- 图片模式新增 `engine-position` prop，支持 `left` / `right` / `center`，默认 `left`。
- 引擎光尺寸随船比例化，使用 `width: 6%` 而非固定 24px。
- 给 `.cosmic-ship__image` 增加统一色调映射：
  ```css
  filter: contrast(1.15) saturate(0.85) sepia(0.15) hue-rotate(165deg) brightness(1.05);
  ```
- hover 时叠加层增强，模拟扫描光效。

### 3. 星云背景层次（CosmicNebula.vue）

**问题**：背景仍然偏黑，星云存在感不足。

**方案**：
- blob 总量从 13 个增至 18 个。
- 各层颜色透明度提升 20%-30%。
- 在深空底色中加入一层极淡的星尘带：在 `draw()` 中叠加一个极低透明度的对角线渐变。

### 4. Fleet 编队布局与尺寸（StellarNexus.vue）

**问题**：三艘船像缩略图，缺乏舰队气势。

**方案**：
- 旗舰 Hammerhead 宽度提升至 `min(45vw, 420px)`，护航舰 `min(28vw, 220px)`。
- 编队从并排底对齐改为三角/倒 V 形：旗舰居中偏下，两侧护航舰抬高 40px。
- 舰船铭牌字号加大，增加发光边框。

### 5. 移动端 Worlds 布局（StellarNexus.vue）

**问题**：手机端行星占据 60% 视口，文字被挤压到上方。

**方案**：
- 在 `@media (max-width: 768px)` 下，Worlds 区域改为垂直堆叠：文字面板在上，星球在下。
- 星球宽度限制为 `70vw`，并整体下移，避免遮挡标题。

### 6. TechButton primary 颜色（TechButton.vue）

**问题**：琥珀色 CTA 与青蓝/深紫太空调性冲突。

**方案**：
- primary 变体由 amber 改为 cyan/blue：
  - 背景：`rgba(74, 158, 255, 0.12)`
  - 边框与文字：`var(--color-accent)` (#4a9eff)
  - hover 发光：`0 0 40px rgba(74, 158, 255, 0.35)`
- amber 仅作为告警色保留，不用于主 CTA。

### 7. Route 航线发光与航点动画（StellarNexus.vue）

**问题**：虚线路径和航点融进背景。

**方案**：
- 航线新增 `drop-shadow(0 0 6px rgba(74,158,255,0.6))`。
- 航点由单点改为脉冲环：外圈 `scale` 动画 + 内圈常亮。
- 在飞船尾部增加淡淡的粒子尾迹（3-5 个渐变圆点）。

### 8. HudPanel 玻璃质感与边框（HudPanel.vue）

**问题**：面板在复杂背景上层次不够。

**方案**：
- 边框亮度从 `rgba(74, 158, 255, 0.2)` 提升到 `0.35`。
- hover 时 `box-shadow` 提升到 `0 0 40px rgba(74,158,255,0.12)`。
- 内容区行高从默认提升到 1.8。
- 增加极淡的内发光：左上角 1px 白色高光。

---

## 成功标准

- `npm run lint && npm run test && npm run build` 全部通过。
- 桌面端截图中行星不再呈现霓虹洋红，舰船与整体色调统一，Fleet 具有编队纵深感。
- 移动端截图中 Worlds 文字不被星球遮挡，整体可读。
- 所有动画仍支持 `prefers-reduced-motion`。

---

## 受影响文件

- `src/components/cosmic/CosmicPlanet.vue`
- `src/components/cosmic/CosmicShip.vue`
- `src/components/cosmic/CosmicNebula.vue`
- `src/components/cosmic/HudPanel.vue`
- `src/components/ui/TechButton.vue`
- `src/views/StellarNexus.vue`
- 相关测试文件（如需新增断言）
