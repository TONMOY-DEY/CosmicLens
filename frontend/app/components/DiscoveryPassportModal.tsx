'use client';

import React, { useState } from 'react';
import { ScientificDiscoveryPassport } from '../lib/types';

interface DiscoveryPassportModalProps {
  passport: ScientificDiscoveryPassport | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReport?: () => void;
}

export default function DiscoveryPassportModal({
  passport,
  isOpen,
  onClose,
  onOpenReport,
}: DiscoveryPassportModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'quality' | 'catalog' | 'fits' | 'json'>('profile');

  if (!isOpen || !passport) return null;

  const p = passport;
  const analysis = p.analysis;

  const handleCopyFits = () => {
    if (p.fits_header_card) {
      navigator.clipboard.writeText(p.fits_header_card);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(passport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${passport.passport_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const isHigh = analysis.scientific_priority === 'HIGH';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#030d17] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Synthetic Data Guardrail Banner */}
        <div className="bg-amber-950/70 border border-amber-500/40 px-3 py-1.5 rounded-xl text-center text-xs font-mono font-bold text-amber-300">
          ⚠ {p.disclaimer}
        </div>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-cyan-500/20 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono">
                NASA Space Apps Scientific Discovery Passport
              </span>
              <span
                className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-mono font-bold ${
                  isHigh
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                }`}
              >
                PRIORITY: {analysis.scientific_priority}
              </span>
            </div>
            <h2 className="text-xl font-bold font-mono text-cyan-100 mt-1">
              {p.source_identity.source_id}
              {p.source_identity.iau_designation && (
                <span className="text-xs text-cyan-400 font-normal ml-2 font-mono">
                  ({p.source_identity.iau_designation})
                </span>
              )}
            </h2>
            <p className="text-xs font-mono text-cyan-400/70">Passport ID: {p.passport_id}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-cyan-500/15 pb-2 text-xs font-mono">
          {[
            { key: 'profile', label: 'Scientific Profile' },
            { key: 'quality', label: 'False-Alarm & Quality' },
            { key: 'catalog', label: 'Catalog Cross-Check' },
            { key: 'fits', label: 'FITS Header Card' },
            { key: 'json', label: 'Raw JSON Schema' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === tab.key
                  ? 'bg-cyan-500 text-black font-bold shadow-md'
                  : 'text-cyan-400 hover:text-white bg-cyan-950/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Scientific Profile */}
        {activeTab === 'profile' && (
          <div className="flex flex-col gap-4 text-xs font-mono">
            {/* Score Grid: Separates Interestingness vs Confidence */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-black/30 p-2.5 rounded-xl border border-cyan-500/15">
                <span className="block text-[10px] text-cyan-400/60 uppercase">Scientific Interestingness</span>
                <span className="text-amber-400 font-bold text-base">
                  {analysis.interestingness_score.toFixed(1)} / 100
                </span>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-cyan-500/15">
                <span className="block text-[10px] text-cyan-400/60 uppercase">Evidence Confidence</span>
                <span className="text-cyan-300 font-bold text-base">
                  {analysis.evidence_confidence.numeric_value.toFixed(0)}% ({analysis.evidence_confidence.tier})
                </span>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-cyan-500/15">
                <span className="block text-[10px] text-cyan-400/60 uppercase">Observation Span</span>
                <span className="text-cyan-100 font-bold">{p.source_identity.usable_epoch_count} epochs</span>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-cyan-500/15">
                <span className="block text-[10px] text-cyan-400/60 uppercase">Coordinates</span>
                <span className="text-cyan-100 font-bold">
                  {p.source_identity.ra_mean_deg?.toFixed(4)}°, {p.source_identity.dec_mean_deg?.toFixed(4)}°
                </span>
              </div>
            </div>

            {/* Evidence summary */}
            <div className="bg-black/30 p-3.5 rounded-2xl border border-cyan-500/15">
              <h4 className="text-[11px] uppercase text-cyan-300 font-bold mb-2">Evidence-Linked Explanations</h4>
              <ul className="space-y-1.5 text-cyan-100">
                {analysis.why_interesting.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Astrometry & Photometry side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-black/30 p-3 rounded-2xl border border-cyan-500/15">
                <h4 className="text-[11px] uppercase text-cyan-400 font-bold mb-2">Position & Motion</h4>
                <p className="text-cyan-200">
                  Total Displacement: <strong className="text-white">{p.position_and_motion.total_motion_arcsec.toFixed(2)}&quot;</strong>
                </p>
                <p className="text-cyan-200">
                  Apparent Speed: <strong className="text-white">{p.position_and_motion.apparent_speed_arcsec_yr.toFixed(1)}&quot;/yr</strong>
                </p>
                <p className="text-cyan-400/70 text-[11px] mt-1">{p.position_and_motion.assessment}</p>
              </div>

              <div className="bg-black/30 p-3 rounded-2xl border border-cyan-500/15">
                <h4 className="text-[11px] uppercase text-cyan-400 font-bold mb-2">Photometric Light Curve</h4>
                <p className="text-cyan-200">
                  Fractional Variability: <strong className="text-white">{(p.photometry.fractional_variability * 100).toFixed(1)}%</strong>
                </p>
                <p className="text-cyan-200">
                  Reduced χ²: <strong className="text-white">{p.photometry.reduced_chi_squared.toFixed(1)}</strong>
                </p>
                <p className="text-cyan-400/70 text-[11px] mt-1">{p.photometry.assessment}</p>
              </div>
            </div>

            {/* Follow-up suggestions */}
            <div className="bg-black/30 p-3.5 rounded-2xl border border-cyan-500/15">
              <h4 className="text-[11px] uppercase text-amber-300 font-bold mb-2">Follow-Up Suggestions</h4>
              <ul className="space-y-1 text-cyan-200">
                {p.follow_up_suggestions.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: False-Alarm & Quality Checks */}
        {activeTab === 'quality' && (
          <div className="flex flex-col gap-3 text-xs font-mono">
            <div className="bg-black/30 p-3 rounded-2xl border border-cyan-500/15">
              <span className="block text-[10px] text-cyan-400/60 uppercase">Overall Assessment</span>
              <p className="text-cyan-100 font-bold mt-1">{p.false_alarm_investigation.assessment}</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-cyan-500/15">
              <table className="w-full text-left">
                <thead className="bg-[#071726] border-b border-cyan-500/20 text-cyan-400">
                  <tr>
                    <th className="p-2.5">Check Name</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Findings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10">
                  {p.false_alarm_investigation.checks.map((chk, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold text-cyan-200">{chk.name}</td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            chk.status === 'PASS'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : chk.status === 'CAUTION'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {chk.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-cyan-100/90">{chk.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-black/30 p-3 rounded-2xl border border-cyan-500/15">
              <h4 className="text-[11px] uppercase text-cyan-400 font-bold mb-1">Possible Alternative Explanations</h4>
              <ul className="space-y-1 text-cyan-200">
                {p.false_alarm_investigation.possible_alternatives.map((alt, idx) => (
                  <li key={idx}>• {alt}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Tab 3: Catalog Cross-Check */}
        {activeTab === 'catalog' && (
          <div className="flex flex-col gap-3 text-xs font-mono">
            <div className="bg-black/30 p-3 rounded-2xl border border-cyan-500/15">
              <div className="flex justify-between items-center">
                <span className="text-cyan-300 font-bold">Query Status:</span>
                <span
                  className={`px-2.5 py-1 rounded text-xs font-bold ${
                    p.known_object_cross_check.status === 'MATCH FOUND'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                  }`}
                >
                  {p.known_object_cross_check.status}
                </span>
              </div>
              <p className="text-[11px] text-cyan-400/70 mt-1">
                Catalogs queried: {p.known_object_cross_check.catalogs_checked.join(', ')} (Search radius: {p.known_object_cross_check.search_radius_arcsec.toFixed(1)}&quot;)
              </p>
            </div>

            {p.known_object_cross_check.matches.length > 0 ? (
              <div className="bg-black/30 p-3 rounded-2xl border border-cyan-500/15">
                <h4 className="text-[11px] uppercase text-cyan-400 font-bold mb-2">Detected Counterparts</h4>
                <ul className="space-y-2 text-cyan-200">
                  {p.known_object_cross_check.matches.map((m, idx) => (
                    <li key={idx} className="bg-black/40 p-2 rounded-lg border border-cyan-500/10">
                      <strong>{m.catalog}:</strong> {m.counterpart_id} (Separation: {m.angular_separation_arcsec}&quot;)
                      {m.notes && <p className="text-[11px] text-cyan-400/80 mt-0.5">{m.notes}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-black/30 border border-cyan-500/15 text-center text-cyan-400/80">
                No matching counterparts found within {p.known_object_cross_check.search_radius_arcsec.toFixed(1)}&quot; radius.
              </div>
            )}

            <div className="bg-cyan-950/20 p-3 rounded-xl border border-cyan-500/20 text-[11px] text-cyan-400/80 italic">
              ⚠ {p.known_object_cross_check.limitations}
            </div>
          </div>
        )}

        {/* Tab 4: FITS Header Card */}
        {activeTab === 'fits' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400/70">Standard 80-character astronomical FITS header card</span>
              <button
                onClick={handleCopyFits}
                className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs font-mono"
              >
                {copied ? '✓ COPIED!' : 'COPY FITS HEADER'}
              </button>
            </div>
            <pre className="bg-[#02070e] p-4 rounded-xl border border-cyan-500/30 text-[11px] font-mono text-cyan-200 overflow-x-auto select-all">
              {p.fits_header_card}
            </pre>
          </div>
        )}

        {/* Tab 5: Raw JSON Schema */}
        {activeTab === 'json' && (
          <div className="flex flex-col gap-3">
            <pre className="bg-[#02070e] p-4 rounded-xl border border-cyan-500/30 text-[11px] font-mono text-cyan-200 max-h-72 overflow-y-auto select-all">
              {JSON.stringify(passport, null, 2)}
            </pre>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-cyan-500/20">
          {onOpenReport && (
            <button
              onClick={onOpenReport}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-black font-mono text-xs font-bold hover:opacity-90 transition-all shadow-md flex items-center gap-1.5"
            >
              <span>📄</span>
              <span>GENERATE HTML DISCOVERY REPORT</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleDownloadJson}
              className="px-4 py-2 rounded-xl bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 font-mono text-xs"
            >
              DOWNLOAD JSON
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-black/40 text-cyan-400 hover:text-white font-mono text-xs"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
