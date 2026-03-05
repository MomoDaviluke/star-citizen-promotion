<!--
  @file 错误边界组件
  @description 捕获子组件的渲染错误，显示友好的错误提示
  @module components/common/ErrorBoundary
-->

<template>
  <slot v-if="!hasError" />
  <div v-else class="error-boundary">
    <div class="error-content">
      <div class="error-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h2 class="error-title">{{ title }}</h2>
      <p class="error-message">{{ message }}</p>
      <div class="error-actions">
        <button @click="retry" class="btn btn-primary">
          <span>重试</span>
        </button>
        <button @click="goHome" class="btn btn-secondary">
          <span>返回首页</span>
        </button>
      </div>
      <details v-if="showDetails && errorDetails" class="error-details">
        <summary>错误详情</summary>
        <pre>{{ errorDetails }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup>
/**
 * 错误边界组件
 * @description 捕获子组件的渲染错误，显示友好的错误提示
 */

import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  title: {
    type: String,
    default: '出现了一些问题'
  },
  message: {
    type: String,
    default: '页面加载失败，请稍后重试'
  },
  showDetails: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['error'])

const router = useRouter()
const hasError = ref(false)
const errorDetails = ref(null)

onErrorCaptured((error, instance, info) => {
  hasError.value = true
  errorDetails.value = {
    message: error.message,
    stack: error.stack,
    component: instance?.$options?.name || 'Unknown',
    info
  }

  emit('error', { error, instance, info })

  console.error('ErrorBoundary 捕获错误:', error)

  return false
})

function retry() {
  hasError.value = false
  errorDetails.value = null
}

function goHome() {
  hasError.value = false
  errorDetails.value = null
  router.push('/')
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
}

.error-content {
  text-align: center;
  max-width: 400px;
}

.error-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 107, 107, 0.1);
  border: 2px solid var(--danger);
  border-radius: 50%;
  color: var(--danger);
}

.error-icon svg {
  width: 32px;
  height: 32px;
}

.error-title {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text);
}

.error-message {
  margin: 0 0 1.5rem;
  color: var(--text-muted);
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.error-details {
  margin-top: 2rem;
  text-align: left;
  background: rgba(3, 8, 16, 0.6);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 1rem;
}

.error-details summary {
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.error-details pre {
  margin: 1rem 0 0;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--danger);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
