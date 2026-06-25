import { useGLTF, Line } from '@react-three/drei'
import * as THREE from 'three'
import { useEffect, useRef, useState } from 'react'
import { modelRegistry } from '../../utils/modelRegistry'

export function Car({ onLoaded }: { onLoaded?: () => void }) {
  const { scene } = useGLTF('/models/car.glb')
  const groupRef = useRef<THREE.Group>(null)
  const [boxCorners, setBoxCorners] = useState<[number, number, number][] | null>(null)
  const registered = useRef(false)

  useEffect(() => {
    if (groupRef.current && !registered.current) {
      registered.current = true
      modelRegistry.car = groupRef.current
      modelRegistry.obstacles.push(groupRef.current)
      onLoaded?.()

      // 延迟计算碰撞包围盒
      setTimeout(() => {
        if (groupRef.current) {
          groupRef.current.updateWorldMatrix(true, true)
          const rawBox = new THREE.Box3().setFromObject(groupRef.current)
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
  }, [scene, onLoaded])

  return (
    <>
      <group ref={groupRef} scale={0.5} position={[0, 0, 0]}>
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
