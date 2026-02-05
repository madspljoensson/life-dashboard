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

  const priorityColor: Record<string, string> = {
    urgent: '#ef4444', high: '#f59e0b', medium: '#6366f1', low: '#71717a',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Tasks</h1>
        <p className="text-sm mt-1 text-text-muted">
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
            className="flex-1 px-3 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent/50"
          />
          <select
            value={newPriority}
            onChange={e => setNewPriority(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border-default bg-bg-secondary text-text-primary text-sm outline-none"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </Card>

      {/* Active Tasks */}
      <Card title="Active" subtitle={`${activeTasks.length} tasks`}>
        {loading ? (
          <p className="text-sm py-4 text-center text-text-muted">Loading...</p>
        ) : activeTasks.length === 0 ? (
          <p className="text-sm py-4 text-center text-text-muted">All done! 🎉</p>
        ) : (
          <div className="space-y-2">
            {activeTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg-secondary group"
              >
                <button
                  onClick={() => handleToggle(task)}
                  className="w-5 h-5 rounded border-2 border-border-default flex items-center justify-center shrink-0 transition-colors hover:border-success"
                />
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: priorityColor[task.priority] }}
                />
                <span className="text-sm flex-1 text-text-primary">{task.title}</span>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-danger"
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
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-secondary opacity-60 group"
              >
                <button
                  onClick={() => handleToggle(task)}
                  className="w-5 h-5 rounded border-2 border-success bg-success flex items-center justify-center shrink-0"
                >
                  <Check size={12} color="white" />
                </button>
                <span className="text-sm flex-1 line-through text-text-primary">{task.title}</span>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-danger"
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
