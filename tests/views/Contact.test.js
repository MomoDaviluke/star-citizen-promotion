/**
 * @file 联系我们视图测试
 * @description 覆盖组件渲染、通讯频道展示、合作信息
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

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

vi.mock('@/components/ui/DataDisplay.vue', () => ({
  default: {
    name: 'DataDisplay',
    template: '<div class="mock-data-display"><span>{{ label }}</span><span>{{ value }}</span></div>',
    props: ['label', 'value', 'type']
  }
}))

vi.mock('@/components/common/PageHeader.vue', () => ({
  default: {
    name: 'PageHeader',
    template: '<div class="mock-page-header"><h1>{{ title }}</h1></div>',
    props: ['backgroundImage', 'title', 'subtitle', 'systemId']
  }
}))

import Contact from '@/views/Contact.vue'

describe('Contact.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该渲染页面容器', () => {
      const wrapper = mount(Contact, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.contact-page').exists()).toBe(true)
    })

    it('应该渲染通讯频道区域', () => {
      const wrapper = mount(Contact, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.channels-section').exists()).toBe(true)
      expect(wrapper.find('.channels-grid').exists()).toBe(true)
    })

    it('应该渲染合作说明区域', () => {
      const wrapper = mount(Contact, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.cooperation-section').exists()).toBe(true)
    })

    it('应该渲染社交媒体区域', () => {
      const wrapper = mount(Contact, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.social-section').exists()).toBe(true)
    })
  })

  describe('通讯频道', () => {
    it('应该渲染多个通讯频道面板', () => {
      const wrapper = mount(Contact, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      const panels = wrapper.findAllComponents({ name: 'MFDPanel' })
      // 至少 3 个频道面板 + 1 个合作面板 + N 个社交媒体面板
      expect(panels.length).toBeGreaterThanOrEqual(4)
    })

    it('每个频道应该显示描述信息', () => {
      const wrapper = mount(Contact, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      const descriptions = wrapper.findAll('.channel-desc')
      expect(descriptions.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('合作信息', () => {
    it('应该显示响应时间', () => {
      const wrapper = mount(Contact, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.html()).toContain('RESPONSE TIME')
    })

    it('应该显示可用时间', () => {
      const wrapper = mount(Contact, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.html()).toContain('AVAILABILITY')
    })
  })
})
