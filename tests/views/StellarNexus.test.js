/**
 * @file StellarNexus 首页视图测试
 * @description 覆盖组件渲染、Hero 区域、核心数据、四大章节
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('vue-router', () => ({
  RouterLink: {
    name: 'RouterLink',
    template: '<a class="mock-router-link"><slot /></a>',
    props: ['to']
  },
  RouterView: {
    name: 'RouterView',
    template: '<div><slot /></div>'
  },
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    currentRoute: { value: { path: '/' } }
  })),
  useRoute: vi.fn(() => ({
    path: '/',
    params: {},
    query: {}
  }))
}))

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    timeline: vi.fn(() => ({
      from: vi.fn(function () { return this })
    })),
    fromTo: vi.fn()
  }
}))

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    create: vi.fn(() => ({
      kill: vi.fn()
    }))
  }
}))

import StellarNexus from '@/views/StellarNexus.vue'

const stubs = {
  CosmicNebula: { template: '<div class="cosmic-nebula-stub" />' },
  CosmicStarfield: { template: '<div class="cosmic-starfield-stub" />' },
  CosmicPlanet: { template: '<div class="cosmic-planet-stub" />' },
  CosmicShip: { template: '<div class="cosmic-ship-stub" />' },
  OrbitalRing: { template: '<div class="orbital-ring-stub" />' },
  TacticalGrid: { template: '<div class="tactical-grid-stub" />' },
  HudPanel: { template: '<div class="hud-panel-stub"><slot /></div>' },
  HudTicker: { template: '<div class="hud-ticker-stub" />' },
  FilmGrain: { template: '<div class="film-grain-stub" />' },
  TechButton: { template: '<button class="tech-button-stub"><slot /></button>' }
}

describe('StellarNexus.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该渲染页面容器', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      expect(wrapper.find('.stellar-nexus').exists()).toBe(true)
    })

    it('应该渲染星云、星空与胶片颗粒背景元素', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      expect(wrapper.find('.stellar-nexus__nebula').exists()).toBe(true)
      expect(wrapper.find('.stellar-nexus__starfield').exists()).toBe(true)
      expect(wrapper.find('.stellar-nexus__grain').exists()).toBe(true)
    })

    it('应该渲染 Hero 区域', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      expect(wrapper.find('.stellar-nexus__hero').exists()).toBe(true)
      expect(wrapper.find('.stellar-nexus__title').exists()).toBe(true)
    })

    it('应该渲染标题包含 STELLAR NEXUS', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      expect(wrapper.html()).toContain('STELLAR')
      expect(wrapper.html()).toContain('NEXUS')
    })

    it('应该渲染副标题', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      expect(wrapper.find('.stellar-nexus__subtitle').exists()).toBe(true)
      expect(wrapper.html()).toContain('EXPLORE')
      expect(wrapper.html()).toContain('FIGHT')
      expect(wrapper.html()).toContain('CONQUER')
    })
  })

  describe('核心数据', () => {
    it('应该渲染统计数据区域', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      expect(wrapper.find('.stellar-nexus__stats').exists()).toBe(true)
    })

    it('应该渲染 3 个数据项', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      const stats = wrapper.findAll('.stellar-nexus__stat')
      expect(stats.length).toBe(3)
    })

    it('应该显示活跃飞行员数', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      expect(wrapper.html()).toContain('128')
      expect(wrapper.html()).toContain('ACTIVE PILOTS')
    })

    it('应该显示飞行小时数', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      expect(wrapper.html()).toContain('2400')
      expect(wrapper.html()).toContain('FLIGHT HOURS')
    })

    it('应该显示战备舰船数', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      expect(wrapper.html()).toContain('12')
      expect(wrapper.html()).toContain('COMBAT READY')
    })
  })

  describe('四大章节', () => {
    it('应该渲染 WORLDS 章节', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      expect(wrapper.find('.stellar-nexus__worlds').exists()).toBe(true)
      expect(wrapper.html()).toContain('WORLDS')
    })

    it('应该渲染 ROUTE 章节', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      expect(wrapper.find('.stellar-nexus__route').exists()).toBe(true)
      expect(wrapper.html()).toContain('ROUTE')
    })

    it('应该渲染 FLEET 章节', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      expect(wrapper.find('.stellar-nexus__fleet').exists()).toBe(true)
      expect(wrapper.html()).toContain('FLEET')
    })

    it('应该渲染 ENLIST 章节', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      expect(wrapper.find('.stellar-nexus__enlist').exists()).toBe(true)
      expect(wrapper.html()).toContain('ENLIST')
    })
  })

  describe('舰队编队', () => {
    it('应该渲染多艘舰船铭牌', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      const plates = wrapper.findAll('.stellar-nexus__ship-plate')
      expect(plates.length).toBeGreaterThanOrEqual(3)
    })

    it('应该显示旗舰信息', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      expect(wrapper.html()).toContain('AEGIS HAMMERHEAD')
      expect(wrapper.html()).toContain('SNT-003')
    })
  })

  describe('CTA 区域', () => {
    it('应该渲染 ENLIST 面板', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      expect(wrapper.find('.stellar-nexus__enlist-panel').exists()).toBe(true)
    })

    it('应该包含申请按钮', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      const actions = wrapper.find('.stellar-nexus__actions')
      expect(actions.exists()).toBe(true)
      expect(actions.html()).toContain('START APPLICATION')
    })

    it('应该包含探索舰队按钮', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      const actions = wrapper.find('.stellar-nexus__actions')
      expect(actions.exists()).toBe(true)
      expect(actions.html()).toContain('EXPLORE FLEET')
    })
  })

  describe('页脚', () => {
    it('应该渲染页脚', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      expect(wrapper.find('.stellar-nexus__footer').exists()).toBe(true)
    })

    it('应该包含版权与素材声明', () => {
      const wrapper = mount(StellarNexus, { global: { stubs } })
      expect(wrapper.html()).toContain('Star Citizen')
      expect(wrapper.html()).toContain('NASA')
    })
  })
})
