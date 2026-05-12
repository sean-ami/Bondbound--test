import type { CardDefinition } from '@/types'

export const MOSSCUB_CARDS: CardDefinition[] = [
  // ── Stage 0 ──────────────────────────────────────────────
  {
    id: 'bramble_bash_0',
    name: 'Bramble Bash',
    owner: 'mosscub',
    stage: 0,
    energyCost: 1,
    rarity: 'signature',
    description: 'Deal 7 damage. Gain 2 Thorns.',
    tags: ['attack'],
    effect: (ctx) => {
      ctx.dealDamage(ctx.targetEnemyId!, 7)
      ctx.applyStatusToCreature('mosscub', 'thorns', 2)
    },
  },
  {
    id: 'moss_hide_0',
    name: 'Moss Hide',
    owner: 'mosscub',
    stage: 0,
    energyCost: 1,
    rarity: 'signature',
    description: 'Gain 10 Block and 2 Regen.',
    tags: ['block'],
    effect: (ctx) => {
      ctx.gainBlock('mosscub', 10)
      ctx.applyStatusToCreature('mosscub', 'regen', 2)
    },
  },
  {
    id: 'guardians_call_0',
    name: "Guardian's Call",
    owner: 'mosscub',
    stage: 0,
    energyCost: 1,
    rarity: 'signature',
    description: 'All creatures gain 5 Block.',
    tags: ['block', 'utility'],
    effect: (ctx) => {
      ctx.gainBlock('all', 5)
    },
  },

  // ── Stage 1 ──────────────────────────────────────────────
  {
    id: 'bramble_bash_1',
    name: 'Thorn Bash',
    owner: 'mosscub',
    stage: 1,
    energyCost: 1,
    rarity: 'signature',
    description: 'Deal 7 damage. Deal 3 more if you have Block.',
    tags: ['attack'],
    effect: (ctx) => {
      const mosscub = ctx.state.creatures.find(c => c.id === 'mosscub')
      const bonus = (mosscub && mosscub.block > 0) ? 3 : 0
      ctx.dealDamage(ctx.targetEnemyId!, 7 + bonus)
    },
  },
  {
    id: 'moss_hide_1',
    name: 'Bramblehide',
    owner: 'mosscub',
    stage: 1,
    energyCost: 1,
    rarity: 'signature',
    description: 'Gain 10 Block. Double current Regen stacks.',
    tags: ['block'],
    effect: (ctx) => {
      ctx.gainBlock('mosscub', 10)
      const mosscub = ctx.state.creatures.find(c => c.id === 'mosscub')
      if (mosscub) {
        const regen = mosscub.statuses.find(s => s.type === 'regen')
        if (regen && regen.stacks > 0) {
          ctx.applyStatusToCreature('mosscub', 'regen', regen.stacks)
        }
      }
    },
  },
  {
    id: 'guardians_call_1',
    name: "Guardian's Roar",
    owner: 'mosscub',
    stage: 1,
    energyCost: 1,
    rarity: 'signature',
    description: 'All creatures gain 5 Block. Apply 2 Weak to all enemies.',
    tags: ['block', 'utility'],
    effect: (ctx) => {
      ctx.gainBlock('all', 5)
      ctx.applyStatusToAllEnemies('weak', 2)
    },
  },

  // ── Stage 2 ──────────────────────────────────────────────
  {
    id: 'bramble_bash_2',
    name: 'Quake Bash',
    owner: 'mosscub',
    stage: 2,
    energyCost: 2,
    rarity: 'signature',
    description: 'Deal damage to ALL enemies equal to your Thorns count.',
    tags: ['attack', 'aoe'],
    effect: (ctx) => {
      const mosscub = ctx.state.creatures.find(c => c.id === 'mosscub')
      const thorns = mosscub?.statuses.find(s => s.type === 'thorns')?.stacks ?? 0
      ctx.dealDamageAllEnemies(thorns)
    },
  },
  {
    id: 'moss_hide_2',
    name: 'Earthheart Hide',
    owner: 'mosscub',
    stage: 2,
    energyCost: 2,
    rarity: 'signature',
    description: 'Gain 10 Block. Convert 50% of Block to max HP (max +20).',
    tags: ['block'],
    effect: (ctx) => {
      ctx.gainBlock('mosscub', 10)
      const mosscub = ctx.state.creatures.find(c => c.id === 'mosscub')
      if (mosscub) {
        const gain = Math.min(Math.floor(mosscub.block * 0.5), 20)
        mosscub.maxHp = mosscub.maxHp + gain
        mosscub.currentHp = Math.min(mosscub.currentHp + gain, mosscub.maxHp)
      }
    },
  },
  {
    id: 'guardians_call_2',
    name: 'Earthshatter Call',
    owner: 'mosscub',
    stage: 2,
    energyCost: 2,
    rarity: 'signature',
    description: 'All creatures gain 5 Block. Apply 2 Weak + 2 Vulnerable to all enemies.',
    tags: ['block', 'utility', 'aoe'],
    effect: (ctx) => {
      ctx.gainBlock('all', 5)
      ctx.applyStatusToAllEnemies('weak', 2)
      ctx.applyStatusToAllEnemies('vulnerable', 2)
    },
  },
]
