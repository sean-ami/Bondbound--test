import { useMemo } from 'react'
import type { RunState } from '@/types'
import { EVENTS } from '@/data/events'
import { Button } from '@/components/shared/Button'

interface Props {
  runState: RunState
  onChoice: (outcome: 'a' | 'b') => void
}

export function EventScreen({ runState: _runState, onChoice }: Props) {
  const event = useMemo(() => EVENTS[Math.floor(Math.random() * EVENTS.length)], [])

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
        padding: 32,
      }}
    >
      <div style={{ fontSize: 48 }}>❓</div>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#e8e8f0' }}>{event.title}</h2>
      <p style={{ color: '#7a7a9a', fontSize: 13, maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
        {event.flavor}
      </p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {event.options.map((opt, i) => (
          <div
            key={i}
            style={{
              background: '#161620',
              border: '2px solid #2a2a3a',
              borderRadius: 12,
              padding: 20,
              width: 200,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 700, color: '#e8e8f0', fontSize: 13 }}>{opt.label}</div>
            <div style={{ fontSize: 11, color: '#aaa' }}>{opt.description}</div>
            <Button onClick={() => onChoice(i === 0 ? 'a' : 'b')} variant="secondary" style={{ fontSize: 12 }}>
              Choose
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
