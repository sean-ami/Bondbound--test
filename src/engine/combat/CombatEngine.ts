import { v4 as uuidv4 } from 'uuid'
import type { CombatState, CardInstance, CreatureStats, CreatureId } from '@/types'
import type { EnemyDefinition, EnemyState } from '@/types'
import type { CardEffectContext } from '@/types'
import { getCardDef } from '@/data/cards'
import {
  applyDamageToEnemy,
  tickAllStatuses,
  addStatus,
  detonateAllShock,
  applyBattleStartPassive,
} from './statusEffects'
import {
  evalKindlpupPassive,
  evalSparkwispPassiveTurnStart,
  triggerAllPassives,
} from './passiveAuras'
import { selectIntent, executeAllEnemyIntents, advanceEnemyPatterns } from './enemyAI'

// ── Deck helpers ──────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function drawFromPile(
  hand: CardInstance[],
  drawPile: CardInstance[],
  discardPile: CardInstance[],
  count: number,
): { hand: CardInstance[]; drawPile: CardInstance[]; discardPile: CardInstance[] } {
  let h = [...hand], dp = [...drawPile], disc = [...discardPile]
  for (let i = 0; i < count; i++) {
    if (dp.length === 0) {
      if (disc.length === 0) break
      dp = shuffle(disc)
      disc = []
    }
    h.push(dp.shift()!)
  }
  return { hand: h, drawPile: dp, discardPile: disc }
}

// ── Init ──────────────────────────────────────────────────────────────────────

export function initCombat(
  deck: CardInstance[],
  creatures: CreatureStats[],
  enemyDefs: EnemyDefinition[],
): CombatState {
  const shuffledDeck = shuffle(deck)

  const enemies: EnemyState[] = enemyDefs.map((def) => ({
    definitionId: def.id,
    instanceId: uuidv4(),
    name: def.name,
    emoji: def.emoji,
    maxHp: def.baseHp,
    currentHp: def.baseHp,
    block: 0,
    statuses: [],
    intent: selectIntent(def, 0),
    patternIndex: 0,
  }))

  const base: CombatState = {
    phase: 'player-turn',
    turn: 1,
    energy: 3,
    maxEnergy: 3,
    bonusEnergyNextTurn: 0,
    hand: [],
    drawPile: shuffledDeck,
    discardPile: [],
    enemies,
    creatures: creatures.map((c) => ({ ...c, block: 0 })),
    cardsPlayedThisTurn: 0,
    cardsPlayedLastTurn: 0,
    comboActive: false,
    lastCardPlayedId: null,
    nextCardFree: false,
    repeatNextCard: false,
    heatAuraUsedThisTurn: false,
    momentumCarryover: false,
    arcAuraUsedThisTurn: false,
    bondMultiplier: 1,
    log: [],
  }

  // Apply battle-start passives (Earthheart - Mosscub S2)
  const withPassives = { ...base, creatures: applyBattleStartPassive(base.creatures) }

  // Draw initial hand
  const drawn = drawFromPile([], withPassives.drawPile, withPassives.discardPile, 5)
  const withHand = { ...withPassives, ...drawn }

  // Apply Sparkwisp turn-start passives
  return evalSparkwispPassiveTurnStart(withHand)
}

// ── Start new player turn ─────────────────────────────────────────────────────

export function startPlayerTurn(state: CombatState): CombatState {
  let s: CombatState = {
    ...state,
    creatures: state.creatures.map((c) => ({ ...c, block: 0 })),
    energy: state.maxEnergy + state.bonusEnergyNextTurn,
    bonusEnergyNextTurn: 0,
    cardsPlayedThisTurn: 0,
    comboActive: false,
    lastCardPlayedId: null,
    nextCardFree: false,
    repeatNextCard: false,
    heatAuraUsedThisTurn: false,
    arcAuraUsedThisTurn: false,
    phase: 'player-turn',
    turn: state.turn + 1,
  }

  // Discard hand, draw 5
  s = { ...s, discardPile: [...s.discardPile, ...s.hand], hand: [] }
  const drawn = drawFromPile([], s.drawPile, s.discardPile, 5)
  s = { ...s, ...drawn }

  // Sparkwisp turn-start passives
  s = evalSparkwispPassiveTurnStart(s)

  return s
}

// ── Play a card ───────────────────────────────────────────────────────────────

export function playCard(
  state: CombatState,
  instanceId: string,
  targetEnemyId?: string,
): CombatState {
  const instance = state.hand.find((c) => c.instanceId === instanceId)
  if (!instance) return state

  const def = getCardDef(instance.definitionId)
  if (!def) return state

  const actualCost = state.nextCardFree ? 0 : def.energyCost
  if (state.energy < actualCost) return state

  // Save repeat flag BEFORE this card sets it
  const shouldRepeat = state.repeatNextCard

  let s: CombatState = {
    ...state,
    energy: state.energy - actualCost,
    hand: state.hand.filter((c) => c.instanceId !== instanceId),
    discardPile: [...state.discardPile, instance],
    nextCardFree: false,
    repeatNextCard: false,
  }

  // Arc Aura S1: refund cost for first energy-gen card
  const isEnergyGen = def.tags.includes('energy-gen')
  const sw = s.creatures.find((c) => c.id === 'sparkwisp')
  if (isEnergyGen && sw && sw.stage >= 1 && !s.arcAuraUsedThisTurn && actualCost > 0) {
    s = { ...s, energy: s.energy + actualCost, arcAuraUsedThisTurn: true }
  }

  // Run the card effect
  s = runCardEffect(s, def.id, targetEnemyId)

  // Track first-card aura usage
  if (s.cardsPlayedThisTurn === 0) {
    s = { ...s, heatAuraUsedThisTurn: true }
  }

  // Increment combo counter
  s = {
    ...s,
    cardsPlayedThisTurn: s.cardsPlayedThisTurn + 1,
    lastCardPlayedId: def.id,
    comboActive: s.cardsPlayedThisTurn + 1 >= 3,
  }

  // Repeat from Storm Howl
  if (shouldRepeat) {
    s = runCardEffect(s, def.id, targetEnemyId)
    s = { ...s, cardsPlayedThisTurn: s.cardsPlayedThisTurn + 1 }
  }

  s = { ...s, log: [...s.log, `Played ${def.name}`] }

  return s
}

// ── Effect runner ─────────────────────────────────────────────────────────────

function runCardEffect(
  state: CombatState,
  cardId: string,
  targetEnemyId?: string,
  halfValue = false,
): CombatState {
  const def = getCardDef(cardId)
  if (!def) return state

  let s = state

  const ctx: CardEffectContext = {
    state: s,
    source: def.owner === 'generic' ? 'kindlpup' : def.owner as CreatureId,
    targetEnemyId,
    cardsPlayedThisTurn: s.cardsPlayedThisTurn,
    lastCardPlayedId: s.lastCardPlayedId,
    comboActive: s.comboActive,

    dealDamage: (targetId, amount, opts) => {
      let dmg = halfValue ? Math.floor(amount / 2) : amount
      const kp = s.creatures.find((c) => c.id === 'kindlpup')
      let bonus = 0
      if (!s.heatAuraUsedThisTurn && s.cardsPlayedThisTurn === 0 && kp && !kp.isKnockedOut) {
        bonus += evalKindlpupPassive({ state: s, trigger: 'first-card' })
      }
      if (opts?.isMultiHit && kp && !kp.isKnockedOut) {
        bonus += evalKindlpupPassive({ state: s, trigger: 'on-multi-hit' })
        if (kp.stage === 2 && s.momentumCarryover && (opts.hitIndex ?? 0) === 0) bonus += 2
      }
      dmg += bonus
      const { newState, actualDamage } = applyDamageToEnemy(s, targetId, dmg)
      s = newState
      return actualDamage
    },

    dealDamageAllEnemies: (amount) => {
      const dmg = halfValue ? Math.floor(amount / 2) : amount
      for (const e of s.enemies) {
        if (e.currentHp <= 0) continue
        const { newState } = applyDamageToEnemy(s, e.instanceId, dmg)
        s = newState
      }
    },

    gainBlock: (creatureId, amount) => {
      s = {
        ...s,
        creatures: s.creatures.map((c) => {
          if (creatureId !== 'all' && c.id !== creatureId) return c
          return { ...c, block: c.block + amount }
        }),
      }
    },

    applyStatusToEnemy: (targetId, type, stacks) => {
      s = {
        ...s,
        enemies: s.enemies.map((e) =>
          e.instanceId === targetId ? { ...e, statuses: addStatus(e.statuses, type, stacks) } : e,
        ),
      }
    },

    applyStatusToAllEnemies: (type, stacks) => {
      s = {
        ...s,
        enemies: s.enemies.map((e) =>
          e.currentHp > 0 ? { ...e, statuses: addStatus(e.statuses, type, stacks) } : e,
        ),
      }
    },

    applyStatusToCreature: (creatureId, type, stacks) => {
      s = {
        ...s,
        creatures: s.creatures.map((c) =>
          c.id === creatureId ? { ...c, statuses: addStatus(c.statuses, type, stacks) } : c,
        ),
      }
    },

    drawCards: (count) => {
      const result = drawFromPile(s.hand, s.drawPile, s.discardPile, count)
      s = { ...s, ...result }
    },

    gainEnergy: (amount) => { s = { ...s, energy: s.energy + amount } },

    gainBonusEnergyNextTurn: (amount) => {
      s = { ...s, bonusEnergyNextTurn: s.bonusEnergyNextTurn + amount }
    },

    setNextCardFree: () => { s = { ...s, nextCardFree: true } },

    setRepeatNextCard: () => { s = { ...s, repeatNextCard: true } },

    detonateAllShock: () => {
      const swStage = s.creatures.find((c) => c.id === 'sparkwisp')?.stage ?? 0
      s = detonateAllShock(s, swStage)
    },

    triggerAllPassives: () => { s = triggerAllPassives(s) },

    healCreature: (creatureId, amount) => {
      s = {
        ...s,
        creatures: s.creatures.map((c) =>
          c.id === creatureId ? { ...c, currentHp: Math.min(c.maxHp, c.currentHp + amount) } : c,
        ),
      }
    },

    addBondMultiplier: (multiplier) => {
      s = { ...s, bondMultiplier: s.bondMultiplier * multiplier }
    },

    repeatLastCard: (hv = false) => {
      if (s.lastCardPlayedId) {
        s = runCardEffect(s, s.lastCardPlayedId, targetEnemyId, hv)
      }
    },
  }

  def.effect(ctx)
  return s
}

// ── End player turn ───────────────────────────────────────────────────────────

export function endPlayerTurn(state: CombatState): CombatState {
  const kp = state.creatures.find((c) => c.id === 'kindlpup')
  const hadMultiHit = state.cardsPlayedThisTurn > 1 && kp && kp.stage === 2

  let s: CombatState = {
    ...state,
    cardsPlayedLastTurn: state.cardsPlayedThisTurn,
    momentumCarryover: !!hadMultiHit,
    phase: 'enemy-turn',
  }

  s = tickAllStatuses(s)
  s = executeAllEnemyIntents(s)
  s = tickAllStatuses(s)
  s = advanceEnemyPatterns(s)

  s = {
    ...s,
    creatures: s.creatures.map((c) => ({
      ...c,
      isKnockedOut: c.currentHp <= 0,
    })),
  }

  const allDead = s.enemies.every((e) => e.currentHp <= 0)
  const allKO = s.creatures.every((c) => c.currentHp <= 0 || c.isKnockedOut)

  if (allDead) return { ...s, phase: 'victory' }
  if (allKO) return { ...s, phase: 'defeat' }

  return startPlayerTurn(s)
}
