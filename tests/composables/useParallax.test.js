import { describe, it, expect } from 'vitest'

describe('useParallax composable', () => {
  it('应能正确导入', async () => {
    const { useParallax } = await import('@/composables/useParallax.js')
    expect(useParallax).toBeDefined()
    expect(typeof useParallax).toBe('function')
  })
})
