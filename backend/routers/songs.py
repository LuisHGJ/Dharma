from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Song
from schemas import SongCreate, SongUpdate, SongResponse

router = APIRouter(prefix="/songs", tags=["songs"])


@router.get("/", response_model=list[SongResponse])
def list_songs(db: Session = Depends(get_db)):
    songs = db.query(Song).order_by(Song.name).all()
    return songs


@router.post("/", response_model=SongResponse)
def create_song(data: SongCreate, db: Session = Depends(get_db)):
    song = Song(**data.model_dump())
    db.add(song)
    db.commit()
    db.refresh(song)
    return song


@router.patch("/{song_id}", response_model=SongResponse)
def update_song(song_id: str, data: SongUpdate, db: Session = Depends(get_db)):
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(song, key, value)
    db.commit()
    db.refresh(song)
    return song


@router.delete("/{song_id}")
def delete_song(song_id: str, db: Session = Depends(get_db)):
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    db.delete(song)
    db.commit()
    return {"ok": True}
