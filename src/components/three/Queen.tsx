import { useGLTF } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { modelRegistry } from '../../utils/modelRegistry'
import { useSceneStore } from '../../store/sceneStore'

export function Queen() {
  const { scene } = useGLTF('/models/queen.glb')
  const groupRef = useRef<THREE.Group>(null)
  const registered = useRef(false)

  useEffect(() => {
    if (groupRef.current && !registered.current) {
      registered.current = true
      modelRegistry.queen = groupRef.current
    }

    return () => {
      if (modelRegistry.queen === groupRef.current) {
        modelRegistry.queen = null
        registered.current = false
      }
    }
  }, [scene])

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
    const store = useSceneStore.getState()
    if (store.selectedType === 'soldier') modelRegistry.stopSoldier?.()
    store.clearMoveQueue()
    store.selectModel(groupRef.current, 'queen')
    store.setPathPoints(null)
  }

  return (
    <group
      ref={groupRef}
      scale={0.4}
      position={[1.5, 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <primitive object={scene} />
    </group>
  )
}
