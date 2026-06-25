import { useGLTF } from '@react-three/drei'
import { useEffect, useRef } from 'react'

/** 蝙蝠侠装饰模型 */
export function Batman({ onLoaded }: { onLoaded?: () => void }) {
  const { scene } = useGLTF('/models/skin.glb')
  const done = useRef(false)

  useEffect(() => {
    if (!done.current) {
      done.current = true
      onLoaded?.()
    }
  }, [scene, onLoaded])

  return (
    <group scale={0.4} position={[0, 0.7, 0]}>
      <primitive object={scene} />
    </group>
  )
}
