/**
 * @file 活动项目视图测试
 * @description 覆盖组件渲染、数据加载、任务统计、状态显示
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock dataService
vi.mock('@/services', () => ({
  dataService: {
    getProjects: vi.fn()
  }
}))

// Mock logger
vi.mock('@/utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })
}))

// Mock child components
vi.mock('@/components/ui/MFDPanel.vue', () => ({
  default: {
    name: 'MFDPanel',
    template: '<div class="mock-mfd"><slot /></div>',
    props: ['variant', 'title', 'subtitle', 'icon', 'status', 'statusType', 'animated', 'collapsible', 'scanlines']
  }
}))

vi.mock('@/components/ui/StatusIndicator.vue', () => ({
  default: {
    name: 'StatusIndicator',
    template: '<span class="mock-status" :data-type="type">{{ label }}</span>',
    props: ['type', 'label', 'pulse', 'size']
  }
}))

vi.mock('@/components/common/PageHeader.vue', () => ({
  default: {
    name: 'PageHeader',
    template: '<div class="mock-page-header"><h1>{{ title }}</h1></div>',
    props: ['backgroundImage', 'title', 'subtitle', 'systemId']
  }
}))

import { dataService } from '@/services'
import Projects from '@/views/Projects.vue'

const mockProjectsData = [
  {
    name: '联合巡逻',
    description: '定期联合巡逻任务',
    period: '2026-Q2',
    status: 'active',
    progress: 75
  },
  {
    name: '舰队演习',
    description: '季度舰队战术演习',
    period: '2026-Q3',
    status: 'planned',
    progress: 10
  },
  {
    name: '护航任务',
    description: '商船护航行动',
    period: '2026-Q1',
    status: 'completed',
    progress: 100
  }
]

describe('Projects.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该渲染页面容器', () => {
      dataService.getProjects.mockResolvedValue({ data: [] })

      const wrapper = mount(Projects, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.projects-page').exists()).toBe(true)
    })

    it('应该渲染任务统计区域', () => {
      dataService.getProjects.mockResolvedValue({ data: [] })

      const wrapper = mount(Projects, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.stats-section').exists()).toBe(true)
      expect(wrapper.find('.stats-grid').exists()).toBe(true)
    })

    it('应该渲染任务日志区域', () => {
      dataService.getProjects.mockResolvedValue({ data: [] })

      const wrapper = mount(Projects, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.missions-section').exists()).toBe(true)
      expect(wrapper.find('.missions-grid').exists()).toBe(true)
    })
  })

  describe('数据加载', () => {
    it('挂载时应该调用 getProjects', () => {
      dataService.getProjects.mockResolvedValue({ data: [] })

      mount(Projects, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(dataService.getProjects).toHaveBeenCalled()
    })

    it('加载成功应该渲染任务列表', async () => {
      dataService.getProjects.mockResolvedValue({ data: mockProjectsData })

      const wrapper = mount(Projects, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      await vi.waitFor(() => {
        expect(dataService.getProjects).toHaveBeenCalled()
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))

      // 4 个统计面板 + 3 个任务面板
      const panels = wrapper.findAllComponents({ name: 'MFDPanel' })
      expect(panels.length).toBe(7)
    })

    it('加载失败时不应崩溃', async () => {
      dataService.getProjects.mockRejectedValue(new Error('网络错误'))

      const wrapper = mount(Projects, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      await vi.waitFor(() => {
        expect(dataService.getProjects).toHaveBeenCalled()
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.projects-page').exists()).toBe(true)
    })
  })

  describe('任务统计', () => {
    it('应该显示 4 个统计指标', () => {
      dataService.getProjects.mockResolvedValue({ data: [] })

      const wrapper = mount(Projects, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      const statPanels = wrapper.findAll('.stat-mfd-panel')
      expect(statPanels.length).toBe(4)
    })

    it('统计面板应该显示百分比进度条', () => {
      dataService.getProjects.mockResolvedValue({ data: [] })

      const wrapper = mount(Projects, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      const statBars = wrapper.findAll('.stat-bar')
      expect(statBars.length).toBe(4)
    })
  })
})
