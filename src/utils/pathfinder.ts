import * as THREE from 'three'

/** 2D 距离 */
function dist(x1: number, z1: number, x2: number, z2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2)
}

/** 获取物体在 XZ 平面的包围盒参数 */
function getBoxParams(obj: THREE.Object3D) {
  obj.updateWorldMatrix(true, true)
  const box = new THREE.Box3().setFromObject(obj)
  return {
    minX: box.min.x,
    maxX: box.max.x,
    minZ: box.min.z,
    maxZ: box.max.z,
    cx: (box.min.x + box.max.x) / 2,
    cz: (box.min.z + box.max.z) / 2,
    hw: (box.max.x - box.min.x) / 2,
    hz: (box.max.z - box.min.z) / 2,
  }
}

/**
 * AABB 避障路径规划器
 * 检测直线路径是否被障碍物阻挡，并计算绕行路线（5 级回退算法）
 */
export function createAABBAvoidance(
  obstacles: THREE.Object3D[],
  options: {
    safetyMargin?: number
    detourMargin?: number
    sampleDensity?: number
    minSamples?: number
  } = {}
) {
  const {
    safetyMargin = 0.6,
    detourMargin = 1.0,
    sampleDensity = 0.3,
    minSamples = 50,
  } = options

  const _obstacles = obstacles

  /** 检测直线路径是否被障碍物挡住 */
  function isPathBlocked(x1: number, z1: number, x2: number, z2: number) {
    for (const obstacle of _obstacles) {
      obstacle.updateWorldMatrix(true, true)
      const box = new THREE.Box3().setFromObject(obstacle)
      box.expandByScalar(safetyMargin)

      const totalDist = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2)
      const samples = Math.max(minSamples, Math.ceil(totalDist / sampleDensity))
      for (let i = 1; i < samples; i++) {
        const t = i / samples
        const px = x1 + (x2 - x1) * t
        const pz = z1 + (z2 - z1) * t
        if (box.containsPoint(new THREE.Vector3(px, 0.5, pz))) {
          return true
        }
      }
    }
    return false
  }

  /** 计算绕行路径（5 级回退算法） */
  function computeWaypoints(fromX: number, fromZ: number, toX: number, toZ: number) {
    if (!isPathBlocked(fromX, fromZ, toX, toZ)) {
      return [] as { x: number; z: number }[]
    }

    const primary = _obstacles[0]
    if (!primary) return []

    const { minX, maxX, minZ, maxZ, cx, cz, hw, hz } = getBoxParams(primary)
    const m = detourMargin

    // 第 1 级：面中点
    const faceCenters = [
      { x: cx, z: cz + hz + m },
      { x: cx, z: cz - hz - m },
      { x: cx - hw - m, z: cz },
      { x: cx + hw + m, z: cz },
    ]
    for (const p of faceCenters) {
      if (!isPathBlocked(fromX, fromZ, p.x, p.z) && !isPathBlocked(p.x, p.z, toX, toZ)) {
        return [p]
      }
    }

    // 第 2 级：单个角点
    const corners = [
      { x: minX - m, z: minZ - m },
      { x: maxX + m, z: minZ - m },
      { x: maxX + m, z: maxZ + m },
      { x: minX - m, z: maxZ + m },
    ]
    const sortedCorners = [...corners].sort((a, b) => {
      const da = dist(fromX, fromZ, a.x, a.z) + dist(a.x, a.z, toX, toZ)
      const db = dist(fromX, fromZ, b.x, b.z) + dist(b.x, b.z, toX, toZ)
      return da - db
    })
    for (const c of sortedCorners) {
      if (!isPathBlocked(fromX, fromZ, c.x, c.z) && !isPathBlocked(c.x, c.z, toX, toZ)) {
        return [c]
      }
    }

    // 第 3 级：相邻角点对
    const adj: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0]]
    for (const [i, j] of adj) {
      const a = corners[i], b = corners[j]
      const first = dist(fromX, fromZ, a.x, a.z) <= dist(fromX, fromZ, b.x, b.z) ? a : b
      const second = first === a ? b : a
      if (!isPathBlocked(fromX, fromZ, first.x, first.z) && !isPathBlocked(first.x, first.z, toX, toZ)) return [first]
      if (!isPathBlocked(fromX, fromZ, first.x, first.z) && !isPathBlocked(first.x, first.z, second.x, second.z) && !isPathBlocked(second.x, second.z, toX, toZ)) return [first, second]
    }

    // 第 4 级：对角
    const diag: [number, number][] = [[0, 2], [1, 3]]
    for (const [i, j] of diag) {
      const a = corners[i], b = corners[j]
      const first = dist(fromX, fromZ, a.x, a.z) <= dist(fromX, fromZ, b.x, b.z) ? a : b
      const second = first === a ? b : a
      if (!isPathBlocked(fromX, fromZ, first.x, first.z) && !isPathBlocked(first.x, first.z, toX, toZ)) return [first]
      if (!isPathBlocked(fromX, fromZ, first.x, first.z) && !isPathBlocked(first.x, first.z, second.x, second.z) && !isPathBlocked(second.x, second.z, toX, toZ)) return [first, second]
    }

    // 第 5 级：兜底
    corners.sort((a, b) => dist(a.x, a.z, fromX, fromZ) - dist(b.x, b.z, fromX, fromZ))
    return [corners[0]]
  }

  return { isPathBlocked, computeWaypoints }
}
