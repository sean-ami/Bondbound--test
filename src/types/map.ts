export type NodeType = 'battle' | 'elite' | 'shop' | 'rest' | 'event' | 'boss'

export interface MapNode {
  id: string
  act: number
  row: number
  col: number
  type: NodeType
  connections: string[]
  cleared: boolean
}

export interface MapState {
  acts: MapNode[][]
  currentAct: number
  currentNodeId: string | null
  availableNodeIds: string[]
}
