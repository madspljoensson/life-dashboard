# Theseus

> *You are replacing yourself — brick by brick, board by board.*

A personal life dashboard for tracking sleep, nutrition, habits, fitness, and daily life. Built to help you take control, one day at a time.

## Stack

- **Frontend:** React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** FastAPI (Python)
- **Database:** SQLite (dev) → PostgreSQL (prod)
- **Charts:** Recharts

## Structure

```
web/          → React frontend (Vite)
api/          → FastAPI backend
```

## Getting Started

### API
```bash
cd api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 4810
```

### Web
```bash
cd web
npm install
npm run dev
```

## Modules (Planned)

- [x] Day Overview (calendar, weather, agenda)
- [x] Tasks & Todos
- [x] Sleep Tracking
- [ ] Nutrition / Meal Logging
- [ ] Habits & Streaks
- [ ] Fitness / Workouts
- [ ] Apple Health Integration
- [ ] Finance Overview
- [ ] AI Agent Integration

## License

Private — future public release planned.
