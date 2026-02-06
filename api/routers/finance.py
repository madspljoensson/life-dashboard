"""Finance tracking endpoints — transactions and budgets."""

from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from pydantic import BaseModel

from database import get_db
from models import Transaction, Budget

router = APIRouter()


# Pydantic models
class TransactionCreate(BaseModel):
    date: date
    amount: float
    category: str
    description: Optional[str] = None
    transaction_type: str  # income, expense


class TransactionResponse(BaseModel):
    id: int
    date: date
    amount: float
    category: str
    description: Optional[str]
    transaction_type: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MonthlySummary(BaseModel):
    income: float
    expenses: float
    net: float
    by_category: dict[str, float]


class MonthlyTrend(BaseModel):
    month: str
    income: float
    expenses: float


class BudgetCreate(BaseModel):
    category: str
    monthly_limit: float


class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    monthly_limit: Optional[float] = None


class BudgetResponse(BaseModel):
    id: int
    category: str
    monthly_limit: float
    created_at: datetime

    model_config = {"from_attributes": True}


# Transaction endpoints
@router.post("/transactions", response_model=TransactionResponse, status_code=201)
async def create_transaction(txn: TransactionCreate, db: Session = Depends(get_db)):
    db_txn = Transaction(**txn.model_dump())
    db.add(db_txn)
    db.commit()
    db.refresh(db_txn)
    return db_txn


@router.get("/transactions", response_model=list[TransactionResponse])
async def list_transactions(
    month: Optional[str] = None,  # YYYY-MM
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Transaction)

    if month:
        try:
            year, mon = month.split("-")
            query = query.filter(
                extract("year", Transaction.date) == int(year),
                extract("month", Transaction.date) == int(mon),
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")

    if category:
        query = query.filter(Transaction.category == category)

    return query.order_by(Transaction.date.desc()).all()


@router.delete("/transactions/{txn_id}", status_code=204)
async def delete_transaction(txn_id: int, db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(txn)
    db.commit()


@router.get("/summary", response_model=MonthlySummary)
async def get_summary(
    month: Optional[str] = None,  # YYYY-MM
    db: Session = Depends(get_db),
):
    query = db.query(Transaction)

    if month:
        try:
            year, mon = month.split("-")
            query = query.filter(
                extract("year", Transaction.date) == int(year),
                extract("month", Transaction.date) == int(mon),
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
    else:
        # Default to current month
        today = date.today()
        query = query.filter(
            extract("year", Transaction.date) == today.year,
            extract("month", Transaction.date) == today.month,
        )

    transactions = query.all()

    income = sum(t.amount for t in transactions if t.transaction_type == "income")
    expenses = sum(t.amount for t in transactions if t.transaction_type == "expense")

    by_category: dict[str, float] = {}
    for t in transactions:
        if t.transaction_type == "expense":
            by_category[t.category] = by_category.get(t.category, 0) + t.amount

    return MonthlySummary(
        income=round(income, 2),
        expenses=round(expenses, 2),
        net=round(income - expenses, 2),
        by_category={k: round(v, 2) for k, v in by_category.items()},
    )


@router.get("/trends", response_model=list[MonthlyTrend])
async def get_trends(months: int = 6, db: Session = Depends(get_db)):
    """Get monthly income/expenses over the last N months."""
    today = date.today()

    result = []
    for i in range(months - 1, -1, -1):
        # Calculate target month
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1

        transactions = (
            db.query(Transaction)
            .filter(
                extract("year", Transaction.date) == year,
                extract("month", Transaction.date) == month,
            )
            .all()
        )

        income = sum(t.amount for t in transactions if t.transaction_type == "income")
        expenses = sum(t.amount for t in transactions if t.transaction_type == "expense")

        result.append(
            MonthlyTrend(
                month=f"{year}-{month:02d}",
                income=round(income, 2),
                expenses=round(expenses, 2),
            )
        )

    return result


# Budget endpoints
@router.post("/budgets", response_model=BudgetResponse, status_code=201)
async def create_budget(budget: BudgetCreate, db: Session = Depends(get_db)):
    # Check for duplicate category
    existing = db.query(Budget).filter(Budget.category == budget.category).first()
    if existing:
        raise HTTPException(status_code=400, detail="Budget for this category already exists")

    db_budget = Budget(**budget.model_dump())
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget


@router.get("/budgets", response_model=list[BudgetResponse])
async def list_budgets(db: Session = Depends(get_db)):
    return db.query(Budget).order_by(Budget.category).all()


@router.put("/budgets/{budget_id}", response_model=BudgetResponse)
async def update_budget(budget_id: int, update: BudgetUpdate, db: Session = Depends(get_db)):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(budget, key, value)

    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/budgets/{budget_id}", status_code=204)
async def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()
