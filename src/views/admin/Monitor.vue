<!--
  @file 系统监控面板
  @description 展示后端资源指标趋势、依赖健康、告警列表与前端问题回报，
               支持按 requestId 串联前后端证据定位问题
  @module views/admin/Monitor
-->

<template>
  <div class="monitor">
    <section class="panel toolbar">
      <div class="toolbar-left">
        <label class="switch">
          <input v-model="autoRefresh" type="checkbox" />
          <span>自动刷新（5 秒）</span>
        </label>
        <span class="updated">最后更新：{{ updatedLabel }}</span>
        <span
          v-if="schedulerHealth"
          class="self-health"
          :title="schedulerHealth.selfAlert.active ? schedulerHealth.selfAlert.message : '调度器运行正常'"
        >
          <span class="dot" :class="schedulerHealth.selfAlert.active ? 'dot-down' : 'dot-ok'"></span>
          监控自检{{ schedulerHealth.selfAlert.active ? '异常' : '正常' }}
          <template v-if="schedulerHealth.consecutiveFailures > 0">
            · 连续失败 {{ schedulerHealth.consecutiveFailures }}
          </template>
        </span>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-outline" type="button" :disabled="loading" @click="refreshAll">
          {{ loading ? '刷新中…' : '立即刷新' }}
        </button>
        <button class="btn btn-primary" type="button" @click="openReportDialog">
          回报问题
        </button>
      </div>
    </section>

    <p v-if="error" class="error-banner">{{ error }}</p>

    <!-- 资源概览 -->
    <section class="grid-cards">
      <article v-for="card in resourceCards" :key="card.key" class="panel metric-card">
        <header class="metric-head">
          <span class="metric-label">{{ card.label }}</span>
          <span class="metric-value" :class="card.level">{{ card.display }}</span>
        </header>
        <svg class="sparkline" viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true">
          <path :d="card.path" fill="none" stroke="currentColor" stroke-width="1.5" />
        </svg>
        <footer class="metric-foot">
          阈值 warn {{ card.warn }} / critical {{ card.critical }}
        </footer>
      </article>
    </section>

    <!-- 依赖健康 -->
    <section class="panel">
      <h2 class="panel-title">依赖健康</h2>
      <div class="deps">
        <div class="dep-item">
          <span class="dep-name">MySQL 连接池</span>
          <span class="dep-value">
            {{ latest?.dbPool?.activeConnections ?? 0 }} / {{ latest?.dbPool?.connectionLimit ?? 0 }} 活跃
            <span v-if="latest?.dbPool?.waitingRequests > 0" class="badge badge-warn">
              等待 {{ latest.dbPool.waitingRequests }}
            </span>
          </span>
        </div>
        <div class="dep-item">
          <span class="dep-name">Redis</span>
          <span class="dep-value">
            <span :class="latest?.redis?.up ? 'dot dot-ok' : 'dot dot-down'"></span>
            {{ latest?.redis?.up ? `在线 ${latest?.redis?.latencyMs ?? 0}ms` : '离线' }}
          </span>
        </div>
        <div class="dep-item">
          <span class="dep-name">接口（近 60 秒）</span>
          <span class="dep-value">
            {{ requestStats.count }} 次 · P95 {{ requestStats.p95LatencyMs }}ms ·
            5xx {{ (requestStats.errorRate5xx * 100).toFixed(1) }}%
          </span>
        </div>
      </div>
    </section>

    <!-- 告警列表 -->
    <section class="panel">
      <header class="panel-head">
        <h2 class="panel-title">告警</h2>
        <div class="filters">
          <select v-model="alertStatus" class="select">
            <option value="">全部状态</option>
            <option value="active">未处理</option>
            <option value="acked">已认领</option>
            <option value="resolved">已恢复</option>
          </select>
          <select v-model="alertSeverity" class="select">
            <option value="">全部级别</option>
            <option value="critical">critical</option>
            <option value="warn">warn</option>
          </select>
        </div>
      </header>

      <p v-if="!alerts.length" class="empty">当前没有符合条件的告警</p>

      <ul v-else class="alert-list">
        <li v-for="alert in alerts" :key="alert.id" class="alert-item">
          <div class="alert-main">
            <span class="badge" :class="alert.severity === 'critical' ? 'badge-critical' : 'badge-warn'">
              {{ alert.severity }}
            </span>
            <span class="alert-rule">{{ alert.rule }}</span>
            <span class="alert-metric">
              实测 {{ alert.metricValue }} / 阈值 {{ alert.threshold }}
            </span>
            <span class="badge badge-status">{{ statusLabel(alert.status) }}</span>
            <span v-if="alert.hitCount > 1" class="alert-hits">命中 {{ alert.hitCount }} 次</span>
            <span class="alert-time">{{ timeAgo(alert.createdAt) }}</span>
            <div class="alert-actions">
              <button
                v-if="alert.status === 'active'"
                class="btn btn-outline btn-sm"
                type="button"
                @click="handleAck(alert.id)"
              >
                认领
              </button>
              <button
                class="btn btn-ghost btn-sm"
                type="button"
                @click="toggleSnapshot(alert.id)"
              >
                {{ expandedId === alert.id ? '收起快照' : '查看快照' }}
              </button>
            </div>
          </div>

          <div v-if="expandedId === alert.id" class="snapshot">
            <p class="snapshot-msg">{{ alert.message }}</p>
            <div class="snapshot-grid">
              <div>
                <h4>触发时刻采样</h4>
                <pre>{{ formatSample(alert.snapshot?.sample) }}</pre>
              </div>
              <div>
                <h4>同期错误请求</h4>
                <p v-if="!alert.snapshot?.recentErrors?.length" class="empty-inline">无 5xx 记录</p>
                <ul v-else class="error-list">
                  <li v-for="err in alert.snapshot.recentErrors" :key="err.requestId">
                    <button class="link" type="button" @click="searchByRequest(err.requestId)">
                      {{ err.requestId.slice(0, 8) }}
                    </button>
                    <span>{{ err.method }} {{ err.route }}</span>
                    <span class="badge badge-critical">{{ err.statusCode }}</span>
                    <span>{{ err.durationMs }}ms</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <!-- 前端回报 -->
    <section ref="reportSection" class="panel">
      <header class="panel-head">
        <h2 class="panel-title">前端回报</h2>
        <div class="filters">
          <input
            v-model="reportRequestId"
            class="input"
            type="search"
            placeholder="按 requestId 检索"
          />
          <button class="btn btn-outline btn-sm" type="button" @click="loadReports">查询</button>
        </div>
      </header>

      <p v-if="!reports.length" class="empty">暂无回报记录</p>

      <ul v-else class="report-list">
        <li v-for="report in reports" :key="report.id" class="report-item">
          <div class="report-head">
            <span class="badge badge-status">{{ report.category }}</span>
            <span v-if="report.requestId" class="report-rid">{{ report.requestId.slice(0, 8) }}</span>
            <span class="report-time">{{ timeAgo(report.createdAt) }}</span>
          </div>
          <p class="report-msg">{{ report.message || '（无描述）' }}</p>
          <details v-if="report.browser || report.payload">
            <summary>浏览器与附加数据</summary>
            <pre>{{ JSON.stringify({ browser: report.browser, payload: report.payload }, null, 2) }}</pre>
          </details>
        </li>
      </ul>

      <div class="report-more">
        <button
          v-if="reports.length >= REPORT_PAGE_SIZE"
          class="btn btn-outline btn-sm"
          type="button"
          :disabled="reportLoading"
          @click="loadMoreReports"
        >
          {{ reportLoading ? '加载中…' : '加载更多' }}
        </button>
      </div>
    </section>

    <!-- 回报弹窗 -->
    <div v-if="reportOpen" class="modal-mask" @click.self="reportOpen = false">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="report-title">
        <h3 id="report-title">回报问题</h3>
        <label class="field">
          <span>类别</span>
          <select v-model="reportForm.category" class="select">
            <option value="frontend_error">前端报错</option>
            <option value="slow_page">页面卡顿</option>
            <option value="api_failure">接口失败</option>
            <option value="manual">其他</option>
          </select>
        </label>
        <label class="field">
          <span>描述</span>
          <textarea v-model="reportForm.message" rows="4" class="input"
            placeholder="描述你遇到的问题，例如：打开成员页白屏"></textarea>
        </label>
        <label class="field">
          <span>关联 requestId（可选）</span>
          <input v-model="reportForm.requestId" class="input" placeholder="从响应头 X-Request-ID 获取" />
        </label>
        <div class="modal-actions">
          <button class="btn btn-ghost" type="button" @click="reportOpen = false">取消</button>
          <button class="btn btn-primary" type="button" :disabled="!reportForm.message" @click="submitReport">
            提交回报
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 系统监控面板逻辑
 * @description 轮询资源指标与告警，支持认领告警、查看快照、按 requestId 检索前端回报
 */

import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { monitorService } from '@/services/monitorService.js'

const REFRESH_INTERVAL = 5000
/** 前端回报分页大小 */
const REPORT_PAGE_SIZE = 20

/** 指标与规则的原始响应 */
const metrics = ref(null)
/** 告警列表 */
const alerts = ref([])
/** 前端回报列表 */
const reports = ref([])
/** 是否自动刷新 */
const autoRefresh = ref(true)
/** 是否正在加载 */
const loading = ref(false)
/** 错误提示 */
const error = ref('')
/** 最后更新时间 */
const updatedAt = ref(null)
/** 当前展开快照的告警 ID */
const expandedId = ref('')
/** 告警状态筛选 */
const alertStatus = ref('active')
/** 告警级别筛选 */
const alertSeverity = ref('')
/** 回报检索的 requestId */
const reportRequestId = ref('')
/** 是否正在加载更多回报 */
const reportLoading = ref(false)
/** 前端回报区容器（用于检索后滚动定位） */
const reportSection = ref(null)
/** 回报弹窗开关 */
const reportOpen = ref(false)
/** 回报表单 */
const reportForm = ref({ category: 'manual', message: '', requestId: '' })

/** 轮询定时器 */
let timer = null

const latest = computed(() => metrics.value?.latest ?? null)
const history = computed(() => metrics.value?.history ?? [])
const rules = computed(() => metrics.value?.rules ?? [])
const schedulerHealth = computed(() => metrics.value?.scheduler ?? null)
const requestStats = computed(() => metrics.value?.requests ?? { count: 0, errorRate5xx: 0, p95LatencyMs: 0 })

const updatedLabel = computed(() => {
  if (!updatedAt.value) return '尚未加载'
  return new Date(updatedAt.value).toLocaleTimeString('zh-CN')
})

/**
 * 生成 sparkline 路径
 * @param {number[]} values 数值序列
 * @param {number} maxValue Y 轴上限，用于统一百分比类指标的比例尺
 */
function buildPath(values, maxValue) {
  if (!values.length) return ''
  const max = maxValue ?? Math.max(...values, 1)
  const range = max || 1
  return values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * 120
      const y = 32 - Math.min(Math.max(v / range, 0), 1) * 32
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

/**
 * 取某规则的配置
 */
function ruleOf(name) {
  return rules.value.find(r => r.name === name) ?? { warn: null, critical: null, unit: '' }
}

/**
 * 根据阈值判定展示级别
 */
function levelOf(value, rule) {
  if (rule.critical !== null && value >= rule.critical) return 'level-critical'
  if (rule.warn !== null && value >= rule.warn) return 'level-warn'
  return 'level-ok'
}

/** 资源卡片数据 */
const resourceCards = computed(() => {
  const samples = history.value
  const cpuRule = ruleOf('cpu_percent')
  const rssRule = ruleOf('rss_percent')
  const loopRule = ruleOf('event_loop_p95_ms')

  const heapPercent = latest.value && latest.value.heapTotalMb > 0
    ? (latest.value.heapUsedMb / latest.value.heapTotalMb) * 100
    : 0

  return [
    {
      key: 'cpu',
      label: 'CPU 使用率',
      display: `${latest.value?.cpuPercent ?? 0}%`,
      level: levelOf(latest.value?.cpuPercent ?? 0, cpuRule),
      path: buildPath(samples.map(s => s.cpuPercent), 100),
      warn: `${cpuRule.warn}%`,
      critical: `${cpuRule.critical}%`
    },
    {
      // 只作观测：V8 会把堆用到接近上限才 GC，高堆占用是常态，不作为告警依据
      key: 'heap',
      label: '堆内存使用率',
      display: `${heapPercent.toFixed(1)}%`,
      level: 'level-ok',
      path: buildPath(samples.map(s => (s.heapTotalMb > 0 ? (s.heapUsedMb / s.heapTotalMb) * 100 : 0)), 100),
      warn: '仅观测',
      critical: '不告警'
    },
    {
      key: 'rss',
      label: '进程内存占比',
      display: `${latest.value?.rssPercent ?? 0}%`,
      level: levelOf(latest.value?.rssPercent ?? 0, rssRule),
      path: buildPath(samples.map(s => s.rssPercent ?? 0), 100),
      warn: `${rssRule.warn}%`,
      critical: `${rssRule.critical}%`
    },
    {
      key: 'loop',
      label: '事件循环 P95',
      display: `${latest.value?.eventLoop?.p95 ?? 0}ms`,
      level: levelOf(latest.value?.eventLoop?.p95 ?? 0, loopRule),
      path: buildPath(samples.map(s => s.eventLoop?.p95 ?? 0)),
      warn: `${loopRule.warn}ms`,
      critical: `${loopRule.critical}ms`
    },
    {
      key: 'sysmem',
      label: '系统内存',
      display: `${latest.value?.systemMemUsedPercent ?? 0}%`,
      level: 'level-ok',
      path: buildPath(samples.map(s => s.systemMemUsedPercent), 100),
      warn: '—',
      critical: '—'
    }
  ]
})

/**
 * 相对时间展示
 */
function timeAgo(timestamp) {
  if (!timestamp) return '—'
  const diff = Date.now() - timestamp
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  return new Date(timestamp).toLocaleString('zh-CN')
}

/**
 * 状态中文标签
 */
function statusLabel(status) {
  return { active: '未处理', acked: '已认领', resolved: '已恢复' }[status] ?? status
}

/**
 * 格式化快照采样，避免直接 dumping 大对象
 */
function formatSample(sample) {
  if (!sample) return '（无数据）'
  return [
    `CPU ${sample.cpuPercent}%`,
    `堆 ${sample.heapUsedMb}/${sample.heapTotalMb} MB`,
    `事件循环 P95 ${sample.eventLoop?.p95 ?? 0}ms`,
    `DB 等待 ${sample.dbPool?.waitingRequests ?? 0}`,
    `Redis ${sample.redis?.up ? `在线 ${sample.redis.latencyMs}ms` : '离线'}`
  ].join('\n')
}

/**
 * 加载监控指标
 */
async function loadMetrics() {
  // points=60：请求后端对 300 点历史降采样，面板 sparkline 趋势不变、响应更轻
  metrics.value = await monitorService.getMetrics({ points: 60 })
}

/**
 * 加载告警列表
 */
async function loadAlerts() {
  const params = { limit: 50 }
  if (alertStatus.value) params.status = alertStatus.value
  if (alertSeverity.value) params.severity = alertSeverity.value
  alerts.value = await monitorService.getAlerts(params)
}

/**
 * 加载前端回报（首页数据）
 */
async function loadReports() {
  const params = { limit: REPORT_PAGE_SIZE }
  if (reportRequestId.value) params.requestId = reportRequestId.value
  reports.value = await monitorService.getReports(params)
}

/**
 * 追加式加载更多回报（按当前已加载条数偏移）
 */
async function loadMoreReports() {
  if (reportLoading.value) return
  reportLoading.value = true
  try {
    const params = { limit: REPORT_PAGE_SIZE, offset: reports.value.length }
    if (reportRequestId.value) params.requestId = reportRequestId.value
    const more = await monitorService.getReports(params)
    if (more.length > 0) {
      reports.value = [...reports.value, ...more]
    }
  } catch {
    // 加载更多失败保持现状，不打断面板
  } finally {
    reportLoading.value = false
  }
}

/**
 * 刷新全部数据
 */
async function refreshAll() {
  loading.value = true
  error.value = ''
  try {
    await Promise.all([loadMetrics(), loadAlerts(), loadReports()])
    updatedAt.value = Date.now()
  } catch (err) {
    error.value = err.response?.data?.error || '监控数据加载失败，请确认后端服务状态'
  } finally {
    loading.value = false
  }
}

/**
 * 认领告警
 */
async function handleAck(id) {
  try {
    await monitorService.ackAlert(id)
    await loadAlerts()
  } catch (err) {
    error.value = err.response?.data?.error || '认领失败'
  }
}

/**
 * 展开或收起快照
 */
function toggleSnapshot(id) {
  expandedId.value = expandedId.value === id ? '' : id
}

/**
 * 按 requestId 检索回报并滚动到回报区
 */
async function searchByRequest(requestId) {
  reportRequestId.value = requestId
  await loadReports()
  await nextTick()
  if (reportSection.value) {
    reportSection.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

/**
 * 打开回报弹窗
 */
function openReportDialog() {
  reportForm.value = { category: 'manual', message: '', requestId: '' }
  reportOpen.value = true
}

/**
 * 提交回报
 */
async function submitReport() {
  await monitorService.reportIssue({
    category: reportForm.value.category,
    message: reportForm.value.message,
    requestId: reportForm.value.requestId || null
  })
  reportOpen.value = false
  await loadReports()
}

/**
 * 启动轮询
 */
function startTimer() {
  stopTimer()
  timer = setInterval(() => {
    refreshAll().catch(() => {})
  }, REFRESH_INTERVAL)
}

/**
 * 停止轮询
 */
function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

watch([autoRefresh, alertStatus, alertSeverity], () => {
  if (autoRefresh.value) {
    startTimer()
  } else {
    stopTimer()
  }
  refreshAll().catch(() => {})
})

onMounted(() => {
  refreshAll().catch(() => {})
  if (autoRefresh.value) startTimer()
})

onBeforeUnmount(stopTimer)
</script>

<style scoped>
.monitor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel {
  padding: 1rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 8px);
  background: rgba(255, 255, 255, 0.02);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-text-dim);
  cursor: pointer;
}

.updated {
  font-size: 0.75rem;
  color: var(--color-text-dim);
}

.error-banner {
  margin: 0;
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--color-status-danger, #e24b4a);
  border-radius: var(--radius-sm, 4px);
  color: var(--color-status-danger, #e24b4a);
  font-size: 0.8rem;
}

.grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.metric-label {
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.metric-value {
  font-size: 1.35rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.level-ok { color: var(--color-highlight); }
.level-warn { color: #ef9f27; }
.level-critical { color: #e24b4a; }

.sparkline {
  width: 100%;
  height: 32px;
  color: var(--color-accent);
}

.metric-foot {
  font-size: 0.7rem;
  color: var(--color-text-dim);
}

.panel-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.deps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.dep-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
}

.dep-name {
  color: var(--color-text-dim);
  font-size: 0.75rem;
}

.dep-value {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.self-health {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--color-text-dim);
  cursor: help;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot-ok { background: #1d9e75; }
.dot-down { background: #e24b4a; }

.filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.select,
.input {
  padding: 0.4rem 0.6rem;
  min-height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm, 4px);
  background: transparent;
  color: var(--color-text-body);
  font-size: 0.8rem;
}

.input {
  min-width: 180px;
}

.alert-list,
.report-list,
.error-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-item {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm, 4px);
}

.alert-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.82rem;
}

.alert-rule {
  font-weight: 600;
  font-family: var(--font-mono, monospace);
}

.alert-metric,
.alert-hits,
.alert-time,
.report-time {
  color: var(--color-text-dim);
  font-size: 0.75rem;
}

.alert-actions {
  margin-left: auto;
  display: flex;
  gap: 0.4rem;
}

.badge {
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid var(--color-border);
  color: var(--color-text-dim);
}

.badge-critical {
  border-color: #e24b4a;
  color: #e24b4a;
}

.badge-warn {
  border-color: #ef9f27;
  color: #ef9f27;
}

.badge-status {
  border-color: var(--color-accent);
  color: var(--color-highlight);
}

.snapshot {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--color-border);
}

.snapshot-msg {
  margin: 0 0 0.6rem;
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.snapshot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.snapshot-grid h4 {
  margin: 0 0 0.4rem;
  font-size: 0.75rem;
  color: var(--color-text-dim);
  font-weight: 500;
}

.snapshot-grid pre,
.report-item pre {
  margin: 0;
  padding: 0.5rem;
  border-radius: var(--radius-sm, 4px);
  background: rgba(0, 0, 0, 0.35);
  font-size: 0.72rem;
  line-height: 1.5;
  overflow-x: auto;
}

.error-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.link {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-highlight);
  text-decoration: underline;
  cursor: pointer;
  font-family: var(--font-mono, monospace);
  font-size: 0.75rem;
}

.report-item {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm, 4px);
}

.report-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.report-rid {
  font-family: var(--font-mono, monospace);
  font-size: 0.75rem;
  color: var(--color-highlight);
}

.report-msg {
  margin: 0.4rem 0;
  font-size: 0.82rem;
}

.report-more {
  display: flex;
  justify-content: center;
  margin-top: 0.75rem;
}

.report-item summary {
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--color-text-dim);
}

.empty,
.empty-inline {
  margin: 0;
  padding: 1rem 0;
  color: var(--color-text-dim);
  font-size: 0.8rem;
  text-align: center;
}

.empty-inline {
  padding: 0.25rem 0;
  text-align: left;
}

.btn {
  padding: 0.45rem 0.9rem;
  min-height: 36px;
  border-radius: var(--radius-sm, 4px);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-body);
  font-size: 0.8rem;
  cursor: pointer;
  transition: opacity var(--duration-fast);
}

.btn:hover:not(:disabled) {
  opacity: 0.8;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.25rem 0.6rem;
  min-height: 30px;
  font-size: 0.72rem;
}

.btn-primary {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: #040810;
  font-weight: 500;
}

.btn-ghost {
  border-color: transparent;
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.65);
}

.modal {
  width: min(460px, 100%);
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 8px);
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.78rem;
  color: var(--color-text-dim);
}

.field .input {
  width: 100%;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

@media (max-width: 640px) {
  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
