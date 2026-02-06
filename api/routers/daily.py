"""Daily overview endpoints — mood, energy, notes, highlights."""

from datetime import datetime, date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import DailyNote

router = APIRouter()


class DailyCreate(BaseModel):
    date: date
    mood: Optional[int] = None  # 1-5
    energy: Optional[int] = None  # 1-5
    note: Optional[str] = None
    highlights: Optional[str] = None


class DailyUpdate(BaseModel):
    mood: Optional[int] = None
    energy: Optional[int] = None
    note: Optional[str] = None
    highlights: Optional[str] = None


class DailyResponse(BaseModel):
    id: int
    date: date
    mood: Optional[int]
    energy: Optional[int]
    note: Optional[str]
    highlights: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TrendEntry(BaseModel):
    date: date
    mood: Optional[int]
    energy: Optional[int]


# Static routes must come BEFORE parameterized routes
@router.get("/", response_model=list[DailyResponse])
async def list_daily(limit: int = 30, db: Session = Depends(get_db)):
    return (
        db.query(DailyNote)
        .order_by(DailyNote.date.desc())
        .limit(limit)
        .all()
    )


@router.post("/", response_model=DailyResponse, status_code=201)
async def create_daily(entry: DailyCreate, db: Session = Depends(get_db)):
    db_entry = DailyNote(**entry.model_dump())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.get("/today", response_model=Optional[DailyResponse])
async def get_today(db: Session = Depends(get_db)):
    entry = db.query(DailyNote).filter(DailyNote.date == date.today()).first()
    if not entry:
        return None
    return entry


@router.get("/trends", response_model=list[TrendEntry])
async def get_trends(days: int = 30, db: Session = Depends(get_db)):
    """Get mood and energy trends for charting."""
    start_date = date.today() - timedelta(days=days)
    entries = (
        db.query(DailyNote)
        .filter(DailyNote.date >= start_date)
        .order_by(DailyNote.date.asc())
        .all()
    )

    return [
        TrendEntry(
            date=e.date,
            mood=e.mood,
            energy=e.energy
        )
        for e in entries
    ]


# Parameterized routes MUST come after static routes
@router.get("/{entry_date}", response_model=DailyResponse)
async def get_daily(entry_date: date, db: Session = Depends(get_db)):
    entry = db.query(DailyNote).filter(DailyNote.date == entry_date).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Daily entry not found")
    return entry


@router.patch("/{entry_date}", response_model=DailyResponse)
async def update_daily(entry_date: date, update: DailyUpdate, db: Session = Depends(get_db)):
    entry = db.query(DailyNote).filter(DailyNote.date == entry_date).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Daily entry not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(entry, key, value)

    db.commit()
    db.refresh(entry)
    return entry
