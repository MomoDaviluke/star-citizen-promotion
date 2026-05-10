import { describe, it, expect } from 'vitest'

describe('useSoundEffect composable', () => {
  it('应能正确导入', async () => {
    const { useSoundEffect } = await import('@/composables/useSoundEffect.js')
    expect(useSoundEffect).toBeDefined()
    expect(typeof useSoundEffect).toBe('function')
  })
})
