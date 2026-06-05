/**
 * Canvas 2D 粒子引擎核心
 * @description 高性能粒子系统，支持星空、引擎尾焰、跃迁等特效
 * @version 3.0
 */

export class ParticleEngine {
  /**
   * 创建粒子引擎实例
   * @param {HTMLCanvasElement} canvas - Canvas 元素
   * @param {Object} options - 配置选项
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.isRunning = false;
    this.animationId = null;

    // 默认配置
    this.config = {
      particleCount: 200,
      maxParticles: 1000,
      fps: 60,
      ...options
    };

    // 性能监控
    this.performance = {
      lastTime: 0,
      frameCount: 0,
      fps: 0
    };

    // 保存 resize 处理函数引用，确保 destroy 时能正确移除
    this._resizeHandler = () => this.resize();

    this.resize();
    window.addEventListener('resize', this._resizeHandler);
  }

  /**
   * 调整 Canvas 尺寸
   */
  resize() {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
    } else {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  /**
   * 创建粒子
   * @param {Object} config - 粒子配置
   */
  createParticle(config = {}) {
    const defaults = {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: 0,
      vy: 0,
      size: 1,
      color: '#ffffff',
      alpha: 1,
      life: 1,
      decay: 0.01,
      type: 'star'
    };

    return { ...defaults, ...config };
  }

  /**
   * 添加粒子
   * @param {Object|Array} particles - 单个粒子或粒子数组
   */
  add(particles) {
    if (Array.isArray(particles)) {
      this.particles.push(...particles);
    } else {
      this.particles.push(particles);
    }

    // 限制最大粒子数
    if (this.particles.length > this.config.maxParticles) {
      this.particles.splice(0, this.particles.length - this.config.maxParticles);
    }
  }

  /**
   * 清空粒子
   */
  clear() {
    this.particles = [];
  }

  /**
   * 更新粒子状态
   * @param {number} deltaTime - 时间增量
   */
  update(deltaTime = 16.67) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // 更新位置
      p.x += p.vx * (deltaTime / 16.67);
      p.y += p.vy * (deltaTime / 16.67);

      // 更新生命周期
      p.life -= p.decay * (deltaTime / 16.67);

      // 移除死亡粒子
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // 类型特定更新
      switch (p.type) {
        case 'star':
          this.updateStar(p, deltaTime);
          break;
        case 'engine':
          this.updateEngine(p, deltaTime);
          break;
        case 'warp':
          this.updateWarp(p, deltaTime);
          break;
      }
    }
  }

  /**
   * 更新星空粒子
   */
  updateStar(p, deltaTime) {
    // 闪烁效果
    p.alpha = 0.3 + Math.sin(Date.now() * 0.001 + p.x) * 0.7;

    // 视差移动
    p.y += p.vy * (deltaTime / 16.67);

    // 循环边界
    if (p.y > this.height) {
      p.y = 0;
      p.x = Math.random() * this.width;
    }
  }

  /**
   * 更新引擎粒子
   */
  updateEngine(p, deltaTime) {
    p.size *= 0.98;
    p.alpha = p.life;
    p.vx += (Math.random() - 0.5) * 0.5;
  }

  /**
   * 更新跃迁粒子
   */
  updateWarp(p, deltaTime) {
    p.vx *= 1.05;
    p.vy *= 1.05;
    p.size *= 1.02;
    p.alpha = p.life * 0.5;
  }

  /**
   * 渲染粒子
   */
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha * p.life;

      switch (p.type) {
        case 'star':
          this.renderStar(ctx, p);
          break;
        case 'engine':
          this.renderEngine(ctx, p);
          break;
        case 'warp':
          this.renderWarp(ctx, p);
          break;
        default:
          this.renderDefault(ctx, p);
      }

      ctx.restore();
    }
  }

  /**
   * 渲染星空粒子
   */
  renderStar(ctx, p) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();

    // 十字光芒（大星星）
    if (p.size > 2) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha *= 0.3;
      ctx.beginPath();
      ctx.moveTo(p.x - p.size * 3, p.y);
      ctx.lineTo(p.x + p.size * 3, p.y);
      ctx.moveTo(p.x, p.y - p.size * 3);
      ctx.lineTo(p.x, p.y + p.size * 3);
      ctx.stroke();
    }
  }

  /**
   * 渲染引擎粒子
   */
  renderEngine(ctx, p) {
    const gradient = ctx.createRadialGradient(
      p.x, p.y, 0,
      p.x, p.y, p.size * 2
    );
    gradient.addColorStop(0, p.color);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 渲染跃迁粒子
   */
  renderWarp(ctx, p) {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.size;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
    ctx.stroke();
  }

  /**
   * 默认渲染
   */
  renderDefault(ctx, p) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 动画循环
   */
  animate(currentTime = 0) {
    if (!this.isRunning) return;

    // 计算 FPS
    const deltaTime = currentTime - this.performance.lastTime;
    this.performance.lastTime = currentTime;

    if (deltaTime > 0) {
      this.performance.frameCount++;
      if (this.performance.frameCount % 30 === 0) {
        this.performance.fps = Math.round(1000 / deltaTime);
      }
    }

    this.update(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame((time) => this.animate(time));
  }

  /**
   * 启动引擎
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  /**
   * 停止引擎
   */
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 销毁引擎
   */
  destroy() {
    this.stop();
    window.removeEventListener('resize', this._resizeHandler);
    this._resizeHandler = null;
    this.particles = [];
  }
}

/**
 * 创建星空场景
 * @param {ParticleEngine} engine - 粒子引擎实例
 * @param {Object} options - 配置选项
 */
export function createStarfield(engine, options = {}) {
  const config = {
    count: 200,
    minSize: 0.5,
    maxSize: 3,
    speed: 0.2,
    colors: ['#ffffff', '#a8d8ff', '#ffd4a8', '#e8f4ff'],
    ...options
  };

  const particles = [];
  for (let i = 0; i < config.count; i++) {
    particles.push(engine.createParticle({
      x: Math.random() * engine.width,
      y: Math.random() * engine.height,
      vx: 0,
      vy: config.speed + Math.random() * config.speed,
      size: config.minSize + Math.random() * (config.maxSize - config.minSize),
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      alpha: 0.3 + Math.random() * 0.7,
      life: 1,
      decay: 0,
      type: 'star'
    }));
  }

  engine.add(particles);
}

/**
 * 创建引擎尾焰
 * @param {ParticleEngine} engine - 粒子引擎实例
 * @param {number} x - 发射源 X 坐标
 * @param {number} y - 发射源 Y 坐标
 * @param {Object} options - 配置选项
 */
export function createEngineTrail(engine, x, y, options = {}) {
  const config = {
    count: 5,
    speed: 3,
    spread: 1,
    colors: ['#f59e0b', '#fbbf24', '#ef4444', '#ffffff'],
    ...options
  };

  const particles = [];
  for (let i = 0; i < config.count; i++) {
    particles.push(engine.createParticle({
      x: x + (Math.random() - 0.5) * config.spread,
      y: y + (Math.random() - 0.5) * config.spread,
      vx: (Math.random() - 0.5) * config.speed,
      vy: config.speed + Math.random() * 2,
      size: 2 + Math.random() * 4,
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      alpha: 0.8,
      life: 1,
      decay: 0.02 + Math.random() * 0.02,
      type: 'engine'
    }));
  }

  engine.add(particles);
}

/**
 * 创建跃迁效果
 * @param {ParticleEngine} engine - 粒子引擎实例
 * @param {Object} options - 配置选项
 */
export function createWarpEffect(engine, options = {}) {
  const config = {
    count: 100,
    centerX: engine.width / 2,
    centerY: engine.height / 2,
    colors: ['#06b6d4', '#22d3ee', '#ffffff'],
    ...options
  };

  const particles = [];
  for (let i = 0; i < config.count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 15;

    particles.push(engine.createParticle({
      x: config.centerX,
      y: config.centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 1 + Math.random() * 2,
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      alpha: 0.8,
      life: 1,
      decay: 0.01 + Math.random() * 0.01,
      type: 'warp'
    }));
  }

  engine.add(particles);
}
