import { useEffect, useState } from 'react'
import { CheckSquare, Moon, Smile, Zap, Clock, TrendingUp } from 'lucide-react'
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
      <div className="flex items-center justify-center h-full">
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Good evening</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{todayStr}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Tasks"
          value={activeTasks.length}
          icon={CheckSquare}
          color="var(--accent)"
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
          color="var(--success)"
          subtitle="Today"
        />
        <StatCard
          label="Energy"
          value={todayNote?.energy ? `${todayNote.energy}/5` : '—'}
          icon={Zap}
          color="var(--warning)"
          subtitle="Today"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tasks */}
        <Card title="Today's Tasks" subtitle={`${activeTasks.length} active`}>
          {activeTasks.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
              No active tasks. Nice! 🎉
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeTasks.slice(0, 8).map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        task.priority === 'urgent' ? 'var(--danger)' :
                        task.priority === 'high' ? 'var(--warning)' :
                        task.priority === 'medium' ? 'var(--accent)' :
                        'var(--text-muted)',
                    }}
                  />
                  <span className="text-sm flex-1 truncate">{task.title}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: task.status === 'in_progress' ? 'var(--accent)20' : 'var(--border)',
                      color: task.status === 'in_progress' ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >
                    {task.status === 'in_progress' ? 'In Progress' : 'Todo'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Sleep Chart */}
        <Card title="Sleep This Week" subtitle={sleepStats?.avg_quality ? `Avg quality: ${sleepStats.avg_quality}/5` : ''}>
          {!sleepStats?.data?.length ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
              No sleep data yet. Start tracking! 🌙
            </p>
          ) : (
            <div className="space-y-2">
              {sleepStats.data.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <span className="text-xs w-16" style={{ color: 'var(--text-muted)' }}>
                    {format(new Date(entry.date), 'EEE d')}
                  </span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(((entry.duration_hours || 0) / 10) * 100, 100)}%`,
                        backgroundColor: (entry.duration_hours || 0) >= 7 ? 'var(--success)' :
                                          (entry.duration_hours || 0) >= 5 ? 'var(--warning)' : 'var(--danger)',
                      }}
                    />
                  </div>
                  <span className="text-xs w-10 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
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
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {todayNote.note}
          </p>
        ) : (
          <p className="text-sm py-2" style={{ color: 'var(--text-muted)' }}>
            No note for today yet.
          </p>
        )}
      </Card>
    </div>
  )
}
