<!--
 * @fileoverview 页面过渡动画组件 — 星门跃迁版
 * @description 封装 Vue Transition 组件，提供星际公民风格的页面切换动画效果，
 *              核心效果为"星门跃迁"：页面切换时模拟超空间跃迁的视觉冲击
 *              离开页面 → 星光拉伸 → 白光闪烁 → 新页面展开
 * @module components/common/PageTransition
 * @example
 * <PageTransition direction="auto" mode="out-in">
 *   <router-view />
 * </PageTransition>
 -->

<template>
  <Transition
    :name="transitionName"
    :mode="mode"
    :appear="appear"
    @before-enter="onBeforeEnter"
    @after-enter="onAfterEnter"
    @before-leave="onBeforeLeave"
    @after-leave="onAfterLeave"
  >
    <slot></slot>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

/**
 * 组件属性定义
 * @property {string} name - 过渡动画基础名称（默认 'stargate'）
 * @property {string} mode - 过渡模式：'out-in' | 'in-out' | 'default'
 * @property {boolean} appear - 是否在初始渲染时应用过渡
 * @property {string} direction - 动画方向：'auto' | 'forward' | 'backward' | 'none'
 */
const props = defineProps({
  name: {
    type: String,
    default: 'stargate'
  },
  mode: {
    type: String,
    default: 'out-in',
    validator: (v) => ['out-in', 'in-out', 'default'].includes(v)
  },
  appear: {
    type: Boolean,
    default: true
  },
  direction: {
    type: String,
    default: 'auto',
    validator: (v) => ['auto', 'forward', 'backward', 'none'].includes(v)
  }
})

/**
 * 组件事件定义
 * @event before-enter - 进入动画开始前触发
 * @event after-enter - 进入动画结束后触发
 * @event before-leave - 离开动画开始前触发
 * @event after-leave - 离开动画结束后触发
 */
const emit = defineEmits(['before-enter', 'after-enter', 'before-leave', 'after-leave'])

/** 当前路由对象 */
const route = useRoute()

/** 导航历史栈，用于判断前进/后退方向 */
const historyStack = ref([])

/** 是否为前进导航 */
const isForward = ref(true)

/**
 * 监听路由变化，判断导航方向
 */
watch(
  () => route.path,
  (to, from) => {
    if (from) {
      const lastIndex = historyStack.value.lastIndexOf(from)
      if (lastIndex !== -1 && historyStack.value[lastIndex + 1] === to) {
        isForward.value = true
      } else if (historyStack.value.includes(to)) {
        isForward.value = false
        const toIndex = historyStack.value.lastIndexOf(to)
        historyStack.value = historyStack.value.slice(0, toIndex + 1)
        return
      } else {
        isForward.value = true
      }
      historyStack.value.push(to)
    }
  },
  { immediate: true }
)

/**
 * 计算过渡动画名称
 * @returns {string} 过渡动画 CSS 类名前缀
 * @description 根据导航方向返回对应的星门跃迁动画：
 *              - 'none' 方向：使用淡入淡出效果
 *              - 'auto' 方向：根据历史栈自动判断前进/后退
 *              - 前进：星光拉伸 + 白光闪烁
 *              - 后退：逆向收缩效果
 */
const transitionName = computed(() => {
  if (props.direction === 'none') return 'stargate-fade'
  if (props.direction === 'auto') {
    return isForward.value ? 'stargate-forward' : 'stargate-backward'
  }
  return props.direction === 'forward' ? 'stargate-forward' : 'stargate-backward'
})

/**
 * 进入动画开始前钩子
 * @param {HTMLElement} el - 过渡元素
 */
const onBeforeEnter = (el) => {
  emit('before-enter', el)
  el.style.willChange = 'transform, opacity, filter'
}

/**
 * 进入动画结束后钩子
 * @param {HTMLElement} el - 过渡元素
 */
const onAfterEnter = (el) => {
  emit('after-enter', el)
  el.style.willChange = 'auto'
}

/**
 * 离开动画开始前钩子
 * @param {HTMLElement} el - 过渡元素
 */
const onBeforeLeave = (el) => {
  emit('before-leave', el)
  el.style.willChange = 'transform, opacity, filter'
}

/**
 * 离开动画结束后钩子
 * @param {HTMLElement} el - 过渡元素
 */
const onAfterLeave = (el) => {
  emit('after-leave', el)
  el.style.willChange = 'auto'
}
</script>

<style>
/*
 * ============================================
 * 星门跃迁 — 淡入淡出（降级模式）
 * ============================================
 */
.stargate-fade-enter-active,
.stargate-fade-leave-active {
  transition: opacity 0.3s ease;
}

.stargate-fade-enter-from,
.stargate-fade-leave-to {
  opacity: 0;
}

/*
 * ============================================
 * 星门跃迁 — 前进方向
 * 离开：当前页面星光拉伸 → 白光闪烁 → 消失
 * 进入：新页面从中心扩展出现
 * ============================================
 */
.stargate-forward-enter-active {
  transition:
    opacity 0.5s ease 0.2s,
    transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s,
    filter 0.3s ease 0.2s;
  position: absolute;
  width: 100%;
}

.stargate-forward-leave-active {
  transition:
    transform 0.4s cubic-bezier(0.7, 0, 0.84, 0),
    opacity 0.3s ease 0.1s,
    filter 0.3s ease;
  position: absolute;
  width: 100%;
}

/** 离开 — 星光拉伸 + 白光闪烁 */
.stargate-forward-leave-from {
  opacity: 1;
  transform: scale(1);
  filter: brightness(1);
}

.stargate-forward-leave-to {
  opacity: 0;
  transform: scale(1.5);
  filter: brightness(3) blur(4px);
}

/** 进入 — 从中心扩展 */
.stargate-forward-enter-from {
  opacity: 0;
  transform: scale(0.85);
  filter: brightness(2) blur(2px);
}

.stargate-forward-enter-to {
  opacity: 1;
  transform: scale(1);
  filter: brightness(1) blur(0px);
}

/*
 * ============================================
 * 星门跃迁 — 后退方向
 * 离开：当前页面收缩消失
 * 进入：新页面从边缘滑入
 * ============================================
 */
.stargate-backward-enter-active {
  transition:
    opacity 0.5s ease 0.15s,
    transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s,
    filter 0.3s ease 0.15s;
  position: absolute;
  width: 100%;
}

.stargate-backward-leave-active {
  transition:
    transform 0.35s cubic-bezier(0.7, 0, 0.84, 0),
    opacity 0.3s ease 0.1s,
    filter 0.3s ease;
  position: absolute;
  width: 100%;
}

/** 离开 — 收缩消失 */
.stargate-backward-leave-from {
  opacity: 1;
  transform: scale(1);
  filter: brightness(1);
}

.stargate-backward-leave-to {
  opacity: 0;
  transform: scale(0.7);
  filter: brightness(2) blur(4px);
}

/** 进入 — 从边缘滑入 */
.stargate-backward-enter-from {
  opacity: 0;
  transform: scale(1.1);
  filter: brightness(1.5) blur(2px);
}

.stargate-backward-enter-to {
  opacity: 1;
  transform: scale(1);
  filter: brightness(1) blur(0px);
}

/*
 * ============================================
 * 保留旧版兼容（page- 前缀）
 * ============================================
 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

.page-slide-forward-enter-active,
.page-slide-forward-leave-active,
.page-slide-backward-enter-active,
.page-slide-backward-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
}

.page-slide-forward-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.page-slide-forward-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.page-slide-backward-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.page-slide-backward-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/*
 * --------------------------------------------
 * 无障碍支持：尊重用户的减少动画偏好
 * --------------------------------------------
 */
@media (prefers-reduced-motion: reduce) {
  .stargate-fade-enter-active,
  .stargate-fade-leave-active,
  .stargate-forward-enter-active,
  .stargate-forward-leave-active,
  .stargate-backward-enter-active,
  .stargate-backward-leave-active,
  .page-fade-enter-active,
  .page-fade-leave-active,
  .page-slide-forward-enter-active,
  .page-slide-forward-leave-active,
  .page-slide-backward-enter-active,
  .page-slide-backward-leave-active {
    transition: opacity 0.15s ease;
    transform: none !important;
    filter: none !important;
  }

  .stargate-forward-enter-from,
  .stargate-forward-leave-to,
  .stargate-backward-enter-from,
  .stargate-backward-leave-to,
  .page-slide-forward-enter-from,
  .page-slide-forward-leave-to,
  .page-slide-backward-enter-from,
  .page-slide-backward-leave-to {
    transform: none !important;
    filter: none !important;
  }
}
</style>
