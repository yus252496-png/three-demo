import * as THREE from 'three'
import { createAABBAvoidance } from './pathfinder'

/**
 * 模型注册表（模块级单例，非响应式）
 * 模型组件在挂载时注册自己，SceneController 读取注册表进行交互
 */
export const modelRegistry = {
  car: null as THREE.Object3D | null,
  queen: null as THREE.Object3D | null,
  soldier: null as THREE.Object3D | null,
  soldierActions: null as Record<string, THREE.AnimationAction | null> | null,
  soldierMixer: null as THREE.AnimationMixer | null,
  obstacles: [] as THREE.Object3D[],

  /** 由 SceneController 注册：停止士兵动画并切回 idle */
  stopSoldier: null as (() => void) | null,

  /** 缓存的路径规划器实例 */
  _pathfinder: null as ReturnType<typeof createAABBAvoidance> | null,

  /** 获取路径规划器（懒初始化，只创建一次） */
  getPathfinder() {
    if (!this._pathfinder) {
      this._pathfinder = createAABBAvoidance(this.obstacles, {
        safetyMargin: 0.6,
        detourMargin: 1.0,
      })
    }
    return this._pathfinder
  },
}
