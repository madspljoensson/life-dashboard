"""User settings endpoints."""

from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import UserSettings

router = APIRouter()


class SettingValue(BaseModel):
    value: Optional[str] = None


class SettingResponse(BaseModel):
    key: str
    value: Optional[str]
    updated_at: datetime

    model_config = {"from_attributes": True}


# Default settings
DEFAULT_SETTINGS = {
    "enabled_modules": '["tasks", "habits", "sleep", "journal", "inventory"]',
    "sleep_target_hours": "8",
    "timezone": "UTC"
}


@router.get("/")
async def get_all_settings(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get all settings as a dictionary."""
    settings = db.query(UserSettings).all()
    result = {}

    # Start with defaults
    for key, default_value in DEFAULT_SETTINGS.items():
        result[key] = default_value

    # Override with stored values
    for setting in settings:
        result[setting.key] = setting.value

    return result


@router.put("/")
async def update_settings(
    settings_dict: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Update multiple settings (upserts each key)."""
    for key, value in settings_dict.items():
        # Convert value to string for storage
        str_value = str(value) if value is not None else None

        existing = db.query(UserSettings).filter(UserSettings.key == key).first()
        if existing:
            existing.value = str_value
        else:
            new_setting = UserSettings(key=key, value=str_value)
            db.add(new_setting)

    db.commit()

    # Return all settings
    return await get_all_settings(db)


@router.get("/{key}")
async def get_setting(key: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get a single setting by key."""
    setting = db.query(UserSettings).filter(UserSettings.key == key).first()

    if setting:
        return {"key": setting.key, "value": setting.value}

    # Return default if exists
    if key in DEFAULT_SETTINGS:
        return {"key": key, "value": DEFAULT_SETTINGS[key]}

    raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")


@router.put("/{key}")
async def set_setting(
    key: str,
    setting: SettingValue,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Set a single setting."""
    existing = db.query(UserSettings).filter(UserSettings.key == key).first()

    if existing:
        existing.value = setting.value
    else:
        new_setting = UserSettings(key=key, value=setting.value)
        db.add(new_setting)

    db.commit()

    return {"key": key, "value": setting.value}
