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
}
