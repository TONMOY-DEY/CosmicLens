"""API endpoints for dedicated Scientific Validation Center and False-Alarm Vetting."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.services.data_service import AstronomicalDataService
from app.services.engine import AnomalyEngine
from app.models.schemas import DISCLAIMER_TEXT

router = APIRouter(prefix="/api/validation", tags=["validation"])
data_service = AstronomicalDataService()
engine = AnomalyEngine()


@router.get("/summary/{region_id}")
def get_validation_summary(region_id: str = "region_001") -> Dict[str, Any]:
    """Retrieve aggregate validation status across all sources in survey region."""
    region = data_service.get_region(region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Region not found.")

    all_source_ids = set()
    for ep in region.get("epochs", []):
        for s in ep.get("sources", []):
            all_source_ids.add(s["id"])

    pass_count = 0
    caution_count = 0
    fail_count = 0
    unknown_count = 0

    evaluated_candidates = []

    for sid in sorted(list(all_source_ids)):
        epochs_data = []
        for ep in region["epochs"]:
            src = next((s for s in ep["sources"] if s["id"] == sid), None)
            if src:
                epochs_data.append({
                    "timestamp": ep["timestamp"],
                    "jd": ep["jd"],
                    "wavelength": ep["wavelength"],
                    "data": src,
                })

        if not epochs_data:
            continue

        analysis = engine.analyze({"id": sid, "epochs": epochs_data}, region)
        checks = analysis.quality_checks

        overall_status = "PASS"
        if any(c.status == "FAIL" for c in checks):
            overall_status = "FAIL"
            fail_count += 1
        elif any(c.status == "CAUTION" for c in checks):
            overall_status = "CAUTION"
            caution_count += 1
        elif any(c.status == "UNKNOWN" for c in checks):
            overall_status = "UNKNOWN"
            unknown_count += 1
        else:
            pass_count += 1

        evaluated_candidates.append({
            "object_id": sid,
            "overall_status": overall_status,
            "usable_epochs": len(epochs_data),
            "interestingness_score": analysis.interestingness_score,
            "confidence_tier": analysis.evidence_confidence.tier,
            "classification": analysis.primary_classification.label,
            "failed_or_caution_checks": [c.name for c in checks if c.status in ["CAUTION", "FAIL"]],
            "vetting_assessment": analysis.false_alarm_investigation.assessment,
        })

    return {
        "region_id": region_id,
        "data_provenance": region.get("data_provenance", "SYNTHETIC_DEMO_DATA"),
        "disclaimer": DISCLAIMER_TEXT,
        "total_sources_evaluated": len(evaluated_candidates),
        "status_distribution": {
            "PASS": pass_count,
            "CAUTION": caution_count,
            "FAIL": fail_count,
            "UNKNOWN": unknown_count,
        },
        "candidates": evaluated_candidates,
    }


@router.get("/detail/{region_id}/{object_id}")
def get_source_validation_detail(region_id: str, object_id: str) -> Dict[str, Any]:
    """Retrieve granular diagnostic validation checklist for a specific source."""
    region = data_service.get_region(region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Region not found.")

    epochs_data = []
    for ep in region["epochs"]:
        src = next((s for s in ep["sources"] if s["id"] == object_id), None)
        if src:
            epochs_data.append({
                "timestamp": ep["timestamp"],
                "jd": ep["jd"],
                "wavelength": ep["wavelength"],
                "data": src,
            })

    if not epochs_data:
        raise HTTPException(status_code=404, detail=f"Source '{object_id}' not found.")

    analysis = engine.analyze({"id": object_id, "epochs": epochs_data}, region)

    # Granular checks
    return {
        "object_id": object_id,
        "region_id": region_id,
        "data_provenance": region.get("data_provenance", "SYNTHETIC_DEMO_DATA"),
        "disclaimer": DISCLAIMER_TEXT,
        "overall_validation_status": "CAUTION" if any(c.status == "CAUTION" for c in analysis.quality_checks) else "FAIL" if any(c.status == "FAIL" for c in analysis.quality_checks) else "PASS",
        "evidence_confidence": analysis.evidence_confidence.model_dump() if hasattr(analysis.evidence_confidence, "model_dump") else analysis.evidence_confidence.dict(),
        "quality_checks": [c.model_dump() if hasattr(c, "model_dump") else c.dict() for c in analysis.quality_checks],
        "false_alarm_investigation": analysis.false_alarm_investigation.model_dump() if hasattr(analysis.false_alarm_investigation, "model_dump") else analysis.false_alarm_investigation.dict(),
        "catalog_cross_check": analysis.known_object_cross_check.model_dump() if hasattr(analysis.known_object_cross_check, "model_dump") else analysis.known_object_cross_check.dict(),
        "scientific_integrity_rule": "Never claim an anomaly is a confirmed astronomical discovery simply because it passed automated quality checks.",
    }
