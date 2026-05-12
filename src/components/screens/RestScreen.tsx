import { useState } from 'react'
import type { RunState, CreatureId } from '@/types'
import { Button } from '@/components/shared/Button'
import { HealthBar } from '@/components/shared/HealthBar'

interface Props {
  runState: RunState
  onChoice: (choice: 'heal' | 'bond', creatureId?: CreatureId) => void
}

export function RestScreen({ runState, onChoice }: Props) {
  const [bondTarget, setBondTarget] = useState<CreatureId | null>(null)

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
      <div style={{ fontSize: 48 }}>🏕️</div>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#e8e8f0' }}>Rest Site</h2>
      <p style={{ color: '#7a7a9a', fontSize: 13 }}>Your team catches their breath. Choose one option:</p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Heal option */}
        <div
          style={{
            background: '#161620',
            border: '2px solid #27ae60',
            borderRadius: 12,
            padding: 20,
            width: 200,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>💊</div>
          <div style={{ fontWeight: 700, color: '#27ae60', marginBottom: 6 }}>Heal</div>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12 }}>
            Restore 30% HP to all creatures.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {runState.creatures.map((c) => {
              const healAmt = Math.floor(c.maxHp * 0.3)
              const newHp = Math.min(c.maxHp, c.currentHp + healAmt)
              return (
                <div key={c.id} style={{ fontSize: 10, color: '#aaa' }}>
                  {c.emoji} {c.currentHp} → <span style={{ color: '#27ae60' }}>{newHp}</span>/{c.maxHp}
                </div>
              )
            })}
          </div>
          <Button onClick={() => onChoice('heal')} style={{ width: '100%' }}>Heal All</Button>
        </div>

        {/* Bond option */}
        <div
          style={{
            background: '#161620',
            border: '2px solid #ffd54f',
            borderRadius: 12,
            padding: 20,
            width: 200,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>⭐</div>
          <div style={{ fontWeight: 700, color: '#ffd54f', marginBottom: 6 }}>Bond Boost</div>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12 }}>
            Grant +5 Bond to a chosen creature.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {runState.creatures.map((c) => (
              <div
                key={c.id}
                onClick={() => setBondTarget(c.id as CreatureId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: bondTarget === c.id ? c.color + '33' : 'transparent',
                  border: `1px solid ${bondTarget === c.id ? c.color : '#2a2a3a'}`,
                  cursor: 'pointer',
                }}
              >
                <span>{c.emoji}</span>
                <div style={{ flex: 1 }}>
                  <HealthBar current={c.bondAccumulated} max={70} color={c.color} height={4} />
                </div>
                <span style={{ fontSize: 9, color: '#aaa' }}>{c.bondAccumulated}</span>
              </div>
            ))}
          </div>
          <Button
            onClick={() => bondTarget && onChoice('bond', bondTarget)}
            disabled={!bondTarget}
            variant="secondary"
            style={{ width: '100%', borderColor: '#ffd54f', color: '#ffd54f' }}
          >
            Give Bond
          </Button>
        </div>
      </div>
    </div>
  )
}
