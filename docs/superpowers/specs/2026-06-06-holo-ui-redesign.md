# 电影级全息 UI 重设计规格

**项目**: 星际公民战队 · 官方招募站 (Stellar Nexus)
**版本**: 1.0
**日期**: 2026-06-06
**状态**: 已批准

---

## 1. 概述

将现有前端从"模板化科幻风"重设计为"电影级全息 UI"风格，灵感来源于星际公民宣传片中的 AR 全息界面和赛博朋克超梦界面。核心目标：视觉冲击力、沉浸感、可扩展性。

### 1.1 设计原则

- **沉浸优先**：全屏深空背景 + 浮动玻璃卡片，内容浮于星云之上
- **动效叙事**：每个交互都有全息风格的动画反馈（闪烁、扫描、浮动）
- **三层解耦**：设计令牌分层（原始值 → 语义 → 效果），换主题/风格不碰组件
- **Slot 驱动**：组件通过 slot + variant props 扩展，不写死内容
- **数据驱动**：卡片内容从 props 传入，不硬编码

---

## 2. 全局视觉语言

### 2.1 色彩

背景叠加渐变（从左下到右上）：
- 左下角：`rgba(124,58,237,0.08)`（星云紫雾）
- 右上角：`rgba(6,182,212,0.05)`（青蓝数据流）
- 基底：`--void-deepest` #060b14

卡片：
- 背景：`rgba(12,20,36,0.6)` + `backdrop-filter: blur(16px)`
- 边框：1px `rgba(124,58,237,0.15)`
- hover 边框：渐变从紫到青蓝 + 光晕增强

强调色使用优先级：
1. 主强调：`--cyan-primary` #06b6d4（青蓝）
2. 次强调：`--nebula-purple` #7c3aed（星云紫）
3. 点缀：`--amber-primary` #f59e0b（琥珀）

### 2.2 字体

| 用途 | 字体 | 字重 | 字间距 | 大小 |
|------|------|------|--------|------|
| 大标题 | Orbitron | 900 | 0.15em | 4-6rem |
| 副标题/标签 | Rajdhani | 600 | 0.2em | 0.75-1rem |
| 正文 | Noto Sans SC | 400 | 0.01em | 1rem |
| 数据/编号 | JetBrains Mono | 400-500 | 0.05em | 0.875-1rem |

### 2.3 全局动效

| 动效 | 描述 | 时长 | 触发 |
|------|------|------|------|
| 页面切换 | 全息闪烁(glitch) → 稳定 | 0.6s | 路由变化 |
| 卡片入场 | 从下方30px淡入 + 全息闪烁 | 0.5s + stagger 0.1s | 元素进入视口 |
| 鼠标视差 | 卡片微弱偏移2-3px | 实时 | 鼠标移动 |
| 边框光晕 | 光晕跟随鼠标位置 | 实时 | 鼠标在卡片上 |
| 浮动 | 上下2px缓动 | 3s循环 | 可配置开关 |

---

## 3. 设计令牌系统

### 3.1 三层结构

```css
:root {
  /* === 原始值层（不直接使用） === */
  --raw-void-1: #060b14;
  --raw-void-2: #0c1424;
  --raw-void-3: #111c30;
  --raw-cyan: #06b6d4;
  --raw-cyan-rgb: 6, 182, 212;
  --raw-purple: #7c3aed;
  --raw-purple-rgb: 124, 58, 237;
  --raw-amber: #f59e0b;
  --raw-amber-rgb: 245, 158, 11;

  /* === 语义层（组件引用这层） === */
  --color-bg: var(--raw-void-1);
  --color-bg-card: var(--raw-void-2);
  --color-bg-card-hover: var(--raw-void-3);
  --color-accent: var(--raw-cyan);
  --color-accent-secondary: var(--raw-purple);
  --color-highlight: var(--raw-amber);
  --color-border: rgba(var(--raw-purple-rgb), 0.15);
  --color-border-hover: rgba(var(--raw-cyan-rgb), 0.3);
  --color-text-heading: var(--text-primary);
  --color-text-label: var(--text-muted);

  /* === 效果层（动画/光晕引用这层） === */
  --glow-card: 0 0 20px rgba(var(--raw-cyan-rgb), 0.1);
  --glow-card-hover: 0 0 30px rgba(var(--raw-cyan-rgb), 0.2);
  --blur-card: 16px;
  --float-duration: 3s;
  --float-distance: 2px;
  --stagger-delay: 0.1s;
  --glitch-duration: 600ms;
}
```

### 3.2 主题扩展

通过覆盖语义层实现新主题，不修改原始值层和组件代码：

```css
[data-theme="nebula"] {
  --color-accent: var(--raw-purple);
  --color-accent-secondary: var(--raw-cyan);
  --color-border: rgba(var(--raw-purple-rgb), 0.25);
}
```

---

## 4. 组件架构

### 4.1 HoloCard — 核心卡片组件

**Props**:
| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| variant | String | 'default' | 视觉变体: default / terminal / pilot / ship |
| title | String | — | 卡片标题 |
| label | String | — | 标签文字 |
| status | String | — | 状态: online / warning / offline |
| showCorner | Boolean | true | 角标装饰 |
| showScanline | Boolean | false | 扫描线效果 |
| floatAnimation | Boolean | false | 浮动动画 |
| staggerIndex | Number | 0 | 入场延迟序号 |

**Slots**:
| Slot | 说明 |
|------|------|
| corner-decoration | 角标装饰覆盖 |
| status-indicator | 状态指示灯覆盖 |
| header | 头部区域覆盖 |
| default | 主体内容 |
| footer | 底部操作区 |

**Variants**:
- `default`: 标准毛玻璃卡片
- `terminal`: 全息终端风格，切角边框 + L形角标 + 扫描线
- `pilot`: 飞行员卡片，圆形头像区域 + 旋转光环
- `ship`: 飞船卡片，切角矩形 + 状态条

### 4.2 PageShell — 页面外壳

**Slots**:
| Slot | 说明 |
|------|------|
| hero | 全屏英雄区（首页使用） |
| header | 页面头部覆盖 |
| default | 主内容区 |
| footer-section | 页面专属底部 |

### 4.3 PageHeader — 页面标题组件

**Props**:
| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| title | String | — | 页面标题 |
| subtitle | String | — | 副标题 |
| tag | String | — | 标签文字（如 ARCHIVE, FLEET REGISTRY） |
| showScanline | Boolean | true | 标题扫描线入场动画 |

### 4.4 动画 Composable

```js
// composables/useHoloAnimation.js
export function useHoloAnimation(options = {}) {
  const {
    enableFloat = true,
    enableGlitch = true,
    enableParallax = true,
    floatDuration = 3,
    floatDistance = 2,
    glitchDuration = 600,
    staggerDelay = 100,
  } = options
  // 返回: cardStyle, onCardMouseMove, onCardMouseLeave, staggerStyle(index)
}
```

---

## 5. 各页面设计

### 5.1 Home — 全屏英雄区 + 浮动卡片

**英雄区**:
- 全屏高度，深空背景 + 星空粒子
- 居中大标题 "STELLAR NEXUS"（Orbitron 900, 6rem+），全息闪烁入场
- 副标题 "星渊枢纽 · 星际公民战队"（Rajdhani 600, 字间距大）
- 标题下方青蓝色扫描线从左到右横扫
- 底部向下滚动指示器（脉冲箭头）

**下方内容**:
- 两列浮动玻璃卡片（左：舰队概览，右：招募信息）
- 卡片微弱上下浮动（3s周期, 2px幅度）
- hover 边框紫→青蓝渐变 + 光晕增强

### 5.2 About — 全息档案

- 标题 "ARCHIVE" + 扫描线入场
- 左右两栏：左侧文字描述，右侧数据面板（JetBrains Mono，数字滚动计数动画）
- 中间竖向数据流装饰线（青蓝粒子从上往下）
- 底部时间线：里程碑节点为小全息卡片，hover 展开详情

### 5.3 Fleet — 飞船展厅

- 标题 "FLEET REGISTRY"
- 网格布局（3列桌面 / 2列平板 / 1列手机）
- HoloCard variant="ship"：切角边框 + 名称/型号 + 状态条
- hover 上浮 + 边框光晕 + 背景星云紫雾加深
- stagger 淡入 + 全息闪烁

### 5.4 Join — 全息招募终端

- 标题 "RECRUITMENT TERMINAL"
- HoloCard variant="terminal"：切角 + L形角标 + "TERMINAL ACTIVE" 状态灯
- 输入框：深色背景 + 底部边框线，focus 青蓝 + 光晕
- 提交按钮：琥珀色渐变 + hover 光晕扩散
- 招募要求列表：全息复选框图标

### 5.5 Members — 飞行员档案

- 标题 "PILOT DATABASE"
- 网格（4列桌面 / 2列手机）
- HoloCard variant="pilot"：圆形头像 + 旋转青蓝光环 + 名称代号 + 角色徽章
- hover 光环加速旋转 + 卡片微放大
- stagger 0.08s

### 5.6 Contact — 通讯频道

- 标题 "COMM CHANNEL"
- 左侧：联系方式小全息卡片（图标+文字）
- 右侧：留言表单（terminal 风格）
- 底部：CSS 星点连线装饰

### 5.7 Login — 登录终端

- 标题 "ACCESS TERMINAL"
- 居中 terminal 风格卡片
- 输入框同 Join 风格
- 登录按钮：青蓝渐变 + hover 光晕

---

## 6. 导航与页脚

### 6.1 SiteHeader — 全息导航

- 固定顶部，毛玻璃 `backdrop-filter: blur(20px)`
- Logo 左侧，导航居中，主题切换右侧
- 导航链接：Rajdhani，全大写，字间距 0.15em
- 当前页面：下方青蓝指示线（从中心向两侧展开动画）
- hover：`--text-muted` → `--cyan-bright` + 微弱光晕

### 6.2 SiteFooter — 简洁全息

- 深色背景 + 顶部 1px 紫色分割线
- 三列：品牌信息 / 快速链接 / 社交图标
- 底部版权行，`--text-dim`

---

## 7. 可扩展性保障

| 层级 | 机制 | 扩展场景 |
|------|------|---------|
| 颜色/效果 | 三层设计令牌 | 换主题、换风格 |
| 组件 | Slot + variant props | 新卡片类型、新区域、关闭特效 |
| 动画 | Composable + 配置对象 | 调参、加新动画、reduced-motion |
| 页面 | PageShell 区域化 slot | 新页面类型 |
| 数据 | Props 驱动 | 接 API、换数据源 |
| 主题 | 语义层覆盖 | nebula/combat 等新主题 |

---

## 8. 实现范围

### 8.1 本次实现

- 设计令牌三层重构（variables.css）
- HoloCard 组件（4个 variant）
- PageShell 组件
- PageHeader 重设计
- useHoloAnimation composable
- SiteHeader 重设计
- SiteFooter 重设计
- Home 页面重设计（英雄区 + 浮动卡片）
- About / Fleet / Join / Members / Contact / Login 页面重设计
- 全局动效（页面切换、卡片入场、鼠标视差）

### 8.2 保留不动

- 路由结构
- 状态管理（Pinia stores）
- 服务层（auth, ai, http）
- 工具函数（logger, effects/ParticleEngine）
- PWA 配置
- 错误处理机制

### 8.3 未来扩展（本次不实现）

- nebula/combat 主题
- 更多 HoloCard variant
- API 数据对接
- 成员头像上传
- 飞船 3D 模型展示
