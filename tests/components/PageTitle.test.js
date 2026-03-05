/**
 * @file 组件测试
 * @description 测试 Vue 组件
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageTitle from '@/components/common/PageTitle.vue'

describe('PageTitle 组件', () => {
  it('应正确渲染标题和副标题', () => {
    const wrapper = mount(PageTitle, {
      props: {
        title: '测试标题',
        subtitle: '测试副标题'
      }
    })

    expect(wrapper.find('h1').text()).toBe('测试标题')
    expect(wrapper.find('p').text()).toBe('测试副标题')
  })

  it('副标题应为可选', () => {
    const wrapper = mount(PageTitle, {
      props: {
        title: '测试标题'
      }
    })

    expect(wrapper.find('h1').text()).toBe('测试标题')
    expect(wrapper.find('p').exists()).toBe(false)
  })
})
