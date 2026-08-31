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
      // M4 第三批门禁上调：60 → 65（2026-08-31，实测 Lines 70.41 / Stmts 69.35 / Branch 69.55 / Funcs 68.00）→ 70
      // 本批补测来源：AdminLayout.vue（15 函数 0% → 全覆盖）+ ShipDetail.vue（22 函数 0% → 全覆盖）
      thresholds: {
        lines: 65,
        functions: 65,
        branches: 65,
        statements: 65
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
