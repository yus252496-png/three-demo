import * as THREE from 'three'

export interface ModelRefs {
  car: THREE.Object3D | null
  queen: THREE.Object3D | null
  soldier: THREE.Object3D | null
}
export interface Waypoint {
  x: number
  z: number
}

/** 选中类型 */
export type SelectType = 'queen' | 'soldier' | null

/** 场景配置参数 */
export interface SceneConfig {
  safetyMargin: number
  detourMargin: number
  runThreshold: number
}
