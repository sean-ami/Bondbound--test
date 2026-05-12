import type { CreatureId, CardId } from './card'

export type StatusType = 'burn' | 'shock' | 'thorns' | 'regen' | 'weak' | 'vulnerable'

export interface StatusStack {
  type: StatusType
  stacks: number
}

export interface CardEffectContext {
  state: import('./combat').CombatState
  source: CreatureId | 'generic'
  targetEnemyId?: string
  // These reflect counts BEFORE this card increments them
  cardsPlayedThisTurn: number
  lastCardPlayedId: CardId | null
  comboActive: boolean
  // Mutators (call these to modify state)
  dealDamage: (targetId: string, amount: number, opts?: DamageOptions) => number
  dealDamageAllEnemies: (amount: number) => void
  gainBlock: (creatureId: CreatureId | 'all', amount: number) => void
  applyStatusToEnemy: (targetId: string, type: StatusType, stacks: number) => void
  applyStatusToAllEnemies: (type: StatusType, stacks: number) => void
  applyStatusToCreature: (creatureId: CreatureId, type: StatusType, stacks: number) => void
  drawCards: (count: number) => void
  gainEnergy: (amount: number) => void
  gainBonusEnergyNextTurn: (amount: number) => void
  setNextCardFree: () => void
  setRepeatNextCard: () => void
  detonateAllShock: () => void
  triggerAllPassives: () => void
  healCreature: (creatureId: CreatureId, amount: number) => void
  addBondMultiplier: (multiplier: number) => void
  repeatLastCard: (halfValue?: boolean) => void
}

export interface DamageOptions {
  isMultiHit?: boolean
  hitIndex?: number
}
