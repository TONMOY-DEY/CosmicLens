import os
import sys

# Ensure backend root is in Python search path regardless of where pytest is executed from
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
import numpy as np

from app.detectors.base import DetectorRegistry
from app.detectors.motion_detector import AstrometricMotionDetector
from app.detectors.photometry_detector import PhotometricVariabilityDetector
from app.detectors.artifact_vetter import FalseAlarmInvestigator
from app.services.engine import AnomalyEngine
from app.services.data_service import AstronomicalDataService
from app.services.passport_service import PassportService
from app.services.catalog_service import CatalogCrossCheckService
from app.services.report_service import ReportService


def test_detector_registry_registration():
    """Verify that all five multi-dimensional detectors auto-register."""
    registry = DetectorRegistry.get_instance()
    detectors = registry.list_detectors()
    detector_ids = [d["detector_id"] for d in detectors]

    assert "astrometric_motion" in detector_ids
    assert "photometric_variability" in detector_ids
    assert "spectral_anomaly" in detector_ids
    assert "temporal_dynamics" in detector_ids
    assert "contextual_outlier" in detector_ids

    weights = registry.get_normalized_weights()
    assert abs(sum(weights.values()) - 1.0) < 1e-4


def test_motion_detector_accuracy():
    """Test proper motion calculation for moving asteroid vs stationary star."""
    detector = AstrometricMotionDetector()

    moving_epochs = [
        {"jd": 2460000, "data": {"ra": 180.000, "dec": 10.000}},
        {"jd": 2460070, "data": {"ra": 180.005, "dec": 10.004}},
        {"jd": 2460140, "data": {"ra": 180.010, "dec": 10.008}},
    ]
    res_moving = detector.calculate(moving_epochs, {})
    assert res_moving.is_significant is True
    assert res_moving.score > 70.0
    assert res_moving.metrics["total_motion_arcsec"] > 20.0

    static_epochs = [
        {"jd": 2460000, "data": {"ra": 180.00000, "dec": 10.00000}},
        {"jd": 2460070, "data": {"ra": 180.00001, "dec": 10.00001}},
        {"jd": 2460140, "data": {"ra": 180.00000, "dec": 10.00002}},
    ]
    res_static = detector.calculate(static_epochs, {})
    assert res_static.is_significant is False
    assert res_static.score < 20.0


def test_photometric_variability_detector():
    """Test reduced chi-squared and variability amplitude."""
    detector = PhotometricVariabilityDetector()

    var_epochs = [
        {"jd": 2460000, "data": {"flux": 30.0, "flux_err": 1.5}},
        {"jd": 2460070, "data": {"flux": 95.0, "flux_err": 2.0}},
        {"jd": 2460140, "data": {"flux": 28.0, "flux_err": 1.4}},
    ]
    res_var = detector.calculate(var_epochs, {})
    assert res_var.is_significant is True
    assert res_var.metrics["fractional_variation"] > 0.4
    assert res_var.metrics["reduced_chi_squared"] > 10.0


def test_false_alarm_investigation():
    """Test discrete checks and detection of sub-diffraction cosmic ray hits."""
    investigator = FalseAlarmInvestigator(diffraction_limit_fwhm=1.8)

    cr_epochs = [
        {"data": {"flux": 20.0, "flux_err": 1.0, "flag": "good", "psf_fwhm": 2.0}},
        {"data": {"flux": 250.0, "flux_err": 2.0, "flag": "marginal", "psf_fwhm": 0.65}},
        {"data": {"flux": 22.0, "flux_err": 1.0, "flag": "good", "psf_fwhm": 2.0}},
    ]
    inv, quality = investigator.investigate(cr_epochs)
    psf_check = next((c for c in inv.checks if c.name == "psf_diffraction_consistency"), None)
    assert psf_check is not None
    assert psf_check.status == "FAIL"
    assert "Sub-diffraction PSF FWHM" in psf_check.details


def test_catalog_cross_check():
    """Verify catalog cross check guardrails."""
    service = CatalogCrossCheckService(search_radius_arcsec=5.0)
    res = service.cross_check("DEMO-001", 282.74, -5.52)
    assert res.status in ["NO MATCH FOUND IN QUERIED CATALOGS", "MATCH FOUND"]
    assert "No catalog match does not prove an undiscovered" in res.limitations


def test_end_to_end_analysis_and_passport():
    """Test complete discovery pipeline on synthetic candidate DEMO-001."""
    engine = AnomalyEngine()
    data_svc = AstronomicalDataService()
    region = data_svc.get_region("region_001")

    epochs_data = []
    for ep in region["epochs"]:
        src = next((s for s in ep["sources"] if s["id"] == "DEMO-001"), None)
        if src:
            epochs_data.append({"timestamp": ep["timestamp"], "jd": ep["jd"], "wavelength": ep["wavelength"], "data": src})

    analysis = engine.analyze({"id": "DEMO-001", "epochs": epochs_data}, region)
    assert analysis.data_provenance == "SYNTHETIC_DEMO_DATA"
    assert analysis.interestingness_score >= 55.0
    assert analysis.evidence_confidence.tier in ["HIGH", "MODERATE"]
    assert len(analysis.why_interesting) > 0

    passport = PassportService.generate_passport("DEMO-001", epochs_data, analysis, region)
    assert passport.passport_id == "ST-001-DEMO-001"
    assert passport.data_provenance == "SYNTHETIC_DEMO_DATA"
    assert "SIMULATED DEMO DATA" in passport.disclaimer
    assert passport.fits_header_card is not None

    # Test HTML report generation
    html_report = ReportService.generate_html_report(passport)
    assert "<!DOCTYPE html>" in html_report
    assert "SKYTRACE AI" in html_report
    assert "ST-001-DEMO-001" in html_report


def test_variable_star_demo002():
    """Verify DEMO-002 in region_002 is correctly classified as VARIABLE_STAR."""
    engine = AnomalyEngine()
    data_svc = AstronomicalDataService()
    region = data_svc.get_region("region_002")

    epochs_data = []
    for ep in region["epochs"]:
        src = next((s for s in ep["sources"] if s["id"] == "DEMO-002"), None)
        if src:
            epochs_data.append({"timestamp": ep["timestamp"], "jd": ep["jd"], "wavelength": ep["wavelength"], "data": src})

    analysis = engine.analyze({"id": "DEMO-002", "epochs": epochs_data}, region)
    assert analysis.primary_classification.category == "VARIABLE_STAR"
    assert analysis.dimensional_scores["photometry"] > 80.0
    assert analysis.evidence_confidence.tier in ["HIGH", "MODERATE"]


def test_artifact_vetting_demo_art_99():
    """Verify DEMO-ART-99 is rejected as INSTRUMENTAL_ARTIFACT due to sub-diffraction PSF."""
    engine = AnomalyEngine()
    data_svc = AstronomicalDataService()
    region = data_svc.get_region("region_002")

    epochs_data = []
    for ep in region["epochs"]:
        src = next((s for s in ep["sources"] if s["id"] == "DEMO-ART-99"), None)
        if src:
            epochs_data.append({"timestamp": ep["timestamp"], "jd": ep["jd"], "wavelength": ep["wavelength"], "data": src})

    analysis = engine.analyze({"id": "DEMO-ART-99", "epochs": epochs_data}, region)
    assert analysis.primary_classification.category == "INSTRUMENTAL_ARTIFACT"
    assert analysis.evidence_confidence.tier == "LOW"
    assert any(c.status == "FAIL" for c in analysis.false_alarm_investigation.checks)


def test_api_endpoints_and_injection():
    """Verify core API endpoints, weights adjustment, and synthetic anomaly injection."""
    from app.main import (
        health,
        list_regions,
        get_top_discoveries,
        get_html_report,
        update_detector_weights,
        inject_anomaly,
    )
    from app.models.schemas import WeightsUpdateRequest, AnomalyInjectionRequest

    # 1. Health check
    h = health()
    assert h["status"] == "healthy"
    assert h["active_detectors_count"] == 5

    # 2. Regions listing
    regions = list_regions()
    assert len(regions["regions"]) >= 3

    # 3. Discoveries ranking
    disc = get_top_discoveries(region_id="region_001", limit=10)
    assert disc["total_evaluated"] > 0
    assert len(disc["discoveries"]) > 0

    # 4. Standalone HTML Report Generation
    report = get_html_report("ST-001-DEMO-001")
    assert "<!DOCTYPE html>" in report.body.decode("utf-8")

    # 5. Dynamic weights configuration
    update_detector_weights(WeightsUpdateRequest(weights={"astrometric_motion": 0.5, "photometric_variability": 0.5}))

    # 6. Anomaly Injection
    inj_res = inject_anomaly(
        AnomalyInjectionRequest(
            region_id="region_001",
            object_id="TEST-INJECT-01",
            anomaly_type="moving_asteroid",
            ra_offset_arcsec_per_epoch=2.5,
            dec_offset_arcsec_per_epoch=1.2,
            base_flux=60.0,
        )
    )
    assert inj_res["status"] == "success"
    assert "TEST-INJECT-01" in inj_res["message"]
