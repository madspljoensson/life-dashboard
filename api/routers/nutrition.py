"""Nutrition tracking endpoints — meals and water intake."""

from datetime import datetime, date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from database import get_db
from models import MealEntry, WaterIntake

router = APIRouter()


# Pydantic models
class MealCreate(BaseModel):
    date: date
    meal_type: str  # breakfast, lunch, dinner, snack
    description: str
    calories: Optional[int] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None


class MealResponse(BaseModel):
    id: int
    date: date
    meal_type: str
    description: str
    calories: Optional[int]
    protein_g: Optional[float]
    carbs_g: Optional[float]
    fat_g: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}


class DailyTotals(BaseModel):
    total_calories: int
    total_protein: float
    total_carbs: float
    total_fat: float


class DailyAverage(BaseModel):
    date: date
    avg_calories: float
    avg_protein: float
    avg_carbs: float
    avg_fat: float


class WaterCreate(BaseModel):
    date: date
    glasses: int
    target: int = 8


class WaterResponse(BaseModel):
    id: int
    date: date
    glasses: int
    target: int
    created_at: datetime

    model_config = {"from_attributes": True}


class WaterUpdate(BaseModel):
    glasses: Optional[int] = None
    target: Optional[int] = None


# Meal endpoints
@router.post("/", response_model=MealResponse, status_code=201)
async def log_meal(meal: MealCreate, db: Session = Depends(get_db)):
    db_meal = MealEntry(**meal.model_dump())
    db.add(db_meal)
    db.commit()
    db.refresh(db_meal)
    return db_meal


@router.get("/", response_model=list[MealResponse])
async def list_meals(
    date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    query = db.query(MealEntry)
    if date:
        query = query.filter(MealEntry.date == date)
    return query.order_by(MealEntry.date.desc(), MealEntry.created_at.desc()).all()


@router.get("/daily-totals", response_model=DailyTotals)
async def get_daily_totals(
    date: date = None,
    db: Session = Depends(get_db),
):
    if date is None:
        from datetime import date as date_cls
        date = date_cls.today()

    result = db.query(
        func.coalesce(func.sum(MealEntry.calories), 0).label("total_calories"),
        func.coalesce(func.sum(MealEntry.protein_g), 0).label("total_protein"),
        func.coalesce(func.sum(MealEntry.carbs_g), 0).label("total_carbs"),
        func.coalesce(func.sum(MealEntry.fat_g), 0).label("total_fat"),
    ).filter(MealEntry.date == date).first()

    return DailyTotals(
        total_calories=int(result.total_calories),
        total_protein=float(result.total_protein),
        total_carbs=float(result.total_carbs),
        total_fat=float(result.total_fat),
    )


@router.get("/trends", response_model=list[DailyAverage])
async def get_trends(days: int = 7, db: Session = Depends(get_db)):
    start_date = date.today() - timedelta(days=days)

    results = (
        db.query(
            MealEntry.date,
            func.coalesce(func.sum(MealEntry.calories), 0).label("avg_calories"),
            func.coalesce(func.sum(MealEntry.protein_g), 0).label("avg_protein"),
            func.coalesce(func.sum(MealEntry.carbs_g), 0).label("avg_carbs"),
            func.coalesce(func.sum(MealEntry.fat_g), 0).label("avg_fat"),
        )
        .filter(MealEntry.date >= start_date)
        .group_by(MealEntry.date)
        .order_by(MealEntry.date)
        .all()
    )

    return [
        DailyAverage(
            date=r.date,
            avg_calories=float(r.avg_calories),
            avg_protein=float(r.avg_protein),
            avg_carbs=float(r.avg_carbs),
            avg_fat=float(r.avg_fat),
        )
        for r in results
    ]


# Water intake endpoints
@router.post("/water", response_model=WaterResponse, status_code=201)
async def log_water(water: WaterCreate, db: Session = Depends(get_db)):
    # Upsert: update if exists for this date, create otherwise
    existing = db.query(WaterIntake).filter(WaterIntake.date == water.date).first()
    if existing:
        existing.glasses = water.glasses
        existing.target = water.target
        db.commit()
        db.refresh(existing)
        return existing

    db_water = WaterIntake(**water.model_dump())
    db.add(db_water)
    db.commit()
    db.refresh(db_water)
    return db_water


@router.get("/water", response_model=WaterResponse)
async def get_water(
    date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    if date is None:
        from datetime import date as date_cls
        date = date_cls.today()

    entry = db.query(WaterIntake).filter(WaterIntake.date == date).first()
    if not entry:
        # Return default response
        return WaterResponse(
            id=0,
            date=date,
            glasses=0,
            target=8,
            created_at=datetime.utcnow(),
        )
    return entry


@router.put("/water/{date}", response_model=WaterResponse)
async def update_water(date: date, update: WaterUpdate, db: Session = Depends(get_db)):
    entry = db.query(WaterIntake).filter(WaterIntake.date == date).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Water intake entry not found for this date")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(entry, key, value)

    db.commit()
    db.refresh(entry)
    return entry
