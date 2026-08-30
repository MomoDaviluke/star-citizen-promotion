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
      // M4 第二批门禁上调：55 → 60（2026-08-30，实测 Lines 68.12 / Stmts 66.96 / Branch 66.73 / Funcs 63.38）→ 65 → 70
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60
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
