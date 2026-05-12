import type { StatusType } from './effect'

export type EnemyId = string
export type EnemyIntentType = 'attack' | 'block' | 'buff' | 'multi-attack' | 'burn' | 'shock' | 'big-attack'

export interface EnemyAction {
  type: EnemyIntentType
  value?: number
  hits?: number
  statusToApply?: { type: StatusType; stacks: number }
}

export type EnemyAIPattern =
  | { kind: 'fixed'; actions: EnemyAction[] }
  | { kind: 'weighted'; actions: Array<EnemyAction & { weight: number }> }

export interface EnemyDefinition {
  id: EnemyId
  name: string
  emoji: string
  baseHp: number
  acts: (1 | 2 | 3)[]
  isElite: boolean
  isBoss: boolean
  aiPattern: EnemyAIPattern
}

export interface EnemyIntent {
  type: EnemyIntentType
  value?: number
  hits?: number
  label: string
}

export interface EnemyState {
  definitionId: EnemyId
  instanceId: string
  name: string
  emoji: string
  maxHp: number
  currentHp: number
  block: number
  statuses: import('./effect').StatusStack[]
  intent: EnemyIntent
  patternIndex: number
}
