<!--
 * @fileoverview 页面过渡动画组件
 * @description 封装 Vue Transition 组件，提供智能的页面切换动画效果，
 *              支持前进/后退方向检测和多种过渡模式
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
 * @property {string} name - 过渡动画基础名称（默认 'page'）
 * @property {string} mode - 过渡模式：'out-in' | 'in-out' | 'default'
 * @property {boolean} appear - 是否在初始渲染时应用过渡
 * @property {string} direction - 动画方向：'auto' | 'forward' | 'backward' | 'none'
 */
const props = defineProps({
  name: {
    type: String,
    default: 'page'
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
 * @description 通过维护历史栈来判断用户是前进还是后退导航，
 *              从而应用不同的过渡动画效果
 */
watch(
  () => route.path,
  (to, from) => {
    if (from) {
      const lastIndex = historyStack.value.lastIndexOf(from)
      if (lastIndex !== -1 && historyStack.value[lastIndex + 1] === to) {
        // 如果目标路径在历史栈中紧随当前路径之后，则为前进
        isForward.value = true
      } else if (historyStack.value.includes(to)) {
        // 如果目标路径已在历史栈中，则为后退
        isForward.value = false
        const toIndex = historyStack.value.lastIndexOf(to)
        historyStack.value = historyStack.value.slice(0, toIndex + 1)
        return
      } else {
        // 新页面，视为前进
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
 * @description 根据导航方向返回对应的过渡动画名称：
 *              - 'none' 方向：使用淡入淡出效果
 *              - 'auto' 方向：根据历史栈自动判断
 *              - 'forward'/'backward'：使用指定方向
 */
const transitionName = computed(() => {
  if (props.direction === 'none') return 'page-fade'
  if (props.direction === 'auto') {
    return isForward.value ? 'page-slide-forward' : 'page-slide-backward'
  }
  return props.direction === 'forward' ? 'page-slide-forward' : 'page-slide-backward'
})

/**
 * 进入动画开始前钩子
 * @param {HTMLElement} el - 过渡元素
 * @description 设置 will-change 属性优化动画性能
 */
const onBeforeEnter = (el) => {
  emit('before-enter', el)
  el.style.willChange = 'transform, opacity'
}

/**
 * 进入动画结束后钩子
 * @param {HTMLElement} el - 过渡元素
 * @description 清除 will-change 属性释放资源
 */
const onAfterEnter = (el) => {
  emit('after-enter', el)
  el.style.willChange = 'auto'
}

/**
 * 离开动画开始前钩子
 * @param {HTMLElement} el - 过渡元素
 * @description 设置 will-change 属性优化动画性能
 */
const onBeforeLeave = (el) => {
  emit('before-leave', el)
  el.style.willChange = 'transform, opacity'
}

/**
 * 离开动画结束后钩子
 * @param {HTMLElement} el - 过渡元素
 * @description 清除 will-change 属性释放资源
 */
const onAfterLeave = (el) => {
  emit('after-leave', el)
  el.style.willChange = 'auto'
}
</script>

<style>
/*
 * ============================================
 * 淡入淡出过渡动画
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

/*
 * ============================================
 * 前进滑动过渡动画
 * 新页面从右侧滑入，旧页面向左滑出
 * ============================================
 */
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

/*
 * ============================================
 * 后退滑动过渡动画
 * 新页面从左侧滑入，旧页面向右滑出
 * ============================================
 */
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
  .page-fade-enter-active,
  .page-fade-leave-active,
  .page-slide-forward-enter-active,
  .page-slide-forward-leave-active,
  .page-slide-backward-enter-active,
  .page-slide-backward-leave-active {
    transition: opacity 0.15s ease;
    transform: none !important;
  }

  .page-slide-forward-enter-from,
  .page-slide-forward-leave-to,
  .page-slide-backward-enter-from,
  .page-slide-backward-leave-to {
    transform: none !important;
  }
}
</style>
