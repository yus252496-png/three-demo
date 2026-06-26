import { useGLTF } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { modelRegistry } from '../../utils/modelRegistry'
import { useSceneStore } from '../../store/sceneStore'

/** 蝙蝠侠装饰模型 */
export function Batman() {
  const { scene } = useGLTF('/models/skin.glb')
  const groupRef = useRef<THREE.Group>(null)
  const registered = useRef(false)

  // 遍历场景，让所有 Mesh 投射/接收阴影
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  // 注册到模型注册表
  useEffect(() => {
    if (groupRef.current && !registered.current) {
      registered.current = true
      modelRegistry.batman = groupRef.current
    }
    return () => {
      if (modelRegistry.batman === groupRef.current) {
        modelRegistry.batman = null
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
      type: 'batman',
      name: '哨兵无人机 B-03',
      status: 'standby',
      params: [
        { label: '型号', value: 'Bat-Eye' },
        { label: '高度', value: '0.7 m' },
        { label: '续航', value: '45 min' },
        { label: '电量', value: '56%' },
        { label: '位置', value: '(0, 0)' },
      ],
    })
  }

  return (
    <group
      ref={groupRef}
      scale={0.4}
      position={[0, 0.7, 0]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <primitive object={scene} />
    </group>
  )
}
