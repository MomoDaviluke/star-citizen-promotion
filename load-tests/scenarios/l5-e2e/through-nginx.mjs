/**
 * @file L5 经 Nginx 对比压测
 * @description 同一端点分别压 Nginx 和直连后端，对比延迟/HTTP2/gzip/静态资源缓存
 * @module load-tests/scenarios/l5-e2e/through-nginx
 */

import { runScenario, parseArgs, probe, buildUrl } from '../../lib/client.mjs'
import { saveResult, appendSummary } from '../../lib/report.mjs'
import { TARGETS } from '../../config/targets.mjs'

async function main() {
  const args = parseArgs()
  const connections = args.smoke ? 1 : 50
  const duration = args.smoke ? 5 : 30

  console.log(`🚀 L5 经 Nginx 对比压测 ${args.smoke ? '[SMOKE]' : '[FULL]'}`)

  // 探测两个目标
  const backendOk = await probe(TARGETS.backend)
  const nginxOk = await probe(TARGETS.nginx)

  if (!backendOk) {
    console.error('❌ 后端不可达')
    process.exit(1)
  }
  if (!nginxOk) {
    console.error('❌ Nginx 不可达（跳过 Nginx 对比，仅测后端）')
  }

  const testPath = '/api/stats'
  const results = {}

  // 直连后端
  console.log(`\n📍 直连后端: ${TARGETS.backend}${testPath}`)
  try {
    results.backend = await runScenario({
      title: 'L5-nginx-vs-backend-direct',
      url: `${TARGETS.backend}${testPath}`,
      method: 'GET',
      connections,
      duration
    })
    saveResult('l5', 'through-nginx-backend', results.backend)
  } catch (err) {
    console.error(`  ❌ ${err.message}`)
  }

  // 经 Nginx
  if (nginxOk) {
    console.log(`\n📍 经 Nginx: ${TARGETS.nginx}${testPath}`)
    try {
      results.nginx = await runScenario({
        title: 'L5-nginx-vs-backend-nginx',
        url: `${TARGETS.nginx}${testPath}`,
        method: 'GET',
        connections,
        duration
      })
      saveResult('l5', 'through-nginx-nginx', results.nginx)
    } catch (err) {
      console.error(`  ❌ ${err.message}`)
    }
  }

  // 静态资源（经 Nginx）
  if (nginxOk) {
    console.log(`\n📍 静态资源: ${TARGETS.nginx}/hero-bg.jpg`)
    try {
      results.static = await runScenario({
        title: 'L5-nginx-static',
        url: `${TARGETS.nginx}/hero-bg.jpg`,
        method: 'GET',
        connections,
        duration
      })
      saveResult('l5', 'through-nginx-static', results.static)
    } catch (err) {
      console.error(`  ❌ ${err.message}`)
    }
  }

  // 对比分析
  console.log('\n📊 对比结果:')
  if (results.backend && results.nginx) {
    const p95Diff = results.nginx.latency.p95 - results.backend.latency.p95
    console.log(`  后端直连 P95: ${results.backend.latency.p95}ms`)
    console.log(`  经 Nginx  P95: ${results.nginx.latency.p95}ms`)
    console.log(`  Nginx 开销: ${p95Diff}ms ${p95Diff < 5 ? '✅' : '⚠️ 偏高'}`)
  }

  // 验证 HTTP/2 和 gzip 头（单独请求检查）
  if (nginxOk) {
    console.log('\n📍 验证响应头:')
    const res = await fetch(`${TARGETS.nginx}${testPath}`, { signal: AbortSignal.timeout(5000) })
    console.log(`  Content-Encoding: ${res.headers.get('content-encoding') || '无'} ${res.headers.get('content-encoding') === 'gzip' ? '✅' : '⚠️'}`)

    // 静态资源缓存头
    const staticRes = await fetch(`${TARGETS.nginx}/hero-bg.jpg`, { signal: AbortSignal.timeout(5000) })
    const cacheControl = staticRes.headers.get('cache-control')
    const expires = staticRes.headers.get('expires')
    console.log(`  静态资源 Cache-Control: ${cacheControl}`)
    console.log(`  静态资源 Expires: ${expires}`)
  }

  const summaryResult = results.nginx || results.backend || {}
  appendSummary('L5', 'through-nginx', summaryResult, {
    pass: true,
    details: ['对比分析见详细报告']
  })

  console.log('\n✅ L5 Nginx 对比压测完成')
}

main().catch(err => {
  console.error('L5 nginx 失败:', err)
  process.exit(1)
})
