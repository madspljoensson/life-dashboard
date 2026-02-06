import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Card from '../components/Card'
import { daily as dailyApi } from '../lib/api'
import type { DailyNote, DailyTrend } from '../types'

export default function Daily() {
  const [entries, setEntries] = useState<DailyNote[]>([])
  const [trends, setTrends] = useState<DailyTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [mood, setMood] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [note, setNote] = useState('')
  const [highlights, setHighlights] = useState('')

  const fetchData = () => {
    Promise.all([
      dailyApi.list(14),
      dailyApi.trends(30).catch(() => [])
    ]).then(([entriesData, trendsData]) => {
      setEntries(entriesData)
      setTrends(trendsData)
    }).finally(() => setLoading(false))
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

  const moodLabels = ['Low', 'Below avg', 'Neutral', 'Good', 'Great']
  const energyLabels = ['Drained', 'Low', 'Normal', 'Good', 'High']

  // Get recent highlights from entries
  const recentHighlights = entries
    .filter(entry => entry.highlights)
    .slice(0, 10)
    .map(entry => ({
      date: entry.date,
      highlight: entry.highlights!
    }))

  // Format trend data for chart
  const chartData = [...trends].reverse().map(t => ({
    date: format(new Date(t.date), 'MMM d'),
    mood: t.mood,
    energy: t.energy
  }))

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
    border: '1px solid #1a1a24', backgroundColor: '#0f0f13',
    color: '#f0f0f2', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 500, color: '#5a5a66',
    letterSpacing: '0.04em', textTransform: 'uppercase' as const,
    display: 'block', marginBottom: '8px',
  }

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: '#5a5a66',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    marginBottom: '16px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#f0f0f2', letterSpacing: '-0.02em' }}>Journal</h1>
        <p style={{ fontSize: '13px', color: '#5a5a66', marginTop: '4px' }}>Daily reflection</p>
      </div>

      {/* Mood/Energy Trend Chart */}
      {chartData.length > 0 && (
        <div style={{
          backgroundColor: '#111116',
          border: '1px solid #1a1a24',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h3 style={sectionHeaderStyle}>MOOD AND ENERGY TRENDS</h3>
          <div style={{ width: '100%', height: 220, minWidth: '200px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#5a5a66', fontSize: 11 }}
                  axisLine={{ stroke: '#1a1a24' }}
                  tickLine={{ stroke: '#1a1a24' }}
                />
                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fill: '#5a5a66', fontSize: 11 }}
                  axisLine={{ stroke: '#1a1a24' }}
                  tickLine={{ stroke: '#1a1a24' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111116',
                    border: '1px solid #1a1a24',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#f0f0f2' }}
                  itemStyle={{ color: '#94949e' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: '#94949e' }}
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  name="Mood"
                  stroke="#8b7cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b7cf6', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: '#8b7cf6' }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="energy"
                  name="Energy"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  dot={{ fill: '#fbbf24', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: '#fbbf24' }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Highlights Section */}
      {recentHighlights.length > 0 && (
        <div style={{
          backgroundColor: '#111116',
          border: '1px solid #1a1a24',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h3 style={sectionHeaderStyle}>RECENT HIGHLIGHTS</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentHighlights.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px 16px',
                  backgroundColor: '#0f0f13',
                  borderRadius: '8px',
                  borderLeft: '3px solid #8b7cf6',
                }}
              >
                <p style={{
                  fontSize: '13px',
                  color: '#f0f0f2',
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                  margin: 0,
                }}>
                  "{item.highlight}"
                </p>
                <p style={{
                  fontSize: '11px',
                  color: '#5a5a66',
                  marginTop: '8px',
                  margin: '8px 0 0 0',
                }}>
                  {format(new Date(item.date), 'MMMM d, yyyy')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Card title="Check-in">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Date</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
              style={{ ...inputStyle, width: 'auto' }} />
          </div>

          {/* Mood */}
          <div>
            <label style={labelStyle}>Mood — {moodLabels[mood - 1]}</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setMood(n)} style={{
                  width: '44px', height: '38px', borderRadius: '6px', border: 'none',
                  fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  backgroundColor: mood === n ? '#8b7cf6' : '#0f0f13',
                  color: mood === n ? '#fff' : '#5a5a66',
                }}>{n}</button>
              ))}
            </div>
          </div>

          {/* Energy */}
          <div>
            <label style={labelStyle}>Energy — {energyLabels[energy - 1]}</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1,2,3,4,5].map(n => (
                <div key={n} onClick={() => setEnergy(n)} style={{
                  flex: 1, height: '6px', borderRadius: '3px', cursor: 'pointer',
                  backgroundColor: n <= energy ? '#8b7cf6' : '#1a1a24',
                  transition: 'background-color 0.15s ease',
                }} />
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="How was today?" rows={3}
              style={{ ...inputStyle, resize: 'none' as const }} />
          </div>

          <div>
            <label style={labelStyle}>Highlights</label>
            <input type="text" value={highlights} onChange={e => setHighlights(e.target.value)}
              placeholder="What stood out" style={inputStyle} />
          </div>

          <button onClick={handleSave} style={{
            width: '100%', padding: '11px', borderRadius: '8px', border: 'none',
            fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            backgroundColor: '#8b7cf6', color: '#fff',
          }}>Save Entry</button>
        </div>
      </Card>

      <Card title="Recent">
        {loading ? (
          <p style={{ fontSize: '13px', color: '#5a5a66' }}>Loading</p>
        ) : entries.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#5a5a66' }}>No entries yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {entries.map(entry => (
              <div key={entry.id} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '10px 12px', borderRadius: '8px', backgroundColor: '#0f0f13',
              }}>
                <span style={{ fontSize: '11px', width: '56px', fontFamily: 'monospace', color: '#5a5a66' }}>
                  {format(new Date(entry.date), 'MMM d')}
                </span>
                <span style={{ fontSize: '13px', color: '#94949e', width: '24px' }}>
                  {entry.mood || '--'}
                </span>
                <div style={{ display: 'flex', gap: '3px', width: '60px' }}>
                  {[1,2,3,4,5].map(n => (
                    <div key={n} style={{
                      flex: 1, height: '3px', borderRadius: '1.5px',
                      backgroundColor: n <= (entry.energy || 0) ? '#8b7cf6' : '#1a1a24',
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: '12px', flex: 1, color: '#5a5a66', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
