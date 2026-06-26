import * as THREE from 'three'
import { create } from 'zustand'
import type { Waypoint } from '../types/scene'

/** 设备信息 */
export interface DeviceInfo {
  type: 'car' | 'soldier' | 'queen' | 'batman'
  name: string
  status: 'online' | 'standby' | 'maintenance'
  params: { label: string; value: string }[]
}

interface SceneStore {
  // 选中状态（用于移动）
  selectedModel: THREE.Object3D | null
  selectedType: 'queen' | 'soldier' | null
  selectModel: (model: THREE.Object3D | null, type: 'queen' | 'soldier' | null) => void

  // 设备信息弹窗
  deviceInfo: DeviceInfo | null
  setDeviceInfo: (info: DeviceInfo | null) => void

  // 移动状态
  moveQueue: Waypoint[]
  setMoveQueue: (queue: Waypoint[]) => void
  clearMoveQueue: () => void

  // 路径线
  pathPoints: Waypoint[] | null
  setPathPoints: (points: Waypoint[] | null) => void

  // 重置（页面切换时清除过期引用）
  resetScene: () => void
}

export const useSceneStore = create<SceneStore>((set) => ({
  selectedModel: null,
  selectedType: null,
  selectModel: (model, type) => set({ selectedModel: model, selectedType: type }),

  deviceInfo: null,
  setDeviceInfo: (info) => set({ deviceInfo: info }),

  moveQueue: [],
  setMoveQueue: (queue) => set({ moveQueue: queue }),
  clearMoveQueue: () => set({ moveQueue: [] }),

  pathPoints: null,
  setPathPoints: (points) => set({ pathPoints: points }),

  resetScene: () =>
    set({
      selectedModel: null,
      selectedType: null,
      deviceInfo: null,
      moveQueue: [],
      pathPoints: null,
    }),
}))
