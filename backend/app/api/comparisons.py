"""API endpoints for Multi-Epoch Astronomical Change Analysis and Comparison."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.services.epoch_comparator import EpochComparator
from app.services.data_service import AstronomicalDataService
from app.models.schemas import DISCLAIMER_TEXT

router = APIRouter(prefix="/api/comparisons", tags=["comparisons"])
data_service = AstronomicalDataService()


@router.get("/compare")
def compare_source_epochs(
    region_id: str = Query("region_001", description="Survey region ID"),
    source_id: str = Query("DEMO-001", description="Candidate source ID"),
    epoch_a_idx: int = Query(0, description="Baseline epoch index (0-based)"),
    epoch_b_idx: int = Query(3, description="Comparison epoch index (0-based)"),
) -> Dict[str, Any]:
    """Execute scientific multi-epoch differential comparison between two observation epochs."""
    region = data_service.get_region(region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Survey region not found.")

    epochs = region.get("epochs", [])
    if epoch_a_idx >= len(epochs) or epoch_b_idx >= len(epochs):
        raise HTTPException(
            status_code=400,
            detail=f"Epoch indices ({epoch_a_idx}, {epoch_b_idx}) out of range (total epochs: {len(epochs)}).",
        )

    epoch_a = epochs[epoch_a_idx]
    epoch_b = epochs[epoch_b_idx]

    comparison_result = EpochComparator.compare_epochs_for_source(source_id, epoch_a, epoch_b)

    # Compile lightcurve across all available epochs for this source
    all_epochs_lightcurve = []
    for i, ep in enumerate(epochs):
        s = next((src for src in ep["sources"] if src["id"] == source_id), None)
        if s:
            all_epochs_lightcurve.append({
                "epoch_index": i,
                "epoch_id": ep.get("epoch_id", f"epoch_{i+1:03d}"),
                "timestamp": ep["timestamp"],
                "jd": ep["jd"],
                "wavelength_um": ep["wavelength"],
                "flux_ujy": s["flux"],
                "flux_err_ujy": s["flux_err"],
                "ra": s["ra"],
                "dec": s["dec"],
                "flag": s.get("flag", "good"),
            })

    return {
        "status": "success",
        "region_id": region_id,
        "region_name": region.get("name"),
        "source_id": source_id,
        "data_provenance": region.get("data_provenance", "SYNTHETIC_DEMO_DATA"),
        "disclaimer": DISCLAIMER_TEXT,
        "epoch_a_index": epoch_a_idx,
        "epoch_b_index": epoch_b_idx,
        "total_available_epochs": len(epochs),
        "lightcurve": all_epochs_lightcurve,
        "comparison": comparison_result,
    }


@router.get("/multi-object")
def compare_multiple_objects(
    region_id: str = Query("region_001"),
    source_ids: str = Query("DEMO-001,DEMO-002", description="Comma-separated source IDs"),
) -> Dict[str, Any]:
    """Retrieve side-by-side comparative metrics for multiple astronomical objects."""
    region = data_service.get_region(region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Region not found.")

    sids = [s.strip() for s in source_ids.split(",") if s.strip()]
    epochs = region.get("epochs", [])

    results = []
    for sid in sids:
        if len(epochs) >= 2:
            res = EpochComparator.compare_epochs_for_source(sid, epochs[0], epochs[-1])
            results.append(res)

    return {
        "region_id": region_id,
        "compared_sources": results,
    }
