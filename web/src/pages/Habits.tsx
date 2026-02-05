import Card from '../components/Card'
import { Activity } from 'lucide-react'

export default function Habits() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Habits</h1>
        <p className="text-sm mt-1 text-text-muted">Build streaks, break patterns</p>
      </div>
      <Card>
        <div className="flex flex-col items-center py-12 gap-4">
          <Activity size={48} className="text-text-muted" />
          <p className="text-sm text-text-muted">Habit tracking coming soon</p>
          <p className="text-xs text-text-muted">Daily check-offs, streaks, and completion charts</p>
        </div>
      </Card>
    </div>
  )
}
