/**
 * @file 个人中心视图测试（M4-II 补测重写）
 * @description 覆盖资料加载（authStore → 表单回填）、资料更新、密码修改（一致/不一致分支、
 *              成功后表单清空）、登出跳转。
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
    { path: '/profile', name: 'profile', component: { template: '<div>Profile</div>' } }
  ]
})
testRouter.push = pushMock

const authMock = vi.hoisted(() => ({
  user: { id: 'u1', username: 'nimi', email: 'nimi@example.com', avatar: 'https://a.png' }
}))

const authServiceMock = vi.hoisted(() => ({
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  logout: vi.fn()
}))

// Profile.vue 从聚合入口 '@/services' 导入 authService
vi.mock('@/services', () => ({
  authService: authServiceMock
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    get user() { return authMock.user }
  })
}))

import Profile from '@/views/Profile.vue'

async function mountProfile() {
  const wrapper = mount(Profile, {
    global: {
      plugins: [testRouter],
      stubs: { RouterLink: true }
    }
  })
  await wrapper.vm.$nextTick()
  await wrapper.vm.$nextTick()
  return wrapper
}

describe('Profile 视图', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    authMock.user = { id: 'u1', username: 'nimi', email: 'nimi@example.com', avatar: 'https://a.png' }
    // jsdom 无原生 location.href 赋值行为
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'http://localhost/' }
    })
  })

  it('挂载时从 authStore 回填资料表单', async () => {
    const wrapper = await mountProfile()
    expect(wrapper.vm.profile.username).toBe('nimi')
    expect(wrapper.vm.profile.email).toBe('nimi@example.com')
    expect(wrapper.vm.profile.avatar).toBe('https://a.png')
  })

  it('authStore 无用户时表单保持空值不崩溃', async () => {
    authMock.user = null
    const wrapper = await mountProfile()
    expect(wrapper.vm.profile.username).toBe('')
  })

  it('updateProfile 提交用户名与头像', async () => {
    const wrapper = await mountProfile()
    wrapper.vm.profile.username = 'nimi-2'
    wrapper.vm.profile.avatar = 'https://b.png'
    authServiceMock.updateProfile.mockResolvedValueOnce({})

    await wrapper.find('form.profile-form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(authServiceMock.updateProfile).toHaveBeenCalledWith({
      username: 'nimi-2',
      avatar: 'https://b.png'
    })
    expect(wrapper.vm.isUpdating).toBe(false)
  })

  it('updateProfile 失败仅记日志不抛出', async () => {
    const wrapper = await mountProfile()
    authServiceMock.updateProfile.mockRejectedValueOnce(new Error('x'))
    await expect(wrapper.find('form.profile-form').trigger('submit.prevent')).resolves.toBeUndefined()
    expect(wrapper.vm.isUpdating).toBe(false)
  })

  it('changePassword 两次输入不一致时提示且不提交', async () => {
    const wrapper = await mountProfile()
    // passwordForm 是 reactive：整体赋值无效，必须逐字段写（setup 绑定单向）
    wrapper.vm.passwordForm.currentPassword = 'old'
    wrapper.vm.passwordForm.newPassword = 'abc12345'
    wrapper.vm.passwordForm.confirmPassword = 'abc99999'

    await wrapper.find('form.security-form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.passwordError).toBe('两次输入的密码不一致')
    expect(authServiceMock.changePassword).not.toHaveBeenCalled()
  })

  it('changePassword 成功后清空三字段', async () => {
    const wrapper = await mountProfile()
    wrapper.vm.passwordForm.currentPassword = 'old'
    wrapper.vm.passwordForm.newPassword = 'abc12345'
    wrapper.vm.passwordForm.confirmPassword = 'abc12345'
    authServiceMock.changePassword.mockResolvedValueOnce({})

    await wrapper.find('form.security-form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(authServiceMock.changePassword).toHaveBeenCalledWith({
      currentPassword: 'old',
      newPassword: 'abc12345'
    })
    expect(wrapper.vm.passwordForm).toEqual({ currentPassword: '', newPassword: '', confirmPassword: '' })
    expect(wrapper.vm.passwordError).toBe('')
    expect(wrapper.vm.isChangingPassword).toBe(false)
  })

  it('changePassword 失败不抛出且表单不清空', async () => {
    const wrapper = await mountProfile()
    wrapper.vm.passwordForm.currentPassword = 'old'
    wrapper.vm.passwordForm.newPassword = 'abc12345'
    wrapper.vm.passwordForm.confirmPassword = 'abc12345'
    authServiceMock.changePassword.mockRejectedValueOnce(new Error('当前密码错误'))

    await wrapper.find('form.security-form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.passwordForm.currentPassword).toBe('old') // 未清空
    expect(wrapper.vm.isChangingPassword).toBe(false)
  })

  it('handleLogout 调用登出并跳转首页', async () => {
    const wrapper = await mountProfile()
    wrapper.vm.handleLogout()
    expect(authServiceMock.logout).toHaveBeenCalledTimes(1)
    expect(window.location.href).toBe('/')
  })
})
