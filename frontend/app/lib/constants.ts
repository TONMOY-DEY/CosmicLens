/**
 * Shared labels, scoring weights, and UI copy for SKYTRACE AI.
 * Re-exports disclaimer/version from types.ts so there is one string of truth.
 */

import {
  ALGORITHM_VERSION,
  AnomalyDimension,
  DEFAULT_CANDIDATE_FILTERS,
  DISCLAIMER_TEXT,
  EvidenceConfidenceTier,
  ReviewVerdict,
  ScientificPriority,
} from './types';

export { ALGORITHM_VERSION, DEFAULT_CANDIDATE_FILTERS, DISCLAIMER_TEXT };

export const APP_NAME = 'SKYTRACE AI';
export const APP_TAGLINE =
  'An Explainable AI Scientific Discovery Engine for the Changing Infrared Sky.';
export const CHALLENGE_LABEL = 'NASA Space Apps Challenge 2026';

/**
 * Demo detector weights (hackathon assumptions, not universal science).
 * Keys match clientEngine.DEFAULT_WEIGHTS so later files can share one object.
 */
export const DEFAULT_WEIGHTS: Record<string, number> = {
  astrometric_motion: 0.3,
  photometric_variability: 0.25,
  spectral_anomaly: 0.2,
  temporal_dynamics: 0.15,
  contextual_outlier: 0.1,
};

export const DIMENSION_WEIGHT_KEYS: Record<AnomalyDimension, string> = {
  motion: 'astrometric_motion',
  photometry: 'photometric_variability',
  spectral: 'spectral_anomaly',
  temporal: 'temporal_dynamics',
  context: 'contextual_outlier',
};

export const ANOMALY_DIMENSION_LABELS: Record<AnomalyDimension, string> = {
  motion: 'Astrometry / Motion',
  photometry: 'Photometry',
  spectral: 'Spectral / SED',
  temporal: 'Temporal',
  context: 'Context',
};

export const PRIORITY_LABELS: Record<ScientificPriority, string> = {
  HIGH: 'High',
  MODERATE: 'Moderate',
  LOW: 'Low',
  UNASSESSED: 'Unassessed',
};

export const CONFIDENCE_TIER_LABELS: Record<EvidenceConfidenceTier, string> = {
  LOW: 'Low',
  MODERATE: 'Moderate',
  HIGH: 'High',
  'INSUFFICIENT DATA': 'Insufficient data',
};

export const REVIEW_VERDICT_LABELS: Record<ReviewVerdict, string> = {
  UNREVIEWED: 'Unreviewed',
  KEEP: 'Keep for follow-up',
  REJECT: 'Reject as false alarm',
  NEEDS_FOLLOW_UP: 'Needs follow-up',
};

/** Category keys already used by DiscoveryCatalogTable. */
export const CANDIDATE_CATEGORY_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'All Sources' },
  { key: 'HIGH_PRIORITY', label: 'High Priority' },
  { key: 'NEO', label: 'Moving Objects' },
  { key: 'VARIABLE', label: 'Variable Stars' },
  { key: 'TRANSIENT', label: 'Transients' },
  { key: 'ICE', label: 'Ice Cores' },
  { key: 'ARTIFACT', label: 'Artifacts' },
];

/**
 * Catalog names shown in the mock cross-match UI.
 * These are labels only — not live query endpoints.
 */
export const MOCK_CATALOG_LABELS = ['Gaia DR3', '2MASS'] as const;

/**
 * Placeholder release string for the archive adapter UI.
 * Not a claim about an official SPHEREx data release name.
 */
export const MOCK_ARCHIVE_RELEASE_LABEL = 'UNVERIFIED_DEMO_RELEASE';

export const OPTIONAL_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
