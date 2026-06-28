import fs from 'fs'

const profile = JSON.parse(fs.readFileSync('scripts/perf-profile.json', 'utf-8'))
const nodes = profile.nodes || []

// 聚合每个函数的自耗时（self time）
const selfTime = new Map()
const totalTime = new Map()

function collect(node, parentWeight = 0) {
  const name = node.callFrame?.functionName || '(anonymous)'
  const url = node.callFrame?.url || ''
  const key = `${name} @ ${url}`
  const hitCount = node.hitCount || 0

  selfTime.set(key, (selfTime.get(key) || 0) + hitCount)

  // 总耗时包含子节点
  let subtree = hitCount
  if (node.children) {
    for (const childId of node.children) {
      const child = nodes.find((n) => n.id === childId)
      if (child) subtree += collect(child, 0)
    }
  }
  totalTime.set(key, (totalTime.get(key) || 0) + subtree)
  return subtree
}

// 找到根节点
const rootIds = new Set(nodes.map((n) => n.id))
for (const node of nodes) {
  if (node.children) {
    for (const childId of node.children) rootIds.delete(childId)
  }
}

for (const rootId of rootIds) {
  const root = nodes.find((n) => n.id === rootId)
  if (root) collect(root)
}

const totalHits = nodes.reduce((sum, n) => sum + (n.hitCount || 0), 0)

const sorted = Array.from(selfTime.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)

console.log(`总样本数: ${totalHits}`)
console.log('\n=== 自耗时 Top 20 ===')
for (const [key, hits] of sorted) {
  const pct = ((hits / totalHits) * 100).toFixed(2)
  console.log(`${pct.padStart(6)}%  ${hits.toString().padStart(5)}  ${key}`)
}
