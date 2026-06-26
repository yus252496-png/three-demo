import { useMemo } from 'react'
import ReactEChartsCore from 'echarts-for-react'
import { CHART_COLORS as C } from '../../utils/chartConfig'

export function UtilizationGauge({ height = 220 }: { height?: number }) {
  const value = useMemo(() => +(Math.random() * 30 + 65).toFixed(1), [])

  const color = value >= 85 ? C.success : value >= 70 ? C.warning : C.danger

  return (
    <ReactEChartsCore
      style={{ height }}
      opts={{ renderer: 'svg' }}
      option={{
        series: [
          {
            type: 'gauge',
            center: ['50%', '58%'],
            radius: '85%',
            startAngle: 220,
            endAngle: -40,
            min: 0,
            max: 100,
            splitNumber: 5,
            progress: { show: true, width: 12, itemStyle: { color } },
            axisLine: {
              lineStyle: { width: 12, color: [[1, 'rgba(255,255,255,0.08)']] },
            },
            axisTick: { show: false },
            splitLine: { length: 8, lineStyle: { width: 2, color: '#2a2e45' } },
            axisLabel: {
              color: C.axisLabel,
              fontSize: 10,
              distance: 20,
              formatter: '{value}%',
            },
            pointer: { width: 4, length: '55%', itemStyle: { color } },
            detail: {
              valueAnimation: true,
              formatter: '{value}%',
              color: '#fff',
              fontSize: 24,
              fontWeight: 'bold',
              offsetCenter: [0, '55%'],
            },
            data: [{ value }],
          },
        ],
      }}
    />
  )
}
