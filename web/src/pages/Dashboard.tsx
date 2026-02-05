import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import { tasks, sleep, daily } from '../lib/api'
import type { Task, WeeklySleepStats, DailyNote } from '../types'

export default function Dashboard() {
  const [taskList, setTaskList] = useState<Task[]>([])
  const [sleepStats, setSleepStats] = useState<WeeklySleepStats | null>(null)
  const [todayNote, setTodayNote] = useState<DailyNote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      tasks.list().then(setTaskList),
      sleep.weeklyStats().then(setSleepStats),
      daily.today().then(setTodayNote),
    ]).finally(() => setLoading(false))
  }, [])

  const activeTasks = taskList.filter(t => t.status !== 'done')
  const doneTasks = taskList.filter(t => t.status === 'done')
  const todayStr = format(new Date(), 'EEEE, MMMM d')

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span style={{ fontSize: '13px', color: '#5a5a66' }}>Loading</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#f0f0f2', letterSpacing: '-0.02em' }}>
          Overview
        </h1>
        <p style={{ fontSize: '13px', color: '#5a5a66', marginTop: '4px' }}>{todayStr}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <StatCard label="Tasks" value={activeTasks.length} subtitle={`${doneTasks.length} completed`} accent="#8b7cf6" />
        <StatCard label="Sleep Avg" value={sleepStats?.avg_duration ? `${sleepStats.avg_duration}h` : '--'} subtitle="Last 7 days" accent="#6d5ed6" />
        <StatCard label="Mood" value={todayNote?.mood ? `${todayNote.mood}/5` : '--'} subtitle="Today" accent="#4ade80" />
        <StatCard label="Energy" value={todayNote?.energy ? `${todayNote.energy}/5` : '--'} subtitle="Today" accent="#fbbf24" />
      </div>

      {/* Content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Tasks */}
        <Card title="Active Tasks">
          {activeTasks.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#5a5a66', padding: '12px 0' }}>Nothing pending</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {activeTasks.slice(0, 8).map(task => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: '8px', backgroundColor: '#0f0f13',
                  }}
                >
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor:
                      task.priority === 'urgent' ? '#f87171' :
                      task.priority === 'high' ? '#fbbf24' :
                      task.priority === 'medium' ? '#8b7cf6' : '#33333f',
                  }} />
                  <span style={{ fontSize: '13px', flex: 1, color: '#f0f0f2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.title}
                  </span>
                  <span style={{
                    fontSize: '10px', padding: '3px 8px', borderRadius: '4px',
                    fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase',
                    backgroundColor: task.status === 'in_progress' ? '#8b7cf615' : '#1a1a24',
                    color: task.status === 'in_progress' ? '#8b7cf6' : '#5a5a66',
                  }}>
                    {task.status === 'in_progress' ? 'Active' : 'Todo'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Sleep */}
        <Card title="Sleep" subtitle={sleepStats?.avg_quality ? `Quality avg: ${sleepStats.avg_quality}/5` : undefined}>
          {!sleepStats?.data?.length ? (
            <p style={{ fontSize: '13px', color: '#5a5a66', padding: '12px 0' }}>No data recorded</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sleepStats.data.map(entry => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0f0f13',
                  }}
                >
                  <span style={{ fontSize: '11px', width: '48px', color: '#5a5a66', fontFamily: 'monospace' }}>
                    {format(new Date(entry.date), 'EEE')}
                  </span>
                  <div style={{ flex: 1, height: '4px', borderRadius: '2px', overflow: 'hidden', backgroundColor: '#1a1a24' }}>
                    <div style={{
                      height: '100%', borderRadius: '2px',
                      width: `${Math.min(((entry.duration_hours || 0) / 10) * 100, 100)}%`,
                      backgroundColor: (entry.duration_hours || 0) >= 7 ? '#4ade80' :
                                        (entry.duration_hours || 0) >= 5 ? '#fbbf24' : '#f87171',
                      opacity: 0.8,
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', width: '36px', textAlign: 'right', fontFamily: 'monospace', color: '#94949e' }}>
                    {entry.duration_hours ? `${entry.duration_hours}h` : '--'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Daily note */}
      <Card title="Journal">
        {todayNote?.note ? (
          <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#94949e' }}>{todayNote.note}</p>
        ) : (
          <p style={{ fontSize: '13px', color: '#5a5a66' }}>No entry for today</p>
        )}
      </Card>
    </div>
  )
}
