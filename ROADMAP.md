# Theseus — Life Operating System

> Your life, organized. Your goals, achieved.

A personal life operating system with an AI co-pilot that helps users take control of every aspect of their life. Every module is optional — the user decides what matters to them.

---

## Core Philosophy

1. **Everything optional** — no module is enabled unless the user chooses it
2. **Data is power** — the more data the user provides, the smarter the AI becomes
3. **AI assists, never dictates** — suggestions, plans, accountability — not commands
4. **Adaptive coaching** — learns what works for each user over time
5. **Privacy first** — self-hosted and cloud options, end-to-end encryption
6. **Goal achievement** — success = user actually did what they said they would

---

## Modules (all optional, user-enabled)

### Health
- **Sleep** — tracking, charts, scores, consistency, goals
- **Nutrition** — meal logging, AI calorie estimation, macros, water intake
- **Fitness** — workout logging, templates, progress, plans
- **Habits** — daily tracking, streaks, heatmap, categories
- **Mental Health** — mood, energy, journal, gratitude, reflections

### Productivity
- **Tasks** — priorities, due dates, recurring, categories, projects
- **Calendar** — integrated view, event-linked tasks
- **Goals** — long-term goals, milestones, progress tracking, deadlines
- **Projects** — group tasks under projects, progress overview

### Life Management
- **Finance** — transactions, budgets, spending trends, savings
- **Subscriptions** — track all active subscriptions, costs, renewal dates
- **Inventory** — everything the user owns, categorized, valued
- **Home** — chores, maintenance schedules, household management

### Personal Growth
- **Learning** — books, courses, skills, progress
- **Career** — job tracking, networking, skill development
- **Social** — relationships, contact frequency, important dates
- **Journal** — daily reflections, weekly/monthly reviews

---

## AI Agent

The AI agent is the user's personal co-pilot. It has access to all enabled modules and data.

### Capabilities
- **Passive advisor** — answer questions with full context ("how did I sleep this week?")
- **Active coach** — proactive outreach ("you planned to work out today", "you haven't logged meals in 3 days")
- **Goal partner** — co-create plans, track accountability, adjust when things slip
- **Adaptive** — learns what motivation style works for the user based on goal achievement data
- **Natural language** — "I want to start working out" → agent builds a plan using everything it knows about the user

### Proactive Features
- Scheduled check-ins (like heartbeats/cron)
- Goal progress alerts
- Pattern detection ("you sleep better on days you exercise")
- Friction reduction ("you keep skipping morning workouts — want to try evenings?")

### Personalization
- User names their agent
- Agent adapts tone and approach based on what works
- Neutral by default, becomes more personal over time

---

## Integrations (all optional)

### Phase 1
- [ ] Apple Health (sleep, steps, workouts, heart rate)
- [ ] Google Calendar
- [ ] Apple Calendar
- [ ] Spotify (listening habits, mood correlation)

### Future
- [ ] Bank APIs (Plaid or similar)
- [ ] Strava / fitness apps
- [ ] Todoist / Notion import
- [ ] Google Fit
- [ ] Custom webhooks / API

---

## User Tiers

### Free
- All modules available
- Manual data entry
- Basic charts and tracking
- Manual onboarding (choose modules, set up yourself)
- No AI features

### Premium (Subscription)
- AI agent (full co-pilot)
- AI-assisted onboarding (interview, life profile, suggested plan)
- AI calorie estimation
- Proactive coaching and check-ins
- Pattern detection and insights
- Weekly AI digests
- Bring-your-own-key option (use personal API keys)

---

## Platforms

### Now
- [x] Web (desktop, mobile-responsive)

### Future
- [ ] PWA (installable, push notifications)
- [ ] iOS native app
- [ ] Android native app
- [ ] Apple Watch companion

---

## Architecture Decisions (Deferred — tracked in Cipher Dashboard)

- Data privacy & encryption strategy
- Self-hosted vs. cloud deployment options
- Local AI vs. cloud AI options
- Database migration (SQLite → PostgreSQL for multi-user)
- Authentication system (email + OAuth)
- Multi-user architecture

---

## Development Phases

### Phase 1 — Foundation (Current)
Build all core modules with clean UI, manual data entry, basic charts.
- Tasks, Sleep, Journal, Habits
- Overview dashboard with module cards
- Mobile-responsive layout

### Phase 2 — Data Depth
Add remaining modules, integrations, richer data visualization.
- Nutrition, Fitness, Finance, Subscriptions, Inventory
- Apple Health + Calendar integrations
- Recharts visualizations (trends, heatmaps, progress)
- Goals system with milestone tracking

### Phase 3 — AI Agent
Build the AI co-pilot layer on top of all data.
- Chat interface
- Natural language data entry
- Proactive coaching engine
- Goal planning and accountability
- Pattern detection and insights
- Adaptive behavior based on user outcomes

### Phase 4 — Public Launch
Authentication, multi-user, deployment, monetization.
- User accounts and onboarding flows
- Free/premium tier implementation
- Landing page and marketing
- Privacy/encryption implementation
- Native mobile apps

---

## Design Principles

1. **Minimal over maximal** — every element earns its space
2. **Data-dense, not cluttered** — show information, not decoration
3. **Input should be effortless** — natural language, quick-add, smart defaults
4. **Customizable** — user controls what they see and how
5. **Honest** — don't gamify progress dishonestly, show real data
