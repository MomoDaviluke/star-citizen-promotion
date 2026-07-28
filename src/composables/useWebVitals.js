/**
 * @file Web Vitals 监控组合式函数
 * @description 使用 web-vitals 库采集 LCP/CLS/INP/FCP/TTFB 等核心指标，
 *              缓冲后批量上报到后端 RUM 端点。
 *              支持采样率控制、手动 flush、禁用开关。
 * @module composables/useWebVitals
 */

import { onLCP, onCLS, onINP, onFCP, onTTFB } from 'web-vitals'
import { sendRumBeacon } from '../services/rumService.js'

/**
 * 默认上报缓冲时长（毫秒）
 * @description 指标到达后等待该时间，合并为批量请求上报
 * @type {number}
 */
const DEFAULT_FLUSH_INTERVAL = 5000

/**
 * Web Vitals 采集器
 * @description 返回 start/stop/flush 控制方法
 * @param {Object} options - 配置选项
 * @param {boolean} [options.enabled=true] - 是否启用采集
 * @param {number} [options.sampleRate=1.0] - 采样率（0-1）
 * @param {number} [options.flushInterval=5000] - 批量上报间隔（毫秒）
 * @returns {{start: Function, stop: Function, flush: Function}}
 */
export function useWebVitals(options = {}) {
  const {
    enabled = true,
    sampleRate = 1.0,
    flushInterval = DEFAULT_FLUSH_INTERVAL
  } = options

  /** 已缓冲的指标队列 */
  const buffer = []

  /** 当前等待上报的定时器 */
  let flushTimer = null

  /**
   * 判断是否命中采样
   * @description 采样率为 1 时全部命中，为 0 时全部不命中
   * @returns {boolean}
   */
  function isSampled() {
    if (sampleRate >= 1) return true
    if (sampleRate <= 0) return false
    return Math.random() < sampleRate
  }

  /**
   * 构建标准上报 payload
   * @description 将 web-vitals 指标对象转换为后端可识别的格式，并附加页面元数据
   * @param {Object} metric - web-vitals 返回的指标对象
   * @returns {Object}
   */
  function buildPayload(metric) {
    return {
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      navigationType: metric.navigationType || 'navigate',
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: Date.now()
    }
  }

  /**
   * 处理单个指标
   * @description 将指标加入缓冲队列，并触发延迟 flush
   * @param {Object} metric - web-vitals 指标对象
   */
  function handleMetric(metric) {
    if (!metric || !metric.name) return

    buffer.push(buildPayload(metric))

    if (flushTimer) {
      clearTimeout(flushTimer)
    }

    flushTimer = setTimeout(() => {
      flush()
    }, flushInterval)
  }

  /**
   * 立即上报缓冲队列中的指标
   * @description 支持批量上报，上报后清空缓冲；空队列不发送请求
   */
  function flush() {
    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }

    if (buffer.length === 0) return

    const payload = buffer.length === 1 ? buffer[0] : [...buffer]
    sendRumBeacon(payload)

    buffer.length = 0
  }

  /**
   * 停止采集
   * @description 取消所有 web-vitals 回调注册（当前 web-vitals 为一次性回调，无需显式取消）
 *              清除待上报定时器并执行最后一次 flush
   */
  function stop() {
    flush()
  }

  /**
   * 开始采集
   * @description 注册所有 Web Vitals 指标回调
   */
  function start() {
    if (!enabled || !isSampled()) {
      return
    }

    onLCP(handleMetric)
    onCLS(handleMetric)
    onINP(handleMetric)
    onFCP(handleMetric)
    onTTFB(handleMetric)

    // 页面卸载前强制 flush，确保数据不丢失
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', flush, { once: true })
      window.addEventListener('beforeunload', flush, { once: true })
    }
  }

  return {
    start,
    stop,
    flush
  }
}
