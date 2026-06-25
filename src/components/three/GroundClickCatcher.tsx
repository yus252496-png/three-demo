import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef } from 'react'
import { useSceneStore } from '../../store/sceneStore'
import { modelRegistry } from '../../utils/modelRegistry'

/**
 * 地面点击捕获器（透明平面）
 * 点击地面 → 选中角色移动到目标点
 *
 * 使用 onPointerDown/Up 手动检测"点击 vs 拖拽/长按"
 */
export function GroundClickCatcher() {
  const pfRef = useRef(modelRegistry.getPathfinder())
  const pointerRef = useRef({ x: 0, y: 0, time: 0 })

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    // 记录按下时的位置和时间，用于区分点击和拖拽
    pointerRef.current = {
      x: e.nativeEvent.clientX,
      y: e.nativeEvent.clientY,
      time: Date.now(),
    }
  }

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    // 检测是否为有效点击（非拖拽、非长按）
    const dx = e.nativeEvent.clientX - pointerRef.current.x
    const dy = e.nativeEvent.clientY - pointerRef.current.y
    const dt = Date.now() - pointerRef.current.time
    // 移动 > 10px 视为拖拽，按住 > 300ms 视为长按 → 都不触发移动
    if (Math.sqrt(dx * dx + dy * dy) > 10 || dt > 300) return

    const store = useSceneStore.getState()
    const selModel = store.selectedModel
    const carModel = modelRegistry.car
    if (!selModel || !carModel) return

    const point = e.point as THREE.Vector3
    const endX = point.x
    const endZ = point.z

    // 超出地面范围（±5）不移动
    if (Math.abs(endX) > 5 || Math.abs(endZ) > 5) return

    // 目标点在汽车包围盒内 → 不移动
    carModel.updateWorldMatrix(true, true)
    const clickBox = new THREE.Box3().setFromObject(carModel).expandByScalar(0.6)
    if (clickBox.containsPoint(new THREE.Vector3(endX, 0.5, endZ))) return

    // 计算路径并移动
    const pf = pfRef.current
    const startX = selModel.position.x
    const startZ = selModel.position.z
    const blocked = pf.isPathBlocked(startX, startZ, endX, endZ)

    if (blocked) {
      const waypoints = pf.computeWaypoints(startX, startZ, endX, endZ)
      const queue = [...waypoints, { x: endX, z: endZ }]
      store.setMoveQueue(queue)
      store.setPathPoints([{ x: startX, z: startZ }, ...waypoints, { x: endX, z: endZ }])
    } else {
      store.setMoveQueue([{ x: endX, z: endZ }])
      store.setPathPoints([{ x: startX, z: startZ }, { x: endX, z: endZ }])
    }
  }

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={[0, 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerUp={handleMove}
    >
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
