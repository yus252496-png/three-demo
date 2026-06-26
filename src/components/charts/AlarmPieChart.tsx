import { useMemo } from 'react'
import ReactEChartsCore from 'echarts-for-react'
import { CHART_COLORS as C } from '../../utils/chartConfig'

const CATEGORIES = ['机械故障', '电气故障', '程序异常', '物料短缺', '品质异常', '其他']
const COLORS = [C.danger, C.warning, C.primary, C.info, C.success, C.axisLabel]

function mockAlarmData() {
  const total = CATEGORIES.map(() => Math.floor(Math.random() * 40) + 5)
  return { categories: CATEGORIES, values: total }
}

export function AlarmPieChart({ height = 220 }: { height?: number }) {
  const { categories, values } = useMemo(() => mockAlarmData(), [])

  return (
    <ReactEChartsCore
      style={{ height }}
      opts={{ renderer: 'svg' }}
      option={{
        tooltip: {
          trigger: 'item',
          backgroundColor: C.tooltipBg,
          borderColor: 'transparent',
          textStyle: { color: '#fff', fontSize: 12 },
          formatter: '{b}: <span style="font-weight:bold">{c}</span> 次 ({d}%)',
        },
        series: [
          {
            type: 'pie',
            radius: ['45%', '72%'],
            center: ['50%', '52%'],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 4, borderColor: '#14182d', borderWidth: 2 },
            label: {
              color: C.axisLabel,
              fontSize: 11,
              formatter: '{b}\n{d}%',
              lineHeight: 16,
            },
            data: categories.map((name, i) => ({ name, value: values[i], itemStyle: { color: COLORS[i] } })),
          },
        ],
      }}
    />
  )
}
