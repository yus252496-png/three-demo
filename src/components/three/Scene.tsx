import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useProgress, Environment } from '@react-three/drei'
import { useState, useEffect } from 'react'
import * as THREE from 'three'
import { SceneLights } from './SceneLights'
import { Ground } from './Ground'
import { Car } from './Car'
import { Soldier } from './Soldier'
import { Queen } from './Queen'
import { Batman } from './Batman'
import { GroundClickCatcher } from './GroundClickCatcher'
import { SceneController } from './SceneController'
import { LoadingScreen } from '../business/LoadingScreen'
import { screenshotCapture } from '../../utils/screenshotCapture'

export function Scene() {
  return (
    <>
      <Canvas
        camera={{ position: [3, 3, 5], fov: 75, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
        shadows
        onCreated={({ scene }) => {
          scene.fog = new THREE.FogExp2(0x1a1a2e, 0.05)
        }}
      >
        <OrbitControls enableDamping dampingFactor={0.1} zoomToCursor />

        <SceneLights />
        <Ground />
        <Car />
        <Soldier />
        <Queen />
        <Batman />

        <GroundClickCatcher />
        <SceneController />
        <ScreenshotCapture />

        <Environment preset="city" environmentIntensity={0.4} />
      </Canvas>

      <LoadingOverlay />
    </>
  )
}

/**
 * 截图捕获内部组件（注册 Three.js 引用供外部按钮调用）
 */
function ScreenshotCapture() {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    screenshotCapture.set(gl, scene, camera)
  }, [gl, scene, camera])
  return null
}

/**
 * 加载覆盖层（单调递增 + 防抖隐藏）
 *
 * useProgress 底层使用 THREE.DefaultLoadingManager，
 * GLTF 加载过程中 total 可能动态增加导致 % 回退。
 *
 * 三个防护：
 * 1. 单调递增 — 始终取已出现的最大值，保证只进不退
 * 2. 防抖隐藏 — active 变为 false 后等待 500ms 再隐藏，
 *    避免 GLTF 加载阶段间的短暂间隙导致闪动
 * 3. 加载中 active 为 true 时不显示 100%，防止假完成
 */
function LoadingOverlay() {
  const { loaded, total, active } = useProgress()
  const [maxPct, setMaxPct] = useState(0)
  const [hide, setHide] = useState(false)

  // 原始百分比（可能回退）
  const rawPct = total > 0 ? Math.round((loaded / total) * 100) : 0

  // ① 单调递增：始终取历史最高值
  useEffect(() => {
    if (rawPct > maxPct) setMaxPct(rawPct)
  }, [rawPct, maxPct])

  // ② 防抖隐藏：active=false 后等 500ms 确认加载真的结束了
  useEffect(() => {
    if (!active && maxPct > 0) {
      const t = setTimeout(() => setHide(true), 500)
      return () => clearTimeout(t)
    }
    setHide(false)
  }, [active, maxPct])

  // 显示值 = 最高见过的百分比（从 0 开始）
  const displayPct = maxPct

  if (hide) return null
  return <LoadingScreen progress={displayPct} />
}
