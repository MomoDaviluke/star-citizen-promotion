/**
 * @file 首页状态管理 Store
 * @description 管理首页数据请求、加载状态与错误降级
 * @module stores/home
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStats } from '@/services/statsService'
import { fleetService } from '@/services/fleetService'
import { createStoreHelpers } from '@/utils/storeHelpers'
import {
  fallbackSummary,
  fallbackStatsList,
  fallbackFleetPreview,
  fallbackPlanetMeta
} from '@/data/homeFallback'

export const useHomeStore = defineStore('home', () => {
  // ========== 状态定义 ==========
  /** @type {import('vue').Ref<object|null>} 后端返回的完整 stats 数据（含 stats 数组和 summary） */
  const stats = ref(null)
  /** @type {import('vue').Ref<Array<object>>} 首页 Fleet 预览卡片数据 */
  const fleetPreview = ref([])
  const loading = ref(false)
  const error = ref(null)

  const { withLoading } = createStoreHelpers(loading, error)
  /** 解包服务端返回的 { data: ... } 包装结构，兼容直接返回实体 */
  const unwrap = (res) => res?.data ?? res

  // ========== 计算属性 ==========
  /** summary 对象（优先用后端数据，降级到 fallback） */
  const summary = computed(() => stats.value?.summary ?? fallbackSummary)
  /** stats 列表（优先用后端数据，降级到 fallback） */
  const statsList = computed(() => stats.value?.stats ?? fallbackStatsList)

  /** Hero 数据面板条目（3 项关键数字） */
  const heroDataPanelItems = computed(() => [
    { value: String(summary.value.activePilots), label: 'ACTIVE PILOTS' },
    { value: String(summary.value.totalMissions), label: 'MISSIONS' },
    { value: String(summary.value.activeMembers), label: 'MEMBERS' }
  ])

  /** Key Numbers 区条目（4 项，带数值用于计数动画） */
  const keyNumbers = computed(() => [
    { value: summary.value.activePilots, suffix: '', label: 'ACTIVE PILOTS' },
    { value: summary.value.totalMissions, suffix: '', label: 'MISSIONS' },
    { value: summary.value.activeMembers, suffix: '', label: 'MEMBERS' },
    { value: summary.value.activeProjects, suffix: '', label: 'PROJECTS' }
  ])

  /** Mars 区行星数据（静态展示元信息，不依赖后端） */
  const planetData = computed(() => fallbackPlanetMeta)

  // ========== 方法定义 ==========
  /** 统一获取首页数据（stats + fleet preview），使用 allSettled 保证部分失败不影响整体 */
  async function fetchHomeData() {
    return withLoading(async () => {
      const [statsRes, fleetRes] = await Promise.allSettled([
        getStats(),
        fleetService.getFleet({ limit: 3, sortBy: 'value', order: 'desc' })
      ])

      // stats 失败时降级到 fallback（stats.value 保持 null，computed 自动降级）
      if (statsRes.status === 'fulfilled') {
        stats.value = statsRes.value
      }
      // stats.value 保持 null，computed 会用 fallback

      // fleet 失败时降级到 fallback
      if (fleetRes.status === 'fulfilled') {
        const fleetData = unwrap(fleetRes.value)
        fleetPreview.value = Array.isArray(fleetData) ? fleetData.slice(0, 3) : fallbackFleetPreview
      } else {
        fleetPreview.value = fallbackFleetPreview
      }
    }, '获取首页数据失败')
  }

  /** 清除错误状态 */
  function clearError() {
    error.value = null
  }

  return {
    // 状态
    stats,
    fleetPreview,
    loading,
    error,
    // 计算属性
    summary,
    statsList,
    heroDataPanelItems,
    keyNumbers,
    planetData,
    // 方法
    fetchHomeData,
    clearError
  }
})
