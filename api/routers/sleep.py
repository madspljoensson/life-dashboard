"""Sleep tracking endpoints."""

from datetime import datetime, date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from database import get_db
from models import SleepEntry, SleepSettings

router = APIRouter()


class SleepCreate(BaseModel):
    date: date
    bedtime: Optional[datetime] = None
    wake_time: Optional[datetime] = None
    duration_hours: Optional[float] = None
    quality: Optional[int] = None  # 1-5
    notes: Optional[str] = None


class SleepUpdate(BaseModel):
    bedtime: Optional[datetime] = None
    wake_time: Optional[datetime] = None
    duration_hours: Optional[float] = None
    quality: Optional[int] = None
    notes: Optional[str] = None


class SleepResponse(BaseModel):
    id: int
    date: date
    bedtime: Optional[datetime]
    wake_time: Optional[datetime]
    duration_hours: Optional[float]
    quality: Optional[int]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChartDataEntry(BaseModel):
    date: date
    duration: Optional[float]
    quality: Optional[int]


class SleepScore(BaseModel):
    score: int  # 0-100
    duration_score: int
    quality_score: int
    consistency_score: int
    avg_duration: Optional[float]
    avg_quality: Optional[float]
    target_hours: float


class TargetHours(BaseModel):
    target_hours: float


# Static routes must come BEFORE parameterized routes
@router.get("/", response_model=list[SleepResponse])
async def list_sleep(
    limit: int = 30,
    db: Session = Depends(get_db),
):
    return (
        db.query(SleepEntry)
        .order_by(SleepEntry.date.desc())
        .limit(limit)
        .all()
    )


@router.post("/", response_model=SleepResponse, status_code=201)
async def log_sleep(entry: SleepCreate, db: Session = Depends(get_db)):
    # Calculate duration if both times provided
    data = entry.model_dump()
    if data["bedtime"] and data["wake_time"] and not data["duration_hours"]:
        delta = data["wake_time"] - data["bedtime"]
        data["duration_hours"] = round(delta.total_seconds() / 3600, 2)

    db_entry = SleepEntry(**data)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.get("/chart-data", response_model=list[ChartDataEntry])
async def get_chart_data(days: int = 30, db: Session = Depends(get_db)):
    """Get sleep data for charting."""
    start_date = date.today() - timedelta(days=days)
    entries = (
        db.query(SleepEntry)
        .filter(SleepEntry.date >= start_date)
        .order_by(SleepEntry.date.asc())
        .all()
    )

    return [
        ChartDataEntry(
            date=e.date,
            duration=e.duration_hours,
            quality=e.quality
        )
        for e in entries
    ]


@router.get("/score", response_model=SleepScore)
async def get_sleep_score(db: Session = Depends(get_db)):
    """Calculate composite sleep score based on recent duration, quality, and consistency."""
    # Get target hours
    settings = db.query(SleepSettings).first()
    target_hours = settings.target_hours if settings else 8.0

    # Get last 7 days of sleep data
    week_ago = date.today() - timedelta(days=7)
    entries = (
        db.query(SleepEntry)
        .filter(SleepEntry.date >= week_ago)
        .order_by(SleepEntry.date.desc())
        .all()
    )

    if not entries:
        return SleepScore(
            score=0,
            duration_score=0,
            quality_score=0,
            consistency_score=0,
            avg_duration=None,
            avg_quality=None,
            target_hours=target_hours
        )

    durations = [e.duration_hours for e in entries if e.duration_hours]
    qualities = [e.quality for e in entries if e.quality]

    # Duration score (0-40 points) - how close to target
    duration_score = 0
    avg_duration = None
    if durations:
        avg_duration = sum(durations) / len(durations)
        # Score based on how close to target (within 1 hour = full points)
        diff = abs(avg_duration - target_hours)
        if diff <= 0.5:
            duration_score = 40
        elif diff <= 1:
            duration_score = 35
        elif diff <= 1.5:
            duration_score = 28
        elif diff <= 2:
            duration_score = 20
        else:
            duration_score = max(0, 40 - int(diff * 10))

    # Quality score (0-40 points) - average quality * 8
    quality_score = 0
    avg_quality = None
    if qualities:
        avg_quality = sum(qualities) / len(qualities)
        quality_score = int(avg_quality * 8)  # 5 * 8 = 40 max

    # Consistency score (0-20 points) - based on # of entries and variance
    consistency_score = 0
    # Points for logging regularly (up to 10 points for 7 entries)
    consistency_score += min(10, int(len(entries) * 10 / 7))
    # Points for consistent timing (up to 10 points for low variance)
    if len(durations) >= 3:
        mean = sum(durations) / len(durations)
        variance = sum((d - mean) ** 2 for d in durations) / len(durations)
        std_dev = variance ** 0.5
        if std_dev < 0.5:
            consistency_score += 10
        elif std_dev < 1:
            consistency_score += 7
        elif std_dev < 1.5:
            consistency_score += 4
        else:
            consistency_score += 2

    total_score = duration_score + quality_score + consistency_score

    return SleepScore(
        score=min(100, total_score),
        duration_score=duration_score,
        quality_score=quality_score,
        consistency_score=consistency_score,
        avg_duration=round(avg_duration, 2) if avg_duration else None,
        avg_quality=round(avg_quality, 1) if avg_quality else None,
        target_hours=target_hours
    )


@router.get("/target", response_model=TargetHours)
async def get_sleep_target(db: Session = Depends(get_db)):
    """Get sleep target hours."""
    settings = db.query(SleepSettings).first()
    if not settings:
        # Create default settings
        settings = SleepSettings(target_hours=8.0)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return TargetHours(target_hours=settings.target_hours)


@router.put("/target", response_model=TargetHours)
async def set_sleep_target(target: TargetHours, db: Session = Depends(get_db)):
    """Set sleep target hours."""
    settings = db.query(SleepSettings).first()
    if not settings:
        settings = SleepSettings(target_hours=target.target_hours)
        db.add(settings)
    else:
        settings.target_hours = target.target_hours
    db.commit()
    db.refresh(settings)
    return TargetHours(target_hours=settings.target_hours)


@router.get("/stats/weekly")
async def weekly_stats(db: Session = Depends(get_db)):
    """Get sleep stats for the last 7 days."""
    week_ago = date.today() - timedelta(days=7)
    entries = (
        db.query(SleepEntry)
        .filter(SleepEntry.date >= week_ago)
        .order_by(SleepEntry.date.desc())
        .all()
    )

    if not entries:
        return {"entries": 0, "avg_duration": None, "avg_quality": None}

    durations = [e.duration_hours for e in entries if e.duration_hours]
    qualities = [e.quality for e in entries if e.quality]

    return {
        "entries": len(entries),
        "avg_duration": round(sum(durations) / len(durations), 2) if durations else None,
        "avg_quality": round(sum(qualities) / len(qualities), 1) if qualities else None,
        "data": [SleepResponse.model_validate(e) for e in entries],
    }


# Parameterized routes MUST come after static routes
@router.get("/{entry_date}", response_model=SleepResponse)
async def get_sleep(entry_date: date, db: Session = Depends(get_db)):
    entry = db.query(SleepEntry).filter(SleepEntry.date == entry_date).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Sleep entry not found")
    return entry


@router.patch("/{entry_date}", response_model=SleepResponse)
async def update_sleep(entry_date: date, update: SleepUpdate, db: Session = Depends(get_db)):
    entry = db.query(SleepEntry).filter(SleepEntry.date == entry_date).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Sleep entry not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(entry, key, value)

    # Recalculate duration if times changed
    if entry.bedtime and entry.wake_time:
        delta = entry.wake_time - entry.bedtime
        entry.duration_hours = round(delta.total_seconds() / 3600, 2)

    db.commit()
    db.refresh(entry)
    return entry
