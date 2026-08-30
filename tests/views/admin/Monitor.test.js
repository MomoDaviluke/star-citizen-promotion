/**
 * @file 系统监控面板组件测试
 * @description 覆盖轮询启停、告警筛选、认领、快照展开、回报弹窗与监控自检状态灯。
 *              后端响应结构参照 server/src/routes/monitor.ts 的 res.json 契约。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

// ---- mock 监控服务（hoisted，C2 约束）----
const getMetrics = vi.fn()
const getAlerts = vi.fn()
const ackAlert = vi.fn()
const getReports = vi.fn()
const reportIssue = vi.fn()

vi.mock('@/services/monitorService.js', () => ({
  monitorService: { getMetrics, getAlerts, ackAlert, getReports, reportIssue }
}))

/** 构造一份符合 /monitor/metrics 契约的指标数据 */
function makeMetrics(overrides = {}) {
  return {
    latest: {
      cpuPercent: 35,
      rssPercent: 12.5,
      heapUsedMb: 80,
      heapTotalMb: 256,
      eventLoop: { mean: 2, p95: 5, max: 12 },
      dbPool: { activeConnections: 2, connectionLimit: 10, waitingRequests: 0 },
      redis: { up: true, latencyMs: 1 },
      systemMemTotalMb: 16384,
      systemMemUsedPercent: 40,
      rssMb: 2048
    },
    history: [
      { cpuPercent: 30, rssPercent: 12, heapUsedMb: 78, heapTotalMb: 256, eventLoop: { p95: 4 }, systemMemUsedPercent: 39 },
      { cpuPercent: 35, rssPercent: 12.5, heapUsedMb: 80, heapTotalMb: 256, eventLoop: { p95: 5 }, systemMemUsedPercent: 40 }
    ],
    rules: [
      { name: 'cpu_percent', label: 'CPU 使用率', unit: '%', warn: 70, critical: 90, consecutivePoints: 2 },
      { name: 'rss_percent', label: '进程内存占系统比例', unit: '%', warn: 70, critical: 85, consecutivePoints: 2 },
      { name: 'event_loop_p95_ms', label: '事件循环 P95 延迟', unit: 'ms', warn: 100, critical: 300, consecutivePoints: 1 },
      { name: 'error_rate_5xx', label: '5xx 错误率', unit: '%', warn: 0.05, critical: 0.15, consecutivePoints: 1 }
    ],
    alerts: { active: 0, critical: 0, latest: [] },
    requests: { count: 10, errorRate5xx: 0.02, p95LatencyMs: 8, rpm: 10 },
    scheduler: { running: true, consecutiveFailures: 0, selfAlert: { active: false, since: null, message: null } },
    ...overrides
  }
}

const mockAlert = {
  id: 'alert-1',
  rule: 'cpu_percent',
  severity: 'critical',
  metricValue: 95,
  threshold: 90,
  status: 'active',
  hitCount: 3,
  message: '[cpu_percent] CPU 使用率实测 95%，已达 critical 阈值 90%',
  snapshot: {
    sample: { cpuPercent: 95, heapUsedMb: 100, heapTotalMb: 256, eventLoop: { p95: 80 }, dbPool: { waitingRequests: 0 }, redis: { up: true, latencyMs: 1 } },
    recentErrors: [{ requestId: 'req-abc12345', method: 'GET', route: '/api/v1/fleet', statusCode: 503, durationMs: 1200, timestamp: 1757000000000 }],
    triggeredAt: 1757000000000
  },
  createdAt: 1757000000000,
  updatedAt: 1757000000000,
  resolvedAt: null,
  ackBy: null
}

const mockReport = {
  id: 'report-1',
  requestId: 'req-abc12345',
  category: 'frontend_error',
  message: '成员页白屏',
  browser: { userAgent: 'test' },
  payload: null,
  createdAt: 1757000000000
}

async function mountMonitor() {
  const { default: Monitor } = await import('@/views/admin/Monitor.vue')
  return mount(Monitor)
}

describe('Monitor.vue 系统监控面板', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMetrics.mockResolvedValue(makeMetrics())
    getAlerts.mockResolvedValue([])
    getReports.mockResolvedValue([])
    ackAlert.mockResolvedValue({ ...mockAlert, status: 'acked' })
    reportIssue.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('挂载即加载指标/告警/回报三接口并渲染资源卡片', async () => {
    getAlerts.mockResolvedValue([mockAlert])
    const wrapper = await mountMonitor()
    await flushPromises()

    expect(getMetrics).toHaveBeenCalled()
    expect(getAlerts).toHaveBeenCalled()
    expect(getReports).toHaveBeenCalled()

    // 资源卡片渲染出 CPU 数值与阈值说明
    const cpuCard = wrapper.find('.metric-card')
    expect(cpuCard.text()).toContain('CPU 使用率')
    expect(cpuCard.text()).toContain('35%')
    expect(cpuCard.text()).toContain('阈值 warn 70% / critical 90%')

    // 告警列表渲染 severity 徽标与认领按钮
    expect(wrapper.text()).toContain('cpu_percent')
    expect(wrapper.find('.badge-critical').text()).toBe('critical')
    wrapper.unmount()
  })

  it('关闭自动刷新后停止轮询，重新开启恢复轮询', async () => {
    vi.useFakeTimers()
    const wrapper = await mountMonitor()
    await flushPromises()

    // 默认 autoRefresh=true，存在轮询定时器
    expect(vi.getTimerCount()).toBeGreaterThan(0)

    const toggle = wrapper.find('input[type="checkbox"]')
    await toggle.setValue(false)
    await flushPromises()
    expect(vi.getTimerCount()).toBe(0)

    await toggle.setValue(true)
    await flushPromises()
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('切换告警状态筛选后以新参数重新拉取', async () => {
    const wrapper = await mountMonitor()
    await flushPromises()

    const statusSelect = wrapper.findAll('.select')[0]
    await statusSelect.setValue('acked')
    await flushPromises()

    expect(getAlerts).toHaveBeenLastCalledWith({ limit: 50, status: 'acked' })

    const severitySelect = wrapper.findAll('.select')[1]
    await severitySelect.setValue('critical')
    await flushPromises()
    expect(getAlerts).toHaveBeenLastCalledWith({ limit: 50, status: 'acked', severity: 'critical' })
    wrapper.unmount()
  })

  it('点击认领调用 ackAlert 并刷新告警列表', async () => {
    getAlerts.mockResolvedValue([mockAlert])
    const wrapper = await mountMonitor()
    await flushPromises()

    await wrapper.find('button.btn-outline.btn-sm').trigger('click')
    await flushPromises()

    expect(ackAlert).toHaveBeenCalledWith('alert-1')
    // 认领后再次拉取列表（状态更新为 acked）
    expect(getAlerts).toHaveBeenLastCalledWith({ limit: 50, status: 'active' })
    wrapper.unmount()
  })

  it('快照可展开显示采样与错误请求，可再收起', async () => {
    getAlerts.mockResolvedValue([mockAlert])
    const wrapper = await mountMonitor()
    await flushPromises()

    // 展开
    await wrapper.find('button.btn-ghost.btn-sm').trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('CPU 95%')
    // 错误请求显示 requestId 前 8 位
    expect(wrapper.text()).toContain('req-abc1')
    expect(wrapper.text()).toContain('503')

    // 收起
    await wrapper.find('button.btn-ghost.btn-sm').trigger('click')
    await nextTick()
    expect(wrapper.find('.snapshot').exists()).toBe(false)
    wrapper.unmount()
  })

  it('回报弹窗：message 为空时提交按钮禁用，填写后提交并关闭', async () => {
    const wrapper = await mountMonitor()
    await flushPromises()

    await wrapper.find('button.btn-primary').trigger('click')
    await nextTick()

    const submitBtn = wrapper.find('.modal-actions .btn-primary')
    expect(submitBtn.attributes('disabled')).toBeDefined()

    const textarea = wrapper.find('textarea')
    await textarea.setValue('打开成员页白屏')
    await flushPromises()
    expect(wrapper.find('.modal-actions .btn-primary').attributes('disabled')).toBeUndefined()

    await wrapper.find('.modal-actions .btn-primary').trigger('click')
    await flushPromises()

    expect(reportIssue).toHaveBeenCalledWith({
      category: 'manual',
      message: '打开成员页白屏',
      requestId: null
    })
    // 弹窗关闭
    expect(wrapper.find('.modal-mask').exists()).toBe(false)
    wrapper.unmount()
  })

  it('调度器自警时显示「监控自检异常」状态灯', async () => {
    getMetrics.mockResolvedValue(makeMetrics({
      scheduler: { running: true, consecutiveFailures: 4, selfAlert: { active: true, since: 1757000000000, message: '连续 4 次失败' } }
    }))
    const wrapper = await mountMonitor()
    await flushPromises()

    expect(wrapper.text()).toContain('监控自检异常')
    expect(wrapper.text()).toContain('连续失败 4')
    expect(wrapper.find('.dot-down').exists()).toBe(true)
    wrapper.unmount()
  })

  it('调度器健康时显示「监控自检正常」', async () => {
    const wrapper = await mountMonitor()
    await flushPromises()

    expect(wrapper.text()).toContain('监控自检正常')
    expect(wrapper.find('.dot-ok').exists()).toBe(true)
    wrapper.unmount()
  })

  it('指标加载失败时显示错误横幅', async () => {
    getMetrics.mockRejectedValue({ response: { data: { error: '后端不可达' } } })
    const wrapper = await mountMonitor()
    await flushPromises()

    expect(wrapper.find('.error-banner').text()).toContain('后端不可达')
    wrapper.unmount()
  })

  it('按 requestId 检索回报并加载', async () => {
    getReports.mockResolvedValue([mockReport])
    const wrapper = await mountMonitor()
    await flushPromises()

    const searchInput = wrapper.find('input[type="search"]')
    await searchInput.setValue('req-abc12345')
    await wrapper.find('.panel-head .btn-outline.btn-sm').trigger('click')
    await flushPromises()

    expect(getReports).toHaveBeenLastCalledWith({ limit: 20, requestId: 'req-abc12345' })
    expect(wrapper.text()).toContain('成员页白屏')
    wrapper.unmount()
  })

  it('回报达到一页后显示加载更多，点击追加下一页', async () => {
    const pageOne = Array.from({ length: 20 }, (_, i) => ({
      id: `report-${i}`,
      requestId: null,
      category: 'manual',
      message: `回报 ${i}`,
      browser: null,
      payload: null,
      createdAt: 1757000000000 - i
    }))
    const pageTwo = [{ ...pageOne[0], id: 'report-extra', message: '追加回报' }]
    getReports
      .mockResolvedValueOnce(pageOne)
      .mockResolvedValueOnce(pageTwo)
    const wrapper = await mountMonitor()
    await flushPromises()

    const moreBtn = wrapper.find('.report-more button')
    expect(moreBtn.exists()).toBe(true)
    await moreBtn.trigger('click')
    await flushPromises()

    expect(getReports).toHaveBeenLastCalledWith({ limit: 20, offset: 20 })
    expect(wrapper.text()).toContain('追加回报')
    wrapper.unmount()
  })

  it('从快照错误请求检索回报并滚动定位', async () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    getAlerts.mockResolvedValue([mockAlert])
    getReports.mockResolvedValue([mockReport])
    const wrapper = await mountMonitor()
    await flushPromises()

    // 展开告警快照，点击其中的错误请求链接触发按 requestId 检索
    await wrapper.find('button.btn-ghost.btn-sm').trigger('click')
    await nextTick()
    await wrapper.find('.error-list .link').trigger('click')
    await flushPromises()

    expect(getReports).toHaveBeenLastCalledWith({ limit: 20, requestId: 'req-abc12345' })
    expect(scrollIntoView).toHaveBeenCalled()
    wrapper.unmount()
  })
})
