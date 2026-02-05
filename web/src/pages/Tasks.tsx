import { useEffect, useState } from 'react'
import { Plus, X, Check } from 'lucide-react'
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
    await tasksApi.update(task.id, { status: task.status === 'done' ? 'todo' : 'done' })
    fetchTasks()
  }

  const handleDelete = async (id: number) => {
    await tasksApi.delete(id)
    fetchTasks()
  }

  const activeTasks = taskList.filter(t => t.status !== 'done')
  const doneTasks = taskList.filter(t => t.status === 'done')

  const priorityColor: Record<string, string> = {
    urgent: '#f87171', high: '#fbbf24', medium: '#8b7cf6', low: '#33333f',
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
                <button onClick={() => handleToggle(task)} style={{
                  width: '18px', height: '18px', borderRadius: '4px',
                  border: '1.5px solid #33333f', backgroundColor: 'transparent',
                  cursor: 'pointer', flexShrink: 0,
                }} />
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                  backgroundColor: priorityColor[task.priority],
                }} />
                <span style={{ fontSize: '13px', flex: 1, color: '#f0f0f2' }}>{task.title}</span>
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
                <button onClick={() => handleToggle(task)} style={{
                  width: '18px', height: '18px', borderRadius: '4px',
                  border: '1.5px solid #4ade80', backgroundColor: '#4ade80',
                  cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={11} color="#09090b" strokeWidth={3} />
                </button>
                <span style={{ fontSize: '13px', flex: 1, color: '#94949e', textDecoration: 'line-through' }}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
