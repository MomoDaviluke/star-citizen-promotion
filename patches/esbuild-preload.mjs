/**
 * esbuild-preload.mjs - 在进程启动时替换 esbuild 模块为 mock-esbuild
 * 使用 --import 标志在主模块之前加载
 */

import { register } from 'node:module'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const cwd = pathToFileURL(path.resolve(process.cwd())).href + '/'
const mockEsbuild = pathToFileURL(path.resolve(process.cwd(), 'patches', 'mock-esbuild.mjs')).href

// 注册自定义 loader 拦截 esbuild 导入
register(
  `data:text/javascript,
  const mockURL = "${mockEsbuild}";
  export async function resolve(specifier, context, nextResolve) {
    if (specifier === "esbuild" || specifier.endsWith("/esbuild") || specifier.includes("esbuild/lib/main")) {
      return { url: mockURL, format: "module", shortCircuit: true };
    }
    return nextResolve(specifier, context);
  }
  export async function load(url, context, nextLoad) {
    if (url === mockURL) {
      const result = await nextLoad(url, context);
      return result;
    }
    return nextLoad(url, context);
  }
  `,
  { parentURL: import.meta.url }
)

console.log('[esbuild-preload] esbuild module replaced with SWC-based mock')
