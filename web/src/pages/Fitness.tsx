import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import { fitness as fitnessApi } from '../lib/api'
import type { Workout, WorkoutTemplate, FitnessStats, ExerciseHistory } from '../types'

interface ExerciseRow {
  name: string
  sets: string
  reps: string
  weight: string
}

const WORKOUT_TYPES = ['Strength', 'Cardio', 'Flexibility', 'Other'] as const

const emptyExerciseRow = (): ExerciseRow => ({ name: '', sets: '', reps: '', weight: '' })

export default function Fitness() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [stats, setStats] = useState<FitnessStats | null>(null)
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [workoutType, setWorkoutType] = useState('Strength')
  const [workoutName, setWorkoutName] = useState('')
  const [workoutDate, setWorkoutDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [duration, setDuration] = useState('')
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [exercises, setExercises] = useState<ExerciseRow[]>([emptyExerciseRow()])
  const [submitting, setSubmitting] = useState(false)

  // Expandable workout detail
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Exercise progress chart
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Template save
  const [templateName, setTemplateName] = useState('')

  const fetchData = async () => {
    try {
      const [workoutList, statsData, templateList] = await Promise.all([
        fitnessApi.listWorkouts(20),
        fitnessApi.getStats(),
        fitnessApi.listTemplates(),
      ])
      setWorkouts(workoutList)
      setStats(statsData)
      setTemplates(templateList)
    } catch (err) {
      console.error('Failed to fetch fitness data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleLogWorkout = async () => {
    if (!workoutName.trim()) return
    setSubmitting(true)
    try {
      const validExercises = exercises
        .filter(e => e.name.trim())
        .map(e => ({
          name: e.name.trim(),
          sets: parseInt(e.sets) || 0,
          reps: parseInt(e.reps) || 0,
          weight: e.weight ? parseFloat(e.weight) : null,
        }))

      await fitnessApi.createWorkout({
        date: workoutDate,
        workout_type: workoutType,
        name: workoutName.trim(),
        duration_minutes: duration ? parseInt(duration) : null,
        notes: workoutNotes || null,
        exercises: validExercises,
      })

      setWorkoutName('')
      setWorkoutDate(format(new Date(), 'yyyy-MM-dd'))
      setDuration('')
      setWorkoutNotes('')
      setWorkoutType('Strength')
      setExercises([emptyExerciseRow()])
      fetchData()
    } catch (err) {
      console.error('Failed to log workout:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteWorkout = async (id: number) => {
    try {
      await fitnessApi.deleteWorkout(id)
      fetchData()
    } catch (err) {
      console.error('Failed to delete workout:', err)
    }
  }

  const handleLoadHistory = async () => {
    if (!exerciseSearch.trim()) return
    setLoadingHistory(true)
    try {
      const history = await fitnessApi.exerciseHistory(exerciseSearch.trim())
      setExerciseHistory(history)
    } catch (err) {
      console.error('Failed to load exercise history:', err)
      setExerciseHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleAddExercise = () => {
    setExercises([...exercises, emptyExerciseRow()])
  }

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const handleExerciseChange = (index: number, field: keyof ExerciseRow, value: string) => {
    const updated = [...exercises]
    updated[index] = { ...updated[index], [field]: value }
    setExercises(updated)
  }

  const handleStartFromTemplate = (template: WorkoutTemplate) => {
    setWorkoutType(template.workout_type)
    setWorkoutName(template.name)
    try {
      const parsed = JSON.parse(template.exercises_json)
      if (Array.isArray(parsed)) {
        setExercises(parsed.map((e: { name?: string; sets?: number; reps?: number; weight?: number }) => ({
          name: e.name || '',
          sets: e.sets?.toString() || '',
          reps: e.reps?.toString() || '',
          weight: e.weight?.toString() || '',
        })))
      }
    } catch {
      setExercises([emptyExerciseRow()])
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || exercises.every(e => !e.name.trim())) return
    try {
      const exercisesJson = JSON.stringify(
        exercises.filter(e => e.name.trim()).map(e => ({
          name: e.name.trim(),
          sets: parseInt(e.sets) || 0,
          reps: parseInt(e.reps) || 0,
          weight: e.weight ? parseFloat(e.weight) : null,
        }))
      )
      await fitnessApi.createTemplate({
        name: templateName.trim(),
        workout_type: workoutType,
        exercises_json: exercisesJson,
      })
      setTemplateName('')
      fetchData()
    } catch (err) {
      console.error('Failed to save template:', err)
    }
  }

  const handleDeleteTemplate = async (id: number) => {
    try {
      await fitnessApi.deleteTemplate(id)
      fetchData()
    } catch (err) {
      console.error('Failed to delete template:', err)
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

  const chartData = exerciseHistory.map(d => ({
    ...d,
    dateLabel: format(new Date(d.date), 'MMM d'),
  }))

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
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#f0f0f2', letterSpacing: '-0.02em' }}>Fitness</h1>
        <p style={{ fontSize: '13px', color: '#5a5a66', marginTop: '4px' }}>Workout tracking</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <StatCard label="Total Workouts" value={stats?.total_workouts ?? 0} subtitle="All time" accent="#8b7cf6" />
        <StatCard label="This Week" value={stats?.this_week ?? 0} subtitle="Workouts" accent="#4ade80" />
        <StatCard label="Current Streak" value={stats?.streak ?? 0} subtitle="Days" accent="#fbbf24" />
      </div>

      {/* Log Workout Form */}
      <Card title="Log Workout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Type</label>
              <select value={workoutType} onChange={e => setWorkoutType(e.target.value)} style={selectStyle}>
                {WORKOUT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                value={workoutName}
                onChange={e => setWorkoutName(e.target.value)}
                placeholder="Workout name"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                value={workoutDate}
                onChange={e => setWorkoutDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Duration (min)</label>
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="45"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={workoutNotes}
              onChange={e => setWorkoutNotes(e.target.value)}
              placeholder="Optional notes"
              rows={2}
              style={{ ...inputStyle, resize: 'none' as const }}
            />
          </div>

          {/* Exercises */}
          <div>
            <label style={labelStyle}>Exercises</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {exercises.map((ex, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={ex.name}
                    onChange={e => handleExerciseChange(i, 'name', e.target.value)}
                    placeholder="Exercise name"
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    value={ex.sets}
                    onChange={e => handleExerciseChange(i, 'sets', e.target.value)}
                    placeholder="Sets"
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    value={ex.reps}
                    onChange={e => handleExerciseChange(i, 'reps', e.target.value)}
                    placeholder="Reps"
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    value={ex.weight}
                    onChange={e => handleExerciseChange(i, 'weight', e.target.value)}
                    placeholder="Weight"
                    style={inputStyle}
                  />
                  <button
                    onClick={() => handleRemoveExercise(i)}
                    disabled={exercises.length <= 1}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 500,
                      cursor: exercises.length <= 1 ? 'not-allowed' : 'pointer',
                      backgroundColor: exercises.length <= 1 ? '#1a1a24' : '#2a1a1a',
                      color: exercises.length <= 1 ? '#5a5a66' : '#f87171',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleAddExercise}
              style={{
                marginTop: '8px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #1a1a24',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                backgroundColor: 'transparent',
                color: '#8b7cf6',
              }}
            >
              + Add Exercise
            </button>
          </div>

          <button
            onClick={handleLogWorkout}
            disabled={submitting || !workoutName.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: submitting || !workoutName.trim() ? 'not-allowed' : 'pointer',
              backgroundColor: submitting || !workoutName.trim() ? '#1a1a24' : '#8b7cf6',
              color: submitting || !workoutName.trim() ? '#5a5a66' : '#fff',
            }}
          >
            {submitting ? 'Logging...' : 'Log Workout'}
          </button>
        </div>
      </Card>

      {/* Recent Workouts */}
      <Card title="Recent Workouts">
        {workouts.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#5a5a66', padding: '12px 0' }}>No workouts recorded yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {workouts.map(w => (
              <div key={w.id}>
                <div
                  onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#0f0f13',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '11px', width: '56px', color: '#5a5a66', fontFamily: 'monospace' }}>
                    {format(new Date(w.date), 'MMM d')}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontWeight: 500,
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                      backgroundColor: w.workout_type === 'Strength' ? '#8b7cf615' :
                                       w.workout_type === 'Cardio' ? '#4ade8015' :
                                       w.workout_type === 'Flexibility' ? '#60a5fa15' : '#94949e15',
                      color: w.workout_type === 'Strength' ? '#8b7cf6' :
                             w.workout_type === 'Cardio' ? '#4ade80' :
                             w.workout_type === 'Flexibility' ? '#60a5fa' : '#94949e',
                    }}
                  >
                    {w.workout_type}
                  </span>
                  <span style={{ flex: 1, fontSize: '14px', color: '#f0f0f2' }}>{w.name}</span>
                  <span style={{ fontSize: '12px', color: '#94949e', fontFamily: 'monospace' }}>
                    {w.duration_minutes ? `${w.duration_minutes}m` : '--'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#5a5a66' }}>
                    {w.exercises.length} exercise{w.exercises.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteWorkout(w.id) }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      fontSize: '11px',
                      cursor: 'pointer',
                      backgroundColor: 'transparent',
                      color: '#5a5a66',
                    }}
                  >
                    Delete
                  </button>
                </div>
                {expandedId === w.id && w.exercises.length > 0 && (
                  <div style={{
                    padding: '12px 14px 12px 68px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}>
                    {w.exercises.map(ex => (
                      <div key={ex.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '12px',
                      }}>
                        <span style={{ color: '#f0f0f2', width: '160px' }}>{ex.name}</span>
                        <span style={{ color: '#94949e', fontFamily: 'monospace' }}>{ex.sets}x{ex.reps}</span>
                        {ex.weight != null && (
                          <span style={{ color: '#5a5a66', fontFamily: 'monospace' }}>{ex.weight}kg</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Exercise Progress Chart */}
      <div style={{
        backgroundColor: '#111116',
        border: '1px solid #1a1a24',
        borderRadius: '12px',
        padding: '20px',
      }}>
        <h3 style={{ fontSize: '12px', fontWeight: 500, color: '#94949e', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '16px' }}>
          Exercise Progress
        </h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            value={exerciseSearch}
            onChange={e => setExerciseSearch(e.target.value)}
            placeholder="Exercise name (e.g. Bench Press)"
            style={{ ...inputStyle, flex: 1 }}
            onKeyDown={e => { if (e.key === 'Enter') handleLoadHistory() }}
          />
          <button
            onClick={handleLoadHistory}
            disabled={loadingHistory || !exerciseSearch.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: loadingHistory || !exerciseSearch.trim() ? 'not-allowed' : 'pointer',
              backgroundColor: loadingHistory || !exerciseSearch.trim() ? '#1a1a24' : '#8b7cf6',
              color: loadingHistory || !exerciseSearch.trim() ? '#5a5a66' : '#fff',
            }}
          >
            {loadingHistory ? 'Loading...' : 'Load'}
          </button>
        </div>
        {chartData.length > 0 ? (
          <div style={{ width: '100%', height: 280, minWidth: '200px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fill: '#5a5a66', fontSize: 11 }}
                  axisLine={{ stroke: '#1a1a24' }}
                  tickLine={{ stroke: '#1a1a24' }}
                />
                <YAxis
                  tick={{ fill: '#5a5a66', fontSize: 11 }}
                  axisLine={{ stroke: '#1a1a24' }}
                  tickLine={{ stroke: '#1a1a24' }}
                  label={{ value: 'Weight', angle: -90, position: 'insideLeft', fill: '#5a5a66', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f0f13',
                    border: '1px solid #1a1a24',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#f0f0f2' }}
                  itemStyle={{ color: '#94949e' }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Weight"
                  stroke="#8b7cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b7cf6', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#5a5a66', padding: '12px 0' }}>
            Enter an exercise name and click Load to view progress.
          </p>
        )}
      </div>

      {/* Workout Templates */}
      <Card title="Workout Templates">
        {templates.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#5a5a66', padding: '12px 0' }}>No templates saved yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
            {templates.map(t => (
              <div key={t.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#0f0f13',
              }}>
                <span style={{ flex: 1, fontSize: '14px', color: '#f0f0f2' }}>{t.name}</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    backgroundColor: '#8b7cf615',
                    color: '#8b7cf6',
                  }}
                >
                  {t.workout_type}
                </span>
                <button
                  onClick={() => handleStartFromTemplate(t)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    backgroundColor: '#8b7cf6',
                    color: '#fff',
                  }}
                >
                  Start from Template
                </button>
                <button
                  onClick={() => handleDeleteTemplate(t.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '11px',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    color: '#5a5a66',
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            placeholder="Template name"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={handleSaveTemplate}
            disabled={!templateName.trim() || exercises.every(e => !e.name.trim())}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: !templateName.trim() || exercises.every(e => !e.name.trim()) ? 'not-allowed' : 'pointer',
              backgroundColor: !templateName.trim() || exercises.every(e => !e.name.trim()) ? '#1a1a24' : '#8b7cf6',
              color: !templateName.trim() || exercises.every(e => !e.name.trim()) ? '#5a5a66' : '#fff',
            }}
          >
            Save as Template
          </button>
        </div>
      </Card>
    </div>
  )
}
