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
      // M4-3 门禁逐步上调：49 → 55（2026-08-30，实测 Lines 63.01 / Stmts 62.03 / Branch 58.33 / Funcs 56.33）→ 60 → 65 → 70
      thresholds: {
        lines: 55,
        functions: 55,
        branches: 55,
        statements: 55
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
