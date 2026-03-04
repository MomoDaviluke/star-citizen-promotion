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

const emit = defineEmits(['before-enter', 'after-enter', 'before-leave', 'after-leave'])

const route = useRoute()
const historyStack = ref([])
const isForward = ref(true)

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

const transitionName = computed(() => {
  if (props.direction === 'none') return 'page-fade'
  if (props.direction === 'auto') {
    return isForward.value ? 'page-slide-forward' : 'page-slide-backward'
  }
  return props.direction === 'forward' ? 'page-slide-forward' : 'page-slide-backward'
})

const onBeforeEnter = (el) => {
  emit('before-enter', el)
  el.style.willChange = 'transform, opacity'
}

const onAfterEnter = (el) => {
  emit('after-enter', el)
  el.style.willChange = 'auto'
}

const onBeforeLeave = (el) => {
  emit('before-leave', el)
  el.style.willChange = 'transform, opacity'
}

const onAfterLeave = (el) => {
  emit('after-leave', el)
  el.style.willChange = 'auto'
}
</script>

<style>
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
