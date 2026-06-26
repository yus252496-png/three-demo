import { Button, Tooltip } from 'antd'
import { ExpandOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { OeeTrendChart } from '../charts/OeeTrendChart'
import { AlarmPieChart } from '../charts/AlarmPieChart'
import { OutputBarChart } from '../charts/OutputBarChart'
import { UtilizationGauge } from '../charts/UtilizationGauge'

/**
 * 浮在 3D 场景右侧的图表面板（由 BigScreen 控制显示/隐藏）
 */
export function ChartPanel() {
  const navigate = useNavigate()

  return (
    <>
      <style>{`
        .chart-panel-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .chart-panel-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .chart-panel-scroll::-webkit-scrollbar-thumb {
          background: rgba(22, 119, 255, 0.4);
          border-radius: 3px;
        }
        .chart-panel-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(22, 119, 255, 0.65);
        }
        /* Firefox */
        .chart-panel-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(22, 119, 255, 0.4) transparent;
        }
      `}</style>
      <div
        className="chart-panel-scroll"
        style={{
          position: 'absolute',
          top: 64,
          right: 16,
          zIndex: 10,
          width: 340,
          maxHeight: 'calc(100% - 84px)', /* 64 top offset + 20 bottom gap */
          overflowY: 'auto',
          background: 'rgba(16,20,40,0.92)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '12px 12px 4px',
          backdropFilter: 'blur(12px)',
        }}
      >
      {/* 标题栏（sticky 固定头部，滚动时不跟随） */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          background: 'rgba(16,20,40,0.92)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
          padding: '0 4px 8px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>📊 数据面板</span>
        <Tooltip title="全屏查看">
          <Button
            type="text"
            size="small"
            icon={<ExpandOutlined style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />}
            onClick={() => navigate('/dashboard')}
          />
        </Tooltip>
      </div>

      {/* 标题 */}
      <SectionTitle title="OEE 趋势（近 24h）" />
      <OeeTrendChart height={140} />
      <SectionTitle title="报警分布" />
      <AlarmPieChart height={140} />
      <SectionTitle title="产线产量" />
      <OutputBarChart height={140} />
      <SectionTitle title="设备稼动率" />
      <UtilizationGauge height={140} />
    </div>
    </>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div
      style={{
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        padding: '8px 4px 2px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        marginTop: 4,
      }}
    >
      {title}
    </div>
  )
}
