"""API endpoints for Scientific Discovery Passport and Formal Publication Reports (HTML & PDF)."""

from typing import Any, Dict
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import HTMLResponse

from app.models.schemas import ScientificDiscoveryPassport
from app.services.report_service import ReportService
from app.services.pdf_report_generator import ScientificPDFReportGenerator
from app.services.data_service import AstronomicalDataService
from app.services.engine import AnomalyEngine
from app.services.passport_service import PassportService

router = APIRouter(prefix="/api/reports", tags=["reports"])
data_service = AstronomicalDataService()
engine = AnomalyEngine()


@router.get("/passport/{region_id}/{object_id}")
def get_passport_json(region_id: str, object_id: str) -> Dict[str, Any]:
    """Retrieve canonical Discovery Passport object in JSON format."""
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
        raise HTTPException(status_code=404, detail="Candidate source not found.")

    analysis = engine.analyze({"id": object_id, "epochs": epochs_data}, region)
    passport = PassportService.generate_passport(object_id, epochs_data, analysis, region)
    return passport.model_dump() if hasattr(passport, "model_dump") else passport.dict()


@router.get("/html/{region_id}/{object_id}", response_class=HTMLResponse)
def get_report_html(region_id: str, object_id: str) -> HTMLResponse:
    """Generate complete printable HTML scientific report."""
    passport_data = get_passport_json(region_id, object_id)
    passport_obj = ScientificDiscoveryPassport(**passport_data)
    html_content = ReportService.generate_html_report(passport_obj)
    return HTMLResponse(content=html_content)


@router.get("/pdf/{region_id}/{object_id}")
def download_report_pdf(region_id: str, object_id: str) -> Response:
    """Generate and download formal NASA / ESA scientific preprint report in PDF format."""
    passport_data = get_passport_json(region_id, object_id)
    passport_obj = ScientificDiscoveryPassport(**passport_data)
    pdf_bytes = ScientificPDFReportGenerator.generate_pdf_bytes(passport_obj)

    filename = f"SKYTRACE_DISCOVERY_PASSPORT_{object_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
