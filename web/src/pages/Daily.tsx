import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import Card from '../components/Card'
import { daily as dailyApi } from '../lib/api'
import type { DailyNote } from '../types'

export default function Daily() {
  const [entries, setEntries] = useState<DailyNote[]>([])
  const [loading, setLoading] = useState(true)

  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [mood, setMood] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [note, setNote] = useState('')
  const [highlights, setHighlights] = useState('')

  const fetchData = () => {
    dailyApi.list(14).then(setEntries).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async () => {
    await dailyApi.create({
      date: formDate as unknown as DailyNote['date'],
      mood, energy,
      note: note || null,
      highlights: highlights || null,
    })
    setNote(''); setHighlights('')
    fetchData()
  }

  const moodEmojis = ['😫', '😕', '😐', '🙂', '😊']
  const energyLabels = ['Drained', 'Low', 'Normal', 'Good', 'Energized']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Daily Check-in</h1>
        <p className="text-sm mt-1 text-text-muted">How's your day going?</p>
      </div>

      <Card title="Today's Check-in">
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium block mb-1.5 text-text-muted">Date</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary text-sm outline-none" />
          </div>

          <div>
            <label className="text-xs font-medium block mb-2 text-text-muted">Mood</label>
            <div className="flex gap-3">
              {moodEmojis.map((emoji, i) => (
                <button key={i} onClick={() => setMood(i + 1)}
                  className={`w-12 h-12 rounded-xl text-xl transition-all ${
                    mood === i + 1 ? 'scale-110 ring-2 ring-accent bg-bg-card-hover' : 'opacity-50 hover:opacity-80 bg-bg-secondary'
                  }`}>{emoji}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-2 text-text-muted">Energy — {energyLabels[energy - 1]}</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setEnergy(n)}
                  className={`flex-1 h-3 rounded-full transition-all ${n <= energy ? 'bg-accent' : 'bg-border-default'}`} />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5 text-text-muted">Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="What's on your mind today?" rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary text-sm outline-none resize-none" />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5 text-text-muted">Highlights</label>
            <input type="text" value={highlights} onChange={e => setHighlights(e.target.value)} placeholder="Best moments of the day"
              className="w-full px-3 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary text-sm outline-none" />
          </div>

          <button onClick={handleSave}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors">
            Save Check-in
          </button>
        </div>
      </Card>

      <Card title="Recent Days">
        {loading ? (
          <p className="text-sm py-4 text-center text-text-muted">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm py-4 text-center text-text-muted">No entries yet. Start checking in! 📝</p>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-center gap-4 px-3 py-2.5 rounded-lg bg-bg-secondary">
                <span className="text-xs w-20 font-mono text-text-muted">{format(new Date(entry.date), 'MMM d')}</span>
                <span className="text-lg">{entry.mood ? moodEmojis[entry.mood - 1] : '—'}</span>
                <div className="flex gap-1 w-20">
                  {[1,2,3,4,5].map(n => (
                    <div key={n} className={`flex-1 h-1.5 rounded-full ${n <= (entry.energy || 0) ? 'bg-accent' : 'bg-border-default'}`} />
                  ))}
                </div>
                <span className="text-xs flex-1 truncate text-text-secondary">{entry.note || ''}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
