#!/usr/bin/env node
/**
 * @file 全分辨率布局审计脚本
 * @description 路由 × 视口 × 内核矩阵审计：截图 + 硬断言（无横向溢出 / 无出界元素 /
 *              关键元素探针 / 控制台致命错误），产出 Markdown 症状清单。
 *              视口含 Windows DPI 缩放等效档：1536 = 1920 物理 @125%，1706 = 2560 @150%。
 * @module scripts/layout-audit
 *
 * 用法：
 *   node scripts/layout-audit.mjs          # 全量矩阵（chromium + msedge）
 *   node scripts/layout-audit.mjs --quick  # 快速模式（chromium × 4 档关键视口 × 公开路由）
 * 环境变量：
 *   BASE_URL           审计目标（默认 http://localhost:5173）
 *   AUDIT_TEST_USER    可选测试账号（启用受保护/admin 路由登录态审计）
 *   AUDIT_TEST_PASS    可选测试密码
 */

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, dirname, relative, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const QUICK = process.argv.includes('--quick')
const DATE = new Date().toISOString().slice(0, 10)
const OUT_DIR = resolve(ROOT, 'docs/superpowers/audits', `${DATE}-run`)
const SHOT_DIR = resolve(OUT_DIR, 'screenshots')
mkdirSync(SHOT_DIR, { recursive: true })

/* ── 矩阵定义 ──────────────────────────────────────────── */

const VIEWPORTS = QUICK
  ? [375, 768, 1440, 1920]
  : [320, 375, 425, 768, 1024, 1280, 1366, 1440, 1536, 1600, 1706, 1920, 2560]

const PUBLIC_ROUTES = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'members', path: '/members' },
  { name: 'projects', path: '/projects' },
  { name: 'fleet', path: '/fleet' },
  { name: 'ship-detail', path: '__dynamic__' }, // 从 /fleet 列表抓第一个舰船链接
  { name: 'calendar', path: '/calendar' },
  { name: 'join', path: '/join' },
  { name: 'contact', path: '/contact' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'not-found', path: '/__audit_404__' },
]

const PROTECTED_ROUTES = [
  { name: 'profile', path: '/profile' },
  { name: 'application-status', path: '/application-status' },
]

const ADMIN_ROUTES = [
  { name: 'admin-dashboard', path: '/admin/dashboard' },
  { name: 'admin-members', path: '/admin/members' },
]
const ADMIN_VIEWPORTS = [1024, 1280, 1440, 1920]

const ENGINES = QUICK
  ? [{ name: 'chromium', channel: undefined }]
  : [
      { name: 'chromium', channel: undefined },
      { name: 'msedge', channel: 'msedge' },
    ]

/* ── 页面断言（在浏览器上下文执行） ───────────────────── */

const AUDIT_FN = `async () => {
  const issues = []
  const de = document.documentElement

  // P0: 横向溢出
  if (de.scrollWidth > window.innerWidth + 1) {
    issues.push({ level: 'P0', type: 'horizontal-overflow',
      detail: 'scrollWidth ' + de.scrollWidth + ' > viewport ' + window.innerWidth })
  }

  // P1: 出界元素（忽略 fixed 装饰层；父级 overflow 剪裁的出界可接受，如 hero 船图 mask）
  const offenders = []
  for (const el of document.body.querySelectorAll('*')) {
    const cs = getComputedStyle(el)
    if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) continue
    if (r.right > window.innerWidth + 1) {
      let clipped = false, p = el.parentElement
      while (p) {
        const pcs = getComputedStyle(p)
        if (pcs.overflow !== 'visible' || pcs.overflowX !== 'visible') { clipped = true; break }
        p = p.parentElement
      }
      if (!clipped) {
        offenders.push({ tag: el.tagName.toLowerCase(),
          cls: String(el.className).slice(0, 60), right: Math.round(r.right) })
      }
    }
  }
  if (offenders.length) {
    issues.push({ level: 'P1', type: 'element-out-of-viewport',
      detail: JSON.stringify(offenders.slice(0, 5)) })
  }

  // P0: #app 白屏探针
  const app = document.querySelector('#app')
  if (app && app.getBoundingClientRect().width === 0) {
    issues.push({ level: 'P0', type: 'app-empty', detail: '#app 宽度为 0（可能白屏）' })
  }

  // P1: header 探针
  const header = document.querySelector('header')
  if (header && header.getBoundingClientRect().height < 20) {
    issues.push({ level: 'P1', type: 'header-height', detail: 'header 高度异常' })
  }

  return { issues, url: location.href, width: window.innerWidth }
}`

/* ── 审计单页 ──────────────────────────────────────────── */

async function auditPage(page, routeName, path, width) {
  const consoleErrors = []
  const onConsole = (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    // 白名单：dev HMR websocket 断连、Sentry 初始化噪音、
    // 后端未启动时的 API 失败（布局审计针对前端渲染态，空数据/骨架屏是有效布局状态）
    if (
      /websocket|net::ERR_FAILED|net::ERR_CONNECTION_REFUSED|net::ERR_EMPTY_RESPONSE/i.test(text) ||
      /Failed to load resource.*(favicon|sentry)/i.test(text) ||
      /status of 5\d\d/.test(text)
    ) return
    consoleErrors.push(text.slice(0, 160))
  }
  page.on('console', onConsole)

  const issues = []
  try {
    await page.goto(BASE_URL + path, { waitUntil: 'load', timeout: 30000 })
    await page.waitForSelector('#app *', { timeout: 10000 })
    await page.waitForTimeout(900) // 等 SPA 渲染与 GSAP 入场完成
    // 显式 IIFE 调用：规避 page.evaluate 对 async 箭头函数字符串的检测边界情况
    let result = await page.evaluate(`(${AUDIT_FN})()`)
    // 瞬态过滤：GSAP 入场动画中段元素可能短暂出界，检测到症状后延时复测一次，
    // 复测消失则判定为动画瞬态（假阳性），不计入报告
    if (result.issues.length) {
      await page.waitForTimeout(700)
      result = await page.evaluate(`(${AUDIT_FN})()`)
    }
    issues.push(...result.issues)
    await page.screenshot({
      path: resolve(SHOT_DIR, `${routeName}-${width}.png`),
      fullPage: false,
    })
  } catch (err) {
    issues.push({ level: 'P0', type: 'load-failure', detail: String(err).slice(0, 200) })
  } finally {
    page.off('console', onConsole)
  }
  if (consoleErrors.length) {
    issues.push({ level: 'P1', type: 'console-error', detail: consoleErrors.slice(0, 3).join(' | ') })
  }
  return issues
}

/* ── 可选登录（受保护/admin 路由） ─────────────────────── */

async function tryLogin(page) {
  const user = process.env.AUDIT_TEST_USER
  const pass = process.env.AUDIT_TEST_PASS
  if (!user || !pass) return false
  try {
    await page.goto(BASE_URL + '/login', { waitUntil: 'load', timeout: 30000 })
    await page.waitForSelector('input', { timeout: 10000 })
    const userInput = page.locator('input[type="text"], input[name="username"], input[name="account"]').first()
    const passInput = page.locator('input[type="password"]').first()
    await userInput.fill(user)
    await passInput.fill(pass)
    await passInput.press('Enter')
    await page.waitForTimeout(2000)
    return !page.url().includes('/login')
  } catch {
    return false
  }
}

/* ── 浏览器启动（含缓存回退） ──────────────────────────── */

/**
 * 探测本机 playwright 缓存中已有的 chromium 可执行文件
 * 项目 playwright-core 期望的 revision 可能与缓存版本不一致（CDN 下载受阻时），
 * 回退用缓存浏览器的 executablePath 启动——截图/断言级审计对版本差异不敏感。
 */
function findCachedChromium() {
  const cacheDirs = [
    resolve(process.env.LOCALAPPDATA || '', 'ms-playwright'),
    resolve(process.env.USERPROFILE || '', 'AppData', 'Local', 'ms-playwright'),
  ]
  for (const dir of cacheDirs) {
    if (!existsSync(dir)) continue
    // 优先 headless shell（headless 审计更快），否则完整 chrome
    const candidates = [
      join(dir, 'chromium_headless_shell-1208', 'chrome-headless-shell-win64', 'chrome-headless-shell.exe'),
      join(dir, 'chromium-1208', 'chrome-win64', 'chrome.exe'),
      join(dir, 'chromium-1208', 'chrome-win', 'chrome.exe'),
    ]
    for (const p of candidates) if (existsSync(p)) return p
    // 版本不匹配时：取任意已缓存 chromium 的 chrome.exe（新版目录结构）
    for (const entry of readdirSync(dir)) {
      if (!/^chromium-\d+$/.test(entry)) continue
      for (const sub of ['chrome-win64', 'chrome-win']) {
        const p = join(dir, entry, sub, 'chrome.exe')
        if (existsSync(p)) return p
      }
    }
  }
  return null
}

/* ── 主流程 ────────────────────────────────────────────── */

async function runEngine(engine) {
  let browser
  const launchArgs = { channel: engine.channel, headless: true }
  try {
    browser = await chromium.launch(launchArgs)
  } catch (primaryErr) {
    // chromium 无 channel 时尝试缓存回退；channel 引擎（msedge）失败则降级跳过
    const cached = findCachedChromium()
    if (!engine.channel && cached) {
      console.warn(`[warn] 默认 chromium 启动失败，回退缓存浏览器: ${cached}`)
      try {
        browser = await chromium.launch({ ...launchArgs, executablePath: cached })
      } catch {
        console.warn(`[warn] 缓存浏览器启动也失败: ${String(primaryErr).slice(0, 120)}`)
      }
    }
    if (!browser) {
      if (engine.channel) {
        console.warn(`[warn] ${engine.name} 不可用，降级跳过（chromium 同内核已覆盖）`)
        return []
      }
      throw new Error(`chromium 启动失败且无缓存回退，请先 npx playwright install chromium。原始错误: ${String(primaryErr).slice(0, 200)}`)
    }
  }

  const findings = []
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  // 动态路由：从 /fleet 抓第一个舰船详情链接
  let shipDetailPath = null
  try {
    await page.goto(BASE_URL + '/fleet', { waitUntil: 'load', timeout: 30000 })
    await page.waitForSelector('#app a', { timeout: 10000 })
    shipDetailPath = await page.evaluate(() => {
      const link = document.querySelector('a[href*="/fleet/"]:not([href="/fleet"]):not([href$="/fleet"])')
      return link ? link.getAttribute('href') : null
    })
  } catch { /* 列表页失败时由 fleet 路由审计报告 */ }
  if (!shipDetailPath) console.warn('[warn] 未取到舰船详情 slug，跳过 ship-detail 路由')

  const loggedIn = await tryLogin(page)
  if (!loggedIn && process.env.AUDIT_TEST_USER) {
    console.warn('[warn] 登录失败，受保护/admin 路由仅审计重定向后视图')
  }

  const plan = []
  for (const route of PUBLIC_ROUTES) {
    const p = route.path === '__dynamic__' ? shipDetailPath : route.path
    if (route.path === '__dynamic__' && !p) continue
    for (const w of VIEWPORTS) plan.push({ route: route.name, path: p, width: w })
  }
  for (const route of [...PROTECTED_ROUTES, ...(loggedIn ? ADMIN_ROUTES : [])]) {
    const widths = ADMIN_ROUTES.some((r) => r.name === route.name) ? ADMIN_VIEWPORTS : VIEWPORTS
    for (const w of widths) plan.push({ route: route.name, path: route.path, width: w })
  }
  if (!loggedIn) {
    // 未登录时 admin 仍审计重定向视图（验证守卫正确性），仅 1280 一档
    for (const route of ADMIN_ROUTES) plan.push({ route: route.name + '-redirect', path: route.path, width: 1280 })
  }

  let done = 0
  for (const item of plan) {
    await page.setViewportSize({ width: item.width, height: 900 })
    const issues = await auditPage(page, `${engine.name}-${item.route}`, item.path, item.width)
    for (const iss of issues) {
      findings.push({ engine: engine.name, route: item.route, width: item.width, ...iss })
    }
    done++
    if (done % 20 === 0) console.log(`[info] ${engine.name}: ${done}/${plan.length}`)
  }

  await browser.close()
  return findings
}

/* ── 报告 ──────────────────────────────────────────────── */

function renderReport(allFindings) {
  const p0 = allFindings.filter((f) => f.level === 'P0')
  const p1 = allFindings.filter((f) => f.level === 'P1')
  const lines = [
    `# 布局审计报告 ${DATE}`,
    '',
    `- 目标：${BASE_URL}`,
    `- 模式：${QUICK ? 'quick' : 'full'}`,
    `- 总发现：P0=${p0.length}，P1=${p1.length}`,
    `- 截图目录：${relative(ROOT, SHOT_DIR).replaceAll('\\', '/')}`,
    '',
    '## P0（崩溃级）',
    ...(p0.length
      ? p0.map((f) => `- [${f.engine}/${f.route}@${f.width}] ${f.type}: ${f.detail}`)
      : ['- 无']),
    '',
    '## P1（错位级）',
    ...(p1.length
      ? p1.map((f) => `- [${f.engine}/${f.route}@${f.width}] ${f.type}: ${f.detail}`)
      : ['- 无']),
    '',
  ]
  return { md: lines.join('\n'), p0Count: p0.length, p1Count: p1.length }
}

const all = []
for (const engine of ENGINES) {
  console.log(`[info] 引擎 ${engine.name} 开始`)
  all.push(...(await runEngine(engine)))
}
const { md, p0Count, p1Count } = renderReport(all)
writeFileSync(resolve(OUT_DIR, 'report.md'), md, 'utf8')
console.log(md)
console.log(`\n[done] 报告: ${relative(ROOT, resolve(OUT_DIR, 'report.md')).replaceAll('\\', '/')}`)
process.exit(p0Count + p1Count > 0 ? 1 : 0)
