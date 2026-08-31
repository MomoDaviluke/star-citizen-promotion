import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'

import shipDatabase, { shipList } from '@/data/shipDatabase.js'

// C2：模块替身一律用 vi.mock（hoisted），配合 vi.hoisted 承载可断言的假对象
const gsapMock = vi.hoisted(() => ({
  setupFns: [],
  api: {
    reveal: vi.fn(),
    stagger: vi.fn(),
    countUp: vi.fn(),
    barFill: vi.fn(),
    parallax: vi.fn()
  }
}))

vi.mock('@/composables/useGSAPReveal', () => ({
  useGSAPReveal: (setupFn) => {
    gsapMock.setupFns.push(setupFn)
    return { refresh: vi.fn(), kill: vi.fn() }
  },
  ANIMATION_CONFIGS: {}
}))

const Blank = { template: '<div class="blank">blank</div>' }

const createTestRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Home', component: Blank },
      { path: '/fleet', name: 'Fleet', component: Blank },
      { path: '/fleet/:slug', name: 'ShipDetail', component: Blank }
    ]
  })

/**
 * 挂载 ShipDetail 到指定舰船 slug
 * @param {string} slug - 舰船 slug，传不存在的值进入 notFound 分支
 */
async function mountShip(slug) {
  const router = createTestRouter()
  await router.push(`/fleet/${slug}`)
  await router.isReady()

  const { default: ShipDetail } = await import('@/views/ShipDetail.vue')
  const wrapper = mount(ShipDetail, { global: { plugins: [router] } })
  await flushPromises()

  return { wrapper, router }
}

/**
 * 手动执行组件注册的 GSAP 动画初始化回调
 * @description useGSAPReveal 已被替身捕获 setupFn，不手动触发则组件内的
 *              动画分支（进度条填充 / 交错揭示）永远不会被覆盖
 */
async function runRevealSetup() {
  const setupFn = gsapMock.setupFns[gsapMock.setupFns.length - 1]
  expect(setupFn).toBeTypeOf('function')
  setupFn(gsapMock.api)
  // setupFn 内部还有一层 nextTick，需再等一轮
  await nextTick()
  await nextTick()
}

describe('ShipDetail 视图', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    gsapMock.setupFns.length = 0
  })

  it('应渲染舰船基本信息与注册号', async () => {
    const { wrapper } = await mountShip('arrow')
    const ship = shipDatabase.arrow

    expect(wrapper.find('.ship-hero__name').text()).toBe(ship.name)
    expect(wrapper.find('.ship-hero__manufacturer').text()).toBe(ship.manufacturer)
    expect(wrapper.find('.ship-hero__role').text()).toBe(ship.role)
    // 'Anvil Arrow' 取前 3 个字母并大写 → REG-4F-ANV
    expect(wrapper.find('.ship-hero__registry').text()).toBe('REG-4F-ANV')
  })

  it('heroDataStrip 应按中文标签提取船员/长度/战斗评级', async () => {
    const { wrapper } = await mountShip('arrow')

    const items = wrapper.findAll('.data-strip__item')
    expect(items).toHaveLength(3)
    expect(items[0].text()).toContain('CREW')
    expect(items[0].text()).toContain('1 人')
    expect(items[1].text()).toContain('LENGTH')
    expect(items[1].text()).toContain('18.5 m')
    expect(items[2].text()).toContain('RATING')
    expect(items[2].text()).toContain('S-2')
  })

  it('缺失的详情字段应回落为 --', async () => {
    // 400i 详情里无「船员」字段时同样走 find 的兜底
    const { wrapper } = await mountShip('400i')
    const ship = shipDatabase['400i']

    const stripValues = wrapper.findAll('.data-strip__value').map((n) => n.text())
    const find = (key) => ship.details.find((d) => d.label.includes(key))?.value || '--'
    expect(stripValues).toEqual([find('船员'), find('长度'), find('战斗评级')])
  })

  it('应渲染全部核心参数条并绑定目标宽度', async () => {
    const { wrapper } = await mountShip('arrow')
    const ship = shipDatabase.arrow

    const bars = wrapper.findAll('.spec-bar-lg__fill')
    expect(bars).toHaveLength(ship.specs.length)
    expect(bars[0].attributes('style')).toContain(`${ship.specs[0].value}%`)
  })

  it('应渲染基本参数表与系统状态', async () => {
    const { wrapper } = await mountShip('arrow')
    const ship = shipDatabase.arrow

    expect(wrapper.findAll('.info-row')).toHaveLength(ship.details.length)
    expect(wrapper.findAll('.status-item')).toHaveLength(ship.systemStatus.length)
  })

  it('relatedShips 应排除当前舰船且最多 3 条', async () => {
    const { wrapper } = await mountShip('arrow')

    const cards = wrapper.findAll('.related-card')
    expect(cards.length).toBeGreaterThan(0)
    expect(cards.length).toBeLessThanOrEqual(3)
    const texts = cards.map((c) => c.text())
    expect(texts).not.toContain(shipDatabase.arrow.name)
    expect(texts.some((t) => t.includes(shipDatabase.arrow.name))).toBe(false)
  })

  it('relatedShips 应优先同类型，不足时用其他类型补齐', async () => {
    const { wrapper } = await mountShip('arrow')
    const current = shipDatabase.arrow

    const sameCategory = shipList.filter(
      (slug) => slug !== 'arrow' && shipDatabase[slug].category === current.category
    )
    const rendered = wrapper.findAll('.related-card__category').map((n) => n.text())

    // 同类型已满 3 条时全部为同类型；否则应有其他类型补齐
    if (sameCategory.length >= 3) {
      expect(rendered).toHaveLength(3)
      rendered.forEach((t) => expect(current.categoryEn).toContain(t.slice(0, 3)))
    } else {
      expect(rendered.length).toBe(3)
    }
  })

  it('slug 不存在时应渲染未找到状态并可返回舰队', async () => {
    const { wrapper, router } = await mountShip('no-such-ship')
    const pushSpy = vi.spyOn(router, 'push')

    expect(wrapper.find('.not-found-state').exists()).toBe(true)
    expect(wrapper.find('.ship-hero__name').exists()).toBe(false)

    await wrapper.find('.btn-back').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith({ name: 'Fleet' })
    pushSpy.mockRestore()
  })

  it('详情页返回按钮应跳转舰队列表', async () => {
    const { wrapper, router } = await mountShip('arrow')
    const pushSpy = vi.spyOn(router, 'push')

    await wrapper.find('.nav-back').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith({ name: 'Fleet' })
    pushSpy.mockRestore()
  })

  it('slug 变化时应重新加载舰船数据（支持同页切换）', async () => {
    const { wrapper, router } = await mountShip('arrow')
    expect(wrapper.find('.ship-hero__name').text()).toBe(shipDatabase.arrow.name)

    await router.push('/fleet/400i')
    await flushPromises()

    expect(wrapper.find('.ship-hero__name').text()).toBe(shipDatabase['400i'].name)
  })

  it('GSAP 初始化应为每条参数条调用 barFill 并揭示两个网格', async () => {
    const { wrapper } = await mountShip('arrow')
    const ship = shipDatabase.arrow

    await runRevealSetup()

    expect(gsapMock.api.barFill).toHaveBeenCalledTimes(ship.specs.length)
    expect(gsapMock.api.stagger).toHaveBeenCalledTimes(2)
    expect(wrapper.exists()).toBe(true)
  })

  it('未找到状态下 GSAP 初始化应提前返回，不调用动画 API', async () => {
    await mountShip('no-such-ship')

    await runRevealSetup()

    expect(gsapMock.api.barFill).not.toHaveBeenCalled()
    expect(gsapMock.api.stagger).not.toHaveBeenCalled()
  })
})
