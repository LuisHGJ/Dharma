import os
import subprocess
from datetime import datetime
from urllib.parse import urlparse, parse_qs, unquote
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from database import get_db
from models import BackupFile

router = APIRouter(prefix="/backup", tags=["backup"])

MAX_BACKUPS = 10  # mantém apenas os N backups mais recentes no banco


def _pg_connection():
    """Extrai host, porta, usuário, senha e sslmode do DATABASE_URL."""
    url = os.getenv("DATABASE_URL", "postgresql://dharma:dharma@localhost:5433/dharma")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    return {
        "host": parsed.hostname or "localhost",
        "port": str(parsed.port or 5432),
        "user": unquote(parsed.username or "dharma"),
        "password": unquote(parsed.password or ""),
        "dbname": (parsed.path or "/dharma").lstrip("/") or "dharma",
        "sslmode": query.get("sslmode", [None])[0],
    }


@router.post("/")
def create_backup(db: Session = Depends(get_db)):
    """Gera o dump com pg_dump e guarda o arquivo no próprio banco."""
    pg = _pg_connection()
    env = {**os.environ, "PGPASSWORD": pg["password"]}
    if pg["sslmode"]:
        env["PGSSLMODE"] = pg["sslmode"]

    result = subprocess.run(
        [
            "pg_dump",
            "-h", pg["host"],
            "-p", pg["port"],
            "-U", pg["user"],
            "-d", pg["dbname"],
            # não inclui os dados dos backups, senão cada dump carregaria os anteriores
            "--exclude-table-data=backup_files",
            "-f", "-",
        ],
        env=env,
        capture_output=True,
    )

    if result.returncode != 0:
        stderr = result.stderr.decode("utf-8", errors="replace")
        raise HTTPException(status_code=500, detail=f"Erro ao criar backup: {stderr}")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"dharma_{timestamp}.sql"
    db.add(BackupFile(filename=filename, data=result.stdout))

    # mantém apenas os MAX_BACKUPS mais recentes
    outdated = (
        db.query(BackupFile)
        .order_by(BackupFile.created_at.desc())
        .offset(MAX_BACKUPS)
        .all()
    )
    for backup_file in outdated:
        db.delete(backup_file)

    db.commit()
    return {"ok": True, "filename": filename}


@router.get("/")
def list_backups(db: Session = Depends(get_db)):
    rows = db.query(BackupFile).order_by(BackupFile.created_at.desc()).all()
    return [row.filename for row in rows]


@router.get("/download/{filename}")
def download_backup(filename: str, db: Session = Depends(get_db)):
    row = db.query(BackupFile).filter(BackupFile.filename == filename).first()
    if not row:
        raise HTTPException(status_code=404, detail="Backup não encontrado")
    return Response(
        content=row.data,
        media_type="application/sql",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
