from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Column
from schemas import ColumnCreate, ColumnUpdate, ColumnResponse, ReorderRequest

router = APIRouter(prefix="/columns", tags=["columns"])


@router.get("/", response_model=list[ColumnResponse])
def list_columns(db: Session = Depends(get_db)):
    columns = db.query(Column).order_by(Column.position).all()
    return columns


@router.post("/", response_model=ColumnResponse)
def create_column(data: ColumnCreate, db: Session = Depends(get_db)):
    column = Column(**data.model_dump())
    db.add(column)
    db.commit()
    db.refresh(column)
    return column


@router.patch("/{column_id}", response_model=ColumnResponse)
def update_column(column_id: str, data: ColumnUpdate, db: Session = Depends(get_db)):
    column = db.query(Column).filter(Column.id == column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(column, key, value)
    db.commit()
    db.refresh(column)
    return column


@router.delete("/{column_id}")
def delete_column(column_id: str, db: Session = Depends(get_db)):
    column = db.query(Column).filter(Column.id == column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    db.delete(column)
    db.commit()
    return {"ok": True}


@router.post("/reorder")
def reorder_columns(data: ReorderRequest, db: Session = Depends(get_db)):
    for index, col_id in enumerate(data.ordered_ids):
        column = db.query(Column).filter(Column.id == col_id).first()
        if column:
            column.position = index
    db.commit()
    return {"ok": True}
