interface Props {
  current: number
  max: number
}

export function EnergyDisplay({ current, max }: Props) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: '#aaa', marginRight: 2 }}>⚡</span>
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: '2px solid #42a5f5',
            background: i < current ? '#42a5f5' : 'transparent',
            transition: 'background 0.15s',
          }}
        />
      ))}
      <span style={{ fontSize: 11, color: '#42a5f5', fontWeight: 700, marginLeft: 2 }}>
        {current}/{max}
      </span>
    </div>
  )
}
