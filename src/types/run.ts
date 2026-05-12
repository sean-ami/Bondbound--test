import type { CreatureStats } from './creature'
import type { CardInstance } from './card'
import type { MapState } from './map'

export type GamePhase =
  | 'main-menu'
  | 'map'
  | 'combat'
  | 'bond-summary'
  | 'evolution'
  | 'draft'
  | 'shop'
  | 'rest'
  | 'event'
  | 'victory'
  | 'game-over'

export interface BondBonus {
  label: string
  amount: number
}

export interface BattleResult {
  victory: boolean
  bondEarned: { base: number; bonuses: BondBonus[]; total: number }
  noKO: boolean
  wasElite: boolean
  wasBoss: boolean
  bondMultiplier: number
}

export interface RunState {
  phase: GamePhase
  creatures: CreatureStats[]
  deck: CardInstance[]
  gold: number
  map: MapState
  lastBattleResult: BattleResult | null
  pendingEvolutions: import('./card').CreatureId[]
}
