import { create } from 'zustand'
import type { CombatState } from '@/types'

interface CombatStore {
  combat: CombatState | null
  setCombat: (state: CombatState) => void
  updateCombat: (updater: (prev: CombatState) => CombatState) => void
  clearCombat: () => void
}

export const useCombatStore = create<CombatStore>((set) => ({
  combat: null,

  setCombat: (state) => set({ combat: state }),

  updateCombat: (updater) =>
    set((s) => ({ combat: s.combat ? updater(s.combat) : s.combat })),

  clearCombat: () => set({ combat: null }),
}))
