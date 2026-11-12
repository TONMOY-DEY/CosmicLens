"""API endpoints for NASA Data Import Center and dataset lifecycle management."""

from pathlib import Path
from typing import Any, Dict, List, Optional
import shutil
import uuid
import json

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.services.data_importer import DatasetImportWorkflow, DATA_UPLOAD_DIR
from app.services.fits_reader import FITSInspectionService, ASTROPY_AVAILABLE
from app.services.data_service import AstronomicalDataService
from app.database.db import get_db_connection
from app.models.schemas import DISCLAIMER_TEXT

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


@router.get("")
def list_all_datasets() -> Dict[str, Any]:
    """List all registered datasets including database and active survey fields."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM datasets ORDER BY created_at DESC")
    rows = cursor.fetchall()

    db_datasets = []
    for r in rows:
        db_datasets.append({
            "id": r["id"],
            "name": r["name"],
            "data_provenance": r["data_provenance"],
            "disclaimer": r["disclaimer"],
            "format": r["format"],
            "file_size_bytes": r["file_size_bytes"],
            "ra_center": r["ra_center"],
            "dec_center": r["dec_center"],
            "fov_arcmin": r["fov_arcmin"],
            "telescope": r["telescope"],
            "instrument": r["instrument"],
            "date_obs": r["date_obs"],
            "epoch_count": r["epoch_count"],
            "source_count": r["source_count"],
            "dimensions_status": json.loads(r["dimensions_status_json"]) if r["dimensions_status_json"] else {},
            "created_at": r["created_at"],
        })
    conn.close()

    return {
        "status": "success",
        "total_datasets": len(db_datasets),
        "datasets": db_datasets,
    }


@router.post("/upload")
async def upload_dataset_file(
    file: UploadFile = File(...),
    dataset_name: Optional[str] = Form(None),
    provenance: str = Form("REAL_ARCHIVE_DATA"),
) -> Dict[str, Any]:
    """Execute the full 8-step import workflow on uploaded FITS, CSV, ECSV, or JSON file."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename in upload.")

    dest_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    dest_path = DATA_UPLOAD_DIR / dest_filename

    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write file to disk: {str(e)}")

    name = dataset_name or Path(file.filename).stem
    result = DatasetImportWorkflow.process_file_import(
        file_path=dest_path,
        dataset_name=name,
        override_provenance=provenance,
    )

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Import workflow failed."))

    return result


@router.post("/inspect")
async def inspect_dataset_file_preview(
    file: UploadFile = File(...),
) -> Dict[str, Any]:
    """Step 1-6 preview without persisting to database."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename.")

    dest_filename = f"temp_{uuid.uuid4().hex[:8]}_{file.filename}"
    dest_path = DATA_UPLOAD_DIR / dest_filename

    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    suffix = Path(file.filename).suffix.lower()

    if suffix in [".fits", ".fit", ".fts"]:
        info = FITSInspectionService.inspect_fits_file(dest_path)
        dest_path.unlink(missing_ok=True)
        return {"format": "FITS", "inspection": info}
    else:
        dest_path.unlink(missing_ok=True)
        return {
            "format": suffix.replace(".", "").upper(),
            "message": "Preview available for FITS, CSV, ECSV, JSON.",
        }


@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: str) -> Dict[str, Any]:
    """Delete an imported dataset from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT file_path FROM datasets WHERE id = ?", (dataset_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Dataset not found.")

    file_path = row["file_path"]
    if file_path:
        Path(file_path).unlink(missing_ok=True)

    cursor.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))
    conn.commit()
    conn.close()

    return {"status": "success", "message": f"Dataset '{dataset_id}' deleted."}


@router.get("/{dataset_id}/header")
def get_dataset_header(dataset_id: str) -> Dict[str, Any]:
    """Retrieve raw FITS header cards if dataset was uploaded from FITS."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    file_path = row["file_path"]
    if not file_path or not Path(file_path).exists():
        raise HTTPException(status_code=404, detail="Original FITS file not found on disk.")

    info = FITSInspectionService.inspect_fits_file(file_path)
    return {
        "dataset_id": dataset_id,
        "format": row["format"],
        "header_cards": info.get("primary_header_cards", []),
        "extensions": info.get("extensions", []),
    }
