---
name: vue-chartjs-integration
description: "Chart.js 在 Vue 3 Composition API 下的集成模式。覆盖 useChart composable 封装、响应式数据绑定与实时更新、主题适配（暗黑/亮色）、图表类型选择决策树、大数据集性能优化（降采样/分片）、导出为图片、常见配置陷阱。用于在 Vue 3 项目中集成 Chart.js 数据可视化。Triggers: Chart.js, 图表, 数据可视化, 折线图, 柱状图, 饼图, dashboard, 统计面板, 趋势图, chart, data visualization, bar chart, line chart, pie chart. Do NOT trigger for: ECharts, D3.js, 图表库选型讨论, Canvas 基础绘图."
default-enabled: false
---

# Vue 3 + Chart.js 集成指南

Chart.js 在 Vue 3 Composition API 下的封装模式和最佳实践。

**不覆盖**：ECharts/D3.js、Canvas 基础绘图、图表设计理论。
**协作**：视觉风格（配色、字体）参考 ui-ux-pro-max；测试参考 vue-component-testing。

---

## 一、useChart Composable

解决直接 new Chart() 的三个问题：响应式数据不更新、内存泄漏、每个组件重复初始化/销毁代码。

```javascript
import { ref, onUnmounted, watch, shallowRef } from 'vue'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

export function useChart() {
  const canvasRef = ref(null)
  const chartInstance = shallowRef(null)

  function createChart(config) {
    if (chartInstance.value) chartInstance.value.destroy()
    chartInstance.value = new Chart(canvasRef.value, {
      ...config,
      options: { responsive: true, maintainAspectRatio: false, ...config.options },
    })
  }

  function updateData(newData) {
    if (!chartInstance.value) return
    chartInstance.value.data = newData
    chartInstance.value.update()
  }

  function watchData(dataRef) {
    watch(dataRef, (newData) => updateData(newData), { deep: true })
  }

  onUnmounted(() => chartInstance.value?.destroy())

  return { canvasRef, chartInstance, createChart, updateData, watchData }
}
```

---

## 二、响应式数据绑定

```vue
<script setup>
import { computed, onMounted } from 'vue'
import { useChart } from '@/composables/useChart'

const { canvasRef, createChart, watchData } = useChart()
const store = useStatsStore()

const chartData = computed(() => ({
  labels: store.monthlyData.map(d => d.month),
  datasets: [{
    label: '任务完成数', data: store.monthlyData.map(d => d.count),
    borderColor: '#5fa9ff', backgroundColor: 'rgba(95,169,255,0.1)',
    fill: true, tension: 0.4,
  }],
}))

onMounted(() => {
  createChart({ type: 'line', data: chartData.value })
  watchData(chartData)
})
</script>
```

### 增量更新（实时数据）
```javascript
function appendDataPoint(label, value) {
  const chart = chartInstance.value
  chart.data.labels.push(label)
  chart.data.datasets[0].data.push(value)
  if (chart.data.labels.length > 20) {  // 限制显示最近 20 个点
    chart.data.labels.shift()
    chart.data.datasets[0].data.shift()
  }
  chart.update()
}
```

---

## 三、主题适配（暗黑/亮色）

主题切换时重建 scales.grid.color、ticks.color 和 tooltip 颜色：

```javascript
function getScalesConfig(isDark) {
  return {
    x: { grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' } },
    y: { grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' } },
  }
}
```

watch 主题变化后重建图表配置。

---

## 四、图表类型决策树

| 数据关系 | 推荐类型 |
|:---|:---|
| 时间序列（趋势） | Line |
| 分类对比 | Bar |
| 占比分布 | Pie / Doughnut |
| 双变量相关性 | Scatter |
| 排名 | Horizontal Bar |
| 多维度比较 | Radar |
| 累积 vs 分项 | Stacked Bar |

| 数据量 | 策略 |
|:---|:---|
| <50 点 | 任何类型，开动画 |
| 50~500 点 | 动画开，pointRadius:0 |
| 500~5000 点 | Line，关动画，tension:0 |
| >5000 点 | 降采样后再渲染 |

---

## 五、大数据集优化

Chart.js 内置 decimation 插件：
```javascript
options: {
  parsing: false, animation: false,
  plugins: { decimation: { enabled: true, algorithm: 'lttb', samples: 200 } },
  elements: { point: { radius: 0 } },
}
```

简易降采样函数：按 targetPoints 分桶取平均值，同步处理 labels 和 datasets。

---

## 六、导出为图片

```javascript
function exportChartAsImage(filename = 'chart.png') {
  const url = chartInstance.value.toBase64Image('image/png', 1.0)
  const link = document.createElement('a')
  link.download = filename; link.href = url; link.click()
}
```

---

## 七、常见配置陷阱

1. **Canvas 容器必须有确定高度**：`.chart-wrapper { position:relative; width:100%; height:300px; }`
2. **数据更新后必须 chart.update()**
3. **卸载时必须 chart.destroy()**（composable 已内置）
4. **浅比较陷阱**：`chart.data = JSON.parse(JSON.stringify(newData))` 或 spread 创建新对象
5. **混合图表**：datasets 中每个可指定 type，第二个 Y 轴用 yAxisID: 'y1'

---

## 检查清单
- [ ] 使用 useChart composable 而非直接 new Chart()
- [ ] Canvas 容器有明确高度
- [ ] 卸载时 Chart 实例被 destroy()
- [ ] 响应式数据用 watchData 绑定
- [ ] 支持暗黑/亮色主题切换
- [ ] >500 点关闭动画和点标记
- [ ] >5000 点启用 decimation 或降采样
- [ ] 有导出图片功能（如需要）