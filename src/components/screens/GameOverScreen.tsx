import type { RunState } from '@/types'
import { Button } from '@/components/shared/Button'

interface Props {
  runState: RunState
  onRestart: () => void
}

export function GameOverScreen({ runState, onRestart }: Props) {
  const currentAct = runState.map.currentAct + 1

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        background: 'radial-gradient(ellipse at 50% 50%, #2a0a0a 0%, #0f0f14 70%)',
        padding: 32,
      }}
    >
      <div style={{ fontSize: 72 }}>💀</div>
      <h1 style={{ fontSize: 36, fontWeight: 900, color: '#f44336', letterSpacing: 3 }}>
        DEFEATED
      </h1>
      <p style={{ color: '#7a7a9a', fontSize: 13 }}>Your creatures fought bravely.</p>

      <div style={{ display: 'flex', gap: 16 }}>
        {runState.creatures.map((c) => (
          <div
            key={c.id}
            style={{
              background: '#161620',
              border: '1px solid #2a2a3a',
              borderRadius: 10,
              padding: '10px 14px',
              textAlign: 'center',
              minWidth: 90,
            }}
          >
            <div style={{ fontSize: 28, filter: 'grayscale(1)', opacity: 0.5 }}>{c.emoji}</div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{c.name}</div>
            <div style={{ fontSize: 10, color: '#555' }}>Stage {c.stage + 1}</div>
            <div style={{ fontSize: 10, color: '#555' }}>Bond: {c.bondAccumulated}</div>
          </div>
        ))}
      </div>

      <div style={{ color: '#555', fontSize: 12 }}>Fell in Act {currentAct}</div>

      <Button onClick={onRestart} variant="danger" style={{ fontSize: 14, padding: '10px 28px' }}>
        Try Again
      </Button>
    </div>
  )
}
