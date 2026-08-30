/**
 * @file ProfilePanel 组件测试
 * @description 覆盖画像面板空状态、各字段渲染、标签映射与激活态
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProfilePanel from '@/components/ai/ProfilePanel.vue'

const emptyProfile = () => ({ playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' })

describe('ProfilePanel 组件', () => {
  it('空画像时显示等待文案且无激活态', () => {
    const wrapper = mount(ProfilePanel, { props: { profile: emptyProfile() } })
    expect(wrapper.find('.profile-panel').classes()).not.toContain('profile-panel--active')
    expect(wrapper.text()).toContain('等待对话数据...')
  })

  it('有画像数据时激活面板', () => {
    const wrapper = mount(ProfilePanel, {
      props: { profile: { ...emptyProfile(), timeCommit: '每晚' } },
    })
    expect(wrapper.find('.profile-panel').classes()).toContain('profile-panel--active')
    expect(wrapper.text()).not.toContain('等待对话数据...')
  })

  it('渲染玩法偏好标签并映射中文', () => {
    const profile = { ...emptyProfile(), playStyle: ['pvp', 'exploration'] }
    const wrapper = mount(ProfilePanel, { props: { profile } })
    const tags = wrapper.findAll('.profile-tag')
    const texts = tags.map((t) => t.text())
    expect(texts).toContain('PVP 战斗')
    expect(texts).toContain('探索')
  })

  it('未知名玩法偏好原样展示', () => {
    const wrapper = mount(ProfilePanel, {
      props: { profile: { ...emptyProfile(), playStyle: ['stealth'] } },
    })
    expect(wrapper.find('.profile-tag').text()).toBe('stealth')
  })

  it('渲染时间投入与技能等级映射', () => {
    const profile = { ...emptyProfile(), timeCommit: '每晚 2 小时', skillLevel: 'veteran' }
    const wrapper = mount(ProfilePanel, { props: { profile } })
    expect(wrapper.text()).toContain('每晚 2 小时')
    expect(wrapper.text()).toContain('老手')
  })

  it('未知技能等级原样展示', () => {
    const wrapper = mount(ProfilePanel, {
      props: { profile: { ...emptyProfile(), skillLevel: 'unknown-tier' } },
    })
    expect(wrapper.text()).toContain('unknown-tier')
  })

  it('渲染舰船偏好标签', () => {
    const profile = { ...emptyProfile(), shipPref: ['Anvil Arrow', 'Origin 400i'] }
    const wrapper = mount(ProfilePanel, { props: { profile } })
    const texts = wrapper.findAll('.profile-tag').map((t) => t.text())
    expect(texts).toEqual(['Anvil Arrow', 'Origin 400i'])
  })

  it('画像为空数组时视为无数据', () => {
    const wrapper = mount(ProfilePanel, {
      props: { profile: { ...emptyProfile(), playStyle: [], shipPref: [] } },
    })
    expect(wrapper.find('.profile-panel').classes()).not.toContain('profile-panel--active')
  })
})