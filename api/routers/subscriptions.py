"""Subscription tracking endpoints."""

from datetime import datetime, date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import Subscription

router = APIRouter()


# Pydantic models
class SubscriptionCreate(BaseModel):
    name: str
    cost: float
    billing_cycle: str  # monthly, yearly, weekly
    next_renewal: date
    category: Optional[str] = None
    active: bool = True
    notes: Optional[str] = None


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    cost: Optional[float] = None
    billing_cycle: Optional[str] = None
    next_renewal: Optional[date] = None
    category: Optional[str] = None
    active: Optional[bool] = None
    notes: Optional[str] = None


class SubscriptionResponse(BaseModel):
    id: int
    name: str
    cost: float
    billing_cycle: str
    next_renewal: date
    category: Optional[str]
    active: bool
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class SubscriptionStats(BaseModel):
    monthly_total: float
    yearly_total: float
    count: int
    upcoming_renewals: list[SubscriptionResponse]


# Endpoints
@router.get("/stats", response_model=SubscriptionStats)
async def get_stats(db: Session = Depends(get_db)):
    active_subs = db.query(Subscription).filter(Subscription.active == True).all()

    monthly_total = 0.0
    for sub in active_subs:
        if sub.billing_cycle == "monthly":
            monthly_total += sub.cost
        elif sub.billing_cycle == "yearly":
            monthly_total += sub.cost / 12
        elif sub.billing_cycle == "weekly":
            monthly_total += sub.cost * (52 / 12)

    yearly_total = monthly_total * 12

    # Upcoming renewals (within 30 days)
    thirty_days = date.today() + timedelta(days=30)
    upcoming = (
        db.query(Subscription)
        .filter(
            Subscription.active == True,
            Subscription.next_renewal <= thirty_days,
            Subscription.next_renewal >= date.today(),
        )
        .order_by(Subscription.next_renewal)
        .all()
    )

    return SubscriptionStats(
        monthly_total=round(monthly_total, 2),
        yearly_total=round(yearly_total, 2),
        count=len(active_subs),
        upcoming_renewals=[SubscriptionResponse.model_validate(s) for s in upcoming],
    )


@router.post("/", response_model=SubscriptionResponse, status_code=201)
async def create_subscription(sub: SubscriptionCreate, db: Session = Depends(get_db)):
    db_sub = Subscription(**sub.model_dump())
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub


@router.get("/", response_model=list[SubscriptionResponse])
async def list_subscriptions(
    active: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Subscription)
    if active is not None:
        query = query.filter(Subscription.active == active)
    return query.order_by(Subscription.name).all()


@router.put("/{sub_id}", response_model=SubscriptionResponse)
async def update_subscription(sub_id: int, update: SubscriptionUpdate, db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(sub, key, value)

    db.commit()
    db.refresh(sub)
    return sub


@router.delete("/{sub_id}", status_code=204)
async def delete_subscription(sub_id: int, db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    db.delete(sub)
    db.commit()
