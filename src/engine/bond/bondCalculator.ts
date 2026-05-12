import type { BattleResult, BondBonus } from '@/types'
import type { NodeType } from '@/types'

interface BattleStats {
  victory: boolean
  noKO: boolean
  wasElite: boolean
  wasBoss: boolean
  archetypeBonusEarned: boolean // did the player hit archetype performance threshold?
  archetypeLabel: string
  bondMultiplier: number
}

export function calculateBondEarned(stats: BattleStats, _nodeType: NodeType): BattleResult {
  if (!stats.victory) {
    return {
      victory: false,
      bondEarned: { base: 0, bonuses: [], total: 0 },
      noKO: stats.noKO,
      wasElite: stats.wasElite,
      wasBoss: stats.wasBoss,
      bondMultiplier: 1,
    }
  }

  const base = 5
  const bonuses: BondBonus[] = []

  if (stats.noKO) bonuses.push({ label: 'No KO Bonus', amount: 1 })
  if (stats.wasElite) bonuses.push({ label: 'Elite Victory', amount: 3 })
  if (stats.wasBoss) bonuses.push({ label: 'Boss Victory', amount: 3 })
  if (stats.archetypeBonusEarned) bonuses.push({ label: stats.archetypeLabel, amount: 2 })

  // Ambient bond (always on victory)
  bonuses.push({ label: 'Ambient Bond', amount: 1 })

  const rawTotal = base + bonuses.reduce((s, b) => s + b.amount, 0)
  const total = Math.round(rawTotal * stats.bondMultiplier)

  if (stats.bondMultiplier > 1) {
    bonuses.push({ label: `Bond Echo ×${stats.bondMultiplier}`, amount: total - rawTotal })
  }

  return {
    victory: true,
    bondEarned: { base, bonuses, total },
    noKO: stats.noKO,
    wasElite: stats.wasElite,
    wasBoss: stats.wasBoss,
    bondMultiplier: stats.bondMultiplier,
  }
}
