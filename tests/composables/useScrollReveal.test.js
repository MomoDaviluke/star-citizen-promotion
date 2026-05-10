import { describe, it, expect } from 'vitest'

describe('useScrollReveal composable', () => {
  it('应能正确导入', async () => {
    const { useScrollReveal } = await import('@/composables/useScrollReveal.js')
    expect(useScrollReveal).toBeDefined()
    expect(typeof useScrollReveal).toBe('function')
  })
})
