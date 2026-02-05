import { useEffect, useState } from 'react'
import { Moon, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import { sleep as sleepApi } from '../lib/api'
import type { SleepEntry, WeeklySleepStats } from '../types'

export default function Sleep() {
  const [entries, setEntries] = useState<SleepEntry[]>([])
  const [stats, setStats] = useState<WeeklySleepStats | null>(null)
  const [loading, setLoading] = useState(true)

  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [bedtime, setBedtime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [quality, setQuality] = useState(3)
  const [notes, setNotes] = useState('')

  const fetchData = () => {
    Promise.allSettled([
      sleepApi.list(14).then(setEntries),
      sleepApi.weeklyStats().then(setStats),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleLog = async () => {
    const data: Record<string, unknown> = { date: formDate, quality, notes: notes || null }
    if (bedtime) data.bedtime = `${formDate}T${bedtime}:00`
    if (wakeTime) data.wake_time = `${formDate}T${wakeTime}:00`
    await sleepApi.log(data as Partial<SleepEntry>)
    setBedtime(''); setWakeTime(''); setQuality(3); setNotes('')
    fetchData()
  }

  const qualityLabels = ['Terrible', 'Poor', 'Okay', 'Good', 'Excellent']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Sleep</h1>
        <p className="text-sm mt-1 text-text-muted">Track and improve your rest</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Avg Duration" value={stats?.avg_duration ? `${stats.avg_duration}h` : '—'} icon={Moon} color="#a78bfa" subtitle="Last 7 days" />
        <StatCard label="Avg Quality" value={stats?.avg_quality ? `${stats.avg_quality}/5` : '—'} icon={TrendingUp} color="#22c55e" subtitle="Last 7 days" />
        <StatCard label="Entries" value={stats?.entries || 0} icon={Moon} color="#6366f1" subtitle="Last 7 days" />
      </div>

      <Card title="Log Sleep">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium block mb-1.5 text-text-muted">Date</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5 text-text-muted">Quality</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setQuality(n)}
                  className={`w-10 h-10 rounded-lg border text-sm font-medium transition-all ${
                    quality === n ? 'bg-accent border-accent text-white' : 'bg-bg-secondary border-border-default text-text-secondary'
                  }`}>{n}</button>
              ))}
            </div>
            <p className="text-xs mt-1 text-text-muted">{qualityLabels[quality - 1]}</p>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5 text-text-muted">Bedtime</label>
            <input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5 text-text-muted">Wake Time</label>
            <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary text-sm outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium block mb-1.5 text-text-muted">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did you sleep?" rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary text-sm outline-none resize-none" />
          </div>
          <div className="md:col-span-2">
            <button onClick={handleLog} className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors">
              Log Sleep
            </button>
          </div>
        </div>
      </Card>

      <Card title="Recent Entries">
        {loading ? (
          <p className="text-sm py-4 text-center text-text-muted">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm py-4 text-center text-text-muted">No sleep entries yet 🌙</p>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-center gap-4 px-3 py-2.5 rounded-lg bg-bg-secondary">
                <span className="text-xs w-20 font-mono text-text-muted">{format(new Date(entry.date), 'MMM d')}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden bg-border-default">
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min(((entry.duration_hours || 0) / 10) * 100, 100)}%`,
                    backgroundColor: (entry.duration_hours || 0) >= 7 ? '#22c55e' : (entry.duration_hours || 0) >= 5 ? '#f59e0b' : '#ef4444',
                  }} />
                </div>
                <span className="text-xs w-12 text-right font-mono text-text-secondary">{entry.duration_hours ? `${entry.duration_hours}h` : '—'}</span>
                <span className="text-xs w-8 text-right text-text-muted">{entry.quality ? `${entry.quality}/5` : ''}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
