import { Line } from '@react-three/drei'
import type { Waypoint } from '../../types/scene'

/** 过滤掉坐标中的 NaN/Infinity */
function isValidCoord(v: number) {
  return typeof v === 'number' && isFinite(v)
}

/** 地面路径线 */
export function PathLine({ points, opacity }: { points: Waypoint[] | null; opacity: number }) {
  if (!points || points.length < 2) return null
  const positions = points
    .filter((p) => isValidCoord(p.x) && isValidCoord(p.z))
    .map((p) => [p.x, 0.05, p.z] as [number, number, number])
  if (positions.length < 2) return null
  return (
    <Line
      points={positions}
      color="#00ff00"
      lineWidth={2}
      transparent
      opacity={opacity}
    />
  )
}
