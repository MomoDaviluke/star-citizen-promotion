/**
 * @file 真实写入链路测试
 * @description 在真实后端（非 mock）上执行「注册→登录→鉴权读回→申请提交→状态读回→埋点→登出」
 *              写入 + 调用闭环，验证 MySQL 真实落库与读取一致性。
 *              由 scripts/test-integration.mjs 挂接调用，任一用例失败即非零退出。
 * @usage node scripts/real-write-test.mjs [baseUrl]
 * @example node scripts/real-write-test.mjs http://localhost:3101
 */

const BASE = process.argv[2] || 'http://localhost:3101'

const results = []

function check(name, ok, detail) {
  results.push({ name, ok })
  const mark = ok ? '✅' : '❌'
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`)
}

/** 发起请求并解析响应（含 Set-Cookie 头） */
async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options)
  const text = await res.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  const setCookie = res.headers.get('set-cookie') || ''
  return { status: res.status, ok: res.ok, body, setCookie }
}

/** 从 Set-Cookie 中提取 auth_token 值（httpOnly cookie 认证，与生产一致） */
function extractAuthToken(setCookie) {
  const match = setCookie.match(/auth_token=([^;]+)/)
  return match ? match[1] : null
}

async function main() {
  console.log(`\n✍️  真实写入链路测试 — 目标: ${BASE}\n`)

  const ts = Date.now()
  const username = `wtest_${ts}`
  const email = `wtest_${ts}@test.local`
  const password = 'WriteTest123!'
  let authCookie = null

  // ── 1. 注册：写入 users 表 ──────────────────────────────────
  try {
    const reg = await request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    })
    const emailOk = reg.body?.data?.user?.email === email
    check('注册写入 users 表', reg.status === 201 && emailOk,
      `status=${reg.status} user=${reg.body?.data?.user?.email ?? 'n/a'}`)
    authCookie = extractAuthToken(reg.setCookie)
  } catch (err) {
    check('注册写入 users 表', false, `请求失败: ${err.message}`)
  }

  // ── 2. 登录 + 鉴权读回（写入→读取闭环） ─────────────────────
  try {
    const login = await request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const loginOk = login.status === 200 && login.body?.data?.user?.email === email
    if (!authCookie) authCookie = extractAuthToken(login.setCookie)

    const me = await request('/api/v1/auth/me', {
      headers: { Cookie: `auth_token=${authCookie}` }
    })
    const meOk = me.status === 200 && me.body?.data?.email === email
    check('登录并鉴权读回 /auth/me', loginOk && meOk,
      `login=${login.status} me=${me.status} me.email=${me.body?.data?.email ?? 'n/a'}`)
  } catch (err) {
    check('登录并鉴权读回 /auth/me', false, `请求失败: ${err.message}`)
  }

  // ── 3. 申请提交：写入 applications 表 ───────────────────────
  let appId = null
  try {
    const app = await request('/api/v1/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: username,
        email,
        experience: '真实写入测试：pvp 战斗偏好',
        reason: '验证真实环境申请链路'
      })
    })
    const ok = app.status === 201 && app.body?.data?.status === 'pending'
    appId = app.body?.data?.id ?? null
    check('申请提交写入 applications 表', ok,
      `status=${app.status} appId=${appId ?? 'n/a'} status=${app.body?.data?.status ?? 'n/a'}`)
  } catch (err) {
    check('申请提交写入 applications 表', false, `请求失败: ${err.message}`)
  }

  // ── 4. 申请状态读回（写→读数据一致） ───────────────────────
  try {
    const query = await request(`/api/v1/applications/by-email/${encodeURIComponent(email)}`)
    const ok = query.status === 200
      && query.body?.data?.id === appId
      && query.body?.data?.status === 'pending'
    check('申请状态读回数据一致', ok,
      `status=${query.status} idMatch=${query.body?.data?.id === appId} status=${query.body?.data?.status ?? 'n/a'}`)
  } catch (err) {
    check('申请状态读回数据一致', false, `请求失败: ${err.message}`)
  }

  // ── 5. 埋点写入 + 登出 ─────────────────────────────────────
  try {
    const analytics = await request('/api/v1/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'page_view', properties: { env: 'test-integration', path: '/real-write-test' }, ts: Date.now() })
    })
    const logout = await request('/api/v1/auth/logout', {
      method: 'POST',
      headers: { Cookie: `auth_token=${authCookie}` }
    })
    check('埋点写入 + 登出', analytics.status < 300 && logout.status === 200,
      `analytics=${analytics.status} logout=${logout.status}`)
  } catch (err) {
    check('埋点写入 + 登出', false, `请求失败: ${err.message}`)
  }

  // ── 汇总 ────────────────────────────────────────────────────
  const passed = results.filter((r) => r.ok).length
  const failed = results.length - passed
  console.log(`\n📊 结果: ${passed}/${results.length} 通过, ${failed} 失败\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main()