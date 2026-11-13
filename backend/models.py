import uuid
from datetime import datetime
from sqlalchemy import String, Text, Boolean, Integer, DateTime, ForeignKey, LargeBinary
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
    cover_data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    cover_content_type: Mapped[str | None] = mapped_column(String, nullable=True)
    deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    column: Mapped["Column"] = relationship("Column", back_populates="cards")
    checklists: Mapped[list["Checklist"]] = relationship(
        "Checklist",
        back_populates="card",
        cascade="all, delete-orphan",
        order_by="Checklist.position, Checklist.created_at",
    )
    labels: Mapped[list["Label"]] = relationship("Label", back_populates="card", cascade="all, delete-orphan")


class Checklist(Base):
    __tablename__ = "checklists"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    card_id: Mapped[str] = mapped_column(String, ForeignKey("cards.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    card: Mapped["Card"] = relationship("Card", back_populates="checklists")
    items: Mapped[list["ChecklistItem"]] = relationship(
        "ChecklistItem",
        back_populates="checklist",
        cascade="all, delete-orphan",
        order_by="ChecklistItem.position, ChecklistItem.created_at",
    )


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


class Song(Base):
    __tablename__ = "songs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    beat: Mapped[str] = mapped_column(String, nullable=False)
    youtube_url: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class GoalPeriod(Base):
    __tablename__ = "goal_periods"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    start_date: Mapped[str] = mapped_column(String, nullable=False)
    end_date: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    categories: Mapped[list["GoalCategory"]] = relationship("GoalCategory", back_populates="period", cascade="all, delete-orphan")


class GoalCategory(Base):
    __tablename__ = "goal_categories"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    period_id: Mapped[str] = mapped_column(String, ForeignKey("goal_periods.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    color: Mapped[str] = mapped_column(String, nullable=False, default="681314")
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    period: Mapped["GoalPeriod"] = relationship("GoalPeriod", back_populates="categories")
    goals: Mapped[list["Goal"]] = relationship("Goal", back_populates="category", cascade="all, delete-orphan")


class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String, primary_key=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    category_id: Mapped[str] = mapped_column(String, ForeignKey("goal_categories.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    initial_value: Mapped[float] = mapped_column(default=0)
    target_value: Mapped[float] = mapped_column(default=0)
    current_value: Mapped[float] = mapped_column(default=0)
    unit: Mapped[str] = mapped_column(String, nullable=False, default="")
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    category: Mapped["GoalCategory"] = relationship("GoalCategory", back_populates="goals")


class BackupFile(Base):
    """Backups do banco guardados no próprio banco (Neon), sem depender de disco."""

    __tablename__ = "backup_files"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    filename: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    data: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
