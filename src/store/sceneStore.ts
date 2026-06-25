import * as THREE from 'three'
import { create } from 'zustand'
import type { Waypoint } from '../types/scene'

interface SceneStore {
  // 选中状态
  selectedModel: THREE.Object3D | null
  selectedType: 'queen' | 'soldier' | null
  selectModel: (model: THREE.Object3D | null, type: 'queen' | 'soldier' | null) => void

  // 移动状态
  moveQueue: Waypoint[]
  setMoveQueue: (queue: Waypoint[]) => void
  clearMoveQueue: () => void

  // 路径线
  pathPoints: Waypoint[] | null
  setPathPoints: (points: Waypoint[] | null) => void
}

export const useSceneStore = create<SceneStore>((set) => ({
  selectedModel: null,
  selectedType: null,
  selectModel: (model, type) => set({ selectedModel: model, selectedType: type }),

  moveQueue: [],
  setMoveQueue: (queue) => set({ moveQueue: queue }),
  clearMoveQueue: () => set({ moveQueue: [] }),

  pathPoints: null,
  setPathPoints: (points) => set({ pathPoints: points }),
}))
