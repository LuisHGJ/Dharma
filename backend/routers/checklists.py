from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Checklist, ChecklistItem
from schemas import (
    ChecklistCreate, ChecklistUpdate, ChecklistResponse,
    ChecklistItemCreate, ChecklistItemUpdate, ChecklistItemResponse,
    ReorderRequest,
)

router = APIRouter(tags=["checklists"])


@router.get("/cards/{card_id}/checklists", response_model=list[ChecklistResponse])
def list_checklists(card_id: str, db: Session = Depends(get_db)):
    return db.query(Checklist).filter(Checklist.card_id == card_id).order_by(Checklist.position).all()


@router.post("/cards/{card_id}/checklists", response_model=ChecklistResponse)
def create_checklist(card_id: str, data: ChecklistCreate, db: Session = Depends(get_db)):
    checklist = Checklist(card_id=card_id, **data.model_dump())
    db.add(checklist)
    db.commit()
    db.refresh(checklist)
    return checklist


@router.patch("/checklists/{checklist_id}", response_model=ChecklistResponse)
def update_checklist(checklist_id: str, data: ChecklistUpdate, db: Session = Depends(get_db)):
    checklist = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(checklist, key, value)
    db.commit()
    db.refresh(checklist)
    return checklist


@router.delete("/checklists/{checklist_id}")
def delete_checklist(checklist_id: str, db: Session = Depends(get_db)):
    checklist = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    db.delete(checklist)
    db.commit()
    return {"ok": True}


@router.post("/checklists/{checklist_id}/items", response_model=ChecklistItemResponse)
def create_checklist_item(checklist_id: str, data: ChecklistItemCreate, db: Session = Depends(get_db)):
    item = ChecklistItem(checklist_id=checklist_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/checklist-items/{item_id}", response_model=ChecklistItemResponse)
def update_checklist_item(item_id: str, data: ChecklistItemUpdate, db: Session = Depends(get_db)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/checklist-items/{item_id}")
def delete_checklist_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}


@router.post("/checklists/reorder")
def reorder_checklists(data: ReorderRequest, db: Session = Depends(get_db)):
    for index, cl_id in enumerate(data.ordered_ids):
        checklist = db.query(Checklist).filter(Checklist.id == cl_id).first()
        if checklist:
            checklist.position = index
    db.commit()
    return {"ok": True}


@router.post("/checklist-items/reorder")
def reorder_checklist_items(data: ReorderRequest, db: Session = Depends(get_db)):
    for index, item_id in enumerate(data.ordered_ids):
        item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()
        if item:
            item.position = index
    db.commit()
    return {"ok": True}
