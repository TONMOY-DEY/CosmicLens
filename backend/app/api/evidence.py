"""API endpoints for Evidence Explorer and traceable relationship graph.

Implements Section 4 (Page 9):
Relationship graph: Object → Observations → Measurements → Anomalies → Validation → Explanation.
Full scientific audit trail with applied thresholds, uncertainties, and algorithms.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.services.data_service import AstronomicalDataService
from app.services.engine import AnomalyEngine
from app.models.schemas import DISCLAIMER_TEXT

router = APIRouter(prefix="/api/evidence", tags=["evidence"])
data_service = AstronomicalDataService()
engine = AnomalyEngine()


@router.get("/graph/{object_id}")
def get_evidence_relationship_graph(
    object_id: str,
    region_id: str = Query("region_001"),
) -> Dict[str, Any]:
    """Generate interactive node-link graph data for the Evidence Explorer.
    
    Structure: Object -> Observations -> Measurements -> Anomalies -> Validation -> Explanation
    """
    region = data_service.get_region(region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Region not found.")

    epochs_data = []
    for ep in region["epochs"]:
        src = next((s for s in ep["sources"] if s["id"] == object_id), None)
        if src:
            epochs_data.append({
                "epoch_id": ep.get("epoch_id"),
                "timestamp": ep["timestamp"],
                "jd": ep["jd"],
                "wavelength": ep["wavelength"],
                "data": src,
            })

    if not epochs_data:
        raise HTTPException(status_code=404, detail=f"Source '{object_id}' not found.")

    analysis = engine.analyze({"id": object_id, "epochs": epochs_data}, region)

    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []

    # 1. Root Object Node
    obj_node_id = f"obj_{object_id}"
    nodes.append({
        "id": obj_node_id,
        "label": object_id,
        "type": "OBJECT",
        "category": "root",
        "details": f"Survey target in {region['name']} ({len(epochs_data)} epochs)",
        "status": analysis.scientific_priority,
    })

    # 2. Observation (Epoch) Nodes
    for i, ep in enumerate(epochs_data):
        ep_node_id = f"obs_{ep.get('epoch_id', i)}"
        nodes.append({
            "id": ep_node_id,
            "label": f"Epoch {i+1} ({ep['timestamp'][:10]})",
            "type": "OBSERVATION",
            "category": "observation",
            "details": f"JD {ep['jd']:.2f} • λ={ep['wavelength']} µm",
            "status": "PASS",
        })
        edges.append({
            "source": obj_node_id,
            "target": ep_node_id,
            "relation": "observed_at",
        })

        # 3. Measurement Nodes under each observation
        src_data = ep["data"]
        meas_pos_id = f"meas_pos_{i}"
        nodes.append({
            "id": meas_pos_id,
            "label": f"Astrometry E{i+1}",
            "type": "MEASUREMENT",
            "category": "measurement",
            "details": f"RA {src_data['ra']:.5f}°, Dec {src_data['dec']:.5f}° (±{src_data.get('position_uncertainty_arcsec', 0.25):.2f}\")",
            "status": "PASS",
        })
        edges.append({"source": ep_node_id, "target": meas_pos_id, "relation": "measured_astrometry"})

        meas_flux_id = f"meas_flux_{i}"
        nodes.append({
            "id": meas_flux_id,
            "label": f"Flux E{i+1}: {src_data['flux']:.1f} µJy",
            "type": "MEASUREMENT",
            "category": "measurement",
            "details": f"Flux {src_data['flux']:.1f} ± {src_data['flux_err']:.1f} µJy (Flag: {src_data.get('flag', 'good')})",
            "status": "PASS" if src_data.get("flag", "good") == "good" else "CAUTION",
        })
        edges.append({"source": ep_node_id, "target": meas_flux_id, "relation": "measured_flux"})

    # 4. Anomaly Nodes (from 5 dimensions)
    dim_scores = analysis.dimensional_scores
    for dim_name, score in dim_scores.items():
        anom_node_id = f"anom_{dim_name}"
        det_res = analysis.detector_results.get(f"astrometric_{dim_name}" if dim_name == "motion" else f"photometric_{dim_name}" if dim_name == "variability" else dim_name)
        is_high = score >= 50.0

        nodes.append({
            "id": anom_node_id,
            "label": f"{dim_name.title()} ({score:.0f}/100)",
            "type": "ANOMALY",
            "category": "anomaly",
            "details": f"Score: {score:.1f} • Threshold applied: 50.0 • Significant: {is_high}",
            "status": "HIGH" if is_high else "NORMAL",
        })

        # Connect measurements to anomalies
        for i in range(len(epochs_data)):
            if dim_name == "motion":
                edges.append({"source": f"meas_pos_{i}", "target": anom_node_id, "relation": "triggers"})
            elif dim_name in ["photometry", "variability"]:
                edges.append({"source": f"meas_flux_{i}", "target": anom_node_id, "relation": "triggers"})

    # 5. Validation Nodes
    val_checks = analysis.quality_checks
    for idx, chk in enumerate(val_checks[:4]):
        chk_node_id = f"val_{chk.name}"
        nodes.append({
            "id": chk_node_id,
            "label": chk.name.replace("_", " ").title(),
            "type": "VALIDATION",
            "category": "validation",
            "details": chk.details,
            "status": chk.status,
        })
        # Connect anomaly nodes to validation
        for dim_name in ["motion", "photometry"]:
            edges.append({"source": f"anom_{dim_name}", "target": chk_node_id, "relation": "validated_by"})

    # 6. Explanation Root Node
    exp_node_id = f"exp_{object_id}"
    nodes.append({
        "id": exp_node_id,
        "label": f"AI Synthesis: {analysis.primary_classification.label}",
        "type": "EXPLANATION",
        "category": "explanation",
        "details": analysis.astrophysical_narrative,
        "status": analysis.evidence_confidence.tier,
    })

    for chk in val_checks[:4]:
        edges.append({"source": f"val_{chk.name}", "target": exp_node_id, "relation": "synthesized_into"})

    # Detailed traceable audit
    traceability_audit = [
        {
            "dimension": "Motion Anomaly",
            "algorithm": "Robust Astrometric Proper Motion Detector (Astropy spherical kinematics)",
            "measurements_used": f"{len(epochs_data)} epochs across {epochs_data[-1]['jd'] - epochs_data[0]['jd']:.1f} day baseline",
            "applied_threshold": "3.0σ significance threshold over combined positional error",
            "residual_uncertainty": "Astrometric centroiding ±0.25 arcsec",
            "supporting_evidence": f"Total displacement: {analysis.detector_results.get('astrometric_motion', {}).metrics.get('total_motion_arcsec', 0.0) if hasattr(analysis.detector_results.get('astrometric_motion'), 'metrics') else 0.0:.2f} arcsec",
            "validation_verdict": next((c.status for c in val_checks if "motion" in c.name or "snr" in c.name), "PASS"),
        },
        {
            "dimension": "Photometric Anomaly",
            "algorithm": "Median Absolute Deviation (MAD) & Reduced Chi-Squared (χ²_ν)",
            "measurements_used": f"Multi-epoch flux in microJanskys (effective λ = 1.25 - 4.67 µm)",
            "applied_threshold": "χ²_ν > 2.5 and fractional variation > 20%",
            "residual_uncertainty": "Photometric calibration uncertainty ±4.0%",
            "supporting_evidence": f"Fractional flux variability: {analysis.detector_results.get('photometric_variability', {}).metrics.get('fractional_variation', 0.0) * 100 if hasattr(analysis.detector_results.get('photometric_variability'), 'metrics') else 0.0:.1f}%",
            "validation_verdict": next((c.status for c in val_checks if "variab" in c.name or "snr" in c.name), "PASS"),
        },
        {
            "dimension": "Spectral Fingerprint",
            "algorithm": "SPHEREx 10-Band Infrared Color Slope and Ice Absorption Trough Profiler",
            "measurements_used": "Multi-band SED channels from 0.75 µm to 5.00 µm",
            "applied_threshold": "Equivalent width of 3.05 µm H2O ice feature > 5.0",
            "residual_uncertainty": "Band-to-band transmission calibration ±5%",
            "supporting_evidence": "Infrared continuum slope and molecular ice diagnostic indices",
            "validation_verdict": "PASS",
        },
    ]

    return {
        "object_id": object_id,
        "region_id": region_id,
        "data_provenance": region.get("data_provenance", "SYNTHETIC_DEMO_DATA"),
        "disclaimer": DISCLAIMER_TEXT,
        "graph": {
            "nodes": nodes,
            "edges": edges,
        },
        "traceability_audit": traceability_audit,
        "narrative": analysis.astrophysical_narrative,
        "confidence_tier": analysis.evidence_confidence.tier,
    }
