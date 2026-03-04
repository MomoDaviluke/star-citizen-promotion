<!--
 * @fileoverview 页面标题组件
 * @description 提供统一的页面标题展示样式，包含装饰元素、标题和副标题
 * @module components/common/PageTitle
 * @example
 * <PageTitle title="关于我们" subtitle="了解我们的团队使命" />
 -->

<template>
  <section class="page-title">
    <!-- 顶部装饰元素 -->
    <div class="title-decoration">
      <span class="deco-line"></span>
      <span class="deco-dot"></span>
    </div>

    <!-- 页面标识文字 -->
    <p class="kicker">UEE TRANSMISSION</p>

    <!-- 主标题 -->
    <h1>{{ title }}</h1>

    <!-- 副标题 -->
    <p class="subtitle">{{ subtitle }}</p>

    <!-- 底部装饰元素 -->
    <div class="title-decoration title-decoration-bottom">
      <span class="deco-dot"></span>
      <span class="deco-line"></span>
    </div>
  </section>
</template>

<script setup>
/**
 * 组件属性定义
 * @property {string} title - 页面主标题（必填）
 * @property {string} subtitle - 页面副标题（可选，默认为空字符串）
 */
defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
/*
 * ============================================
 * 页面标题容器样式
 * ============================================
 */
.page-title {
  margin-bottom: 2rem;
  position: relative;
  padding-left: 1rem;
  border-left: 2px solid var(--accent);
}

/*
 * --------------------------------------------
 * 装饰元素样式
 * 包含渐变线条和脉冲动画圆点
 * --------------------------------------------
 */
.title-decoration {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.title-decoration-bottom {
  margin-top: 1rem;
  margin-bottom: 0;
}

.deco-line {
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, var(--accent-2), transparent);
}

.title-decoration-bottom .deco-line {
  background: linear-gradient(90deg, transparent, var(--accent-2));
}

.deco-dot {
  width: 6px;
  height: 6px;
  background: var(--accent-2);
  border-radius: 1px;
  box-shadow: 0 0 8px rgba(143, 215, 255, 0.5);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 8px rgba(143, 215, 255, 0.5);
  }
  50% {
    opacity: 0.6;
    box-shadow: 0 0 4px rgba(143, 215, 255, 0.3);
  }
}

/*
 * --------------------------------------------
 * 页面标识文字（Kicker）
 * 显示 "UEE TRANSMISSION" 标识
 * --------------------------------------------
 */
.kicker {
  margin: 0 0 0.35rem;
  color: var(--accent-2);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

/*
 * --------------------------------------------
 * 主标题样式
 * 使用渐变文字效果，响应式字体大小
 * --------------------------------------------
 */
h1 {
  margin: 0 0 0.5rem;
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: linear-gradient(135deg, var(--text) 0%, var(--accent-2) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/*
 * --------------------------------------------
 * 副标题样式
 * 使用柔和的文字颜色
 * --------------------------------------------
 */
.subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
}
</style>
