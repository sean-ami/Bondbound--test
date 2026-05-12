import type { CardDefinition, CreatureId, EvolutionStage } from '@/types'
import { KINDLPUP_CARDS } from './kindlpup'
import { MOSSCUB_CARDS } from './mosscub'
import { SPARKWISP_CARDS } from './sparkwisp'
import { GENERIC_CARDS } from './generic'

export { KINDLPUP_CARDS, MOSSCUB_CARDS, SPARKWISP_CARDS, GENERIC_CARDS }

const ALL_CARDS: CardDefinition[] = [
  ...KINDLPUP_CARDS,
  ...MOSSCUB_CARDS,
  ...SPARKWISP_CARDS,
  ...GENERIC_CARDS,
]

const CARD_MAP = new Map<string, CardDefinition>(ALL_CARDS.map(c => [c.id, c]))

export function getAllCards(): CardDefinition[] {
  return ALL_CARDS
}

export function getCardDef(id: string): CardDefinition | undefined {
  return CARD_MAP.get(id)
}

export function getSignatureCards(creatureId: CreatureId, stage: EvolutionStage): CardDefinition[] {
  return ALL_CARDS.filter(c => c.owner === creatureId && c.stage === stage)
}

export function getDraftableCards(): CardDefinition[] {
  return GENERIC_CARDS
}

export function getSignatureCardIdForStage(baseId: string, newStage: EvolutionStage): string {
  // e.g. 'primal_pounce_0' → 'primal_pounce_2'
  return baseId.replace(/_\d$/, `_${newStage}`)
}
