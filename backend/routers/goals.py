from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import GoalPeriod, GoalCategory, Goal
from schemas import (
    GoalPeriodCreate, GoalPeriodUpdate, GoalPeriodResponse,
    GoalCategoryCreate, GoalCategoryUpdate, GoalCategoryResponse,
    GoalCreate, GoalUpdate, GoalResponse,
)

router = APIRouter(prefix="/goals", tags=["goals"])


# --- Periods ---
@router.get("/periods", response_model=list[GoalPeriodResponse])
def list_periods(db: Session = Depends(get_db)):
    return db.query(GoalPeriod).order_by(GoalPeriod.created_at.desc()).all()


@router.post("/periods", response_model=GoalPeriodResponse)
def create_period(data: GoalPeriodCreate, db: Session = Depends(get_db)):
    period = GoalPeriod(**data.model_dump())
    db.add(period)
    db.commit()
    db.refresh(period)
    return period


@router.patch("/periods/{period_id}", response_model=GoalPeriodResponse)
def update_period(period_id: str, data: GoalPeriodUpdate, db: Session = Depends(get_db)):
    period = db.query(GoalPeriod).filter(GoalPeriod.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(period, key, value)
    db.commit()
    db.refresh(period)
    return period


@router.delete("/periods/{period_id}")
def delete_period(period_id: str, db: Session = Depends(get_db)):
    period = db.query(GoalPeriod).filter(GoalPeriod.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    db.delete(period)
    db.commit()
    return {"ok": True}


# --- Categories ---
@router.post("/periods/{period_id}/categories", response_model=GoalCategoryResponse)
def create_category(period_id: str, data: GoalCategoryCreate, db: Session = Depends(get_db)):
    period = db.query(GoalPeriod).filter(GoalPeriod.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    category = GoalCategory(period_id=period_id, **data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/categories/{category_id}", response_model=GoalCategoryResponse)
def update_category(category_id: str, data: GoalCategoryUpdate, db: Session = Depends(get_db)):
    category = db.query(GoalCategory).filter(GoalCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}")
def delete_category(category_id: str, db: Session = Depends(get_db)):
    category = db.query(GoalCategory).filter(GoalCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
    return {"ok": True}


# --- Goals ---
@router.post("/categories/{category_id}/goals", response_model=GoalResponse)
def create_goal(category_id: str, data: GoalCreate, db: Session = Depends(get_db)):
    category = db.query(GoalCategory).filter(GoalCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    goal = Goal(category_id=category_id, **data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.patch("/goals/{goal_id}", response_model=GoalResponse)
def update_goal(goal_id: str, data: GoalUpdate, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(goal, key, value)
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: str, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"ok": True}
