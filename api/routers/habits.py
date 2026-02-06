"""Habit tracking endpoints."""

from datetime import datetime, date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from database import get_db
from models import Habit, HabitLog

router = APIRouter()


# Pydantic models
class HabitCreate(BaseModel):
    name: str
    category: Optional[str] = None  # health, mind, productivity, other
    icon: Optional[str] = None
    target_frequency: Optional[str] = "daily"  # daily, weekly
    active: bool = True


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    target_frequency: Optional[str] = None
    active: Optional[bool] = None


class HabitResponse(BaseModel):
    id: int
    name: str
    category: Optional[str]
    icon: Optional[str]
    target_frequency: Optional[str]
    created_at: datetime
    active: bool

    model_config = {"from_attributes": True}


class HabitLogCreate(BaseModel):
    date: date
    completed: bool = True
    value: Optional[float] = None


class HabitLogResponse(BaseModel):
    id: int
    habit_id: int
    date: date
    completed: bool
    value: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}


class StreakResponse(BaseModel):
    habit_id: int
    current_streak: int
    longest_streak: int


class HeatmapEntry(BaseModel):
    date: date
    count: int


class HabitStats(BaseModel):
    total_habits: int
    active_habits: int
    completion_rate_7d: Optional[float]
    completion_rate_30d: Optional[float]
    active_streaks: int


# Habit endpoints
@router.get("/", response_model=list[HabitResponse])
async def list_habits(
    category: Optional[str] = None,
    active: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Habit)
    if category:
        query = query.filter(Habit.category == category)
    if active is not None:
        query = query.filter(Habit.active == active)
    return query.order_by(Habit.created_at.desc()).all()


@router.post("/", response_model=HabitResponse, status_code=201)
async def create_habit(habit: HabitCreate, db: Session = Depends(get_db)):
    db_habit = Habit(**habit.model_dump())
    db.add(db_habit)
    db.commit()
    db.refresh(db_habit)
    return db_habit


@router.get("/heatmap", response_model=list[HeatmapEntry])
async def get_heatmap(days: int = 365, db: Session = Depends(get_db)):
    """Get completion data for heatmap visualization (all habits combined)."""
    start_date = date.today() - timedelta(days=days)

    # Query daily completion counts
    results = (
        db.query(
            HabitLog.date,
            func.count(HabitLog.id).label("count")
        )
        .filter(HabitLog.date >= start_date, HabitLog.completed == True)
        .group_by(HabitLog.date)
        .order_by(HabitLog.date)
        .all()
    )

    return [HeatmapEntry(date=r.date, count=r.count) for r in results]


@router.get("/stats", response_model=HabitStats)
async def get_stats(db: Session = Depends(get_db)):
    """Get overall habit statistics."""
    total_habits = db.query(Habit).count()
    active_habits = db.query(Habit).filter(Habit.active == True).count()

    # Calculate completion rates
    today = date.today()
    seven_days_ago = today - timedelta(days=7)
    thirty_days_ago = today - timedelta(days=30)

    # Get active habits for expected completions
    active_habit_ids = [h.id for h in db.query(Habit).filter(Habit.active == True).all()]

    if not active_habit_ids:
        return HabitStats(
            total_habits=total_habits,
            active_habits=active_habits,
            completion_rate_7d=None,
            completion_rate_30d=None,
            active_streaks=0
        )

    # 7-day completion rate
    completions_7d = db.query(HabitLog).filter(
        HabitLog.date >= seven_days_ago,
        HabitLog.completed == True,
        HabitLog.habit_id.in_(active_habit_ids)
    ).count()
    expected_7d = len(active_habit_ids) * 7
    rate_7d = round((completions_7d / expected_7d) * 100, 1) if expected_7d > 0 else None

    # 30-day completion rate
    completions_30d = db.query(HabitLog).filter(
        HabitLog.date >= thirty_days_ago,
        HabitLog.completed == True,
        HabitLog.habit_id.in_(active_habit_ids)
    ).count()
    expected_30d = len(active_habit_ids) * 30
    rate_30d = round((completions_30d / expected_30d) * 100, 1) if expected_30d > 0 else None

    # Count active streaks (habits with completion yesterday or today)
    active_streaks = 0
    for habit_id in active_habit_ids:
        streak = _calculate_streak(db, habit_id)
        if streak["current_streak"] > 0:
            active_streaks += 1

    return HabitStats(
        total_habits=total_habits,
        active_habits=active_habits,
        completion_rate_7d=rate_7d,
        completion_rate_30d=rate_30d,
        active_streaks=active_streaks
    )


@router.get("/{habit_id}", response_model=HabitResponse)
async def get_habit(habit_id: int, db: Session = Depends(get_db)):
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit


@router.patch("/{habit_id}", response_model=HabitResponse)
async def update_habit(habit_id: int, update: HabitUpdate, db: Session = Depends(get_db)):
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(habit, key, value)

    db.commit()
    db.refresh(habit)
    return habit


@router.delete("/{habit_id}", status_code=204)
async def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    # Also delete associated logs
    db.query(HabitLog).filter(HabitLog.habit_id == habit_id).delete()
    db.delete(habit)
    db.commit()


@router.post("/{habit_id}/log", response_model=HabitLogResponse, status_code=201)
async def log_habit(habit_id: int, log: HabitLogCreate, db: Session = Depends(get_db)):
    """Log completion for a habit on a specific date."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    # Check if log already exists for this date
    existing = db.query(HabitLog).filter(
        HabitLog.habit_id == habit_id,
        HabitLog.date == log.date
    ).first()

    if existing:
        # Update existing log
        existing.completed = log.completed
        existing.value = log.value
        db.commit()
        db.refresh(existing)
        return existing

    # Create new log
    db_log = HabitLog(
        habit_id=habit_id,
        date=log.date,
        completed=log.completed,
        value=log.value
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


@router.get("/{habit_id}/streak", response_model=StreakResponse)
async def get_streak(habit_id: int, db: Session = Depends(get_db)):
    """Get current and longest streak for a habit."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    streak_data = _calculate_streak(db, habit_id)
    return StreakResponse(
        habit_id=habit_id,
        current_streak=streak_data["current_streak"],
        longest_streak=streak_data["longest_streak"]
    )


@router.get("/{habit_id}/logs", response_model=list[HabitLogResponse])
async def get_habit_logs(
    habit_id: int,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get logs for a specific habit."""
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    start_date = date.today() - timedelta(days=days)
    return (
        db.query(HabitLog)
        .filter(HabitLog.habit_id == habit_id, HabitLog.date >= start_date)
        .order_by(HabitLog.date.desc())
        .all()
    )


def _calculate_streak(db: Session, habit_id: int) -> dict:
    """Calculate current and longest streak for a habit."""
    # Get all completed logs ordered by date descending
    logs = (
        db.query(HabitLog)
        .filter(HabitLog.habit_id == habit_id, HabitLog.completed == True)
        .order_by(HabitLog.date.desc())
        .all()
    )

    if not logs:
        return {"current_streak": 0, "longest_streak": 0}

    completed_dates = set(log.date for log in logs)
    today = date.today()

    # Calculate current streak
    current_streak = 0
    check_date = today

    # Allow for today not being logged yet - start from yesterday if today not completed
    if today not in completed_dates:
        check_date = today - timedelta(days=1)

    while check_date in completed_dates:
        current_streak += 1
        check_date -= timedelta(days=1)

    # Calculate longest streak
    if not completed_dates:
        return {"current_streak": 0, "longest_streak": 0}

    sorted_dates = sorted(completed_dates)
    longest_streak = 1
    current_count = 1

    for i in range(1, len(sorted_dates)):
        if sorted_dates[i] - sorted_dates[i-1] == timedelta(days=1):
            current_count += 1
            longest_streak = max(longest_streak, current_count)
        else:
            current_count = 1

    return {
        "current_streak": current_streak,
        "longest_streak": max(longest_streak, current_streak)
    }
