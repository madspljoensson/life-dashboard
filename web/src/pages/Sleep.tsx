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

  // Form state
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
    const data: Record<string, unknown> = {
      date: formDate,
      quality,
      notes: notes || null,
    }
    if (bedtime) data.bedtime = `${formDate}T${bedtime}:00`
    if (wakeTime) data.wake_time = `${formDate}T${wakeTime}:00`

    await sleepApi.log(data as Partial<SleepEntry>)
    setBedtime('')
    setWakeTime('')
    setQuality(3)
    setNotes('')
    fetchData()
  }

  const qualityLabels = ['Terrible', 'Poor', 'Okay', 'Good', 'Excellent']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sleep</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Track and improve your rest</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Avg Duration"
          value={stats?.avg_duration ? `${stats.avg_duration}h` : '—'}
          icon={Moon}
          color="#a78bfa"
          subtitle="Last 7 days"
        />
        <StatCard
          label="Avg Quality"
          value={stats?.avg_quality ? `${stats.avg_quality}/5` : '—'}
          icon={TrendingUp}
          color="var(--success)"
          subtitle="Last 7 days"
        />
        <StatCard
          label="Entries"
          value={stats?.entries || 0}
          icon={Moon}
          color="var(--accent)"
          subtitle="Last 7 days"
        />
      </div>

      {/* Log Sleep */}
      <Card title="Log Sleep">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Date</label>
            <input
              type="date"
              value={formDate}
              onChange={e => setFormDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Quality</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setQuality(n)}
                  className="w-10 h-10 rounded-lg border text-sm font-medium transition-all"
                  style={{
                    backgroundColor: quality === n ? 'var(--accent)' : 'var(--bg-secondary)',
                    borderColor: quality === n ? 'var(--accent)' : 'var(--border)',
                    color: quality === n ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{qualityLabels[quality - 1]}</p>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Bedtime</label>
            <input
              type="time"
              value={bedtime}
              onChange={e => setBedtime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Wake Time</label>
            <input
              type="time"
              value={wakeTime}
              onChange={e => setWakeTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How did you sleep?"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="md:col-span-2">
            <button
              onClick={handleLog}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Log Sleep
            </button>
          </div>
        </div>
      </Card>

      {/* History */}
      <Card title="Recent Entries">
        {loading ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>No sleep entries yet 🌙</p>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => (
              <div
                key={entry.id}
                className="flex items-center gap-4 px-3 py-2.5 rounded-lg"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <span className="text-xs w-20 font-mono" style={{ color: 'var(--text-muted)' }}>
                  {format(new Date(entry.date), 'MMM d')}
                </span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(((entry.duration_hours || 0) / 10) * 100, 100)}%`,
                      backgroundColor: (entry.duration_hours || 0) >= 7 ? 'var(--success)' :
                                        (entry.duration_hours || 0) >= 5 ? 'var(--warning)' : 'var(--danger)',
                    }}
                  />
                </div>
                <span className="text-xs w-12 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {entry.duration_hours ? `${entry.duration_hours}h` : '—'}
                </span>
                <span className="text-xs w-8 text-right" style={{ color: 'var(--text-muted)' }}>
                  {entry.quality ? `${entry.quality}/5` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
