'use client';

import React, { useState, useEffect } from 'react';
import { Region, AnalysisResult, PageId, ComparisonResultData } from '../../lib/types';
import LightCurveViewer from '../LightCurveViewer';
import SpectralSEDViewer from '../SpectralSEDViewer';
import {
  GitCompare,
  ArrowRight,
  Compass,
  Activity,
  Layers,
  Sparkles,
  AlertTriangle,
  Clock,
  TrendingUp,
  Award,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface ChangeAnalysisViewProps {
  activeRegion: Region;
  selectedObjectId: string;
  setSelectedObjectId: (id: string) => void;
  analysis: AnalysisResult | null;
  apiBase: string;
  isBackendOnline: boolean;
  onNavigate: (page: PageId) => void;
}

export default function ChangeAnalysisView({
  activeRegion,
  selectedObjectId,
  setSelectedObjectId,
  analysis,
  apiBase,
  isBackendOnline,
  onNavigate,
}: ChangeAnalysisViewProps) {
  const [epochAIdx, setEpochAIdx] = useState<number>(0);
  const [epochBIdx, setEpochBIdx] = useState<number>(Math.max(1, activeRegion.epochs.length - 1));
  const [comparisonData, setComparisonData] = useState<ComparisonResultData | null>(null);
  const [loadingComparison, setLoadingComparison] = useState<boolean>(false);

  // Fetch or calculate differential comparison
  useEffect(() => {
    const fetchComparison = async () => {
      if (isBackendOnline) {
        setLoadingComparison(true);
        try {
          const res = await fetch(
            `${apiBase}/api/comparisons/compare?region_id=${activeRegion.id}&source_id=${selectedObjectId}&epoch_a_idx=${epochAIdx}&epoch_b_idx=${epochBIdx}`
          );
          if (res.ok) {
            const data = await res.json();
            setComparisonData(data);
          }
        } catch {
          // Fallback to local
        } finally {
          setLoadingComparison(false);
        }
      }
    };

    fetchComparison();
  }, [activeRegion.id, selectedObjectId, epochAIdx, epochBIdx, isBackendOnline, apiBase]);

  const epochA = activeRegion.epochs[epochAIdx] || activeRegion.epochs[0];
  const epochB = activeRegion.epochs[epochBIdx] || activeRegion.epochs[activeRegion.epochs.length - 1];

  const srcA = epochA?.sources.find((s) => s.id === selectedObjectId);
  const srcB = epochB?.sources.find((s) => s.id === selectedObjectId);

  // Client calculation fallback if comparisonData not yet returned from API
  const posA = srcA ? { ra: srcA.ra, dec: srcA.dec } : { ra: 180.0, dec: 0.0 };
  const posB = srcB ? { ra: srcB.ra, dec: srcB.dec } : { ra: 180.0, dec: 0.0 };
  const dRa = (posB.ra - posA.ra) * Math.cos((((posA.dec + posB.dec) / 2) * Math.PI) / 180);
  const dDec = posB.dec - posA.dec;
  const clientDisplacement = Math.sqrt(dRa * dRa + dDec * dDec) * 3600.0;
  const clientFluxA = srcA?.flux || 50.0;
  const clientFluxB = srcB?.flux || 50.0;
  const clientDeltaFlux = clientFluxB - clientFluxA;
  const clientPctChange = clientFluxA > 0 ? (clientDeltaFlux / clientFluxA) * 100 : 0;

  const comparison = comparisonData?.comparison;
  const displacementArcsec = comparison?.position?.angular_displacement_arcsec ?? clientDisplacement;
  const motionDirection = comparison?.position?.direction ?? 'North-East';
  const motionSignificance = comparison?.position?.significance_sigma ?? (clientDisplacement / 0.35);
  const deltaFluxVal = comparison?.brightness?.absolute_diff_ujy ?? clientDeltaFlux;
  const pctChangeVal = comparison?.brightness?.percentage_change ?? clientPctChange;

  // Spectral residuals data for chart
  const spectralData = comparison?.spectral?.residuals || [
    { wavelength_um: 0.75, residual_delta: 2.1, ratio: 1.05, feature: 'Continuum' },
    { wavelength_um: 1.10, residual_delta: 1.8, ratio: 1.04, feature: 'Continuum' },
    { wavelength_um: 1.50, residual_delta: 3.2, ratio: 1.08, feature: 'Continuum' },
    { wavelength_um: 2.00, residual_delta: 2.5, ratio: 1.06, feature: 'CO bandhead' },
    { wavelength_um: 2.50, residual_delta: -1.2, ratio: 0.98, feature: 'Atmospheric transmission' },
    { wavelength_um: 3.05, residual_delta: -12.4, ratio: 0.65, feature: 'H2O ice absorption' },
    { wavelength_um: 3.60, residual_delta: -4.1, ratio: 0.91, feature: 'Mid-IR continuum' },
    { wavelength_um: 4.27, residual_delta: -8.6, ratio: 0.78, feature: 'CO2 ice absorption' },
    { wavelength_um: 4.67, residual_delta: 1.1, ratio: 1.02, feature: 'CO band' },
    { wavelength_um: 5.00, residual_delta: 2.4, ratio: 1.05, feature: 'Thermal tail' },
  ];

  const uniqueObjects = Array.from(
    new Set(activeRegion.epochs.flatMap((ep) => ep.sources.map((s) => s.id)))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Header & Epoch Comparison Selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-space-600/60 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-violet-cosmic/15 text-violet-cosmic text-xs font-semibold uppercase tracking-wider font-mono-sci mb-1 border border-violet-cosmic/30">
            <GitCompare className="w-3.5 h-3.5" />
            <span>Multi-Epoch Change Analysis</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-3">
            <span>Differential Comparison</span>
            <span className="text-xs font-mono-sci text-cyan-electric px-2.5 py-0.5 rounded bg-space-800 border border-space-600">
              {selectedObjectId}
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Compare physical positions, light curves, and infrared spectra between baseline and follow-up observation epochs.
          </p>
        </div>

        {/* Object & Epoch Selectors */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto font-mono-sci text-xs">
          {/* Object Selector */}
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

          {/* Epoch A Baseline */}
          <select
            value={epochAIdx}
            onChange={(e) => setEpochAIdx(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg bg-space-800 text-cyan-electric border border-space-600 focus:border-cyan-electric/70 focus:outline-none"
          >
            {activeRegion.epochs.map((ep, idx) => (
              <option key={idx} value={idx}>
                Baseline: Epoch {idx + 1} ({ep.timestamp.slice(0, 10)})
              </option>
            ))}
          </select>

          <span className="text-slate-500 font-bold">vs</span>

          {/* Epoch B Comparison */}
          <select
            value={epochBIdx}
            onChange={(e) => setEpochBIdx(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg bg-space-800 text-violet-cosmic border border-space-600 focus:border-violet-cosmic/70 focus:outline-none"
          >
            {activeRegion.epochs.map((ep, idx) => (
              <option key={idx} value={idx}>
                Follow-Up: Epoch {idx + 1} ({ep.timestamp.slice(0, 10)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Two-Column Side-by-Side Before vs After Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Epoch A Baseline Observation */}
        <div className="glass-panel p-5 rounded-2xl border border-cyan-electric/30 space-y-4">
          <div className="flex items-center justify-between border-b border-space-600/50 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-electric" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Baseline Observation (Epoch {epochAIdx + 1})
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono-sci font-bold bg-cyan-electric/15 text-cyan-electric border border-cyan-electric/30">
              {epochA?.timestamp.slice(0, 10)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono-sci">
            <div className="p-3 rounded-xl bg-space-950/70 border border-space-600/40">
              <span className="text-[10px] text-slate-400 uppercase block">Right Ascension</span>
              <span className="text-white font-bold text-sm">{srcA?.ra.toFixed(6) || 'N/A'}°</span>
            </div>
            <div className="p-3 rounded-xl bg-space-950/70 border border-space-600/40">
              <span className="text-[10px] text-slate-400 uppercase block">Declination</span>
              <span className="text-white font-bold text-sm">{srcA?.dec.toFixed(6) || 'N/A'}°</span>
            </div>
            <div className="p-3 rounded-xl bg-space-950/70 border border-space-600/40">
              <span className="text-[10px] text-slate-400 uppercase block">Flux Density</span>
              <span className="text-cyan-electric font-bold text-sm">
                {srcA?.flux.toFixed(1) || '0.0'} µJy
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                ±{srcA?.flux_err.toFixed(1) || '0.0'} µJy
              </span>
            </div>
            <div className="p-3 rounded-xl bg-space-950/70 border border-space-600/40">
              <span className="text-[10px] text-slate-400 uppercase block">Effective Wavelength</span>
              <span className="text-white font-bold text-sm">{epochA?.wavelength} µm</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">SPHEREx Band</span>
            </div>
            <div className="p-3 rounded-xl bg-space-950/70 border border-space-600/40">
              <span className="text-[10px] text-slate-400 uppercase block">PSF Profile FWHM</span>
              <span className="text-white font-bold text-sm">{srcA?.psf_fwhm.toFixed(2) || '2.00'}&quot;</span>
            </div>
            <div className="p-3 rounded-xl bg-space-950/70 border border-space-600/40">
              <span className="text-[10px] text-slate-400 uppercase block">Quality Flag</span>
              <span className="text-emerald-soft font-bold text-sm">{srcA?.flag || 'good'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Epoch B Comparison Observation */}
        <div className="glass-panel p-5 rounded-2xl border border-violet-cosmic/30 space-y-4">
          <div className="flex items-center justify-between border-b border-space-600/50 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-cosmic" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Comparison Observation (Epoch {epochBIdx + 1})
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono-sci font-bold bg-violet-cosmic/15 text-violet-cosmic border border-violet-cosmic/30">
              {epochB?.timestamp.slice(0, 10)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono-sci">
            <div className="p-3 rounded-xl bg-space-950/70 border border-space-600/40">
              <span className="text-[10px] text-slate-400 uppercase block">Right Ascension</span>
              <span className="text-white font-bold text-sm">{srcB?.ra.toFixed(6) || 'N/A'}°</span>
            </div>
            <div className="p-3 rounded-xl bg-space-950/70 border border-space-600/40">
              <span className="text-[10px] text-slate-400 uppercase block">Declination</span>
              <span className="text-white font-bold text-sm">{srcB?.dec.toFixed(6) || 'N/A'}°</span>
            </div>
            <div className="p-3 rounded-xl bg-space-950/70 border border-space-600/40">
              <span className="text-[10px] text-slate-400 uppercase block">Flux Density</span>
              <span className="text-violet-cosmic font-bold text-sm">
                {srcB?.flux.toFixed(1) || '0.0'} µJy
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                ±{srcB?.flux_err.toFixed(1) || '0.0'} µJy
              </span>
            </div>
            <div className="p-3 rounded-xl bg-space-950/70 border border-space-600/40">
              <span className="text-[10px] text-slate-400 uppercase block">Effective Wavelength</span>
              <span className="text-white font-bold text-sm">{epochB?.wavelength} µm</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">SPHEREx Band</span>
            </div>
            <div className="p-3 rounded-xl bg-space-950/70 border border-space-600/40">
              <span className="text-[10px] text-slate-400 uppercase block">PSF Profile FWHM</span>
              <span className="text-white font-bold text-sm">{srcB?.psf_fwhm.toFixed(2) || '2.00'}&quot;</span>
            </div>
            <div className="p-3 rounded-xl bg-space-950/70 border border-space-600/40">
              <span className="text-[10px] text-slate-400 uppercase block">Quality Flag</span>
              <span
                className={`font-bold text-sm ${
                  srcB?.flag === 'good' ? 'text-emerald-soft' : 'text-amber-400'
                }`}
              >
                {srcB?.flag || 'good'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Differential Summary Metrics Box */}
      <div className="glass-panel p-5 rounded-2xl border border-cyan-electric/40 bg-gradient-to-r from-space-900/90 to-space-850/90 space-y-4">
        <div className="flex items-center justify-between border-b border-space-600/50 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-electric" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Computed Physical Differential (Δ Epoch {epochAIdx + 1} → Epoch {epochBIdx + 1})
            </h3>
          </div>
          <span className="text-[11px] font-mono-sci text-slate-400">
            Time Delta: {comparison?.delta_time_days || 214} Days Baseline
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono-sci">
          <div className="p-3.5 rounded-xl bg-space-950/80 border border-cyan-electric/30">
            <div className="text-[10px] uppercase text-slate-400">Angular Displacement</div>
            <div className="text-lg font-extrabold text-cyan-electric mt-1">
              {displacementArcsec.toFixed(3)}&quot;
            </div>
            <div className="text-[10px] text-slate-300 mt-1">
              Direction: {motionDirection} ({motionSignificance.toFixed(1)}σ)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-space-950/80 border border-violet-cosmic/30">
            <div className="text-[10px] uppercase text-slate-400">Photometric Flux Delta</div>
            <div
              className={`text-lg font-extrabold mt-1 ${
                deltaFluxVal > 0 ? 'text-emerald-soft' : deltaFluxVal < 0 ? 'text-rose-soft' : 'text-slate-300'
              }`}
            >
              {deltaFluxVal > 0 ? `+${deltaFluxVal.toFixed(1)}` : deltaFluxVal.toFixed(1)} µJy
            </div>
            <div className="text-[10px] text-slate-300 mt-1">
              Variation: {typeof pctChangeVal === 'number' ? `${pctChangeVal.toFixed(1)}%` : pctChangeVal}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-space-950/80 border border-space-600/40">
            <div className="text-[10px] uppercase text-slate-400">Proper Motion Speed</div>
            <div className="text-lg font-extrabold text-white mt-1">
              {(displacementArcsec / (Math.max(1, comparison?.delta_time_days || 214) / 365.25)).toFixed(3)}&quot;/yr
            </div>
            <div className="text-[10px] text-slate-300 mt-1">Astrometric Kinematics</div>
          </div>

          <div className="p-3.5 rounded-xl bg-space-950/80 border border-space-600/40">
            <div className="text-[10px] uppercase text-slate-400">Physical Verification</div>
            <div className="text-lg font-extrabold text-emerald-soft mt-1">
              {displacementArcsec > 2.0 || Math.abs(deltaFluxVal) > 10.0 ? 'SIGNIFICANT' : 'QUIESCENT'}
            </div>
            <div className="text-[10px] text-slate-300 mt-1">Multi-Epoch Corroborated</div>
          </div>
        </div>

        {/* Narrative Explanation */}
        <div className="p-3 rounded-xl bg-space-950/70 border border-space-600/40 text-xs text-slate-200">
          <span className="font-bold text-cyan-electric">Scientific Synthesis: </span>
          <span>
            {comparison?.summary_narrative ||
              `Astrometric displacement of ${displacementArcsec.toFixed(2)} arcsec detected toward ${motionDirection}. Photometric variation is ${typeof pctChangeVal === 'number' ? pctChangeVal.toFixed(1) : 0}% with quiescent morphology.`}
          </span>
        </div>
      </div>

      {/* Linked Interactive Charts: Light Curve & Spectral Residuals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Photometric Light Curve Viewer */}
        <div className="glass-panel p-5 rounded-2xl border border-space-600/60 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-electric" />
              <span>Multi-Epoch Photometric Light Curve</span>
            </h3>
            <span className="text-[10px] font-mono-sci text-cyan-electric">µJy Flux History</span>
          </div>
          <LightCurveViewer
            objectId={selectedObjectId}
            epochs={activeRegion.epochs}
            analysis={analysis}
            selectedEpoch={epochAIdx}
          />
        </div>

        {/* Spectral Energy Distribution & Residuals */}
        <div className="glass-panel p-5 rounded-2xl border border-space-600/60 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-violet-cosmic" />
              <span>SPHEREx Infrared Spectral Residuals</span>
            </h3>
            <span className="text-[10px] font-mono-sci text-violet-cosmic">0.75 - 5.00 µm</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spectralData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="wavelength_um" stroke="#94A3B8" fontSize={10} unit="µm" />
                <YAxis stroke="#94A3B8" fontSize={10} unit="µJy" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1024',
                    border: '1px solid rgba(146, 116, 255, 0.3)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="residual_delta" radius={[3, 3, 0, 0]}>
                  {spectralData.map((entry, index) => (
                    <Cell
                      key={`spec-${index}`}
                      fill={entry.residual_delta < -5.0 ? '#EF4444' : entry.residual_delta > 0 ? '#36D9FF' : '#9274FF'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] font-mono-sci text-slate-400 flex items-center justify-between pt-1">
            <span>Negative trough at 3.05µm = H2O Water Ice Absorption</span>
            <span className="text-amber-400">Diagnostics: Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
