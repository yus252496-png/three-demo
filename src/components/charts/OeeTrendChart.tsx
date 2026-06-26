import { useMemo } from 'react'
import ReactEChartsCore from 'echarts-for-react'
import { CHART_COLORS as C } from '../../utils/chartConfig'

/** 模拟 OEE 近 24 小时数据 */
function mockOeeData() {
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
  const values = hours.map(() => +(75 + Math.random() * 20).toFixed(1))
  return { hours, values }
}

export function OeeTrendChart({ height = 220 }: { height?: number }) {
  const { hours, values } = useMemo(() => mockOeeData(), [])

  return (
    <ReactEChartsCore
      style={{ height }}
      opts={{ renderer: 'svg' }}
      option={{
        tooltip: {
          trigger: 'axis',
          backgroundColor: C.tooltipBg,
          borderColor: 'transparent',
          textStyle: { color: '#fff', fontSize: 12 },
          formatter: `{b}<br/>OEE: <span style="color:${C.primary}">{c}%</span>`,
        },
        grid: { left: 50, right: 16, top: 20, bottom: 24 },
        xAxis: {
          type: 'category',
          data: hours,
          axisLine: { lineStyle: { color: C.axisLine } },
          axisLabel: { color: C.axisLabel, fontSize: 10, interval: 3 },
          splitLine: { show: false },
        },
        yAxis: {
          type: 'value',
          min: 60,
          max: 100,
          axisLabel: { color: C.axisLabel, fontSize: 10, formatter: '{value}%' },
          splitLine: { lineStyle: { color: C.splitLine } },
        },
        series: [
          {
            type: 'line',
            data: values,
            smooth: true,
            symbol: 'none',
            lineStyle: { color: C.primary, width: 2 },
            areaStyle: C.areaGradient(0.2),
            markLine: {
              silent: true,
              data: [{ yAxis: 85, label: { formatter: '目标 85%', color: C.success, fontSize: 10 } }],
              lineStyle: { color: C.success, type: 'dashed', width: 1 },
            },
          },
        ],
      }}
    />
  )
}
