---
name: vue-component-testing
description: "Vue 3 组件测试完整指南。覆盖 Vue Test Utils + Vitest 测试模板、Pinia Store mock 策略、Vue Router mock、WebSocket mock、异步组件测试（Suspense/lazy load）、表单交互测试、覆盖率门禁配置。用于为 Vue 3 项目编写和维护组件测试。Triggers: Vue 测试, 组件测试, Vue Test Utils, Vitest, Pinia mock, Vue Router mock, 前端测试, component test, vue testing, 写测试, 测试覆盖率. Do NOT trigger for: Playwright E2E 测试, 后端 API 测试, React/Angular 测试, 测试框架选型讨论."
default-enabled: false
---

# Vue 3 组件测试指南

Vue 3 Composition API 下的组件测试方法论和代码模板。聚焦单元测试和组件测试，不涉及 E2E。

**协作**：测试流程（TDD 红绿循环）遵循 test-driven-development 的方法论，本 skill 提供 Vue 生态的具体实现模式。

---

## 一、Vitest 配置

```javascript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom', globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8', reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{js,ts,vue}'],
      thresholds: { lines: 70, branches: 60, functions: 70, statements: 70 },
    },
  },
})
```

---

## 二、基础组件测试模板

```javascript
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import BaseButton from '../BaseButton.vue'

describe('BaseButton', () => {
  it('renders slot content', () => {
    const wrapper = mount(BaseButton, { slots: { default: '点击' } })
    expect(wrapper.text()).toContain('点击')
  })
  it('applies variant class', () => {
    const wrapper = mount(BaseButton, { props: { variant: 'primary' } })
    expect(wrapper.classes()).toContain('base-button--primary')
  })
  it('emits click event', async () => {
    const wrapper = mount(BaseButton)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
  it('does not emit when disabled', async () => {
    const wrapper = mount(BaseButton, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })
})
```

---

## 三、Pinia Store Mock

### 模式1：直接设置初始状态
```javascript
import { setActivePinia, createPinia } from 'pinia'
beforeEach(() => { setActivePinia(createPinia()) })
// 测试中：store.isAuthenticated = false
```

### 模式2：Mock Store 方法
```javascript
vi.mock('@/stores/fleet', () => ({
  useFleetStore: vi.fn(() => ({
    ships: ref([...]), loading: ref(false), fetchShips: vi.fn(),
    filteredShips: computed(() => [...]),
  })),
}))
```

### 模式3：测试用 Store 工厂
创建 createMockAuthStore(overrides) 返回带 vi.fn() 的默认 store 对象。

---

## 四、Vue Router Mock

```javascript
import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/admin', meta: { requiresAuth: true } },
    { path: '/login' },
  ],
})
router.push('/admin')
await router.isReady()
expect(router.currentRoute.value.path).toBe('/login')
```

或者直接用 vi.mock('vue-router') mock useRouter/useRoute。

---

## 五、WebSocket Mock

```javascript
class MockWebSocket {
  onopen = null; onmessage = null; onclose = null; onerror = null
  readyState = WebSocket.CONNECTING
  constructor(url) {
    this.url = url
    setTimeout(() => { this.readyState = WebSocket.OPEN; this.onopen?.() }, 0)
  }
  send = vi.fn()
  close = vi.fn()
  simulateMessage(data) { this.onmessage?.({ data: JSON.stringify(data) }) }
  simulateClose(code = 1000) { this.readyState = WebSocket.CLOSED; this.onclose?.({ code }) }
}
global.WebSocket = MockWebSocket
```

---

## 六、表单交互测试

```javascript
it('submits form with correct data', async () => {
  const loginMock = vi.fn().mockResolvedValue({ success: true })
  const wrapper = mount(LoginPage)
  await wrapper.find('input[type="email"]').setValue('test@example.com')
  await wrapper.find('input[type="password"]').setValue('password123')
  await wrapper.find('form').trigger('submit.prevent')
  expect(loginMock).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' })
})
```

---

## 七、异步组件测试

```javascript
import { mount, flushPromises } from '@vue/test-utils'

const wrapper = mount(FleetList)
expect(wrapper.find('[data-test="loading"]').exists()).toBe(true)
await flushPromises()
expect(wrapper.find('[data-test="loading"]').exists()).toBe(false)
```

---

## 八、覆盖率策略

```
         /\
        /E2E\        少量：核心流程（Playwright）
       /------\
      /  集成  \      适量：Store+服务+组件联动
     /----------\
    /   单元测试  \    大量：组件逻辑、工具函数、Store
   /--------------\
```

| 层级 | 目标 |
|:---|:---|
| 工具函数/composables | 90%+ |
| Pinia Stores | 85%+ |
| 通用组件 | 80%+ |
| 业务组件 | 70%+ |
| 视图页面 | 60%+ |

不需要测试：纯样式组件、第三方库薄封装、配置文件。

---

## 检查清单
- [ ] Vitest 配置完成，coverage thresholds 已设置
- [ ] 通用组件有基础测试（渲染、props、事件、插槽）
- [ ] Pinia Store 有 mock 策略
- [ ] 异步组件测试用 flushPromises
- [ ] 表单测试覆盖正常提交、空字段校验、失败提示
- [ ] WebSocket 有 MockWebSocket 测试
- [ ] 使用 data-test 选择器隔离测试和样式
- [ ] CI 中有 coverage 门禁