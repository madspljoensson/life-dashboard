import type { ComponentType } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon: ComponentType<{ size?: number; className?: string }>
  color?: string
  subtitle?: string
}

export default function StatCard({ label, value, icon: Icon, color, subtitle }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-card p-4 flex items-center gap-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: color ? `${color}20` : '#6366f120', color: color || '#6366f1' }}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-muted">{label}</p>
        <p className="text-lg font-bold text-text-primary">{value}</p>
        {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
      </div>
    </div>
  )
}
