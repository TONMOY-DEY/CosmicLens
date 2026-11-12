"""Unit and integration tests for SKYTRACE AI V2 capabilities."""

import os
import sys
from pathlib import Path

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.fits_reader import FITSInspectionService, ASTROPY_AVAILABLE
from app.services.data_importer import DatasetImportWorkflow
from app.services.epoch_comparator import EpochComparator
from app.services.pdf_report_generator import ScientificPDFReportGenerator
from app.models.schemas import ScientificDiscoveryPassport
from app.api.comparisons import compare_source_epochs
from app.api.evidence import get_evidence_relationship_graph
from app.api.validation import get_source_validation_detail, get_validation_summary
from app.api.reports import download_report_pdf, get_passport_json


def test_fits_and_importer_services():
    """Verify FITS inspection service and Astropy availability."""
    assert ASTROPY_AVAILABLE is True

    ep_a = {
        "epoch_id": "epoch_001",
        "jd": 2461114.675,
        "wavelength": 1.25,
        "sources": [
            {"id": "SRC_TEST", "ra": 180.0, "dec": 0.0, "flux": 100.0, "flux_err": 2.0, "flag": "good", "psf_fwhm": 2.0}
        ],
    }
    ep_b = {
        "epoch_id": "epoch_002",
        "jd": 2461328.833,
        "wavelength": 4.67,
        "sources": [
            {"id": "SRC_TEST", "ra": 180.002, "dec": 0.001, "flux": 140.0, "flux_err": 3.0, "flag": "good", "psf_fwhm": 2.0}
        ],
    }
    comp = EpochComparator.compare_epochs_for_source("SRC_TEST", ep_a, ep_b)
    assert comp["position"]["status"] == "CALCULATED"
    assert comp["position"]["angular_displacement_arcsec"] > 5.0
    assert comp["brightness"]["status"] == "CALCULATED"
    assert comp["brightness"]["percentage_change"] == 40.0
    assert comp["spectral"]["status"] == "CALCULATED"


def test_fits_workflow_8_steps():
    """Verify authentic FITS 8-step import workflow."""
    test_fits = Path(__file__).parent.parent / "data" / "uploads" / "sample_spherex_deep_field.fits"
    if test_fits.exists():
        res = DatasetImportWorkflow.process_file_import(test_fits, dataset_name="SPHEREx NEP Test Field")
        assert res["success"] is True
        assert len(res["steps"]) == 8
        assert all(s["status"] in ["PASS", "INFO", "CAUTION"] for s in res["steps"])
        assert "dimensions_status" in res


def test_api_comparisons_endpoint():
    """Verify comparisons endpoint directly."""
    res = compare_source_epochs(region_id="region_001", source_id="DEMO-001", epoch_a_idx=0, epoch_b_idx=3)
    assert res["status"] == "success"
    assert "comparison" in res
    assert "lightcurve" in res
    assert len(res["lightcurve"]) == 4


def test_api_evidence_graph_endpoint():
    """Verify evidence relationship graph endpoint."""
    res = get_evidence_relationship_graph(object_id="DEMO-001", region_id="region_001")
    assert "graph" in res
    assert "nodes" in res["graph"]
    assert "edges" in res["graph"]
    assert len(res["graph"]["nodes"]) >= 6
    assert "traceability_audit" in res


def test_api_validation_endpoints():
    """Verify validation detail endpoint."""
    det = get_source_validation_detail(region_id="region_001", object_id="DEMO-001")
    assert "overall_validation_status" in det
    assert "quality_checks" in det
    assert len(det["quality_checks"]) > 0


def test_api_reports_pdf_download():
    """Verify PDF report generation endpoint."""
    res = download_report_pdf(region_id="region_001", object_id="DEMO-001")
    assert res.media_type == "application/pdf"
    assert res.body.startswith(b"%PDF")
