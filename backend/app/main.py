"""Main FastAPI application entry point for SKYTRACE AI / CosmicLens.

Fully compliant with Section 8 of the project specification.
"""

from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import numpy as np

from app.models.schemas import (
    ALGORITHM_VERSION,
    DISCLAIMER_TEXT,
    AnalysisResult,
    AnomalyInjectionRequest,
    DiscoverySummary,
    ScientificDiscoveryPassport,
    WeightsUpdateRequest,
)
from app.detectors.base import DetectorRegistry
from app.services.engine import AnomalyEngine
from app.services.passport_service import PassportService
from app.services.data_service import AstronomicalDataService
from app.services.report_service import ReportService

app = FastAPI(
    title="SKYTRACE AI / CosmicLens API",
    description="An Explainable AI Scientific Discovery Engine for the Changing Infrared Sky (NASA SPHEREx Mission).",
    version=ALGORITHM_VERSION,
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize core services
data_service = AstronomicalDataService()
engine = AnomalyEngine()
detector_registry = DetectorRegistry.get_instance()


@app.get("/api/health")
def health() -> Dict[str, Any]:
    """Health check endpoint, active data mode, and scientific disclaimer."""
    active_detectors = detector_registry.get_active_detectors()
    return {
        "status": "healthy",
        "service": "SKYTRACE-AI-Backend",
        "version": ALGORITHM_VERSION,
        "data_provenance": "SYNTHETIC_DEMO_DATA",
        "disclaimer": DISCLAIMER_TEXT,
        "active_detectors_count": len(active_detectors),
        "available_surveys_count": len(data_service.get_all_regions()),
    }


# ==========================================
# REGIONS, EPOCHS, AND SOURCES ENDPOINTS
# ==========================================

@app.get("/api/regions")
def list_regions() -> Dict[str, Any]:
    """List available multi-epoch survey fields with provenance."""
    return {
        "data_provenance": "SYNTHETIC_DEMO_DATA",
        "disclaimer": DISCLAIMER_TEXT,
        "regions": data_service.get_all_regions(),
    }


@app.get("/api/region/{region_id}")
def get_region(region_id: str) -> Dict[str, Any]:
    """Retrieve full multi-epoch astronomical dataset for a specific field."""
    region = data_service.get_region(region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Survey region not found.")
    return region


@app.get("/api/region/{region_id}/epochs")
def get_region_epochs(region_id: str) -> Dict[str, Any]:
    """List observation epochs for a survey region."""
    region = data_service.get_region(region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Survey region not found.")
    return {
        "region_id": region_id,
        "data_provenance": region.get("data_provenance", "SYNTHETIC_DEMO_DATA"),
        "disclaimer": DISCLAIMER_TEXT,
        "epoch_count": len(region["epochs"]),
        "epochs": [
            {
                "epoch_id": ep.get("epoch_id", f"epoch_{i+1:03d}"),
                "timestamp": ep["timestamp"],
                "jd": ep["jd"],
                "wavelength_um": ep["wavelength"],
                "source_count": len(ep["sources"]),
                "background_median_uJy": ep.get("background_median", 15.0),
                "background_rms_uJy": ep.get("background_rms", 1.2),
            }
            for i, ep in enumerate(region["epochs"])
        ],
    }


@app.get("/api/region/{region_id}/sources")
def list_region_sources(
    region_id: str,
    page: int = 1,
    limit: int = 20,
    type_filter: Optional[str] = None,
) -> Dict[str, Any]:
    """List and paginate unique sources detected in a region."""
    region = data_service.get_region(region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Survey region not found.")

    sources_map: Dict[str, Any] = {}
    for ep in region["epochs"]:
        for src in ep["sources"]:
            sid = src["id"]
            if sid not in sources_map:
                sources_map[sid] = {
                    "source_id": sid,
                    "ra_deg": src["ra"],
                    "dec_deg": src["dec"],
                    "type": src.get("type", "unknown"),
                    "epoch_count": 0,
                    "mean_flux_uJy": 0.0,
                    "fluxes": [],
                }
            sources_map[sid]["epoch_count"] += 1
            sources_map[sid]["fluxes"].append(src["flux"])

    for sid, info in sources_map.items():
        info["mean_flux_uJy"] = round(float(np.mean(info["fluxes"])), 2)
        del info["fluxes"]

    all_sources = list(sources_map.values())
    if type_filter:
        all_sources = [s for s in all_sources if type_filter.lower() in s["type"].lower()]

    start = (page - 1) * limit
    paginated = all_sources[start : start + limit]

    return {
        "region_id": region_id,
        "data_provenance": "SYNTHETIC_DEMO_DATA",
        "disclaimer": DISCLAIMER_TEXT,
        "total_sources": len(all_sources),
        "page": page,
        "limit": limit,
        "sources": paginated,
    }


@app.get("/api/source/{source_id}")
def get_source_detail(
    source_id: str,
    region_id: str = "region_001",
) -> Dict[str, Any]:
    """Retrieve multi-epoch measurement history for a single source."""
    region = data_service.get_region(region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Region not found.")

    observations = []
    for ep in region["epochs"]:
        src = next((s for s in ep["sources"] if s["id"] == source_id), None)
        if src:
            observations.append(
                {
                    "epoch_id": ep.get("epoch_id"),
                    "timestamp": ep["timestamp"],
                    "jd": ep["jd"],
                    "wavelength_um": ep["wavelength"],
                    "ra_deg": src["ra"],
                    "dec_deg": src["dec"],
                    "position_uncertainty_arcsec": src.get("position_uncertainty_arcsec", 0.2),
                    "flux_uJy": src["flux"],
                    "flux_err_uJy": src["flux_err"],
                    "flag": src.get("flag", "good"),
                    "psf_fwhm_arcsec": src.get("psf_fwhm", 2.0),
                    "type": src.get("type", "unknown"),
                }
            )

    if not observations:
        raise HTTPException(status_code=404, detail=f"Source '{source_id}' not found in '{region_id}'.")

    return {
        "source_id": source_id,
        "region_id": region_id,
        "data_provenance": "SYNTHETIC_DEMO_DATA",
        "disclaimer": DISCLAIMER_TEXT,
        "usable_epoch_count": len(observations),
        "observations": observations,
    }


# ==========================================
# DISCOVERY & ANOMALY ANALYSIS PIPELINE
# ==========================================

@app.get("/api/discoveries", response_model=Dict[str, Any])
def get_top_discoveries(
    region_id: str = "region_001",
    limit: int = 50,
    category_filter: Optional[str] = None,
) -> Dict[str, Any]:
    """Scan and rank candidates using transparent interestingness and confidence tiers."""
    region = data_service.get_region(region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Survey region not found.")

    all_objects = set()
    for ep in region["epochs"]:
        for src in ep["sources"]:
            all_objects.add(src["id"])

    discoveries: List[Dict[str, Any]] = []

    for obj_id in all_objects:
        epochs_data = []
        positions_ra = []
        positions_dec = []
        for ep in region["epochs"]:
            src = next((s for s in ep["sources"] if s["id"] == obj_id), None)
            if src:
                epochs_data.append(
                    {
                        "timestamp": ep["timestamp"],
                        "jd": ep["jd"],
                        "wavelength": ep["wavelength"],
                        "data": src,
                    }
                )
                positions_ra.append(src["ra"])
                positions_dec.append(src["dec"])

        if len(epochs_data) >= 1:
            analysis = engine.analyze({"id": obj_id, "epochs": epochs_data}, region)
            motion_res = analysis.detector_results.get("astrometric_motion")
            photo_res = analysis.detector_results.get("photometric_variability")

            disp = motion_res.metrics.get("total_motion_arcsec", 0.0) if motion_res else 0.0
            var_pct = photo_res.metrics.get("fractional_variation", 0.0) * 100.0 if photo_res else 0.0

            # Determine dominant dimension
            dim_scores = analysis.dimensional_scores
            dominant_dim = max(dim_scores.items(), key=lambda x: x[1])[0] if dim_scores else "quiescent"

            caveats = [c.name for c in analysis.quality_checks if c.status in ["CAUTION", "FAIL"]]
            quality_caveat = ", ".join(caveats) if caveats else "None (passed all checks)"

            summary = {
                "object_id": obj_id,
                "data_provenance": "SYNTHETIC_DEMO_DATA",
                "ra_mean": round(float(np.mean(positions_ra)), 6),
                "dec_mean": round(float(np.mean(positions_dec)), 6),
                "interestingness_score": analysis.interestingness_score,
                "evidence_confidence_tier": analysis.evidence_confidence.tier,
                "evidence_confidence_numeric": analysis.evidence_confidence.numeric_value,
                "scientific_priority": analysis.scientific_priority,
                "primary_classification": analysis.primary_classification.label,
                "classification_category": analysis.primary_classification.category,
                "dominant_dimension": dominant_dim,
                "why_interesting_summary": analysis.why_interesting[0] if analysis.why_interesting else "Baseline star.",
                "motion_arcsec": round(disp, 3),
                "flux_variability_pct": round(var_pct, 1),
                "usable_epoch_count": len(epochs_data),
                "quality_caveat": quality_caveat,
            }

            if category_filter and isinstance(category_filter, str) and category_filter != "all":
                cat_upper = category_filter.upper()
                if cat_upper == "HIGH_PRIORITY" and analysis.scientific_priority != "HIGH":
                    continue
                elif cat_upper in ["NEO", "ASTEROID"] and "NEAR_EARTH_OBJECT" not in analysis.primary_classification.category:
                    continue
                elif cat_upper == "VARIABLE" and "VARIABLE_STAR" not in analysis.primary_classification.category:
                    continue
                elif cat_upper == "TRANSIENT" and "INFRARED_TRANSIENT" not in analysis.primary_classification.category:
                    continue
                elif cat_upper in ["ICE", "ICE_CORE"] and "ICE_RICH_CORE" not in analysis.primary_classification.category:
                    continue
                elif cat_upper == "ARTIFACT" and "INSTRUMENTAL_ARTIFACT" not in analysis.primary_classification.category:
                    continue

            discoveries.append(summary)

    discoveries.sort(key=lambda x: x["interestingness_score"], reverse=True)
    limit_num = limit if isinstance(limit, int) else 50

    return {
        "region_id": region_id,
        "region_name": region["name"],
        "data_provenance": "SYNTHETIC_DEMO_DATA",
        "disclaimer": DISCLAIMER_TEXT,
        "total_evaluated": len(discoveries),
        "discoveries": discoveries[:limit_num],
    }


class AnalyzeObjectRequest(BaseModel):
    region_id: str = "region_001"
    object_id: str = "DEMO-001"


@app.post("/api/analyze/object")
@app.get("/api/analyze/object")
def analyze_object(
    region_id: str = "region_001",
    object_id: str = "DEMO-001",
) -> Dict[str, Any]:
    """Execute complete explainable AI analysis and generate discovery passport."""
    region = data_service.get_region(region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Survey region not found.")

    epochs_data = []
    for ep in region["epochs"]:
        src = next((s for s in ep["sources"] if s["id"] == object_id), None)
        if src:
            epochs_data.append(
                {
                    "timestamp": ep["timestamp"],
                    "jd": ep["jd"],
                    "wavelength": ep["wavelength"],
                    "data": src,
                }
            )

    if not epochs_data:
        raise HTTPException(status_code=404, detail=f"Object '{object_id}' not found in region '{region_id}'.")

    analysis = engine.analyze({"id": object_id, "epochs": epochs_data}, region)
    passport = PassportService.generate_passport(object_id, epochs_data, analysis, region)

    return {
        "object_id": object_id,
        "region_id": region_id,
        "data_provenance": "SYNTHETIC_DEMO_DATA",
        "disclaimer": DISCLAIMER_TEXT,
        "analysis": analysis.model_dump() if hasattr(analysis, "model_dump") else analysis.dict(),
        "passport": passport.model_dump() if hasattr(passport, "model_dump") else passport.dict(),
    }


@app.get("/api/passport/{passport_id}")
def get_passport_by_id(passport_id: str) -> Dict[str, Any]:
    """Retrieve canonical Scientific Discovery Passport."""
    target_candidates = [passport_id]
    if passport_id.startswith("ST-"):
        # Format is ST-{reg_num:03d}-{object_id}, e.g. ST-001-DEMO-001
        parts = passport_id.split("-")
        if len(parts) >= 3:
            target_candidates.insert(0, "-".join(parts[2:]))

    matched_region_id = "region_001"
    matched_object_id = target_candidates[0]
    found = False

    for r in data_service._regions.values():
        for ep in r["epochs"]:
            for s in ep["sources"]:
                for cand in target_candidates:
                    if s["id"] == cand:
                        matched_region_id = r["id"]
                        matched_object_id = s["id"]
                        found = True
                        break
                if found:
                    break
            if found:
                break
        if found:
            break

    return analyze_object(region_id=matched_region_id, object_id=matched_object_id)["passport"]


@app.get("/api/passport/{region_id}/{object_id}")
def get_discovery_passport_path(region_id: str, object_id: str) -> Dict[str, Any]:
    """Retrieve canonical Scientific Discovery Passport for specified region and object."""
    return analyze_object(region_id=region_id, object_id=object_id)["passport"]


@app.get("/api/report/{passport_id}", response_class=HTMLResponse)
@app.post("/api/report/{passport_id}", response_class=HTMLResponse)
def get_html_report(passport_id: str) -> HTMLResponse:
    """Generate self-contained, printable HTML Scientific Discovery Report."""
    passport_data = get_passport_by_id(passport_id)
    passport_obj = ScientificDiscoveryPassport(**passport_data)
    html_content = ReportService.generate_html_report(passport_obj)
    return HTMLResponse(content=html_content)


# ==========================================
# DETECTOR REGISTRY & WEIGHTS CONFIGURATION
# ==========================================

@app.get("/api/detectors")
def list_detectors() -> Dict[str, Any]:
    """List registered anomaly detectors with active weights and configuration."""
    return {
        "detectors": detector_registry.list_detectors(),
        "normalized_weights": detector_registry.get_normalized_weights(),
        "algorithm_version": ALGORITHM_VERSION,
    }


@app.post("/api/detectors/weights")
def update_detector_weights(req: WeightsUpdateRequest) -> Dict[str, Any]:
    """Dynamically adjust contribution weights of anomaly detectors."""
    detector_registry.set_weights(req.weights)
    return {
        "status": "success",
        "updated_weights": detector_registry.get_normalized_weights(),
    }


class ToggleDetectorRequest(BaseModel):
    detector_id: str
    is_active: bool


@app.post("/api/detectors/toggle")
def toggle_detector(req: ToggleDetectorRequest) -> Dict[str, Any]:
    """Enable or disable a specific anomaly detector in the pipeline."""
    success = detector_registry.set_active(req.detector_id, req.is_active)
    if not success:
        raise HTTPException(status_code=404, detail=f"Detector '{req.detector_id}' not found.")
    return {
        "status": "success",
        "detector_id": req.detector_id,
        "is_active": req.is_active,
        "normalized_weights": detector_registry.get_normalized_weights(),
    }


# ==========================================
# INGESTION & SYNTHETIC ANOMALY INJECTION
# ==========================================

@app.post("/api/data/inject")
def inject_anomaly(req: AnomalyInjectionRequest) -> Dict[str, Any]:
    """Inject a custom synthetic astronomical anomaly for real-time validation."""
    try:
        updated_region = data_service.inject_synthetic_anomaly(req)
        return {
            "status": "success",
            "message": f"Injected synthetic anomaly '{req.object_id}' into '{req.region_id}'.",
            "data_provenance": "SYNTHETIC_DEMO_DATA",
            "disclaimer": DISCLAIMER_TEXT,
            "region": updated_region,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/data/ingest")
def ingest_dataset(dataset: Dict[str, Any]) -> Dict[str, Any]:
    """Ingest custom multi-epoch astronomical survey observations."""
    try:
        new_region = data_service.ingest_custom_dataset(dataset)
        return {
            "status": "success",
            "message": f"Ingested custom survey '{new_region['id']}'.",
            "data_provenance": new_region.get("data_provenance", "SYNTHETIC_DEMO_DATA"),
            "disclaimer": DISCLAIMER_TEXT,
            "region": new_region,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
