import { useMemo } from 'react'
import type { RunState } from '@/types'
import type { CardDefinition } from '@/types'
import { Button } from '@/components/shared/Button'
import { getDraftableCards, getCardDef } from '@/data/cards'

const RARITY_PRICE: Record<string, number> = { common: 40, uncommon: 65, rare: 100 }
const RARITY_BORDER: Record<string, string> = {
  common: '#9e9e9e', uncommon: '#4db6ac', rare: '#ffd54f',
}

interface Props {
  runState: RunState
  onBuyCard: (cardId: string) => void
  onRemoveCard: (instanceId: string) => void
  onLeave: () => void
}

export function ShopScreen({ runState, onBuyCard, onRemoveCard, onLeave }: Props) {
  const shopCards = useMemo<CardDefinition[]>(() => {
    const pool = getDraftableCards()
    const inDeck = new Set(runState.deck.map((c) => c.definitionId))
    const available = pool.filter((c) => !inDeck.has(c.id))
    // Pick 3 (weighted)
    const picks: CardDefinition[] = []
    const shuffle = [...available].sort(() => Math.random() - 0.5)
    for (const c of shuffle) {
      if (picks.length >= 3) break
      picks.push(c)
    }
    return picks
  }, [runState])

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        background: '#0f0f14',
        padding: 24,
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', maxWidth: 640 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#e8e8f0' }}>🛒 Shop</h2>
        <div style={{ marginLeft: 'auto', fontSize: 14, color: '#ffd54f', fontWeight: 700 }}>
          💰 {runState.gold}g
        </div>
      </div>

      {/* Cards for sale */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {shopCards.map((card) => {
          const price = RARITY_PRICE[card.rarity] ?? 50
          const canAfford = runState.gold >= price
          const deckFull = runState.deck.length >= 20

          return (
            <div
              key={card.id}
              style={{
                background: '#161620',
                border: `2px solid ${RARITY_BORDER[card.rarity] ?? '#666'}`,
                borderRadius: 12,
                padding: 16,
                width: 160,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e8e8f0' }}>{card.name}</div>
              <div style={{ fontSize: 10, color: RARITY_BORDER[card.rarity], fontWeight: 700 }}>
                {card.rarity.toUpperCase()}
              </div>
              <div style={{ fontSize: 11, color: '#aaa' }}>{card.description}</div>
              <Button
                onClick={() => onBuyCard(card.id)}
                disabled={!canAfford || deckFull}
                style={{ fontSize: 12 }}
              >
                Buy {price}g
              </Button>
            </div>
          )
        })}
      </div>

      {/* Remove a card */}
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ color: '#aaa', fontSize: 12, marginBottom: 8 }}>
          Remove a card from deck (50g):
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {runState.deck.map((inst) => {
            const def = getCardDef(inst.definitionId)
            return def ? (
              <button
                key={inst.instanceId}
                onClick={() => runState.gold >= 50 ? onRemoveCard(inst.instanceId) : undefined}
                disabled={runState.gold < 50}
                style={{
                  background: '#1a1a24',
                  border: '1px solid #3a3a5a',
                  borderRadius: 6,
                  padding: '3px 8px',
                  fontSize: 11,
                  color: '#aaa',
                  cursor: runState.gold >= 50 ? 'pointer' : 'not-allowed',
                  opacity: runState.gold < 50 ? 0.5 : 1,
                }}
              >
                {def.name} ✕
              </button>
            ) : null
          })}
        </div>
      </div>

      <Button variant="ghost" onClick={onLeave}>Leave Shop</Button>
    </div>
  )
}
