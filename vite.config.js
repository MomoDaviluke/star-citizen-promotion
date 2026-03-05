import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), vueDevTools()],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },

    server: {
      port: parseInt(env.VITE_SERVER_PORT || '3000', 10),
      host: env.VITE_SERVER_HOST || 'localhost',
      open: true,
      cors: true,
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:3001',
          changeOrigin: true
        },
        '/ai': {
          target: env.VITE_AI_SERVICE_URL || 'http://localhost:3002',
          changeOrigin: true
        }
      }
    },

    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router']
          }
        }
      }
    },

    optimizeDeps: {
      include: ['vue', 'vue-router']
    }
  }
})
