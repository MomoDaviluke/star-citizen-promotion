/**
 * @file 前后端连通冒烟测试
 * @description 验证后端服务与数据库连通性及核心 API 端点可用性。
 *              用途: 开发/CI 中快速确认前后端链路真实可通(非 mock)。
 * @usage node scripts/connectivity-smoke.mjs [baseUrl]
 * @example node scripts/connectivity-smoke.mjs http://localhost:3001
 */

const BASE = process.argv[2] || 'http://localhost:3001'

const results = []

function check(name, ok, detail) {
  results.push({ name, ok, detail })
  const mark = ok ? '✅' : '❌'
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`)
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options)
  const text = await res.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  return { status: res.status, ok: res.ok, body }
}

async function main() {
  console.log(`\n🔌 前后端连通冒烟测试 — 目标: ${BASE}\n`)

  // 1. 服务存活
  try {
    const health = await request('/health')
    const live = await request('/health/live')
    const ready = await request('/health/ready')
    check('服务存活 (/health)', health.ok && health.body?.status === 'ok', `status=${health.body?.status}`)
    check('就绪探针 (/health/ready)', ready.ok, `status=${ready.status}`)
    check('数据库连通', health.body?.checks?.database === true, 'database=true')
    if (!live.ok) check('存活探针 (/health/live)', false, `status=${live.status}`)
  } catch (err) {
    check('服务存活', false, `连接失败: ${err.message}`)
  }

  // 2. 核心读端点(公开)
  const publicEndpoints = [
    { path: '/api/v1/stats', name: '统计 /stats' },
    { path: '/api/v1/fleet', name: '舰队 /fleet' },
    { path: '/api/v1/pilots', name: '飞行员 /pilots' },
    { path: '/api/v1/members', name: '成员 /members' },
    { path: '/api/v1/projects', name: '项目 /projects' },
  ]
  for (const ep of publicEndpoints) {
    try {
      const res = await request(ep.path)
      check(ep.name, res.ok, `status=${res.status} success=${res.body?.success ?? 'n/a'}`)
    } catch (err) {
      check(ep.name, false, `请求失败: ${err.message}`)
    }
  }

  // 3. 未认证访问受保护端点应返回 401/403(而非 500)
  try {
    const admin = await request('/api/v1/admin/cache-stats')
    check('未认证访问 admin 被拦截', admin.status === 401 || admin.status === 403, `status=${admin.status}`)
  } catch (err) {
    check('未认证访问 admin 被拦截', false, `请求失败: ${err.message}`)
  }

  // 4. 认证流程端点可用
  try {
    const register = await request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: `smoke_${Date.now()}`, email: `smoke_${Date.now()}@test.local`, password: 'SmokePass123!' }),
    })
    check('注册端点可响应', register.status === 201 || register.status === 400 || register.status === 409,
      `status=${register.status} ${register.ok ? '(成功)' : '(预期校验响应)'}`)
  } catch (err) {
    check('注册端点可响应', false, `请求失败: ${err.message}`)
  }

  // 5. AI 服务状态
  try {
    const ai = await request('/api/v1/ai/health')
    check('AI 服务健康', ai.ok, `status=${ai.status}`)
  } catch (err) {
    check('AI 服务健康', false, `请求失败: ${err.message}`)
  }

  // 汇总
  const passed = results.filter(r => r.ok).length
  const failed = results.length - passed
  console.log(`\n📊 结果: ${passed}/${results.length} 通过, ${failed} 失败\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
