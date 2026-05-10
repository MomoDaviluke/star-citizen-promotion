import { describe, it, expect } from 'vitest'

describe('useWebSocket composable', () => {
  it('应能正确导入', async () => {
    const { useWebSocket } = await import('@/composables/useWebSocket.js')
    expect(useWebSocket).toBeDefined()
    expect(typeof useWebSocket).toBe('function')
  })
})
