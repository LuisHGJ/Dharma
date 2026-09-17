import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models import Card
from schemas import CardCreate, CardUpdate, CardMove, CardResponse

router = APIRouter(prefix="/cards", tags=["cards"])

UPLOAD_DIR = "uploads/covers"


@router.get("/", response_model=list[CardResponse])
def list_cards(column_id: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Card)
    if column_id:
        query = query.filter(Card.column_id == column_id)
    return query.order_by(Card.position).all()


@router.post("/", response_model=CardResponse)
def create_card(data: CardCreate, db: Session = Depends(get_db)):
    card = Card(**data.model_dump())
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.patch("/{card_id}", response_model=CardResponse)
def update_card(card_id: str, data: CardUpdate, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(card, key, value)
    db.commit()
    db.refresh(card)
    return card


@router.delete("/{card_id}")
def delete_card(card_id: str, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(card)
    db.commit()
    return {"ok": True}


@router.post("/{card_id}/move", response_model=CardResponse)
def move_card(card_id: str, data: CardMove, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    card.column_id = data.column_id
    card.position = data.position
    db.commit()
    db.refresh(card)
    return card


@router.post("/{card_id}/cover", response_model=CardResponse)
async def upload_cover(card_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    card.cover_url = f"/uploads/covers/{filename}"
    db.commit()
    db.refresh(card)
    return card
