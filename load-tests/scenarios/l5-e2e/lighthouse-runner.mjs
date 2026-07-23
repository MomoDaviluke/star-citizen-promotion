/**
 * @file Lighthouse 调用封装
 * @description 对指定 URL 运行 Lighthouse 审计，返回性能指标
 * @module load-tests/scenarios/l5-e2e/lighthouse-runner
 */

import lighthouse from 'lighthouse'
import { launch } from 'chrome-launcher'

/**
 * 对单个 URL 运行 Lighthouse
 * @param {string} url - 目标 URL
 * @param {Object} [opts] - 选项
 * @param {boolean} [opts.desktop=true] - 桌面/移动配置
 * @returns {Promise<Object>} 性能指标
 */
export async function runLighthouse(url, opts = {}) {
  const { desktop = true } = opts

  // 用 chrome-launcher 启动 Chrome（Lighthouse 自带依赖）
  const chrome = await launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  })

  try {
    const options = {
      logLevel: 'error',
      port: chrome.port,
      output: 'json',
      onlyCategories: ['performance'],
      ...(desktop ? {
        formFactor: 'desktop',
        screenEmulation: { width: 1350, height: 938, disabled: false, mobile: false },
        throttling: {
          rttMs: 40,
          throughputKbps: 10 * 1024,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        }
      } : {
        formFactor: 'mobile',
        screenEmulation: { width: 375, height: 667, disabled: false, mobile: true }
      })
    }

    const runnerResult = await lighthouse(url, options)

    if (!runnerResult) {
      throw new Error('Lighthouse 无结果返回')
    }

    const lhr = runnerResult.lhr
    const audits = lhr.audits

    return {
      url,
      finalUrl: lhr.finalUrl,
      fetchTime: lhr.fetchTime,
      scores: {
        performance: lhr.categories.performance.score * 100
      },
      metrics: {
        lcp: audits['largest-contentful-paint']?.numericValue,
        cls: audits['cumulative-layout-shift']?.numericValue,
        inp: audits['interaction-to-next-paint']?.numericValue,
        fcp: audits['first-contentful-paint']?.numericValue,
        ttfb: audits['server-response-time']?.numericValue,
        tbt: audits['total-blocking-time']?.numericValue,
        si: audits['speed-index']?.numericValue
      }
    }
  } finally {
    await chrome.kill()
  }
}
