# 前端重构技术文档

> **项目**: Star Citizen 战队宣传网站  
> **版本**: v2.0 - 视觉升级  
> **创建日期**: 2026-06-20  
> **目标**: 提升视觉艺术水平，打造沉浸式科幻体验

---

## 一、当前设计系统分析

### 1.1 现有优势

| 维度 | 现状 | 评价 |
|---|---|---|
| 色彩系统 | 星际蓝 #4a9eff + OLED 黑 | ✅ 优秀，符合科幻主题 |
| 字体系统 | Space Grotesk + JetBrains Mono | ✅ 良好，科技感强 |
| 动画系统 | GSAP ScrollTrigger + IntersectionObserver | ✅ 良好，但可更丰富 |
| 视觉效果 | Glassmorphism + Glow | ⭐ 基础扎实，需深化 |

### 1.2 当前不足

| 问题 | 影响 | 优先级 |
|---|---|---|
| 视觉层次单一 | 页面缺乏深度感 | P0 |
| 动画效果有限 | 交互体验不够沉浸 | P0 |
| 缺少高级特效 | 与竞品相比缺乏亮点 | P1 |
| 响应式细节不足 | 移动端体验一般 | P1 |
| 设计语言不统一 | 部分页面风格不一致 | P2 |

---

## 二、重构目标

### 2.1 视觉目标

```
┌─────────────────────────────────────────────────────────────┐
│                    视觉升级目标                               │
├─────────────────────────────────────────────────────────────┤
│  1. 深度感 — 多层视差 + 3D 元素 + 光影层次                    │
│  2. 沉浸感 — 全屏动画 + 粒子系统 + 环境音效                    │
│  3. 精致感 — 微交互 + 细节动画 + 品质感图标                    │
│  4. 科技感 — 数据可视化 + HUD 元素 + 扫描线效果                │
│  5. 流畅感 — 60fps 动画 + 平滑过渡 + 无卡顿                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术目标

- **性能**: Lighthouse 评分 ≥ 90
- **动画**: 60fps 流畅动画，支持 `prefers-reduced-motion`
- **响应式**: 完美适配 320px - 2560px
- **无障碍**: WCAG 2.1 AA 标准
- **代码质量**: 组件化、可维护、可复用

---

## 三、技术路线

### 3.1 第一阶段：设计系统升级（1-2 天）

#### 3.1.1 色彩系统增强

```css
/* 新增色彩变量 */
:root {
  /* 渐变色系 */
  --gradient-cyber: linear-gradient(135deg, #4a9eff 0%, #a78bfa 50%, #ff6b9d 100%);
  --gradient-neon: linear-gradient(135deg, #00f5ff 0%, #4a9eff 100%);
  --gradient-amber: linear-gradient(135deg, #ffb300 0%, #ff6b9d 100%);
  
  /* 玻璃态增强 */
  --glass-frost: rgba(255, 255, 255, 0.05);
  --glass-tint: rgba(74, 158, 255, 0.08);
  --glass-glow: rgba(74, 158, 255, 0.15);
  
  /* 光影层次 */
  --shadow-neon: 0 0 10px rgba(74, 158, 255, 0.5), 0 0 40px rgba(74, 158, 255, 0.2);
  --shadow-deep: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 100px rgba(74, 158, 255, 0.1);
}
```

#### 3.1.2 动画系统增强

```javascript
// 新增动画配置
export const ADVANCED_ANIMATIONS = {
  // 文字打字机效果
  typewriter: {
    duration: 2,
    ease: 'steps(40)',
    delay: 0.5
  },
  
  // 粒子入场
  particleBurst: {
    duration: 1.5,
    ease: 'power3.out',
    stagger: 0.02
  },
  
  // 3D 翻转
  flip3D: {
    duration: 0.8,
    ease: 'back.out(1.7)',
    perspective: 1000
  },
  
  // 光线扫描
  lightSweep: {
    duration: 1.2,
    ease: 'power2.inOut',
    delay: 0.3
  }
}
```

### 3.2 第二阶段：核心组件重构（3-5 天）

#### 3.2.1 Hero 区域升级

**当前状态**: 静态背景 + 简单文字  
**目标状态**: 全屏沉浸 + 粒子系统 + 3D 视差

```vue
<!-- 新版 Hero 组件结构 -->
<template>
  <section class="hero">
    <!-- 1. 粒子背景层 -->
    <canvas ref="particleCanvas" class="hero__particles" />
    
    <!-- 2. 视频背景层 -->
    <video class="hero__video" autoplay muted loop>
      <source src="/videos/hero-bg.mp4" type="video/mp4" />
    </video>
    
    <!-- 3. 3D 视差层 -->
    <div class="hero__parallax" ref="parallaxLayer">
      <div class="parallax-item" data-depth="0.2">
        <img src="/images/ship-1.png" alt="" />
      </div>
      <div class="parallax-item" data-depth="0.5">
        <img src="/images/ship-2.png" alt="" />
      </div>
    </div>
    
    <!-- 4. HUD 信息层 -->
    <div class="hero__hud">
      <div class="hud-element hud-coordinates">
        <span class="hud-label">SECTOR</span>
        <span class="hud-value">STANTON-III</span>
      </div>
      <div class="hud-element hud-status">
        <span class="hud-dot" />
        <span class="hud-text">ONLINE</span>
      </div>
    </div>
    
    <!-- 5. 主内容层 -->
    <div class="hero__content">
      <h1 class="hero__title">
        <span class="title-line" data-animate="typewriter">STELLAR</span>
        <span class="title-line title-accent" data-animate="typewriter" data-delay="0.5">NEXUS</span>
      </h1>
      <p class="hero__tagline" data-animate="fadeUp" data-delay="1">
        EXPLORE · FIGHT · CONQUER
      </p>
    </div>
    
    <!-- 6. 交互提示层 -->
    <div class="hero__scroll-indicator" data-animate="fadeUp" data-delay="1.5">
      <div class="scroll-mouse">
        <div class="scroll-wheel" />
      </div>
      <span class="scroll-text">SCROLL TO EXPLORE</span>
    </div>
  </section>
</template>
```

#### 3.2.2 舰船卡片升级

**当前状态**: 静态图片 + 简单 hover  
**目标状态**: 3D 悬浮 + 光效追踪 + 展开动画

```vue
<!-- 新版舰船卡片 -->
<template>
  <div 
    class="ship-card"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    ref="cardRef"
  >
    <!-- 3D 容器 -->
    <div class="ship-card__3d" :style="cardStyle">
      <!-- 图片层 -->
      <div class="ship-card__image">
        <img :src="ship.image" :alt="ship.name" />
        <div class="ship-card__glow" :style="glowStyle" />
      </div>
      
      <!-- 信息层 -->
      <div class="ship-card__info">
        <h3 class="ship-card__name">{{ ship.name }}</h3>
        <span class="ship-card__role">{{ ship.role }}</span>
      </div>
      
      <!-- 数据层（悬浮展开） -->
      <div class="ship-card__specs">
        <div 
          v-for="spec in ship.specs" 
          :key="spec.label"
          class="spec-item"
        >
          <span class="spec-label">{{ spec.label }}</span>
          <div class="spec-bar">
            <div 
              class="spec-fill" 
              :style="{ width: spec.value + '%' }"
              :data-value="spec.value"
            />
          </div>
          <span class="spec-value">{{ spec.value }}</span>
        </div>
      </div>
      
      <!-- 光线追踪效果 -->
      <div class="ship-card__light-trail" :style="lightTrailStyle" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const cardRef = ref(null)
const rotateX = ref(0)
const rotateY = ref(0)
const mouseX = ref(0)
const mouseY = ref(0)

const cardStyle = computed(() => ({
  transform: `perspective(1000px) rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg)`
}))

const glowStyle = computed(() => ({
  background: `radial-gradient(circle at ${mouseX.value}% ${mouseY.value}%, rgba(74, 158, 255, 0.3), transparent 50%)`
}))

const lightTrailStyle = computed(() => ({
  left: `${mouseX.value}%`,
  top: `${mouseY.value}%`
}))

function handleMouseMove(e) {
  const rect = cardRef.value.getBoundingClientRect()
  mouseX.value = ((e.clientX - rect.left) / rect.width) * 100
  mouseY.value = ((e.clientY - rect.top) / rect.height) * 100
  rotateY.value = ((mouseX.value - 50) / 50) * 10
  rotateX.value = ((50 - mouseY.value) / 50) * 10
}

function handleMouseLeave() {
  rotateX.value = 0
  rotateY.value = 0
}
</script>
```

### 3.3 第三阶段：高级特效实现（2-3 天）

#### 3.3.1 粒子系统

```javascript
// src/composables/useParticles.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useParticles(canvasRef, options = {}) {
  const {
    count = 100,
    color = '#4a9eff',
    speed = 0.5,
    size = 2,
    connectDistance = 150
  } = options

  const particles = ref([])
  let animationId = null
  let ctx = null

  function init() {
    const canvas = canvasRef.value
    if (!canvas) return

    ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // 创建粒子
    for (let i = 0; i < count; i++) {
      particles.value.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        size: Math.random() * size + 1,
        opacity: Math.random() * 0.5 + 0.5
      })
    }

    animate()
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particles.value.forEach((p, i) => {
      // 更新位置
      p.x += p.vx
      p.y += p.vy

      // 边界检测
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1

      // 绘制粒子
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.globalAlpha = p.opacity
      ctx.fill()

      // 连接线
      particles.value.slice(i + 1).forEach(p2 => {
        const dx = p.x - p2.x
        const dy = p.y - p2.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < connectDistance) {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.strokeStyle = color
          ctx.globalAlpha = (1 - dist / connectDistance) * 0.3
          ctx.stroke()
        }
      })
    })

    animationId = requestAnimationFrame(animate)
  }

  onMounted(init)
  onUnmounted(() => {
    if (animationId) cancelAnimationFrame(animationId)
  })

  return { particles }
}
```

#### 3.3.2 扫描线效果

```css
/* 扫描线动画 */
.scanline {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(74, 158, 255, 0.8) 50%,
    transparent 100%
  );
  animation: scanline 4s linear infinite;
  pointer-events: none;
  z-index: 9999;
}

@keyframes scanline {
  0% { transform: translateY(-100vh); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
}

/* 网格背景 */
.grid-background {
  background-image: 
    linear-gradient(rgba(74, 158, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(74, 158, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  background-position: center center;
}
```

### 3.4 第四阶段：性能优化（1-2 天）

#### 3.4.1 图片优化

```javascript
// 图片懒加载 + 渐进式加载
export function useProgressiveImage(src) {
  const loaded = ref(false)
  const placeholder = ref(null)
  const image = ref(null)

  onMounted(() => {
    // 加载缩略图
    const img = new Image()
    img.src = src.replace(/\.(jpg|png)$/, '-thumb.webp')
    img.onload = () => {
      placeholder.value = img.src
    }

    // 加载高清图
    const hdImg = new Image()
    hdImg.src = src
    hdImg.onload = () => {
      image.value = hdImg.src
      loaded.value = true
    }
  })

  return { loaded, placeholder, image }
}
```

#### 3.4.2 动画性能优化

```javascript
// 使用 requestAnimationFrame 优化动画
export function useOptimizedAnimation(callback) {
  const frameRef = ref(null)
  const lastTimeRef = ref(0)
  const fps = 60
  const interval = 1000 / fps

  function animate(currentTime) {
    frameRef.value = requestAnimationFrame(animate)
    
    const delta = currentTime - lastTimeRef.current
    
    if (delta > interval) {
      lastTimeRef.current = currentTime - (delta % interval)
      callback(currentTime)
    }
  }

  onMounted(() => {
    frameRef.value = requestAnimationFrame(animate)
  })

  onUnmounted(() => {
    if (frameRef.value) {
      cancelAnimationFrame(frameRef.value)
    }
  })
}
```

---

## 四、组件清单

### 4.1 新增组件

| 组件 | 功能 | 优先级 |
|---|---|---|
| `ParticleBackground` | 粒子背景系统 | P0 |
| `ParallaxContainer` | 3D 视差容器 | P0 |
| `ShipCard3D` | 3D 舰船卡片 | P0 |
| `HudOverlay` | HUD 信息覆盖层 | P1 |
| `ScanlineEffect` | 扫描线效果 | P1 |
| `TypewriterText` | 打字机文字效果 | P1 |
| `DataVisualization` | 数据可视化图表 | P2 |
| `SoundEffects` | 环境音效系统 | P2 |

### 4.2 升级组件

| 组件 | 升级内容 | 优先级 |
|---|---|---|
| `HeroSection` | 全屏沉浸 + 粒子 + 3D | P0 |
| `FleetPreview` | 3D 卡片 + 光效追踪 | P0 |
| `Navigation` | 玻璃态 + 动画过渡 | P1 |
| `Footer` | 信息密度 + 视觉层次 | P2 |

---

## 五、技术栈补充

### 5.1 新增依赖

```json
{
  "dependencies": {
    "@vueuse/core": "^14.3.0",
    "three": "^0.170.0",
    "@react-three/fiber": "^8.15.0",
    "lottie-web": "^5.12.0",
    "howler": "^2.2.4"
  }
}
```

### 5.2 工具推荐

| 工具 | 用途 | 必要性 |
|---|---|---|
| Three.js | 3D 渲染 | P1 |
| Lottie | 矢量动画 | P2 |
| Howler.js | 音效系统 | P3 |
| Sharp | 图片处理 | P1 |

---

## 六、实施计划

### 6.1 里程碑

```
Week 1: 设计系统升级
  ├── Day 1-2: 色彩系统 + 动画系统增强
  ├── Day 3-4: 组件库搭建
  └── Day 5: 设计评审

Week 2: 核心组件重构
  ├── Day 1-2: Hero 区域重构
  ├── Day 3-4: 舰船卡片重构
  └── Day 5: 集成测试

Week 3: 高级特效实现
  ├── Day 1-2: 粒子系统
  ├── Day 3: 扫描线 + HUD 效果
  └── Day 4-5: 性能优化

Week 4: 测试与优化
  ├── Day 1-2: 响应式适配
  ├── Day 3: 无障碍优化
  └── Day 4-5: 性能测试 + 上线
```

### 6.2 验收标准

- [ ] Lighthouse 性能评分 ≥ 90
- [ ] 动画帧率稳定 60fps
- [ ] 移动端完美适配
- [ ] 无障碍测试通过
- [ ] 设计评审通过

---

## 七、参考资料

### 7.1 设计灵感

- [SpaceX 官网](https://www.spacex.com/) - 极简科幻风格
- [NASA 官网](https://www.nasa.gov/) - 科技感设计
- [Star Citizen 官网](https://robertsspaceindustries.com/) - 游戏风格参考

### 7.2 技术资源

- [GSAP 动画库](https://greensock.com/)
- [Three.js 文档](https://threejs.org/)
- [WebGL 粒子效果](https://threejs.org/examples/#webgl_particles)

---

## 八、风险评估

| 风险 | 影响 | 应对措施 |
|---|---|---|
| 性能下降 | 用户体验差 | 代码分割 + 懒加载 |
| 兼容性问题 | 部分用户无法访问 | 渐进增强 + 降级方案 |
| 开发周期超时 | 项目延期 | 分阶段交付 + MVP |
| 设计不满意 | 返工 | 先做原型 + 评审 |

---

## 九、附录

### 9.1 CSS 变量清单

```css
:root {
  /* 渐变色 */
  --gradient-cyber: linear-gradient(135deg, #4a9eff 0%, #a78bfa 50%, #ff6b9d 100%);
  --gradient-neon: linear-gradient(135deg, #00f5ff 0%, #4a9eff 100%);
  
  /* 玻璃态 */
  --glass-frost: rgba(255, 255, 255, 0.05);
  --glass-tint: rgba(74, 158, 255, 0.08);
  
  /* 光影 */
  --shadow-neon: 0 0 10px rgba(74, 158, 255, 0.5), 0 0 40px rgba(74, 158, 255, 0.2);
  --shadow-deep: 0 20px 60px rgba(0, 0, 0, 0.5);
}
```

### 9.2 动画配置

```javascript
const ANIMATION_PRESETS = {
  hero: { duration: 1.5, ease: 'power3.out' },
  card: { duration: 0.8, ease: 'back.out(1.7)' },
  text: { duration: 1, ease: 'power2.out' },
  particle: { duration: 2, ease: 'power1.inOut' }
}
```

---

**文档维护者**: Hermes Agent  
**最后更新**: 2026-06-20  
**版本**: 1.0
