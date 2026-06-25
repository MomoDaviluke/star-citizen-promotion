# Home.vue 重写方案 — SpaceX 风格改版

> **状态**: ✅ 已实施（2026-06-15）
> **版本**: v1.3.4
> **后续**: bento 卡片交互细节已完善（accordion、对比度、explore提示）

## 设计原则

1. **全屏沉浸** — Hero 让图自己说话，文字做点睛
2. **留白是武器** — 一个 section 只讲一件事
3. **字体即性格** — 标题极粗、正文极细，靠排版制造张力
4. **信息架构优先** — 砍掉装饰层，内容本身成为视觉

## 新结构（6 → 4 sections）

### 1. Hero（100vh）
- **背景**：`sc-matte-painting.jpg`（890 Jump 飞越城市夕阳）
- **内容**：
  - 左下角：`STELLAR NEXUS` 标题（超大字重，letter-spacing: -0.04em）
  - 标题下方：一行 tagline `EXPLORE · FIGHT · CONQUER`
  - 右下角：向下滚动箭头
- **去掉**：pill 标签、orb 动画、CTA 按钮（CTA 移到页面底部）
- **遮罩**：简化为单层 bottom-to-top 渐变，保留图片呼吸空间

### 2. Key Numbers（两行，留白充足）
- **只展示 2 个核心数字**：
  - `128` — 活跃成员
  - `2,400+` — 飞行小时
- **布局**：居中，每个数字占一行，字号 `clamp(4rem, 10vw, 8rem)`
- **标签**：极小字号，字间距 0.2em，放在数字下方
- **去掉**：4 个指标横排的仪表盘式布局

### 3. Fleet Preview（3 卡片）
- **布局**：3 列等宽卡片（桌面），单列堆叠（移动）
- **每张卡片**：
  - 大图（16:9 或 4:3）
  - 舰船名称
  - 一行角色描述
  - Hover/tap 后展开：显示火力/防御/机动的极简条形图
- **底部**：「查看全部舰队 →」链接
- **去掉**：bento grid 的大小卡片混排、spec bar 默认显示

### 4. CTA（页面底部）
- **居中大标题**：`READY TO JOIN?`
- **一行描述**
- **两个按钮**：申请（主）+ 浏览舰队（次）
- **去掉**：装饰性横线、多余间距

## 删除的 sections

| 原 section | 处理 |
|-----------|------|
| Stats Strip | 合并到 Key Numbers（只保留 2 个） |
| Featured Pilot | 移到独立页面或成员页面展示 |
| Ship Gallery | 合并到 Fleet Preview（精简为 3 张） |

## 样式变更

### Hero
```css
/* 去掉 orb，简化遮罩 */
.hero__bg-orb { display: none; }
.hero__bg-overlay {
  background: linear-gradient(to top, var(--color-bg) 0%, transparent 60%);
}
/* 标题左对齐，左下定位 */
.hero__content {
  align-items: flex-start;
  text-align: left;
  padding-left: 8vw;
}
```

### Key Numbers
```css
.key-number {
  font-family: var(--font-display);
  font-size: clamp(4rem, 10vw, 8rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--color-text-heading);
}
.key-number__label {
  font-family: var(--font-data);
  font-size: var(--text-xs);
  letter-spacing: 0.2em;
  color: var(--color-text-label);
  margin-top: var(--space-2);
}
```

### Fleet Cards
```css
.fleet-card__specs {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s var(--ease-out);
}
.fleet-card:hover .fleet-card__specs,
.fleet-card.is-tapped .fleet-card__specs {
  max-height: 200px;
}
```

## 移动端适配

- Hero：标题字号缩小，padding 调整
- Key Numbers：字号缩小到 clamp(3rem, 15vw, 5rem)
- Fleet Cards：单列堆叠，tap 展开 specs（添加 `.is-tapped` class 切换）
- CTA：按钮全宽

## 实施顺序

1. 重写 `<template>` 结构（4 sections）
2. 精简 `<script setup>` 数据（删除 pilot 和 gallery 数据）
3. 重写 `<style scoped>`（按新结构重写，删除旧样式）
4. 桌面端视觉调优
5. 移动端适配
6. 测试和修复

## 素材需求

- [x] Hero 图：`sc-matte-painting.jpg` ✓（890 Jump 飞越城市夕阳，构图光影都适合）
- [x] 舰队卡片图：
  - `sc-bengal.jpg` ✓ 暗调 Bengal 航母，星月背景，戏剧性光线
  - `sc-constellation.jpg` ✓ Constellation 三引擎布局清晰，小行星带背景
  - `sc-buccaneer.jpg` ✓ 三机编队大气层飞行，有纵深感
