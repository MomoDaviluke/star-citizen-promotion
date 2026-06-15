import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    pool: 'threads',
    fileParallelism: false,
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'tests/', 'src/main.js', 'server/', '.reasonix/', '.codegraph/', 'dist/', 'coverage/', 'e2e/', 'patches/', 'playwright-report/', 'test-results/'],
      thresholds: {
        lines: 8,
        functions: 8,
        branches: 8,
        statements: 8
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'virtual:pwa-register/vue': fileURLToPath(new URL('./tests/__mocks__/pwa-register.js', import.meta.url))
    }
  }
})
