import type { CardEffectContext } from './effect'

export type CreatureId = 'kindlpup' | 'mosscub' | 'sparkwisp'
export type EvolutionStage = 0 | 1 | 2
export type Rarity = 'common' | 'uncommon' | 'rare' | 'signature'
export type CardId = string
export type CardTag = 'attack' | 'block' | 'draw' | 'multi-hit' | 'aoe' | 'energy-gen' | 'utility'

export interface CardDefinition {
  id: CardId
  name: string
  owner: CreatureId | 'generic'
  stage: EvolutionStage | null
  energyCost: number
  rarity: Rarity
  description: string
  tags: CardTag[]
  effect: (ctx: CardEffectContext) => void
}

export interface CardInstance {
  instanceId: string
  definitionId: CardId
}
