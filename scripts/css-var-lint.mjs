#!/usr/bin/env node

/**
 * CSS Variable Integrity Lint
 *
 * Modes:
 *   Default:  Checks for broken var() references (exit 1 if found)
 *   --strict: Also fails on deprecated alias usage (exit 1)
 *
 * Exit codes: 0 = clean, 1 = issues found, 2 = config error
 * Usage: node scripts/css-var-lint.mjs [--strict] [project-root]
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const projectRoot = resolve(args.find(a => !a.startsWith('--')) || '.');
const SRC_DIR = join(projectRoot, 'src');

// ── locate variables.css ──────────────────────────────────────────
const CANDIDATE_PATHS = [
  'src/styles/variables.css',
  'src/assets/variables.css',
  'src/variables.css',
  'src/styles/_variables.css',
  'src/assets/styles/variables.css',
];

function findVariablesFile() {
  for (const rel of CANDIDATE_PATHS) {
    const full = join(projectRoot, rel);
    try { statSync(full); return full; } catch { /* not found, continue */ }
  }
  const queue = [projectRoot];
  while (queue.length) {
    const dir = queue.pop();
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) { queue.push(full); continue; }
        if (entry.name === 'variables.css' || entry.name === '_variables.css') return full;
      }
    } catch { /* permission or symlink error, skip */ }
  }
  return null;
}

// ── extract definitions and deprecated aliases ────────────────────
function extractDefsAndDeprecated(filePath) {
  const src = readFileSync(filePath, 'utf-8');
  const defs = new Set();
  const deprecated = new Set();

  // Find all :root and [data-theme] blocks
  const blockRe = /(:root|\[data-theme[^\]]*\])\s*\{([^}]*)\}/g;
  let m;
  while ((m = blockRe.exec(src))) {
    const body = m[2];
    // Extract @deprecated-aliases ... @end-deprecated range
    const depRe = /\/\*\s*@deprecated-aliases[^*]*\*\/([\s\S]*?)\/\*\s*@end-deprecated\s*\*\//;
    const depMatch = body.match(depRe);
    const deprecatedPart = depMatch ? depMatch[1] : '';
    // Normal = everything outside that range
    const normalPart = depMatch
      ? body.slice(0, depMatch.index) + body.slice(depMatch.index + depMatch[0].length)
      : body;

    const varRe = /(--[\w-]+)\s*:/g;
    let v;
    while ((v = varRe.exec(normalPart))) defs.add(v[1]);
    while ((v = varRe.exec(deprecatedPart))) deprecated.add(v[1]);
  }
  return { defs, deprecated };
}

// ── collect source files ──────────────────────────────────────────
const EXTS = new Set(['.css', '.less', '.scss', '.vue', '.html', '.svelte', '.tsx', '.jsx']);
const IGNORE = new Set(['node_modules', '.git', 'dist', 'coverage', '.vscode', '.idea']);

function collectFiles(dir) {
  const files = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (IGNORE.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) { files.push(...collectFiles(full)); continue; }
      if (EXTS.has(extname(entry.name).toLowerCase())) files.push(full);
    }
  } catch { /* permission or symlink error, skip */ }
  return files;
}

// ── scan var() references ─────────────────────────────────────────
function scanFile(filePath, defs, deprecated) {
  const src = readFileSync(filePath, 'utf-8');
  const broken = [];
  const warnings = [];
  const varRe = /var\(\s*(--[\w-]+)/g;
  let m;
  while ((m = varRe.exec(src))) {
    const name = m[1];
    const line = src.slice(0, m.index).split('\n').length;
    const rel = filePath.replace(projectRoot, '.');
    if (!defs.has(name) && !deprecated.has(name)) {
      broken.push({ file: filePath, line, name });
    } else if (deprecated.has(name)) {
      warnings.push({ file: filePath, line, name, rel });
    }
  }
  return { broken, warnings };
}

// ── group and print ───────────────────────────────────────────────
function groupByName(items) {
  const groups = {};
  for (const item of items) {
    (groups[item.name] ??= []).push(item);
  }
  return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
}

// ── main ──────────────────────────────────────────────────────────
const varFile = findVariablesFile();
if (!varFile) {
  console.error('❌ Cannot find variables.css');
  process.exit(2);
}

const { defs, deprecated } = extractDefsAndDeprecated(varFile);
console.log(`📋 ${defs.size} definitions, ${deprecated.size} deprecated aliases in ${varFile.replace(projectRoot, '.')}`);

const files = collectFiles(SRC_DIR);
console.log(`📂 Scanning ${files.length} source files...\n`);

const allBroken = [];
const allWarnings = [];
for (const f of files) {
  const { broken, warnings } = scanFile(f, defs, deprecated);
  allBroken.push(...broken);
  allWarnings.push(...warnings);
}

// dedupe by file+name
function dedupe(items) {
  const seen = new Set();
  return items.filter(b => {
    const key = `${b.file}:${b.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const uniqueBroken = dedupe(allBroken);
const uniqueWarnings = dedupe(allWarnings);

// ── report deprecated warnings ────────────────────────────────────
if (uniqueWarnings.length > 0) {
  console.warn(`⚠️  ${uniqueWarnings.length} deprecated alias usage(s):\n`);
  for (const [name, refs] of groupByName(uniqueWarnings)) {
    console.warn(`  ${name}  (${refs.length} ref${refs.length > 1 ? 's' : ''})`);
    for (const r of refs) {
      console.warn(`    ${r.rel}:${r.line}`);
    }
  }
  console.warn('');
}

// ── report broken errors ──────────────────────────────────────────
if (uniqueBroken.length > 0) {
  console.error(`❌ ${uniqueBroken.length} broken CSS variable reference(s):\n`);
  for (const [name, refs] of groupByName(uniqueBroken)) {
    console.error(`  ${name}  (${refs.length} ref${refs.length > 1 ? 's' : ''})`);
    for (const r of refs) {
      const rel = r.file.replace(projectRoot, '.');
      console.error(`    ${rel}:${r.line}`);
    }
  }
  console.error('');
  process.exit(1);
}

if (uniqueWarnings.length > 0 && strict) {
  console.error('❌ Strict mode: deprecated alias usage treated as error.');
  process.exit(1);
}

if (uniqueWarnings.length > 0) {
  console.log(`✅ No broken references. ${uniqueWarnings.length} deprecated alias(es) flagged for future migration.`);
} else {
  console.log('✅ No broken references, no deprecated usage.');
}
process.exit(0);
