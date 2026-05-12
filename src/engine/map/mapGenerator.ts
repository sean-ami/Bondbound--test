import { v4 as uuidv4 } from 'uuid'
import type { MapNode, MapState, NodeType } from '@/types'

const ROWS = 10
const COLS = 3

const NODE_WEIGHTS: Record<NodeType, number> = {
  battle: 45,
  elite: 10,
  shop: 15,
  rest: 15,
  event: 15,
  boss: 0,
}

function weightedNodeType(): NodeType {
  const total = Object.values(NODE_WEIGHTS).reduce((s, w) => s + w, 0)
  let r = Math.random() * total
  for (const [type, weight] of Object.entries(NODE_WEIGHTS)) {
    r -= weight
    if (r <= 0) return type as NodeType
  }
  return 'battle'
}

function generateAct(actNumber: number): MapNode[] {
  const nodes: MapNode[] = []
  const idGrid: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(''))

  // Assign IDs
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      idGrid[row][col] = uuidv4()
    }
  }

  // Assign types and connections
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      let type: NodeType

      if (row === 0) {
        type = 'battle'
      } else if (row === ROWS - 1) {
        type = 'boss'
      } else {
        type = weightedNodeType()
      }

      const connections: string[] = []

      if (row < ROWS - 1) {
        // Connect to 1-2 nodes in the next row
        const possibleCols = [col - 1, col, col + 1].filter((c) => c >= 0 && c < COLS)
        // Always connect forward
        connections.push(idGrid[row + 1][col])
        // Sometimes connect diagonally
        if (Math.random() < 0.4 && possibleCols.length > 1) {
          const otherCols = possibleCols.filter((c) => c !== col)
          const extra = otherCols[Math.floor(Math.random() * otherCols.length)]
          const extraId = idGrid[row + 1][extra]
          if (!connections.includes(extraId)) connections.push(extraId)
        }
      }

      nodes.push({
        id: idGrid[row][col],
        act: actNumber,
        row,
        col,
        type,
        connections,
        cleared: false,
      })
    }
  }

  return nodes
}

export function generateFullMap(): MapState {
  const act1 = generateAct(1)
  const act2 = generateAct(2)
  const act3 = generateAct(3)

  // Entry nodes are all row-0 nodes
  const act1Entry = act1.filter((n) => n.row === 0).map((n) => n.id)

  return {
    acts: [act1, act2, act3],
    currentAct: 0,
    currentNodeId: null,
    availableNodeIds: act1Entry,
  }
}

export function getNodeById(map: MapState, nodeId: string): MapNode | undefined {
  for (const act of map.acts) {
    const node = act.find((n) => n.id === nodeId)
    if (node) return node
  }
  return undefined
}

export function markNodeCleared(map: MapState, nodeId: string): MapState {
  const node = getNodeById(map, nodeId)
  if (!node) return map

  const updatedActs = map.acts.map((act) =>
    act.map((n) => (n.id === nodeId ? { ...n, cleared: true } : n)),
  )

  // Check if this was a boss node
  const currentActNodes = updatedActs[map.currentAct]
  const isBoss = node.type === 'boss'

  let availableNodeIds: string[]
  let currentAct = map.currentAct

  if (isBoss) {
    // Move to next act if available
    const nextAct = map.currentAct + 1
    if (nextAct < map.acts.length) {
      currentAct = nextAct
      availableNodeIds = updatedActs[nextAct].filter((n) => n.row === 0).map((n) => n.id)
    } else {
      // Final boss cleared — no more nodes (victory handled upstream)
      availableNodeIds = []
    }
  } else {
    // Make this node's connections available (but only uncleared ones)
    const connections = node.connections
    availableNodeIds = connections.filter((id) => {
      const target = currentActNodes.find((n) => n.id === id)
      return target && !target.cleared
    })
  }

  return {
    ...map,
    acts: updatedActs,
    currentAct,
    currentNodeId: nodeId,
    availableNodeIds,
  }
}

export function getCurrentActNodes(map: MapState): MapNode[] {
  return map.acts[map.currentAct] ?? []
}
