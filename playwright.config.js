import { defineConfig, devices } from '@playwright/test'
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * 本地缓存 Chromium 回退（FE-03）
 * @description playwright 1.58 的 chromium 下载走新版 Chrome-for-Testing CDN，
 *              npmmirror 镜像未同步会 404。本地开发时回退到 %LOCALAPPDATA%/ms-playwright
 *              中任意已缓存的 chromium chrome.exe 或 chromium_headless_shell 可执行文件；
 *              CI 环境正常 install 不受影响。
 * @returns {string|null} 缓存浏览器可执行路径，未找到返回 null
 */
function findCachedChromium() {
  // 仅 GitHub Actions 视为 CI：本机环境可能注入 CI=true（如 IDE/agent），
  // 若按 CI 短路会把本地缓存回退一并禁用，导致裸跑 E2E 挂掉（FE-03 回归）
  if (process.env.CI && process.env.GITHUB_ACTIONS) return null
  const cacheDirs = [
    resolve(process.env.LOCALAPPDATA || '', 'ms-playwright'),
    resolve(process.env.USERPROFILE || '', 'AppData', 'Local', 'ms-playwright'),
  ]
  for (const dir of cacheDirs) {
    if (!existsSync(dir)) continue
    for (const entry of readdirSync(dir)) {
      // 完整 Chromium
      if (/^chromium-\d+$/.test(entry)) {
        for (const sub of ['chrome-win64', 'chrome-win']) {
          const p = join(dir, entry, sub, 'chrome.exe')
          if (existsSync(p)) return p
        }
      }
      // headless shell（playwright 期望的版本号可能与本地缓存漂移，用任意可用版本兜底）
      if (/^chromium_headless_shell-\d+$/.test(entry)) {
        const p = join(dir, entry, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe')
        if (existsSync(p)) return p
      }
    }
  }
  if (process.env.PW_DEBUG_CONFIG) {
    console.log('[playwright.config] LOCALAPPDATA:', process.env.LOCALAPPDATA)
    console.log('[playwright.config] cacheDirs:', JSON.stringify(cacheDirs))
    console.log('[playwright.config] CI:', process.env.CI)
    for (const dir of cacheDirs) {
      if (existsSync(dir)) console.log('[playwright.config] entries:', readdirSync(dir).join(','))
    }
  }
  return null
}

const cachedChromium = process.env.PLAYWRIGHT_CHROMIUM_PATH || findCachedChromium()
if (process.env.PW_DEBUG_CONFIG) console.log('[playwright.config] cachedChromium:', cachedChromium)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }]
  ],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 本地缓存浏览器回退（FE-03）：版本不匹配时用已缓存的 chrome.exe 启动
        ...(cachedChromium ? { launchOptions: { executablePath: cachedChromium } } : {})
      }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: process.env.CI ? ['**/*.spec.js'] : []  // CI 中仅跑 chromium，本地可全跑
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: process.env.CI ? ['**/*.spec.js'] : []  // CI 中仅跑 chromium，本地可全跑
    }
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    stdout: 'pipe',
    stderr: 'pipe',
    // E2E 固定代理到本地后端，覆盖 .env.production 中的占位域名（api.yourdomain.com），
    // 避免页面所有 /api 代理请求命中外部假域名而 ERR_TLS_CERT_ALTNAME_INVALID。
    // process.env 优先级高于 .env 文件，preview 的 loadEnv 不会覆盖已存在变量。
    env: {
      VITE_BACKEND_URL: 'http://localhost:3001',
      VITE_AI_SERVICE_URL: 'http://localhost:3002'
    }
  }
})
