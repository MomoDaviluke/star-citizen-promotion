/**
 * @file CSS 变量名迁移脚本（TD-13）
 * @description 批量将 deprecated 别名替换为语义化变量名。
 *              映射来源：src/styles/variables.css 的 @deprecated-aliases 区块。
 *              仅替换 var(--old) 形式，避免误伤定义本身。排除 variables.css。
 * @module scripts/css-var-migrate
 * @version 1.0
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { glob } from 'node:fs/promises'

/**
 * deprecated 别名 -> 新变量名 映射表
 * @description 顺序敏感：长名称必须在短名称之前，避免部分匹配
 *              使用 var\(\s*--old\s*\) 模式，仅替换引用，不替换定义
 */
const MIGRATIONS = [
  // 文本类（长名优先）
  { from: /var\(\s*--text-primary\s*\)/g, to: 'var(--color-text-heading)' },
  { from: /var\(\s*--text-secondary\s*\)/g, to: 'var(--color-text-label)' },
  { from: /var\(\s*--text-muted\s*\)/g, to: 'var(--color-text-dim)' },
  { from: /var\(\s*--text\s*\)/g, to: 'var(--color-text-body)' },
  // 强调色
  { from: /var\(\s*--accent-2\s*\)/g, to: 'var(--color-highlight)' },
  { from: /var\(\s*--accent\s*\)/g, to: 'var(--color-accent)' },
  { from: /var\(\s*--color-primary\s*\)/g, to: 'var(--color-accent)' },
  // 状态色
  { from: /var\(\s*--danger\s*\)/g, to: 'var(--color-status-danger)' },
  { from: /var\(\s*--warning\s*\)/g, to: 'var(--color-status-warning)' },
  { from: /var\(\s*--success\s*\)/g, to: 'var(--color-status-online)' },
  { from: /var\(\s*--color-danger\s*\)/g, to: 'var(--color-status-danger)' },
  { from: /var\(\s*--color-warning\s*\)/g, to: 'var(--color-status-warning)' },
  { from: /var\(\s*--color-success\s*\)/g, to: 'var(--color-status-online)' },
  { from: /var\(\s*--status-danger\s*\)/g, to: 'var(--color-status-danger)' },
  { from: /var\(\s*--status-warning\s*\)/g, to: 'var(--color-status-warning)' },
  { from: /var\(\s*--status-online\s*\)/g, to: 'var(--color-status-online)' },
  { from: /var\(\s*--status-offline\s*\)/g, to: 'var(--color-status-offline)' },
  // 边框
  { from: /var\(\s*--border-medium\s*\)/g, to: 'var(--color-border)' },
  { from: /var\(\s*--border-subtle\s*\)/g, to: 'var(--color-border-subtle)' },
  { from: /var\(\s*--border-strong\s*\)/g, to: 'var(--color-border-strong)' },
  { from: /var\(\s*--border-light\s*\)/g, to: 'var(--color-border-subtle)' },
  { from: /var\(\s*--line\s*\)/g, to: 'var(--color-border)' },
  // 背景
  { from: /var\(\s*--bg-medium\s*\)/g, to: 'var(--color-bg-mid)' },
  { from: /var\(\s*--bg-deepest\s*\)/g, to: 'var(--raw-void-1)' },
  { from: /var\(\s*--bg-light\s*\)/g, to: 'var(--color-bg-elevated)' },
  { from: /var\(\s*--bg-card\s*\)/g, to: 'var(--color-bg-card)' },
  { from: /var\(\s*--bg-overlay\s*\)/g, to: 'var(--color-bg-overlay)' },
  { from: /var\(\s*--bg\s*\)/g, to: 'var(--color-bg)' },
  { from: /var\(\s*--panel\s*\)/g, to: 'var(--color-bg-surface)' },
  { from: /var\(\s*--void-deepest\s*\)/g, to: 'var(--raw-void-1)' },
  { from: /var\(\s*--void-surface\s*\)/g, to: 'var(--raw-void-4)' },
  // 过渡时长
  { from: /var\(\s*--transition-fast\s*\)/g, to: 'var(--duration-fast)' },
  { from: /var\(\s*--transition-normal\s*\)/g, to: 'var(--duration-normal)' },
  { from: /var\(\s*--transition-slow\s*\)/g, to: 'var(--duration-slow)' },
  // 光晕
  { from: /var\(\s*--glow-primary\s*\)/g, to: 'var(--glow-accent)' },
  { from: /var\(\s*--glow-cyan\s*\)/g, to: 'var(--glow-accent)' },
  { from: /var\(\s*--glow-strong\s*\)/g, to: 'var(--glow-accent)' },
  { from: /var\(\s*--glow-danger\s*\)/g, to: 'var(--glow-status-danger)' },
  { from: /var\(\s*--glow-success\s*\)/g, to: 'var(--glow-status-success)' },
  // 星云
  { from: /var\(\s*--nebula-violet\s*\)/g, to: 'var(--nebula-purple)' },
  { from: /var\(\s*--nebula-glow\s*\)/g, to: 'var(--nebula-purple)' },
  { from: /var\(\s*--glow-color\s*\)/g, to: 'var(--nebula-purple)' },
  // 其他
  { from: /var\(\s*--data-flow\s*\)/g, to: 'var(--raw-cyan)' },
  { from: /var\(\s*--link-index\s*\)/g, to: 'var(--color-accent)' },
  { from: /var\(\s*--glow-nebula\s*\)/g, to: 'var(--glow-accent)' },
  { from: /var\(\s*--duration-launch\s*\)/g, to: 'var(--duration-slow)' }
]

/** 排除的文件：变量定义文件本身，避免自引用 */
const EXCLUDE = ['src/styles/variables.css']

/** 待处理的文件模式 */
const PATTERNS = [
  'src/components/**/*.vue',
  'src/views/**/*.vue',
  'src/styles/**/*.css',
  'src/**/*.js'
]

/**
 * 主函数：遍历文件，应用迁移
 */
async function main() {
  const files = []
  for (const pattern of PATTERNS) {
    for await (const f of glob(pattern, { cwd: process.cwd() })) {
      const normalized = f.replace(/\\/g, '/')
      if (!EXCLUDE.includes(normalized)) {
        files.push(f)
      }
    }
  }

  let totalReplaced = 0
  let modifiedFiles = 0

  for (const file of files) {
    let content = readFileSync(file, 'utf8')
    let fileReplaced = 0

    for (const { from, to } of MIGRATIONS) {
      const matches = content.match(from)
      if (matches) {
        fileReplaced += matches.length
        content = content.replace(from, to)
      }
    }

    if (fileReplaced > 0) {
      writeFileSync(file, content, 'utf8')
      console.log(`  ${file}: ${fileReplaced} 处替换`)
      totalReplaced += fileReplaced
      modifiedFiles++
    }
  }

  console.log(`\n✅ 共修改 ${modifiedFiles} 个文件，${totalReplaced} 处替换`)
}

main().catch((err) => {
  console.error('❌ 迁移失败:', err)
  process.exit(1)
})
