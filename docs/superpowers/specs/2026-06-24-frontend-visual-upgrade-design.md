# 前端视觉升级设计文档

## 1. 项目背景与目标

当前官网已具备完整的设计 Token 体系、Vue 3 组件结构和统一舰船数据库，但视觉层面仍存在"美术资产不足、模板感强"的问题。本次升级目标是将网站从"可用"提升到"大厂级产品视觉"，建立具有强烈辨识度的星际战队品牌视觉系统。

**核心目标：**
- 建立统一的科幻军事终端视觉语言
- 12 艘舰船全部使用统一风格的高清美术资产
- 首页英雄区具备电影级第一印象
- 全站装饰系统提升沉浸感与细节密度
- 保持现有工程架构稳定，不引入破坏性重构

## 2. 设计原则

### 2.1 视觉定位

**「星际战队指挥中心 + 电影级产品目录」**

- 深空黑底（OLED Black）营造宇宙空间感
- 青色 accent 光代表科技、航线、数据
- 琥珀 highlight 代表引擎、驾驶舱、警告/状态
- 整体呈现克制、精准、有压迫感的军事科技美学

### 2.2 设计优先级

1. **统一性 > 丰富性**：先保证 12 艘舰船、全站页面风格一致，再增加细节
2. **功能性 > 装饰性**：所有装饰元素必须服务于信息层级，不制造视觉噪音
3. **电影感 > 游戏感**：避免廉价霓虹和过度光污染，追求电影海报级质感
4. **性能 > 炫技**：动效和装饰不能影响首屏加载和低端设备体验

## 3. 字体系统

### 3.1 字体家族

| 用途 | 字体 | 说明 |
|---|---|---|
| 英文 Display / 标题 / Hero | **Rajdhani** | 窄体、科技感、军事终端气质 |
| 中文正文 / 描述 | **Noto Sans SC** | 清晰、中性、跨平台 |
| 数据 / 编号 / 铭牌 | **JetBrains Mono** | 等宽、技术感、HUD 读数 |

### 3.2 使用规范

- Hero 标题：Rajdhani 700，全大写，letter-spacing 0.08em
- 页面标题：Rajdhani 700，sentence case 或全大写
- 中文标题：Noto Sans SC 700，避免使用 Rajdhani 做中文
- 数据标签：JetBrains Mono 500，letter-spacing 0.1em
- 正文：Noto Sans SC 400，line-height 1.7，max-width 65ch

### 3.3 清理动作

- 移除 `src/config/site.config.js` 中与 `variables.css` 冲突的字体配置
- 统一全站字体变量来源：`src/styles/variables.css`
- 删除对 Space Grotesk 的引用

## 4. 色彩系统

沿用现有 Design Token，但明确使用优先级：

- **背景层**：`--color-bg` (#050508) → `--color-bg-deep` → `--color-bg-surface`
- **强调色**：`--color-accent` (#4a9eff，星际蓝)
- **高亮色**：`--color-highlight` (#ffb300，琥珀金)
- **文字层**：`--color-text-heading` → `--color-text-body` → `--color-text-label` → `--color-text-dim`
- **边框**：`--color-border` (rgba 255,255,255,0.08)

**新增 Token：**
- `--color-hud-line`: rgba(74,158,255,0.12) — HUD 网格和装饰线
- `--color-starfield`: rgba(255,255,255,0.4) — 星图坐标点
- `--glow-hud`: 0 0 20px rgba(74,158,255,0.1) — 低调 HUD 发光

## 5. 舰船图片资产方向

### 5.1 视觉方向：「舞台化产品目录」

每艘舰船都像从黑暗中浮出的金属雕塑，兼具电影感和产品目录的统一性。

**视觉元素：**
- 背景：纯深空黑 + 极淡星云（不抢戏）
- 主光：一束冷白侧光从左上 45° 照射，强调舰体结构
- 边缘光：青色 #4a9eff 勾勒轮廓
- 指示灯：琥珀 #ffb300 点缀驾驶舱、引擎
- 阴影：强烈的投影增加体积感
- 铭牌：右下角 JetBrains Mono 编号 + 尺寸/船员

### 5.2 输出规格

| 属性 | 规格 |
|---|---|
| 尺寸 | 1920×1080（源文件），使用时裁切 |
| 比例 | 16:9 为主，支持 4:3、1:1 裁切 |
| 格式 | WebP，质量 90 |
| 调色 | 低饱和、高对比、冷色温 |
| 文件命名 | `{slug}.webp`，例如 `arrow.webp`、`400i.webp` |

### 5.3 铭牌设计

每张图固定位置加入半透明铭牌：

```
REG: ANVL-ARROW-S2          18.5M / 1 CREW
```

- 字体：JetBrains Mono 12-14px
- 颜色：主文字青色 #4a9eff，次要文字 #7a7a94
- 位置：右下角，距边缘 24px
- 背景：无，仅细线分隔

### 5.4 获取策略

1. 优先使用 Star Citizen 官方社区资源、游戏内截图、官方渲染图
2. 无法获取时，使用 AI 工具生成统一风格图（Midjourney/Stable Diffusion）
3. 统一后期处理：调色、加边缘光、压暗背景、合成铭牌

## 6. 首页英雄区设计

### 6.1 构图

从"居中文字 + 背景图"改为**非对称分层电影构图**：

- **Layer 0（背景）**：缓慢漂移的星云 +  faint 星图网格
- **Layer 1（中景）**：旗舰级舰船侧影（如 Hammerhead/Polaris），带青色边缘光
- **Layer 2（内容）**：左侧巨型标题 + 口号 + 数据读数 + CTA
- **Layer 3（前景）**：动态滚动 ticker + HUD 装饰线

### 6.2 标题排版

```
STELLAR
NEXUS
────────────────────────
EXPLORE · FIGHT · CONQUER
```

- 字体：Rajdhani 700
- 大小：`clamp(3rem, 8vw, 6rem)`
- 颜色：白色，第二行可用青色 accent
- letter-spacing：0.08em

### 6.3 数据读数

在标题下方或右侧加入小型数据面板：

```
[128] ACTIVE PILOTS    [2,400+] FLIGHT HOURS    [12] COMBAT READY
```

- 字体：JetBrains Mono
- 数字突出显示，单位用 dim 色

### 6.4 CTA 按钮

- 主按钮：`START APPLICATION`，琥珀色脉冲光效
- 次按钮：`EXPLORE FLEET`，透明边框 + hover 青色发光

### 6.5 底部 Ticker

页面底部加入滚动状态条：

```
◉ FLEET ONLINE  //  RECRUITING NOW  //  SECTOR 7G CLEARED  //  ...
```

- 字体：JetBrains Mono
- 颜色：青色 + 琥珀状态点
- 动画：水平无限滚动

## 7. 装饰系统

### 7.1 全局装饰组件

| 组件 | 用途 | 位置 |
|---|---|---|
| `HudCorner` | 页面/卡片四角斜切角标 | 全站卡片、面板 |
| `TechDivider` | 斜切分隔线 | Section 之间 |
| `StarMapGrid` | 星图网格背景 | Hero、Fleet、部分页面背景 |
| `StatusPulse` | 脉冲状态指示灯 | 在线状态、战备率 |
| `DataTicker` | 滚动数据条 | Hero 底部、状态栏 |
| `Scanline` | 扫描线 | 仅局部使用，不再全站叠加 |

### 7.2 使用规则

- 装饰密度：每屏不超过 3 种装饰类型
- 透明度：所有装饰线/网格透明度 ≤ 0.12
- 动画：装饰动画必须缓慢、循环、不抢眼
- 可访问性：提供 `prefers-reduced-motion` 降级

### 7.3 徽章系统

新增舰船类别徽章：

- 战斗 · COMBAT
- 探索 · EXPLORATION
- 运输 · TRANSPORT
- 截击 · INTERCEPTOR
- 竞速 · RACING
- 军用 · MILITARY

徽章样式：
- 边框 1px，颜色按类别区分
- 字体：Rajdhani 600，全大写
- 背景：对应颜色的 10% 透明度

## 8. 动效规范

### 8.1 动画分层

| 层级 | 动画类型 | 时长 | 缓动 |
|---|---|---|---|
| 背景层 | 星云漂移、网格缓动 | 20-40s | linear |
| 内容层 | 入场淡入 + 上移 | 0.6s | cubic-bezier(0.16, 1, 0.3, 1) |
| 交互层 | hover 发光、缩放 | 0.25s | ease-out |
| 状态层 | 脉冲指示灯 | 2s | ease-in-out infinite |

### 8.2 性能要求

- 所有位移动画使用 `transform` 和 `opacity`
- 复杂粒子效果使用 Canvas 或 WebGL，避免大量 DOM 节点
- 星空粒子控制在 100 个以内（移动端 50 个）
- 扫描线/噪点不再全站固定叠加，改为局部或可选

### 8.3 减弱动效

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 9. 页面级改造清单

### 9.1 首页 Home
- [ ] Hero 重构图（非对称 + 分层 + 数据读数 + Ticker）
- [ ] 关键数字区增加 HUD 装饰
- [ ] Fleet Preview 使用新舰船图
- [ ] CTA Section 增加背景星图

### 9.2 舰队页 Fleet
- [ ] 12 艘舰船全部替换新图
- [ ] 卡片增加 HUD 角标和状态灯
- [ ] 分类筛选增加动态过渡
- [ ] Stats Bar 增加脉冲状态

### 9.3 舰船详情 ShipDetail
- [ ] 使用新舰船大图
- [ ] 数据面板增加 HUD 风格
- [ ] 系统状态增加动态指示灯

### 9.4 成员页 Members
- [ ] 保持默认头像 SVG
- [ ] 卡片增加军事风格边框和编号

### 9.5 全局
- [ ] 导航栏 HUD 化
- [ ] 页面切换动画
- [ ] 背景星图网格
- [ ] 页脚增加 faction 标识

## 10. 落地阶段

### 阶段 1：基础设施 & 设计系统统一（1-2 天）
- 字体系统统一为 Rajdhani + Noto Sans SC + JetBrains Mono
- 清理冲突的 site.config.js 字体配置
- 扩展 Design Token（HUD 颜色、星图网格、脉冲动画）
- 搭建 6 个装饰组件：`HudCorner`、`TechDivider`、`StarMapGrid`、`StatusPulse`、`DataTicker`、`Scanline`

### 阶段 2：首页英雄区重制（2-3 天）
- 设计并实现新 Hero 构图
- 加入星云背景、舰船侧影、数据读数、Ticker
- 实现标题入场动画和 CTA 脉冲效果

### 阶段 3：舰船资产生产（3-5 天）
- 确定 12 艘舰船图片获取方案
- 统一后期处理和铭牌合成
- 替换 `public/images/ships/` 下所有图片
- 更新 `shipDatabase.js` 图片路径（如需要）

### 阶段 4：Fleet 页面升级（2 天）
- 新舰船图卡片展示
- HUD 角标和状态灯
- 分类筛选动态过渡
- 展厅模式/网格模式切换（可选）

### 阶段 5：全站装饰 & Polish（2-3 天）
- 导航栏 HUD 化
- 页面切换动画
- 数据面板 HUD 风格
- 可访问性支持（prefers-reduced-motion、对比度检查）
- 性能优化和构建验证

## 11. 验收标准

- [ ] 首页 Hero 在 1920×1080 和 375×812 下均有强烈视觉冲击
- [ ] 12 艘舰船图片风格统一，无 404
- [ ] Fleet 页面 12 张卡片整齐一致，hover 效果流畅
- [ ] 全站字体统一，无 Rajdhani/Space Grotesk 冲突
- [ ] 所有新增装饰组件可在 3 个及以上页面复用
- [ ] `npm run build` 通过，首屏加载时间无明显倒退
- [ ] 支持 `prefers-reduced-motion`
- [ ] 主要交互路径无视觉回归

## 12. 风险与注意事项

1. **舰船图版权**：如使用官方素材，需确认合理使用范围；建议优先使用 AI 生成自有资产
2. **性能风险**：过多粒子/光效可能导致低端设备卡顿，需持续测试
3. **维护成本**：装饰系统增加后，后续新增页面必须遵循装饰规范
4. **浏览器兼容**：部分 backdrop-filter、clip-path 效果需准备降级方案
