import { useEffect, useState, useMemo } from 'react'
import { format } from 'date-fns'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import { goals as goalsApi } from '../lib/api'
import type { Goal, GoalWithMilestones, GoalStats, Milestone } from '../types'

const CATEGORIES = ['all', 'health', 'career', 'personal', 'financial'] as const
type CategoryFilter = typeof CATEGORIES[number]

const categoryColors: Record<string, string> = {
  health: '#4ade80',
  career: '#60a5fa',
  personal: '#8b7cf6',
  financial: '#fbbf24',
}

export default function Goals() {
  const [goalList, setGoalList] = useState<Goal[]>([])
  const [stats, setStats] = useState<GoalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')
  const [expandedGoalId, setExpandedGoalId] = useState<number | null>(null)
  const [expandedGoal, setExpandedGoal] = useState<GoalWithMilestones | null>(null)

  // Form state
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState('health')
  const [newTargetDate, setNewTargetDate] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchData = async () => {
    try {
      const [goals, statsData] = await Promise.all([
        goalsApi.list(),
        goalsApi.getStats(),
      ])
      setGoalList(goals)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to fetch goals data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filteredGoals = useMemo(() => {
    if (activeCategory === 'all') return goalList
    return goalList.filter(g => g.category === activeCategory)
  }, [goalList, activeCategory])

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      await goalsApi.create({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        category: newCategory,
        target_date: newTargetDate || null,
        progress_pct: 0,
        status: 'active',
      })
      setNewTitle('')
      setNewDescription('')
      setNewCategory('health')
      setNewTargetDate('')
      fetchData()
    } catch (err) {
      console.error('Failed to create goal:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleExpand = async (goalId: number) => {
    if (expandedGoalId === goalId) {
      setExpandedGoalId(null)
      setExpandedGoal(null)
      return
    }
    setExpandedGoalId(goalId)
    try {
      const full = await goalsApi.get(goalId)
      setExpandedGoal(full)
    } catch (err) {
      console.error('Failed to fetch goal details:', err)
    }
  }

  const handleDelete = async (goalId: number) => {
    try {
      await goalsApi.delete(goalId)
      setExpandedGoalId(null)
      setExpandedGoal(null)
      fetchData()
    } catch (err) {
      console.error('Failed to delete goal:', err)
    }
  }

  const handleProgressUpdate = async (goalId: number, progress: number) => {
    try {
      await goalsApi.update(goalId, { progress_pct: progress })
      fetchData()
      if (expandedGoal && expandedGoal.id === goalId) {
        setExpandedGoal({ ...expandedGoal, progress_pct: progress })
      }
    } catch (err) {
      console.error('Failed to update progress:', err)
    }
  }

  const handleToggleMilestone = async (goalId: number, milestone: Milestone) => {
    try {
      await goalsApi.updateMilestone(goalId, milestone.id, { completed: !milestone.completed })
      const full = await goalsApi.get(goalId)
      setExpandedGoal(full)
      fetchData()
    } catch (err) {
      console.error('Failed to toggle milestone:', err)
    }
  }

  const handleAddMilestone = async (goalId: number, title: string) => {
    if (!title.trim()) return
    try {
      await goalsApi.createMilestone(goalId, { title: title.trim() })
      const full = await goalsApi.get(goalId)
      setExpandedGoal(full)
    } catch (err) {
      console.error('Failed to add milestone:', err)
    }
  }

  const handleDeleteMilestone = async (goalId: number, mid: number) => {
    try {
      await goalsApi.deleteMilestone(goalId, mid)
      const full = await goalsApi.get(goalId)
      setExpandedGoal(full)
    } catch (err) {
      console.error('Failed to delete milestone:', err)
    }
  }

  const milestoneDoneCount = useMemo(() => {
    // Count from expanded goal if available, otherwise show stats-based count
    if (expandedGoal) {
      return expandedGoal.milestones.filter(m => m.completed).length
    }
    return 0
  }, [expandedGoal])

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
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#f0f0f2', letterSpacing: '-0.02em' }}>Goals</h1>
        <p style={{ fontSize: '13px', color: '#5a5a66', marginTop: '4px' }}>Track your ambitions</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <StatCard label="Active Goals" value={stats?.active ?? 0} subtitle="In progress" accent="#8b7cf6" />
        <StatCard label="Completed" value={stats?.completed ?? 0} subtitle="Goals reached" accent="#4ade80" />
        <StatCard label="Total Goals" value={stats?.total ?? 0} subtitle="All time" accent="#fbbf24" />
      </div>

      {/* Create Goal Form */}
      <Card title="New Goal">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Enter goal title"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={selectStyle}>
                <option value="health">Health</option>
                <option value="career">Career</option>
                <option value="personal">Personal</option>
                <option value="financial">Financial</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Describe your goal"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' as const }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Target Date</label>
              <input
                type="date"
                value={newTargetDate}
                onChange={e => setNewTargetDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={creating || !newTitle.trim()}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 500,
                cursor: creating || !newTitle.trim() ? 'not-allowed' : 'pointer',
                backgroundColor: creating || !newTitle.trim() ? '#1a1a24' : '#8b7cf6',
                color: creating || !newTitle.trim() ? '#5a5a66' : '#fff',
              }}
            >
              {creating ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
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

      {/* Goal List */}
      <Card title="Your Goals">
        {filteredGoals.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#5a5a66', padding: '12px 0' }}>
            {activeCategory === 'all' ? 'No goals yet. Create one above.' : `No ${activeCategory} goals.`}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filteredGoals.map(goal => (
              <GoalRow
                key={goal.id}
                goal={goal}
                expanded={expandedGoalId === goal.id}
                expandedGoal={expandedGoalId === goal.id ? expandedGoal : null}
                onToggleExpand={() => handleExpand(goal.id)}
                onDelete={() => handleDelete(goal.id)}
                onProgressUpdate={(p) => handleProgressUpdate(goal.id, p)}
                onToggleMilestone={(m) => handleToggleMilestone(goal.id, m)}
                onAddMilestone={(title) => handleAddMilestone(goal.id, title)}
                onDeleteMilestone={(mid) => handleDeleteMilestone(goal.id, mid)}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// Goal Row Component
function GoalRow({
  goal,
  expanded,
  expandedGoal,
  onToggleExpand,
  onDelete,
  onProgressUpdate,
  onToggleMilestone,
  onAddMilestone,
  onDeleteMilestone,
}: {
  goal: Goal
  expanded: boolean
  expandedGoal: GoalWithMilestones | null
  onToggleExpand: () => void
  onDelete: () => void
  onProgressUpdate: (progress: number) => void
  onToggleMilestone: (milestone: Milestone) => void
  onAddMilestone: (title: string) => void
  onDeleteMilestone: (mid: number) => void
}) {
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
  const [progressInput, setProgressInput] = useState(goal.progress_pct)

  useEffect(() => {
    setProgressInput(goal.progress_pct)
  }, [goal.progress_pct])

  const statusColors: Record<string, string> = {
    active: '#4ade80',
    completed: '#8b7cf6',
    paused: '#94949e',
  }

  return (
    <div
      style={{
        borderRadius: '8px',
        backgroundColor: '#0f0f13',
        overflow: 'hidden',
      }}
    >
      {/* Main row — clickable */}
      <div
        onClick={onToggleExpand}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 14px',
          cursor: 'pointer',
        }}
      >
        {/* Expand indicator */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#5a5a66"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        {/* Title */}
        <span style={{ flex: 1, fontSize: '14px', color: '#f0f0f2' }}>{goal.title}</span>

        {/* Category badge */}
        <span
          style={{
            fontSize: '10px',
            padding: '4px 10px',
            borderRadius: '4px',
            fontWeight: 500,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            backgroundColor: `${categoryColors[goal.category] || '#94949e'}15`,
            color: categoryColors[goal.category] || '#94949e',
          }}
        >
          {goal.category}
        </span>

        {/* Status badge */}
        <span
          style={{
            fontSize: '10px',
            padding: '4px 10px',
            borderRadius: '4px',
            fontWeight: 500,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            backgroundColor: `${statusColors[goal.status] || '#94949e'}15`,
            color: statusColors[goal.status] || '#94949e',
          }}
        >
          {goal.status}
        </span>

        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
          <div style={{
            flex: 1,
            height: '6px',
            borderRadius: '3px',
            backgroundColor: '#1a1a24',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${goal.progress_pct}%`,
              height: '100%',
              backgroundColor: '#8b7cf6',
              borderRadius: '3px',
              transition: 'width 0.2s ease',
            }} />
          </div>
          <span style={{ fontSize: '11px', color: '#94949e', fontFamily: 'monospace', minWidth: '32px', textAlign: 'right' }}>
            {goal.progress_pct}%
          </span>
        </div>

        {/* Target date */}
        {goal.target_date && (
          <span style={{ fontSize: '11px', color: '#5a5a66' }}>
            {format(new Date(goal.target_date), 'MMM d, yyyy')}
          </span>
        )}
      </div>

      {/* Expanded section */}
      {expanded && (
        <div style={{ padding: '0 14px 14px 40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Description */}
          {goal.description && (
            <p style={{ fontSize: '13px', color: '#94949e', margin: 0 }}>{goal.description}</p>
          )}

          {/* Progress slider */}
          <div>
            <label style={{
              fontSize: '11px',
              fontWeight: 500,
              color: '#5a5a66',
              letterSpacing: '0.04em',
              textTransform: 'uppercase' as const,
              display: 'block',
              marginBottom: '8px',
            }}>
              Progress
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                min={0}
                max={100}
                value={progressInput}
                onChange={e => setProgressInput(Number(e.target.value))}
                onMouseUp={() => onProgressUpdate(progressInput)}
                onTouchEnd={() => onProgressUpdate(progressInput)}
                style={{ flex: 1, accentColor: '#8b7cf6' }}
              />
              <span style={{ fontSize: '13px', color: '#f0f0f2', fontFamily: 'monospace', minWidth: '36px', textAlign: 'right' }}>
                {progressInput}%
              </span>
            </div>
          </div>

          {/* Milestones */}
          <div>
            <label style={{
              fontSize: '11px',
              fontWeight: 500,
              color: '#5a5a66',
              letterSpacing: '0.04em',
              textTransform: 'uppercase' as const,
              display: 'block',
              marginBottom: '8px',
            }}>
              Milestones
            </label>
            {expandedGoal?.milestones && expandedGoal.milestones.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {expandedGoal.milestones.map(milestone => (
                  <div
                    key={milestone.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#111116',
                    }}
                  >
                    <button
                      onClick={() => onToggleMilestone(milestone)}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '4px',
                        border: milestone.completed ? 'none' : '2px solid #33333f',
                        backgroundColor: milestone.completed ? '#4ade80' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {milestone.completed && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0f0f13" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <span style={{
                      flex: 1,
                      fontSize: '13px',
                      color: milestone.completed ? '#5a5a66' : '#f0f0f2',
                      textDecoration: milestone.completed ? 'line-through' : 'none',
                    }}>
                      {milestone.title}
                    </span>
                    <button
                      onClick={() => onDeleteMilestone(milestone.id)}
                      style={{
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        color: '#5a5a66',
                        fontSize: '14px',
                        padding: '2px 4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: '#5a5a66', margin: 0 }}>No milestones yet.</p>
            )}

            {/* Add milestone */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input
                type="text"
                value={newMilestoneTitle}
                onChange={e => setNewMilestoneTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newMilestoneTitle.trim()) {
                    onAddMilestone(newMilestoneTitle)
                    setNewMilestoneTitle('')
                  }
                }}
                placeholder="Add a milestone"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  border: '1px solid #1a1a24',
                  backgroundColor: '#0f0f13',
                  color: '#f0f0f2',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => {
                  if (newMilestoneTitle.trim()) {
                    onAddMilestone(newMilestoneTitle)
                    setNewMilestoneTitle('')
                  }
                }}
                disabled={!newMilestoneTitle.trim()}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: !newMilestoneTitle.trim() ? 'not-allowed' : 'pointer',
                  backgroundColor: !newMilestoneTitle.trim() ? '#1a1a24' : '#8b7cf6',
                  color: !newMilestoneTitle.trim() ? '#5a5a66' : '#fff',
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Delete goal */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onDelete}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #33333f',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                backgroundColor: 'transparent',
                color: '#ef4444',
              }}
            >
              Delete Goal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
