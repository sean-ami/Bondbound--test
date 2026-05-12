import type { CreatureId, EvolutionStage } from './card'
import type { StatusStack } from './effect'

export interface CreatureStats {
  id: CreatureId
  name: string
  emoji: string
  color: string
  stage: EvolutionStage
  maxHp: number
  currentHp: number
  block: number
  statuses: StatusStack[]
  bondAccumulated: number
  isKnockedOut: boolean
}

export type PassiveTrigger =
  | 'turn-start'
  | 'after-battle'
  | 'battle-start'
  | 'first-card'
  | 'on-multi-hit'
  | 'on-energy-gen'
  | 'shock-detonate'
