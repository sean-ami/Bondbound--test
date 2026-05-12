import type { CreatureStats } from '@/types'
import { HealthBar } from '@/components/shared/HealthBar'
import { StatusPill } from '@/components/shared/StatusPill'
import { bondFillFraction, bondToNextThreshold } from '@/engine/bond/evolutionCheck'

interface Props {
  creature: CreatureStats
  isEvolutionReady?: boolean
}

export function CreaturePanel({ creature, isEvolutionReady }: Props) {
  const bondPct = bondFillFraction(creature)
  const nextThresh = bondToNextThreshold(creature)
  const isMaxed = creature.stage === 2

  return (
    <div
      style={{
        background: creature.isKnockedOut ? '#111116' : '#161620',
        border: `2px solid ${isEvolutionReady ? '#ffd54f' : creature.isKnockedOut ? '#333' : creature.color + '66'}`,
        borderRadius: 12,
        padding: 10,
        width: 130,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        position: 'relative',
        boxShadow: isEvolutionReady ? '0 0 12px #ffd54f66' : 'none',
        transition: 'border-color 0.3s',
      }}
    >
      {/* Evolution ready glow */}
      {isEvolutionReady && (
        <div
          className="anim-glow"
          style={{ position: 'absolute', top: 4, right: 6, fontSize: 14 }}
          title="Evolution ready!"
        >
          ⭐
        </div>
      )}

      {/* Emoji / avatar */}
      <div
        style={{
          fontSize: 32,
          opacity: creature.isKnockedOut ? 0.3 : 1,
          filter: creature.isKnockedOut ? 'grayscale(1)' : 'none',
        }}
      >
        {creature.emoji}
      </div>

      {/* Name + stage */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: creature.isKnockedOut ? '#555' : '#e8e8f0' }}>
          {creature.name}
        </div>
        <div style={{ fontSize: 9, color: creature.color, opacity: 0.8 }}>
          Stage {creature.stage + 1}
        </div>
      </div>

      {/* KO overlay */}
      {creature.isKnockedOut && (
        <div style={{ fontSize: 10, color: '#f44336', fontWeight: 700, letterSpacing: 1 }}>KO'd</div>
      )}

      {/* HP */}
      <div style={{ width: '100%' }}>
        <HealthBar current={creature.currentHp} max={creature.maxHp} color={creature.isKnockedOut ? '#555' : undefined} />
        <div style={{ fontSize: 9, color: '#aaa', textAlign: 'center', marginTop: 2 }}>
          {creature.currentHp}/{creature.maxHp}
        </div>
      </div>

      {/* Block */}
      {creature.block > 0 && (
        <div style={{ fontSize: 10, color: '#78909c' }}>🛡️ {creature.block}</div>
      )}

      {/* Bond meter */}
      <div style={{ width: '100%' }}>
        <div style={{ fontSize: 9, color: '#aaa', marginBottom: 2 }}>
          {isMaxed ? 'MAX BOND' : `Bond ${creature.bondAccumulated}/${nextThresh}`}
        </div>
        <div style={{ background: '#1a1a24', borderRadius: 3, height: 5, overflow: 'hidden' }}>
          <div
            style={{
              width: `${bondPct * 100}%`,
              height: '100%',
              background: isEvolutionReady ? '#ffd54f' : creature.color,
              borderRadius: 3,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Statuses */}
      {creature.statuses.length > 0 && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
          {creature.statuses.map((s) => (
            <StatusPill key={s.type} type={s.type} stacks={s.stacks} />
          ))}
        </div>
      )}
    </div>
  )
}
