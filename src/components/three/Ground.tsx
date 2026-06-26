import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const GRID_SIZE = 10
const GRID_DIVISIONS = 20

/** 地面 + 工业风格发光网格 + 环形参考线 */
export function Ground() {
  return (
    <>
      {/* 实体地面（半反射材质，配合 HDR 环境贴图） */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01} receiveShadow>
        <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
        <meshStandardMaterial
          color="#0e0e1a"
          roughness={0.35}
          metalness={0.5}
          envMapIntensity={0.6}
        />
      </mesh>

      {/* 发光网格线 */}
      <GlowingGrid />

      {/* 环形参考线 */}
      <ConcentricRings />
    </>
  )
}

/** 发光网格线（使用 LineSegments 批量绘制） */
function GlowingGrid() {
  const geometry = useMemo(() => {
    const half = GRID_SIZE / 2
    const step = GRID_SIZE / GRID_DIVISIONS
    const vertices: number[] = []

    for (let i = -half; i <= half + 0.001; i += step) {
      // X 方向线
      vertices.push(-half, 0.005, i, half, 0.005, i)
      // Z 方向线
      vertices.push(i, 0.005, -half, i, 0.005, half)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    return geo
  }, [])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color="#3a3a7a"
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </lineSegments>
  )
}

/** 半透明环形参考线（从中心向外扩散） */
const RING_RADII = [1, 2, 3, 4]
const RING_SEGMENTS = 64

function ConcentricRings() {
  const meshRef = useRef<THREE.LineSegments>(null)

  // 动画脉冲
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const pulse = 0.35 + 0.15 * Math.sin(clock.elapsedTime * 0.3)
      const mat = meshRef.current.material as THREE.LineBasicMaterial
      mat.opacity = pulse
    }
  })

  const geometry = useMemo(() => {
    const vertices: number[] = []
    RING_RADII.forEach((r) => {
      for (let i = 0; i <= RING_SEGMENTS; i++) {
        const theta = (i / RING_SEGMENTS) * Math.PI * 2
        const x = r * Math.cos(theta)
        const z = r * Math.sin(theta)
        vertices.push(x, 0.005, z)
      }
    })
    const geo = new THREE.BufferGeometry()
    // 每条环独立（不连接相邻环）
    const indices: number[] = []
    let offset = 0
    RING_RADII.forEach(() => {
      for (let i = 0; i < RING_SEGMENTS; i++) {
        indices.push(offset + i, offset + i + 1)
      }
      offset += RING_SEGMENTS + 1
    })
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geo.setIndex(indices)
    return geo
  }, [])

  return (
    <lineSegments ref={meshRef} geometry={geometry}>
      <lineBasicMaterial
        color="#5a5aaa"
        transparent
        opacity={0.35}
        depthWrite={false}
      />
    </lineSegments>
  )
}
