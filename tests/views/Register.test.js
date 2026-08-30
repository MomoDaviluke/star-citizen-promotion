/**
 * @file 注册视图测试（M4-II 补测重写）
 * @description 覆盖 handleRegister 全分支：4 项字段校验短路、成功注册跳转、失败显示错误、
 *              提交态按钮禁用与文案切换、无障碍属性（aria-invalid/form-error）。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'

const pushMock = vi.fn()
const testRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/register', name: 'register', component: { template: '<div>Register</div>' } }
  ]
})
testRouter.push = pushMock

// 共享单例 mock：组件 setup 内 useAuthStore() 与测试断言必须拿到同一实例
// （工厂式 mock 每次调用返回新对象，导致断言落在另一个实例上，调用数恒 0）
const registerMock = vi.hoisted(() => vi.fn())

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    register: registerMock
  })
}))

import Register from '@/views/Register.vue'

async function fillForm(values) {
  const wrapper = mount(Register, {
    global: {
      plugins: [testRouter],
      stubs: { RouterLink: { template: '<a><slot /></a>' } }
    }
  })
  if (values.username !== undefined) await wrapper.find('#username').setValue(values.username)
  if (values.email !== undefined) await wrapper.find('#email').setValue(values.email)
  if (values.password !== undefined) await wrapper.find('#password').setValue(values.password)
  if (values.confirmPassword !== undefined) await wrapper.find('#confirmPassword').setValue(values.confirmPassword)
  return wrapper
}

describe('Register 视图', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('渲染注册表单四字段与登录链接', () => {
    const wrapper = mount(Register, {
      global: { plugins: [testRouter], stubs: { RouterLink: true } }
    })
    expect(wrapper.find('#username').exists()).toBe(true)
    expect(wrapper.find('#email').exists()).toBe(true)
    expect(wrapper.find('#password').exists()).toBe(true)
    expect(wrapper.find('#confirmPassword').exists()).toBe(true)
    expect(wrapper.text()).toContain('已有账户')
  })

  it('空用户名短路校验并提示', async () => {
    const wrapper = await fillForm({ username: '   ', email: 'a@b.c', password: '12345678', confirmPassword: '12345678' })
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.find('#username-error').text()).toBe('请输入用户名')
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('空邮箱短路校验并提示', async () => {
    const wrapper = await fillForm({ username: 'pilot', email: '', password: '12345678', confirmPassword: '12345678' })
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.find('#email-error').text()).toBe('请输入邮箱')
  })

  it('空密码短路校验并提示', async () => {
    const wrapper = await fillForm({ username: 'pilot', email: 'a@b.c', password: '', confirmPassword: '' })
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.find('#password-error').text()).toBe('请输入密码')
  })

  it('两次密码不一致提示且不提交', async () => {
    const wrapper = await fillForm({ username: 'pilot', email: 'a@b.c', password: '12345678', confirmPassword: '87654321' })
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.find('#confirmPassword-error').text()).toBe('两次输入的密码不一致')
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('注册成功后跳转首页', async () => {
    const wrapper = await fillForm({ username: 'pilot', email: 'a@b.c', password: '12345678', confirmPassword: '12345678' })
    registerMock.mockResolvedValueOnce({ success: true })

    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(registerMock).toHaveBeenCalledWith({
      username: 'pilot', email: 'a@b.c', password: '12345678'
    })
    expect(pushMock).toHaveBeenCalledWith('/')
  })

  it('注册失败时显示后端错误信息且不跳转', async () => {
    const wrapper = await fillForm({ username: 'pilot', email: 'taken@b.c', password: '12345678', confirmPassword: '12345678' })
    registerMock.mockRejectedValueOnce(new Error('用户名已被占用'))

    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.form-message--error').text()).toBe('用户名已被占用')
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('提交期间按钮禁用并显示"注册中"', async () => {
    const wrapper = await fillForm({ username: 'pilot', email: 'a@b.c', password: '12345678', confirmPassword: '12345678' })
    let resolveRegister
    registerMock.mockReturnValueOnce(new Promise(r => { resolveRegister = r }))

    await wrapper.find('form').trigger('submit.prevent')
    const submitBtn = wrapper.find('button[type="submit"]')
    // 提交中：isSubmitting=true
    expect(submitBtn.attributes('disabled')).toBeDefined()
    expect(submitBtn.text()).toBe('注册中...')

    resolveRegister({ success: true })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button[type="submit"]').text()).toBe('注册')
  })

  it('校验失败字段带 aria-invalid 与 role=alert', async () => {
    const wrapper = await fillForm({ username: '', email: 'a@b.c', password: '12345678', confirmPassword: '12345678' })
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.find('#username').attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('#username-error').attributes('role')).toBe('alert')
  })
})
