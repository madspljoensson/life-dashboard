export interface Task {
  id: number
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string | null
  recurring: boolean
  recurring_pattern: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface SleepEntry {
  id: number
  date: string
  bedtime: string | null
  wake_time: string | null
  duration_hours: number | null
  quality: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DailyNote {
  id: number
  date: string
  mood: number | null
  energy: number | null
  note: string | null
  highlights: string | null
  created_at: string
  updated_at: string
}

export interface WeeklySleepStats {
  entries: number
  avg_duration: number | null
  avg_quality: number | null
  data: SleepEntry[]
}
