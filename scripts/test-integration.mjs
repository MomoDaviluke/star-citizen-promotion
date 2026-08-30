/**
 * @file 真实集成测试一键编排
 * @description 拉起隔离的「MySQL + migrate + backend」真实栈 → 迁移建表 → backend(最新源码)
 *              就绪 → 跑 connectivity-smoke 后端完整往返 + real-write-test 真实写入链路
 *              （注册→登录→鉴权读回→申请提交→状态读回→埋点→登出）→ 自动清理。
 *              解决主 docker-compose 的坑：JWT_SECRET 32+、密码无特殊字符、backend 用
 *              backend-builder 编译最新源码(DBG-13 镜像缓存)。
 * @usage node scripts/test-integration.mjs [--keep]
 *        --keep  保留测试环境（便于调试），默认结束即 down -v 清理
 * @requires docker + docker compose，且本机 3101/13306 未被占用
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const COMPOSE = join(ROOT, 'docker-compose.test.yml')
const ENV_FILE = join(ROOT, '.env.test')
const SMOKE = join(ROOT, 'scripts', 'connectivity-smoke.mjs')
const WRITE_TEST = join(ROOT, 'scripts', 'real-write-test.mjs')
// 与 .env.test.example 默认一致；可通过 .env.test 覆盖
const BACKEND_PORT = process.env.TEST_BACKEND_PORT || '3101'
const BASE = `http://localhost:${BACKEND_PORT}`

const keep = process.argv.includes('--keep')

function run(cmd, args) {
  const cmdArgs = ['compose', '-f', COMPOSE]
  if (existsSync(ENV_FILE)) cmdArgs.push('--env-file', ENV_FILE)
  cmdArgs.push(...args)
  const res = spawnSync(cmd, cmdArgs, { stdio: 'inherit' })
  if (res.status !== 0) {
    throw new Error(`命令失败 (exit ${res.status}): ${cmd} ${cmdArgs.join(' ')}`)
  }
}

async function waitHealthy(timeoutMs = 90_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/health/live`)
      if (res.status === 200) return
    } catch { /* 未就绪，继续等 */ }
    await new Promise((r) => setTimeout(r, 2000))
  }
  throw new Error(`backend 未在 ${timeoutMs / 1000}s 内就绪: ${BASE}/health/live`)
}

async function main() {
  if (spawnSync('docker', ['--version'], { stdio: 'ignore' }).status !== 0) {
    throw new Error('未检测到 docker，请先安装 Docker 并确保 Docker daemon 运行')
  }

  console.log('\n🧪 真实集成测试（非 mock 后端完整往返）开始\n')
  console.log('① 启动 MySQL')
  run('docker', ['up', '-d', 'mysql'])

  console.log('② 执行数据库迁移（真实建表）')
  run('docker', ['run', '--rm', 'migrate'])

  console.log('③ 启动 backend（backend-builder 最新源码）')
  run('docker', ['up', '-d', 'backend'])

  console.log(`④ 等待 backend 就绪: ${BASE}/health/live`)
  await waitHealthy()

  console.log('⑤ 运行连通性冒烟（真实往返：读 + 写 + 埋点 + 注册）')
  const smoke = spawnSync(process.execPath, [SMOKE, BASE], { stdio: 'inherit' })

  console.log('⑥ 运行真实写入链路测试（注册→登录→鉴权读回→申请提交→状态读回→埋点→登出）')
  const write = spawnSync(process.execPath, [WRITE_TEST, BASE], { stdio: 'inherit' })

  const passed = smoke.status === 0 && write.status === 0

  console.log(passed
    ? '\n✅ 真实集成测试全部通过'
    : '\n❌ 真实集成测试存在失败，见上方 connectivity-smoke 输出')

  return passed
}

try {
  const ok = await main()
  process.exitCode = ok ? 0 : 1
} catch (err) {
  console.error(`\n❌ ${err.message}`)
  process.exitCode = 1
} finally {
  if (!keep) {
    console.log('\n🧹 清理测试环境（down -v）...')
    try {
      run('docker', ['down', '-v'])
    } catch (e) {
      console.warn(`清理警告: ${e.message}`)
    }
  } else {
    console.log('\n🔒 --keep 生效，保留测试环境（可手动 docker compose -f docker-compose.test.yml down -v）')
  }
}