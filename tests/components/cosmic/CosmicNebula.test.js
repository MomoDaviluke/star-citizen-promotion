import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CosmicNebula from '../../../src/components/cosmic/CosmicNebula.vue'

describe('CosmicNebula', () => {
  function createMockContext() {
    return {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      scale: vi.fn(),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      })),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn()
    }
  }

  beforeEach(() => {
    const mockCtx = createMockContext()
    HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
      if (type === '2d') return mockCtx
      return null
    })
    // 只允许 requestAnimationFrame 执行一次，避免 draw 递归导致栈溢出
    let rafCalls = 0
    window.requestAnimationFrame = vi.fn((cb) => {
      if (rafCalls < 1) {
        rafCalls++
        cb(0)
      }
      return 0
    })
  })

  it('renders a canvas element', () => {
    const wrapper = mount(CosmicNebula)
    expect(wrapper.find('canvas').exists()).toBe(true)
  })

  it('draws nebula layers on mount', () => {
    const mockCtx = createMockContext()
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx)
    mount(CosmicNebula)
    expect(mockCtx.fillRect).toHaveBeenCalled()
  })
})
