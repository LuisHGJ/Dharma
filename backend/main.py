import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base, SessionLocal
from models import Column
from routers import columns, cards, checklists, backup, labels

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def create_default_columns():
    db = SessionLocal()
    try:
        if db.query(Column).count() == 0:
            defaults = ["Backlog", "A Fazer", "Fazendo", "Feito"]
            for i, name in enumerate(defaults):
                db.add(Column(name=name, position=i))
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    create_default_columns()
    yield


app = FastAPI(title="Dharma API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(columns.router)
app.include_router(cards.router)
app.include_router(checklists.router)
app.include_router(backup.router)
app.include_router(labels.router)


@app.get("/")
def root():
    return {"message": "Dharma API"}


@app.get("/health")
def health():
    return {"status": "ok"}
