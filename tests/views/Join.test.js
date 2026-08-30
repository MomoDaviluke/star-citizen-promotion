/**
 * @file 申请视图测试（M4-II 补测重写）
 * @description 覆盖招募申请核心转化流：表单校验（姓名/邮箱/Discord 格式）、成功面板与
 *              表单重置、失败消息与埋点、AI 画像预填（query.ai_profile）、成功态字段样式。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

const pushMock = vi.fn()
const testRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/join', name: 'join', component: { template: '<div>Join</div>' } }
  ]
})

// 可编程 route.query（AI 画像预填用）
const routeQuery = { query: {} }
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useRoute: () => ({ ...testRouter.currentRoute.value, query: routeQuery.query })
  }
})

vi.mock('@/services/dataService', () => ({
  dataService: { submitApplication: vi.fn() }
}))

vi.mock('@/services/analyticsService', () => ({
  trackEvent: vi.fn()
}))

import { dataService } from '@/services/dataService'
import { trackEvent } from '@/services/analyticsService'
import Join from '@/views/Join.vue'

async function mountJoin() {
  const wrapper = mount(Join, {
    global: {
      plugins: [testRouter],
      stubs: { RouterLink: true, Teleport: true }
    }
  })
  await wrapper.vm.$nextTick()
  return wrapper
}

async function fillValidForm(wrapper, overrides = {}) {
  const v = { name: 'NimiSora', email: 'nimi@example.com', discord: '', experience: '', reason: '', ...overrides }
  await wrapper.find('#join-name').setValue(v.name)
  await wrapper.find('#join-email').setValue(v.email)
  if (v.discord) await wrapper.find('#join-discord').setValue(v.discord)
  if (v.experience) await wrapper.find('#join-experience').setValue(v.experience)
  if (v.reason) await wrapper.find('#join-reason').setValue(v.reason)
  return wrapper
}

describe('Join 视图', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeQuery.query = {}
  })

  it('渲染申请表单、加入要求与流程步骤', async () => {
    const wrapper = await mountJoin()
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.text()).toContain('年满 16 周岁')
    expect(wrapper.text()).toContain('指挥官审核（1-3 天）')
  })

  describe('表单校验', () => {
    it('空姓名提交显示"请输入姓名"', async () => {
      const wrapper = await mountJoin()
      await wrapper.find('#join-email').setValue('a@b.c')
      await wrapper.find('form').trigger('submit.prevent')
      expect(wrapper.find('#join-name-error').text()).toBe('请输入姓名')
      expect(dataService.submitApplication).not.toHaveBeenCalled()
    })

    it('无效邮箱提交显示格式错误', async () => {
      const wrapper = await mountJoin()
      await wrapper.find('#join-name').setValue('Nimi')
      await wrapper.find('#join-email').setValue('not-an-email')
      await wrapper.find('form').trigger('submit.prevent')
      expect(wrapper.find('#join-email-error').text()).toBe('请输入有效的邮箱地址')
      expect(dataService.submitApplication).not.toHaveBeenCalled()
    })

    it('Discord 格式错误提示（非空且不符合 用户名#0000）', async () => {
      const wrapper = await mountJoin()
      await wrapper.find('#join-name').setValue('Nimi')
      await wrapper.find('#join-email').setValue('a@b.c')
      await wrapper.find('#join-discord').setValue('bad discord ###')
      await wrapper.find('form').trigger('submit.prevent')
      expect(wrapper.find('#join-discord-error').text()).toBe('Discord 格式不正确')
    })

    it('合法 Discord 格式（用户名#1234）通过校验', async () => {
      const wrapper = await fillValidForm(await mountJoin(), { discord: 'Nimi#1234' })
      dataService.submitApplication.mockResolvedValueOnce({ success: true })
      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
      expect(dataService.submitApplication).toHaveBeenCalled()
    })

    it('blur 后合法字段显示 form-input--valid 成功态样式', async () => {
      const wrapper = await mountJoin()
      const nameInput = wrapper.find('#join-name')
      await nameInput.setValue('Nimi')
      await nameInput.trigger('blur')
      expect(nameInput.classes()).toContain('form-input--valid')
    })
  })

  describe('提交流程', () => {
    it('提交成功显示成功面板、埋点并清空表单', async () => {
      const wrapper = await fillValidForm(await mountJoin())
      dataService.submitApplication.mockResolvedValueOnce({ success: true })

      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.success-panel').exists()).toBe(true)
      expect(wrapper.find('.success-panel__title').text()).toBe('申请已提交')
      expect(trackEvent).toHaveBeenCalledWith('application_submit_success', expect.anything())
      // 表单已清空
      expect(wrapper.find('#join-name').element.value).toBe('')
    })

    it('提交失败显示错误消息与失败埋点', async () => {
      const wrapper = await fillValidForm(await mountJoin())
      dataService.submitApplication.mockRejectedValueOnce(new Error('邮箱已被申请'))

      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.form-message--error').text()).toBe('邮箱已被申请')
      expect(trackEvent).toHaveBeenCalledWith('application_submit_fail', { reason: '邮箱已被申请' })
      expect(wrapper.find('.success-panel').exists()).toBe(false)
    })

    it('成功面板"重新填写"按钮重置表单与状态', async () => {
      const wrapper = await fillValidForm(await mountJoin())
      dataService.submitApplication.mockResolvedValueOnce({ success: true })
      await wrapper.find('form').trigger('submit.prevent')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      await wrapper.find('.success-panel__btn-secondary').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.success-panel').exists()).toBe(false)
      expect(wrapper.find('form').exists()).toBe(true)
    })

    it('提交期间按钮禁用并显示"提交中..."', async () => {
      const wrapper = await fillValidForm(await mountJoin())
      let resolveSubmit
      dataService.submitApplication.mockReturnValueOnce(new Promise(r => { resolveSubmit = r }))

      await wrapper.find('form').trigger('submit.prevent')
      const btn = wrapper.find('button[type="submit"]')
      expect(btn.attributes('disabled')).toBeDefined()
      expect(btn.text()).toBe('提交中...')

      resolveSubmit({ success: true })
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
    })
  })

  describe('AI 画像预填（query.ai_profile）', () => {
    it('合法画像 JSON 预填 experience 并触发埋点', async () => {
      const profile = { skillLevel: 'beginner', playStyle: ['pvp', 'exploration'], timeCommit: '8h/week', shipPref: ['Gladius'] }
      routeQuery.query = { ai_profile: encodeURIComponent(JSON.stringify(profile)) }
      const wrapper = await mountJoin()

      const exp = wrapper.find('#join-experience').element.value
      expect(exp).toContain('[AI 招募官画像]')
      expect(exp).toContain('技能等级:新手')
      expect(exp).toContain('玩法偏好:PVP 战斗、探索')
      expect(exp).toContain('时间投入:8h/week')
      expect(exp).toContain('拥有舰船:Gladius')
      expect(trackEvent).toHaveBeenCalledWith('recruiter_profile_prefill', { fields: 4 })
    })

    it('未知画像值回退为原始值（skillLabels 缺失项）', async () => {
      routeQuery.query = { ai_profile: encodeURIComponent(JSON.stringify({ skillLevel: 'ace-pilot' })) }
      const wrapper = await mountJoin()
      expect(wrapper.find('#join-experience').element.value).toContain('技能等级:ace-pilot')
    })

    it('空画像（无实质字段）不预填不埋点', async () => {
      routeQuery.query = { ai_profile: encodeURIComponent(JSON.stringify({})) }
      await mountJoin()
      expect(trackEvent).not.toHaveBeenCalledWith('recruiter_profile_prefill', expect.anything())
    })

    it('非法 JSON 静默忽略不崩溃', async () => {
      routeQuery.query = { ai_profile: '%7Bbroken%7D' }
      const wrapper = await mountJoin()
      expect(wrapper.find('#join-experience').element.value).toBe('')
      expect(trackEvent).not.toHaveBeenCalledWith('recruiter_profile_prefill', expect.anything())
    })

    it('进入申请页埋点 application_form_start', async () => {
      const wrapper = await mountJoin()
      // onMounted 末尾无条件触发（表单起点埋点）
      expect(wrapper.find('form').exists()).toBe(true)
      expect(trackEvent).toHaveBeenCalledWith('application_form_start')
    })
  })
})
