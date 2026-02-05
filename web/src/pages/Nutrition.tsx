import Card from '../components/Card'
import { Utensils } from 'lucide-react'

export default function Nutrition() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Nutrition</h1>
        <p className="text-sm mt-1 text-text-muted">Track what you eat</p>
      </div>
      <Card>
        <div className="flex flex-col items-center py-12 gap-4">
          <Utensils size={48} className="text-text-muted" />
          <p className="text-sm text-text-muted">Nutrition tracking coming soon</p>
          <p className="text-xs text-text-muted">Simple meal logging first, full macro tracking later</p>
        </div>
      </Card>
    </div>
  )
}
