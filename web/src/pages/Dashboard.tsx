import { useEffect, useState } from 'react'
import { format, addDays, isToday, isPast, parseISO, startOfDay } from 'date-fns'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import { tasks, sleep, daily, habits } from '../lib/api'
import type { Task, WeeklySleepStats, DailyNote, Habit, HabitStats, SleepChartData } from '../types'

export default function Dashboard() {
  const [taskList, setTaskList] = useState<Task[]>([])
  const [sleepStats, setSleepStats] = useState<WeeklySleepStats | null>(null)
  const [sleepChartData, setSleepChartData] = useState<SleepChartData[]>([])
  const [todayNote, setTodayNote] = useState<DailyNote | null>(null)
  const [habitList, setHabitList] = useState<Habit[]>([])
  const [habitStats, setHabitStats] = useState<HabitStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [addingTask, setAddingTask] = useState(false)

  const loadData = () => {
    Promise.allSettled([
      tasks.list().then(setTaskList),
      sleep.weeklyStats().then(setSleepStats),
      sleep.chartData(7).then(setSleepChartData),
      daily.today().then(setTodayNote),
      habits.list(undefined, true).then(setHabitList),
      habits.stats().then(setHabitStats),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim() || addingTask) return

    setAddingTask(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const newTask = await tasks.create({
        title: newTaskTitle.trim(),
        priority: 'medium',
        status: 'todo',
        due_date: today,
      })
      setTaskList(prev => [newTask, ...prev])
      setNewTaskTitle('')
    } catch (err) {
      console.error('Failed to add task:', err)
    } finally {
      setAddingTask(false)
    }
  }

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    try {
      const updated = await tasks.update(task.id, { status: newStatus })
      setTaskList(prev => prev.map(t => t.id === task.id ? updated : t))
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }

  // Filter tasks: today's tasks or overdue
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayTasks = taskList.filter(t => {
    if (t.status === 'done') return false
    if (!t.due_date) return false
    const dueDate = parseISO(t.due_date)
    return isToday(dueDate) || isPast(startOfDay(dueDate))
  })

  const completedToday = taskList.filter(t => {
    if (t.status !== 'done') return false
    if (!t.completed_at) return false
    return format(parseISO(t.completed_at), 'yyyy-MM-dd') === todayStr
  })

  // Daily habits (target_frequency === 'daily')
  const dailyHabits = habitList.filter(h => h.target_frequency === 'daily')

  // Calculate upcoming week tasks
  const upcomingDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayTasks = taskList.filter(t =>
      t.due_date === dateStr && t.status !== 'done'
    )
    return {
      date,
      dateStr,
      tasks: dayTasks,
    }
  })

  // Sleep sparkline data (last 7 days)
  const sparklineData = sleepChartData.slice(-7).map(d => d.duration)
  const maxSleep = Math.max(...sparklineData, 10)
  const minSleep = Math.min(...sparklineData.filter(d => d > 0), 0)

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
        <p style={{ fontSize: '13px', color: '#5a5a66', marginTop: '4px' }}>
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
      </div>

      {/* Quick-Add Task Input */}
      <form onSubmit={handleAddTask}>
        <input
          type="text"
          value={newTaskTitle}
          onChange={e => setNewTaskTitle(e.target.value)}
          placeholder="Add a task for today..."
          disabled={addingTask}
          style={{
            width: '100%',
            padding: '14px 16px',
            fontSize: '14px',
            color: '#f0f0f2',
            backgroundColor: '#0f0f13',
            border: '1px solid #1a1a24',
            borderRadius: '10px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </form>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <StatCard
          label="Today's Tasks"
          value={todayTasks.length}
          subtitle={`${completedToday.length} completed today`}
          accent="#8b7cf6"
        />
        <StatCard
          label="Sleep Avg"
          value={sleepStats?.avg_duration ? `${sleepStats.avg_duration}h` : '--'}
          subtitle="Last 7 days"
          accent="#6d5ed6"
        />
        <StatCard
          label="Mood"
          value={todayNote?.mood ? `${todayNote.mood}/5` : '--'}
          subtitle="Today"
          accent="#4ade80"
        />
        <StatCard
          label="Energy"
          value={todayNote?.energy ? `${todayNote.energy}/5` : '--'}
          subtitle="Today"
          accent="#fbbf24"
        />
      </div>

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Today's Tasks */}
        <Card title="Today's Tasks" subtitle={todayTasks.length > 0 ? `${todayTasks.length} pending` : undefined}>
          {todayTasks.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#5a5a66', padding: '12px 0' }}>All clear for today</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {todayTasks.slice(0, 6).map(task => {
                const isOverdue = task.due_date && isPast(startOfDay(parseISO(task.due_date))) && !isToday(parseISO(task.due_date))
                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', borderRadius: '8px', backgroundColor: '#0f0f13',
                    }}
                  >
                    <button
                      onClick={() => handleToggleTask(task)}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: '2px solid #33333f',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                      backgroundColor:
                        task.priority === 'urgent' ? '#f87171' :
                        task.priority === 'high' ? '#fbbf24' :
                        task.priority === 'medium' ? '#8b7cf6' : '#33333f',
                    }} />
                    <span style={{
                      fontSize: '13px', flex: 1, color: '#f0f0f2',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {task.title}
                    </span>
                    {isOverdue && (
                      <span style={{
                        fontSize: '10px', padding: '3px 8px', borderRadius: '4px',
                        fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase',
                        backgroundColor: '#f8717115',
                        color: '#f87171',
                      }}>
                        Overdue
                      </span>
                    )}
                  </div>
                )
              })}
              {todayTasks.length > 6 && (
                <p style={{ fontSize: '12px', color: '#5a5a66', marginTop: '8px', textAlign: 'center' }}>
                  +{todayTasks.length - 6} more
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Daily Habits */}
        <Card title="Habits Due Today" subtitle={dailyHabits.length > 0 ? `${dailyHabits.length} daily habits` : undefined}>
          {dailyHabits.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#5a5a66', padding: '12px 0' }}>No daily habits set up</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {dailyHabits.slice(0, 6).map(habit => (
                <div
                  key={habit.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: '8px', backgroundColor: '#0f0f13',
                  }}
                >
                  <button
                    onClick={() => {
                      habits.log(habit.id, { date: todayStr, completed: true })
                        .catch(err => console.error('Failed to log habit:', err))
                    }}
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      border: '2px solid #33333f',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '13px', flex: 1, color: '#f0f0f2' }}>
                    {habit.name}
                  </span>
                  <span style={{
                    fontSize: '10px', padding: '3px 8px', borderRadius: '4px',
                    fontWeight: 500, letterSpacing: '0.02em',
                    backgroundColor: '#1a1a24',
                    color: '#5a5a66',
                  }}>
                    {habit.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Last Night's Sleep + Sparkline */}
        <Card title="Sleep" subtitle={sleepStats?.avg_quality ? `Quality avg: ${sleepStats.avg_quality}/5` : undefined}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Last night summary */}
            {sleepStats?.data?.[0] ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: '8px', backgroundColor: '#0f0f13',
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#5a5a66', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Last Night
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#f0f0f2', marginTop: '4px' }}>
                    {sleepStats.data[0].duration_hours || '--'}h
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#5a5a66', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Quality
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#f0f0f2', marginTop: '4px' }}>
                    {sleepStats.data[0].quality || '--'}/5
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#5a5a66' }}>No sleep data recorded</p>
            )}

            {/* Sleep Sparkline */}
            {sparklineData.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', color: '#5a5a66', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                  7-Day Trend
                </div>
                <svg width="100%" height="40" style={{ display: 'block' }}>
                  <polyline
                    fill="none"
                    stroke="#8b7cf6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={sparklineData.map((d, i) => {
                      const x = (i / (sparklineData.length - 1 || 1)) * 100
                      const y = 35 - ((d - minSleep) / (maxSleep - minSleep || 1)) * 30
                      return `${x}%,${y}`
                    }).join(' ')}
                  />
                </svg>
              </div>
            )}
          </div>
        </Card>

        {/* Today's Mood/Energy */}
        <Card title="Today's Wellbeing">
          {todayNote ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{
                padding: '16px', borderRadius: '8px', backgroundColor: '#0f0f13', textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', color: '#5a5a66', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Mood
                </div>
                <div style={{ fontSize: '28px', fontWeight: 600, color: '#4ade80', marginTop: '8px' }}>
                  {todayNote.mood || '--'}
                </div>
                <div style={{ fontSize: '11px', color: '#5a5a66', marginTop: '4px' }}>out of 5</div>
              </div>
              <div style={{
                padding: '16px', borderRadius: '8px', backgroundColor: '#0f0f13', textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', color: '#5a5a66', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Energy
                </div>
                <div style={{ fontSize: '28px', fontWeight: 600, color: '#fbbf24', marginTop: '8px' }}>
                  {todayNote.energy || '--'}
                </div>
                <div style={{ fontSize: '11px', color: '#5a5a66', marginTop: '4px' }}>out of 5</div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: '#5a5a66', padding: '12px 0' }}>
              No entry for today - visit Journal to log
            </p>
          )}

          {/* Habit Completion Rate */}
          {habitStats && habitStats.completion_rate_7d >= 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '11px', color: '#5a5a66', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Habit Completion (7 days)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  flex: 1, height: '8px', borderRadius: '4px', backgroundColor: '#1a1a24', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(habitStats.completion_rate_7d, 100)}%`,
                    backgroundColor: habitStats.completion_rate_7d >= 80 ? '#4ade80' :
                                    habitStats.completion_rate_7d >= 50 ? '#fbbf24' : '#f87171',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#f0f0f2', minWidth: '40px', textAlign: 'right' }}>
                  {Math.round(habitStats.completion_rate_7d)}%
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Upcoming Tasks Calendar View */}
      <Card title="Upcoming Week">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {upcomingDays.map(day => (
            <div
              key={day.dateStr}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '16px',
                padding: '12px', borderRadius: '8px',
                backgroundColor: isToday(day.date) ? '#8b7cf610' : 'transparent',
              }}
            >
              <div style={{
                width: '70px', flexShrink: 0,
                color: isToday(day.date) ? '#8b7cf6' : '#94949e',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {format(day.date, 'EEE')}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>
                  {format(day.date, 'd')}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {day.tasks.length === 0 ? (
                  <span style={{ fontSize: '13px', color: '#33333f' }}>No tasks</span>
                ) : (
                  day.tasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 10px', borderRadius: '6px', backgroundColor: '#0f0f13',
                      }}
                    >
                      <div style={{
                        width: '5px', height: '5px', borderRadius: '50%',
                        backgroundColor:
                          task.priority === 'urgent' ? '#f87171' :
                          task.priority === 'high' ? '#fbbf24' :
                          task.priority === 'medium' ? '#8b7cf6' : '#33333f',
                      }} />
                      <span style={{
                        fontSize: '12px', color: '#f0f0f2',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {task.title}
                      </span>
                    </div>
                  ))
                )}
                {day.tasks.length > 3 && (
                  <span style={{ fontSize: '11px', color: '#5a5a66' }}>
                    +{day.tasks.length - 3} more
                  </span>
                )}
              </div>
              <div style={{
                fontSize: '12px', color: '#5a5a66', minWidth: '30px', textAlign: 'right',
              }}>
                {day.tasks.length > 0 && day.tasks.length}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Daily note preview */}
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
