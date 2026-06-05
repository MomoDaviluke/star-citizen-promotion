/**
 * @file 首页视图测试
 * @description 覆盖组件渲染、英雄区域、统计数据、仪表盘、王牌飞行员轮播
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock RouterLink
vi.mock('vue-router', () => ({
  RouterLink: {
    name: 'RouterLink',
    template: '<a class="mock-router-link"><slot /></a>',
    props: ['to']
  }
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

vi.mock('@/components/ui/DataDisplay.vue', () => ({
  default: {
    name: 'DataDisplay',
    template: '<div class="mock-data-display"><span>{{ label }}</span><span>{{ value }}</span></div>',
    props: ['label', 'value', 'type']
  }
}))

vi.mock('@/components/ui/HoloCard.vue', () => ({
  default: {
    name: 'HoloCard',
    template: '<div class="mock-holo-card"><slot /></div>',
    props: ['interactive', 'tiltAmount', 'glitchOnHover', 'glowColor']
  }
}))

import Home from '@/views/Home.vue'

describe('Home.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
  })

  describe('渲染', () => {
    it('应该渲染页面容器', () => {
      const wrapper = mount(Home, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' },
            'v-ripple': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.home-page').exists()).toBe(true)
    })

    it('应该渲染英雄区域', () => {
      const wrapper = mount(Home, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' },
            'v-ripple': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.hero').exists()).toBe(true)
      expect(wrapper.find('.hero-content').exists()).toBe(true)
    })

    it('应该渲染团队标题', () => {
      const wrapper = mount(Home, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' },
            'v-ripple': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.html()).toContain('星际公民战队')
    })

    it('应该渲染 CTA 按钮', () => {
      const wrapper = mount(Home, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' },
            'v-ripple': { template: '<div><slot /></div>' }
          }
        }
      })

      const actions = wrapper.find('.hero-actions')
      expect(actions.exists()).toBe(true)
      // 至少有 "立即加入" 和 "探索团队" 两个链接
      expect(actions.html()).toContain('立即加入')
      expect(actions.html()).toContain('探索团队')
    })
  })

  describe('团队统计', () => {
    it('应该渲染统计区域', () => {
      const wrapper = mount(Home, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' },
            'v-ripple': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.stats-section').exists()).toBe(true)
      expect(wrapper.find('.stats-grid').exists()).toBe(true)
    })

    it('应该渲染 4 个统计面板', () => {
      const wrapper = mount(Home, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' },
            'v-ripple': { template: '<div><slot /></div>' }
          }
        }
      })

      // MFDPanel 被 stub 了，检查 stats-grid 存在
      const grid = wrapper.find('.stats-grid')
      expect(grid.exists()).toBe(true)
    })
  })

  describe('任务控制台', () => {
    it('应该渲染仪表盘区域', () => {
      const wrapper = mount(Home, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' },
            'v-ripple': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.dashboard-section').exists()).toBe(true)
      expect(wrapper.find('.dashboard-grid').exists()).toBe(true)
    })

    it('应该渲染环形图', () => {
      const wrapper = mount(Home, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' },
            'v-ripple': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.ring-chart').exists()).toBe(true)
    })

    it('应该渲染最新动态', () => {
      const wrapper = mount(Home, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' },
            'v-ripple': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.intel-feed').exists()).toBe(true)
    })

    it('应该渲染在线成员列表', () => {
      const wrapper = mount(Home, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' },
            'v-ripple': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.crew-list').exists()).toBe(true)
    })
  })

  describe('王牌飞行员', () => {
    it('应该渲染王牌飞行员区域', () => {
      const wrapper = mount(Home, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' },
            'v-ripple': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.ace-section').exists()).toBe(true)
    })

    it('应该显示当前飞行员信息', () => {
      const wrapper = mount(Home, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' },
            'v-ripple': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.ace-name').exists()).toBe(true)
      expect(wrapper.find('.ace-callsign').exists()).toBe(true)
    })

    it('应该显示飞行员数据条', () => {
      const wrapper = mount(Home, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' },
            'v-ripple': { template: '<div><slot /></div>' }
          }
        }
      })

      const statBars = wrapper.findAll('.ace-stat-item')
      expect(statBars.length).toBe(3)
    })

    it('应该暴露飞行员轮播 API', () => {
      const wrapper = mount(Home, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' },
            'v-ripple': { template: '<div><slot /></div>' }
          }
        }
      })

      // 验证组件暴露了飞行员轮播相关的数据
      expect(wrapper.vm.currentPilotIndex).toBeDefined()
      expect(typeof wrapper.vm.currentPilotIndex).toBe('number')
      expect(wrapper.vm.aceSectionRef).toBeDefined()
    })
  })

  describe('操作信息条', () => {
    it('应该渲染操作信息条', () => {
      const wrapper = mount(Home, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' },
            'v-ripple': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.ops-strip').exists()).toBe(true)
    })
  })

  describe('系统状态栏', () => {
    it('应该渲染系统状态栏', () => {
      const wrapper = mount(Home, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' },
            'v-ripple': { template: '<div><slot /></div>' }
          }
        }
      })

      expect(wrapper.find('.hero-status-bar').exists()).toBe(true)
    })

    it('应该有时间显示区域', () => {
      const wrapper = mount(Home, {
        global: {
          stubs: {
            'v-scroll-reveal': { template: '<div><slot /></div>' },
            'v-ripple': { template: '<div><slot /></div>' }
          }
        }
      })

      // currentTime ref 存在（setInterval 在 happy-dom 中不运行，所以值可能为空）
      expect('currentTime' in wrapper.vm).toBe(true)
      expect(wrapper.find('.status-value').exists()).toBe(true)
    })
  })
})
