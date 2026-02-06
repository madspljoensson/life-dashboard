"""Theseus API — Personal Life Dashboard"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import tasks, sleep, daily, health, inventory, habits, settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    yield


app = FastAPI(
    title="Theseus API",
    description="Personal life dashboard backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4810"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(sleep.router, prefix="/api/sleep", tags=["sleep"])
app.include_router(daily.router, prefix="/api/daily", tags=["daily"])
app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["inventory"])
app.include_router(habits.router, prefix="/api/habits", tags=["habits"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])


@app.get("/api/ping")
async def ping():
    return {"status": "ok", "app": "theseus", "version": "0.1.0"}
