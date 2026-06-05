/**
 * @file 核心成员视图测试
 * @description 覆盖组件渲染、数据加载、错误处理
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock dataService
vi.mock('@/services', () => ({
  dataService: {
    getMembers: vi.fn()
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
    template: '<span class="mock-status" :data-type="type" :data-label="label">{{ label }}</span>',
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
import Members from '@/views/Members.vue'

const mockMembersData = [
  { name: '指挥官A', role: '指挥官', intro: '团队创始人' },
  { name: '飞行员B', role: '王牌飞行员', intro: '战斗专家' },
  { name: '工程师C', role: '技术工程师', intro: '飞船维护' }
]

describe('Members.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该渲染页面标题', () => {
      dataService.getMembers.mockResolvedValue({ data: [] })

      const wrapper = mount(Members, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.members-page').exists()).toBe(true)
    })

    it('应该渲染统计概览面板', () => {
      dataService.getMembers.mockResolvedValue({ data: [] })

      const wrapper = mount(Members, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      const panels = wrapper.findAllComponents({ name: 'MFDPanel' })
      // 4 个统计面板 + N 个成员面板
      expect(panels.length).toBeGreaterThanOrEqual(4)
    })

    it('应该渲染成员档案区域', () => {
      dataService.getMembers.mockResolvedValue({ data: [] })

      const wrapper = mount(Members, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.members-grid').exists()).toBe(true)
    })
  })

  describe('数据加载', () => {
    it('挂载时应该调用 getMembers', () => {
      dataService.getMembers.mockResolvedValue({ data: [] })

      mount(Members, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(dataService.getMembers).toHaveBeenCalled()
    })

    it('加载成功应该渲染成员列表', async () => {
      dataService.getMembers.mockResolvedValue({ data: mockMembersData })

      const wrapper = mount(Members, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      // 等待异步加载完成
      await vi.waitFor(() => {
        expect(dataService.getMembers).toHaveBeenCalled()
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))

      // 应该有 4 个统计面板 + 3 个成员面板
      const panels = wrapper.findAllComponents({ name: 'MFDPanel' })
      expect(panels.length).toBe(7)
    })

    it('加载失败时不应崩溃', async () => {
      dataService.getMembers.mockRejectedValue(new Error('网络错误'))

      const wrapper = mount(Members, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      await vi.waitFor(() => {
        expect(dataService.getMembers).toHaveBeenCalled()
      })

      await wrapper.vm.$nextTick()

      // 组件不应崩溃，仍然渲染
      expect(wrapper.find('.members-page').exists()).toBe(true)
    })
  })

  describe('成员统计', () => {
    it('应该显示默认统计数据', () => {
      dataService.getMembers.mockResolvedValue({ data: [] })

      const wrapper = mount(Members, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      // 检查 overview-grid 区域存在
      expect(wrapper.find('.overview-grid').exists()).toBe(true)
    })
  })
})
