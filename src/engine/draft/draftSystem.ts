import { v4 as uuidv4 } from 'uuid'
import type { CardDefinition, CardInstance, RunState } from '@/types'
import { getDraftableCards } from '@/data/cards'

const RARITY_WEIGHT: Record<string, number> = {
  common: 4,
  uncommon: 2,
  rare: 1,
}

function weightedSample<T extends { rarity: string }>(pool: T[], count: number): T[] {
  const weighted: T[] = []
  for (const card of pool) {
    const w = RARITY_WEIGHT[card.rarity] ?? 1
    for (let i = 0; i < w; i++) weighted.push(card)
  }

  const results: T[] = []
  const used = new Set<string>()

  for (let i = 0; i < count; i++) {
    const remaining = weighted.filter((c) => {
      const key = 'id' in c ? (c as { id: string }).id : JSON.stringify(c)
      return !used.has(key)
    })
    if (remaining.length === 0) break
    const pick = remaining[Math.floor(Math.random() * remaining.length)]
    used.add('id' in pick ? (pick as { id: string }).id : JSON.stringify(pick))
    results.push(pick)
  }

  return results
}

export function generateDraftOptions(runState: RunState, count = 3): CardDefinition[] {
  const inDeck = new Set(runState.deck.map((c) => c.definitionId))
  const pool = getDraftableCards().filter((c) => !inDeck.has(c.id))
  return weightedSample(pool, count)
}

export function addCardToDeck(runState: RunState, cardId: string): RunState {
  if (runState.deck.length >= 20) return runState
  const instance: CardInstance = { instanceId: uuidv4(), definitionId: cardId }
  return { ...runState, deck: [...runState.deck, instance] }
}

export function removeCardFromDeck(runState: RunState, instanceId: string): RunState {
  return { ...runState, deck: runState.deck.filter((c) => c.instanceId !== instanceId) }
}
