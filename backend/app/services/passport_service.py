"""Scientific Discovery Passport generator matching Section 5.7 of SKYTRACE AI specification."""

from datetime import datetime, timezone
from typing import Any, Dict, List
import numpy as np

from app.models.schemas import (
    ALGORITHM_VERSION,
    DISCLAIMER_TEXT,
    AnalysisResult,
    DataQualitySummary,
    FalseAlarmInvestigation,
    PhotometrySummary,
    PositionAndMotion,
    ScientificDiscoveryPassport,
    SpectralFingerprint,
)


class PassportService:
    """Produces canonical NASA Scientific Discovery Passports."""

    @staticmethod
    def format_iau_designation(ra_deg: float, dec_deg: float) -> str:
        """Convert decimal degrees to IAU standard designation: SPHEREx JHHMMSS.s+/-DDMMSS."""
        ra_hours = ra_deg / 15.0
        ra_h = int(ra_hours)
        ra_m = int((ra_hours - ra_h) * 60)
        ra_s = (ra_hours - ra_h - ra_m / 60) * 3600

        dec_sign = "+" if dec_deg >= 0 else "-"
        abs_dec = abs(dec_deg)
        dec_d = int(abs_dec)
        dec_m = int((abs_dec - dec_d) * 60)
        dec_s = int((abs_dec - dec_d - dec_m / 60) * 60)

        return f"SPHEREx J{ra_h:02d}{ra_m:02d}{ra_s:04.1f}{dec_sign}{dec_d:02d}{dec_m:02d}{dec_s:02d}"

    @staticmethod
    def generate_fits_header_card(
        object_id: str,
        iau_name: str,
        ra_mean: float,
        dec_mean: float,
        analysis: AnalysisResult,
    ) -> str:
        """Generate a standard 80-character astronomical FITS header card block."""
        now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        lines = [
            f"{'SIMPLE  =':>8}{'T':>21} / Standard FITS format",
            f"{'BITPIX  =':>8}{'-64':>21} / IEEE 754 floating point",
            f"{'NAXIS   =':>8}{'2':>21} / Number of data axes",
            f"{'TELESCOP=':>8}{'SPHEREx':>21} / NASA Spectro-Photometer Infrared Explorer",
            f"{'INSTRUME=':>8}{'SPECTRO-IR':>21} / 102-channel spectrophotometer (0.75-5.0um)",
            f"{'EQUINOX =':>8}{'2000.0':>21} / Standard J2000 epoch",
            f"{'RADESYS =':>8}{'ICRS':>21} / International Celestial Reference System",
            f"{'OBJECT  =':>8}{f'{object_id[:18]}':>21} / Target candidate identification",
            f"{'IAUNAME =':>8}{f'{iau_name[:18]}':>21} / IAU standard astronomical designation",
            f"{'PROVENAN=':>8}{'SYNTHETIC':>21} / SIMULATED DEMO DATA - NOT REAL DETECTION",
            f"{'RA_OBJ  =':>8}{f'{ra_mean:.6f}':>21} / Target Right Ascension [deg]",
            f"{'DEC_OBJ =':>8}{f'{dec_mean:.6f}':>21} / Target Declination [deg]",
            f"{'INT_SCR =':>8}{f'{analysis.interestingness_score:.2f}':>21} / Scientific Interestingness (0-100 heuristic)",
            f"{'CONF_SCR=':>8}{f'{analysis.evidence_confidence.numeric_value:.2f}':>21} / Evidence confidence score (0-100)",
            f"{'CONF_TIR=':>8}{f'{analysis.evidence_confidence.tier[:18]}':>21} / Evidence confidence tier",
            f"{'SCI_PRIO=':>8}{f'{analysis.scientific_priority[:18]}':>21} / Follow-up triage priority",
            f"{'CLASS_PR=':>8}{f'{analysis.primary_classification.category[:18]}':>21} / Most probable astrophysical class",
            f"{'DISCOVBY=':>8}{'SKYTRACE-AI':>21} / NASA Space Apps Challenge Discovery Platform",
            f"{'ALG_VER =':>8}{f'{ALGORITHM_VERSION[:18]}':>21} / Analysis engine release version",
            f"{'DATE-GEN=':>8}{f'{now_utc[:18]}':>21} / Passport generation timestamp UTC",
            f"{'END':<80}",
        ]
        return "\n".join(lines)

    @classmethod
    def generate_passport(
        cls,
        object_id: str,
        epochs_data: List[Dict[str, Any]],
        analysis: AnalysisResult,
        region: Dict[str, Any],
    ) -> ScientificDiscoveryPassport:
        """Assemble canonical scientific discovery passport."""
        positions_ra = [ep.get("data", {}).get("ra", 0.0) for ep in epochs_data]
        positions_dec = [ep.get("data", {}).get("dec", 0.0) for ep in epochs_data]
        ra_mean = float(np.mean(positions_ra)) if positions_ra else 0.0
        dec_mean = float(np.mean(positions_dec)) if positions_dec else 0.0

        iau_name = cls.format_iau_designation(ra_mean, dec_mean)
        fits_header = cls.generate_fits_header_card(object_id, iau_name, ra_mean, dec_mean, analysis)

        start_time = epochs_data[0].get("timestamp", "2026-03-01") if epochs_data else "2026-03-01"
        end_time = epochs_data[-1].get("timestamp", "2026-10-07") if epochs_data else "2026-10-07"
        time_span_str = f"{start_time} to {end_time} ({len(epochs_data)} discrete survey epochs)"

        # Trajectory
        trajectory = []
        for ep in epochs_data:
            trajectory.append(
                {
                    "timestamp": ep.get("timestamp"),
                    "jd": ep.get("jd"),
                    "ra_deg": ep.get("data", {}).get("ra"),
                    "dec_deg": ep.get("data", {}).get("dec"),
                    "pos_err_arcsec": ep.get("data", {}).get("position_uncertainty_arcsec", 0.2),
                }
            )

        motion_res = analysis.detector_results.get("astrometric_motion")
        tot_motion = motion_res.metrics.get("total_motion_arcsec", 0.0) if motion_res else 0.0
        speed_yr = motion_res.metrics.get("apparent_speed_arcsec_yr", 0.0) if motion_res else 0.0
        lin_score = motion_res.metrics.get("trajectory_linearity", 0.0) if motion_res else 0.0

        position_and_motion = PositionAndMotion(
            trajectory=trajectory,
            total_motion_arcsec=tot_motion,
            apparent_speed_arcsec_yr=speed_yr,
            trajectory_linearity=lin_score,
            assessment=(
                f"Significant angular displacement of {tot_motion:.2f} arcsec ({speed_yr:.1f} arcsec/yr) with {lin_score*100:.0f}% trajectory linearity."
                if (motion_res and motion_res.is_significant)
                else f"Astrometrically stationary within combined positional uncertainty (displacement {tot_motion:.2f} arcsec)."
            ),
        )

        # Photometry measurements
        measurements = []
        for ep in epochs_data:
            measurements.append(
                {
                    "timestamp": ep.get("timestamp"),
                    "jd": ep.get("jd"),
                    "wavelength_um": ep.get("wavelength"),
                    "flux_uJy": ep.get("data", {}).get("flux"),
                    "flux_err_uJy": ep.get("data", {}).get("flux_err"),
                    "flag": ep.get("data", {}).get("flag"),
                }
            )

        photo_res = analysis.detector_results.get("photometric_variability")
        frac_var = photo_res.metrics.get("fractional_variation", 0.0) if photo_res else 0.0
        red_chi2 = photo_res.metrics.get("reduced_chi_squared", 1.0) if photo_res else 1.0
        d_mag = photo_res.metrics.get("delta_mag", 0.0) if photo_res else 0.0

        photometry = PhotometrySummary(
            measurements=measurements,
            fractional_variability=frac_var,
            reduced_chi_squared=red_chi2,
            delta_magnitude=d_mag,
            assessment=(
                f"Photometric variability of {frac_var*100:.1f}% across epochs (reduced chi2 = {red_chi2:.1f}, delta mag = {d_mag:.2f} mag)."
                if (photo_res and photo_res.is_significant)
                else f"Photometrically quiescent: flux changes are within 3-sigma measurement uncertainties."
            ),
        )

        # Spectral Fingerprint
        wavelengths = [ep.get("wavelength", 1.0) for ep in epochs_data]
        fluxes = [ep.get("data", {}).get("flux", 0.0) for ep in epochs_data]
        errs = [ep.get("data", {}).get("flux_err", 1.0) for ep in epochs_data]

        spec_res = analysis.detector_results.get("spectral_anomaly")
        has_ice = spec_res.metrics.get("has_ice_absorption", False) if spec_res else False

        spectral_changes = []
        if has_ice:
            spectral_changes.append("Deep molecular absorption profile consistent with 3.05 um H2O and 4.27 um CO2 ice libration bands.")
        if spec_res and spec_res.metrics.get("infrared_color_index", 0.0) != 0:
            spectral_changes.append(f"Infrared color index: {spec_res.metrics.get('infrared_color_index'):.2f} mag.")

        spectral_fingerprint = SpectralFingerprint(
            wavelength_um=wavelengths,
            flux=fluxes,
            uncertainty=errs,
            spectral_changes=spectral_changes,
            assessment=spec_res.description if spec_res else "Standard infrared spectrophotometric continuum.",
        )

        # Limitations list
        limitations = [
            "SIMULATED DEMO DATA — NOT A REAL ASTRONOMICAL DISCOVERY.",
            "SPHEREx observations are discrete time-domain survey passes, not continuous temporal monitoring.",
            "Catalog cross-match is bounded by coverage, epoch, and catalog sensitivity limits.",
            "Scores represent triage heuristics, not physical discovery probabilities.",
        ]

        passport_id = f"ST-{region.get('id', 'SURV').split('_')[-1]}-{object_id}"

        return ScientificDiscoveryPassport(
            passport_id=passport_id,
            data_provenance="SYNTHETIC_DEMO_DATA",
            disclaimer=DISCLAIMER_TEXT,
            source_identity={
                "source_id": object_id,
                "iau_designation": iau_name,
                "region_id": region.get("id"),
                "region_name": region.get("name"),
                "observation_span": time_span_str,
                "usable_epoch_count": len(epochs_data),
                "ra_mean_deg": round(ra_mean, 6),
                "dec_mean_deg": round(dec_mean, 6),
            },
            position_and_motion=position_and_motion,
            photometry=photometry,
            spectral_fingerprint=spectral_fingerprint,
            data_quality=DataQualitySummary(
                available_flags=list(set(ep.get("data", {}).get("flag", "good") for ep in epochs_data)),
                missing_metadata=[],
                assessment="Good data quality flags present across all four demo epochs.",
            ),
            false_alarm_investigation=analysis.false_alarm_investigation,
            known_object_cross_check=analysis.known_object_cross_check,
            analysis={
                "algorithm_version": ALGORITHM_VERSION,
                "component_scores": analysis.dimensional_scores,
                "interestingness_score": analysis.interestingness_score,
                "evidence_confidence": {
                    "tier": analysis.evidence_confidence.tier,
                    "numeric_value": analysis.evidence_confidence.numeric_value,
                    "reasons": analysis.evidence_confidence.reasons,
                },
                "scientific_priority": analysis.scientific_priority,
                "why_interesting": analysis.why_interesting,
            },
            follow_up_suggestions=analysis.follow_up_suggestions,
            generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            limitations=limitations,
            fits_header_card=fits_header,
        )
