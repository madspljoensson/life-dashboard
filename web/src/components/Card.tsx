import { ReactNode } from 'react'

interface CardProps {
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export default function Card({ title, subtitle, children, noPadding }: CardProps) {
  return (
    <div style={{
      borderRadius: '12px',
      border: '1px solid #1a1a24',
      backgroundColor: '#111116',
      padding: noPadding ? 0 : '20px',
    }}>
      {title && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 500, color: '#94949e', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{ fontSize: '11px', color: '#5a5a66', marginTop: '2px' }}>{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
