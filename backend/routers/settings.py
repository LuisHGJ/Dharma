from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Setting
from schemas import SettingUpdate, SettingResponse

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/{key}", response_model=SettingResponse)
def get_setting(key: str, db: Session = Depends(get_db)):
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        return SettingResponse(key=key, value="", updated_at=None)
    return setting


@router.put("/{key}", response_model=SettingResponse)
def update_setting(key: str, data: SettingUpdate, db: Session = Depends(get_db)):
    setting = db.query(Setting).filter(Setting.key == key).first()
    if setting:
        setting.value = data.value
    else:
        setting = Setting(key=key, value=data.value)
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting
