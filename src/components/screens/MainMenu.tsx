import { Button } from '@/components/shared/Button'

interface Props {
  onStart: () => void
}

export function MainMenu({ onStart }: Props) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        background: 'radial-gradient(ellipse at 50% 40%, #1a0f2e 0%, #0f0f14 70%)',
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>🔥🌿⚡</div>
        <h1
          style={{
            fontSize: 52,
            fontWeight: 900,
            letterSpacing: 4,
            background: 'linear-gradient(135deg, #e8622a, #4caf66, #7b68ee)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          BONDBOUND
        </h1>
        <p style={{ color: '#7a7a9a', fontSize: 14, letterSpacing: 2, marginTop: 4 }}>
          Roguelike Creature Deckbuilder
        </p>
      </div>

      {/* Creature previews */}
      <div style={{ display: 'flex', gap: 24 }}>
        {[
          { emoji: '🔥', name: 'Kindlpup', sub: 'Primal · Aggression', color: '#e8622a' },
          { emoji: '🌿', name: 'Mosscub', sub: 'Guardian · Sustain', color: '#4caf66' },
          { emoji: '⚡', name: 'Sparkwisp', sub: 'Spirit · Combo', color: '#7b68ee' },
        ].map((c) => (
          <div
            key={c.name}
            style={{
              background: '#161620',
              border: `2px solid ${c.color}44`,
              borderRadius: 12,
              padding: '16px 20px',
              textAlign: 'center',
              minWidth: 110,
            }}
          >
            <div style={{ fontSize: 36 }}>{c.emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.color, marginTop: 6 }}>{c.name}</div>
            <div style={{ fontSize: 10, color: '#7a7a9a', marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <Button onClick={onStart} style={{ fontSize: 18, padding: '12px 40px', letterSpacing: 2 }}>
        ▶ Start Run
      </Button>

      <div style={{ color: '#444', fontSize: 10, textAlign: 'center', maxWidth: 320 }}>
        v0.1 Pre-production prototype · All visuals placeholder
      </div>
    </div>
  )
}
