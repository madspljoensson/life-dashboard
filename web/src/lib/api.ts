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
