import type { CombatState, CreatureId } from '@/types'
import { getCardDef } from '@/data/cards'

export function canAffordCard(combat: CombatState, instanceId: string): boolean {
  const inst = combat.hand.find((c) => c.instanceId === instanceId)
  if (!inst) return false
  const def = getCardDef(inst.definitionId)
  if (!def) return false
  return combat.nextCardFree || combat.energy >= def.energyCost
}

export function isComboActive(combat: CombatState): boolean {
  return combat.comboActive
}

export function getCreatureFromCombat(combat: CombatState, id: CreatureId) {
  return combat.creatures.find((c) => c.id === id)
}

export function getLiveEnemies(combat: CombatState) {
  return combat.enemies.filter((e) => e.currentHp > 0)
}

export function isVictory(combat: CombatState): boolean {
  return combat.enemies.every((e) => e.currentHp <= 0)
}

export function isDefeat(combat: CombatState): boolean {
  return combat.creatures.every((c) => c.currentHp <= 0 || c.isKnockedOut)
}
