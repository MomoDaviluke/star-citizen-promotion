/**
 * @file 首页状态管理 Store
 * @description 管理首页数据请求、加载状态与错误降级
 * @module stores/home
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStats } from '@/services/statsService'
import {
  fallbackSummary,
  fallbackStatsList,
  fallbackPlanetMeta
} from '@/data/homeFallback'

export const useHomeStore = defineStore('home', () => {
  // ========== 状态定义 ==========
  /** @type {import('vue').Ref<object|null>} 后端返回的完整 stats 数据（含 stats 数组和 summary） */
  const stats = ref(null)
  const loading = ref(false)
  const error = ref(null)

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
  /** 统一获取首页统计数据，失败时降级到 fallback */
  async function fetchHomeData() {
    loading.value = true
    error.value = null
    try {
      stats.value = unwrap(await getStats())
    } catch {
      // 统计数据获取失败，降级到 fallback（stats.value 保持 null，computed 自动降级）
      error.value = '统计数据获取失败，已展示兜底数据'
    } finally {
      loading.value = false
    }
  }

  /** 清除错误状态 */
  function clearError() {
    error.value = null
  }

  return {
    // 状态
    stats,
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
