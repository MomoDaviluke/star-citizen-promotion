#!/usr/bin/env node

/**
 * @file 重构指标采集脚本
 * @description 采集代码质量、测试质量、性能、工程规范四维指标，用于重构前后对比
 * @module scripts/collect-metrics
 *
 * @usage
 *   node scripts/collect-metrics.mjs [output-json-path]
 *   不指定输出路径时，仅打印到 stdout
 *
 * @collects
 *   - 代码质量: 前端/后端 LOC、文件数、依赖数
 *   - 测试质量: 覆盖率、测试用例数、E2E spec 数
 *   - 性能: 生产包体积、首屏 chunk（需手动补充）
 *   - 工程规范: ESLint 错误/警告、TS 错误、TODO/FIXME、文件头注释覆盖率
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname, resolve } from 'node:path'
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

// ── 配置 ──────────────────────────────────────────────────────────

/** 采集时应忽略的目录名 */
const IGNORED_DIRS = [
  'node_modules',
  'dist',
  '.worktrees',
  'coverage',
  '.git',
  'playwright-report',
  'test-results'
]

/** 前端源码扩展名 */
const FRONTEND_EXTS = ['.js', '.vue', '.ts', '.jsx', '.tsx']
/** 后端源码扩展名 */
const BACKEND_EXTS = ['.ts', '.js']

/** 输出文件路径（命令行参数） */
const outputPath = process.argv[2] ? resolve(process.argv[2]) : null

// ── 工具函数 ──────────────────────────────────────────────────────

/**
 * 统计目录下指定扩展名的文件数和总行数
 * @param {string} dir - 起始目录
 * @param {string[]} extensions - 要统计的扩展名列表
 * @param {string[]} ignore - 要忽略的目录名
 * @returns {{ fileCount: number, lineCount: number }}
 */
function countFilesAndLines(dir, extensions, ignore = IGNORED_DIRS) {
  let fileCount = 0
  let lineCount = 0

  function walk(currentDir) {
    const entries = readdirSync(currentDir)
    for (const entry of entries) {
      const fullPath = join(currentDir, entry)
      if (ignore.some((ig) => fullPath.includes(ig))) continue
      const stat = statSync(fullPath)
      if (stat.isDirectory()) {
        walk(fullPath)
      } else if (extensions.includes(extname(entry))) {
        fileCount++
        const content = readFileSync(fullPath, 'utf-8')
        lineCount += content.split('\n').length
      }
    }
  }

  try {
    walk(dir)
  } catch (e) {
    console.warn(`⚠ 无法访问目录 ${dir}: ${e.message}`)
  }
  return { fileCount, lineCount }
}

/**
 * 读取 package.json 的依赖总数
 * @param {string} pkgPath - package.json 路径
 * @returns {{ dependencies: number, devDependencies: number, total: number }}
 */
function countDependencies(pkgPath) {
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    const dependencies = Object.keys(pkg.dependencies || {}).length
    const devDependencies = Object.keys(pkg.devDependencies || {}).length
    return { dependencies, devDependencies, total: dependencies + devDependencies }
  } catch {
    return { dependencies: 0, devDependencies: 0, total: 0 }
  }
}

/**
 * 统计目录下 TODO/FIXME 注释数量
 * @param {string} dir - 起始目录
 * @param {string[]} extensions - 要扫描的扩展名
 * @returns {{ todo: number, fixme: number, total: number }}
 */
function countTodos(dir, extensions, ignore = IGNORED_DIRS) {
  let todo = 0
  let fixme = 0

  function walk(currentDir) {
    const entries = readdirSync(currentDir)
    for (const entry of entries) {
      const fullPath = join(currentDir, entry)
      if (ignore.some((ig) => fullPath.includes(ig))) continue
      const stat = statSync(fullPath)
      if (stat.isDirectory()) {
        walk(fullPath)
      } else if (extensions.includes(extname(entry))) {
        const content = readFileSync(fullPath, 'utf-8')
        const matches = content.match(/TODO|FIXME/gi) || []
        for (const m of matches) {
          if (/TODO/i.test(m)) todo++
          if (/FIXME/i.test(m)) fixme++
        }
      }
    }
  }

  try {
    walk(dir)
  } catch (e) {
    console.warn(`⚠ 无法扫描 TODO ${dir}: ${e.message}`)
  }
  return { todo, fixme, total: todo + fixme }
}

/**
 * 统计文件头注释覆盖率（含 @file 的文件占比）
 * @param {string} dir - 起始目录
 * @param {string[]} extensions - 要扫描的扩展名
 * @returns {{ total: number, withHeader: number, coverage: number }}
 */
function countFileHeaders(dir, extensions, ignore = IGNORED_DIRS) {
  let total = 0
  let withHeader = 0

  function walk(currentDir) {
    const entries = readdirSync(currentDir)
    for (const entry of entries) {
      const fullPath = join(currentDir, entry)
      if (ignore.some((ig) => fullPath.includes(ig))) continue
      const stat = statSync(fullPath)
      if (stat.isDirectory()) {
        walk(fullPath)
      } else if (extensions.includes(extname(entry))) {
        total++
        const content = readFileSync(fullPath, 'utf-8')
        // 检查文件前 500 字符内是否含 @file
        const head = content.slice(0, 500)
        if (/@file/i.test(head)) withHeader++
      }
    }
  }

  try {
    walk(dir)
  } catch (e) {
    console.warn(`⚠ 无法扫描文件头 ${dir}: ${e.message}`)
  }
  return {
    total,
    withHeader,
    coverage: total > 0 ? Number(((withHeader / total) * 100).toFixed(2)) : 0
  }
}

/**
 * 安全运行命令并捕获 stdout
 * @param {string} cmd - 命令字符串
 * @param {object} opts - 选项 { cwd }
 * @returns {{ success: boolean, stdout: string, stderr: string }}
 */
function runCommand(cmd, opts = {}) {
  try {
    const stdout = execSync(cmd, {
      encoding: 'utf-8',
      cwd: opts.cwd || process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 180000 // 3 分钟超时
    })
    return { success: true, stdout, stderr: '' }
  } catch (e) {
    return {
      success: false,
      stdout: e.stdout || '',
      stderr: e.stderr || e.message
    }
  }
}

/**
 * 从 vitest coverage 输出中解析覆盖率
 * @param {string} output - vitest 输出
 * @returns {{ statements: number, branches: number, functions: number, lines: number, testCount: number }}
 */
function parseFrontendCoverage(output) {
  const result = { statements: 0, branches: 0, functions: 0, lines: 0, testCount: 0 }

  // vitest 覆盖率表格通常有 "All files" 行
  const allFilesMatch = output.match(/All files\s*\|\s*([\d.]+)\s*\│?\s*\|?\s*([\d.]+)\s*\│?\s*\|?\s*([\d.]+)\s*\│?\s*\|?\s*([\d.]+)/)
  if (allFilesMatch) {
    result.statements = parseFloat(allFilesMatch[1]) || 0
    result.branches = parseFloat(allFilesMatch[2]) || 0
    result.functions = parseFloat(allFilesMatch[3]) || 0
    result.lines = parseFloat(allFilesMatch[4]) || 0
  }

  // 测试用例数：匹配 "Tests  N passed"
  const testCountMatch = output.match(/Tests\s+(\d+)\s+(passed|failed|skipped)/)
  if (testCountMatch) {
    result.testCount = parseInt(testCountMatch[1], 10)
  }

  return result
}

/**
 * 从 jest coverage 输出中解析覆盖率
 * @description jest 覆盖率表格格式: "All files | 63.86 | 52.3 | 58.12 | 64.21 |"
 * @param {string} output - jest 输出
 * @returns {{ statements: number, branches: number, functions: number, lines: number, testCount: number }}
 */
function parseBackendCoverage(output) {
  const result = { statements: 0, branches: 0, functions: 0, lines: 0, testCount: 0 }

  // jest 覆盖率表格 "All files" 行：All files | 63.86 | 52.3 | 58.12 | 64.21 |
  const allFilesMatch = output.match(/All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/)
  if (allFilesMatch) {
    result.statements = parseFloat(allFilesMatch[1]) || 0
    result.branches = parseFloat(allFilesMatch[2]) || 0
    result.functions = parseFloat(allFilesMatch[3]) || 0
    result.lines = parseFloat(allFilesMatch[4]) || 0
  }

  // 测试用例数：jest 格式 "Tests: 3 failed, 349 passed, 352 total"
  // 或 "Tests: N passed, N total"
  const testCountMatch = output.match(/Tests:\s+(?:(?:\d+\s+(?:failed|skipped),\s*)*)(\d+)\s+passed/)
  if (testCountMatch) {
    result.testCount = parseInt(testCountMatch[1], 10)
  }

  return result
}

/**
 * 从 eslint 输出中解析错误和警告数
 * @param {string} output - eslint 输出
 * @returns {{ errors: number, warnings: number }}
 */
function parseLintOutput(output) {
  const result = { errors: 0, warnings: 0 }
  // eslint 摘要行："✖ X problems (Y errors, Z warnings)"
  const match = output.match(/(\d+)\s+problems?\s*\((\d+)\s+errors?,\s*(\d+)\s+warnings?\)/)
  if (match) {
    result.errors = parseInt(match[2], 10)
    result.warnings = parseInt(match[3], 10)
  }
  return result
}

/**
 * 统计 glob 匹配的文件数（用于 E2E spec 数）
 * @param {string} pattern - glob 模式（简化版，仅支持目录 + 扩展名）
 * @returns {number}
 */
function countE2eSpecs() {
  try {
    const e2eDir = join(process.cwd(), 'e2e')
    if (!existsSync(e2eDir)) return 0
    return readdirSync(e2eDir).filter((f) => f.endsWith('.spec.js')).length
  } catch {
    return 0
  }
}

// ── 主采集逻辑 ────────────────────────────────────────────────────

/**
 * 采集全部指标
 * @returns {object} 指标对象
 */
async function collectAll() {
  const projectRoot = process.cwd()
  const serverDir = join(projectRoot, 'server')

  console.log('📊 开始采集重构指标...\n')

  // ── 1. 代码质量指标 ──
  console.log('  → 采集代码质量指标...')
  const frontendStats = countFilesAndLines(join(projectRoot, 'src'), FRONTEND_EXTS)
  const backendStats = countFilesAndLines(serverDir, BACKEND_EXTS)
  const frontendDeps = countDependencies(join(projectRoot, 'package.json'))
  const backendDeps = countDependencies(join(serverDir, 'package.json'))

  const codeQuality = {
    frontend: {
      files: frontendStats.fileCount,
      loc: frontendStats.lineCount,
      dependencies: frontendDeps.total
    },
    backend: {
      files: backendStats.fileCount,
      loc: backendStats.lineCount,
      dependencies: backendDeps.total
    },
    totalFiles: frontendStats.fileCount + backendStats.fileCount,
    totalLoc: frontendStats.lineCount + backendStats.lineCount,
    totalDependencies: frontendDeps.total + backendDeps.total
  }

  // ── 2. 测试质量指标 ──
  // 注意：测试命令可能因部分用例失败而返回非零退出码，但覆盖率报告仍会输出到 stdout
  // 因此无论命令成功与否，都尝试解析 stdout
  console.log('  → 采集测试质量指标（运行前端覆盖率）...')
  const frontendTestResult = runCommand('npm run test:coverage 2>&1', { cwd: projectRoot })
  const frontendTestCoverage = parseFrontendCoverage(frontendTestResult.stdout)
  if (frontendTestCoverage.statements === 0 && !frontendTestResult.success) {
    frontendTestCoverage.error = 'command failed and no coverage parsed'
    frontendTestCoverage.stderrSnippet = frontendTestResult.stderr.slice(0, 500)
  }

  console.log('  → 采集测试质量指标（运行后端覆盖率）...')
  const backendTestResult = runCommand('npm run test:coverage 2>&1', { cwd: serverDir })
  const backendTestCoverage = parseBackendCoverage(backendTestResult.stdout)
  if (backendTestCoverage.statements === 0 && !backendTestResult.success) {
    backendTestCoverage.error = 'command failed and no coverage parsed'
    backendTestCoverage.stderrSnippet = backendTestResult.stderr.slice(0, 500)
  }

  const e2eSpecCount = countE2eSpecs()

  const testQuality = {
    frontend: {
      statements: frontendTestCoverage.statements,
      branches: frontendTestCoverage.branches,
      functions: frontendTestCoverage.functions,
      lines: frontendTestCoverage.lines,
      testCount: frontendTestCoverage.testCount,
      coverageCommandSuccess: frontendTestResult.success,
      parseError: frontendTestCoverage.error || null
    },
    backend: {
      statements: backendTestCoverage.statements,
      branches: backendTestCoverage.branches,
      functions: backendTestCoverage.functions,
      lines: backendTestCoverage.lines,
      testCount: backendTestCoverage.testCount,
      coverageCommandSuccess: backendTestResult.success,
      parseError: backendTestCoverage.error || null
    },
    e2eSpecCount,
    totalTestCount:
      (frontendTestCoverage.testCount || 0) + (backendTestCoverage.testCount || 0)
  }

  // ── 3. 性能指标（需手动 build 后补充） ──
  console.log('  → 性能指标需手动 npm run build 后补充')
  const performance = {
    bundleSize: null, // 手动填写: dist/assets 总大小（KB）
    entryChunkSize: null, // 手动填写: 首屏 entry chunk 大小（KB）
    note: '需手动运行 npm run build 后从 vite 输出采集'
  }

  // ── 4. 工程规范指标 ──
  console.log('  → 采集工程规范指标（ESLint）...')
  const frontendLintResult = runCommand('npm run lint 2>&1', { cwd: projectRoot })
  const frontendLint = parseLintOutput(frontendLintResult.stdout + frontendLintResult.stderr)

  console.log('  → 采集工程规范指标（后端 ESLint）...')
  const backendLintResult = runCommand('npm run lint 2>&1', { cwd: serverDir })
  const backendLint = parseLintOutput(backendLintResult.stdout + backendLintResult.stderr)

  console.log('  → 采集工程规范指标（TypeScript）...')
  const frontendTsResult = runCommand('npm run typecheck 2>&1', { cwd: projectRoot })
  const backendTsResult = runCommand('npm run typecheck 2>&1', { cwd: serverDir })
  // TS 错误数：统计 "error TS" 出现次数
  const frontendTsErrors = (frontendTsResult.stdout.match(/error TS\d+/g) || []).length
  const backendTsErrors = (backendTsResult.stdout.match(/error TS\d+/g) || []).length

  console.log('  → 采集 TODO/FIXME 和文件头注释覆盖率...')
  const frontendTodos = countTodos(join(projectRoot, 'src'), FRONTEND_EXTS)
  const backendTodos = countTodos(serverDir, BACKEND_EXTS)
  const frontendHeaders = countFileHeaders(join(projectRoot, 'src'), FRONTEND_EXTS)
  const backendHeaders = countFileHeaders(serverDir, BACKEND_EXTS)

  const engineeringStandards = {
    eslint: {
      frontend: { errors: frontendLint.errors, warnings: frontendLint.warnings },
      backend: { errors: backendLint.errors, warnings: backendLint.warnings },
      totalErrors: frontendLint.errors + backendLint.errors,
      totalWarnings: frontendLint.warnings + backendLint.warnings
    },
    typescript: {
      frontendErrors: frontendTsErrors,
      backendErrors: backendTsErrors,
      totalErrors: frontendTsErrors + backendTsErrors
    },
    todos: {
      frontend: frontendTodos,
      backend: backendTodos,
      total: frontendTodos.total + backendTodos.total
    },
    fileHeaderCoverage: {
      frontend: frontendHeaders,
      backend: backendHeaders,
      overall: {
        total: frontendHeaders.total + backendHeaders.total,
        withHeader: frontendHeaders.withHeader + backendHeaders.withHeader,
        coverage:
          frontendHeaders.total + backendHeaders.total > 0
            ? Number(
                (
                  ((frontendHeaders.withHeader + backendHeaders.withHeader) /
                    (frontendHeaders.total + backendHeaders.total)) *
                  100
                ).toFixed(2)
              )
            : 0
      }
    }
  }

  // ── 汇总 ──
  const metrics = {
    timestamp: new Date().toISOString(),
    codeQuality,
    testQuality,
    performance,
    engineeringStandards
  }

  return metrics
}

// ── 入口 ──────────────────────────────────────────────────────────

collectAll()
  .then((metrics) => {
    const json = JSON.stringify(metrics, null, 2)

    if (outputPath) {
      writeFileSync(outputPath, json, 'utf-8')
      console.log(`\n✅ 指标已写入: ${outputPath}\n`)
    } else {
      console.log('\n' + json)
    }

    // 打印摘要
    console.log('── 指标摘要 ──────────────────────────────────────')
    console.log(`代码质量: 前端 ${metrics.codeQuality.frontend.loc} LOC / ${metrics.codeQuality.frontend.files} 文件, 后端 ${metrics.codeQuality.backend.loc} LOC / ${metrics.codeQuality.backend.files} 文件`)
    console.log(`测试质量: 前端覆盖率 ${metrics.testQuality.frontend.statements}% / ${metrics.testQuality.frontend.testCount} 用例, 后端 ${metrics.testQuality.backend.statements}% / ${metrics.testQuality.backend.testCount} 用例`)
    console.log(`E2E spec: ${metrics.testQuality.e2eSpecCount} 个`)
    console.log(`ESLint: ${metrics.engineeringStandards.eslint.totalErrors} 错误 / ${metrics.engineeringStandards.eslint.totalWarnings} 警告`)
    console.log(`TypeScript: ${metrics.engineeringStandards.typescript.totalErrors} 错误`)
    console.log(`TODO/FIXME: ${metrics.engineeringStandards.todos.total} 个`)
    console.log(`文件头注释覆盖率: ${metrics.engineeringStandards.fileHeaderCoverage.overall.coverage}%`)
    console.log('──────────────────────────────────────────────────')
  })
  .catch((err) => {
    console.error('❌ 采集指标失败:', err)
    process.exit(1)
  })
