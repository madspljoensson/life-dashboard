import { useEffect, useState } from 'react'
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

  const qualityLabels = ['Terrible', 'Poor', 'Average', 'Good', 'Excellent']

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
    border: '1px solid #1a1a24', backgroundColor: '#0f0f13',
    color: '#f0f0f2', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 500, color: '#5a5a66',
    letterSpacing: '0.04em', textTransform: 'uppercase' as const,
    display: 'block', marginBottom: '6px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#f0f0f2', letterSpacing: '-0.02em' }}>Sleep</h1>
        <p style={{ fontSize: '13px', color: '#5a5a66', marginTop: '4px' }}>Track and improve rest quality</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <StatCard label="Duration" value={stats?.avg_duration ? `${stats.avg_duration}h` : '--'} subtitle="7-day avg" accent="#6d5ed6" />
        <StatCard label="Quality" value={stats?.avg_quality ? `${stats.avg_quality}/5` : '--'} subtitle="7-day avg" accent="#4ade80" />
        <StatCard label="Entries" value={stats?.entries || 0} subtitle="Last week" accent="#8b7cf6" />
      </div>

      <Card title="Log Entry">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Date</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Quality</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setQuality(n)} style={{
                  width: '38px', height: '38px', borderRadius: '6px', border: 'none',
                  fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  backgroundColor: quality === n ? '#8b7cf6' : '#0f0f13',
                  color: quality === n ? '#fff' : '#5a5a66',
                }}>{n}</button>
              ))}
            </div>
            <span style={{ fontSize: '11px', color: '#5a5a66', marginTop: '4px', display: 'block' }}>
              {qualityLabels[quality - 1]}
            </span>
          </div>
          <div>
            <label style={labelStyle}>Bedtime</label>
            <input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Wake</label>
            <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes"
              rows={2} style={{ ...inputStyle, resize: 'none' as const }} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <button onClick={handleLog} style={{
              width: '100%', padding: '11px', borderRadius: '8px', border: 'none',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              backgroundColor: '#8b7cf6', color: '#fff',
            }}>Log Sleep</button>
          </div>
        </div>
      </Card>

      <Card title="History">
        {loading ? (
          <p style={{ fontSize: '13px', color: '#5a5a66' }}>Loading</p>
        ) : entries.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#5a5a66' }}>No entries recorded</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {entries.map(entry => (
              <div key={entry.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0f0f13',
              }}>
                <span style={{ fontSize: '11px', width: '56px', color: '#5a5a66', fontFamily: 'monospace' }}>
                  {format(new Date(entry.date), 'MMM d')}
                </span>
                <div style={{ flex: 1, height: '4px', borderRadius: '2px', overflow: 'hidden', backgroundColor: '#1a1a24' }}>
                  <div style={{
                    height: '100%', borderRadius: '2px',
                    width: `${Math.min(((entry.duration_hours || 0) / 10) * 100, 100)}%`,
                    backgroundColor: (entry.duration_hours || 0) >= 7 ? '#4ade80' :
                                      (entry.duration_hours || 0) >= 5 ? '#fbbf24' : '#f87171',
                    opacity: 0.7,
                  }} />
                </div>
                <span style={{ fontSize: '12px', width: '36px', textAlign: 'right', fontFamily: 'monospace', color: '#94949e' }}>
                  {entry.duration_hours ? `${entry.duration_hours}h` : '--'}
                </span>
                <span style={{ fontSize: '11px', width: '24px', textAlign: 'right', color: '#5a5a66' }}>
                  {entry.quality ? `${entry.quality}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
