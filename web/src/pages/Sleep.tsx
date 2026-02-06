import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import { sleep as sleepApi } from '../lib/api'
import type { SleepEntry, WeeklySleepStats, SleepChartData, SleepScore, SleepTarget } from '../types'

export default function Sleep() {
  const [entries, setEntries] = useState<SleepEntry[]>([])
  const [stats, setStats] = useState<WeeklySleepStats | null>(null)
  const [chartData, setChartData] = useState<SleepChartData[]>([])
  const [sleepScore, setSleepScore] = useState<SleepScore | null>(null)
  const [sleepTarget, setSleepTarget] = useState<SleepTarget | null>(null)
  const [targetInput, setTargetInput] = useState('')
  const [chartDays, setChartDays] = useState<7 | 30>(30)
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
      sleepApi.chartData(chartDays).then(setChartData),
      sleepApi.score().then(setSleepScore),
      sleepApi.getTarget().then((t) => {
        setSleepTarget(t)
        setTargetInput(t.target_hours.toString())
      }),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    sleepApi.chartData(chartDays).then(setChartData).catch(() => {})
  }, [chartDays])

  const handleLog = async () => {
    const data: Record<string, unknown> = { date: formDate, quality, notes: notes || null }
    if (bedtime) data.bedtime = `${formDate}T${bedtime}:00`
    if (wakeTime) data.wake_time = `${formDate}T${wakeTime}:00`
    await sleepApi.log(data as Partial<SleepEntry>)
    setBedtime(''); setWakeTime(''); setQuality(3); setNotes('')
    fetchData()
  }

  const handleSaveTarget = async () => {
    const hours = parseFloat(targetInput)
    if (!isNaN(hours) && hours > 0 && hours <= 24) {
      const result = await sleepApi.setTarget(hours)
      setSleepTarget(result)
    }
  }

  const qualityLabels = ['Terrible', 'Poor', 'Average', 'Good', 'Excellent']

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4ade80'
    if (score >= 60) return '#fbbf24'
    return '#f87171'
  }

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

  const toggleButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    backgroundColor: active ? '#8b7cf6' : '#0f0f13',
    color: active ? '#fff' : '#5a5a66',
  })

  // Format chart data for display
  const formattedChartData = chartData.map(d => ({
    ...d,
    dateLabel: format(new Date(d.date), 'MMM d'),
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#f0f0f2', letterSpacing: '-0.02em' }}>Sleep</h1>
        <p style={{ fontSize: '13px', color: '#5a5a66', marginTop: '4px' }}>Track and improve rest quality</p>
      </div>

      {/* Sleep Score Card */}
      <div style={{
        backgroundColor: '#111116',
        border: '1px solid #1a1a24',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '32px',
      }}>
        {/* Circular Score Display */}
        <div style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          flexShrink: 0,
        }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#1a1a24"
              strokeWidth="8"
            />
            {/* Score arc */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={sleepScore ? getScoreColor(sleepScore.score) : '#1a1a24'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(sleepScore?.score || 0) * 3.27} 327`}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 600,
              color: sleepScore ? getScoreColor(sleepScore.score) : '#5a5a66',
            }}>
              {sleepScore?.score ?? '--'}
            </div>
            <div style={{ fontSize: '10px', color: '#5a5a66', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Score
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#f0f0f2', marginBottom: '16px' }}>Sleep Score Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#94949e', width: '80px' }}>Duration</span>
              <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: '#1a1a24', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${sleepScore?.components.duration_score ?? 0}%`,
                  backgroundColor: '#8b7cf6',
                  borderRadius: '3px',
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: '12px', color: '#5a5a66', width: '32px', textAlign: 'right' }}>
                {sleepScore?.components.duration_score ?? '--'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#94949e', width: '80px' }}>Quality</span>
              <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: '#1a1a24', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${sleepScore?.components.quality_score ?? 0}%`,
                  backgroundColor: '#4ade80',
                  borderRadius: '3px',
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: '12px', color: '#5a5a66', width: '32px', textAlign: 'right' }}>
                {sleepScore?.components.quality_score ?? '--'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#94949e', width: '80px' }}>Consistency</span>
              <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: '#1a1a24', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${sleepScore?.components.consistency_score ?? 0}%`,
                  backgroundColor: '#60a5fa',
                  borderRadius: '3px',
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: '12px', color: '#5a5a66', width: '32px', textAlign: 'right' }}>
                {sleepScore?.components.consistency_score ?? '--'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <StatCard label="Duration" value={stats?.avg_duration ? `${stats.avg_duration}h` : '--'} subtitle="7-day avg" accent="#6d5ed6" />
        <StatCard label="Quality" value={stats?.avg_quality ? `${stats.avg_quality}/5` : '--'} subtitle="7-day avg" accent="#4ade80" />
        <StatCard label="Entries" value={stats?.entries || 0} subtitle="Last week" accent="#8b7cf6" />
      </div>

      {/* Duration/Quality Chart */}
      <div style={{
        backgroundColor: '#111116',
        border: '1px solid #1a1a24',
        borderRadius: '12px',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#f0f0f2' }}>Sleep Trends</h3>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => setChartDays(7)} style={toggleButtonStyle(chartDays === 7)}>7 DAYS</button>
            <button onClick={() => setChartDays(30)} style={toggleButtonStyle(chartDays === 30)}>30 DAYS</button>
          </div>
        </div>
        <div style={{ width: '100%', height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: '#5a5a66', fontSize: 11 }}
                axisLine={{ stroke: '#1a1a24' }}
                tickLine={{ stroke: '#1a1a24' }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#5a5a66', fontSize: 11 }}
                axisLine={{ stroke: '#1a1a24' }}
                tickLine={{ stroke: '#1a1a24' }}
                domain={[0, 12]}
                label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#5a5a66', fontSize: 10 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#5a5a66', fontSize: 11 }}
                axisLine={{ stroke: '#1a1a24' }}
                tickLine={{ stroke: '#1a1a24' }}
                domain={[0, 5]}
                label={{ value: 'Quality', angle: 90, position: 'insideRight', fill: '#5a5a66', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f0f13',
                  border: '1px solid #1a1a24',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#f0f0f2' }}
                itemStyle={{ color: '#94949e' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '16px' }}
                formatter={(value: string) => <span style={{ color: '#94949e', fontSize: '11px' }}>{value}</span>}
              />
              {sleepTarget && (
                <ReferenceLine
                  yAxisId="left"
                  y={sleepTarget.target_hours}
                  stroke="#5a5a66"
                  strokeDasharray="5 5"
                  label={{ value: `Target: ${sleepTarget.target_hours}h`, fill: '#5a5a66', fontSize: 10, position: 'right' }}
                />
              )}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="duration"
                name="Duration (hrs)"
                stroke="#8b7cf6"
                strokeWidth={2}
                dot={{ fill: '#8b7cf6', r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="quality"
                name="Quality (1-5)"
                stroke="#4ade80"
                strokeWidth={2}
                dot={{ fill: '#4ade80', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sleep Target */}
      <div style={{
        backgroundColor: '#111116',
        border: '1px solid #1a1a24',
        borderRadius: '12px',
        padding: '20px',
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#f0f0f2', marginBottom: '16px' }}>Sleep Target</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="number"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder="8.0"
            min="1"
            max="24"
            step="0.5"
            style={{
              ...inputStyle,
              width: '120px',
            }}
          />
          <span style={{ fontSize: '13px', color: '#5a5a66' }}>hours per night</span>
          <button
            onClick={handleSaveTarget}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              backgroundColor: '#8b7cf6',
              color: '#fff',
            }}
          >
            Save
          </button>
          {sleepTarget && (
            <span style={{ fontSize: '12px', color: '#4ade80', marginLeft: '8px' }}>
              Current: {sleepTarget.target_hours}h
            </span>
          )}
        </div>
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
