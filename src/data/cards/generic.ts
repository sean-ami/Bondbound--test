import type { CardDefinition } from '@/types'

export const GENERIC_CARDS: CardDefinition[] = [
  // ── Common ──────────────────────────────────────────────
  {
    id: 'quick_block',
    name: 'Quick Block',
    owner: 'generic',
    stage: null,
    energyCost: 1,
    rarity: 'common',
    description: 'Gain 5 Block.',
    tags: ['block'],
    effect: (ctx) => {
      ctx.gainBlock('all', 5)
    },
  },
  {
    id: 'strike_plus',
    name: 'Strike+',
    owner: 'generic',
    stage: null,
    energyCost: 1,
    rarity: 'common',
    description: 'Deal 7 damage.',
    tags: ['attack'],
    effect: (ctx) => {
      ctx.dealDamage(ctx.targetEnemyId!, 7)
    },
  },
  {
    id: 'focus',
    name: 'Focus',
    owner: 'generic',
    stage: null,
    energyCost: 1,
    rarity: 'common',
    description: 'Draw 2 cards.',
    tags: ['draw'],
    effect: (ctx) => {
      ctx.drawCards(2)
    },
  },
  {
    id: 'energy_spark',
    name: 'Energy Spark',
    owner: 'generic',
    stage: null,
    energyCost: 0,
    rarity: 'common',
    description: 'Gain +1 Energy this turn.',
    tags: ['energy-gen'],
    effect: (ctx) => {
      ctx.gainEnergy(1)
    },
  },
  {
    id: 'guard_shift',
    name: 'Guard Shift',
    owner: 'generic',
    stage: null,
    energyCost: 1,
    rarity: 'common',
    description: 'All creatures gain 3 Block.',
    tags: ['block', 'utility'],
    effect: (ctx) => {
      ctx.gainBlock('all', 3)
    },
  },

  // ── Uncommon ─────────────────────────────────────────────
  {
    id: 'combo_step',
    name: 'Combo Step',
    owner: 'generic',
    stage: null,
    energyCost: 1,
    rarity: 'uncommon',
    description: 'Next card costs 0 if combo active (3+ cards played this turn).',
    tags: ['utility'],
    effect: (ctx) => {
      if (ctx.comboActive) ctx.setNextCardFree()
    },
  },
  {
    id: 'rooted_stance',
    name: 'Rooted Stance',
    owner: 'generic',
    stage: null,
    energyCost: 1,
    rarity: 'uncommon',
    description: 'Gain 8 Block and 2 Thorns.',
    tags: ['block'],
    effect: (ctx) => {
      ctx.gainBlock('mosscub', 8)
      ctx.applyStatusToCreature('mosscub', 'thorns', 2)
    },
  },
  {
    id: 'ignition',
    name: 'Ignition',
    owner: 'generic',
    stage: null,
    energyCost: 1,
    rarity: 'uncommon',
    description: 'Apply 3 Burn to target.',
    tags: ['utility'],
    effect: (ctx) => {
      if (ctx.targetEnemyId) ctx.applyStatusToEnemy(ctx.targetEnemyId, 'burn', 3)
    },
  },
  {
    id: 'static_echo',
    name: 'Static Echo',
    owner: 'generic',
    stage: null,
    energyCost: 2,
    rarity: 'uncommon',
    description: 'Repeat the last card played at half value.',
    tags: ['utility'],
    effect: (ctx) => {
      ctx.repeatLastCard(true)
    },
  },
  {
    id: 'team_guard',
    name: 'Team Guard',
    owner: 'generic',
    stage: null,
    energyCost: 2,
    rarity: 'uncommon',
    description: 'All creatures gain 4 Block.',
    tags: ['block', 'utility'],
    effect: (ctx) => {
      ctx.gainBlock('all', 4)
    },
  },

  // ── Rare ─────────────────────────────────────────────────
  {
    id: 'synergy_pulse',
    name: 'Synergy Pulse',
    owner: 'generic',
    stage: null,
    energyCost: 2,
    rarity: 'rare',
    description: 'Trigger all three passive auras simultaneously.',
    tags: ['utility'],
    effect: (ctx) => {
      ctx.triggerAllPassives()
    },
  },
  {
    id: 'elemental_burst',
    name: 'Elemental Burst',
    owner: 'generic',
    stage: null,
    energyCost: 2,
    rarity: 'rare',
    description: 'Deal damage to all enemies equal to unique status types on them ×3.',
    tags: ['attack', 'aoe'],
    effect: (ctx) => {
      ctx.state.enemies.forEach((e) => {
        if (e.currentHp <= 0) return
        const unique = new Set(e.statuses.map((s) => s.type)).size
        if (unique > 0) ctx.dealDamage(e.instanceId, unique * 3)
      })
    },
  },
  {
    id: 'bond_echo',
    name: 'Bond Echo',
    owner: 'generic',
    stage: null,
    energyCost: 0,
    rarity: 'rare',
    description: 'Double Bond earned from this battle.',
    tags: ['utility'],
    effect: (ctx) => {
      ctx.addBondMultiplier(2)
    },
  },
  {
    id: 'momentum_surge',
    name: 'Momentum Surge',
    owner: 'generic',
    stage: null,
    energyCost: 2,
    rarity: 'rare',
    description: 'Gain +2 Energy. Draw 2. Next turn starts with +1 Energy.',
    tags: ['energy-gen', 'draw'],
    effect: (ctx) => {
      ctx.gainEnergy(2)
      ctx.drawCards(2)
      ctx.gainBonusEnergyNextTurn(1)
    },
  },
  {
    id: 'natures_blessing',
    name: "Nature's Blessing",
    owner: 'generic',
    stage: null,
    energyCost: 0,
    rarity: 'rare',
    description: "Fully restore one creature's HP. (Best used outside combat.)",
    tags: ['utility'],
    effect: (ctx) => {
      // Heals the lowest-HP creature
      const lowest = [...ctx.state.creatures].sort((a, b) => a.currentHp - b.currentHp)[0]
      if (lowest) ctx.healCreature(lowest.id as import('@/types').CreatureId, lowest.maxHp)
    },
  },
]
