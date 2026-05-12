import { useState } from 'react'
import type { RunState, CreatureId } from '@/types'
import { HealthBar } from '@/components/shared/HealthBar'
import { Button } from '@/components/shared/Button'
import { bondFillFraction, bondToNextThreshold } from '@/engine/bond/evolutionCheck'

interface Props {
  runState: RunState
  onAllocate: (creatureId: CreatureId) => void
}

export function BondScreen({ runState, onAllocate }: Props) {
  const [selected, setSelected] = useState<CreatureId | null>(null)
  const result = runState.lastBattleResult

  if (!result) return null

  const { bondEarned } = result

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
      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#ffd54f' }}>⭐ Bond Earned!</h2>

      {/* Bond breakdown */}
      <div
        style={{
          background: '#161620',
          border: '1px solid #2a2a3a',
          borderRadius: 12,
          padding: '16px 24px',
          minWidth: 280,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#aaa' }}>Base Victory</span>
          <span style={{ color: '#e8e8f0', fontWeight: 700 }}>+{bondEarned.base}</span>
        </div>
        {bondEarned.bonuses.map((b, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#aaa', fontSize: 12 }}>{b.label}</span>
            <span style={{ color: '#ffd54f', fontSize: 12, fontWeight: 700 }}>+{b.amount}</span>
          </div>
        ))}
        <div
          style={{
            borderTop: '1px solid #2a2a3a',
            marginTop: 8,
            paddingTop: 8,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: '#e8e8f0', fontWeight: 700 }}>Total</span>
          <span style={{ color: '#ffd54f', fontWeight: 900, fontSize: 18 }}>+{bondEarned.total}</span>
        </div>
      </div>

      {/* Creature selector */}
      <div>
        <p style={{ color: '#aaa', textAlign: 'center', marginBottom: 12, fontSize: 13 }}>
          Choose a creature to invest Bond in:
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {runState.creatures.map((creature) => {
            const isSelected = selected === creature.id
            const previewBond = isSelected ? creature.bondAccumulated + bondEarned.total : creature.bondAccumulated
            const previewFill = bondFillFraction({ ...creature, bondAccumulated: previewBond })
            const threshold = bondToNextThreshold(creature)
            const willEvolve = creature.stage < 2 && previewBond >= threshold

            return (
              <div
                key={creature.id}
                onClick={() => setSelected(creature.id as CreatureId)}
                style={{
                  background: isSelected ? '#1e1e2e' : '#161620',
                  border: `2px solid ${isSelected ? creature.color : '#2a2a3a'}`,
                  borderRadius: 12,
                  padding: 14,
                  width: 130,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, transform 0.15s',
                  transform: isSelected ? 'scale(1.04)' : 'none',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 28 }}>{creature.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: creature.color, marginTop: 4 }}>
                  {creature.name}
                </div>

                <div style={{ marginTop: 6 }}>
                  <HealthBar current={creature.currentHp} max={creature.maxHp} height={6} />
                  <div style={{ fontSize: 9, color: '#aaa', marginTop: 1 }}>
                    HP {creature.currentHp}/{creature.maxHp}
                  </div>
                </div>

                {/* Bond meter */}
                <div style={{ marginTop: 6 }}>
                  <div style={{ background: '#1a1a24', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${previewFill * 100}%`,
                        height: '100%',
                        background: willEvolve ? '#ffd54f' : creature.color,
                        borderRadius: 3,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 9, color: willEvolve ? '#ffd54f' : '#aaa', marginTop: 2 }}>
                    {willEvolve ? '⭐ Will evolve!' : `${previewBond}/${threshold}`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Button
        onClick={() => selected && onAllocate(selected)}
        disabled={!selected}
        style={{ fontSize: 14, padding: '10px 28px' }}
      >
        Invest Bond →
      </Button>
    </div>
  )
}
