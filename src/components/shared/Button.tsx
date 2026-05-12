import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}

const STYLES: Record<string, string> = {
  primary: 'background:#4a90e2;color:#fff;border:2px solid #6aabff',
  secondary: 'background:#2a2a3a;color:#e8e8f0;border:2px solid #3a3a5a',
  danger: 'background:#c0392b;color:#fff;border:2px solid #e74c3c',
  ghost: 'background:transparent;color:#e8e8f0;border:2px solid #3a3a5a',
}

export function Button({ variant = 'primary', style, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      style={{
        padding: '8px 20px',
        borderRadius: '6px',
        fontWeight: 700,
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'opacity 0.15s',
        ...Object.fromEntries(
          STYLES[variant].split(';').filter(Boolean).map((s) => {
            const [k, v] = s.split(':')
            return [k.trim().replace(/-(\w)/g, (_, c) => c.toUpperCase()), v.trim()]
          }),
        ),
        ...style,
      }}
    >
      {children}
    </button>
  )
}
