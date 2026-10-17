"""Pydantic data models and schemas for SKYTRACE AI / CosmicLens.

Strictly aligned with NASA Space Apps Challenge 2026 specifications.
"""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

# Persistent scientific disclaimer for all synthetic operations
DISCLAIMER_TEXT = "SIMULATED DEMO DATA — NOT A REAL ASTRONOMICAL DISCOVERY"
ALGORITHM_VERSION = "v1.0.0-robust"


class SourceObservation(BaseModel):
    """Observation of a single celestial source at a specific epoch."""
    id: str = Field(..., description="Unique source identifier within survey")
    ra: float = Field(..., description="Right Ascension in degrees (J2000)")
    dec: float = Field(..., description="Declination in degrees (J2000)")
    position_uncertainty_arcsec: float = Field(0.2, description="Estimated combined positional uncertainty in arcsec")
    flux: float = Field(..., description="Flux density in microJanskys (uJy)")
    flux_err: float = Field(..., description="Flux measurement uncertainty in uJy")
    flag: str = Field("good", description="Measurement flag: good, marginal, saturated, bad_pixel")
    psf_fwhm: float = Field(2.0, description="Point Spread Function Full-Width-at-Half-Maximum in arcsec")
    band: Optional[str] = Field("SPHEREx-IR", description="Filter or band name")
    type: Optional[str] = Field("unknown", description="Preliminary or catalog source type")


class Epoch(BaseModel):
    """A survey observation epoch across a celestial field."""
    epoch_id: str = Field(..., description="Unique epoch identifier")
    timestamp: str = Field(..., description="ISO 8601 observation date")
    jd: float = Field(..., description="Julian Date of observation")
    wavelength: float = Field(..., description="Effective bandpass wavelength in micrometers")
    sources: List[SourceObservation] = Field(..., description="Detected sources in this epoch")
    background_median: Optional[float] = Field(15.0, description="Median sky background level in uJy")
    background_rms: Optional[float] = Field(1.2, description="RMS sky background noise in uJy")


class Region(BaseModel):
    """A celestial survey sky region containing multiple observation epochs."""
    id: str = Field(..., description="Unique region identifier")
    name: str = Field(..., description="Astronomical field name")
    data_provenance: str = Field("SYNTHETIC_DEMO_DATA", description="REAL_ARCHIVE_DATA, SYNTHETIC_DEMO_DATA, or MIXED_DATA")
    disclaimer: str = Field(DISCLAIMER_TEXT, description="Mandatory synthetic data guardrail disclaimer")
    ra_center: float = Field(..., description="Central Right Ascension in degrees")
    dec_center: float = Field(..., description="Central Declination in degrees")
    fov_arcmin: float = Field(..., description="Field of View diameter in arcminutes")
    description: str = Field(..., description="Scientific description and astrophysical context")
    epochs: List[Epoch] = Field(..., description="Sequence of survey epochs")


class DetectorResult(BaseModel):
    """Output from an individual anomaly detector."""
    detector_id: str
    dimension: str
    score: float = Field(..., ge=0.0, le=100.0, description="Normalized anomaly score (0-100)")
    is_significant: bool = Field(..., description="Whether anomaly surpasses significance threshold")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Detailed physical metrics computed")
    description: str = Field(..., description="Human-interpretable scientific description")


class QualityCheckItem(BaseModel):
    """Discrete data-quality and false-alarm check."""
    name: str = Field(..., description="E.g., signal_to_noise, psf_consistency, single_epoch_dominance, detector_flags")
    status: Literal["PASS", "CAUTION", "FAIL", "UNKNOWN", "NOT EVALUATED"] = Field(..., description="Check outcome state")
    details: str = Field(..., description="Evidence-backed description of the check finding")


class CatalogCheckResult(BaseModel):
    """Outcome of known-object catalog cross-matching."""
    status: Literal["MATCH FOUND", "NO MATCH FOUND IN QUERIED CATALOGS", "NOT CHECKED"] = Field(
        "NOT CHECKED", description="Cross-check outcome status"
    )
    catalogs_checked: List[str] = Field(default_factory=list, description="Names of catalogs queried, e.g., Gaia DR3, 2MASS")
    search_radius_arcsec: float = Field(5.0, description="Search cone radius in arcseconds")
    matches: List[Dict[str, Any]] = Field(default_factory=list, description="Candidate counterparts with angular separation")
    limitations: str = Field(
        "No catalog match does not imply an undiscovered object; query is bounded by coverage, epoch, and catalog sensitivity.",
        description="Mandatory scientific guardrail limitation disclaimer",
    )


class EvidenceConfidence(BaseModel):
    """Separated evidence confidence assessment."""
    tier: Literal["LOW", "MODERATE", "HIGH", "INSUFFICIENT DATA"] = Field(..., description="Confidence reliability tier")
    numeric_value: float = Field(..., ge=0.0, le=100.0, description="Confidence score 0-100")
    reasons: List[str] = Field(default_factory=list, description="Detailed reasons supporting the confidence tier")


class ClassificationHypothesis(BaseModel):
    """Astrophysical classification candidate with calibrated probability."""
    category: str = Field(..., description="E.g., NEAR_EARTH_OBJECT, VARIABLE_STAR, INFRARED_TRANSIENT")
    label: str = Field(..., description="Human-friendly label")
    probability: float = Field(..., ge=0.0, le=1.0)
    rationale: str


class SEDPoint(BaseModel):
    """Spectral Energy Distribution data point across SPHEREx channels."""
    wavelength_um: float
    flux_ujy: float
    flux_err_ujy: float
    band_id: int
    spectral_feature: Optional[str] = None


class VettingAudit(BaseModel):
    """Vetting audit summary used for astrophysical classification."""
    overall_artifact_probability: float = Field(3.5, description="Probability (0-100) of instrumental artifact")
    measurement_quality_score: float = Field(95.0, description="Quality score (0-100)")
    psf_consistency: str = Field("consistent_stellar_profile", description="PSF profile consistency status")
    artifacts_detected: List[Any] = Field(default_factory=list, description="List of detected artifacts")


class FalseAlarmInvestigation(BaseModel):
    """Formal False Alarm investigation module."""
    checks: List[QualityCheckItem] = Field(default_factory=list)
    possible_alternatives: List[str] = Field(default_factory=list)
    assessment: str = Field(...)


class DataQualitySummary(BaseModel):
    """Data quality metadata and flags."""
    available_flags: List[str] = Field(default_factory=list)
    missing_metadata: List[str] = Field(default_factory=list)
    assessment: str = Field(...)


class PositionAndMotion(BaseModel):
    """Astrometric position and motion trajectory."""
    trajectory: List[Dict[str, Any]] = Field(default_factory=list)
    total_motion_arcsec: float = Field(0.0)
    apparent_speed_arcsec_yr: float = Field(0.0)
    trajectory_linearity: float = Field(0.0)
    assessment: str = Field(...)


class PhotometrySummary(BaseModel):
    """Photometric light curve and variability summary."""
    measurements: List[Dict[str, Any]] = Field(default_factory=list)
    fractional_variability: float = Field(0.0)
    reduced_chi_squared: float = Field(1.0)
    delta_magnitude: float = Field(0.0)
    assessment: str = Field(...)


class SpectralFingerprint(BaseModel):
    """Spectral fingerprint and multi-band infrared evolution."""
    wavelength_um: List[float] = Field(default_factory=list)
    flux: List[float] = Field(default_factory=list)
    uncertainty: List[float] = Field(default_factory=list)
    spectral_changes: List[str] = Field(default_factory=list)
    assessment: str = Field(...)


class ScientificDiscoveryPassport(BaseModel):
    """Canonical Scientific Discovery Passport matching Section 5.7 of project spec."""
    passport_id: str = Field(..., description="Unique passport ID, e.g., ST-001-DEMO-001")
    data_provenance: str = Field("SYNTHETIC_DEMO_DATA", description="Provenance marker")
    disclaimer: str = Field(DISCLAIMER_TEXT, description="Mandatory synthetic data disclaimer")
    source_identity: Dict[str, Any] = Field(..., description="Source ID, region, observation span, usable epoch count")
    position_and_motion: PositionAndMotion = Field(...)
    photometry: PhotometrySummary = Field(...)
    spectral_fingerprint: SpectralFingerprint = Field(...)
    data_quality: DataQualitySummary = Field(...)
    false_alarm_investigation: FalseAlarmInvestigation = Field(...)
    known_object_cross_check: CatalogCheckResult = Field(...)
    analysis: Dict[str, Any] = Field(..., description="algorithm_version, component_scores, interestingness, confidence, priority, why_interesting")
    follow_up_suggestions: List[str] = Field(default_factory=list)
    generated_at: str = Field(...)
    limitations: List[str] = Field(default_factory=list)
    fits_header_card: Optional[str] = Field(None, description="Standard 80-column FITS header block")


class AnalysisResult(BaseModel):
    """Comprehensive multi-dimensional anomaly analysis and scientific explanation."""
    object_id: str
    data_provenance: str = Field("SYNTHETIC_DEMO_DATA")
    disclaimer: str = Field(DISCLAIMER_TEXT)
    algorithm_version: str = Field(ALGORITHM_VERSION)
    interestingness_score: float = Field(..., ge=0.0, le=100.0, description="Scientific Interestingness heuristic")
    evidence_confidence: EvidenceConfidence = Field(...)
    scientific_priority: Literal["HIGH", "MODERATE", "LOW", "UNASSESSED"] = Field(..., description="Triage priority category")
    primary_classification: ClassificationHypothesis
    classification_breakdown: List[ClassificationHypothesis]
    dimensional_scores: Dict[str, float]
    detector_results: Dict[str, DetectorResult]
    quality_checks: List[QualityCheckItem]
    false_alarm_investigation: FalseAlarmInvestigation
    known_object_cross_check: CatalogCheckResult
    why_interesting: List[str]
    astrophysical_narrative: str
    sed_profile: List[SEDPoint]
    follow_up_suggestions: List[str]
    limitations: List[str]


class DiscoverySummary(BaseModel):
    """Triage ranking summary for a discovered candidate."""
    object_id: str
    data_provenance: str = Field("SYNTHETIC_DEMO_DATA")
    ra_mean: float
    dec_mean: float
    interestingness_score: float
    evidence_confidence_tier: str
    evidence_confidence_numeric: float
    scientific_priority: str
    primary_classification: str
    dominant_dimension: str
    why_interesting_summary: str
    motion_arcsec: float
    flux_variability_pct: float
    usable_epoch_count: int
    quality_caveat: str


class WeightsUpdateRequest(BaseModel):
    """Request payload to dynamically adjust anomaly detector weights."""
    weights: Dict[str, float]


class AnomalyInjectionRequest(BaseModel):
    """Request payload to inject a custom synthetic anomaly into a region."""
    region_id: str
    object_id: str
    anomaly_type: str = Field(..., description="moving_asteroid, infrared_transient, variable_star, cosmic_ray")
    ra_offset_arcsec_per_epoch: float = 0.0
    dec_offset_arcsec_per_epoch: float = 0.0
    base_flux: float = 50.0
    flux_multipliers: List[float] = Field(default_factory=lambda: [1.0, 1.0, 1.0, 1.0])
    inject_artifact: bool = False
