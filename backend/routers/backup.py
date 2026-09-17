import os
import subprocess
from datetime import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/backup", tags=["backup"])

BACKUP_DIR = "/backups"


@router.post("/")
def create_backup():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"dharma_{timestamp}.sql"
    filepath = os.path.join(BACKUP_DIR, filename)

    result = subprocess.run(
        [
            "pg_dump",
            "-h", "postgres",
            "-U", "dharma",
            "-d", "dharma",
            "-f", filepath,
        ],
        env={**os.environ, "PGPASSWORD": "dharma"},
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise HTTPException(status_code=500, detail=f"Erro ao criar backup: {result.stderr}")

    return {"ok": True, "filename": filename}


@router.get("/download/{filename}")
def download_backup(filename: str):
    filepath = os.path.join(BACKUP_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Backup não encontrado")
    return FileResponse(filepath, filename=filename, media_type="application/sql")


@router.get("/")
def list_backups():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    files = [f for f in os.listdir(BACKUP_DIR) if f.endswith(".sql")]
    files.sort(reverse=True)
    return files
