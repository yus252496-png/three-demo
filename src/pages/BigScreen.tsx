import { useRef, useState, useCallback, useEffect } from 'react'
import { Button, Tooltip } from 'antd'
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons'
import { Scene } from '../components/three/Scene'

export function BigScreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
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
  )
}
