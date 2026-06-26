import { useRef, useState, useCallback, useEffect } from 'react'
import { Button, Tooltip, message } from 'antd'
import { FullscreenOutlined, FullscreenExitOutlined, CameraOutlined, BarChartOutlined, MonitorOutlined } from '@ant-design/icons'
import { screenshotCapture } from '../utils/screenshotCapture'
import { Scene } from '../components/three/Scene'
import { ChartPanel } from '../components/business/ChartPanel'
import { DeviceInfoCard } from '../components/business/DeviceInfoCard'
import { SceneHUD } from '../components/business/SceneHUD'
import { useSceneStore } from '../store/sceneStore'
import { modelRegistry } from '../utils/modelRegistry'

export function BigScreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activePanel, setActivePanel] = useState<'hud' | 'chart' | null>('hud')
  const containerRef = useRef<HTMLDivElement>(null)

  // 页面挂载时重置场景状态和模型引用（防止切页后残留过期 THREE 对象）
  useEffect(() => {
    useSceneStore.getState().resetScene()
    modelRegistry.reset()
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        // 只全屏容器本身 → 导航栏自动隐藏
        await containerRef.current?.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch {
      // 浏览器不支持全屏或被禁用
    }
  }, [])

  // 监听全屏变化（ESC 退出时同步按钮状态）
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#000',
      }}
    >
      <Scene />

      {/* 右侧面板 — 互斥显示 */}
      {activePanel === 'chart' && <ChartPanel />}
      {activePanel === 'hud' && <SceneHUD />}
      <DeviceInfoCard />

      {/* 右上角按钮栏 */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, display: 'flex', gap: 8 }}>
        <Tooltip title="截图保存">
          <Button
            type="text"
            icon={<CameraOutlined style={{ fontSize: 18 }} />}
            onClick={() => {
              try {
                screenshotCapture.download()
                message.success('截图已保存')
              } catch {
                message.error('截图失败')
              }
            }}
            style={{
              color: '#fff',
              background: 'rgba(0,0,0,0.3)',
              border: 'none',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
            }}
          />
        </Tooltip>
        <Tooltip title={activePanel === 'hud' ? '收起系统看板' : '系统看板'}>
          <Button
            type="text"
            icon={<MonitorOutlined style={{ fontSize: 18 }} />}
            onClick={() => setActivePanel(activePanel === 'hud' ? null : 'hud')}
            style={{
              color: activePanel === 'hud' ? '#1677ff' : '#fff',
              background: 'rgba(0,0,0,0.3)',
              border: 'none',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
            }}
          />
        </Tooltip>
        <Tooltip title={activePanel === 'chart' ? '收起数据面板' : '数据面板'}>
          <Button
            type="text"
            icon={<BarChartOutlined style={{ fontSize: 18 }} />}
            onClick={() => setActivePanel(activePanel === 'chart' ? null : 'chart')}
            style={{
              color: activePanel === 'chart' ? '#1677ff' : '#fff',
              background: 'rgba(0,0,0,0.3)',
              border: 'none',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
            }}
          />
        </Tooltip>
        <Tooltip title={isFullscreen ? '退出全屏' : '全屏展示'}>
          <Button
            type="text"
            icon={
              isFullscreen ? (
                <FullscreenExitOutlined style={{ fontSize: 20 }} />
              ) : (
                <FullscreenOutlined style={{ fontSize: 20 }} />
              )
            }
            onClick={toggleFullscreen}
            style={{
              color: '#fff',
              background: 'rgba(0,0,0,0.3)',
              border: 'none',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
            }}
          />
        </Tooltip>
      </div>
    </div>
  )
}
