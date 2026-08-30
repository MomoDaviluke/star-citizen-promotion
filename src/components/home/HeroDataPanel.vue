<!--
  @file Hero 数据读数面板
  @description 展示战队关键数据的小型 HUD 面板
-->
<template>
  <div class="hero-data-panel">
    <div v-for="item in items" :key="item.label" class="hero-data-panel__item">
      <span
        class="hero-data-panel__value"
        :ref="(el) => { if (el) valueRefs.push(el) }"
      >{{ item.value }}</span>
      <span class="hero-data-panel__label">{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'

/**
 * Hero 数据面板组件
 * @props {Array<{value: string, label: string}>} items - 数据条目
 *   value 支持纯数字（自动 count-up）或文本（原样显示）
 */
const props = defineProps({
  items: {
    type: Array,
    required: true,
    validator: (value) => value.every(item =>
      typeof item.value === 'string' && typeof item.label === 'string'
    )
  }
})

const valueRefs = ref([])
let ctx = null

/**
 * 解析 value 中的数字部分与后缀（如 "120+" → {num:120, suffix:"+"}）
 * @param {string} raw - 原始 value 字符串
 * @returns {{num: number, suffix: string}|null} 非数字开头返回 null（不动画）
 */
function parseValue(raw) {
  const m = String(raw).match(/^(\d+(?:\.\d+)?)(.*)$/)
  return m ? { num: parseFloat(m[1]), suffix: m[2] } : null
}

onMounted(() => {
  // prefers-reduced-motion 降级：数值直接静态显示
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  ctx = gsap.context(() => {
    valueRefs.value.forEach((el, i) => {
      const item = props.items[i]
      if (!el || !item) return
      const parsed = parseValue(item.value)
      if (!parsed) return // 非数字文本，原样显示，不动画

      const counter = { val: 0 }
      gsap.to(counter, {
        val: parsed.num,
        duration: 1.4,
        delay: 0.9 + i * 0.15, // 在 Hero 前几幕完成后依次递增
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = Math.round(counter.val) + parsed.suffix
        }
      })
    })
  })
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<style scoped>
.hero-data-panel {
  display: flex;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
  padding: var(--space-4) 0;
}

.hero-data-panel__item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.hero-data-panel__value {
  font-family: var(--font-data);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-heading);
  letter-spacing: -0.02em;
}

.hero-data-panel__label {
  font-family: var(--font-data);
  font-size: var(--text-xs);
  color: var(--color-text-label);
  letter-spacing: 0.12em;
}

@media (max-width: 640px) {
  .hero-data-panel {
    gap: var(--space-4);
  }
  .hero-data-panel__value {
    font-size: var(--text-xl);
  }
}
</style>
