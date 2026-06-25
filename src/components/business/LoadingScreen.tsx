import { Progress } from 'antd'

/** 加载进度覆盖层 */
export function LoadingScreen({ progress }: { progress: number }) {
  return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
        <div style={{ fontSize: 18, color: '#fff', marginBottom: 16 }}>
          加载模型中...
        </div>
        <Progress
          percent={Math.round(progress)}
          strokeColor={{ from: '#108ee9', to: '#87d068' }}
          showInfo
          style={{ width: 260 }}
        />
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#1a1a2e',
}

const boxStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}
