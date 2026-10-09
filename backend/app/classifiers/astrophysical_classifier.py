"""Astrophysical candidate classification engine with calibrated probabilistic reasoning."""

from typing import Any, Dict, List
import numpy as np

from app.models.schemas import ClassificationHypothesis, DetectorResult, VettingAudit


class AstrophysicalClassifier:
    """Classifies anomalous infrared detections into astrophysical candidate taxonomies.
    
    Provides Bayesian-style multi-hypothesis classification probabilities based on
    astrometric motion vectors, photometric variability, SED color indices, and vetting audits.
    """

    CATEGORIES = [
        ("NEAR_EARTH_OBJECT", "Solar System Moving Object (Asteroid/NEO)"),
        ("VARIABLE_STAR", "Pulsating Variable Star (Mira/Cepheid/YSO)"),
        ("INFRARED_TRANSIENT", "Infrared Transient (Supernova/Nova/TDE)"),
        ("ICE_RICH_CORE", "Ice-Rich Protostellar Core (H2O/CO2 Ice Mantle)"),
        ("AGN_QUASAR", "Active Galactic Nucleus (AGN/Quasar)"),
        ("INSTRUMENTAL_ARTIFACT", "Instrumental Artifact / False Positive"),
        ("STANDARD_STAR", "Standard Photometric / Astrometric Reference Star"),
    ]

    def classify(
        self,
        detector_results: Dict[str, DetectorResult],
        vetting_audit: VettingAudit,
    ) -> List[ClassificationHypothesis]:
        """Compute calibrated probability distribution across astrophysical categories."""
        # Extract detector metrics
        motion_res = detector_results.get("astrometric_motion")
        photo_res = detector_results.get("photometric_variability")
        spec_res = detector_results.get("spectral_anomaly")
        temp_res = detector_results.get("temporal_dynamics")
        context_res = detector_results.get("contextual_outlier")

        motion_score = motion_res.score if motion_res else 0.0
        motion_sig = motion_res.is_significant if motion_res else False
        motion_linear = motion_res.metrics.get("trajectory_linearity", 0.0) if motion_res else 0.0

        photo_score = photo_res.score if photo_res else 0.0
        photo_sig = photo_res.is_significant if photo_res else False
        frac_var = photo_res.metrics.get("fractional_variation", 0.0) if photo_res else 0.0

        spec_score = spec_res.score if spec_res else 0.0
        has_ice = spec_res.metrics.get("has_ice_absorption", False) if spec_res else False

        temp_score = temp_res.score if temp_res else 0.0
        is_transient = temp_res.metrics.get("is_transient_flare_profile", False) if temp_res else False

        if hasattr(vetting_audit, "overall_artifact_probability"):
            art_prob = float(vetting_audit.overall_artifact_probability) / 100.0
            psf_status = getattr(vetting_audit, "psf_consistency", "consistent_stellar_profile")
        elif isinstance(vetting_audit, dict):
            art_prob = float(vetting_audit.get("overall_artifact_probability", 3.5)) / 100.0
            psf_status = vetting_audit.get("psf_consistency", "consistent_stellar_profile")
        else:
            art_prob = 0.035
            psf_status = "consistent_stellar_profile"

        # Unnormalized log-evidence (priors + likelihoods)
        scores = {}

        # 1. Artifact hypothesis
        if art_prob > 0.50 or psf_status == "sub_diffraction_artifact":
            scores["INSTRUMENTAL_ARTIFACT"] = 12.0 * art_prob + 4.0
        else:
            scores["INSTRUMENTAL_ARTIFACT"] = 0.5 + 2.0 * art_prob

        # 2. Near Earth Object (Asteroid)
        if motion_sig and motion_score > 35.0:
            neo_weight = (motion_score / 15.0) + (motion_linear * 4.0)
            if not photo_sig:
                neo_weight += 2.0
            if art_prob > 0.4:
                neo_weight *= 0.3
            scores["NEAR_EARTH_OBJECT"] = max(0.1, neo_weight)
        else:
            scores["NEAR_EARTH_OBJECT"] = 0.2

        # 3. Variable Star
        if photo_sig and not motion_sig and not is_transient:
            var_weight = (photo_score / 15.0) + (frac_var * 6.0)
            if art_prob > 0.4:
                var_weight *= 0.4
            scores["VARIABLE_STAR"] = max(0.1, var_weight)
        else:
            scores["VARIABLE_STAR"] = 0.3

        # 4. Infrared Transient
        if (is_transient or (photo_sig and temp_score > 40.0)) and not motion_sig:
            trans_weight = (temp_score / 16.0) + (photo_score / 20.0)
            if art_prob > 0.4:
                trans_weight *= 0.3
            scores["INFRARED_TRANSIENT"] = max(0.1, trans_weight)
        else:
            scores["INFRARED_TRANSIENT"] = 0.15

        # 5. Ice-Rich Core
        if has_ice or (spec_score > 50.0 and not motion_sig):
            ice_weight = (spec_score / 12.0)
            if has_ice:
                ice_weight += 6.0
            scores["ICE_RICH_CORE"] = max(0.1, ice_weight)
        else:
            scores["ICE_RICH_CORE"] = 0.15

        # 6. AGN / Quasar
        if context_res and context_res.is_significant and photo_sig and not motion_sig:
            agn_weight = (context_res.score / 25.0) + (photo_score / 30.0)
            scores["AGN_QUASAR"] = max(0.1, agn_weight)
        else:
            scores["AGN_QUASAR"] = 0.15

        # 7. Standard Star
        if not motion_sig and not photo_sig and spec_score < 30.0:
            scores["STANDARD_STAR"] = 8.0
        else:
            scores["STANDARD_STAR"] = 0.2

        # Softmax normalization to obtain true probabilities sum(P) = 1.0
        keys = list(scores.keys())
        values = np.array([scores[k] for k in keys], dtype=float)
        # Numerical stability with exp
        exp_vals = np.exp(values - np.max(values))
        probs = exp_vals / np.sum(exp_vals)

        # Build structured output
        hypotheses: List[ClassificationHypothesis] = []
        labels_map = dict(self.CATEGORIES)

        for k, p in zip(keys, probs):
            p_float = float(round(p, 4))
            rationale = self._generate_rationale(k, p_float, detector_results, vetting_audit)
            hypotheses.append(
                ClassificationHypothesis(
                    category=k,
                    label=labels_map.get(k, k),
                    probability=p_float,
                    rationale=rationale,
                )
            )

        # Sort descending by probability
        hypotheses.sort(key=lambda h: h.probability, reverse=True)
        return hypotheses

    def _generate_rationale(
        self,
        category: str,
        prob: float,
        detector_results: Dict[str, DetectorResult],
        vetting_audit: VettingAudit,
    ) -> str:
        pct = f"{prob * 100:.1f}%"
        if category == "NEAR_EARTH_OBJECT":
            motion = detector_results.get("astrometric_motion")
            disp = motion.metrics.get("total_motion_arcsec", 0.0) if motion else 0.0
            return f"{pct} confidence: Exhibits systematic proper motion ({disp:.2f} arcsec) with linear trajectory consistency across survey baseline."
        elif category == "VARIABLE_STAR":
            photo = detector_results.get("photometric_variability")
            var_pct = photo.metrics.get("fractional_variation", 0.0) * 100 if photo else 0.0
            return f"{pct} confidence: Strong photometric flux variation ({var_pct:.1f}%) with astrometrically stationary coordinates."
        elif category == "INFRARED_TRANSIENT":
            return f"{pct} confidence: Temporal derivative and light curve morphology match an explosive or accretion-driven infrared transient outburst."
        elif category == "ICE_RICH_CORE":
            return f"{pct} confidence: Infrared spectrum exhibits molecular ice absorption band profiles at 3.05 um (H2O) and/or 4.27 um (CO2)."
        elif category == "AGN_QUASAR":
            return f"{pct} confidence: Multi-band non-thermal infrared excess and stochastic light curve behavior characteristic of an active galactic nucleus."
        elif category == "INSTRUMENTAL_ARTIFACT":
            return f"{pct} confidence: Artifact probability {vetting_audit.overall_artifact_probability:.0f}%, PSF consistency: {vetting_audit.psf_consistency}."
        else:
            return f"{pct} confidence: Astrometric and photometric behavior is consistent with standard field stars within instrument noise."
