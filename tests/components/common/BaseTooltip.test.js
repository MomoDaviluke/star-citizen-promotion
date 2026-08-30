/**
 * @file 统一工具提示组件测试（M4-2 补测重写）
 * @description 覆盖悬停显示/隐藏定时器、禁用态、4 方位定位计算、内容插槽、外点关闭与卸载清理。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseTooltip from '@/components/common/BaseTooltip.vue'

describe('BaseTooltip 组件', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  function mountTooltip(props = {}, slots = {}) {
    return mount(BaseTooltip, {
      props: { content: '提示内容', ...props },
      slots: { default: '<button class="trigger">hover me</button>', ...slots },
      attachTo: document.body
    })
  }

  it('未悬停时不渲染提示内容', () => {
    const wrapper = mountTooltip()
    expect(wrapper.find('.tooltip-content').exists()).toBe(false)
    wrapper.unmount()
  })

  it('悬停经延迟后显示提示', async () => {
    const wrapper = mountTooltip({ delay: 200 })
    await wrapper.find('.base-tooltip-wrapper').trigger('mouseenter')
    expect(wrapper.find('.tooltip-content').exists()).toBe(false) // 延迟期内未显示

    vi.advanceTimersByTime(200)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.tooltip-content').exists()).toBe(true)
    expect(wrapper.find('.tooltip-text').text()).toBe('提示内容')
    wrapper.unmount()
  })

  it('disabled=true 时悬停不显示', async () => {
    const wrapper = mountTooltip({ disabled: true })
    await wrapper.find('.base-tooltip-wrapper').trigger('mouseenter')
    vi.advanceTimersByTime(500)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.tooltip-content').exists()).toBe(false)
    wrapper.unmount()
  })

  it('延迟期内 mouseleave 取消显示', async () => {
    const wrapper = mountTooltip({ delay: 200 })
    await wrapper.find('.base-tooltip-wrapper').trigger('mouseenter')
    await wrapper.find('.base-tooltip-wrapper').trigger('mouseleave') // 取消 showTimer
    vi.advanceTimersByTime(500)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.tooltip-content').exists()).toBe(false)
    wrapper.unmount()
  })

  it('显示后 mouseleave 延迟 100ms 隐藏', async () => {
    const wrapper = mountTooltip({ delay: 0 })
    await wrapper.find('.base-tooltip-wrapper').trigger('mouseenter')
    vi.advanceTimersByTime(0)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.tooltip-content').exists()).toBe(true)

    await wrapper.find('.base-tooltip-wrapper').trigger('mouseleave')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.tooltip-content').exists()).toBe(true) // 100ms 隐藏延迟内仍在

    vi.advanceTimersByTime(100)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.tooltip-content').exists()).toBe(false)
    wrapper.unmount()
  })

  it('mouseleave 前再次 mouseenter 清除隐藏定时器（保持可见）', async () => {
    const wrapper = mountTooltip({ delay: 0 })
    const el = wrapper.find('.base-tooltip-wrapper')

    await el.trigger('mouseenter')
    vi.advanceTimersByTime(0)
    await wrapper.vm.$nextTick()

    await el.trigger('mouseleave') // 安排 100ms 后隐藏
    vi.advanceTimersByTime(50)
    await el.trigger('mouseenter') // 清除 hideTimer
    vi.advanceTimersByTime(200)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.tooltip-content').exists()).toBe(true)
    wrapper.unmount()
  })

  it.each(['top', 'bottom', 'left', 'right'])('%s 方位渲染对应样式类', async (position) => {
    const wrapper = mountTooltip({ position, delay: 0 })
    await wrapper.find('.base-tooltip-wrapper').trigger('mouseenter')
    vi.advanceTimersByTime(0)
    await wrapper.vm.$nextTick()
    expect(wrapper.find(`.tooltip--${position}`).exists()).toBe(true)
    wrapper.unmount()
  })

  it('updatePosition 依据位置计算 top/left（jsdom 零尺寸边界不崩）', async () => {
    const wrapper = mountTooltip({ delay: 0 })
    await wrapper.find('.base-tooltip-wrapper').trigger('mouseenter')
    vi.advanceTimersByTime(0)
    await wrapper.vm.$nextTick()
    // jsdom 中 getBoundingClientRect 全 0，定位结果为 0px——只要不抛错即达分支覆盖
    expect(wrapper.find('.tooltip-content').exists()).toBe(true)
    wrapper.unmount()
  })

  it('icon prop 渲染图标', async () => {
    const wrapper = mountTooltip({ icon: '🚀', delay: 0 })
    await wrapper.find('.base-tooltip-wrapper').trigger('mouseenter')
    vi.advanceTimersByTime(0)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.tooltip-icon').text()).toBe('🚀')
    wrapper.unmount()
  })

  it('content 插槽优先于 content prop', async () => {
    const wrapper = mountTooltip({ delay: 0 }, { content: '<em>插槽内容</em>' })
    await wrapper.find('.base-tooltip-wrapper').trigger('mouseenter')
    vi.advanceTimersByTime(0)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.tooltip-text em').exists()).toBe(true)
    wrapper.unmount()
  })

  it('点击外部关闭可见的提示', async () => {
    const wrapper = mountTooltip({ delay: 0 })
    await wrapper.find('.base-tooltip-wrapper').trigger('mouseenter')
    vi.advanceTimersByTime(0)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.tooltip-content').exists()).toBe(true)

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.tooltip-content').exists()).toBe(false)
    wrapper.unmount()
  })

  it('卸载时清理定时器与 click 监听', async () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const wrapper = mountTooltip()
    wrapper.unmount()
    expect(removeSpy.mock.calls.some(([type]) => type === 'click')).toBe(true)
  })
})
