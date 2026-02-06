"""Fitness tracking endpoints — workouts, exercises, templates."""

from datetime import datetime, date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from database import get_db
from models import Workout, Exercise, WorkoutTemplate

router = APIRouter()


# Pydantic models
class ExerciseCreate(BaseModel):
    name: str
    sets: int
    reps: int
    weight: Optional[float] = None


class ExerciseResponse(BaseModel):
    id: int
    workout_id: int
    name: str
    sets: int
    reps: int
    weight: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkoutCreate(BaseModel):
    date: date
    workout_type: str  # strength, cardio, flexibility, other
    name: str
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    exercises: list[ExerciseCreate] = []


class WorkoutResponse(BaseModel):
    id: int
    date: date
    workout_type: str
    name: str
    duration_minutes: Optional[int]
    notes: Optional[str]
    created_at: datetime
    exercises: list[ExerciseResponse] = []

    model_config = {"from_attributes": True}


class WorkoutTemplateCreate(BaseModel):
    name: str
    workout_type: str
    exercises_json: str  # JSON string of exercises array


class WorkoutTemplateResponse(BaseModel):
    id: int
    name: str
    workout_type: str
    exercises_json: str

    model_config = {"from_attributes": True}


class FitnessStats(BaseModel):
    total_workouts: int
    this_week: int
    streak: int


class ExerciseHistory(BaseModel):
    date: date
    sets: int
    reps: int
    weight: Optional[float]


# Workout endpoints
@router.post("/workouts", response_model=WorkoutResponse, status_code=201)
async def create_workout(workout: WorkoutCreate, db: Session = Depends(get_db)):
    # Create workout
    workout_data = workout.model_dump(exclude={"exercises"})
    db_workout = Workout(**workout_data)
    db.add(db_workout)
    db.commit()
    db.refresh(db_workout)

    # Create exercises
    exercises = []
    for ex in workout.exercises:
        db_exercise = Exercise(workout_id=db_workout.id, **ex.model_dump())
        db.add(db_exercise)
        exercises.append(db_exercise)

    if exercises:
        db.commit()
        for ex in exercises:
            db.refresh(ex)

    # Build response
    response = WorkoutResponse(
        id=db_workout.id,
        date=db_workout.date,
        workout_type=db_workout.workout_type,
        name=db_workout.name,
        duration_minutes=db_workout.duration_minutes,
        notes=db_workout.notes,
        created_at=db_workout.created_at,
        exercises=[ExerciseResponse.model_validate(ex) for ex in exercises],
    )
    return response


@router.get("/workouts", response_model=list[WorkoutResponse])
async def list_workouts(limit: int = 20, db: Session = Depends(get_db)):
    workouts = (
        db.query(Workout)
        .order_by(Workout.date.desc(), Workout.created_at.desc())
        .limit(limit)
        .all()
    )

    result = []
    for w in workouts:
        exercises = db.query(Exercise).filter(Exercise.workout_id == w.id).all()
        result.append(
            WorkoutResponse(
                id=w.id,
                date=w.date,
                workout_type=w.workout_type,
                name=w.name,
                duration_minutes=w.duration_minutes,
                notes=w.notes,
                created_at=w.created_at,
                exercises=[ExerciseResponse.model_validate(ex) for ex in exercises],
            )
        )
    return result


@router.get("/workouts/{workout_id}", response_model=WorkoutResponse)
async def get_workout(workout_id: int, db: Session = Depends(get_db)):
    workout = db.query(Workout).filter(Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    exercises = db.query(Exercise).filter(Exercise.workout_id == workout.id).all()
    return WorkoutResponse(
        id=workout.id,
        date=workout.date,
        workout_type=workout.workout_type,
        name=workout.name,
        duration_minutes=workout.duration_minutes,
        notes=workout.notes,
        created_at=workout.created_at,
        exercises=[ExerciseResponse.model_validate(ex) for ex in exercises],
    )


@router.delete("/workouts/{workout_id}", status_code=204)
async def delete_workout(workout_id: int, db: Session = Depends(get_db)):
    workout = db.query(Workout).filter(Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    db.query(Exercise).filter(Exercise.workout_id == workout_id).delete()
    db.delete(workout)
    db.commit()


@router.get("/exercises/{name}/history", response_model=list[ExerciseHistory])
async def get_exercise_history(name: str, db: Session = Depends(get_db)):
    """Get history for a specific exercise name (weight over time)."""
    results = (
        db.query(Exercise, Workout.date)
        .join(Workout, Exercise.workout_id == Workout.id)
        .filter(Exercise.name == name)
        .order_by(Workout.date.asc())
        .all()
    )

    return [
        ExerciseHistory(
            date=r.date,
            sets=r.Exercise.sets,
            reps=r.Exercise.reps,
            weight=r.Exercise.weight,
        )
        for r in results
    ]


# Template endpoints
@router.get("/templates", response_model=list[WorkoutTemplateResponse])
async def list_templates(db: Session = Depends(get_db)):
    return db.query(WorkoutTemplate).all()


@router.post("/templates", response_model=WorkoutTemplateResponse, status_code=201)
async def create_template(template: WorkoutTemplateCreate, db: Session = Depends(get_db)):
    db_template = WorkoutTemplate(**template.model_dump())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


@router.delete("/templates/{template_id}", status_code=204)
async def delete_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(WorkoutTemplate).filter(WorkoutTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()


# Stats endpoint
@router.get("/stats", response_model=FitnessStats)
async def get_stats(db: Session = Depends(get_db)):
    total_workouts = db.query(Workout).count()

    # This week (Monday to today)
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    this_week = db.query(Workout).filter(Workout.date >= monday).count()

    # Calculate streak: consecutive days with workouts ending today or yesterday
    streak = 0
    check_date = today
    # Allow for today not having a workout yet
    has_today = db.query(Workout).filter(Workout.date == today).count() > 0
    if not has_today:
        check_date = today - timedelta(days=1)

    while True:
        count = db.query(Workout).filter(Workout.date == check_date).count()
        if count > 0:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    return FitnessStats(
        total_workouts=total_workouts,
        this_week=this_week,
        streak=streak,
    )
