import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Workaround for vite 8 + Windows: public asset paths like /images/sc/... get resolved
// to invalid file:/// URLs without drive letters. This plugin rewrites them.
const publicAssetPlugin = () => ({
  name: 'public-asset-fix',
  enforce: 'pre',
  resolveId(id) {
    if (id.startsWith('/images/') || id.startsWith('/favicon') || id.startsWith('/pwa-')) {
      return { id: 'C:/' + id.slice(1), external: false }
    }
  }
})

export default defineConfig({
  plugins: [vue(), publicAssetPlugin()],
  test: {
    environment: 'jsdom',
    publicDir: 'public',
    globals: true,
    pool: 'threads',
    fileParallelism: false,
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['tests/setup.js'],
    server: {
      deps: {
        inline: ['vite-plugin-pwa']
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'tests/', 'src/main.js', 'server/', '.reasonix/', '.codegraph/', 'dist/', 'coverage/', 'e2e/', 'patches/', 'playwright-report/', 'test-results/'],
      // 门槛基于 2026-08-24 实测总覆盖率（Lines 51.05 / Stmts 50.27 / Branch 43.25 / Funcs 43.36）
      // 设远高于原 8%，形成有约束力的快速失败门禁；后续随覆盖率提升逐步上调
      thresholds: {
        lines: 49,
        functions: 42,
        branches: 42,
        statements: 47
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
