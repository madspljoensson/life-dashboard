import { useEffect, useState } from 'react'
import { Plus, X, Check, RefreshCw } from 'lucide-react'
import Card from '../components/Card'
import { tasks as tasksApi } from '../lib/api'
import type { Task } from '../types'

export default function Tasks() {
  const [taskList, setTaskList] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')
  const [newPriority, setNewPriority] = useState<string>('medium')
  const [newDueDate, setNewDueDate] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newRecurring, setNewRecurring] = useState<string>('none')

  const fetchTasks = () => {
    tasksApi.list().then(setTaskList).finally(() => setLoading(false))
  }

  useEffect(() => { fetchTasks() }, [])

  const handleAdd = async () => {
    if (!newTask.trim()) return
    await tasksApi.create({
      title: newTask.trim(),
      priority: newPriority as Task['priority'],
      due_date: newDueDate || null,
      category: newCategory.trim() || null,
      recurring: newRecurring !== 'none',
      recurring_pattern: newRecurring !== 'none' ? newRecurring as Task['recurring_pattern'] : null,
    })
    setNewTask('')
    setNewDueDate('')
    setNewCategory('')
    setNewRecurring('none')
    fetchTasks()
  }

  const handleStatusCycle = async (task: Task) => {
    const nextStatus: Record<Task['status'], Task['status']> = {
      todo: 'in_progress',
      in_progress: 'done',
      done: 'todo',
    }
    await tasksApi.update(task.id, { status: nextStatus[task.status] })
    fetchTasks()
  }

  const handleDelete = async (id: number) => {
    await tasksApi.delete(id)
    fetchTasks()
  }

  // Sort by priority first, then by due_date (nulls last)
  const priorityOrder: Record<Task['priority'], number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  const sortedTasks = [...taskList].sort((a, b) => {
    // First sort by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff

    // Then sort by due_date (nulls last)
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    }
    if (a.due_date && !b.due_date) return -1
    if (!a.due_date && b.due_date) return 1
    return 0
  })

  const activeTasks = sortedTasks.filter(t => t.status !== 'done')
  const doneTasks = sortedTasks.filter(t => t.status === 'done')

  const priorityColor: Record<string, string> = {
    urgent: '#f87171', high: '#fbbf24', medium: '#8b7cf6', low: '#33333f',
  }

  const statusColor: Record<Task['status'], string> = {
    todo: '#5a5a66',
    in_progress: '#fbbf24',
    done: '#4ade80',
  }

  const statusLabel: Record<Task['status'], string> = {
    todo: 'Todo',
    in_progress: 'In Progress',
    done: 'Done',
  }

  // Format due date for display
  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `Due: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  // Get due date color based on status
  const getDueDateColor = (task: Task): string => {
    if (!task.due_date) return '#5a5a66'
    if (task.status === 'done') return '#5a5a66'

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = new Date(task.due_date)
    dueDate.setHours(0, 0, 0, 0)

    if (dueDate < today) return '#f87171' // Overdue - red
    if (dueDate.getTime() === today.getTime()) return '#fbbf24' // Due today - amber
    return '#5a5a66' // Future - muted
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
    border: '1px solid #1a1a24', backgroundColor: '#0f0f13',
    color: '#f0f0f2', outline: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#f0f0f2', letterSpacing: '-0.02em' }}>Tasks</h1>
        <p style={{ fontSize: '13px', color: '#5a5a66', marginTop: '4px' }}>
          {activeTasks.length} active / {doneTasks.length} done
        </p>
      </div>

      {/* Add */}
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text" placeholder="New task" value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{ ...inputStyle, flex: 1 }}
            />
            <select value={newPriority} onChange={e => setNewPriority(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <button onClick={handleAdd} style={{
              padding: '10px 16px', borderRadius: '8px', border: 'none',
              backgroundColor: '#8b7cf6', color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}>
              <Plus size={15} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="date" value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
              placeholder="Due date"
              style={{ ...inputStyle, flex: 1, colorScheme: 'dark' }}
            />
            <input
              type="text" placeholder="Category/Project" value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <select value={newRecurring} onChange={e => setNewRecurring(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer', minWidth: '100px' }}>
              <option value="none">No repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Active */}
      <Card title="Active">
        {loading ? (
          <p style={{ fontSize: '13px', color: '#5a5a66', padding: '12px 0' }}>Loading</p>
        ) : activeTasks.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#5a5a66', padding: '12px 0' }}>All clear</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {activeTasks.map(task => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: '8px', backgroundColor: '#0f0f13',
              }}>
                {/* Status badge - clickable to cycle */}
                <button
                  onClick={() => handleStatusCycle(task)}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: statusColor[task.status],
                    color: task.status === 'in_progress' ? '#09090b' : '#f0f0f2',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {statusLabel[task.status]}
                </button>
                {/* Priority dot */}
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                  backgroundColor: priorityColor[task.priority],
                }} />
                {/* Task title */}
                <span style={{ fontSize: '13px', flex: 1, color: '#f0f0f2' }}>{task.title}</span>
                {/* Category badge */}
                {task.category && (
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#1a1a24',
                    color: '#94949e',
                    fontSize: '10px',
                    flexShrink: 0,
                  }}>
                    {task.category}
                  </span>
                )}
                {/* Recurring badge */}
                {task.recurring && (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#1a1a24',
                    color: '#8b7cf6',
                    fontSize: '10px',
                    flexShrink: 0,
                  }}>
                    <RefreshCw size={10} />
                    {task.recurring_pattern}
                  </span>
                )}
                {/* Due date */}
                {task.due_date && (
                  <span style={{
                    fontSize: '11px',
                    color: getDueDateColor(task),
                    flexShrink: 0,
                  }}>
                    {formatDueDate(task.due_date)}
                  </span>
                )}
                {/* Delete button */}
                <button onClick={() => handleDelete(task.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#33333f', padding: '4px', opacity: 0.5,
                }}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Done */}
      {doneTasks.length > 0 && (
        <Card title="Completed">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {doneTasks.slice(0, 10).map(task => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0f0f13', opacity: 0.5,
              }}>
                {/* Status badge - clickable to cycle */}
                <button
                  onClick={() => handleStatusCycle(task)}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: statusColor[task.status],
                    color: '#09090b',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {statusLabel[task.status]}
                </button>
                {/* Task title */}
                <span style={{ fontSize: '13px', flex: 1, color: '#94949e', textDecoration: 'line-through' }}>
                  {task.title}
                </span>
                {/* Category badge */}
                {task.category && (
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#1a1a24',
                    color: '#5a5a66',
                    fontSize: '10px',
                    flexShrink: 0,
                  }}>
                    {task.category}
                  </span>
                )}
                {/* Recurring badge */}
                {task.recurring && (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#1a1a24',
                    color: '#5a5a66',
                    fontSize: '10px',
                    flexShrink: 0,
                  }}>
                    <RefreshCw size={10} />
                    {task.recurring_pattern}
                  </span>
                )}
                {/* Due date */}
                {task.due_date && (
                  <span style={{
                    fontSize: '11px',
                    color: '#5a5a66',
                    flexShrink: 0,
                  }}>
                    {formatDueDate(task.due_date)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
