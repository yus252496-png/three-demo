import { Card } from 'antd'
import { OeeTrendChart } from '../components/charts/OeeTrendChart'
import { AlarmPieChart } from '../components/charts/AlarmPieChart'
import { OutputBarChart } from '../components/charts/OutputBarChart'
import { UtilizationGauge } from '../components/charts/UtilizationGauge'

const cardStyle: React.CSSProperties = {
  background: 'rgba(16,20,40,0.92)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  height: '100%',
}

export function Dashboard() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: 24,
        background: '#0d1117',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 20,
      }}
    >
      {/* OEE 趋势 */}
      <Card
        title={<span style={{ color: '#fff', fontSize: 14 }}>📈 OEE 趋势（近 24h）</span>}
        styles={{ header: { borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 20px' }, body: { padding: 20 } }}
        style={cardStyle}
      >
        <OeeTrendChart height={240} />
      </Card>

      {/* 报警分布 */}
      <Card
        title={<span style={{ color: '#fff', fontSize: 14 }}>🚨 报警分布</span>}
        styles={{ header: { borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 20px' }, body: { padding: 20 } }}
        style={cardStyle}
      >
        <AlarmPieChart height={240} />
      </Card>

      {/* 产线产量 */}
      <Card
        title={<span style={{ color: '#fff', fontSize: 14 }}>📊 产线产量（今日）</span>}
        styles={{ header: { borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 20px' }, body: { padding: 20 } }}
        style={cardStyle}
      >
        <OutputBarChart height={240} />
      </Card>

      {/* 设备稼动率 */}
      <Card
        title={<span style={{ color: '#fff', fontSize: 14 }}>⚡ 设备稼动率</span>}
        styles={{ header: { borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 20px' }, body: { padding: 20 } }}
        style={cardStyle}
      >
        <UtilizationGauge height={240} />
      </Card>
    </div>
  )
}
