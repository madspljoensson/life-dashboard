import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import Card from '../components/Card'
import { daily as dailyApi } from '../lib/api'
import type { DailyNote } from '../types'

export default function Daily() {
  const [entries, setEntries] = useState<DailyNote[]>([])
  const [loading, setLoading] = useState(true)

  // Form
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
      mood,
      energy,
      note: note || null,
      highlights: highlights || null,
    })
    setNote('')
    setHighlights('')
    fetchData()
  }

  const moodEmojis = ['😫', '😕', '😐', '🙂', '😊']
  const energyLabels = ['Drained', 'Low', 'Normal', 'Good', 'Energized']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Daily Check-in</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>How's your day going?</p>
      </div>

      {/* Check-in Form */}
      <Card title="Today's Check-in">
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Date</label>
            <input
              type="date"
              value={formDate}
              onChange={e => setFormDate(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Mood */}
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-muted)' }}>Mood</label>
            <div className="flex gap-3">
              {moodEmojis.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => setMood(i + 1)}
                  className={`w-12 h-12 rounded-xl text-xl transition-all ${
                    mood === i + 1 ? 'scale-110 ring-2' : 'opacity-50 hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: mood === i + 1 ? 'var(--bg-card-hover)' : 'var(--bg-secondary)',
                    ringColor: 'var(--accent)',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Energy */}
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-muted)' }}>
              Energy — {energyLabels[energy - 1]}
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setEnergy(n)}
                  className="flex-1 h-3 rounded-full transition-all"
                  style={{
                    backgroundColor: n <= energy ? 'var(--accent)' : 'var(--border)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Note</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What's on your mind today?"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Highlights */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Highlights</label>
            <input
              type="text"
              value={highlights}
              onChange={e => setHighlights(e.target.value)}
              placeholder="Best moments of the day"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Save Check-in
          </button>
        </div>
      </Card>

      {/* History */}
      <Card title="Recent Days">
        {loading ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>No entries yet. Start checking in! 📝</p>
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
                <span className="text-lg">{entry.mood ? moodEmojis[entry.mood - 1] : '—'}</span>
                <div className="flex gap-1 w-20">
                  {[1, 2, 3, 4, 5].map(n => (
                    <div
                      key={n}
                      className="flex-1 h-1.5 rounded-full"
                      style={{
                        backgroundColor: n <= (entry.energy || 0) ? 'var(--accent)' : 'var(--border)',
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {entry.note || ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
