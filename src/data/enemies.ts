import type { EnemyDefinition } from '@/types'

export const ENEMIES: EnemyDefinition[] = [
  {
    id: 'slimeling',
    name: 'Slimeling',
    emoji: '🟢',
    baseHp: 28,
    acts: [1],
    isElite: false,
    isBoss: false,
    aiPattern: {
      kind: 'fixed',
      actions: [
        { type: 'attack', value: 5 },
        { type: 'attack', value: 5 },
        { type: 'attack', value: 8 },
      ],
    },
  },
  {
    id: 'stone_brute',
    name: 'Stone Brute',
    emoji: '🪨',
    baseHp: 42,
    acts: [1],
    isElite: false,
    isBoss: false,
    aiPattern: {
      kind: 'fixed',
      actions: [
        { type: 'attack', value: 8 },
        { type: 'block', value: 7 },
        { type: 'attack', value: 11 },
        { type: 'block', value: 7 },
      ],
    },
  },
  {
    id: 'flame_sprite',
    name: 'Flame Sprite',
    emoji: '🔥',
    baseHp: 38,
    acts: [1],
    isElite: true,
    isBoss: false,
    aiPattern: {
      kind: 'fixed',
      actions: [
        { type: 'burn', value: 10, statusToApply: { type: 'burn', stacks: 3 } },
        { type: 'attack', value: 10 },
        { type: 'burn', value: 8, statusToApply: { type: 'burn', stacks: 2 } },
        { type: 'attack', value: 14 },
      ],
    },
  },
  {
    id: 'storm_crow',
    name: 'Storm Crow',
    emoji: '🐦',
    baseHp: 48,
    acts: [2],
    isElite: false,
    isBoss: false,
    aiPattern: {
      kind: 'fixed',
      actions: [
        { type: 'multi-attack', value: 5, hits: 2, statusToApply: { type: 'shock', stacks: 1 } },
        { type: 'attack', value: 9 },
        { type: 'multi-attack', value: 5, hits: 2 },
        { type: 'shock', value: 0, statusToApply: { type: 'shock', stacks: 3 } },
      ],
    },
  },
  {
    id: 'earth_golem',
    name: 'Earth Golem',
    emoji: '🗿',
    baseHp: 85,
    acts: [2],
    isElite: true,
    isBoss: false,
    aiPattern: {
      kind: 'fixed',
      actions: [
        { type: 'buff', value: 10 },
        { type: 'attack', value: 14 },
        { type: 'attack', value: 14 },
        { type: 'buff', value: 8 },
        { type: 'big-attack', value: 20 },
      ],
    },
  },
  {
    id: 'shadow_wraith',
    name: 'Shadow Wraith',
    emoji: '👻',
    baseHp: 52,
    acts: [2, 3],
    isElite: false,
    isBoss: false,
    aiPattern: {
      kind: 'fixed',
      actions: [
        { type: 'multi-attack', value: 6, hits: 2 },
        { type: 'multi-attack', value: 6, hits: 2 },
        { type: 'big-attack', value: 16 },
      ],
    },
  },
  {
    id: 'inferno_drake',
    name: 'Inferno Drake',
    emoji: '🐉',
    baseHp: 110,
    acts: [1, 2],
    isElite: false,
    isBoss: true,
    aiPattern: {
      kind: 'fixed',
      actions: [
        { type: 'burn', value: 12, statusToApply: { type: 'burn', stacks: 4 } },
        { type: 'attack', value: 15 },
        { type: 'attack', value: 15 },
        { type: 'big-attack', value: 22, statusToApply: { type: 'burn', stacks: 3 } },
        { type: 'buff', value: 12 },
      ],
    },
  },
  {
    id: 'void_architect',
    name: 'Void Architect',
    emoji: '🌀',
    baseHp: 185,
    acts: [3],
    isElite: false,
    isBoss: true,
    aiPattern: {
      kind: 'fixed',
      actions: [
        { type: 'attack', value: 14 },
        { type: 'buff', value: 15 },
        { type: 'big-attack', value: 28 },
        { type: 'shock', value: 0, statusToApply: { type: 'shock', stacks: 4 } },
        { type: 'attack', value: 18 },
        { type: 'big-attack', value: 32 },
      ],
    },
  },
]

export function getEnemyById(id: string): EnemyDefinition | undefined {
  return ENEMIES.find(e => e.id === id)
}

export function getEnemiesForAct(act: 1 | 2 | 3, eliteOnly = false, bossOnly = false): EnemyDefinition[] {
  return ENEMIES.filter(e => {
    if (!e.acts.includes(act)) return false
    if (bossOnly) return e.isBoss
    if (eliteOnly) return e.isElite && !e.isBoss
    return !e.isElite && !e.isBoss
  })
}

export function getBossForAct(act: 1 | 2 | 3): EnemyDefinition {
  const boss = ENEMIES.find(e => e.isBoss && e.acts.includes(act))
  if (!boss) throw new Error(`No boss for act ${act}`)
  return boss
}
