import type { CardDefinition } from '@/types'

export const KINDLPUP_CARDS: CardDefinition[] = [
  // ── Stage 0 ──────────────────────────────────────────────
  {
    id: 'primal_pounce_0',
    name: 'Primal Pounce',
    owner: 'kindlpup',
    stage: 0,
    energyCost: 1,
    rarity: 'signature',
    description: 'Deal 8 damage. If first card this turn, deal 3 more.',
    tags: ['attack'],
    effect: (ctx) => {
      const bonus = ctx.cardsPlayedThisTurn === 0 ? 3 : 0
      ctx.dealDamage(ctx.targetEnemyId!, 8 + bonus)
    },
  },
  {
    id: 'ember_guard_0',
    name: 'Ember Guard',
    owner: 'kindlpup',
    stage: 0,
    energyCost: 1,
    rarity: 'signature',
    description: 'Gain 8 Block. Apply 2 Burn to self.',
    tags: ['block'],
    effect: (ctx) => {
      ctx.gainBlock('kindlpup', 8)
      ctx.applyStatusToCreature('kindlpup', 'burn', 2)
    },
  },
  {
    id: 'instinct_howl_0',
    name: 'Instinct Howl',
    owner: 'kindlpup',
    stage: 0,
    energyCost: 1,
    rarity: 'signature',
    description: 'Draw 2. If 3+ cards played this turn, gain 1 Energy.',
    tags: ['draw', 'energy-gen'],
    effect: (ctx) => {
      ctx.drawCards(2)
      if (ctx.cardsPlayedThisTurn >= 3) ctx.gainEnergy(1)
    },
  },

  // ── Stage 1 ──────────────────────────────────────────────
  {
    id: 'primal_pounce_1',
    name: 'Ember Pounce',
    owner: 'kindlpup',
    stage: 1,
    energyCost: 1,
    rarity: 'signature',
    description: 'Deal 8 damage. Apply 2 Burn.',
    tags: ['attack'],
    effect: (ctx) => {
      ctx.dealDamage(ctx.targetEnemyId!, 8)
      ctx.applyStatusToEnemy(ctx.targetEnemyId!, 'burn', 2)
    },
  },
  {
    id: 'ember_guard_1',
    name: 'Flamehide',
    owner: 'kindlpup',
    stage: 1,
    energyCost: 1,
    rarity: 'signature',
    description: 'Gain 8 Block. Refund 1 Energy.',
    tags: ['block', 'energy-gen'],
    effect: (ctx) => {
      ctx.gainBlock('kindlpup', 8)
      ctx.gainEnergy(1)
    },
  },
  {
    id: 'instinct_howl_1',
    name: 'Ember Howl',
    owner: 'kindlpup',
    stage: 1,
    energyCost: 1,
    rarity: 'signature',
    description: 'Draw 2. Apply 2 Vulnerable to target.',
    tags: ['draw', 'utility'],
    effect: (ctx) => {
      ctx.drawCards(2)
      if (ctx.targetEnemyId) ctx.applyStatusToEnemy(ctx.targetEnemyId, 'vulnerable', 2)
    },
  },

  // ── Stage 2 ──────────────────────────────────────────────
  {
    id: 'primal_pounce_2',
    name: 'Dire Pounce',
    owner: 'kindlpup',
    stage: 2,
    energyCost: 1,
    rarity: 'signature',
    description: 'Deal 8 damage twice.',
    tags: ['attack', 'multi-hit'],
    effect: (ctx) => {
      ctx.dealDamage(ctx.targetEnemyId!, 8, { isMultiHit: true, hitIndex: 0 })
      ctx.dealDamage(ctx.targetEnemyId!, 8, { isMultiHit: true, hitIndex: 1 })
    },
  },
  {
    id: 'ember_guard_2',
    name: 'Infernohide',
    owner: 'kindlpup',
    stage: 2,
    energyCost: 1,
    rarity: 'signature',
    description: 'Gain 8 Block. At end of turn, spread 2 Burn to all enemies.',
    tags: ['block'],
    effect: (ctx) => {
      ctx.gainBlock('kindlpup', 8)
      // Spread burn is handled by a flag check in end-of-turn — apply it now as AoE
      ctx.applyStatusToAllEnemies('burn', 2)
    },
  },
  {
    id: 'instinct_howl_2',
    name: 'Storm Howl',
    owner: 'kindlpup',
    stage: 2,
    energyCost: 1,
    rarity: 'signature',
    description: 'Draw 2. Automatically repeat the next card played this turn.',
    tags: ['draw', 'utility'],
    effect: (ctx) => {
      ctx.drawCards(2)
      ctx.setRepeatNextCard()
    },
  },
]
