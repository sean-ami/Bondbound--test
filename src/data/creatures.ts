import type { CreatureStats } from '@/types'

export const STARTING_CREATURES: CreatureStats[] = [
  {
    id: 'kindlpup',
    name: 'Kindlpup',
    emoji: '🔥',
    color: '#e8622a',
    stage: 0,
    maxHp: 55,
    currentHp: 55,
    block: 0,
    statuses: [],
    bondAccumulated: 0,
    isKnockedOut: false,
  },
  {
    id: 'mosscub',
    name: 'Mosscub',
    emoji: '🌿',
    color: '#4caf66',
    stage: 0,
    maxHp: 75,
    currentHp: 75,
    block: 0,
    statuses: [],
    bondAccumulated: 0,
    isKnockedOut: false,
  },
  {
    id: 'sparkwisp',
    name: 'Sparkwisp',
    emoji: '⚡',
    color: '#7b68ee',
    stage: 0,
    maxHp: 45,
    currentHp: 45,
    block: 0,
    statuses: [],
    bondAccumulated: 0,
    isKnockedOut: false,
  },
]

export const CREATURE_NAMES: Record<string, string[]> = {
  kindlpup: ['Kindlpup', 'Emberwolf', 'Direstorm'],
  mosscub: ['Mosscub', 'Bramblbear', 'Grizzquake'],
  sparkwisp: ['Sparkwisp', 'Arcgeist', 'Wraithbolt'],
}

export const CREATURE_MAX_HP: Record<string, number[]> = {
  kindlpup: [55, 70, 90],
  mosscub: [75, 100, 130],
  sparkwisp: [45, 60, 80],
}

export const BOND_THRESHOLDS = [70, 135] as const
