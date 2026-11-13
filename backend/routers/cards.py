import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from database import get_db
from models import Card
from schemas import CardCreate, CardUpdate, CardMove, CardResponse

router = APIRouter(prefix="/cards", tags=["cards"])

MAX_COVER_BYTES = 5 * 1024 * 1024  # 5 MB


def _delete_legacy_cover_file(url: str | None):
    """Remove capa antiga salva em disco (versões anteriores usavam uploads/)."""
    if url and url.startswith("/uploads/"):
        filepath = url.lstrip("/")
        if os.path.isfile(filepath):
            try:
                os.remove(filepath)
            except OSError:
                pass


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
    changes = data.model_dump(exclude_unset=True)
    old_cover_url = card.cover_url
    for key, value in changes.items():
        setattr(card, key, value)
    if "cover_url" in changes and not card.cover_url:
        # remoção de capa: limpa os bytes e o arquivo antigo, se houver
        _delete_legacy_cover_file(old_cover_url)
        card.cover_url = None
        card.cover_data = None
        card.cover_content_type = None
    db.commit()
    db.refresh(card)
    return card


@router.delete("/{card_id}")
def delete_card(card_id: str, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    _delete_legacy_cover_file(card.cover_url)
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
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo deve ser uma imagem")
    content = await file.read()
    if len(content) > MAX_COVER_BYTES:
        raise HTTPException(status_code=413, detail="Imagem muito grande (máximo 5 MB)")
    _delete_legacy_cover_file(card.cover_url)
    card.cover_data = content
    card.cover_content_type = file.content_type
    card.cover_url = f"/cards/{card_id}/cover"
    db.commit()
    db.refresh(card)
    return card


@router.get("/{card_id}/cover")
def get_cover(card_id: str, db: Session = Depends(get_db)):
    """Serve a capa guardada no banco (Neon)."""
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    if card.cover_data:
        return Response(
            content=card.cover_data,
            media_type=card.cover_content_type or "image/png",
        )
    # compatibilidade com capas antigas salvas em disco
    if card.cover_url and card.cover_url.startswith("/uploads/"):
        filepath = card.cover_url.lstrip("/")
        if os.path.isfile(filepath):
            return FileResponse(filepath)
    raise HTTPException(status_code=404, detail="Capa não encontrada")
