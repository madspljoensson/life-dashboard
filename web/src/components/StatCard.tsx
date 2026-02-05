interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  accent?: string
}

export default function StatCard({ label, value, subtitle, accent = '#8b7cf6' }: StatCardProps) {
  return (
    <div style={{
      borderRadius: '12px',
      border: '1px solid #1a1a24',
      backgroundColor: '#111116',
      padding: '20px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 500, color: '#5a5a66', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 600, color: '#f0f0f2', marginTop: '8px', lineHeight: 1 }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '11px', color: '#5a5a66', marginTop: '6px' }}>
          {subtitle}
        </div>
      )}
      <div style={{
        width: '100%', height: '2px', borderRadius: '1px',
        backgroundColor: '#1a1a24', marginTop: '14px', overflow: 'hidden',
      }}>
        <div style={{ width: '60%', height: '100%', backgroundColor: accent, borderRadius: '1px', opacity: 0.6 }} />
      </div>
    </div>
  )
}
