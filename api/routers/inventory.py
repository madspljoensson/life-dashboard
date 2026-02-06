"""Inventory management endpoints."""

from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from database import get_db
from models import InventoryItem, InventoryCategory

router = APIRouter()


# Pydantic models
class InventoryItemCreate(BaseModel):
    name: str
    category: str
    status: str = "owned"
    priority: Optional[str] = None
    price: Optional[float] = None
    currency: str = "DKK"
    purchase_date: Optional[date] = None
    notes: Optional[str] = None
    ai_reason: Optional[str] = None
    tags: Optional[str] = None


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    purchase_date: Optional[date] = None
    notes: Optional[str] = None
    ai_reason: Optional[str] = None
    tags: Optional[str] = None


class InventoryItemResponse(BaseModel):
    id: int
    name: str
    category: str
    status: str
    priority: Optional[str]
    price: Optional[float]
    currency: str
    purchase_date: Optional[date]
    notes: Optional[str]
    ai_reason: Optional[str]
    tags: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str
    color: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    color: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class InventoryStats(BaseModel):
    total_owned: int
    wishlist_count: int
    ai_suggested_count: int
    total_wishlist_value: Optional[float]
    categories_used: int


# Item endpoints
@router.get("/", response_model=list[InventoryItemResponse])
async def list_items(
    status: Optional[str] = None,
    category: Optional[str] = None,
    tag: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(InventoryItem)
    
    if status:
        query = query.filter(InventoryItem.status == status)
    if category:
        query = query.filter(InventoryItem.category == category)
    if tag:
        query = query.filter(InventoryItem.tags.like(f"%{tag}%"))
    
    # Order by priority (high -> low) then created_at
    priority_order = {"high": 1, "medium": 2, "low": 3}
    items = query.order_by(InventoryItem.created_at.desc()).all()
    
    # Sort with priority consideration
    return sorted(items, key=lambda x: (
        priority_order.get(x.priority or "low", 4),
        -x.created_at.timestamp()
    ))


@router.post("/", response_model=InventoryItemResponse, status_code=201)
async def create_item(item: InventoryItemCreate, db: Session = Depends(get_db)):
    db_item = InventoryItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.patch("/{item_id}", response_model=InventoryItemResponse)
async def update_item(
    item_id: int,
    update: InventoryItemUpdate,
    db: Session = Depends(get_db)
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
async def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()


@router.get("/stats", response_model=InventoryStats)
async def get_stats(db: Session = Depends(get_db)):
    total_owned = db.query(InventoryItem).filter(
        InventoryItem.status == "owned"
    ).count()
    
    wishlist_count = db.query(InventoryItem).filter(
        InventoryItem.status == "wishlist"
    ).count()
    
    ai_suggested_count = db.query(InventoryItem).filter(
        InventoryItem.status == "ai_suggested"
    ).count()
    
    # Calculate total wishlist value
    wishlist_value_result = db.query(
        func.sum(InventoryItem.price)
    ).filter(
        InventoryItem.status == "wishlist",
        InventoryItem.price.isnot(None)
    ).scalar()
    
    # Count unique categories used
    categories_used = db.query(
        func.count(func.distinct(InventoryItem.category))
    ).scalar()
    
    return InventoryStats(
        total_owned=total_owned,
        wishlist_count=wishlist_count,
        ai_suggested_count=ai_suggested_count,
        total_wishlist_value=wishlist_value_result,
        categories_used=categories_used or 0
    )


# Category endpoints
@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(db: Session = Depends(get_db)):
    return db.query(InventoryCategory).order_by(InventoryCategory.name).all()


@router.post("/categories", response_model=CategoryResponse, status_code=201)
async def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    # Check if already exists
    existing = db.query(InventoryCategory).filter(
        InventoryCategory.name == category.name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    db_category = InventoryCategory(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.patch("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    update: CategoryUpdate,
    db: Session = Depends(get_db)
):
    category = db.query(InventoryCategory).filter(
        InventoryCategory.id == category_id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)

    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=204)
async def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(InventoryCategory).filter(
        InventoryCategory.id == category_id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if any items use this category
    items_count = db.query(InventoryItem).filter(
        InventoryItem.category == category.name
    ).count()
    if items_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category: {items_count} item(s) still use it"
        )
    
    db.delete(category)
    db.commit()
