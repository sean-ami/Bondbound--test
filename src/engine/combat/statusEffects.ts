import type { CombatState, StatusType, CreatureId } from '@/types'
import type { EnemyState } from '@/types'
import type { CreatureStats } from '@/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getStatusStacks(statuses: { type: StatusType; stacks: number }[], type: StatusType): number {
  return statuses.find((s) => s.type === type)?.stacks ?? 0
}

export function addStatus(
  statuses: { type: StatusType; stacks: number }[],
  type: StatusType,
  stacks: number,
): { type: StatusType; stacks: number }[] {
  const existing = statuses.find((s) => s.type === type)
  if (existing) {
    return statuses.map((s) => (s.type === type ? { ...s, stacks: s.stacks + stacks } : s))
  }
  return [...statuses, { type, stacks }]
}

export function removeStatus(
  statuses: { type: StatusType; stacks: number }[],
  type: StatusType,
): { type: StatusType; stacks: number }[] {
  return statuses.filter((s) => s.type !== type)
}

export function setStatusStacks(
  statuses: { type: StatusType; stacks: number }[],
  type: StatusType,
  stacks: number,
): { type: StatusType; stacks: number }[] {
  if (stacks <= 0) return removeStatus(statuses, type)
  const existing = statuses.find((s) => s.type === type)
  if (existing) return statuses.map((s) => (s.type === type ? { ...s, stacks } : s))
  return [...statuses, { type, stacks }]
}

// ── Tick end-of-player-turn statuses ─────────────────────────────────────────

export function tickCreatureStatuses(creature: CreatureStats): CreatureStats {
  let updated = { ...creature, statuses: [...creature.statuses] }

  // Burn: deal stacks damage, then decay
  const burn = getStatusStacks(updated.statuses, 'burn')
  if (burn > 0) {
    updated.currentHp = Math.max(0, updated.currentHp - burn)
    const newStacks = burn - 1
    updated.statuses = setStatusStacks(updated.statuses, 'burn', newStacks)
  }

  // Regen: heal stacks HP, then decay
  const regen = getStatusStacks(updated.statuses, 'regen')
  if (regen > 0) {
    updated.currentHp = Math.min(updated.maxHp, updated.currentHp + regen)
    updated.statuses = setStatusStacks(updated.statuses, 'regen', regen - 1)
  }

  return updated
}

export function tickEnemyStatuses(enemy: EnemyState): EnemyState {
  let updated = { ...enemy, statuses: [...enemy.statuses] }

  const burn = getStatusStacks(updated.statuses, 'burn')
  if (burn > 0) {
    updated.currentHp = Math.max(0, updated.currentHp - burn)
    updated.statuses = setStatusStacks(updated.statuses, 'burn', burn - 1)
  }

  const regen = getStatusStacks(updated.statuses, 'regen')
  if (regen > 0) {
    updated.currentHp = Math.min(updated.maxHp, updated.currentHp + regen)
    updated.statuses = setStatusStacks(updated.statuses, 'regen', regen - 1)
  }

  return updated
}

// ── Apply damage accounting for Vulnerable / Weak / Block ────────────────────

export function calcDamageToEnemy(
  enemy: EnemyState,
  baseDamage: number,
  attackerHasWeak: boolean,
): { damageTaken: number; blocked: number } {
  let dmg = baseDamage
  if (attackerHasWeak) dmg = Math.floor(dmg * 0.75)
  const vuln = getStatusStacks(enemy.statuses, 'vulnerable')
  if (vuln > 0) dmg = Math.floor(dmg * 1.5)
  const blocked = Math.min(enemy.block, dmg)
  const damageTaken = dmg - blocked
  return { damageTaken, blocked }
}

export function calcDamageToCreature(
  creature: CreatureStats,
  baseDamage: number,
  enemyHasWeak: boolean,
): { damageTaken: number; blocked: number; thornsDmg: number } {
  let dmg = baseDamage
  if (enemyHasWeak) dmg = Math.floor(dmg * 0.75)
  const vuln = getStatusStacks(creature.statuses, 'vulnerable')
  if (vuln > 0) dmg = Math.floor(dmg * 1.5)
  const blocked = Math.min(creature.block, dmg)
  const damageTaken = dmg - blocked
  const thorns = getStatusStacks(creature.statuses, 'thorns')
  const thornsDmg = thorns > 0 && dmg > 0 ? thorns : 0
  return { damageTaken, blocked, thornsDmg }
}

// ── Apply damage to enemy, returns actual damage dealt ────────────────────────

export function applyDamageToEnemy(
  state: CombatState,
  enemyId: string,
  baseDamage: number,
): { newState: CombatState; actualDamage: number } {
  const newState = { ...state, enemies: [...state.enemies] }
  const idx = newState.enemies.findIndex((e) => e.instanceId === enemyId)
  if (idx === -1) return { newState, actualDamage: 0 }

  const enemy = { ...newState.enemies[idx], statuses: [...newState.enemies[idx].statuses] }
  // Creatures never have Weak in this design, but enemies can
  const { damageTaken, blocked } = calcDamageToEnemy(enemy, baseDamage, false)
  enemy.block = Math.max(0, enemy.block - blocked)
  enemy.currentHp = Math.max(0, enemy.currentHp - damageTaken)
  newState.enemies[idx] = enemy
  return { newState, actualDamage: damageTaken }
}

// ── Tick all statuses ─────────────────────────────────────────────────────────

export function tickAllStatuses(state: CombatState): CombatState {
  return {
    ...state,
    creatures: state.creatures.map(tickCreatureStatuses),
    enemies: state.enemies.map(tickEnemyStatuses),
  }
}

// ── After-battle passive HP restore ──────────────────────────────────────────

export function applyAfterBattlePassive(creatures: CreatureStats[], mosscubStage: number): CreatureStats[] {
  let pct = 0
  if (mosscubStage === 0) pct = 0.02
  else if (mosscubStage === 1) pct = 0.05
  else if (mosscubStage === 2) pct = 0.10

  return creatures.map((c) => ({
    ...c,
    currentHp: Math.min(c.maxHp, c.currentHp + Math.floor(c.maxHp * pct)),
  }))
}

// ── Apply block at battle-start for Earthheart passive ───────────────────────

export function applyBattleStartPassive(creatures: CreatureStats[]): CreatureStats[] {
  const mosscub = creatures.find((c) => c.id === 'mosscub')
  if (!mosscub || mosscub.stage !== 2 || mosscub.isKnockedOut) return creatures

  return creatures.map((c) => {
    if (c.id !== 'mosscub') return c
    const healAmt = Math.floor(c.maxHp * 0.10)
    return {
      ...c,
      currentHp: Math.min(c.maxHp, c.currentHp + healAmt),
      block: c.block + 5,
    }
  })
}

// ── Detonation ────────────────────────────────────────────────────────────────

export function detonateShockOnEnemy(
  state: CombatState,
  enemyId: string,
  bonusPerStack: number,
): { newState: CombatState; totalDamage: number } {
  const idx = state.enemies.findIndex((e) => e.instanceId === enemyId)
  if (idx === -1) return { newState: state, totalDamage: 0 }

  const enemy = { ...state.enemies[idx] }
  const stacks = getStatusStacks(enemy.statuses, 'shock')
  if (stacks === 0) return { newState: state, totalDamage: 0 }

  const dmgPerStack = 3 + bonusPerStack
  const total = stacks * dmgPerStack
  enemy.statuses = removeStatus(enemy.statuses, 'shock')
  enemy.currentHp = Math.max(0, enemy.currentHp - total)

  const newEnemies = [...state.enemies]
  newEnemies[idx] = enemy
  return { newState: { ...state, enemies: newEnemies }, totalDamage: total }
}

export function detonateAllShock(state: CombatState, sparkwispStage: number): CombatState {
  const bonusPerStack = sparkwispStage === 2 ? 2 : 0
  let s = state
  for (const enemy of state.enemies) {
    if (enemy.currentHp <= 0) continue
    const { newState } = detonateShockOnEnemy(s, enemy.instanceId, bonusPerStack)
    s = newState
  }
  return s
}

export type { CreatureId }
