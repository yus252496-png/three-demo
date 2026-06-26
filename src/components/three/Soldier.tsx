import { useGLTF } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { modelRegistry } from '../../utils/modelRegistry'
import { useSceneStore } from '../../store/sceneStore'

export function Soldier() {
  const groupRef = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF('/models/Soldier.glb')
  const registered = useRef(false)

  // 原始代码的命名方式：按索引取动画 [0=idle, 1=walk, 2=run]
  const actionsRef = useRef<Record<string, THREE.AnimationAction | null>>({
    idle: null,
    walk: null,
    run: null,
  })
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)

  useEffect(() => {
    if (groupRef.current && animations?.length && !registered.current) {
      registered.current = true

      // 和原始代码一样：手动创建 AnimationMixer，按索引绑定动作
      const model = groupRef.current
      const mixer = new THREE.AnimationMixer(model)
      mixerRef.current = mixer

      const actions = {
        idle: mixer.clipAction(animations[0]),
        walk: mixer.clipAction(animations[1]),
        run: mixer.clipAction(animations[2]),
      }
      actionsRef.current = actions

      // 注册到全局
      modelRegistry.soldier = model
      modelRegistry.soldierActions = actions
      modelRegistry.soldierMixer = mixer

      // 默认播放待机动画
      actions.idle?.play()
    }

    return () => {
      if (modelRegistry.soldier === groupRef.current) {
        modelRegistry.soldier = null
        modelRegistry.soldierActions = null
        modelRegistry.soldierMixer = null
        registered.current = false
      }
    }
  }, [scene, animations])

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
