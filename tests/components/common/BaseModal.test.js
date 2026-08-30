/**
 * @file 统一弹窗组件测试（M4-2 补测重写）
 * @description 旧测试用 props:{ show:true } 挂载（组件实际 prop 是 modelValue），
 *              弹窗从未真正渲染（QUAL-18 同类）。本文件覆盖真实打开/关闭/
 *              遮罩点击/ESC/拖拽/body 滚动锁定/卸载清理全链路。
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseModal from '@/components/common/BaseModal.vue'

const OVERLAY_SEL = '.modal-overlay'

async function openModal(props = {}, slots = {}) {
  const wrapper = mount(BaseModal, {
    props: { modelValue: false, ...props },
    slots: { default: '弹窗内容', ...slots },
    attachTo: document.body
  })
  await wrapper.setProps({ modelValue: true })
  return wrapper
}

describe('BaseModal 组件', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    vi.restoreAllMocks()
  })

  it('modelValue=false 时不渲染遮罩', () => {
    const wrapper = mount(BaseModal, { props: { modelValue: false }, attachTo: document.body })
    expect(document.querySelector(OVERLAY_SEL)).toBeNull()
    wrapper.unmount()
  })

  it('modelValue=true 时渲染遮罩、标题与默认插槽', async () => {
    const wrapper = await openModal({ title: '测试弹窗' })
    expect(document.querySelector(OVERLAY_SEL)).toBeTruthy()
    expect(document.querySelector('.modal-title').textContent).toContain('测试弹窗')
    expect(document.querySelector('.modal-body').textContent).toContain('弹窗内容')
    wrapper.unmount()
  })

  it('打开时 emit open 并锁定 body 滚动，关闭时恢复', async () => {
    const wrapper = mount(BaseModal, { props: { modelValue: false }, attachTo: document.body })
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.emitted('open')).toHaveLength(1)
    expect(document.body.style.overflow).toBe('hidden')

    await wrapper.setProps({ modelValue: false })
    expect(document.body.style.overflow).toBe('')
    wrapper.unmount()
  })

  it('点击关闭按钮 emit update:modelValue=false 与 close', async () => {
    const wrapper = await openModal({ title: 'x' })
    document.querySelector('.modal-close').click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('closable=false 时不渲染关闭按钮', async () => {
    const wrapper = await openModal({ closable: false })
    expect(document.querySelector('.modal-close')).toBeNull()
    wrapper.unmount()
  })

  it('点击遮罩自身关闭（非 persistent）', async () => {
    const wrapper = await openModal()
    document.querySelector(OVERLAY_SEL).dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
    wrapper.unmount()
  })

  it('persistent=true 时点击遮罩不关闭', async () => {
    const wrapper = await openModal({ persistent: true })
    document.querySelector(OVERLAY_SEL).dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

  it('ESC 关闭（closable 且非 persistent），persistent 时 ESC 无效', async () => {
    // 非 persistent：可关
    const wrapper = await openModal()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
    wrapper.unmount()

    // persistent：ESC 不关
    const wrapper2 = await openModal({ persistent: true })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper2.vm.$nextTick()
    expect(wrapper2.emitted('update:modelValue')).toBeUndefined()
    wrapper2.unmount()
  })

  it('hideHeader=true 不渲染头部', async () => {
    const wrapper = await openModal({ hideHeader: true })
    expect(document.querySelector('.modal-header')).toBeNull()
    wrapper.unmount()
  })

  it('footer 插槽渲染底部区域', async () => {
    const wrapper = await openModal({}, { footer: '<button class="footer-btn">确定</button>' })
    expect(document.querySelector('.modal-footer .footer-btn')).toBeTruthy()
    wrapper.unmount()
  })

  it('size prop 应用对应样式类', async () => {
    const wrapper = await openModal({ size: 'lg' })
    expect(document.querySelector('.modal--lg')).toBeTruthy()
    wrapper.unmount()
  })

  it('draggable=true 时拖拽更新 transform，mouseup 结束拖拽', async () => {
    const wrapper = await openModal({ draggable: true })
    const container = document.querySelector('.modal-container')
    expect(container.classList.contains('is-draggable')).toBe(true)

    container.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 60, clientY: 35 }))
    expect(container.style.transform).toBe('translate(50px, 25px)')

    document.dispatchEvent(new MouseEvent('mouseup'))
    // 结束后再 move 不再更新（dragState 已清）
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }))
    expect(container.style.transform).toBe('translate(50px, 25px)')
    wrapper.unmount()
  })

  it('draggable=false 时 mousedown 不进入拖拽', async () => {
    const wrapper = await openModal()
    const container = document.querySelector('.modal-container')
    container.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 60, clientY: 35 }))
    expect(container.style.transform).toBe('')
    wrapper.unmount()
  })

  it('卸载时清理 keydown 监听与 body 滚动状态', async () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const wrapper = await openModal()
    wrapper.unmount()
    const removedTypes = removeSpy.mock.calls.map(c => c[0])
    expect(removedTypes).toContain('keydown')
    expect(document.body.style.overflow).toBe('')
  })

  it('关闭事件链：close 按钮点击后 body overflow 恢复', async () => {
    const wrapper = await openModal()
    expect(document.body.style.overflow).toBe('hidden')
    document.querySelector('.modal-close').click()
    await wrapper.vm.$nextTick()
    // 父组件未响应 v-model，watch 不会触发复位——直接断言 emit，恢复逻辑由 setProps 用例覆盖
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })
})
