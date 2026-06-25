import { create } from 'zustand'

const TOTAL = 4

interface LoadingStore {
  loaded: number
  markOne: () => void
}

export const useLoadingStore = create<LoadingStore>((set, get) => ({
  loaded: 0,
  markOne: () => void set({ loaded: get().loaded + 1 }),
}))

/** 计算百分比 */
export function calcProgress(loaded: number) {
  return Math.round((loaded / TOTAL) * 100)
}

export const TOTAL_MODELS = TOTAL
