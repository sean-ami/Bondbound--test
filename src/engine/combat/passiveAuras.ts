import type { CombatState, CreatureId } from '@/types'
import type { PassiveTrigger } from '@/types/creature'
import { getStatusStacks } from './statusEffects'

interface PassiveContext {
  state: CombatState
  trigger: PassiveTrigger
  damageBefore?: number   // used for first-card and multi-hit bonuses
  hitIndex?: number
}

// Returns bonus damage to add (for Kindlpup aura)
export function evalKindlpupPassive(ctx: PassiveContext): number {
  const kp = ctx.state.creatures.find((c) => c.id === 'kindlpup')
  if (!kp || kp.isKnockedOut) return 0

  if (ctx.trigger === 'first-card') {
    if (kp.stage === 0 || kp.stage === 1) return 3
    if (kp.stage === 2) return 5
  }
  if (ctx.trigger === 'on-multi-hit') {
    if (kp.stage === 1) return 2
    if (kp.stage === 2) {
      // also carry momentum for next turn — handled via flag in CombatEngine
      return 2
    }
  }
  return 0
}

// Applies turn-start effects for Sparkwisp
export function evalSparkwispPassiveTurnStart(state: CombatState): CombatState {
  const sw = state.creatures.find((c) => c.id === 'sparkwisp')
  if (!sw || sw.isKnockedOut) return state

  let hand = state.hand
  let drawPile = state.drawPile

  // Static Aura S0: draw 1 extra if 4+ cards played last turn
  if (sw.stage >= 0 && state.cardsPlayedLastTurn >= 4) {
    if (drawPile.length > 0) {
      const [drawn, ...rest] = drawPile
      hand = [...hand, drawn]
      drawPile = rest
    }
  }

  // Arc Aura S1: flag that first energy-gen card costs 0 — handled in playCard by arcAuraUsedThisTurn flag
  // Storm Aura S2: inherits S1 + Wraith Aura detonate bonus (handled in detonateAllShock)

  return { ...state, hand, drawPile }
}

// Returns bonus per shock stack for Wraith Aura
export function getWraithAuraBonusPerStack(state: CombatState): number {
  const sw = state.creatures.find((c) => c.id === 'sparkwisp')
  if (!sw || sw.isKnockedOut || sw.stage < 2) return 0
  return 2
}

// Synergy Pulse: trigger all passive effects at once (returns updated state with bonuses logged)
export function triggerAllPassives(state: CombatState): CombatState {
  let s = state

  // Kindlpup: apply Heat Aura bonus (+3 or +5 damage — but Synergy Pulse isn't an attack,
  // so we manifest this as a small AoE damage instead)
  const kp = state.creatures.find((c) => c.id === 'kindlpup')
  if (kp && !kp.isKnockedOut) {
    const bonus = kp.stage === 2 ? 5 : 3
    s = {
      ...s,
      enemies: s.enemies.map((e) => ({
        ...e,
        currentHp: e.currentHp > 0 ? Math.max(0, e.currentHp - bonus) : e.currentHp,
      })),
    }
  }

  // Mosscub: Persistence-level heal
  const mc = state.creatures.find((c) => c.id === 'mosscub')
  if (mc && !mc.isKnockedOut) {
    const pct = mc.stage === 2 ? 0.05 : 0.02
    const heal = Math.floor(mc.maxHp * pct)
    s = {
      ...s,
      creatures: s.creatures.map((c) =>
        c.id === 'mosscub' ? { ...c, currentHp: Math.min(c.maxHp, c.currentHp + heal) } : c,
      ),
    }
  }

  // Sparkwisp: draw 1 card
  const sw = state.creatures.find((c) => c.id === 'sparkwisp')
  if (sw && !sw.isKnockedOut && s.drawPile.length > 0) {
    const [drawn, ...rest] = s.drawPile
    s = { ...s, hand: [...s.hand, drawn], drawPile: rest }
  }

  return s
}

export function getStatusStacksFromState(state: CombatState, creatureId: CreatureId, type: import('@/types').StatusType): number {
  const c = state.creatures.find((cr) => cr.id === creatureId)
  if (!c) return 0
  return getStatusStacks(c.statuses, type)
}
