/** 工业看板配色方案（深色科技风） */
export const CHART_COLORS = {
  // 主色
  primary: '#00d4ff',     // 科技蓝
  success: '#00ff88',     // 运行绿
  warning: '#ffb300',     // 警告橙
  danger: '#ff4757',      // 报警红
  info: '#7c5cfc',        // 紫色

  // 辅助色
  gridLine: 'rgba(255,255,255,0.08)',
  axisLabel: 'rgba(255,255,255,0.55)',
  axisLine: 'rgba(255,255,255,0.12)',
  tooltipBg: 'rgba(20,24,45,0.92)',
  splitLine: 'rgba(255,255,255,0.06)',

  // 渐变色
  areaGradient: (opacity = 0.25) => ({
    type: 'linear' as const,
    x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: `rgba(0,212,255,${opacity})` },
      { offset: 1, color: `rgba(0,212,255,0)` },
    ],
  }),
}
