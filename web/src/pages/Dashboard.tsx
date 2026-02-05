import { useEffect, useState } from 'react'
import { CheckSquare, Moon, Smile, Zap } from 'lucide-react'
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
  const todayStr = format(new Date(), 'EEEE, MMMM d')

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
        <div className="text-sm text-text-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e4e4e7' }}>{greeting()}</h1>
        <p style={{ fontSize: '14px', marginTop: '4px', color: '#71717a' }}>{todayStr}</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard
          label="Active Tasks"
          value={activeTasks.length}
          icon={CheckSquare}
          color="#6366f1"
        />
        <StatCard
          label="Avg Sleep"
          value={sleepStats?.avg_duration ? `${sleepStats.avg_duration}h` : '—'}
          icon={Moon}
          color="#a78bfa"
          subtitle="Last 7 days"
        />
        <StatCard
          label="Mood"
          value={todayNote?.mood ? ['😫','😕','😐','🙂','😊'][todayNote.mood - 1] : '—'}
          icon={Smile}
          color="#22c55e"
          subtitle="Today"
        />
        <StatCard
          label="Energy"
          value={todayNote?.energy ? `${todayNote.energy}/5` : '—'}
          icon={Zap}
          color="#f59e0b"
          subtitle="Today"
        />
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Tasks */}
        <Card title="Today's Tasks" subtitle={`${activeTasks.length} active`}>
          {activeTasks.length === 0 ? (
            <p className="text-sm text-text-muted" style={{ padding: '16px 0', textAlign: 'center' }}>
              No active tasks. Nice! 🎉
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '256px', overflowY: 'auto' }}>
              {activeTasks.slice(0, 8).map(task => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '8px 12px', borderRadius: '8px', backgroundColor: '#12121a',
                  }}
                >
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor:
                      task.priority === 'urgent' ? '#ef4444' :
                      task.priority === 'high' ? '#f59e0b' :
                      task.priority === 'medium' ? '#6366f1' : '#71717a',
                  }} />
                  <span style={{ fontSize: '14px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e4e4e7' }}>
                    {task.title}
                  </span>
                  <span style={{
                    fontSize: '12px', padding: '2px 8px', borderRadius: '9999px',
                    backgroundColor: task.status === 'in_progress' ? '#6366f133' : '#2a2a40',
                    color: task.status === 'in_progress' ? '#6366f1' : '#71717a',
                  }}>
                    {task.status === 'in_progress' ? 'In Progress' : 'Todo'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Sleep Chart */}
        <Card title="Sleep This Week" subtitle={sleepStats?.avg_quality ? `Avg quality: ${sleepStats.avg_quality}/5` : undefined}>
          {!sleepStats?.data?.length ? (
            <p className="text-sm text-text-muted" style={{ padding: '16px 0', textAlign: 'center' }}>
              No sleep data yet. Start tracking! 🌙
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sleepStats.data.map(entry => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '8px 12px', borderRadius: '8px', backgroundColor: '#12121a',
                  }}
                >
                  <span style={{ fontSize: '12px', width: '64px', color: '#71717a' }}>
                    {format(new Date(entry.date), 'EEE d')}
                  </span>
                  <div style={{ flex: 1, height: '8px', borderRadius: '9999px', overflow: 'hidden', backgroundColor: '#2a2a40' }}>
                    <div style={{
                      height: '100%', borderRadius: '9999px',
                      width: `${Math.min(((entry.duration_hours || 0) / 10) * 100, 100)}%`,
                      backgroundColor: (entry.duration_hours || 0) >= 7 ? '#22c55e' :
                                        (entry.duration_hours || 0) >= 5 ? '#f59e0b' : '#ef4444',
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', width: '40px', textAlign: 'right', fontFamily: 'monospace', color: '#a1a1aa' }}>
                    {entry.duration_hours ? `${entry.duration_hours}h` : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Daily Note */}
      <Card title="Today's Note">
        {todayNote?.note ? (
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#a1a1aa' }}>
            {todayNote.note}
          </p>
        ) : (
          <p style={{ fontSize: '14px', padding: '8px 0', color: '#71717a' }}>
            No note for today yet.
          </p>
        )}
      </Card>
    </div>
  )
}
