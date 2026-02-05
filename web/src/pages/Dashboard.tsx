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
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-text-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{greeting()}</h1>
        <p className="text-sm mt-1 text-text-muted">{todayStr}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <Card title="Today's Tasks" subtitle={`${activeTasks.length} active`}>
          {activeTasks.length === 0 ? (
            <p className="text-sm py-4 text-center text-text-muted">
              No active tasks. Nice! 🎉
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeTasks.slice(0, 8).map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-secondary"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        task.priority === 'urgent' ? '#ef4444' :
                        task.priority === 'high' ? '#f59e0b' :
                        task.priority === 'medium' ? '#6366f1' : '#71717a',
                    }}
                  />
                  <span className="text-sm flex-1 truncate text-text-primary">{task.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    task.status === 'in_progress'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-border-default text-text-muted'
                  }`}>
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
            <p className="text-sm py-4 text-center text-text-muted">
              No sleep data yet. Start tracking! 🌙
            </p>
          ) : (
            <div className="space-y-2">
              {sleepStats.data.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-secondary"
                >
                  <span className="text-xs w-16 text-text-muted">
                    {format(new Date(entry.date), 'EEE d')}
                  </span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden bg-border-default">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(((entry.duration_hours || 0) / 10) * 100, 100)}%`,
                        backgroundColor: (entry.duration_hours || 0) >= 7 ? '#22c55e' :
                                          (entry.duration_hours || 0) >= 5 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <span className="text-xs w-10 text-right font-mono text-text-secondary">
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
          <p className="text-sm leading-relaxed text-text-secondary">
            {todayNote.note}
          </p>
        ) : (
          <p className="text-sm py-2 text-text-muted">
            No note for today yet.
          </p>
        )}
      </Card>
    </div>
  )
}
