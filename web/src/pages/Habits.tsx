import Card from '../components/Card'
import { Activity } from 'lucide-react'

export default function Habits() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Habits</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Build streaks, break patterns</p>
      </div>

      <Card>
        <div className="flex flex-col items-center py-12 gap-4">
          <Activity size={48} style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Habit tracking coming soon
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Daily check-offs, streaks, and completion charts
          </p>
        </div>
      </Card>
    </div>
  )
}
