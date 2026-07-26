/**
 * @file Vite 构建配置
 * @description 配置 Vue 3 项目的开发服务器、构建选项和路径别名
 *              支持开发/生产环境差异化配置，集成 Vue DevTools
 * @module vite.config
 * @requires @vitejs/plugin-vue
 * @requires vite-plugin-vue-devtools
 */

import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Vite 配置导出
 * @description 根据当前模式（development/production）加载对应的环境变量
 *              返回完整的构建配置对象
 * @param {Object} param - 配置参数
 * @param {string} param.mode - 当前构建模式
 * @returns {import('vite').UserConfig} Vite 配置对象
 */
export default defineConfig(({ mode }) => {
  /**
   * 加载环境变量
   * @description 从项目根目录的 .env 文件中加载环境变量
   *              空字符串前缀表示加载所有环境变量（不限于 VITE_ 前缀）
   */
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    /**
     * Vite 插件配置
     * @description vue(): 提供 Vue 单文件组件（SFC）支持
     *              vueDevTools(): 仅在非生产环境启用 Vue DevTools 调试工具
     */
    plugins: [
      vue(),
      ...(mode !== 'production' ? [vueDevTools()] : []),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'favicon.svg', 'pwa-icon.svg', 'og-cover.svg'],
        manifest: {
          name: '星际公民战队 · Star Citizen Squadron',
          short_name: 'SC Squadron',
          description: '面向星际公民玩家的专业团队门户',
          theme_color: '#0c1424',
          background_color: '#060b14',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/pwa-icon.svg',
              sizes: '192x192',
              type: 'image/svg+xml'
            },
            {
              src: '/pwa-icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml'
            },
            {
              src: '/pwa-icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ],
          categories: ['games', 'community'],
          lang: 'zh-CN',
          dir: 'ltr'
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https?:\/\/.*\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 300 },
                networkTimeoutSeconds: 5
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|webp|gif)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: { maxEntries: 100, maxAgeSeconds: 86400 * 30 }
              }
            },
            {
              urlPattern: /\.(?:woff2?|ttf|otf|eot)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'font-cache',
                expiration: { maxEntries: 20, maxAgeSeconds: 86400 * 180 }
              }
            }
          ],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//]
        }
      })
    ],

    /**
     * 路径解析配置
     * @description 配置模块导入别名，简化深层路径引用
     *              @ 指向 src 目录，避免使用相对路径 ../../../
     */
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },

    /**
     * 开发服务器配置
     * @description 配置本地开发服务器的端口、主机和代理规则
     */
    server: {
      /** 服务器端口，优先从环境变量读取，默认 3000 */
      port: parseInt(env.VITE_SERVER_PORT || '3000', 10),
      /** 服务器主机，明确绑定到 0.0.0.0 以支持 IPv4 访问 */
      host: '0.0.0.0',
      /** 启动时自动打开浏览器 */
      open: false,
      /** 启用 CORS，允许跨域请求 */
      cors: true,
      /**
       * 代理配置
       * @description 将 /api 和 /ai 开头的请求转发到后端服务
       *              解决开发环境的跨域问题
       */
      proxy: {
        '/api': {
          /** 后端 API 服务地址 */
          target: env.VITE_BACKEND_URL || 'http://localhost:3001',
          /** 修改请求头中的 origin，使其与目标服务器一致 */
          changeOrigin: true
        },
        '/ai': {
          /** AI 服务地址 */
          target: env.VITE_AI_SERVICE_URL || 'http://localhost:3002',
          changeOrigin: true
        }
      }
    },

    /**
     * 预览服务器配置
     * @description 配置生产构建预览服务器（npm run preview）
     *              与 dev server 保持一致的 proxy 配置，确保 E2E 测试
     *              能通过 /api 前缀访问后端 API
     */
    preview: {
      /** 预览端口，Playwright webServer 期望 4173 */
      port: 4173,
      /** 绑定 0.0.0.0 支持 CI 容器内访问 */
      host: '0.0.0.0',
      /** 复用 dev server 的代理规则，保证 E2E 测试环境一致 */
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

    /**
     * 生产构建配置
     * @description 优化构建输出，提升生产环境性能
     */
    build: {
      /** 目标浏览器环境，使用 ES 模块 */
      target: 'esnext',
      /** 使用 esbuild 进行代码压缩，速度更快 */
      minify: 'esbuild',
      /** 非生产环境生成 source map，便于调试 */
      sourcemap: mode !== 'production',
      /** esbuild 配置 */
      esbuild: {
        /** 生产环境移除 console 和 debugger 语句，减少代码体积 */
        drop: mode === 'production' ? ['console', 'debugger'] : []
      },
      /**
       * Rollup 打包配置
       * @description 配置代码分割策略，优化缓存和加载性能
       */
      rollupOptions: {
        /** 外部依赖：Sentry 使用动态导入，不参与主包打包 */
        external: ['@sentry/vue'],
        output: {
          /**
           * 手动代码分割
           * @description 将 Vue 核心库单独打包，利用浏览器缓存
           */
          manualChunks(id) {
            if (id.includes('node_modules/vue') || id.includes('node_modules/vue-router')) {
              return 'vendor-vue'
            }
            if (id.includes('node_modules/gsap')) {
              return 'vendor-gsap'
            }
            if (id.includes('node_modules/chart.js') || id.includes('node_modules/swiper')) {
              return 'vendor-misc'
            }
          }
        }
      }
    },

    /**
     * 依赖预构建配置
     * @description 预构建常用依赖，提升开发服务器启动速度和页面加载性能
     */
    optimizeDeps: {
      include: ['vue', 'vue-router']
    }
  }
})
