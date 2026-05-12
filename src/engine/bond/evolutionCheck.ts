import type { CreatureStats, CreatureId, RunState } from '@/types'
import { BOND_THRESHOLDS, CREATURE_NAMES, CREATURE_MAX_HP } from '@/data/creatures'
import { getSignatureCardIdForStage } from '@/data/cards'

export function checkEvolution(creature: CreatureStats): boolean {
  if (creature.stage === 0 && creature.bondAccumulated >= BOND_THRESHOLDS[0]) return true
  if (creature.stage === 1 && creature.bondAccumulated >= BOND_THRESHOLDS[1]) return true
  return false
}

export function bondToNextThreshold(creature: CreatureStats): number {
  if (creature.stage === 0) return BOND_THRESHOLDS[0]
  if (creature.stage === 1) return BOND_THRESHOLDS[1]
  return BOND_THRESHOLDS[1] // already maxed
}

export function bondFillFraction(creature: CreatureStats): number {
  if (creature.stage === 2) return 1
  const threshold = bondToNextThreshold(creature)
  const prev = creature.stage === 0 ? 0 : BOND_THRESHOLDS[0]
  return Math.min(1, (creature.bondAccumulated - prev) / (threshold - prev))
}

export function applyEvolution(runState: RunState, creatureId: CreatureId): RunState {
  const creature = runState.creatures.find((c) => c.id === creatureId)
  if (!creature || creature.stage >= 2) return runState

  const newStage = (creature.stage + 1) as 1 | 2
  const names = CREATURE_NAMES[creatureId]
  const hpTable = CREATURE_MAX_HP[creatureId]
  const newMaxHp = hpTable[newStage]
  const hpIncrease = newMaxHp - creature.maxHp

  const updatedCreature: CreatureStats = {
    ...creature,
    stage: newStage,
    name: names[newStage],
    maxHp: newMaxHp,
    currentHp: Math.min(newMaxHp, creature.currentHp + hpIncrease),
  }

  // Swap signature card definitionIds in deck
  const oldStage = creature.stage
  const updatedDeck = runState.deck.map((inst) => {
    const newDefId = getSignatureCardIdForStage(inst.definitionId, newStage)
    if (newDefId === inst.definitionId) return inst

    // Check it was stage oldStage (pattern: ends in _oldStage)
    if (!inst.definitionId.endsWith(`_${oldStage}`)) return inst

    // Check it belongs to this creature
    const prefix = inst.definitionId.replace(/_\d$/, '')
    const belongsToCreature = [
      'primal_pounce', 'ember_guard', 'instinct_howl', // kindlpup
      'bramble_bash', 'moss_hide', 'guardians_call',     // mosscub
      'zap_flicker', 'spark_battery', 'chain_pulse',     // sparkwisp
    ].some((base) => prefix === base)

    if (!belongsToCreature) return inst

    // Make sure it's the right creature's card
    const kindlpupCards = ['primal_pounce', 'ember_guard', 'instinct_howl']
    const mosscubCards = ['bramble_bash', 'moss_hide', 'guardians_call']
    const sparkwispCards = ['zap_flicker', 'spark_battery', 'chain_pulse']
    const cardMap: Record<string, string[]> = {
      kindlpup: kindlpupCards,
      mosscub: mosscubCards,
      sparkwisp: sparkwispCards,
    }
    if (!cardMap[creatureId]?.includes(prefix)) return inst

    return { ...inst, definitionId: newDefId }
  })

  return {
    ...runState,
    creatures: runState.creatures.map((c) => (c.id === creatureId ? updatedCreature : c)),
    deck: updatedDeck,
  }
}
