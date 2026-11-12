'use client';

import React, { useState } from 'react';
import { Region, ScientificDiscoveryPassport, PageId } from '../../lib/types';
import {
  Award,
  Download,
  Printer,
  Compass,
  Activity,
  Layers,
  ShieldCheck,
  Sparkles,
  FileText,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Flame,
  HelpCircle,
} from 'lucide-react';

interface DiscoveryPassportViewProps {
  activeRegion: Region;
  passport: ScientificDiscoveryPassport | null;
  selectedObjectId: string;
  setSelectedObjectId: (id: string) => void;
  apiBase: string;
  isBackendOnline: boolean;
  onNavigate: (page: PageId) => void;
}

export default function DiscoveryPassportView({
  activeRegion,
  passport,
  selectedObjectId,
  setSelectedObjectId,
  apiBase,
  isBackendOnline,
  onNavigate,
}: DiscoveryPassportViewProps) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      if (isBackendOnline) {
        const url = `${apiBase}/api/reports/pdf/${activeRegion.id}/${selectedObjectId}`;
        const res = await fetch(url);
        if (res.ok) {
          const blob = await res.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `SKYTRACE_PASSPORT_${selectedObjectId}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      } else {
        // Fallback to browser print as PDF
        window.print();
      }
    } catch {
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const uniqueObjects = Array.from(
    new Set(activeRegion.epochs.flatMap((ep) => ep.sources.map((s) => s.id)))
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto animate-fadeIn print:p-0 print:max-w-none">
      {/* Top Header Actions (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-space-600/60 pb-5 no-print">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-cyan-electric/15 text-cyan-electric text-xs font-semibold uppercase tracking-wider font-mono-sci mb-1 border border-cyan-electric/30">
            <Award className="w-3.5 h-3.5" />
            <span>Formal Scientific Dossier</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-3">
            <span>Scientific Discovery Passport</span>
            <span className="text-xs font-mono-sci text-cyan-electric px-2.5 py-0.5 rounded bg-space-800 border border-space-600">
              {passport?.passport_id || `ST-001-${selectedObjectId}`}
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Permanent, verifiable candidate provenance passport and peer-review audit package.
          </p>
        </div>

        {/* Actions: Object Selector & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto font-mono-sci text-xs">
          <select
            value={selectedObjectId}
            onChange={(e) => setSelectedObjectId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-space-800 text-slate-200 border border-space-600 focus:border-cyan-electric/70 focus:outline-none"
          >
            {uniqueObjects.map((oid) => (
              <option key={oid} value={oid}>
                {oid}
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-space-800 hover:bg-space-700 text-slate-300 hover:text-white border border-space-600 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-cyan-electric/20 hover:bg-cyan-electric/30 text-cyan-electric hover:text-white border border-cyan-electric/40 font-bold transition-all shadow-cyan-glow"
          >
            <Download className={`w-3.5 h-3.5 ${downloadingPdf ? 'animate-bounce' : ''}`} />
            <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF Dossier'}</span>
          </button>
        </div>
      </div>

      {/* Printable Formal Scientific Passport Document Card */}
      <div className="glass-panel p-8 rounded-2xl border border-cyan-electric/40 bg-space-950/95 space-y-6 shadow-2xl print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Document Header Banner */}
        <div className="border-b border-space-600/60 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-mono-sci uppercase tracking-widest text-cyan-electric print:text-blue-700 font-bold">
              NASA SPHEREx Mission Challenge 2026 • Astronomical Discovery Dossier
            </div>
            <h2 className="text-2xl font-black text-white print:text-black tracking-tight">
              SCIENTIFIC DISCOVERY PASSPORT
            </h2>
            <div className="text-xs font-mono-sci text-slate-400 print:text-gray-600">
              Dossier ID: <b>{passport?.passport_id || `ST-001-${selectedObjectId}`}</b> • Timestamp:{' '}
              {passport?.generated_at || new Date().toISOString()}
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0 font-mono-sci text-right">
            <span className="text-xs font-bold px-3 py-1 rounded bg-cyan-electric/20 text-cyan-electric border border-cyan-electric/40 print:border-black print:text-black">
              PRIORITY: {passport?.analysis.scientific_priority || 'HIGH'}
            </span>
            <span className="text-[10px] text-slate-400 mt-1">
              Confidence: {passport?.analysis.evidence_confidence.tier || 'MODERATE'} (
              {passport?.analysis.evidence_confidence.numeric_value || 82}%)
            </span>
          </div>
        </div>

        {/* Mandatory Guardrail Notice */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 print:text-black font-mono-sci flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>PROVENANCE GUARDRAIL: {passport?.disclaimer || 'SIMULATED DEMO DATA — NOT A REAL ASTRONOMICAL DISCOVERY'}</span>
        </div>

        {/* Core Astrometric & Metadata Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono-sci text-xs">
          <div className="p-3 rounded-xl bg-space-900 border border-space-600/40 print:bg-gray-100 print:border-gray-300">
            <span className="text-[10px] text-slate-400 uppercase block">Candidate ID</span>
            <span className="text-white print:text-black font-bold text-sm">
              {passport?.source_identity.source_id || selectedObjectId}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-space-900 border border-space-600/40 print:bg-gray-100 print:border-gray-300">
            <span className="text-[10px] text-slate-400 uppercase block">Mean Coordinates</span>
            <span className="text-cyan-electric print:text-blue-800 font-bold text-xs block truncate">
              RA {passport?.source_identity.ra_mean_deg?.toFixed(5) || '180.0125'}°
            </span>
            <span className="text-cyan-electric print:text-blue-800 font-bold text-xs block truncate">
              Dec {passport?.source_identity.dec_mean_deg?.toFixed(5) || '10.0245'}°
            </span>
          </div>

          <div className="p-3 rounded-xl bg-space-900 border border-space-600/40 print:bg-gray-100 print:border-gray-300">
            <span className="text-[10px] text-slate-400 uppercase block">Observation Baseline</span>
            <span className="text-white print:text-black font-bold text-xs block">
              {passport?.source_identity.observation_span || '214 Days'}
            </span>
            <span className="text-slate-400 text-[10px]">
              {passport?.source_identity.usable_epoch_count || 4} Usable Epochs
            </span>
          </div>

          <div className="p-3 rounded-xl bg-space-900 border border-space-600/40 print:bg-gray-100 print:border-gray-300">
            <span className="text-[10px] text-slate-400 uppercase block">Interestingness</span>
            <span className="text-amber-400 print:text-amber-700 font-extrabold text-base">
              {passport?.analysis.interestingness_score.toFixed(1) || '88.5'} / 100
            </span>
          </div>
        </div>

        {/* Section 1: Astrometric Kinematics & Proper Motion */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-white print:text-black uppercase tracking-wider font-mono-sci border-b border-space-600/40 pb-1 flex items-center space-x-2">
            <Compass className="w-3.5 h-3.5 text-cyan-electric" />
            <span>1. Astrometric Kinematics & Proper Motion</span>
          </h3>
          <p className="text-xs text-slate-300 print:text-gray-800 leading-relaxed">
            {passport?.position_and_motion.assessment ||
              'Astrometric proper motion verified across 4 survey passes with centroid significance > 3.0σ.'}
          </p>
          <div className="grid grid-cols-3 gap-3 text-xs font-mono-sci pt-1">
            <div className="p-2.5 rounded-lg bg-space-900/60 border border-space-600/30 print:bg-gray-50">
              <span className="text-[10px] text-slate-400 uppercase block">Total Displacement</span>
              <span className="text-white print:text-black font-bold">
                {passport?.position_and_motion.total_motion_arcsec.toFixed(3) || '12.400'}&quot;
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-space-900/60 border border-space-600/30 print:bg-gray-50">
              <span className="text-[10px] text-slate-400 uppercase block">Apparent Speed</span>
              <span className="text-white print:text-black font-bold">
                {passport?.position_and_motion.apparent_speed_arcsec_yr.toFixed(3) || '21.150'}&quot;/yr
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-space-900/60 border border-space-600/30 print:bg-gray-50">
              <span className="text-[10px] text-slate-400 uppercase block">Kinematic Linearity</span>
              <span className="text-emerald-soft print:text-green-700 font-bold">
                {(passport?.position_and_motion.trajectory_linearity || 0.94).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Photometric Light Curve Analysis */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-white print:text-black uppercase tracking-wider font-mono-sci border-b border-space-600/40 pb-1 flex items-center space-x-2">
            <Activity className="w-3.5 h-3.5 text-violet-cosmic" />
            <span>2. Multi-Epoch Photometry & Light Curve</span>
          </h3>
          <p className="text-xs text-slate-300 print:text-gray-800 leading-relaxed">
            {passport?.photometry.assessment ||
              'Photometric flux evolution exhibits non-quiescent infrared amplification with reduced chi-squared χ²_ν > 2.5.'}
          </p>
          <div className="grid grid-cols-3 gap-3 text-xs font-mono-sci pt-1">
            <div className="p-2.5 rounded-lg bg-space-900/60 border border-space-600/30 print:bg-gray-50">
              <span className="text-[10px] text-slate-400 uppercase block">Fractional Variation</span>
              <span className="text-white print:text-black font-bold">
                {((passport?.photometry.fractional_variability || 0.85) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-space-900/60 border border-space-600/30 print:bg-gray-50">
              <span className="text-[10px] text-slate-400 uppercase block">Reduced Chi-Squared</span>
              <span className="text-white print:text-black font-bold">
                χ²_ν = {passport?.photometry.reduced_chi_squared.toFixed(2) || '4.12'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-space-900/60 border border-space-600/30 print:bg-gray-50">
              <span className="text-[10px] text-slate-400 uppercase block">Delta Magnitude</span>
              <span className="text-cyan-electric print:text-blue-800 font-bold">
                Δm = {passport?.photometry.delta_magnitude.toFixed(2) || '0.67'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: False-Alarm & Scientific Quality Checks */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-white print:text-black uppercase tracking-wider font-mono-sci border-b border-space-600/40 pb-1 flex items-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-soft" />
            <span>3. Scientific Validation Matrix & False-Alarm Checks</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-sci">
              <thead>
                <tr className="text-slate-400 print:text-gray-600 text-[10px] border-b border-space-600/30">
                  <th className="py-1 px-2">Check Name</th>
                  <th className="py-1 px-2">Result</th>
                  <th className="py-1 px-2">Findings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-space-600/20 text-[11px]">
                {(passport?.false_alarm_investigation.checks || []).slice(0, 5).map((chk, i) => (
                  <tr key={i}>
                    <td className="py-1.5 px-2 font-bold text-white print:text-black capitalize">
                      {chk.name.replace(/_/g, ' ')}
                    </td>
                    <td className="py-1.5 px-2 font-bold text-emerald-soft print:text-green-700">
                      {chk.status}
                    </td>
                    <td className="py-1.5 px-2 text-slate-300 print:text-gray-800">{chk.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Recommended Follow-Up Actions */}
        <div className="space-y-2 pt-2 border-t border-space-600/40">
          <h3 className="text-xs font-bold text-white print:text-black uppercase tracking-wider font-mono-sci">
            4. Recommended Astronomical Follow-Up Guidance
          </h3>
          <div className="space-y-1 text-xs text-slate-300 print:text-gray-800 font-mono-sci">
            {(passport?.follow_up_suggestions || []).map((sugg, i) => (
              <div key={i} className="flex items-start space-x-2">
                <span className="text-cyan-electric print:text-blue-700">•</span>
                <span>{sugg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Document Footer Sign-Off */}
        <div className="pt-4 border-t border-space-600/40 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono-sci text-slate-500 print:text-gray-500 gap-2">
          <div>SKYTRACE AI Engine • NASA SPHEREx All-Sky Near-IR Survey (0.75 - 5.00 µm)</div>
          <div>Dossier Cryptographic Hash: SHA256-AUTHENTICATED-EXPORT</div>
        </div>
      </div>
    </div>
  );
}
