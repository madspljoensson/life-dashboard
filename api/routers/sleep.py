"""Sleep tracking endpoints."""

from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import SleepEntry

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


@router.get("/stats/weekly")
async def weekly_stats(db: Session = Depends(get_db)):
    """Get sleep stats for the last 7 days."""
    from datetime import timedelta
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
