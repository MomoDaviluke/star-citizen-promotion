/**
 * mock-esbuild.mjs - esbuild 的 in-process 替代实现
 * 用 @swc/core 代替 esbuild 完成代码转换，不需 spawn 子进程
 * 专门解决沙箱 EPERM 限制
 */

import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

// @swc/core 仅安装在 server/node_modules 中
const serverDir = path.resolve(process.cwd(), 'server')
const requireFromServer = createRequire(path.join(serverDir, 'package.json'))
const swc = requireFromServer('@swc/core')
import fs from 'node:fs'

/**
 * esbuild.build() 的简化替代
 * 仅处理 Vite config bundling 和代码转换场景
 */
async function build(options = {}) {
  const {
    entryPoints,
    stdin,
    bundle = false,
    write = false,
    outfile,
    format = 'esm',
    platform = 'node',
    target,
    sourcemap = false,
    minify = false,
    loader = {},
    external = [],
    ...rest
  } = options

  let inputCode = ''
  let inputPath = ''

  if (stdin) {
    inputCode = stdin.contents
    inputPath = stdin.resolveDir ? path.join(stdin.resolveDir, stdin.loader || 'stdin.js') : 'stdin.js'
  } else if (entryPoints) {
    const entry = Array.isArray(entryPoints) ? entryPoints[0] : entryPoints
    inputPath = entry
    inputCode = fs.readFileSync(entry, 'utf-8')
  }

  // 使用 SWC 进行转换
  try {
    const result = await swc.transform(inputCode, {
      filename: inputPath,
      jsc: {
        target: target?.includes('esnext') || target?.includes('es2022') ? 'es2022' : 'es2020',
        parser: inputPath.endsWith('.ts') || inputPath.endsWith('.tsx')
          ? { syntax: 'typescript', tsx: inputPath.endsWith('.tsx') }
          : { syntax: 'ecmascript', jsx: inputPath.endsWith('.jsx') },
        transform: {},
        keepClassNames: true,
      },
      module: {
        type: format === 'cjs' ? 'commonjs' : 'es6',
      },
      minify: !!minify,
      sourceMaps: sourcemap === true || sourcemap === 'inline' ? 'inline' : false,
    })

    const outputText = result.code

    // 如果需要写入文件
    if (write && outfile) {
      const dir = path.dirname(outfile)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(outfile, outputText, 'utf-8')
    }

    // 返回 esbuild 兼容格式
    return {
      outputFiles: write ? undefined : [{ text: outputText, path: outfile || inputPath }],
      errors: [],
      warnings: [],
      metafile: { inputs: {}, outputs: {} }
    }
  } catch (err) {
    return {
      outputFiles: [],
      errors: [{ text: err.message, location: null }],
      warnings: [],
    }
  }
}

function buildSync(options) {
  // 同步版本：使用 swc 的同步 API
  const {
    entryPoints,
    stdin,
    write = false,
    outfile,
    format = 'esm',
    target,
    sourcemap = false,
    minify = false,
  } = options

  let inputCode = ''
  let inputPath = ''

  if (stdin) {
    inputCode = stdin.contents
    inputPath = stdin.resolveDir ? path.join(stdin.resolveDir, 'stdin.js') : 'stdin.js'
  } else if (entryPoints) {
    const entry = Array.isArray(entryPoints) ? entryPoints[0] : entryPoints
    inputPath = entry
    inputCode = fs.readFileSync(entry, 'utf-8')
  }

  try {
    const result = swc.transformSync(inputCode, {
      filename: inputPath,
      jsc: {
        target: target?.includes('esnext') || target?.includes('es2022') ? 'es2022' : 'es2020',
        parser: inputPath.endsWith('.ts') || inputPath.endsWith('.tsx')
          ? { syntax: 'typescript', tsx: inputPath.endsWith('.tsx') }
          : { syntax: 'ecmascript', jsx: inputPath.endsWith('.jsx') },
        transform: {},
        keepClassNames: true,
      },
      module: {
        type: format === 'cjs' ? 'commonjs' : 'es6',
      },
      minify: !!minify,
      sourceMaps: sourcemap === true || sourcemap === 'inline' ? 'inline' : false,
    })

    const outputText = result.code

    if (write && outfile) {
      const dir = path.dirname(outfile)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(outfile, outputText, 'utf-8')
    }

    return {
      outputFiles: write ? undefined : [{ text: outputText, path: outfile || inputPath }],
      errors: [],
      warnings: [],
      metafile: { inputs: {}, outputs: {} }
    }
  } catch (err) {
    return {
      outputFiles: [],
      errors: [{ text: err.message, location: null }],
      warnings: [],
    }
  }
}

async function transform(input, options = {}) {
  const { target, format = 'esm', loader = 'js', sourcemap = false, minify = false } = options

  try {
    const result = await swc.transform(input, {
      jsc: {
        target: target?.includes('esnext') ? 'es2022' : 'es2020',
        parser: loader === 'ts' || loader === 'tsx'
          ? { syntax: 'typescript', tsx: loader === 'tsx' }
          : { syntax: 'ecmascript', jsx: loader === 'jsx' },
        keepClassNames: true,
      },
      module: { type: format === 'cjs' ? 'commonjs' : 'es6' },
      minify: !!minify,
      sourceMaps: sourcemap ? true : false,
    })

    return {
      code: result.code,
      map: result.map || '',
      warnings: [],
    }
  } catch (err) {
    return { code: '', map: '', warnings: [{ text: err.message }] }
  }
}

function transformSync(input, options = {}) {
  const { target, format = 'esm', loader = 'js', sourcemap = false, minify = false } = options

  try {
    const result = swc.transformSync(input, {
      jsc: {
        target: target?.includes('esnext') ? 'es2022' : 'es2020',
        parser: loader === 'ts' || loader === 'tsx'
          ? { syntax: 'typescript', tsx: loader === 'tsx' }
          : { syntax: 'ecmascript', jsx: loader === 'jsx' },
        keepClassNames: true,
      },
      module: { type: format === 'cjs' ? 'commonjs' : 'es6' },
      minify: !!minify,
      sourceMaps: sourcemap ? true : false,
    })

    return { code: result.code, map: result.map || '', warnings: [] }
  } catch (err) {
    return { code: '', map: '', warnings: [{ text: err.message }] }
  }
}

// Stub: formatMessages - Vite 需要但 config bundling 不用
async function formatMessages(messages, options = {}) {
  return messages.map(m => ({ ...m, text: m.text || '' }))
}

// Stub: analyzeMetafile
async function analyzeMetafile(metafile, options = {}) {
  return '{}'
}

// Stub: context (用于 esbuild watch 模式)
async function context(options = {}) {
  return {
    rebuild: () => build(options),
    dispose: () => {},
    cancel: () => {},
    watch: () => {},
    serve: () => ({}),
  }
}

// Stub: stop
function stop() {}

// version
const version = '0.27.3'

export { build, buildSync, transform, transformSync, formatMessages, analyzeMetafile, context, stop, version }
export default { build, buildSync, transform, transformSync, formatMessages, analyzeMetafile, context, stop, version }
