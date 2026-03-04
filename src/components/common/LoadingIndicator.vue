<template>
  <Teleport to="body">
    <Transition name="loading-fade">
      <div v-if="isLoading" class="loading-overlay" role="alert" aria-live="polite">
        <div class="loading-content">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-core"></div>
          </div>
          <p class="loading-text">{{ text }}</p>
          <div v-if="showProgress" class="loading-progress">
            <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  text: {
    type: String,
    default: '加载中...'
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  minDuration: {
    type: Number,
    default: 200
  }
})

const isLoading = ref(false)
const progress = ref(0)
const startTime = ref(0)
const minDurationTimer = ref(null)
const progressTimer = ref(null)

const router = useRouter()

const startLoading = () => {
  if (isLoading.value) return
  startTime.value = Date.now()
  isLoading.value = true
  progress.value = 0
  
  if (props.showProgress) {
    simulateProgress()
  }
}

const stopLoading = () => {
  const elapsed = Date.now() - startTime.value
  const remaining = Math.max(0, props.minDuration - elapsed)
  
  if (minDurationTimer.value) {
    clearTimeout(minDurationTimer.value)
  }
  
  if (progressTimer.value) {
    clearInterval(progressTimer.value)
    progressTimer.value = null
  }
  
  minDurationTimer.value = setTimeout(() => {
    isLoading.value = false
    progress.value = 100
  }, remaining)
}

const simulateProgress = () => {
  progressTimer.value = setInterval(() => {
    if (progress.value < 90) {
      progress.value += Math.random() * 10
    }
  }, 100)
}

const forceStop = () => {
  if (minDurationTimer.value) {
    clearTimeout(minDurationTimer.value)
  }
  if (progressTimer.value) {
    clearInterval(progressTimer.value)
  }
  isLoading.value = false
}

router.beforeEach((to, from, next) => {
  if (to.path !== from.path) {
    startLoading()
  }
  next()
})

router.afterEach(() => {
  stopLoading()
})

router.onError(() => {
  forceStop()
})

onUnmounted(() => {
  forceStop()
})

defineExpose({
  startLoading,
  stopLoading,
  forceStop,
  isLoading,
  progress
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(3, 8, 16, 0.85);
  backdrop-filter: blur(8px);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;
}

.spinner-ring {
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
}

.spinner-ring:nth-child(1) {
  border-top-color: var(--accent);
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  inset: 6px;
  border-right-color: var(--accent-2);
  animation-delay: 0.15s;
  animation-direction: reverse;
}

.spinner-ring:nth-child(3) {
  inset: 12px;
  border-bottom-color: var(--accent);
  animation-delay: 0.3s;
}

.spinner-core {
  position: absolute;
  inset: 18px;
  background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse 1s ease-in-out infinite;
}

.loading-text {
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0;
}

.loading-progress {
  width: 200px;
  height: 3px;
  background: rgba(95, 169, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  border-radius: 2px;
  transition: width 0.1s ease-out;
  box-shadow: 0 0 10px var(--accent);
}

.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.25s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner-ring,
  .spinner-core {
    animation: none;
  }
  
  .spinner-ring:nth-child(1) {
    border-top-color: var(--accent);
    border-right-color: var(--accent);
  }
}
</style>
