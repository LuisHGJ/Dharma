import uuid
from datetime import datetime
from sqlalchemy import String, Text, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Column(Base):
    __tablename__ = "columns"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    cards: Mapped[list["Card"]] = relationship("Card", back_populates="column", cascade="all, delete-orphan")


class Card(Base):
    __tablename__ = "cards"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    column_id: Mapped[str] = mapped_column(String, ForeignKey("columns.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    cover_url: Mapped[str | None] = mapped_column(String, nullable=True)
    deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    column: Mapped["Column"] = relationship("Column", back_populates="cards")
    checklists: Mapped[list["Checklist"]] = relationship("Checklist", back_populates="card", cascade="all, delete-orphan")
    labels: Mapped[list["Label"]] = relationship("Label", back_populates="card", cascade="all, delete-orphan")


class Checklist(Base):
    __tablename__ = "checklists"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    card_id: Mapped[str] = mapped_column(String, ForeignKey("cards.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    card: Mapped["Card"] = relationship("Card", back_populates="checklists")
    items: Mapped[list["ChecklistItem"]] = relationship("ChecklistItem", back_populates="checklist", cascade="all, delete-orphan")


class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    checklist_id: Mapped[str] = mapped_column(String, ForeignKey("checklists.id"), nullable=False)
    text: Mapped[str] = mapped_column(String, nullable=False)
    is_checked: Mapped[bool] = mapped_column(Boolean, default=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    checklist: Mapped["Checklist"] = relationship("Checklist", back_populates="items")


class Label(Base):
    __tablename__ = "labels"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    card_id: Mapped[str] = mapped_column(String, ForeignKey("cards.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    color: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    card: Mapped["Card"] = relationship("Card", back_populates="labels")
