import { Tag, Button, Descriptions } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { useSceneStore, type DeviceInfo } from '../../store/sceneStore'

/** 设备状态对应的标签颜色 */
const statusColors: Record<DeviceInfo['status'], string> = {
  online: '#52c41a',
  standby: '#faad14',
  maintenance: '#ff4d4f',
}

/** 设备状态中文名 */
const statusLabels: Record<DeviceInfo['status'], string> = {
  online: '在线',
  standby: '待机',
  maintenance: '维护中',
}

/** 与 System HUD 统一的卡片样式 */
const panelStyle: React.CSSProperties = {
  fontFamily: "'Courier New', monospace",
  fontSize: 11,
  color: '#aab',
  background: 'rgba(10, 10, 30, 0.75)',
  border: '1px solid rgba(100, 100, 200, 0.2)',
  borderRadius: 6,
  padding: '10px 14px',
  backdropFilter: 'blur(6px)',
}

/** 设备铭牌弹窗 — 右上角，与 HUD 垂直排列 */
export function DeviceInfoCard() {
  const deviceInfo = useSceneStore((s) => s.deviceInfo)
  const setDeviceInfo = useSceneStore((s) => s.setDeviceInfo)

  if (!deviceInfo) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 218,
        right: 16,
        zIndex: 20,
        minWidth: 220,
        width: 220,
      }}
    >
      <div style={panelStyle}>
        {/* 标题栏 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
            borderBottom: '1px solid rgba(100, 100, 200, 0.15)',
            paddingBottom: 6,
          }}
        >
          <span style={{ color: '#ccc', fontSize: 11 }}>
            {deviceInfo.name}
            <Tag
              color={statusColors[deviceInfo.status]}
              style={{ marginLeft: 6, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}
            >
              {statusLabels[deviceInfo.status]}
            </Tag>
          </span>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined style={{ color: '#556', fontSize: 11 }} />}
            onClick={() => setDeviceInfo(null)}
            style={{ width: 18, height: 18, minWidth: 18 }}
          />
        </div>

        {/* 参数列表 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {deviceInfo.params.map((p) => (
            <div
              key={p.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                lineHeight: 1.8,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: '#667' }}>{p.label}</span>
              <span style={{ color: '#99b' }}>{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
