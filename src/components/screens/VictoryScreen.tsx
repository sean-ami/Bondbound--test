import type { RunState } from '@/types'
import { Button } from '@/components/shared/Button'

interface Props {
  runState: RunState
  onRestart: () => void
}

export function VictoryScreen({ runState, onRestart }: Props) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        background: 'radial-gradient(ellipse at 50% 50%, #1a2a0a 0%, #0f0f14 70%)',
        padding: 32,
      }}
    >
      <div style={{ fontSize: 72 }}>🏆</div>
      <h1
        style={{
          fontSize: 40,
          fontWeight: 900,
          letterSpacing: 4,
          background: 'linear-gradient(135deg, #ffd54f, #fff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        VICTORY!
      </h1>
      <p style={{ color: '#aaa', fontSize: 14 }}>You and your creatures have overcome all three acts!</p>

      <div style={{ display: 'flex', gap: 16 }}>
        {runState.creatures.map((c) => (
          <div
            key={c.id}
            style={{
              background: '#161620',
              border: `2px solid ${c.color}66`,
              borderRadius: 12,
              padding: '12px 16px',
              textAlign: 'center',
              minWidth: 100,
            }}
          >
            <div style={{ fontSize: 36 }}>{c.emoji}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: c.color, marginTop: 6 }}>{c.name}</div>
            <div style={{ fontSize: 10, color: '#aaa' }}>Stage {c.stage + 1}</div>
            <div style={{ fontSize: 10, color: '#ffd54f' }}>Bond: {c.bondAccumulated}</div>
          </div>
        ))}
      </div>

      <Button onClick={onRestart} style={{ fontSize: 14, padding: '10px 28px' }}>
        Play Again
      </Button>
    </div>
  )
}
