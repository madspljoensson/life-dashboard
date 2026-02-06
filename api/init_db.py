"""Initialize the database tables."""
from database import init_db
# Import all models so they're registered with Base
from models import (
    Task, SleepEntry, MealEntry, HabitEntry, DailyNote,
    InventoryItem, InventoryCategory
)

if __name__ == "__main__":
    init_db()
    print("✅ Database initialized")
