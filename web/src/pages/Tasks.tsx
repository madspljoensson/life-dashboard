import { useEffect, useState } from 'react'
import { Plus, Trash2, Check } from 'lucide-react'
import Card from '../components/Card'
import { tasks as tasksApi } from '../lib/api'
import type { Task } from '../types'

export default function Tasks() {
  const [taskList, setTaskList] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')
  const [newPriority, setNewPriority] = useState<string>('medium')

  const fetchTasks = () => {
    tasksApi.list().then(setTaskList).finally(() => setLoading(false))
  }

  useEffect(() => { fetchTasks() }, [])

  const handleAdd = async () => {
    if (!newTask.trim()) return
    await tasksApi.create({ title: newTask.trim(), priority: newPriority as Task['priority'] })
    setNewTask('')
    fetchTasks()
  }

  const handleToggle = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    await tasksApi.update(task.id, { status: newStatus })
    fetchTasks()
  }

  const handleDelete = async (id: number) => {
    await tasksApi.delete(id)
    fetchTasks()
  }

  const activeTasks = taskList.filter(t => t.status !== 'done')
  const doneTasks = taskList.filter(t => t.status === 'done')

  const priorityColors: Record<string, string> = {
    urgent: 'var(--danger)',
    high: 'var(--warning)',
    medium: 'var(--accent)',
    low: 'var(--text-muted)',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {activeTasks.length} active · {doneTasks.length} completed
        </p>
      </div>

      {/* Add Task */}
      <Card>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          <select
            value={newPriority}
            onChange={e => setNewPriority(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Plus size={16} />
          </button>
        </div>
      </Card>

      {/* Active Tasks */}
      <Card title="Active" subtitle={`${activeTasks.length} tasks`}>
        {loading ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : activeTasks.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>All done! 🎉</p>
        ) : (
          <div className="space-y-2">
            {activeTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg group"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <button
                  onClick={() => handleToggle(task)}
                  className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors hover:border-green-500"
                  style={{ borderColor: 'var(--border)' }}
                >
                </button>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: priorityColors[task.priority] }}
                />
                <span className="text-sm flex-1">{task.title}</span>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Completed */}
      {doneTasks.length > 0 && (
        <Card title="Completed" subtitle={`${doneTasks.length} tasks`}>
          <div className="space-y-2">
            {doneTasks.slice(0, 10).map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg opacity-60"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <button
                  onClick={() => handleToggle(task)}
                  className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: 'var(--success)', backgroundColor: 'var(--success)' }}
                >
                  <Check size={12} color="white" />
                </button>
                <span className="text-sm flex-1 line-through">{task.title}</span>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
