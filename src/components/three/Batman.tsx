import { useGLTF } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { modelRegistry } from '../../utils/modelRegistry'
import { useSceneStore } from '../../store/sceneStore'

interface WalkWaypoint {
  x: number
  y: number
  z: number
}

/**
 * 蝙蝠侠绕车行走路径（15 个路径点：下车 → 绕车矩形一周 → 上车）
 * - 先走到车顶前缘，走下车
 * - 在地面绕汽车走一圈矩形
 * - 走回车上，回到车顶中央
 */
const WALK_PATH: WalkWaypoint[] = [
  // ── 走下车顶 ──
  { x: 0, y: 0.7, z: 0.8 }, // 车顶前缘
  { x: 0, y: 0.35, z: 1.4 }, // 半空过渡
  { x: 0, y: 0, z: 1.8 }, // 落地
  // ── 绕车矩形（地面层）──
  { x: 1.8, y: 0, z: 2.0 }, // 右前
  { x: 2.5, y: 0, z: 0 }, // 右中
  { x: 1.8, y: 0, z: -2.0 }, // 右后
  { x: -1.8, y: 0, z: -2.0 }, // 左后
  { x: -2.5, y: 0, z: 0 }, // 左中
  { x: -1.8, y: 0, z: 2.0 }, // 左前
  // ── 走回车前 ──
  { x: 0, y: 0, z: 1.8 },
  // ── 走上车顶 ──
  { x: 0, y: 0.35, z: 1.4 }, // 半空过渡
  { x: 0, y: 0.7, z: 0.8 }, // 车顶前缘
  // ── 回到中央 ──
  { x: 0, y: 0.7, z: 0 },
]

/** 每帧移动速度 */
const WALK_SPEED = 0.04
/** 到达路径点的判定阈值 */
const WAYPOINT_THRESHOLD = 0.08

/** 蝙蝠侠装饰模型（点击触发绕车行走，无选中标识） */
export function Batman() {
  const { scene, animations } = useGLTF('/models/skin.glb')
  const groupRef = useRef<THREE.Group>(null)
  const registered = useRef(false)

  // ── 动画系统 ──
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const walkActionRef = useRef<THREE.AnimationAction | null>(null)

  // ── 行走状态（非响应式，高频更新不走 React） ──
  const isWalkingRef = useRef(false)
  const waypointIdxRef = useRef(0)
  /** 入场完成前不允许行走（防止与入场动画冲突） */
  const entranceDoneRef = useRef(false)

  // ========== 初始化动画（如果模型含有动画数据） ==========
  useEffect(() => {
    if (animations?.length && groupRef.current) {
      const mixer = new THREE.AnimationMixer(groupRef.current)
      mixerRef.current = mixer
      // 取第一个动画作为行走动画
      const clip = mixer.clipAction(animations[0])
      walkActionRef.current = clip
      clip.play()
      clip.paused = true // 默认暂停，行走时恢复
    }
  }, [animations])

  // 遍历场景，让所有 Mesh 投射/接收阴影
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  // 注册到模型注册表
  useEffect(() => {
    if (groupRef.current && !registered.current) {
      registered.current = true
      modelRegistry.batman = groupRef.current
    }
    return () => {
      if (modelRegistry.batman === groupRef.current) {
        modelRegistry.batman = null
        registered.current = false
      }
    }
  }, [scene])

  // 入场动画 1.5s 后放行行走
  useEffect(() => {
    const timer = setTimeout(() => {
      entranceDoneRef.current = true
    }, 1600)
    return () => clearTimeout(timer)
  }, [])

  /** 启动绕车行走（非中断 — 如果正在行走则忽略） */
  const startWalk = () => {
    if (isWalkingRef.current || !groupRef.current || !entranceDoneRef.current) return
    isWalkingRef.current = true
    waypointIdxRef.current = 0
    if (walkActionRef.current) {
      walkActionRef.current.paused = false
      walkActionRef.current.play()
    }
  }

  // ── 点击处理 ──
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

    // 清除现有选中（避免与其它角色冲突）
    const store = useSceneStore.getState()
    if (store.selectedType === 'soldier') modelRegistry.stopSoldier?.()
    store.clearMoveQueue()
    store.selectModel(null, null) // 不选中蝙蝠侠 → 无绿色箭头
    store.setPathPoints(null)

    // 显示设备信息（状态：运行中）
    store.setDeviceInfo({
      type: 'batman',
      name: '哨兵无人机 B-03',
      status: 'online',
      params: [
        { label: '型号', value: 'Bat-Eye' },
        { label: '高度', value: `${((groupRef.current?.position.y ?? 0.7)).toFixed(1)} m` },
        { label: '续航', value: '45 min' },
        { label: '电量', value: '56%' },
        { label: '位置', value: `(${(groupRef.current?.position.x ?? 0).toFixed(1)}, ${(groupRef.current?.position.z ?? 0).toFixed(1)})` },
      ],
    })

    // 触发行走（行走中再次点击不会中断）
    startWalk()
  }

  // ========== 每帧行走逻辑 ==========
  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group || !isWalkingRef.current) return

    const idx = waypointIdxRef.current
    if (idx >= WALK_PATH.length) {
      // 行走完毕 → 结束
      isWalkingRef.current = false
      if (walkActionRef.current) walkActionRef.current.paused = true
      group.position.set(0, 0.7, 0) // 精确保留最终位置
      group.rotation.y = 0 // 面朝车前方（+Z 方向）
      // 状态改回待机
      useSceneStore.getState().setDeviceInfo({
        type: 'batman',
        name: '哨兵无人机 B-03',
        status: 'standby',
        params: [
          { label: '型号', value: 'Bat-Eye' },
          { label: '高度', value: '0.7 m' },
          { label: '续航', value: '45 min' },
          { label: '电量', value: '56%' },
          { label: '位置', value: '(0, 0)' },
        ],
      })
      return
    }

    const target = WALK_PATH[idx]
    const dx = target.x - group.position.x
    const dy = target.y - group.position.y
    const dz = target.z - group.position.z
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

    if (dist < WAYPOINT_THRESHOLD) {
      // 到达当前路径点 → 精确保留位置 → 进入下一个
      group.position.set(target.x, target.y, target.z)
      waypointIdxRef.current++
    } else {
      // 向目标移动
      const step = WALK_SPEED
      group.position.x += (dx / dist) * step
      group.position.y += (dy / dist) * step
      group.position.z += (dz / dist) * step

      // 平滑转向（仅 XZ 平面）
      if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
        const targetAngle = Math.atan2(dx, dz)
        let diff = targetAngle - group.rotation.y
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        group.rotation.y += diff * 0.12
      }
    }

    // 更新动画混合器
    if (mixerRef.current) {
      mixerRef.current.update(Math.min(delta, 0.1))
    }
  })

  return (
    <group
      ref={groupRef}
      scale={0.4}
      position={[0, 0.7, 0]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <primitive object={scene} />
    </group>
  )
}
