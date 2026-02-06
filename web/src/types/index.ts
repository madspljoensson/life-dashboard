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

export interface InventoryItem {
  id: number
  name: string
  category: string
  status: 'owned' | 'wishlist' | 'ai_suggested'
  priority: 'low' | 'medium' | 'high' | null
  price: number | null
  currency: string
  purchase_date: string | null
  notes: string | null
  ai_reason: string | null
  tags: string | null
  created_at: string
  updated_at: string
}

export interface InventoryCategory {
  id: number
  name: string
  color: string | null
  created_at: string
}

export interface InventoryStats {
  total_owned: number
  wishlist_count: number
  ai_suggested_count: number
  total_wishlist_value: number | null
  categories_used: number
}
