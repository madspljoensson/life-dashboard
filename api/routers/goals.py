"""Goals and milestones tracking endpoints."""

from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import Goal, Milestone

router = APIRouter()


# Pydantic models
class MilestoneCreate(BaseModel):
    title: str
    target_date: Optional[date] = None
    sort_order: int = 0


class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None
    target_date: Optional[date] = None
    sort_order: Optional[int] = None


class MilestoneResponse(BaseModel):
    id: int
    goal_id: int
    title: str
    completed: bool
    target_date: Optional[date]
    completed_at: Optional[datetime]
    sort_order: int

    model_config = {"from_attributes": True}


class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str  # health, career, personal, financial
    target_date: Optional[date] = None
    progress_pct: int = 0
    status: str = "active"


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    target_date: Optional[date] = None
    progress_pct: Optional[int] = None
    status: Optional[str] = None


class GoalResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: str
    target_date: Optional[date]
    progress_pct: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GoalWithMilestones(GoalResponse):
    milestones: list[MilestoneResponse] = []


class GoalStats(BaseModel):
    total: int
    completed: int
    active: int
    by_category: dict[str, int]


# Goal endpoints
@router.get("/stats", response_model=GoalStats)
async def get_stats(db: Session = Depends(get_db)):
    goals = db.query(Goal).all()
    total = len(goals)
    completed = sum(1 for g in goals if g.status == "completed")
    active = sum(1 for g in goals if g.status == "active")

    by_category: dict[str, int] = {}
    for g in goals:
        by_category[g.category] = by_category.get(g.category, 0) + 1

    return GoalStats(
        total=total,
        completed=completed,
        active=active,
        by_category=by_category,
    )


@router.post("/", response_model=GoalResponse, status_code=201)
async def create_goal(goal: GoalCreate, db: Session = Depends(get_db)):
    db_goal = Goal(**goal.model_dump())
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal


@router.get("/", response_model=list[GoalResponse])
async def list_goals(
    status: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Goal)
    if status:
        query = query.filter(Goal.status == status)
    if category:
        query = query.filter(Goal.category == category)
    return query.order_by(Goal.created_at.desc()).all()


@router.get("/{goal_id}", response_model=GoalWithMilestones)
async def get_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    milestones = (
        db.query(Milestone)
        .filter(Milestone.goal_id == goal_id)
        .order_by(Milestone.sort_order)
        .all()
    )

    return GoalWithMilestones(
        id=goal.id,
        title=goal.title,
        description=goal.description,
        category=goal.category,
        target_date=goal.target_date,
        progress_pct=goal.progress_pct,
        status=goal.status,
        created_at=goal.created_at,
        updated_at=goal.updated_at,
        milestones=[MilestoneResponse.model_validate(m) for m in milestones],
    )


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(goal_id: int, update: GoalUpdate, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(goal, key, value)

    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    db.query(Milestone).filter(Milestone.goal_id == goal_id).delete()
    db.delete(goal)
    db.commit()


# Milestone endpoints
@router.post("/{goal_id}/milestones", response_model=MilestoneResponse, status_code=201)
async def create_milestone(goal_id: int, milestone: MilestoneCreate, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    db_milestone = Milestone(goal_id=goal_id, **milestone.model_dump())
    db.add(db_milestone)
    db.commit()
    db.refresh(db_milestone)
    return db_milestone


@router.put("/{goal_id}/milestones/{milestone_id}", response_model=MilestoneResponse)
async def update_milestone(
    goal_id: int,
    milestone_id: int,
    update: MilestoneUpdate,
    db: Session = Depends(get_db),
):
    milestone = (
        db.query(Milestone)
        .filter(Milestone.id == milestone_id, Milestone.goal_id == goal_id)
        .first()
    )
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    update_data = update.model_dump(exclude_unset=True)

    # If completing, set completed_at
    if "completed" in update_data and update_data["completed"] and not milestone.completed:
        milestone.completed_at = datetime.utcnow()
    elif "completed" in update_data and not update_data["completed"]:
        milestone.completed_at = None

    for key, value in update_data.items():
        setattr(milestone, key, value)

    db.commit()
    db.refresh(milestone)
    return milestone


@router.delete("/{goal_id}/milestones/{milestone_id}", status_code=204)
async def delete_milestone(goal_id: int, milestone_id: int, db: Session = Depends(get_db)):
    milestone = (
        db.query(Milestone)
        .filter(Milestone.id == milestone_id, Milestone.goal_id == goal_id)
        .first()
    )
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    db.delete(milestone)
    db.commit()
