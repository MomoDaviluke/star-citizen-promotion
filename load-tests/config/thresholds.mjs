/**
 * @file 各层性能阈值
 * @description 压测结果判定标准，可按需调整
 * @module load-tests/config/thresholds
 */

export const THRESHOLDS = {
  /** L1 公开读端点（缓存命中）*/
  l1: {
    p95Ms: 200,
    errorRate: 0.01,
    minQps: 50
  },
  /** L1 认证端点（bcrypt 12 轮）*/
  l1Auth: {
    p95Ms: 500,
    errorRate: 0.05
  },
  /** L2 混合负载 */
  l2: {
    p95Ms: 300,
    cacheHitRate: 0.7
  },
  /** L3 稳定性长跑 */
  l3: {
    heapGrowthPct: 30,
    eventLoopLagP95Ms: 50,
    errorRate: 0.001
  },
  /** L5 前端性能（桌面标准，参考 DBG-03）*/
  l5: {
    lcp: 2500,
    cls: 0.1,
    inp: 200,
    fps: 50
  }
}
