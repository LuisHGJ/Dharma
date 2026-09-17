from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Label
from schemas import LabelCreate, LabelUpdate, LabelResponse

router = APIRouter(tags=["labels"])


@router.get("/cards/{card_id}/labels", response_model=list[LabelResponse])
def list_labels(card_id: str, db: Session = Depends(get_db)):
    return db.query(Label).filter(Label.card_id == card_id).all()


@router.post("/cards/{card_id}/labels", response_model=LabelResponse)
def create_label(card_id: str, data: LabelCreate, db: Session = Depends(get_db)):
    label = Label(card_id=card_id, **data.model_dump())
    db.add(label)
    db.commit()
    db.refresh(label)
    return label


@router.patch("/labels/{label_id}", response_model=LabelResponse)
def update_label(label_id: str, data: LabelUpdate, db: Session = Depends(get_db)):
    label = db.query(Label).filter(Label.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(label, key, value)
    db.commit()
    db.refresh(label)
    return label


@router.delete("/labels/{label_id}")
def delete_label(label_id: str, db: Session = Depends(get_db)):
    label = db.query(Label).filter(Label.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    db.delete(label)
    db.commit()
    return {"ok": True}
