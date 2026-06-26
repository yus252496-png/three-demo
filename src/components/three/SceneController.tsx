import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect, useRef, useState } from 'react'
import { useSceneStore } from '../../store/sceneStore'
import { modelRegistry } from '../../utils/modelRegistry'
import type { Waypoint } from '../../types/scene'
import { PathLine } from './PathLine'

/**
 * 场景控制器（纯移动 + 动画逻辑）
 * 点击选中/移动事件已委托给模型组件和 GroundClickCatcher
 */
export function SceneController() {
  // Store（响应式）
  const selectedModel = useSceneStore((s) => s.selectedModel)
  const pathPoints = useSceneStore((s) => s.pathPoints)
  const setPathPoints = useSceneStore((s) => s.setPathPoints)

  // 非响应式 ref（高频更新不走 React 渲染）
  const moveQueueRef = useRef<Waypoint[]>([])
  const pathClearTimerRef = useRef(0)
  const arrowRef = useRef<THREE.Mesh>(null)
  const soldierAnimRef = useRef<THREE.AnimationAction | null>(null)

  // 路径线透明度（响应式，淡出时触发重渲染）
  const [pathOpacity, setPathOpacity] = useState(1)

  // 订阅移动队列变化（新路径 → 重置透明度）
  useEffect(() => {
    const unsub = useSceneStore.subscribe((state, prevState) => {
      if (state.moveQueue !== prevState.moveQueue) {
        moveQueueRef.current = state.moveQueue
        pathClearTimerRef.current = 0
        setPathOpacity(1)
      }
    })
    return unsub
  }, [])

  /** 切换士兵动画（交叉淡入淡出） */
  function fadeSoldierAction(name: string) {
    const actions = modelRegistry.soldierActions
    if (!actions) return
    const next = actions[name] || actions[name.charAt(0).toUpperCase() + name.slice(1)]
    const current = soldierAnimRef.current
    if (!next || current === next) return
    if (current) current.fadeOut(0.2)
    next.reset().fadeIn(0.2).play()
    soldierAnimRef.current = next
  }

  // 注册士兵停止函数，供模型组件切换选中时调用
  useEffect(() => {
    modelRegistry.stopSoldier = () => fadeSoldierAction('idle')
    return () => { modelRegistry.stopSoldier = null }
  }, [])

  // ========== 每帧动画 ==========
  useFrame((_, delta) => {
    const selModel = useSceneStore.getState().selectedModel
    const selType = useSceneStore.getState().selectedType
    const queue = moveQueueRef.current

    // 移动逻辑
    if (selModel && queue.length > 0) {
      const target = queue[0]
      const dx = target.x - selModel.position.x
      const dz = target.z - selModel.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist < 0.1) {
        queue.shift()
        if (queue.length === 0) {
          if (selType === 'soldier') fadeSoldierAction('idle')
          pathClearTimerRef.current = 120
        }
      } else {
        const speed =
          selType === 'soldier' ? (dist > 4 ? 0.08 : 0.04) : 0.05
        selModel.position.x += dx * speed
        selModel.position.z += dz * speed

        // 平滑转向
        const targetAngle = Math.atan2(dx, dz)
        let angleDiff = targetAngle - selModel.rotation.y
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
        selModel.rotation.y += angleDiff * 0.12

        if (selType === 'soldier') {
          fadeSoldierAction(dist > 4 ? 'run' : 'walk')
        }
      }
    }

    // 更新士兵动画混合器
    if (modelRegistry.soldierMixer) {
      modelRegistry.soldierMixer.update(Math.min(delta, 0.1))
    }

    // 路径线整体淡出
    if (pathClearTimerRef.current > 0) {
      pathClearTimerRef.current--
      const alpha = pathClearTimerRef.current / 120
      if (alpha !== pathOpacity) setPathOpacity(alpha)
      if (pathClearTimerRef.current === 0) {
        setPathPoints(null)
        setPathOpacity(1) // 重置供下次使用
      }
    }

    // ★ 箭头跟随：直接操作 Three.js Mesh 位置，不走 React 渲染
    if (arrowRef.current && selModel) {
      arrowRef.current.position.x = selModel.position.x
      arrowRef.current.position.z = selModel.position.z
    }
  })

  return (
    <>
      {/* ★ 箭头直接内联，用 ref 直接操控位置 */}
      <mesh
        ref={arrowRef}
        position={[0, 1.6, 0]}
        visible={!!selectedModel}
        rotation-x={Math.PI}
      >
        <coneGeometry args={[0.12, 0.2, 8]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>
      <PathLine points={pathPoints} opacity={pathOpacity} />
    </>
  )
}
