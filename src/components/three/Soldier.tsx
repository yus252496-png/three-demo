import { useGLTF, useAnimations } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { modelRegistry } from '../../utils/modelRegistry'
import { useSceneStore } from '../../store/sceneStore'

export function Soldier({ onLoaded }: { onLoaded?: () => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF('/models/Soldier.glb')
  const { actions, mixer } = useAnimations(animations, groupRef)
  const registered = useRef(false)

  useEffect(() => {
    if (groupRef.current && actions && !registered.current) {
      registered.current = true
      modelRegistry.soldier = groupRef.current
      modelRegistry.soldierActions = actions as Record<string, THREE.AnimationAction | null>
      modelRegistry.soldierMixer = mixer

      const idle = actions['idle'] || actions['Idle']
      if (idle) idle.play()
      onLoaded?.()
    }

    return () => {
      if (modelRegistry.soldier === groupRef.current) {
        modelRegistry.soldier = null
        modelRegistry.soldierActions = null
        modelRegistry.soldierMixer = null
        registered.current = false
      }
    }
  }, [scene, actions, mixer, onLoaded])

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
    store.selectModel(groupRef.current, 'soldier')
    store.setPathPoints(null)
  }

  return (
    <group
      ref={groupRef}
      scale={[0.5, 0.5, -0.5]}
      position={[-1.5, 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <primitive object={scene} />
    </group>
  )
}
