import type { StatusType } from '@/types'
import { useState } from 'react'

const STATUS_INFO: Record<StatusType, { emoji: string; color: string; desc: string }> = {
  burn: { emoji: '🔥', color: '#ff7043', desc: 'Burn: Take N damage/turn, then decay.' },
  shock: { emoji: '⚡', color: '#ffd740', desc: 'Shock: Detonates for 3 dmg/stack.' },
  thorns: { emoji: '🌵', color: '#81c784', desc: 'Thorns: Reflect N damage when hit.' },
  regen: { emoji: '💚', color: '#4fc3f7', desc: 'Regen: Restore N HP/turn, then decay.' },
  weak: { emoji: '💧', color: '#b0bec5', desc: 'Weak: Deal 25% less damage.' },
  vulnerable: { emoji: '🎯', color: '#ef9a9a', desc: 'Vulnerable: Take 50% more damage.' },
}

interface Props {
  type: StatusType
  stacks: number
}

export function StatusPill({ type, stacks }: Props) {
  const [showTooltip, setShowTooltip] = useState(false)
  const info = STATUS_INFO[type]

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: info.color + '33',
          border: `1px solid ${info.color}88`,
          borderRadius: 12,
          padding: '2px 6px',
          fontSize: 12,
          color: info.color,
          fontWeight: 700,
          cursor: 'default',
        }}
      >
        <span>{info.emoji}</span>
        <span>{stacks}</span>
      </div>
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1a1a2e',
            border: '1px solid #3a3a5a',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 11,
            color: '#e8e8f0',
            whiteSpace: 'nowrap',
            zIndex: 100,
            marginBottom: 4,
          }}
        >
          {info.desc}
        </div>
      )}
    </div>
  )
}
