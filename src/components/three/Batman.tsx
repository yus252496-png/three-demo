import { useGLTF } from '@react-three/drei'

/** 蝙蝠侠装饰模型 */
export function Batman() {
  const { scene } = useGLTF('/models/skin.glb')
  return (
    <group scale={0.4} position={[0, 0.7, 0]}>
      <primitive object={scene} />
    </group>
  )
}
