"""Health check and system info."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def health():
    return {
        "status": "healthy",
        "app": "theseus",
        "version": "0.1.0",
        "modules": ["tasks", "sleep", "daily"],
    }
