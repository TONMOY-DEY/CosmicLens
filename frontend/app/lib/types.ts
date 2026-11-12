/**
 * Canonical TypeScript type definitions for SKYTRACE AI / CosmicLens
 * Aligned with NASA Space Apps Challenge 2026 specification.
 */

export const DISCLAIMER_TEXT = "SIMULATED DEMO DATA — NOT A REAL ASTRONOMICAL DISCOVERY";
export const ALGORITHM_VERSION = "v1.0.0-robust";

export type PageId =
  | 'overview'
  | 'data_center'
  | 'sky_explorer'
  | 'object_catalog'
  | 'change_analysis'
  | 'anomaly_detection'
  | 'candidate_explorer'
  | 'validation_center'
  | 'evidence_explorer'
  | 'discovery_passport'
  | 'settings';

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
    dimensional_scores?: Record<string, number>;
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

export interface DatasetItem {
  id: string;
  name: string;
  data_provenance: string;
  disclaimer: string;
  format: string;
  file_size_bytes: number;
  ra_center?: number;
  dec_center?: number;
  fov_arcmin?: number;
  telescope?: string;
  instrument?: string;
  date_obs?: string;
  epoch_count: number;
  source_count: number;
  dimensions_status: Record<string, { status: string; reason: string }>;
  created_at: string;
}

export interface ComparisonResultData {
  status: string;
  region_id: string;
  region_name: string;
  source_id: string;
  data_provenance: string;
  disclaimer: string;
  epoch_a_index: number;
  epoch_b_index: number;
  total_available_epochs: number;
  lightcurve: Array<{
    epoch_index: number;
    epoch_id: string;
    timestamp: string;
    jd: number;
    wavelength_um: number;
    flux_ujy: number;
    flux_err_ujy: number;
    ra: number;
    dec: number;
    flag: string;
  }>;
  comparison: {
    source_id: string;
    epoch_a_id: string;
    epoch_b_id: string;
    delta_time_days: number;
    position: {
      status: string;
      epoch_a_coords: { ra: number; dec: number };
      epoch_b_coords: { ra: number; dec: number };
      angular_displacement_arcsec: number;
      position_uncertainty_arcsec: number;
      significance_sigma: number;
      position_angle_deg: number;
      direction: string;
      apparent_speed_arcsec_yr: number;
      is_significant_motion: boolean;
    };
    brightness: {
      status: string;
      epoch_a_flux_ujy: number;
      epoch_b_flux_ujy: number;
      absolute_diff_ujy: number;
      percentage_change: number | string;
      delta_magnitude: number | string;
      flux_significance_sigma: number;
      is_significant_variability: boolean;
    };
    spectral: {
      status: string;
      band_a_wavelength_um: number;
      band_b_wavelength_um: number;
      sed_epoch_a: Array<{ wavelength_um: number; flux: number; flux_err: number; feature: string }>;
      sed_epoch_b: Array<{ wavelength_um: number; flux: number; flux_err: number; feature: string }>;
      residuals: Array<{
        wavelength_um: number;
        flux_epoch_a: number;
        flux_epoch_b: number;
        residual_delta: number;
        ratio: number;
        feature?: string;
      }>;
      ice_absorption_candidate: boolean;
    };
    morphology: {
      status: string;
      psf_fwhm_a_arcsec: number;
      psf_fwhm_b_arcsec: number;
      delta_fwhm_arcsec: number;
      flag_a: string;
      flag_b: string;
      quality_state_changed: boolean;
      is_suspected_artifact: boolean;
    };
    summary_narrative: string;
  };
}

export interface EvidenceGraphNode {
  id: string;
  label: string;
  type: string;
  category: string;
  details: string;
  status: string;
}

export interface EvidenceGraphEdge {
  source: string;
  target: string;
  relation: string;
}

export interface EvidenceGraphData {
  object_id: string;
  region_id: string;
  data_provenance: string;
  disclaimer: string;
  graph: {
    nodes: EvidenceGraphNode[];
    edges: EvidenceGraphEdge[];
  };
  traceability_audit: Array<{
    dimension: string;
    algorithm: string;
    measurements_used: string;
    applied_threshold: string;
    residual_uncertainty: string;
    supporting_evidence: string;
    validation_verdict: string;
  }>;
  narrative: string;
  confidence_tier: string;
}
