const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// Tasks
export const tasks = {
  list: (status?: string) =>
    request<import('../types').Task[]>(`/tasks/${status ? `?status=${status}` : ''}`),
  create: (data: Partial<import('../types').Task>) =>
    request<import('../types').Task>('/tasks/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<import('../types').Task>) =>
    request<import('../types').Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/tasks/${id}`, { method: 'DELETE' }),
}

// Sleep
export const sleep = {
  list: (limit = 30) =>
    request<import('../types').SleepEntry[]>(`/sleep/?limit=${limit}`),
  log: (data: Partial<import('../types').SleepEntry>) =>
    request<import('../types').SleepEntry>('/sleep/', { method: 'POST', body: JSON.stringify(data) }),
  get: (date: string) =>
    request<import('../types').SleepEntry>(`/sleep/${date}`),
  weeklyStats: () =>
    request<import('../types').WeeklySleepStats>('/sleep/stats/weekly'),
  chartData: (days?: number) =>
    request<import('../types').SleepChartData[]>(`/sleep/chart-data?days=${days || 30}`),
  score: () =>
    request<import('../types').SleepScore>('/sleep/score'),
  getTarget: () =>
    request<import('../types').SleepTarget>('/sleep/target'),
  setTarget: (hours: number) =>
    request<import('../types').SleepTarget>('/sleep/target', { method: 'PUT', body: JSON.stringify({ target_hours: hours }) }),
}

// Daily
export const daily = {
  list: (limit = 30) =>
    request<import('../types').DailyNote[]>(`/daily/?limit=${limit}`),
  today: () =>
    request<import('../types').DailyNote | null>('/daily/today'),
  create: (data: Partial<import('../types').DailyNote>) =>
    request<import('../types').DailyNote>('/daily/', { method: 'POST', body: JSON.stringify(data) }),
  update: (date: string, data: Partial<import('../types').DailyNote>) =>
    request<import('../types').DailyNote>(`/daily/${date}`, { method: 'PATCH', body: JSON.stringify(data) }),
  trends: (days?: number) =>
    request<import('../types').DailyTrend[]>(`/daily/trends?days=${days || 30}`),
}

// Inventory
export const inventory = {
  list: (status?: string, category?: string, tag?: string) => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (category) params.append('category', category)
    if (tag) params.append('tag', tag)
    const query = params.toString()
    return request<import('../types').InventoryItem[]>(`/inventory/${query ? `?${query}` : ''}`)
  },
  create: (data: Partial<import('../types').InventoryItem>) =>
    request<import('../types').InventoryItem>('/inventory/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<import('../types').InventoryItem>) =>
    request<import('../types').InventoryItem>(`/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/inventory/${id}`, { method: 'DELETE' }),
  stats: () =>
    request<import('../types').InventoryStats>('/inventory/stats'),
  categories: () =>
    request<import('../types').InventoryCategory[]>('/inventory/categories'),
  createCategory: (data: { name: string; color?: string }) =>
    request<import('../types').InventoryCategory>('/inventory/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: number, data: { name?: string; color?: string }) =>
    request<import('../types').InventoryCategory>(`/inventory/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCategory: (id: number) =>
    request<void>(`/inventory/categories/${id}`, { method: 'DELETE' }),
}

// Settings
export const settings = {
  get: () =>
    request<Record<string, string>>('/settings/'),
  update: (data: Record<string, string>) =>
    request<void>('/settings/', { method: 'PUT', body: JSON.stringify(data) }),
  getSingle: (key: string) =>
    request<{ key: string; value: string }>(`/settings/${key}`),
  setSingle: (key: string, value: string) =>
    request<void>(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
}

// Nutrition
export const nutrition = {
  logMeal: (data: Record<string, unknown>) =>
    request<import('../types').MealEntry>('/nutrition/', { method: 'POST', body: JSON.stringify(data) }),
  getMeals: (date?: string) => {
    const params = new URLSearchParams()
    if (date) params.append('date', date)
    const query = params.toString()
    return request<import('../types').MealEntry[]>(`/nutrition/${query ? `?${query}` : ''}`)
  },
  getDailyTotals: (date?: string) => {
    const params = new URLSearchParams()
    if (date) params.append('date', date)
    const query = params.toString()
    return request<import('../types').DailyTotals>(`/nutrition/daily-totals${query ? `?${query}` : ''}`)
  },
  getTrends: (days = 7) =>
    request<import('../types').NutritionTrend[]>(`/nutrition/trends?days=${days}`),
  logWater: (data: { date: string; glasses: number; target?: number }) =>
    request<import('../types').WaterIntake>('/nutrition/water', { method: 'POST', body: JSON.stringify(data) }),
  getWater: (date?: string) => {
    const params = new URLSearchParams()
    if (date) params.append('date', date)
    const query = params.toString()
    return request<import('../types').WaterIntake>(`/nutrition/water${query ? `?${query}` : ''}`)
  },
  updateWater: (date: string, data: { glasses?: number; target?: number }) =>
    request<import('../types').WaterIntake>(`/nutrition/water/${date}`, { method: 'PUT', body: JSON.stringify(data) }),
}

// Fitness
export const fitness = {
  createWorkout: (data: Record<string, unknown>) =>
    request<import('../types').Workout>('/fitness/workouts', { method: 'POST', body: JSON.stringify(data) }),
  listWorkouts: (limit = 20) =>
    request<import('../types').Workout[]>(`/fitness/workouts?limit=${limit}`),
  getWorkout: (id: number) =>
    request<import('../types').Workout>(`/fitness/workouts/${id}`),
  deleteWorkout: (id: number) =>
    request<void>(`/fitness/workouts/${id}`, { method: 'DELETE' }),
  exerciseHistory: (name: string) =>
    request<import('../types').ExerciseHistory[]>(`/fitness/exercises/${encodeURIComponent(name)}/history`),
  listTemplates: () =>
    request<import('../types').WorkoutTemplate[]>('/fitness/templates'),
  createTemplate: (data: { name: string; workout_type: string; exercises_json: string }) =>
    request<import('../types').WorkoutTemplate>('/fitness/templates', { method: 'POST', body: JSON.stringify(data) }),
  deleteTemplate: (id: number) =>
    request<void>(`/fitness/templates/${id}`, { method: 'DELETE' }),
  getStats: () =>
    request<import('../types').FitnessStats>('/fitness/stats'),
}

// Finance
export const finance = {
  createTransaction: (data: Record<string, unknown>) =>
    request<import('../types').FinanceTransaction>('/finance/transactions', { method: 'POST', body: JSON.stringify(data) }),
  listTransactions: (month?: string, category?: string) => {
    const params = new URLSearchParams()
    if (month) params.append('month', month)
    if (category) params.append('category', category)
    const query = params.toString()
    return request<import('../types').FinanceTransaction[]>(`/finance/transactions${query ? `?${query}` : ''}`)
  },
  deleteTransaction: (id: number) =>
    request<void>(`/finance/transactions/${id}`, { method: 'DELETE' }),
  getSummary: (month?: string) => {
    const params = new URLSearchParams()
    if (month) params.append('month', month)
    const query = params.toString()
    return request<import('../types').FinanceSummary>(`/finance/summary${query ? `?${query}` : ''}`)
  },
  getTrends: (months = 6) =>
    request<import('../types').FinanceTrend[]>(`/finance/trends?months=${months}`),
  createBudget: (data: { category: string; monthly_limit: number }) =>
    request<import('../types').FinanceBudget>('/finance/budgets', { method: 'POST', body: JSON.stringify(data) }),
  listBudgets: () =>
    request<import('../types').FinanceBudget[]>('/finance/budgets'),
  updateBudget: (id: number, data: { category?: string; monthly_limit?: number }) =>
    request<import('../types').FinanceBudget>(`/finance/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBudget: (id: number) =>
    request<void>(`/finance/budgets/${id}`, { method: 'DELETE' }),
}

// Goals
export const goals = {
  create: (data: Record<string, unknown>) =>
    request<import('../types').Goal>('/goals/', { method: 'POST', body: JSON.stringify(data) }),
  list: (status?: string, category?: string) => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (category) params.append('category', category)
    const query = params.toString()
    return request<import('../types').Goal[]>(`/goals/${query ? `?${query}` : ''}`)
  },
  get: (id: number) =>
    request<import('../types').GoalWithMilestones>(`/goals/${id}`),
  update: (id: number, data: Record<string, unknown>) =>
    request<import('../types').Goal>(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/goals/${id}`, { method: 'DELETE' }),
  createMilestone: (goalId: number, data: { title: string; target_date?: string; sort_order?: number }) =>
    request<import('../types').Milestone>(`/goals/${goalId}/milestones`, { method: 'POST', body: JSON.stringify(data) }),
  updateMilestone: (goalId: number, mid: number, data: Record<string, unknown>) =>
    request<import('../types').Milestone>(`/goals/${goalId}/milestones/${mid}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMilestone: (goalId: number, mid: number) =>
    request<void>(`/goals/${goalId}/milestones/${mid}`, { method: 'DELETE' }),
  getStats: () =>
    request<import('../types').GoalStats>('/goals/stats'),
}

// Subscriptions
export const subscriptions = {
  create: (data: Record<string, unknown>) =>
    request<import('../types').Subscription>('/subscriptions/', { method: 'POST', body: JSON.stringify(data) }),
  list: (active?: boolean) => {
    const params = new URLSearchParams()
    if (active !== undefined) params.append('active', String(active))
    const query = params.toString()
    return request<import('../types').Subscription[]>(`/subscriptions/${query ? `?${query}` : ''}`)
  },
  update: (id: number, data: Record<string, unknown>) =>
    request<import('../types').Subscription>(`/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/subscriptions/${id}`, { method: 'DELETE' }),
  getStats: () =>
    request<import('../types').SubscriptionStats>('/subscriptions/stats'),
}

// Habits
export const habits = {
  list: (category?: string, active?: boolean) => {
    const params = new URLSearchParams()
    if (category) params.append('category', category)
    if (active !== undefined) params.append('active', String(active))
    const query = params.toString()
    return request<import('../types').Habit[]>(`/habits/${query ? `?${query}` : ''}`)
  },
  create: (data: Partial<import('../types').Habit>) =>
    request<import('../types').Habit>('/habits/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<import('../types').Habit>) =>
    request<import('../types').Habit>(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/habits/${id}`, { method: 'DELETE' }),
  log: (id: number, data: { date: string; completed: boolean; value?: number | null }) =>
    request<import('../types').HabitLog>(`/habits/${id}/log`, { method: 'POST', body: JSON.stringify(data) }),
  streak: (id: number) =>
    request<import('../types').HabitStreak>(`/habits/${id}/streak`),
  heatmap: () =>
    request<import('../types').HeatmapData[]>('/habits/heatmap'),
  stats: () =>
    request<import('../types').HabitStats>('/habits/stats'),
}
