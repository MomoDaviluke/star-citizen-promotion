/**
 * @file SPA 预渲染脚本
 * @description 使用 Playwright（项目已有基础设施）抓取公开路由的渲染后 HTML，
 *              生成静态文件到 dist 目录，使 AI 爬虫/搜索引擎无需执行 JS 即可读取内容。
 *              复用 e2e 已安装的 Chromium，零新增依赖。
 * @usage node scripts/prerender.mjs [distDir]
 */

import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve, dirname, join } from 'node:path'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

/**
 * 需预渲染的公开路由（排除登录/注册/管理后台/动态详情）
 * 键为路由路径，值为最终 HTML 输出路径
 */
const ROUTES = {
  '/': 'index.html',
  '/about': 'about/index.html',
  '/members': 'members/index.html',
  '/projects': 'projects/index.html',
  '/fleet': 'fleet/index.html',
  '/calendar': 'calendar/index.html',
  '/join': 'join/index.html',
  '/contact': 'contact/index.html'
}

const ROOT = resolve(import.meta.dirname, '..')
const DIST_DIR = process.argv[2] ? resolve(process.argv[2]) : join(ROOT, 'dist')
const PREVIEW_PORT = 4173

/**
 * 已安装的 Chromium 可执行文件路径（环境内 Playwright 版本漂移时显式指定）
 * 优先使用环境变量 PRERENDER_CHROMIUM_PATH，否则探测本地 ms-playwright 缓存
 */
function resolveChromiumPath() {
  if (process.env.PRERENDER_CHROMIUM_PATH) return process.env.PRERENDER_CHROMIUM_PATH

  const base = process.env.LOCALAPPDATA || ''
  const candidates = [
    // 版本漂移探测：优先 headless-shell，其次完整 chromium
    join(base, 'ms-playwright', 'chromium_headless_shell-1228', 'chrome-headless-shell-win64', 'chrome-headless-shell.exe'),
    join(base, 'ms-playwright', 'chromium-1228', 'chrome-win', 'chrome.exe'),
    join(base, 'ms-playwright', 'chromium_headless_shell-1208', 'chrome-headless-shell-win64', 'chrome-headless-shell.exe'),
    join(base, 'ms-playwright', 'chromium-1208', 'chrome-win', 'chrome.exe')
  ]

  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return undefined
}

/**
 * 启动 vite preview 服务器（复用构建产物）
 * 通过子进程 spawn `vite preview`，轮询等待端口就绪
 * @returns {Promise<{close: () => void}>}
 */
async function startPreview() {
  const viteBin = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(
    process.execPath,
    [viteBin, 'preview', '--port', String(PREVIEW_PORT), '--strictPort'],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }
  )

  // 等待端口就绪（轮询 + 超时 15s）
  const deadline = Date.now() + 15000
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${PREVIEW_PORT}/`, { method: 'HEAD' })
      if (res.status < 500) return { close: () => child.kill() }
    } catch {
      // 未就绪，继续等
    }
    await new Promise((r) => setTimeout(r, 300))
  }

  child.kill()
  throw new Error('vite preview 启动超时（15s 内端口未就绪）')
}

/**
 * 等待页面渲染完成：Vue 挂载后 #app 有真实内容
 * @param {import('@playwright/test').Page} page
 */
async function waitForRender(page) {
  await page.waitForFunction(() => {
    const app = document.querySelector('#app')
    return app && app.children.length > 0 && app.textContent.trim().length > 50
  }, null, { timeout: 12000 })
}

async function main() {
  console.log(`[prerender] 目标目录: ${DIST_DIR}`)
  const preview = await startPreview()
  const baseUrl = `http://localhost:${PREVIEW_PORT}`

  const browser = await chromium.launch({
    headless: true,
    executablePath: resolveChromiumPath()
  })
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()

  let success = 0
  for (const [route, outPath] of Object.entries(ROUTES)) {
    console.log(`[prerender] 处理 ${route} ...`)
    try {
      // domcontentloaded 更快返回；JS 渲染由 waitForRender 保证内容就绪
      await page.goto(baseUrl + route, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await waitForRender(page)

      const html = await page.content()
      const outFile = join(DIST_DIR, outPath)
      await mkdir(dirname(outFile), { recursive: true })
      // EPERM 防护：Windows 下文件可能被残留进程占用，重试 3 次
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await writeFile(outFile, html, 'utf-8')
          break
        } catch (err) {
          if (attempt === 3) throw err
          await new Promise((r) => setTimeout(r, 500))
        }
      }
      console.log(`[prerender] ✅ ${route} → ${outPath} (${(html.length / 1024).toFixed(1)} KB)`)
      success++
    } catch (err) {
      console.error(`[prerender] ❌ ${route} 预渲染失败: ${err.message.split('\n')[0]}`)
    }
  }

  await browser.close()
  preview.close()

  console.log(`[prerender] 完成: ${success}/${Object.keys(ROUTES).length} 个页面已预渲染`)
  if (success < Object.keys(ROUTES).length) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error('[prerender] 预渲染失败:', err.message)
  process.exit(1)
})
