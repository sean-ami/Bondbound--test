import type { RunState } from '@/types'
import type { MapNode } from '@/types'
import { getCurrentActNodes } from '@/engine/map/mapGenerator'

const NODE_EMOJI: Record<string, string> = {
  battle: '⚔️',
  elite: '💀',
  shop: '🛒',
  rest: '🏕️',
  event: '❓',
  boss: '👑',
}

const NODE_COLOR: Record<string, string> = {
  battle: '#607080',
  elite: '#c0392b',
  shop: '#f39c12',
  rest: '#27ae60',
  event: '#8e44ad',
  boss: '#d4ac0d',
}

interface Props {
  runState: RunState
  onSelectNode: (nodeId: string) => void
}

const NODE_W = 48
const NODE_H = 48
const COL_SPACING = 100
const ROW_SPACING = 56
const CANVAS_PAD = 30

export function MapScreen({ runState, onSelectNode }: Props) {
  const nodes = getCurrentActNodes(runState.map)
  if (nodes.length === 0) return <div style={{ color: '#555', padding: 24 }}>No map nodes.</div>

  const rows = Math.max(...nodes.map((n) => n.row)) + 1
  const cols = Math.max(...nodes.map((n) => n.col)) + 1

  const width = cols * COL_SPACING + CANVAS_PAD * 2
  const height = rows * ROW_SPACING + CANVAS_PAD * 2 + NODE_H

  const nodePos = (node: MapNode) => ({
    x: CANVAS_PAD + node.col * COL_SPACING + COL_SPACING / 2 - NODE_W / 2,
    y: CANVAS_PAD + (rows - 1 - node.row) * ROW_SPACING,
  })

  const available = new Set(runState.map.availableNodeIds)
  const current = runState.map.currentNodeId

  const act = runState.map.currentAct + 1

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#0f0f14',
        padding: 16,
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#e8e8f0' }}>Act {act} — Map</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          {runState.creatures.map((c) => (
            <div key={c.id} style={{ fontSize: 12, color: c.color }}>
              {c.emoji} {c.currentHp}/{c.maxHp}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#ffd54f' }}>💰 {runState.gold}g</div>
      </div>

      {/* SVG map */}
      <div style={{ overflowY: 'auto', maxHeight: 'calc(100% - 80px)' }}>
        <svg width={width} height={height} style={{ display: 'block' }}>
          {/* Connection lines */}
          {nodes.map((node) => {
            const from = nodePos(node)
            return node.connections.map((toId) => {
              const toNode = nodes.find((n) => n.id === toId)
              if (!toNode) return null
              const to = nodePos(toNode)
              return (
                <line
                  key={`${node.id}-${toId}`}
                  x1={from.x + NODE_W / 2}
                  y1={from.y + NODE_H / 2}
                  x2={to.x + NODE_W / 2}
                  y2={to.y + NODE_H / 2}
                  stroke="#2a2a3a"
                  strokeWidth={2}
                />
              )
            })
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const { x, y } = nodePos(node)
            const isAvailable = available.has(node.id)
            const isCurrent = node.id === current
            const isCleared = node.cleared
            const color = NODE_COLOR[node.type]

            return (
              <g key={node.id}>
                {isAvailable && (
                  <circle
                    cx={x + NODE_W / 2}
                    cy={y + NODE_H / 2}
                    r={NODE_W / 2 + 4}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    opacity={0.6}
                    className="anim-pulse"
                  />
                )}
                <foreignObject x={x} y={y} width={NODE_W} height={NODE_H}>
                  <div
                    onClick={() => isAvailable ? onSelectNode(node.id) : undefined}
                    style={{
                      width: NODE_W,
                      height: NODE_H,
                      borderRadius: '50%',
                      background: isCleared ? '#222' : isCurrent ? color + '33' : '#161620',
                      border: `2px solid ${isCurrent ? '#fff' : isAvailable ? color : '#2a2a3a'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      cursor: isAvailable ? 'pointer' : 'default',
                      opacity: isCleared ? 0.35 : 1,
                      transition: 'transform 0.15s',
                    }}
                    onMouseEnter={(e) => { if (isAvailable) (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.12)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
                    title={node.type.charAt(0).toUpperCase() + node.type.slice(1)}
                  >
                    {NODE_EMOJI[node.type]}
                  </div>
                </foreignObject>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
        {Object.entries(NODE_EMOJI).map(([type, emoji]) => (
          <div key={type} style={{ fontSize: 10, color: NODE_COLOR[type], display: 'flex', gap: 3 }}>
            {emoji} {type}
          </div>
        ))}
      </div>
    </div>
  )
}
