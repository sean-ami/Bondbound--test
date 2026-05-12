import { useMemo } from 'react'
import type { RunState } from '@/types'
import type { CardDefinition } from '@/types'
import { Button } from '@/components/shared/Button'
import { generateDraftOptions } from '@/engine/draft/draftSystem'

const RARITY_BORDER: Record<string, string> = {
  common: '#9e9e9e',
  uncommon: '#4db6ac',
  rare: '#ffd54f',
}

interface Props {
  runState: RunState
  onPick: (cardId: string | null) => void
}

function CardPreview({ card, onClick }: { card: CardDefinition; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#161620',
        border: `2px solid ${RARITY_BORDER[card.rarity] ?? '#666'}`,
        borderRadius: 12,
        padding: 16,
        width: 160,
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center',
        textAlign: 'center',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-8px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${RARITY_BORDER[card.rarity] ?? '#666'}44`
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.transform = 'none'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      <div
        style={{
          background: '#42a5f5',
          color: '#fff',
          borderRadius: '50%',
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: 14,
        }}
      >
        {card.energyCost}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#e8e8f0' }}>{card.name}</div>
      <div
        style={{
          fontSize: 10,
          color: RARITY_BORDER[card.rarity] ?? '#aaa',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {card.rarity}
      </div>
      <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.4 }}>{card.description}</div>
    </div>
  )
}

export function DraftScreen({ runState, onPick }: Props) {
  const options = useMemo(() => generateDraftOptions(runState), [runState])
  const deckFull = runState.deck.length >= 20

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        background: '#0f0f14',
        padding: 24,
      }}
    >
      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#e8e8f0' }}>🎴 Choose a Card</h2>
      <p style={{ color: '#7a7a9a', fontSize: 12 }}>
        Deck: {runState.deck.length}/20 cards
        {deckFull && <span style={{ color: '#f44336', marginLeft: 8 }}>⚠ Deck Full</span>}
      </p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {options.map((card) => (
          <CardPreview
            key={card.id}
            card={card}
            onClick={() => !deckFull && onPick(card.id)}
          />
        ))}
        {options.length === 0 && (
          <div style={{ color: '#555', fontSize: 13 }}>No cards available in pool.</div>
        )}
      </div>

      <Button variant="ghost" onClick={() => onPick(null)} style={{ fontSize: 12 }}>
        Skip (no card)
      </Button>
    </div>
  )
}
