from datetime import datetime
from pydantic import BaseModel


# Column
class ColumnCreate(BaseModel):
    name: str
    position: int = 0


class ColumnUpdate(BaseModel):
    name: str | None = None
    position: int | None = None


class ColumnResponse(BaseModel):
    id: str
    name: str
    position: int
    created_at: datetime

    model_config = {"from_attributes": True}


# Checklist Item
class ChecklistItemCreate(BaseModel):
    text: str
    position: int = 0


class ChecklistItemUpdate(BaseModel):
    text: str | None = None
    is_checked: bool | None = None
    position: int | None = None


class ChecklistItemResponse(BaseModel):
    id: str
    checklist_id: str
    text: str
    is_checked: bool
    position: int
    created_at: datetime

    model_config = {"from_attributes": True}


# Checklist
class ChecklistCreate(BaseModel):
    name: str
    position: int = 0


class ChecklistUpdate(BaseModel):
    name: str | None = None
    position: int | None = None


class ChecklistResponse(BaseModel):
    id: str
    card_id: str
    name: str
    position: int
    created_at: datetime
    items: list[ChecklistItemResponse] = []

    model_config = {"from_attributes": True}


# Card
class CardCreate(BaseModel):
    column_id: str
    title: str
    description: str | None = None
    deadline: datetime | None = None
    position: int = 0


class CardUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    deadline: datetime | None = None
    cover_url: str | None = None
    position: int | None = None


class CardMove(BaseModel):
    column_id: str
    position: int


# Label
class LabelCreate(BaseModel):
    name: str
    color: str


class LabelUpdate(BaseModel):
    name: str | None = None
    color: str | None = None


class LabelResponse(BaseModel):
    id: str
    card_id: str
    name: str
    color: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CardResponse(BaseModel):
    id: str
    column_id: str
    title: str
    cover_url: str | None = None
    deadline: datetime | None = None
    description: str | None = None
    position: int
    created_at: datetime
    updated_at: datetime
    checklists: list[ChecklistResponse] = []
    labels: list[LabelResponse] = []

    model_config = {"from_attributes": True}


# Setting
class SettingUpdate(BaseModel):
    value: str


class SettingResponse(BaseModel):
    key: str
    value: str
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


# Reorder
class ReorderRequest(BaseModel):
    ordered_ids: list[str]


# Song
class SongCreate(BaseModel):
    name: str
    beat: str
    youtube_url: str


class SongUpdate(BaseModel):
    name: str | None = None
    beat: str | None = None
    youtube_url: str | None = None


class SongResponse(BaseModel):
    id: str
    name: str
    beat: str
    youtube_url: str
    created_at: datetime

    model_config = {"from_attributes": True}


# Goal
class GoalCreate(BaseModel):
    name: str
    initial_value: float = 0
    target_value: float = 0
    current_value: float = 0
    unit: str = ""
    position: int = 0


class GoalUpdate(BaseModel):
    name: str | None = None
    initial_value: float | None = None
    target_value: float | None = None
    current_value: float | None = None
    unit: str | None = None
    position: int | None = None


class GoalResponse(BaseModel):
    id: str
    category_id: str
    name: str
    initial_value: float
    target_value: float
    current_value: float
    unit: str
    position: int
    created_at: datetime

    model_config = {"from_attributes": True}


# Goal Category
class GoalCategoryCreate(BaseModel):
    name: str
    color: str = "681314"
    position: int = 0


class GoalCategoryUpdate(BaseModel):
    name: str | None = None
    color: str | None = None
    position: int | None = None


class GoalCategoryResponse(BaseModel):
    id: str
    period_id: str
    name: str
    color: str
    position: int
    created_at: datetime
    goals: list[GoalResponse] = []

    model_config = {"from_attributes": True}


# Goal Period
class GoalPeriodCreate(BaseModel):
    name: str
    start_date: str
    end_date: str


class GoalPeriodUpdate(BaseModel):
    name: str | None = None
    start_date: str | None = None
    end_date: str | None = None


class GoalPeriodResponse(BaseModel):
    id: str
    name: str
    start_date: str
    end_date: str
    created_at: datetime
    categories: list[GoalCategoryResponse] = []

    model_config = {"from_attributes": True}
