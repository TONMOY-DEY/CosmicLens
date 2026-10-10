/**
 * Canonical TypeScript type definitions for SKYTRACE AI / CosmicLens
 * Aligned with NASA Space Apps Challenge 2026 specification.
 */

export const DISCLAIMER_TEXT = "SIMULATED DEMO DATA — NOT A REAL ASTRONOMICAL DISCOVERY";
export const ALGORITHM_VERSION = "v1.0.0-robust";

export interface SourceObservation {
  id: string;
  ra: number;
  dec: number;
  position_uncertainty_arcsec?: number;
  flux: number;
  flux_err: number;
  flag: string;
  psf_fwhm: number;
  band?: string;
  type?: string;
}

export interface Epoch {
  epoch_id?: string;
  timestamp: string;
  jd: number;
  wavelength: number;
  sources: SourceObservation[];
  background_median?: number;
  background_rms?: number;
}

export interface Region {
  id: string;
  name: string;
  data_provenance?: string;
  disclaimer?: string;
  ra_center: number;
  dec_center: number;
  fov_arcmin: number;
  description: string;
  epochs: Epoch[];
}

export interface DetectorResult {
  detector_id: string;
  dimension: string;
  score: number;
  is_significant: boolean;
  metrics: Record<string, any>;
  description: string;
}

export interface QualityCheckItem {
  name: string;
  status: 'PASS' | 'CAUTION' | 'FAIL' | 'UNKNOWN' | 'NOT EVALUATED';
  details: string;
}

export interface CatalogCheckResult {
  status: 'MATCH FOUND' | 'NO MATCH FOUND IN QUERIED CATALOGS' | 'NOT CHECKED';
  catalogs_checked: string[];
  search_radius_arcsec: number;
  matches: Array<Record<string, any>>;
  limitations: string;
}

export interface EvidenceConfidence {
  tier: 'LOW' | 'MODERATE' | 'HIGH' | 'INSUFFICIENT DATA';
  numeric_value: number;
  reasons: string[];
}

export interface ClassificationHypothesis {
  category: string;
  label: string;
  probability: number;
  rationale: string;
}

export interface SEDPoint {
  wavelength_um: number;
  flux_ujy: number;
  flux_err_ujy: number;
  band_id: number;
  spectral_feature?: string | null;
}

export interface FalseAlarmInvestigation {
  checks: QualityCheckItem[];
  possible_alternatives: string[];
  assessment: string;
}

export interface DataQualitySummary {
  available_flags: string[];
  missing_metadata: string[];
  assessment: string;
}

export interface PositionAndMotion {
  trajectory: Array<Record<string, any>>;
  total_motion_arcsec: number;
  apparent_speed_arcsec_yr: number;
  trajectory_linearity: number;
  assessment: string;
}

export interface PhotometrySummary {
  measurements: Array<Record<string, any>>;
  fractional_variability: number;
  reduced_chi_squared: number;
  delta_magnitude: number;
  assessment: string;
}

export interface SpectralFingerprint {
  wavelength_um: number[];
  flux: number[];
  uncertainty: number[];
  spectral_changes: string[];
  assessment: string;
}

export interface ScientificDiscoveryPassport {
  passport_id: string;
  data_provenance: string;
  disclaimer: string;
  source_identity: {
    source_id: string;
    iau_designation?: string;
    region_id?: string;
    region_name?: string;
    observation_span: string;
    usable_epoch_count: number;
    ra_mean_deg?: number;
    dec_mean_deg?: number;
  };
  position_and_motion: PositionAndMotion;
  photometry: PhotometrySummary;
  spectral_fingerprint: SpectralFingerprint;
  data_quality: DataQualitySummary;
  false_alarm_investigation: FalseAlarmInvestigation;
  known_object_cross_check: CatalogCheckResult;
  analysis: {
    algorithm_version: string;
    component_scores: Record<string, number>;
    interestingness_score: number;
    evidence_confidence: EvidenceConfidence;
    scientific_priority: string;
    why_interesting: string[];
  };
  follow_up_suggestions: string[];
  generated_at: string;
  limitations: string[];
  fits_header_card?: string;
}

export interface AnalysisResult {
  object_id: string;
  data_provenance: string;
  disclaimer: string;
  algorithm_version: string;
  interestingness_score: number;
  evidence_confidence: EvidenceConfidence;
  scientific_priority: 'HIGH' | 'MODERATE' | 'LOW' | 'UNASSESSED';
  primary_classification: ClassificationHypothesis;
  classification_breakdown: ClassificationHypothesis[];
  dimensional_scores: Record<string, number>;
  detector_results: Record<string, DetectorResult>;
  quality_checks: QualityCheckItem[];
  false_alarm_investigation: FalseAlarmInvestigation;
  known_object_cross_check: CatalogCheckResult;
  why_interesting: string[];
  astrophysical_narrative: string;
  sed_profile: SEDPoint[];
  follow_up_suggestions: string[];
  limitations: string[];
}

export interface DiscoverySummary {
  object_id: string;
  data_provenance: string;
  ra_mean: number;
  dec_mean: number;
  interestingness_score: number;
  evidence_confidence_tier: string;
  evidence_confidence_numeric: number;
  scientific_priority: string;
  primary_classification: string;
  dominant_dimension: string;
  why_interesting_summary: string;
  motion_arcsec: number;
  flux_variability_pct: number;
  usable_epoch_count: number;
  quality_caveat: string;
  classification_category?: string;
}

/* -------------------------------------------------------------------------- */
/* Extensions for remaining SKYTRACE features (do not rename types above)     */
/* -------------------------------------------------------------------------- */

export type DataProvenance =
  | 'SYNTHETIC_DEMO_DATA'
  | 'REAL_ARCHIVE_DATA'
  | 'MIXED_DATA';

export type QualityCheckStatus = QualityCheckItem['status'];

export type ScientificPriority = AnalysisResult['scientific_priority'];

export type EvidenceConfidenceTier = EvidenceConfidence['tier'];

export type AnomalyDimension =
  | 'motion'
  | 'photometry'
  | 'spectral'
  | 'temporal'
  | 'context';

/** Ranking controls for the candidate table (feature 8). */
export interface CandidateFilterState {
  search: string;
  category: string;
  min_interestingness: number;
  confidence_tiers: EvidenceConfidenceTier[];
  priorities: ScientificPriority[];
  provenance: DataProvenance | 'all';
  dominant_dimension: AnomalyDimension | 'all';
}

export const DEFAULT_CANDIDATE_FILTERS: CandidateFilterState = {
  search: '',
  category: 'all',
  min_interestingness: 0,
  confidence_tiers: ['LOW', 'MODERATE', 'HIGH', 'INSUFFICIENT DATA'],
  priorities: ['HIGH', 'MODERATE', 'LOW', 'UNASSESSED'],
  provenance: 'all',
  dominant_dimension: 'all',
};

/**
 * Schematic epoch frame for Interactive Sky Image Comparison.
 * Not a calibrated SPHEREx cutout. Always label with DISCLAIMER_TEXT.
 */
export interface SkyCutoutSourceMark {
  id: string;
  x_frac: number;
  y_frac: number;
  flux: number;
}

export interface SkyCutoutFrame {
  epoch_id: string;
  timestamp: string;
  width_px: number;
  height_px: number;
  fov_arcmin: number;
  data_provenance: DataProvenance;
  disclaimer: string;
  is_calibrated_telescope_image: false;
  notes: string;
  sources: SkyCutoutSourceMark[];
}

/**
 * SPHEREx archive integration interface (feature 11).
 * Adapters must set is_live_archive=false until a verified IRSA client exists.
 * Do not invent live product URLs.
 */
export type SpherexProductType = 'SPECTRA' | 'CUTOUT' | 'CATALOG' | 'UNKNOWN';

export interface SpherexArchiveQuery {
  ra_deg: number;
  dec_deg: number;
  radius_arcmin: number;
  release_name: string;
  product_type: SpherexProductType;
}

export interface SpherexArchiveHit {
  product_id: string;
  data_provenance: DataProvenance;
  disclaimer: string;
  ra_deg: number;
  dec_deg: number;
  observation_date: string;
  product_type: SpherexProductType;
  summary: string;
  source_url: string | null;
  is_live_archive: boolean;
}

export interface SpherexArchiveQueryResult {
  query: SpherexArchiveQuery;
  hits: SpherexArchiveHit[];
  adapter_mode: 'MOCK_ADAPTER' | 'LIVE_UNAVAILABLE';
  limitations: string[];
  disclaimer: string;
}

/** Typed catalog row for the cross-match UI; CatalogCheckResult.matches stays as-is. */
export interface CatalogMatchRecord {
  catalog_name: string;
  catalog_id: string;
  ra_deg: number;
  dec_deg: number;
  separation_arcsec: number;
  object_type: string | null;
  notes: string;
}

export interface CatalogCrossMatchQuery {
  ra_deg: number;
  dec_deg: number;
  search_radius_arcsec: number;
  catalogs: string[];
}

export interface CatalogCrossMatchResult {
  query: CatalogCrossMatchQuery;
  status: CatalogCheckResult['status'];
  matches: CatalogMatchRecord[];
  limitations: string;
  disclaimer: string;
  is_live_catalog_query: boolean;
}

/** Human review workflow (feature 13). Local UI state, not a fake remote API. */
export type ReviewVerdict = 'UNREVIEWED' | 'KEEP' | 'REJECT' | 'NEEDS_FOLLOW_UP';

export interface ReviewRecord {
  object_id: string;
  region_id: string;
  verdict: ReviewVerdict;
  reviewer_notes: string;
  reviewed_at: string | null;
  interestingness_at_review: number | null;
  confidence_tier_at_review: EvidenceConfidenceTier | null;
}

export interface ObjectAnalysisBundle {
  analysis: AnalysisResult;
  passport: ScientificDiscoveryPassport;
}
