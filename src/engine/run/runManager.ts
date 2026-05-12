import { v4 as uuidv4 } from 'uuid'
import type { RunState, CreatureId } from '@/types'
import type { CombatState } from '@/types'
import type { NodeType } from '@/types'
import { STARTING_CREATURES } from '@/data/creatures'
import { getSignatureCards } from '@/data/cards'
import { generateFullMap, markNodeCleared, getNodeById } from '@/engine/map/mapGenerator'
import { calculateBondEarned } from '@/engine/bond/bondCalculator'
import { checkEvolution, applyEvolution } from '@/engine/bond/evolutionCheck'
import { addCardToDeck } from '@/engine/draft/draftSystem'
import { applyAfterBattlePassive } from '@/engine/combat/statusEffects'

// ── New run ───────────────────────────────────────────────────────────────────

export function startNewRun(): RunState {
  const creatures = STARTING_CREATURES.map((c) => ({ ...c }))

  // Build starting deck: 3 stage-0 signature cards per creature
  const deckCards = ['kindlpup', 'mosscub', 'sparkwisp'].flatMap((id) =>
    getSignatureCards(id as CreatureId, 0).map((def) => ({
      instanceId: uuidv4(),
      definitionId: def.id,
    })),
  )

  return {
    phase: 'map',
    creatures,
    deck: deckCards,
    gold: 100,
    map: generateFullMap(),
    lastBattleResult: null,
    pendingEvolutions: [],
  }
}

// ── After battle ends ─────────────────────────────────────────────────────────

export function afterBattle(
  runState: RunState,
  combat: CombatState,
  nodeType: NodeType,
): RunState {
  const victory = combat.phase === 'victory'
  const noKO = !combat.creatures.some((c) => c.isKnockedOut)
  const isElite = nodeType === 'elite'
  const isBoss = nodeType === 'boss'

  // Determine archetype bonus
  const archetypeBonusEarned = false // simplified — could track hit counts in combat
  const archetypeLabel = ''

  const result = calculateBondEarned(
    { victory, noKO, wasElite: isElite, wasBoss: isBoss, archetypeBonusEarned, archetypeLabel, bondMultiplier: combat.bondMultiplier },
    nodeType,
  )

  // Sync creature HP from combat (and revive KO'd creatures at 1 HP)
  let updatedCreatures = combat.creatures.map((c) => ({
    ...c,
    currentHp: c.isKnockedOut ? 1 : c.currentHp,
    isKnockedOut: false,
    block: 0,
    statuses: [] as import('@/types').StatusStack[],
  }))

  // Apply after-battle passive HP restore (Mosscub)
  const mosscub = runState.creatures.find((c) => c.id === 'mosscub')
  const mosscubStage = mosscub?.stage ?? 0
  updatedCreatures = applyAfterBattlePassive(updatedCreatures, mosscubStage)

  // Merge bond from run state (combat doesn't track bond)
  updatedCreatures = updatedCreatures.map((c) => {
    const runCreature = runState.creatures.find((rc) => rc.id === c.id)
    return runCreature ? { ...c, bondAccumulated: runCreature.bondAccumulated, stage: runCreature.stage } : c
  })

  return {
    ...runState,
    phase: victory ? 'bond-summary' : 'game-over',
    creatures: updatedCreatures,
    lastBattleResult: result,
  }
}

// ── Allocate bond ─────────────────────────────────────────────────────────────

export function allocateBond(runState: RunState, creatureId: CreatureId): RunState {
  const result = runState.lastBattleResult
  if (!result) return runState

  const bondAmount = result.bondEarned.total

  const updatedCreatures = runState.creatures.map((c) =>
    c.id === creatureId ? { ...c, bondAccumulated: c.bondAccumulated + bondAmount } : c,
  )

  // Collect all creatures that can evolve
  const readyToEvolve: CreatureId[] = updatedCreatures
    .filter((c) => checkEvolution(c))
    .map((c) => c.id as CreatureId)

  if (readyToEvolve.length === 0) {
    return { ...runState, creatures: updatedCreatures, pendingEvolutions: [], phase: 'draft' }
  }

  // Apply the first evolution immediately so EvolutionScreen sees the evolved creature
  let s: RunState = { ...runState, creatures: updatedCreatures }
  s = applyEvolution(s, readyToEvolve[0])

  return { ...s, pendingEvolutions: readyToEvolve, phase: 'evolution' }
}

// ── Evolution ─────────────────────────────────────────────────────────────────

// Called when the player clicks "Continue" on EvolutionScreen.
// Pops the shown creature and either shows the next or proceeds to draft.
export function triggerEvolution(runState: RunState): RunState {
  // The first item has ALREADY been evolved — just pop it
  const remaining = runState.pendingEvolutions.slice(1)

  if (remaining.length === 0) {
    return { ...runState, pendingEvolutions: [], phase: 'draft' }
  }

  // Apply the next evolution immediately
  let s = { ...runState, pendingEvolutions: remaining }
  s = applyEvolution(s, remaining[0])
  return { ...s, phase: 'evolution' }
}

// ── Card draft ────────────────────────────────────────────────────────────────

export function afterDraft(runState: RunState, cardId: string | null): RunState {
  let s = runState
  if (cardId && s.deck.length < 20) {
    s = addCardToDeck(s, cardId)
  }
  return { ...s, phase: 'map' }
}

// ── Enter map node ────────────────────────────────────────────────────────────

export function enterNode(runState: RunState, nodeId: string): RunState {
  const node = getNodeById(runState.map, nodeId)
  if (!node) return runState

  const phaseMap: Record<NodeType, RunState['phase']> = {
    battle: 'combat',
    elite: 'combat',
    boss: 'combat',
    shop: 'shop',
    rest: 'rest',
    event: 'event',
  }

  const updatedMap = markNodeCleared(runState.map, nodeId)

  return {
    ...runState,
    map: updatedMap,
    phase: phaseMap[node.type],
  }
}

// ── Rest / Shop ───────────────────────────────────────────────────────────────

export function afterRest(runState: RunState, choice: 'heal' | 'bond', targetCreatureId?: CreatureId): RunState {
  let s = runState

  if (choice === 'heal') {
    s = {
      ...s,
      creatures: s.creatures.map((c) => ({
        ...c,
        currentHp: Math.min(c.maxHp, c.currentHp + Math.floor(c.maxHp * 0.30)),
      })),
    }
  } else if (choice === 'bond' && targetCreatureId) {
    s = {
      ...s,
      creatures: s.creatures.map((c) =>
        c.id === targetCreatureId ? { ...c, bondAccumulated: c.bondAccumulated + 5 } : c,
      ),
    }
    // Check evolution
    const updated = s.creatures.find((c) => c.id === targetCreatureId)
    if (updated && checkEvolution(updated)) {
      s = { ...s, pendingEvolutions: [targetCreatureId], phase: 'evolution' }
      return s
    }
  }

  return { ...s, phase: 'map' }
}

export function afterShop(runState: RunState): RunState {
  return { ...runState, phase: 'map' }
}

export function afterEvent(runState: RunState): RunState {
  return { ...runState, phase: 'map' }
}

// ── Check final victory ───────────────────────────────────────────────────────

export function checkFinalVictory(runState: RunState): boolean {
  // All 3 acts' boss nodes cleared
  return runState.map.acts.every((act) => act.some((n) => n.type === 'boss' && n.cleared))
}
