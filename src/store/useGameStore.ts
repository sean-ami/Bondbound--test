import { create } from 'zustand'
import type { RunState, GamePhase, CreatureStats, CardInstance, CreatureId } from '@/types'

interface GameStore extends RunState {
  setPhase: (phase: GamePhase) => void
  updateCreature: (id: CreatureId, updates: Partial<CreatureStats>) => void
  setCreatures: (creatures: CreatureStats[]) => void
  addCardToDeck: (card: CardInstance) => void
  removeCardFromDeck: (instanceId: string) => void
  setMap: (map: RunState['map']) => void
  setBattleResult: (result: RunState['lastBattleResult']) => void
  addPendingEvolution: (id: CreatureId) => void
  shiftPendingEvolution: () => void
  addGold: (amount: number) => void
  spendGold: (amount: number) => void
  initRun: (state: RunState) => void
  resetRun: () => void
}

const EMPTY_RUN: RunState = {
  phase: 'main-menu',
  creatures: [],
  deck: [],
  gold: 100,
  map: { acts: [], currentAct: 0, currentNodeId: null, availableNodeIds: [] },
  lastBattleResult: null,
  pendingEvolutions: [],
}

export const useGameStore = create<GameStore>((set) => ({
  ...EMPTY_RUN,

  setPhase: (phase) => set({ phase }),

  updateCreature: (id, updates) =>
    set((s) => ({
      creatures: s.creatures.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),

  setCreatures: (creatures) => set({ creatures }),

  addCardToDeck: (card) =>
    set((s) => ({ deck: [...s.deck, card] })),

  removeCardFromDeck: (instanceId) =>
    set((s) => ({ deck: s.deck.filter((c) => c.instanceId !== instanceId) })),

  setMap: (map) => set({ map }),

  setBattleResult: (result) => set({ lastBattleResult: result }),

  addPendingEvolution: (id) =>
    set((s) => ({
      pendingEvolutions: s.pendingEvolutions.includes(id)
        ? s.pendingEvolutions
        : [...s.pendingEvolutions, id],
    })),

  shiftPendingEvolution: () =>
    set((s) => ({ pendingEvolutions: s.pendingEvolutions.slice(1) })),

  addGold: (amount) => set((s) => ({ gold: s.gold + amount })),
  spendGold: (amount) => set((s) => ({ gold: Math.max(0, s.gold - amount) })),

  initRun: (state) => set(state),
  resetRun: () => set(EMPTY_RUN),
}))
