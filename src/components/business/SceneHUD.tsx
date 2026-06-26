import { useEffect, useRef, useState } from 'react'
import { useSceneStore } from '../../store/sceneStore'
import { modelRegistry } from '../../utils/modelRegistry'

/** 工业风格场景 HUD */
export function SceneHUD() {
  const selectedType = useSceneStore((s) => s.selectedType)
  const selectedModel = useSceneStore((s) => s.selectedModel)
  const deviceInfo = useSceneStore((s) => s.deviceInfo)

  const [fps, setFps] = useState(0)
  const [modelCount, setModelCount] = useState(0)
  const framesRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  // FPS 计数：每帧累加，每秒刷新
  useEffect(() => {
    let rafId: number
    const tick = () => {
      framesRef.current++
      const now = performance.now()
      if (now - lastTimeRef.current >= 1000) {
        setFps(framesRef.current)
        framesRef.current = 0
        lastTimeRef.current = now
        // 同步模型数
        setModelCount(modelRegistry.obstacles.length + (modelRegistry.soldier ? 1 : 0) + (modelRegistry.queen ? 1 : 0) + 1 /* batman always counted if rendered */)
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const selectedName = selectedType === 'soldier'
    ? '侦察兵 S-02'
    : selectedType === 'queen'
      ? '指挥中枢 Q-01'
      : '—'

  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        right: 16,
        zIndex: 15,
        width: 220,
        fontFamily: "'Courier New', monospace",
        fontSize: 11,
        color: '#aab',
        background: 'rgba(10, 10, 30, 0.75)',
        border: '1px solid rgba(100, 100, 200, 0.2)',
        borderRadius: 6,
        padding: '10px 14px',
        backdropFilter: 'blur(6px)',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      {/* 标题 */}
      <div
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 2,
          color: '#668',
          marginBottom: 8,
          borderBottom: '1px solid rgba(100, 100, 200, 0.15)',
          paddingBottom: 4,
        }}
      >
        System Monitor
      </div>

      {/* FPS */}
      <Row label="FPS" value={String(fps)} suffix="fps" accent />

      {/* 模型数 */}
      <Row label="Models" value={String(modelCount)} />

      {/* 选中 */}
      <Row label="Selected" value={selectedName} />

      {/* 设备信息状态 */}
      {deviceInfo && <Row label="Inspecting" value={deviceInfo.name} />}

      {/* 操作提示 */}
      <div
        style={{
          marginTop: 8,
          borderTop: '1px solid rgba(100, 100, 200, 0.15)',
          paddingTop: 6,
          fontSize: 10,
          color: '#556',
          lineHeight: 1.6,
          whiteSpace: 'nowrap',
        }}
      >
        {selectedModel
          ? '点击地面移动 · 右键旋转 · 滚轮缩放'
          : '点击模型查看信息 · 点击角色可移动'}
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  suffix,
  accent,
}: {
  label: string
  value: string
  suffix?: string
  accent?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        lineHeight: 1.8,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: '#667' }}>{label}</span>
      <span style={{ color: accent ? '#4ae' : '#99b', fontWeight: accent ? 600 : 400 }}>
        {value}
        {suffix && <span style={{ color: '#556', marginLeft: 2 }}> {suffix}</span>}
      </span>
    </div>
  )
}
