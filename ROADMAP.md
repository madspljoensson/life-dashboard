# Theseus Roadmap

> Replace yourself — board by board.

## Infrastructure (Done)
- [x] Monorepo: `web/` (React + Vite) + `api/` (FastAPI)
- [x] SQLite database with models
- [x] Cloudflare Tunnel (`theseus.madspljoensson.xyz`)
- [x] Cloudflare Access (email OTP, Mads only)
- [x] launchd services (auto-start on boot)
- [x] GitHub repo (private: `madspljoensson/life-dashboard`)

---

## Phase 1 — Core (Next)

### Tasks
- [ ] Due dates with visual indicators (overdue, due today, upcoming)
- [ ] Recurring tasks (daily, weekly, custom)
- [ ] Task categories / projects
- [ ] Drag-to-reorder priority
- [ ] Quick-add from overview page

### Sleep
- [ ] Sleep chart (7-day / 30-day line chart with Recharts)
- [ ] Sleep score calculation (duration + quality + consistency)
- [ ] Bedtime consistency tracking
- [ ] Target hours setting (e.g. 8h goal line on chart)

### Journal
- [ ] Rich text editor (or clean markdown)
- [ ] Mood + energy trends chart (30-day view)
- [ ] Gratitude prompts
- [ ] Weekly/monthly review auto-summaries

### Habits
- [ ] Create/manage habits
- [ ] Daily check-off grid (GitHub-style heatmap)
- [ ] Streak tracking with personal records
- [ ] Habit categories (health, mind, productivity)

---

## Phase 2 — Intelligence

### Nutrition
- [ ] Simple meal logging (text-based)
- [ ] Calorie estimation (AI-assisted — describe meal, get estimate)
- [ ] Macro breakdown (protein/carbs/fat)
- [ ] Daily/weekly nutrition summary
- [ ] Water intake tracking

### Apple Health Integration
- [ ] HealthKit data sync (via Shortcuts + API endpoint)
- [ ] Auto-import: sleep, steps, heart rate, workouts
- [ ] Activity rings visualization
- [ ] Weight tracking with trend line

### AI Agent
- [ ] Chat interface for natural language data entry
  - "Slept 7h, quality was good" → auto-logs sleep
  - "Add task: buy groceries, high priority" → creates task
- [ ] Daily insights: "You slept 30min less than your 7-day avg"
- [ ] Weekly digest generation
- [ ] Smart suggestions based on patterns

---

## Phase 3 — Life Systems

### Finance
- [ ] Manual transaction logging
- [ ] Budget categories with monthly targets
- [ ] Spending trends chart
- [ ] Recurring expenses tracking
- [ ] Monthly summary card on overview

### Fitness
- [ ] Workout logging (exercises, sets, reps, weight)
- [ ] Workout templates (push, pull, legs, etc.)
- [ ] Progress tracking per exercise
- [ ] Integration with Apple Health workouts

### Goals
- [ ] Long-term goal setting with milestones
- [ ] Progress bars on overview
- [ ] Goal categories (health, career, personal, financial)
- [ ] Deadline tracking

### Calendar Integration
- [ ] Google Calendar sync (read-only initially)
- [ ] Day view on overview page
- [ ] Event-linked tasks

---

## Phase 4 — Polish & Public

### UX
- [ ] Mobile-responsive layout
- [ ] Keyboard shortcuts (n = new task, j/k = navigate, etc.)
- [ ] Command palette (Cmd+K)
- [ ] Drag-and-drop widgets on overview
- [ ] Customizable overview layout
- [ ] Dark/light theme toggle (dark default)

### Data
- [ ] Export all data (JSON/CSV)
- [ ] Import from other apps
- [ ] Data backup system
- [ ] PostgreSQL migration for production

### Public Launch
- [ ] User authentication (email + OAuth)
- [ ] Multi-user support
- [ ] Onboarding flow
- [ ] Public landing page
- [ ] AI agent per user (bring your own key or subscription)

---

## Design Principles

1. **Minimal over maximal** — every element earns its space
2. **Data over decoration** — charts, numbers, trends
3. **Input should be effortless** — natural language, quick-add, smart defaults
4. **Privacy first** — self-hosted, your data stays yours
5. **AI assists, never dictates** — suggestions, not commands
