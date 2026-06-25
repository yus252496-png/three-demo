import { Line } from '@react-three/drei'
import type { Waypoint } from '../../types/scene'

/** 地面路径线 */
export function PathLine({ points }: { points: Waypoint[] | null }) {
  if (!points || points.length < 2) return null
  const positions = points.map((p) => [p.x, 0.05, p.z] as [number, number, number])
  return (
    <Line
      points={positions}
      color="#00ff00"
      lineWidth={2}
      transparent
      opacity={1}
    />
  )
}
