import { useEffect, useState, useMemo } from 'react'
import { format, subDays, parseISO } from 'date-fns'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import { habits as habitsApi } from '../lib/api'
import type { Habit, HabitStats, HeatmapData, HabitStreak } from '../types'

const CATEGORIES = ['all', 'health', 'mind', 'productivity', 'other'] as const
type CategoryFilter = typeof CATEGORIES[number]

interface HabitWithStreak extends Habit {
  streak?: HabitStreak
  completedToday?: boolean
  completionRate7d?: number
}

export default function Habits() {
  const [habitList, setHabitList] = useState<HabitWithStreak[]>([])
  const [stats, setStats] = useState<HabitStats | null>(null)
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')

  // Form state
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('health')
  const [newFrequency, setNewFrequency] = useState('daily')
  const [creating, setCreating] = useState(false)

  const fetchData = async () => {
    try {
      const [habitsList, statsData, heatmap] = await Promise.all([
        habitsApi.list(undefined, true),
        habitsApi.stats(),
        habitsApi.heatmap(),
      ])

      // Fetch streaks for each habit
      const habitsWithStreaks = await Promise.all(
        habitsList.map(async (habit) => {
          try {
            const streak = await habitsApi.streak(habit.id)
            return { ...habit, streak }
          } catch {
            return { ...habit, streak: { current_streak: 0, longest_streak: 0 } }
          }
        })
      )

      setHabitList(habitsWithStreaks)
      setStats(statsData)
      setHeatmapData(heatmap)
    } catch (err) {
      console.error('Failed to fetch habits data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filteredHabits = useMemo(() => {
    if (activeCategory === 'all') return habitList
    return habitList.filter(h => h.category === activeCategory)
  }, [habitList, activeCategory])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await habitsApi.create({
        name: newName.trim(),
        category: newCategory,
        target_frequency: newFrequency,
        active: true,
      })
      setNewName('')
      setNewCategory('health')
      setNewFrequency('daily')
      fetchData()
    } catch (err) {
      console.error('Failed to create habit:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleToggleToday = async (habit: HabitWithStreak) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    try {
      await habitsApi.log(habit.id, { date: today, completed: true })
      fetchData()
    } catch (err) {
      console.error('Failed to log habit:', err)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    border: '1px solid #1a1a24',
    backgroundColor: '#0f0f13',
    color: '#f0f0f2',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 500,
    color: '#5a5a66',
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    display: 'block',
    marginBottom: '6px',
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%235a5a66'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundSize: '16px',
    paddingRight: '36px',
  }

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
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#f0f0f2', letterSpacing: '-0.02em' }}>Habits</h1>
        <p style={{ fontSize: '13px', color: '#5a5a66', marginTop: '4px' }}>Consistency over time</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <StatCard label="Total Habits" value={stats?.total_habits ?? 0} subtitle="Active" accent="#8b7cf6" />
        <StatCard label="7-Day Rate" value={stats?.completion_rate_7d ? `${Math.round(stats.completion_rate_7d)}%` : '--'} subtitle="Completion" accent="#4ade80" />
        <StatCard label="30-Day Rate" value={stats?.completion_rate_30d ? `${Math.round(stats.completion_rate_30d)}%` : '--'} subtitle="Completion" accent="#6d5ed6" />
        <StatCard label="Active Streaks" value={stats?.active_streaks ?? 0} subtitle="Going strong" accent="#fbbf24" />
      </div>

      {/* Heatmap */}
      <Card title="Activity">
        <HabitHeatmap data={heatmapData} />
      </Card>

      {/* Create Habit Form */}
      <Card title="New Habit">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Enter habit name"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={selectStyle}>
              <option value="health">Health</option>
              <option value="mind">Mind</option>
              <option value="productivity">Productivity</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Frequency</label>
            <select value={newFrequency} onChange={e => setNewFrequency(e.target.value)} style={selectStyle}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: creating || !newName.trim() ? 'not-allowed' : 'pointer',
              backgroundColor: creating || !newName.trim() ? '#1a1a24' : '#8b7cf6',
              color: creating || !newName.trim() ? '#5a5a66' : '#fff',
            }}
          >
            {creating ? 'Adding...' : 'Add'}
          </button>
        </div>
      </Card>

      {/* Category Filter Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #1a1a24', paddingBottom: '0' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '10px 16px',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeCategory === cat ? '#f0f0f2' : '#5a5a66',
              cursor: 'pointer',
              borderBottom: activeCategory === cat ? '2px solid #8b7cf6' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Habit List */}
      <Card title="Today's Habits">
        {filteredHabits.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#5a5a66', padding: '12px 0' }}>
            {activeCategory === 'all' ? 'No habits yet. Create one above.' : `No ${activeCategory} habits.`}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filteredHabits.map(habit => (
              <HabitRow key={habit.id} habit={habit} onToggle={() => handleToggleToday(habit)} />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// Habit Row Component
function HabitRow({ habit, onToggle }: { habit: HabitWithStreak; onToggle: () => void }) {
  const [checked, setChecked] = useState(habit.completedToday || false)
  const [toggling, setToggling] = useState(false)

  const handleClick = async () => {
    if (checked || toggling) return
    setToggling(true)
    try {
      await onToggle()
      setChecked(true)
    } catch {
      // Error handled in parent
    } finally {
      setToggling(false)
    }
  }

  const categoryColors: Record<string, string> = {
    health: '#4ade80',
    mind: '#8b7cf6',
    productivity: '#fbbf24',
    other: '#94949e',
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '8px',
        backgroundColor: '#0f0f13',
      }}
    >
      {/* Check button */}
      <button
        onClick={handleClick}
        disabled={checked || toggling}
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          border: checked ? 'none' : '2px solid #33333f',
          backgroundColor: checked ? '#4ade80' : 'transparent',
          cursor: checked || toggling ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {checked && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f0f13" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Name */}
      <span style={{ flex: 1, fontSize: '14px', color: '#f0f0f2' }}>{habit.name}</span>

      {/* Category badge */}
      <span
        style={{
          fontSize: '10px',
          padding: '4px 10px',
          borderRadius: '4px',
          fontWeight: 500,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          backgroundColor: `${categoryColors[habit.category] || categoryColors.other}15`,
          color: categoryColors[habit.category] || categoryColors.other,
        }}
      >
        {habit.category}
      </span>

      {/* Streak info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#f0f0f2', fontFamily: 'monospace' }}>
            {habit.streak?.current_streak ?? 0}
          </div>
          <div style={{ fontSize: '10px', color: '#5a5a66' }}>current</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#94949e', fontFamily: 'monospace' }}>
            {habit.streak?.longest_streak ?? 0}
          </div>
          <div style={{ fontSize: '10px', color: '#5a5a66' }}>best</div>
        </div>
      </div>
    </div>
  )
}

// GitHub-style Heatmap Component
function HabitHeatmap({ data }: { data: HeatmapData[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; count: number } | null>(null)

  // Generate 365 days of data
  const heatmapGrid = useMemo(() => {
    const dataMap = new Map(data.map(d => [d.date, d.count]))
    const today = new Date()
    const days: { date: string; count: number; dayOfWeek: number }[] = []

    for (let i = 364; i >= 0; i--) {
      const date = subDays(today, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      days.push({
        date: dateStr,
        count: dataMap.get(dateStr) || 0,
        dayOfWeek: date.getDay(),
      })
    }

    return days
  }, [data])

  // Group into weeks
  const weeks = useMemo(() => {
    const result: typeof heatmapGrid[] = []
    let currentWeek: typeof heatmapGrid = []

    // Fill in empty days at the start to align with day of week
    const firstDayOfWeek = heatmapGrid[0]?.dayOfWeek ?? 0
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: '', count: -1, dayOfWeek: i })
    }

    heatmapGrid.forEach(day => {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        result.push(currentWeek)
        currentWeek = []
      }
    })

    if (currentWeek.length > 0) {
      result.push(currentWeek)
    }

    return result
  }, [heatmapGrid])

  // Get month labels
  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = []
    let lastMonth = -1

    weeks.forEach((week, weekIndex) => {
      const validDay = week.find(d => d.date)
      if (validDay) {
        const month = parseISO(validDay.date).getMonth()
        if (month !== lastMonth) {
          labels.push({
            label: format(parseISO(validDay.date), 'MMM'),
            weekIndex,
          })
          lastMonth = month
        }
      }
    })

    return labels
  }, [weeks])

  const getColor = (count: number): string => {
    if (count < 0) return 'transparent'
    if (count === 0) return '#161b22'
    if (count === 1) return '#0e4429'
    if (count <= 3) return '#006d32'
    return '#26a641'
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div style={{ position: 'relative' }}>
      {/* Month labels */}
      <div style={{ display: 'flex', paddingLeft: '32px', marginBottom: '4px' }}>
        {weeks.map((_, weekIndex) => {
          const label = monthLabels.find(m => m.weekIndex === weekIndex)
          return (
            <div
              key={weekIndex}
              style={{
                width: '12px',
                marginRight: '3px',
                fontSize: '10px',
                color: '#5a5a66',
              }}
            >
              {label?.label || ''}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex' }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', marginRight: '8px' }}>
          {dayLabels.map((label, i) => (
            <div
              key={label}
              style={{
                height: '12px',
                marginBottom: '3px',
                fontSize: '10px',
                color: '#5a5a66',
                lineHeight: '12px',
                visibility: i % 2 === 1 ? 'visible' : 'hidden',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'flex', gap: '3px' }}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  onMouseEnter={(e) => {
                    if (day.count >= 0) {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setTooltip({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                        date: day.date,
                        count: day.count,
                      })
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '2px',
                    backgroundColor: getColor(day.count),
                    cursor: day.count >= 0 ? 'pointer' : 'default',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', paddingLeft: '32px' }}>
        <span style={{ fontSize: '10px', color: '#5a5a66' }}>Less</span>
        {[0, 1, 2, 4].map(count => (
          <div
            key={count}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              backgroundColor: getColor(count),
            }}
          />
        ))}
        <span style={{ fontSize: '10px', color: '#5a5a66' }}>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            backgroundColor: '#1a1a24',
            border: '1px solid #33333f',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '11px',
            color: '#f0f0f2',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 500 }}>
            {tooltip.count} completion{tooltip.count !== 1 ? 's' : ''}
          </div>
          <div style={{ color: '#5a5a66', marginTop: '2px' }}>
            {format(parseISO(tooltip.date), 'MMM d, yyyy')}
          </div>
        </div>
      )}
    </div>
  )
}
