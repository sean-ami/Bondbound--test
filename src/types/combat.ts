import type { CardInstance, CardId } from './card'
import type { EnemyState } from './enemy'
import type { CreatureStats } from './creature'

export type CombatPhase = 'player-turn' | 'enemy-turn' | 'victory' | 'defeat'

export interface CombatState {
  phase: CombatPhase
  turn: number
  energy: number
  maxEnergy: number
  bonusEnergyNextTurn: number
  hand: CardInstance[]
  drawPile: CardInstance[]
  discardPile: CardInstance[]
  enemies: EnemyState[]
  creatures: CreatureStats[]
  cardsPlayedThisTurn: number
  cardsPlayedLastTurn: number
  comboActive: boolean
  lastCardPlayedId: CardId | null
  nextCardFree: boolean
  repeatNextCard: boolean
  heatAuraUsedThisTurn: boolean
  momentumCarryover: boolean
  arcAuraUsedThisTurn: boolean
  bondMultiplier: number
  log: string[]
}
