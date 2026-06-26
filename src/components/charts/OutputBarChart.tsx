import { useMemo } from 'react'
import ReactEChartsCore from 'echarts-for-react'
import { CHART_COLORS as C } from '../../utils/chartConfig'

const LINES = ['A线', 'B线', 'C线', 'D线', 'E线']

function mockOutputData() {
  return LINES.map(() => Math.floor(Math.random() * 200) + 100)
}

export function OutputBarChart({ height = 220 }: { height?: number }) {
  const values = useMemo(() => mockOutputData(), [])

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
          formatter: `{b}<br/>产量: <span style="color:${C.primary}">{c} 件</span>`,
        },
        grid: { left: 44, right: 16, top: 16, bottom: 24 },
        xAxis: {
          type: 'category',
          data: LINES,
          axisLabel: { color: C.axisLabel, fontSize: 11 },
          axisLine: { lineStyle: { color: C.axisLine } },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: C.axisLabel, fontSize: 10 },
          splitLine: { lineStyle: { color: C.splitLine } },
        },
        series: [
          {
            type: 'bar',
            data: values.map(v => ({
              value: v,
              itemStyle: {
                color: {
                  type: 'linear',
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: C.primary },
                    { offset: 1, color: '#006688' },
                  ],
                },
                borderRadius: [4, 4, 0, 0],
              },
            })),
            barWidth: '55%',
          },
        ],
      }}
    />
  )
}
