"""Task management endpoints."""

from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import Task

router = APIRouter()


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    due_date: Optional[date] = None
    recurring: bool = False
    recurring_pattern: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[date] = None
    recurring: Optional[bool] = None
    recurring_pattern: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    priority: str
    due_date: Optional[date]
    recurring: bool
    recurring_pattern: Optional[str]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


@router.get("/overdue", response_model=list[TaskResponse])
async def list_overdue_tasks(db: Session = Depends(get_db)):
    """Get all tasks that are overdue (due_date < today and status != done)."""
    today = date.today()
    return (
        db.query(Task)
        .filter(Task.due_date < today, Task.status != "done")
        .order_by(Task.due_date.asc())
        .all()
    )


@router.get("/", response_model=list[TaskResponse])
async def list_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    due_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Task)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if due_date:
        query = query.filter(Task.due_date == due_date)
    return query.order_by(Task.created_at.desc()).all()


@router.post("/", response_model=TaskResponse, status_code=201)
async def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, update: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = update.model_dump(exclude_unset=True)

    # Auto-set completed_at
    if update_data.get("status") == "done" and task.status != "done":
        update_data["completed_at"] = datetime.utcnow()
    elif update_data.get("status") and update_data["status"] != "done":
        update_data["completed_at"] = None

    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
