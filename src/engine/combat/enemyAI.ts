import type { EnemyDefinition, EnemyState, EnemyIntent, CombatState } from '@/types'
import { addStatus, getStatusStacks } from './statusEffects'
import { getEnemyById } from '@/data/enemies'

export function selectIntent(def: EnemyDefinition, patternIndex: number): EnemyIntent {
  const pattern = def.aiPattern
  const action = pattern.kind === 'fixed'
    ? pattern.actions[patternIndex % pattern.actions.length]
    : weightedRandom(pattern.actions)

  const labels: Record<string, string> = {
    'attack': `⚔️ ${action.value}`,
    'multi-attack': `⚔️ ${action.value}×${action.hits ?? 2}`,
    'big-attack': `💥 ${action.value}`,
    'block': `🛡️ ${action.value}`,
    'buff': `💪 Block ${action.value}`,
    'burn': `🔥 Burn`,
    'shock': `⚡ Shock`,
  }

  return {
    type: action.type,
    value: action.value,
    hits: action.hits,
    label: labels[action.type] ?? action.type,
  }
}

function weightedRandom<T extends { weight: number }>(actions: T[]): T {
  const total = actions.reduce((s, a) => s + a.weight, 0)
  let r = Math.random() * total
  for (const a of actions) {
    r -= a.weight
    if (r <= 0) return a
  }
  return actions[actions.length - 1]
}

export function executeEnemyIntent(
  state: CombatState,
  enemy: EnemyState,
): CombatState {
  const intent = enemy.intent
  let s = state

  const liveCreatures = s.creatures.filter((c) => !c.isKnockedOut && c.currentHp > 0)
  if (liveCreatures.length === 0) return s

  const target = [...liveCreatures].sort((a, b) => a.currentHp - b.currentHp)[0]

  switch (intent.type) {
    case 'attack':
    case 'big-attack': {
      s = applyDamageToCreature(s, target.id, intent.value ?? 0, enemy)
      break
    }
    case 'multi-attack': {
      const hits = intent.hits ?? 2
      for (let i = 0; i < hits; i++) {
        const freshTarget = s.creatures
          .filter((c) => !c.isKnockedOut && c.currentHp > 0)
          .sort((a, b) => a.currentHp - b.currentHp)[0]
        if (!freshTarget) break
        s = applyDamageToCreature(s, freshTarget.id, intent.value ?? 0, enemy)
      }
      break
    }
    case 'block':
    case 'buff': {
      s = {
        ...s,
        enemies: s.enemies.map((e) =>
          e.instanceId === enemy.instanceId
            ? { ...e, block: e.block + (intent.value ?? 0) }
            : e,
        ),
      }
      break
    }
    case 'burn':
    case 'shock': {
      const statusType = intent.type
      const randTarget = liveCreatures[Math.floor(Math.random() * liveCreatures.length)]
      s = {
        ...s,
        creatures: s.creatures.map((c) =>
          c.id === randTarget.id
            ? { ...c, statuses: addStatus(c.statuses, statusType, intent.value ?? 2) }
            : c,
        ),
      }
      break
    }
  }

  return s
}

function applyDamageToCreature(
  state: CombatState,
  creatureId: string,
  baseDamage: number,
  enemy: EnemyState,
): CombatState {
  let thornsDamageToEnemy = 0

  const newCreatures = state.creatures.map((c) => {
    if (c.id !== creatureId) return c

    let dmg = baseDamage
    const enemyWeak = getStatusStacks(enemy.statuses, 'weak')
    if (enemyWeak > 0) dmg = Math.floor(dmg * 0.75)
    const vuln = getStatusStacks(c.statuses, 'vulnerable')
    if (vuln > 0) dmg = Math.floor(dmg * 1.5)

    const blocked = Math.min(c.block, dmg)
    const damageTaken = dmg - blocked
    const newBlock = c.block - blocked
    const newHp = Math.max(0, c.currentHp - damageTaken)

    const thorns = getStatusStacks(c.statuses, 'thorns')
    if (thorns > 0 && dmg > 0) thornsDamageToEnemy += thorns

    return { ...c, block: newBlock, currentHp: newHp, isKnockedOut: newHp <= 0 }
  })

  let newEnemies = state.enemies
  if (thornsDamageToEnemy > 0) {
    newEnemies = state.enemies.map((e) =>
      e.instanceId === enemy.instanceId
        ? { ...e, currentHp: Math.max(0, e.currentHp - thornsDamageToEnemy) }
        : e,
    )
  }

  return { ...state, creatures: newCreatures, enemies: newEnemies }
}

export function executeAllEnemyIntents(state: CombatState): CombatState {
  let s = state
  for (const enemy of state.enemies.filter((e) => e.currentHp > 0)) {
    s = executeEnemyIntent(s, enemy)
  }
  return s
}

export function advanceEnemyPatterns(state: CombatState): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((e) => {
      const def = getEnemyById(e.definitionId)
      if (!def) return e
      const nextIndex = e.patternIndex + 1
      const newIntent = selectIntent(def, nextIndex)
      return { ...e, patternIndex: nextIndex, intent: newIntent }
    }),
  }
}
