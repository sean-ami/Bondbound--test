interface Props {
  current: number
  max: number
  color?: string
  height?: number
}

export function HealthBar({ current, max, color, height = 10 }: Props) {
  const pct = Math.max(0, Math.min(1, current / max))
  const barColor = color ?? (pct > 0.5 ? '#4caf50' : pct > 0.25 ? '#ffc107' : '#f44336')

  return (
    <div style={{ background: '#1a1a24', borderRadius: 4, height, overflow: 'hidden', width: '100%' }}>
      <div
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          background: barColor,
          transition: 'width 0.3s ease',
          borderRadius: 4,
        }}
      />
    </div>
  )
}
