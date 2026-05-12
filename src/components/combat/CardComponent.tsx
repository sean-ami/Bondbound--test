import { useState } from 'react'
import type { CardInstance } from '@/types'
import { getCardDef } from '@/data/cards'

const RARITY_BORDER: Record<string, string> = {
  common: '#9e9e9e',
  uncommon: '#4db6ac',
  rare: '#ffd54f',
  signature: '#ce93d8',
}

const OWNER_COLOR: Record<string, string> = {
  kindlpup: '#e8622a',
  mosscub: '#4caf66',
  sparkwisp: '#7b68ee',
  generic: '#607080',
}

interface Props {
  instance: CardInstance
  selected: boolean
  playable: boolean
  onClick: () => void
}

export function CardComponent({ instance, selected, playable, onClick }: Props) {
  const [hovered, setHovered] = useState(false)
  const def = getCardDef(instance.definitionId)
  if (!def) return null

  const borderColor = RARITY_BORDER[def.rarity] ?? '#666'
  const ownerColor = OWNER_COLOR[def.owner] ?? '#607080'

  return (
    <div
      onClick={playable ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 80,
        minHeight: 110,
        background: selected ? '#252535' : hovered && playable ? '#1e1e2e' : '#161620',
        border: `2px solid ${selected ? '#fff' : borderColor}`,
        borderRadius: 10,
        padding: '6px 6px 8px',
        cursor: playable ? 'pointer' : 'not-allowed',
        transform: selected ? 'translateY(-16px) scale(1.05)' : hovered && playable ? 'translateY(-8px)' : 'none',
        transition: 'transform 0.15s, border-color 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        opacity: playable ? 1 : 0.45,
        boxShadow: selected ? `0 0 12px ${borderColor}88` : 'none',
        flexShrink: 0,
      }}
    >
      {/* Cost badge */}
      <div
        style={{
          alignSelf: 'flex-end',
          background: '#42a5f5',
          color: '#fff',
          borderRadius: '50%',
          width: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        {def.energyCost}
      </div>

      {/* Creature color bar */}
      <div style={{ height: 3, background: ownerColor, borderRadius: 2 }} />

      {/* Card name */}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#e8e8f0', textAlign: 'center', lineHeight: 1.2 }}>
        {def.name}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        {def.tags.slice(0, 2).map((t) => (
          <span
            key={t}
            style={{ fontSize: 9, background: '#2a2a3a', borderRadius: 3, padding: '1px 4px', color: '#aaa' }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Description */}
      <div style={{ fontSize: 10, color: '#b0b0c0', textAlign: 'center', lineHeight: 1.3, marginTop: 2 }}>
        {def.description}
      </div>
    </div>
  )
}
