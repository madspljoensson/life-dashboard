"""SQLAlchemy models for Theseus."""

from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Text, Enum
from database import Base
import enum


class TaskStatus(str, enum.Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"


class TaskPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default=TaskStatus.todo.value)
    priority = Column(String(20), default=TaskPriority.medium.value)
    due_date = Column(Date, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    recurring = Column(Boolean, default=False)
    recurring_pattern = Column(String(50), nullable=True)  # daily, weekly, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SleepEntry(Base):
    __tablename__ = "sleep_entries"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, unique=True, index=True)
    bedtime = Column(DateTime, nullable=True)
    wake_time = Column(DateTime, nullable=True)
    duration_hours = Column(Float, nullable=True)
    quality = Column(Integer, nullable=True)  # 1-5
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MealEntry(Base):
    __tablename__ = "meal_entries"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    meal_type = Column(String(20), nullable=False)  # breakfast, lunch, dinner, snack
    description = Column(Text, nullable=False)
    calories = Column(Integer, nullable=True)
    protein_g = Column(Float, nullable=True)
    carbs_g = Column(Float, nullable=True)
    fat_g = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class HabitEntry(Base):
    __tablename__ = "habit_entries"

    id = Column(Integer, primary_key=True, index=True)
    habit_name = Column(String(200), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    completed = Column(Boolean, default=False)
    value = Column(Float, nullable=True)  # For quantifiable habits (glasses of water, etc.)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class DailyNote(Base):
    __tablename__ = "daily_notes"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, unique=True, index=True)
    mood = Column(Integer, nullable=True)  # 1-5
    energy = Column(Integer, nullable=True)  # 1-5
    note = Column(Text, nullable=True)
    highlights = Column(Text, nullable=True)  # Comma-separated or JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(500), nullable=False)
    category = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False)  # "owned", "wishlist", "ai_suggested"
    priority = Column(String(20), nullable=True)  # low, medium, high (for wishlist/suggested)
    price = Column(Float, nullable=True)
    currency = Column(String(10), default="DKK")
    purchase_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    ai_reason = Column(Text, nullable=True)  # why AI suggested it
    tags = Column(Text, nullable=True)  # comma-separated tags
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InventoryCategory(Base):
    __tablename__ = "inventory_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    color = Column(String(7), nullable=True)  # hex color
    created_at = Column(DateTime, default=datetime.utcnow)


class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=True)  # health, mind, productivity, other
    icon = Column(String(50), nullable=True)
    target_frequency = Column(String(20), nullable=True)  # daily, weekly
    created_at = Column(DateTime, default=datetime.utcnow)
    active = Column(Boolean, default=True)


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    completed = Column(Boolean, default=False)
    value = Column(Float, nullable=True)  # optional quantifiable value
    created_at = Column(DateTime, default=datetime.utcnow)


class SleepSettings(Base):
    __tablename__ = "sleep_settings"

    id = Column(Integer, primary_key=True, index=True)
    target_hours = Column(Float, default=8.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
