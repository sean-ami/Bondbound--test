import { useEffect, useState } from 'react'
import type { RunState, CreatureId } from '@/types'
import { CREATURE_NAMES } from '@/data/creatures'
import { getSignatureCards } from '@/data/cards'
import { Button } from '@/components/shared/Button'

interface Props {
  runState: RunState
  evolvingCreatureId: CreatureId
  onContinue: () => void
}

export function EvolutionScreen({ runState, evolvingCreatureId, onContinue }: Props) {
  const [phase, setPhase] = useState<'burst' | 'reveal'>('burst')

  const creature = runState.creatures.find((c) => c.id === evolvingCreatureId)
  if (!creature) return null

  // The creature has already been evolved in runState by the time we render this screen
  const newStage = creature.stage
  const names = CREATURE_NAMES[evolvingCreatureId]
  const newName = names[newStage]
  const newCards = getSignatureCards(evolvingCreatureId, newStage)

  useEffect(() => {
    const timer = setTimeout(() => setPhase('reveal'), 1200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: phase === 'burst'
          ? `radial-gradient(ellipse at 50% 50%, ${creature.color}44 0%, #0f0f14 70%)`
          : '#0f0f14',
        transition: 'background 1s',
        gap: 24,
        padding: 24,
      }}
    >
      {/* Burst phase */}
      {phase === 'burst' && (
        <div
          className="anim-fade-in"
          style={{ textAlign: 'center' }}
        >
          <div
            style={{
              fontSize: 96,
              animation: 'evolutionBurst 1.2s ease both',
              filter: `drop-shadow(0 0 32px ${creature.color})`,
            }}
          >
            {creature.emoji}
          </div>
          <div style={{ fontSize: 16, color: '#aaa', marginTop: 12 }}>Evolving…</div>
        </div>
      )}

      {/* Reveal phase */}
      {phase === 'reveal' && (
        <div className="anim-fade-in" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 72, filter: `drop-shadow(0 0 24px ${creature.color})` }}>
            {creature.emoji}
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#aaa', letterSpacing: 2, textTransform: 'uppercase' }}>
              Evolution Stage {newStage + 1}
            </div>
            <h2
              style={{
                fontSize: 36,
                fontWeight: 900,
                color: creature.color,
                letterSpacing: 3,
                filter: `drop-shadow(0 0 8px ${creature.color})`,
              }}
            >
              {newName.toUpperCase()}
            </h2>
          </div>

          {/* Upgraded cards */}
          <div>
            <div style={{ color: '#aaa', fontSize: 12, marginBottom: 8 }}>Cards Upgraded:</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {newCards.map((card) => (
                <div
                  key={card.id}
                  style={{
                    background: '#161620',
                    border: `2px solid ${creature.color}66`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 12,
                    color: creature.color,
                    fontWeight: 700,
                  }}
                >
                  {card.name}
                </div>
              ))}
            </div>
          </div>

          {/* Stat bump */}
          <div style={{ fontSize: 12, color: '#aaa' }}>
            HP: {creature.maxHp} · Stage {newStage + 1} passives active
          </div>

          <Button onClick={onContinue} style={{ fontSize: 14, padding: '10px 28px' }}>
            Continue →
          </Button>
        </div>
      )}
    </div>
  )
}
