import type { CardDefinition } from '@/types'

export const SPARKWISP_CARDS: CardDefinition[] = [
  // ── Stage 0 ──────────────────────────────────────────────
  {
    id: 'zap_flicker_0',
    name: 'Zap Flicker',
    owner: 'sparkwisp',
    stage: 0,
    energyCost: 0,
    rarity: 'signature',
    description: 'Deal 4 damage.',
    tags: ['attack'],
    effect: (ctx) => {
      ctx.dealDamage(ctx.targetEnemyId!, 4)
    },
  },
  {
    id: 'spark_battery_0',
    name: 'Spark Battery',
    owner: 'sparkwisp',
    stage: 0,
    energyCost: 1,
    rarity: 'signature',
    description: 'Gain +1 Energy next turn. Draw 1.',
    tags: ['energy-gen', 'draw'],
    effect: (ctx) => {
      ctx.gainBonusEnergyNextTurn(1)
      ctx.drawCards(1)
    },
  },
  {
    id: 'chain_pulse_0',
    name: 'Chain Pulse',
    owner: 'sparkwisp',
    stage: 0,
    energyCost: 2,
    rarity: 'signature',
    description: 'If 4+ cards played this turn, repeat last card.',
    tags: ['utility'],
    effect: (ctx) => {
      if (ctx.cardsPlayedThisTurn >= 4) {
        ctx.repeatLastCard()
      }
    },
  },

  // ── Stage 1 ──────────────────────────────────────────────
  {
    id: 'zap_flicker_1',
    name: 'Arc Flicker',
    owner: 'sparkwisp',
    stage: 1,
    energyCost: 0,
    rarity: 'signature',
    description: 'Deal 4 damage. If this is the 5th+ card this turn, gain 1 Energy.',
    tags: ['attack', 'energy-gen'],
    effect: (ctx) => {
      ctx.dealDamage(ctx.targetEnemyId!, 4)
      if (ctx.cardsPlayedThisTurn + 1 >= 5) ctx.gainEnergy(1)
    },
  },
  {
    id: 'spark_battery_1',
    name: 'Arc Battery',
    owner: 'sparkwisp',
    stage: 1,
    energyCost: 1,
    rarity: 'signature',
    description: 'Gain +1 Energy next turn. If combo active, also gain 1 Energy now. Draw 1.',
    tags: ['energy-gen', 'draw'],
    effect: (ctx) => {
      ctx.gainBonusEnergyNextTurn(1)
      if (ctx.comboActive) ctx.gainEnergy(1)
      ctx.drawCards(1)
    },
  },
  {
    id: 'chain_pulse_1',
    name: 'Arc Pulse',
    owner: 'sparkwisp',
    stage: 1,
    energyCost: 2,
    rarity: 'signature',
    description: 'If 4+ cards played this turn, repeat last card and apply 2 Shock.',
    tags: ['utility'],
    effect: (ctx) => {
      if (ctx.cardsPlayedThisTurn >= 4) {
        ctx.repeatLastCard()
        if (ctx.targetEnemyId) ctx.applyStatusToEnemy(ctx.targetEnemyId, 'shock', 2)
      }
    },
  },

  // ── Stage 2 ──────────────────────────────────────────────
  {
    id: 'zap_flicker_2',
    name: 'Wraith Flicker',
    owner: 'sparkwisp',
    stage: 2,
    energyCost: 0,
    rarity: 'signature',
    description: 'Deal 4 damage. If 5th+ card this turn, also hit a random enemy for 4.',
    tags: ['attack'],
    effect: (ctx) => {
      ctx.dealDamage(ctx.targetEnemyId!, 4)
      if (ctx.cardsPlayedThisTurn + 1 >= 5) {
        const liveEnemies = ctx.state.enemies.filter((e) => e.currentHp > 0)
        if (liveEnemies.length > 0) {
          const target = liveEnemies[Math.floor(Math.random() * liveEnemies.length)]
          ctx.dealDamage(target.instanceId, 4)
        }
      }
    },
  },
  {
    id: 'spark_battery_2',
    name: 'Storm Battery',
    owner: 'sparkwisp',
    stage: 2,
    energyCost: 1,
    rarity: 'signature',
    description: 'Gain +1 Energy next turn. Draw 1. If combo active, gain 1 Energy and apply 2 Shock to all enemies.',
    tags: ['energy-gen', 'aoe'],
    effect: (ctx) => {
      ctx.gainBonusEnergyNextTurn(1)
      ctx.drawCards(1)
      if (ctx.comboActive) {
        ctx.gainEnergy(1)
        ctx.applyStatusToAllEnemies('shock', 2)
      }
    },
  },
  {
    id: 'chain_pulse_2',
    name: 'Wraith Pulse',
    owner: 'sparkwisp',
    stage: 2,
    energyCost: 2,
    rarity: 'signature',
    description: 'If 4+ cards played this turn, detonate ALL Shock stacks on all enemies (3 dmg/stack).',
    tags: ['attack', 'aoe'],
    effect: (ctx) => {
      if (ctx.cardsPlayedThisTurn >= 4) {
        ctx.detonateAllShock()
      }
    },
  },
]
