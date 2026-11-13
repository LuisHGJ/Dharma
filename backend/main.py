import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from database import engine, Base, SessionLocal
from models import Column
from routers import columns, cards, checklists, backup, labels, songs, goals, settings

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


def run_migrations():
    """Adiciona colunas novas em bancos já existentes (create_all não altera tabelas criadas)."""
    statements = [
        "ALTER TABLE cards ADD COLUMN IF NOT EXISTS cover_data BYTEA",
        "ALTER TABLE cards ADD COLUMN IF NOT EXISTS cover_content_type VARCHAR",
    ]
    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_migrations()
    create_default_columns()
    yield


app = FastAPI(title="Dharma API", lifespan=lifespan)

# Origens liberadas no CORS, separadas por vírgula (ex.: "https://dharma.vercel.app,http://localhost:3003")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3003").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
app.include_router(songs.router)
app.include_router(goals.router)
app.include_router(settings.router)


@app.get("/")
def root():
    return {"message": "Dharma API"}


@app.get("/health")
def health():
    return {"status": "ok"}
