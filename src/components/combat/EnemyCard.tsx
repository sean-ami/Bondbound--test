import type { EnemyState } from '@/types'
import { HealthBar } from '@/components/shared/HealthBar'
import { StatusPill } from '@/components/shared/StatusPill'

interface Props {
  enemy: EnemyState
  targeted: boolean
  onClick: () => void
}

export function EnemyCard({ enemy, targeted, onClick }: Props) {
  const isDead = enemy.currentHp <= 0

  return (
    <div
      onClick={!isDead ? onClick : undefined}
      style={{
        background: targeted ? '#2a1a1a' : '#161620',
        border: `2px solid ${targeted ? '#f44336' : '#2a2a3a'}`,
        borderRadius: 12,
        padding: 12,
        width: 130,
        cursor: isDead ? 'default' : 'pointer',
        opacity: isDead ? 0.4 : 1,
        transition: 'border-color 0.15s, transform 0.15s',
        transform: targeted ? 'scale(1.04)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <div style={{ fontSize: 36 }}>{enemy.emoji}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#e8e8f0' }}>{enemy.name}</div>

      {/* HP */}
      <div style={{ width: '100%' }}>
        <HealthBar current={enemy.currentHp} max={enemy.maxHp} />
        <div style={{ fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 2 }}>
          {enemy.currentHp}/{enemy.maxHp}
        </div>
      </div>

      {/* Block */}
      {enemy.block > 0 && (
        <div style={{ fontSize: 11, color: '#78909c' }}>🛡️ {enemy.block}</div>
      )}

      {/* Intent */}
      {!isDead && (
        <div
          style={{
            background: '#1a1a2e',
            border: '1px solid #3a3a5a',
            borderRadius: 6,
            padding: '3px 8px',
            fontSize: 12,
            color: '#e8e8f0',
            fontWeight: 700,
          }}
        >
          {enemy.intent.label}
        </div>
      )}

      {/* Statuses */}
      {enemy.statuses.length > 0 && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
          {enemy.statuses.map((s) => (
            <StatusPill key={s.type} type={s.type} stacks={s.stacks} />
          ))}
        </div>
      )}
    </div>
  )
}
