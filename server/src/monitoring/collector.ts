/**
 * @file 资源采集器
 * @description 定时采集后端进程资源、事件循环延迟、依赖健康与接口错误率，
 *              采样点写入定长环形缓冲（默认 300 点 ≈ 25 分钟），不落库。
 *              所有外部依赖通过构造函数注入，便于在测试中完全控制。
 * @module server/monitoring/collector
 */

import os from 'node:os'
import process from 'node:process'
import { monitorEventLoopDelay } from 'node:perf_hooks'
import { getPoolStatus } from '../database/pool.js'
import { getRedis } from '../services/ai/redisClient.js'
import logger from '../utils/logger.js'

/** 数据库连接池状态 */
export interface DbPoolStatus {
  totalConnections: number
  activeConnections: number
  idleConnections: number
  waitingRequests: number
  connectionLimit: number
}

/** 事件循环延迟（毫秒） */
export interface EventLoopLag {
  mean: number
  p95: number
  max: number
}

/** 单次请求记录 */
export interface RequestRecord {
  requestId: string
  method: string
  route: string
  statusCode: number
  durationMs: number
  timestamp: number
}

/** 请求窗口统计 */
export interface RequestStats {
  count: number
  errorRate5xx: number
  p95LatencyMs: number
  rpm: number
}

/** 单次采样结果 */
export interface MetricSample {
  timestamp: number
  cpuPercent: number
  rssMb: number
  heapUsedMb: number
  heapTotalMb: number
  externalMb: number
  systemMemTotalMb: number
  systemMemUsedPercent: number
  /** 进程常驻内存占系统总内存的比例，是 OOM 风险的直接指标 */
  rssPercent: number
  eventLoop: EventLoopLag
  dbPool: DbPoolStatus
  redis: { up: boolean; latencyMs: number | null }
  requests: RequestStats
}

/** 采集器的外部依赖集合，全部可注入以隔离测试 */
export interface CollectorDeps {
  cpuUsage: () => { user: number; system: number }
  memoryUsage: () => { rss: number; heapUsed: number; heapTotal: number; external: number }
  systemMemory: () => { total: number; free: number }
  eventLoopDelay: () => { mean: number; p95: number; max: number }
  getPoolStatus: () => DbPoolStatus
  pingRedis: () => Promise<number>
  cpuCount: number
}

export interface CollectorOptions {
  capacity?: number
  intervalMs?: number
  windowMs?: number
}

const BYTES_PER_MB = 1024 * 1024
const NS_PER_MS = 1_000_000
const US_PER_MS = 1_000
const DEFAULT_CAPACITY = 300
const DEFAULT_INTERVAL_MS = 5_000
const DEFAULT_WINDOW_MS = 60_000
const REDIS_PING_TIMEOUT_MS = 1_000

/**
 * 定长环形缓冲
 * @description 超出容量后覆盖最旧数据，避免 shift 的 O(n) 拷贝
 */
export class RingBuffer<T> {
  private readonly items: T[]
  private writeIndex = 0
  private filled = 0

  constructor(private readonly capacity: number) {
    this.items = new Array<T>(capacity)
  }

  get size(): number {
    return this.filled
  }

  push(item: T): void {
    this.items[this.writeIndex] = item
    this.writeIndex = (this.writeIndex + 1) % this.capacity
    if (this.filled < this.capacity) this.filled += 1
  }

  toArray(): T[] {
    if (this.filled < this.capacity) return this.items.slice(0, this.filled)
    return [...this.items.slice(this.writeIndex), ...this.items.slice(0, this.writeIndex)]
  }
}

/**
 * 计算 P95
 * @param values 数值数组
 * @returns P95 值，空数组返回 0
 */
function percentile95(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.ceil(0.95 * sorted.length) - 1)
  return sorted[Math.max(0, index)]
}

/**
 * 数值保留两位小数
 * @param value 原值
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * 归一化数值：非有限值归零
 * @description 事件循环直方图在无样本时会返回 NaN，NaN 经 JSON 序列化变成 null，
 *              会让前端图表出现空洞，因此统一收敛为 0
 */
function finite(value: number): number {
  return Number.isFinite(value) ? value : 0
}

let loopHistogram: ReturnType<typeof monitorEventLoopDelay> | null = null

/**
 * 获取事件循环延迟直方图（首次访问时创建并启用）
 * @description 由 libuv 在独立线程采样，比 setTimeout 打点更准确：
 *              setTimeout 本身会被事件循环阻塞所影响，测出的延迟偏低
 */
function getLoopHistogram(): ReturnType<typeof monitorEventLoopDelay> {
  if (!loopHistogram) {
    loopHistogram = monitorEventLoopDelay({ resolution: 10 })
    loopHistogram.enable()
  }
  return loopHistogram
}

async function defaultPingRedis(): Promise<number> {
  const client = getRedis()
  const started = Date.now()
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Redis ping timeout')), REDIS_PING_TIMEOUT_MS)
  })
  await Promise.race([client.ping(), timeout])
  return Date.now() - started
}

/**
 * 构造默认依赖（真实系统实现）
 */
export function createDefaultDeps(): CollectorDeps {
  return {
    cpuUsage: () => process.cpuUsage(),
    memoryUsage: () => process.memoryUsage(),
    systemMemory: () => ({ total: os.totalmem(), free: os.freemem() }),
    eventLoopDelay: () => {
      const h = getLoopHistogram()
      return { mean: h.mean, p95: h.percentile(95), max: h.max }
    },
    getPoolStatus: () => getPoolStatus(),
    pingRedis: defaultPingRedis,
    cpuCount: os.cpus().length
  }
}

/**
 * 资源采集器
 * @description 负责采样、缓冲与请求窗口统计，不负责阈值判定（由 AlertEngine 承担）
 */
export class MetricsCollector {
  private readonly deps: CollectorDeps
  private readonly buffer: RingBuffer<MetricSample>
  private readonly intervalMs: number
  private readonly windowMs: number
  private requests: RequestRecord[] = []
  private timer: NodeJS.Timeout | null = null
  private lastCpu: { user: number; system: number } | null = null
  private lastCollectAt = 0

  constructor(deps?: Partial<CollectorDeps>, options: CollectorOptions = {}) {
    // 就地补全缺失依赖而非浅拷贝：调用方持有同一对象引用，
    // 便于测试中替换依赖后立即生效，也避免为已注入的依赖创建真实资源
    const target = (deps ?? {}) as Partial<CollectorDeps>
    if (!target.cpuUsage) target.cpuUsage = () => process.cpuUsage()
    if (!target.memoryUsage) target.memoryUsage = () => process.memoryUsage()
    if (!target.systemMemory) target.systemMemory = () => ({ total: os.totalmem(), free: os.freemem() })
    if (!target.eventLoopDelay) target.eventLoopDelay = createDefaultDeps().eventLoopDelay
    if (!target.getPoolStatus) target.getPoolStatus = () => getPoolStatus()
    if (!target.pingRedis) target.pingRedis = defaultPingRedis
    if (!target.cpuCount) target.cpuCount = os.cpus().length
    this.deps = target as CollectorDeps

    this.buffer = new RingBuffer<MetricSample>(options.capacity ?? DEFAULT_CAPACITY)
    this.intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS
    this.windowMs = options.windowMs ?? DEFAULT_WINDOW_MS
  }

  /**
   * 执行一次采样
   * @param elapsedMs 距离上次采样的毫秒数；省略时按真实时间差计算
   */
  async collect(elapsedMs?: number): Promise<MetricSample> {
    const now = Date.now()
    const sample = await this.buildSample(now, elapsedMs)
    this.buffer.push(sample)
    return sample
  }

  private async buildSample(now: number, elapsedMs?: number): Promise<MetricSample> {
    const cpu = this.deps.cpuUsage()
    const interval = elapsedMs ?? (this.lastCollectAt > 0 ? now - this.lastCollectAt : 0)

    let cpuPercent = 0
    if (this.lastCpu && interval > 0) {
      const deltaUs = (cpu.user - this.lastCpu.user) + (cpu.system - this.lastCpu.system)
      cpuPercent = (deltaUs / US_PER_MS) / interval / this.deps.cpuCount * 100
    }
    this.lastCpu = cpu
    this.lastCollectAt = now

    const mem = this.deps.memoryUsage()
    const sysMem = this.deps.systemMemory()
    const loop = this.deps.eventLoopDelay()

    let redisUp = true
    let redisLatency: number | null = null
    try {
      redisLatency = await this.deps.pingRedis()
    } catch (error) {
      redisUp = false
      redisLatency = null
      logger.warn('Redis 心跳失败', { error: (error as Error).message })
    }

    return {
      timestamp: now,
      cpuPercent: round2(Math.max(0, finite(cpuPercent))),
      rssMb: round2(mem.rss / BYTES_PER_MB),
      heapUsedMb: round2(mem.heapUsed / BYTES_PER_MB),
      heapTotalMb: round2(mem.heapTotal / BYTES_PER_MB),
      externalMb: round2(mem.external / BYTES_PER_MB),
      systemMemTotalMb: round2(sysMem.total / BYTES_PER_MB),
      systemMemUsedPercent: sysMem.total > 0
        ? round2((sysMem.total - sysMem.free) / sysMem.total * 100)
        : 0,
      rssPercent: sysMem.total > 0
        ? round2(mem.rss / sysMem.total * 100)
        : 0,
      eventLoop: {
        mean: round2(finite(loop.mean) / NS_PER_MS),
        p95: round2(finite(loop.p95) / NS_PER_MS),
        max: round2(finite(loop.max) / NS_PER_MS)
      },
      dbPool: this.deps.getPoolStatus(),
      redis: { up: redisUp, latencyMs: redisLatency },
      requests: this.getRequestStats()
    }
  }

  /**
   * 记录一次请求，由中间件在请求结束时调用
   */
  recordRequest(record: RequestRecord): void {
    this.requests.push(record)
    this.pruneRequests(Date.now())
  }

  /**
   * 清理滑出窗口的过期请求
   */
  private pruneRequests(now: number): void {
    const cutoff = now - this.windowMs
    if (this.requests.length === 0) return
    const firstAlive = this.requests.findIndex(r => r.timestamp >= cutoff)
    if (firstAlive === -1) {
      this.requests = []
    } else if (firstAlive > 0) {
      this.requests = this.requests.slice(firstAlive)
    }
  }

  /**
   * 统计当前窗口内的请求表现
   */
  getRequestStats(): RequestStats {
    this.pruneRequests(Date.now())
    const count = this.requests.length
    if (count === 0) {
      return { count: 0, errorRate5xx: 0, p95LatencyMs: 0, rpm: 0 }
    }
    const errors = this.requests.filter(r => r.statusCode >= 500).length
    return {
      count,
      errorRate5xx: round2(errors / count),
      p95LatencyMs: round2(percentile95(this.requests.map(r => r.durationMs))),
      rpm: round2(count / (this.windowMs / 60_000))
    }
  }

  /**
   * 取窗口内最近的错误请求，按时间倒序
   */
  recentErrors(limit = 10): RequestRecord[] {
    this.pruneRequests(Date.now())
    return this.requests
      .filter(r => r.statusCode >= 500)
      .slice(-limit)
      .reverse()
  }

  history(): MetricSample[] {
    return this.buffer.toArray()
  }

  latest(): MetricSample | null {
    const all = this.buffer.toArray()
    return all.length > 0 ? all[all.length - 1] : null
  }

  start(): void {
    if (this.timer) return
    this.timer = setInterval(() => {
      this.collect().catch((error: Error) => {
        logger.error('定时采样失败', { error: error.message })
      })
    }, this.intervalMs)
    this.timer.unref?.()
  }

  stop(): void {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = null
  }
}
