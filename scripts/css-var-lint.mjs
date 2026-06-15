#!/usr/bin/env node

/**
 * CSS Variable Integrity Lint
 * Scans all var() references in src/ and cross-checks against :root definitions.
 * Exit 0 = clean, Exit 1 = broken refs found.
 * Usage: node scripts/css-var-lint.mjs [project-root]
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';

const projectRoot = resolve(process.argv[2] || '.');
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
    try { statSync(full); return full; } catch {}
  }
  // fallback: global search
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
    } catch {}
  }
  return null;
}

// ── extract :root definitions ─────────────────────────────────────
function extractDefs(filePath) {
  const src = readFileSync(filePath, 'utf-8');
  const defs = new Set();
  // Match both :root and [data-theme] blocks
  const blockRe = /(:root|\[data-theme[^\]]*\])\s*\{([^}]*)\}/g;
  let m;
  while ((m = blockRe.exec(src))) {
    const body = m[2];
    const varRe = /(--[\w-]+)\s*:/g;
    let v;
    while ((v = varRe.exec(body))) defs.add(v[1]);
  }
  return defs;
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
  } catch {}
  return files;
}

// ── scan var() references ─────────────────────────────────────────
function scanFile(filePath, defs) {
  const src = readFileSync(filePath, 'utf-8');
  const broken = [];
  // Also check CSS custom property references like var(--name, fallback)
  const varRe = /var\(\s*(--[\w-]+)/g;
  let m;
  while ((m = varRe.exec(src))) {
    const name = m[1];
    if (!defs.has(name)) {
      // find line number
      const line = src.slice(0, m.index).split('\n').length;
      broken.push({ file: filePath, line, name });
    }
  }
  return broken;
}

// ── main ──────────────────────────────────────────────────────────
const varFile = findVariablesFile();
if (!varFile) {
  console.error('❌ Cannot find variables.css');
  process.exit(2);
}

const defs = extractDefs(varFile);
console.log(`📋 Found ${defs.size} CSS variable definitions in ${varFile.replace(projectRoot, '.')}`);

const files = collectFiles(SRC_DIR);
console.log(`📂 Scanning ${files.length} source files...\n`);

const allBroken = [];
for (const f of files) {
  allBroken.push(...scanFile(f, defs));
}

if (allBroken.length === 0) {
  console.log('✅ No broken CSS variable references found.');
  process.exit(0);
}

// dedupe by file+name (one report per unique pair)
const seen = new Set();
const unique = [];
for (const b of allBroken) {
  const key = `${b.file}:${b.name}`;
  if (seen.has(key)) continue;
  seen.add(key);
  unique.push(b);
}

// group by variable name for cleaner output
const byName = {};
for (const b of unique) {
  (byName[b.name] ??= []).push(b);
}

console.error(`❌ Found ${unique.length} broken CSS variable reference(s):\n`);
for (const [name, refs] of Object.entries(byName).sort((a, b) => b[1].length - a[1].length)) {
  console.error(`  ${name}  (${refs.length} ref${refs.length > 1 ? 's' : ''})`);
  for (const r of refs) {
    const rel = r.file.replace(projectRoot, '.');
    console.error(`    ${rel}:${r.line}`);
  }
}
console.error('');
process.exit(1);
