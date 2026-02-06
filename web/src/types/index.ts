export interface Task {
  id: number
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string | null
  category: string | null
  recurring: boolean
  recurring_pattern: 'daily' | 'weekly' | 'monthly' | null
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

export interface Habit {
  id: number
  name: string
  category: string
  icon: string | null
  target_frequency: string
  created_at: string
  active: boolean
}

export interface HabitLog {
  id: number
  habit_id: number
  date: string
  completed: boolean
  value: number | null
  created_at: string
}

export interface HabitStreak {
  current_streak: number
  longest_streak: number
}

export interface HabitStats {
  total_habits: number
  completion_rate_7d: number
  completion_rate_30d: number
  active_streaks: number
}

export interface HeatmapData {
  date: string
  count: number
}

export interface SleepChartData {
  date: string
  duration: number
  quality: number
}

export interface SleepScore {
  score: number
  duration_score: number
  quality_score: number
  consistency_score: number
  avg_duration: number | null
  avg_quality: number | null
  target_hours: number
}

export interface SleepTarget {
  target_hours: number
}

export interface DailyTrend {
  date: string
  mood: number | null
  energy: number | null
}

export interface UserSettings {
  enabled_modules: string[]
  sleep_target_hours: number
  timezone: string
}

// Nutrition
export interface MealEntry {
  id: number
  date: string
  meal_type: string
  description: string
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  created_at: string
}

export interface WaterIntake {
  id: number
  date: string
  glasses: number
  target: number
  created_at: string
}

export interface DailyTotals {
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
}

export interface NutritionTrend {
  date: string
  avg_calories: number
  avg_protein: number
  avg_carbs: number
  avg_fat: number
}

// Fitness
export interface FitnessExercise {
  id: number
  workout_id: number
  name: string
  sets: number
  reps: number
  weight: number | null
  created_at: string
}

export interface Workout {
  id: number
  date: string
  workout_type: string
  name: string
  duration_minutes: number | null
  notes: string | null
  created_at: string
  exercises: FitnessExercise[]
}

export interface WorkoutTemplate {
  id: number
  name: string
  workout_type: string
  exercises_json: string
}

export interface FitnessStats {
  total_workouts: number
  this_week: number
  streak: number
}

export interface ExerciseHistory {
  date: string
  sets: number
  reps: number
  weight: number | null
}

// Finance
export interface FinanceTransaction {
  id: number
  date: string
  amount: number
  category: string
  description: string | null
  transaction_type: 'income' | 'expense'
  created_at: string
}

export interface FinanceBudget {
  id: number
  category: string
  monthly_limit: number
  created_at: string
}

export interface FinanceSummary {
  income: number
  expenses: number
  net: number
  by_category: Record<string, number>
}

export interface FinanceTrend {
  month: string
  income: number
  expenses: number
}

// Goals
export interface Milestone {
  id: number
  goal_id: number
  title: string
  completed: boolean
  target_date: string | null
  completed_at: string | null
  sort_order: number
}

export interface Goal {
  id: number
  title: string
  description: string | null
  category: string
  target_date: string | null
  progress_pct: number
  status: 'active' | 'completed' | 'paused'
  created_at: string
  updated_at: string
}

export interface GoalWithMilestones extends Goal {
  milestones: Milestone[]
}

export interface GoalStats {
  total: number
  completed: number
  active: number
  by_category: Record<string, number>
}

// Subscriptions
export interface Subscription {
  id: number
  name: string
  cost: number
  billing_cycle: 'monthly' | 'yearly' | 'weekly'
  next_renewal: string
  category: string | null
  active: boolean
  notes: string | null
  created_at: string
}

export interface SubscriptionStats {
  monthly_total: number
  yearly_total: number
  count: number
  upcoming_renewals: Subscription[]
}
