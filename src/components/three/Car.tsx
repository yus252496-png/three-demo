import { useGLTF, Line } from '@react-three/drei'
import * as THREE from 'three'
import { useEffect, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { modelRegistry } from '../../utils/modelRegistry'
import { useSceneStore } from '../../store/sceneStore'

export function Car() {
  const { scene } = useGLTF('/models/car.glb')
  const groupRef = useRef<THREE.Group>(null)
  const [boxCorners, setBoxCorners] = useState<[number, number, number][] | null>(null)
  const registered = useRef(false)

  useEffect(() => {
    // 遍历场景，让所有 Mesh 投射/接收阴影
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  useEffect(() => {
    if (groupRef.current && !registered.current) {
      registered.current = true
      modelRegistry.car = groupRef.current
      modelRegistry.obstacles.push(groupRef.current)

      // 延迟计算碰撞包围盒
      setTimeout(() => {
        if (groupRef.current) {
          groupRef.current.updateWorldMatrix(true, true)
          const rawBox = new THREE.Box3().setFromObject(groupRef.current)
          // 空盒检测 — 模型尚未就绪时不渲染
          if (!isFinite(rawBox.min.x)) return
          const b = rawBox.clone().expandByScalar(0.6)
          // 用世界坐标计算四个角点（y=0.02 贴地）
          const corners: [number, number, number][] = [
            [b.min.x, 0.02, b.min.z],
            [b.max.x, 0.02, b.min.z],
            [b.max.x, 0.02, b.max.z],
            [b.min.x, 0.02, b.max.z],
            [b.min.x, 0.02, b.min.z],
          ]
          setBoxCorners(corners)
          console.log('🚗 碰撞区域:', b)
        }
      }, 500)
    }

    // 卸载时清理注册
    return () => {
      if (modelRegistry.car === groupRef.current) {
        modelRegistry.car = null
        const idx = modelRegistry.obstacles.indexOf(groupRef.current!)
        if (idx > -1) modelRegistry.obstacles.splice(idx, 1)
        registered.current = false
      }
    }
  }, [scene])

  /** 点击显示设备信息 */
  const pointerRef = useRef({ x: 0, y: 0, time: 0 })
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    pointerRef.current = {
      x: e.nativeEvent.clientX,
      y: e.nativeEvent.clientY,
      time: Date.now(),
    }
  }
  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    const dx = e.nativeEvent.clientX - pointerRef.current.x
    const dy = e.nativeEvent.clientY - pointerRef.current.y
    const dt = Date.now() - pointerRef.current.time
    if (Math.sqrt(dx * dx + dy * dy) > 10 || dt > 300) return
    e.stopPropagation()
    useSceneStore.getState().setDeviceInfo({
      type: 'car',
      name: '物流运输车 A-01',
      status: 'online',
      params: [
        { label: '型号', value: 'Truck-X7' },
        { label: '载重', value: '5.0 t' },
        { label: '速度', value: '12 km/h' },
        { label: '电池', value: '87%' },
        { label: '位置', value: '(0, 0)' },
      ],
    })
  }

  return (
    <>
      <group
        ref={groupRef}
        scale={0.5}
        position={[0, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <primitive object={scene} />
      </group>
      {/* 碰撞框直接放在场景根级（不受 group scale 影响） */}
      {boxCorners && (
        <Line
          points={boxCorners}
          color="red"
          lineWidth={2}
        />
      )}
    </>
  )
}
