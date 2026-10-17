'use client';

import React, { useEffect, useState } from 'react';
import {
  Region,
  AnalysisResult,
  ScientificDiscoveryPassport,
  DiscoverySummary,
  DISCLAIMER_TEXT,
} from './lib/types';
import {
  DEFAULT_SURVEYS,
  DEFAULT_WEIGHTS,
  analyzeObjectLocally,
  getDiscoveriesLocally,
} from './lib/clientEngine';

import CelestialSkyCanvas from './components/CelestialSkyCanvas';
import TimeMachineBar from './components/TimeMachineBar';
import LightCurveViewer from './components/LightCurveViewer';
import SpectralSEDViewer from './components/SpectralSEDViewer';
import RadarBreakdown from './components/RadarBreakdown';
import DiscoveryCatalogTable from './components/DiscoveryCatalogTable';
import DiscoveryPassportModal from './components/DiscoveryPassportModal';
import ReportModal from './components/ReportModal';
import CalibrationStudioModal from './components/CalibrationStudioModal';
import AnomalyInjectorModal from './components/AnomalyInjectorModal';
import DataIngestModal from './components/DataIngestModal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function HomePage() {
  const [surveys, setSurveys] = useState<Record<string, Region>>(DEFAULT_SURVEYS);
  const [activeRegionId, setActiveRegionId] = useState<string>('region_001');
  const [activeRegion, setActiveRegion] = useState<Region>(DEFAULT_SURVEYS.region_001);
  const [selectedEpoch, setSelectedEpoch] = useState<number>(0);
  const [selectedObjectId, setSelectedObjectId] = useState<string>('DEMO-001');

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [passport, setPassport] = useState<ScientificDiscoveryPassport | null>(null);
  const [discoveries, setDiscoveries] = useState<DiscoverySummary[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [weights, setWeights] = useState<Record<string, number>>(DEFAULT_WEIGHTS);

  const [playing, setPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modals state
  const [passportModalOpen, setPassportModalOpen] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [calibrationModalOpen, setCalibrationModalOpen] = useState<boolean>(false);
  const [injectorModalOpen, setInjectorModalOpen] = useState<boolean>(false);
  const [ingestModalOpen, setIngestModalOpen] = useState<boolean>(false);

  // 1. Initial check for Backend API connectivity & regions
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`, { cache: 'no-store' });
        if (res.ok) {
          setIsBackendOnline(true);
          const regRes = await fetch(`${API_BASE}/api/region/${activeRegionId}`);
          if (regRes.ok) {
            const data = await regRes.json();
            setActiveRegion(data);
          }
        } else {
          setIsBackendOnline(false);
        }
      } catch {
        setIsBackendOnline(false);
      }
    };
    checkBackend();
  }, [activeRegionId]);

  // 2. Synchronize active region changes
  useEffect(() => {
    const reg = surveys[activeRegionId] || DEFAULT_SURVEYS.region_001;
    setActiveRegion(reg);
    setSelectedEpoch(0);
    const firstCand = reg.epochs[0]?.sources[0]?.id || 'DEMO-001';
    setSelectedObjectId(firstCand);
  }, [activeRegionId, surveys]);

  // 3. Run Analysis whenever selectedObjectId, activeRegion, or weights change
  useEffect(() => {
    if (!activeRegion) return;

    const runAnalysis = async () => {
      setIsLoading(true);
      if (isBackendOnline) {
        try {
          const res = await fetch(
            `${API_BASE}/api/analyze/object?region_id=${activeRegion.id}&object_id=${selectedObjectId}`
          );
          if (res.ok) {
            const data = await res.json();
            setAnalysis(data.analysis);
            setPassport(data.passport);
            setIsLoading(false);
            return;
          }
        } catch {
          // Fall back to clientEngine
        }
      }

      // Standalone client execution
      try {
        const result = analyzeObjectLocally(selectedObjectId, activeRegion, weights);
        setAnalysis(result.analysis);
        setPassport(result.passport);
      } catch (err) {
        console.warn('Local analysis fallback:', err);
      }
      setIsLoading(false);
    };

    runAnalysis();
  }, [selectedObjectId, activeRegion, weights, isBackendOnline]);

  // 4. Update Discoveries Catalog whenever activeRegion or categoryFilter changes
  useEffect(() => {
    if (!activeRegion) return;

    const fetchDiscoveries = async () => {
      if (isBackendOnline) {
        try {
          const res = await fetch(
            `${API_BASE}/api/discoveries?region_id=${activeRegion.id}&category_filter=${categoryFilter}`
          );
          if (res.ok) {
            const data = await res.json();
            setDiscoveries(data.discoveries);
            return;
          }
        } catch {
          // Fall back
        }
      }

      const localDisc = getDiscoveriesLocally(activeRegion, weights, categoryFilter);
      setDiscoveries(localDisc);
    };

    fetchDiscoveries();
  }, [activeRegion, categoryFilter, weights, isBackendOnline]);

  // 5. Time Machine animation player
  useEffect(() => {
    if (!playing || !activeRegion) return;

    const intervalMs = Math.max(400, 1200 / playbackSpeed);
    const timer = setInterval(() => {
      setSelectedEpoch((prev) => (prev + 1) % activeRegion.epochs.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [playing, activeRegion, playbackSpeed]);

  const handleApplyWeights = (newWeights: Record<string, number>) => {
    setWeights(newWeights);
    if (isBackendOnline) {
      fetch(`${API_BASE}/api/detectors/weights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights: newWeights }),
      }).catch(() => {});
    }
  };

  const handleInjectAnomaly = (data: {
    objectId: string;
    anomalyType: string;
    raShiftArcsec: number;
    decShiftArcsec: number;
    baseFlux: number;
    flareMultiplier: number;
    isArtifact: boolean;
  }) => {
    const updatedEpochs = activeRegion.epochs.map((ep, i) => {
      const raShift = (data.raShiftArcsec * i) / (3600 * Math.cos((activeRegion.dec_center * Math.PI) / 180));
      const decShift = (data.decShiftArcsec * i) / 3600;
      const flux = data.baseFlux * (i === 1 && data.anomalyType === 'infrared_transient' ? data.flareMultiplier : 1.0);
      const psf = data.isArtifact && i === 1 ? 0.65 : 2.0;

      const sources = ep.sources.filter((s) => s.id !== data.objectId);
      sources.push({
        id: data.objectId,
        ra: activeRegion.ra_center + 0.01 + raShift,
        dec: activeRegion.dec_center - 0.01 + decShift,
        position_uncertainty_arcsec: 0.25,
        flux: Number(flux.toFixed(2)),
        flux_err: Number((flux * 0.04).toFixed(2)),
        flag: data.isArtifact && i === 1 ? 'marginal' : 'good',
        psf_fwhm: psf,
        type: data.anomalyType,
      });

      return { ...ep, sources };
    });

    const updatedRegion = { ...activeRegion, epochs: updatedEpochs };
    setSurveys((prev) => ({ ...prev, [activeRegion.id]: updatedRegion }));
    setActiveRegion(updatedRegion);
    setSelectedObjectId(data.objectId);
  };

  const handleIngestDataset = (newRegion: Region) => {
    setSurveys((prev) => ({ ...prev, [newRegion.id]: newRegion }));
    setActiveRegionId(newRegion.id);
  };

  return (
    <div className="min-h-screen bg-[#020810] text-[#e2f1ff] font-sans antialiased selection:bg-cyan-500 selection:text-black">
      {/* Persistent Scientific Guardrail Disclaimer Banner */}
      <div className="w-full bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border-b border-amber-500/40 px-4 py-2 text-center text-xs font-mono font-bold text-amber-200 tracking-wider">
        ⚠ {DISCLAIMER_TEXT} | NASA SPHEREx Mission Challenge Environment
      </div>

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#020b14]/90 backdrop-blur-xl border-b border-cyan-500/20 px-4 md:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-amber-400 p-[1.5px] shadow-[0_0_20px_rgba(56,189,248,0.4)]">
            <div className="w-full h-full bg-[#030d17] rounded-2xl flex items-center justify-center">
              <span className="text-xl">🔭</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold">
                NASA Space Apps Challenge 2026
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                  isBackendOnline
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                    : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
                }`}
              >
                {isBackendOnline ? 'API LIVE' : 'CLIENT ENGINE'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight font-mono bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-200 bg-clip-text text-transparent">
              SKYTRACE AI <span className="text-xs text-cyan-400/80 font-normal">/ CosmicLens</span>
            </h1>
          </div>
        </div>

        {/* Survey Field Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-black/50 border border-cyan-500/30 rounded-xl px-2.5 py-1 text-xs font-mono">
            <span className="text-cyan-400/60 mr-2">FIELD:</span>
            <select
              value={activeRegionId}
              onChange={(e) => setActiveRegionId(e.target.value)}
              className="bg-transparent text-cyan-200 font-bold focus:outline-none cursor-pointer"
            >
              {Object.values(surveys).map((s) => (
                <option key={s.id} value={s.id} className="bg-[#030d17] text-white">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setCalibrationModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-mono flex items-center gap-1.5 transition-all"
            title="Adjust Anomaly Sensitivity & Detector Weights"
          >
            <span>⚙</span>
            <span>CALIBRATE</span>
          </button>

          <button
            onClick={() => setInjectorModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-mono flex items-center gap-1.5 transition-all"
            title="Inject Synthetic Candidate"
          >
            <span>🧪</span>
            <span>INJECT</span>
          </button>

          <button
            onClick={() => setIngestModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-mono flex items-center gap-1.5 transition-all"
            title="Ingest Custom Survey Dataset"
          >
            <span>📥</span>
            <span>INGEST</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-[1600px] mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Sky Explorer, Timeline, Triage Table */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          {/* Survey Field Overview Card */}
          <div className="bg-[#050f19] border border-cyan-500/20 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 font-bold">{activeRegion.id}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                  {activeRegion.epochs.length} DISCRETE PASSES
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300">
                  SYNTHETIC
                </span>
              </div>
              <h2 className="text-lg font-bold font-mono text-cyan-100 mt-1">{activeRegion.name}</h2>
              <p className="text-xs font-mono text-cyan-400/70 mt-0.5">{activeRegion.description}</p>
            </div>
            <div className="text-right text-xs font-mono text-cyan-300 bg-black/40 px-3 py-2 rounded-xl border border-cyan-500/15">
              <div>CENTER: {activeRegion.ra_center.toFixed(2)}°, {activeRegion.dec_center.toFixed(2)}°</div>
              <div className="text-cyan-400/60 text-[11px]">FOV: {activeRegion.fov_arcmin} arcmin</div>
            </div>
          </div>

          {/* Interactive Celestial Sky Canvas */}
          <CelestialSkyCanvas
            region={activeRegion}
            selectedEpoch={selectedEpoch}
            selectedObjectId={selectedObjectId}
            onSelectObject={(id) => setSelectedObjectId(id)}
          />

          {/* Sky Time Machine Bar */}
          <TimeMachineBar
            epochs={activeRegion.epochs}
            selectedEpoch={selectedEpoch}
            onSelectEpoch={(idx) => setSelectedEpoch(idx)}
            playing={playing}
            onTogglePlay={() => setPlaying(!playing)}
            playbackSpeed={playbackSpeed}
            onChangeSpeed={(s) => setPlaybackSpeed(s)}
          />

          {/* Discovery Catalog Triage Table */}
          <DiscoveryCatalogTable
            discoveries={discoveries}
            selectedObjectId={selectedObjectId}
            onSelectObject={(id) => setSelectedObjectId(id)}
            categoryFilter={categoryFilter}
            onChangeCategoryFilter={(cat) => setCategoryFilter(cat)}
          />
        </section>

        {/* Right Column (5 cols): Deep-Dive Candidate Inspector & Passports */}
        <aside className="lg:col-span-5 flex flex-col gap-5">
          {analysis && passport ? (
            <>
              {/* Candidate Header & Priority Telemetry */}
              <div className="bg-[#050f19] border border-cyan-500/30 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                        Target Candidate
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 border border-cyan-500/30 text-cyan-300">
                        {passport.source_identity.iau_designation || selectedObjectId}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold font-mono text-cyan-100 mt-1">
                      {selectedObjectId}
                    </h3>
                  </div>

                  {/* Priority Badge */}
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-cyan-400/70 block">
                      Scientific Priority
                    </span>
                    <span
                      className={`text-sm font-mono font-bold px-3 py-1 rounded-xl border inline-block mt-0.5 ${
                        analysis.scientific_priority === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                          : analysis.scientific_priority === 'MODERATE'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {analysis.scientific_priority}
                    </span>
                  </div>
                </div>

                {/* Explicit Separation: Interestingness Score vs Evidence Confidence */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/40 p-3 rounded-xl border border-cyan-500/20 flex flex-col">
                    <span className="text-[10px] font-mono text-cyan-400/70 uppercase">
                      Scientific Interestingness
                    </span>
                    <span className="text-2xl font-bold font-mono text-amber-400">
                      {analysis.interestingness_score.toFixed(1)}
                      <span className="text-xs text-amber-400/60 font-normal"> / 100</span>
                    </span>
                    <span className="text-[10px] text-cyan-400/50 font-mono mt-0.5">Heuristic score</span>
                  </div>
                  <div className="bg-black/40 p-3 rounded-xl border border-cyan-500/20 flex flex-col">
                    <span className="text-[10px] font-mono text-cyan-400/70 uppercase">
                      Evidence Confidence
                    </span>
                    <span className="text-2xl font-bold font-mono text-cyan-300">
                      {analysis.evidence_confidence.numeric_value.toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono mt-0.5">
                      Tier: {analysis.evidence_confidence.tier}
                    </span>
                  </div>
                </div>

                {/* Primary Classification Hypothesis Pill */}
                <div className="bg-cyan-950/40 p-3 rounded-xl border border-cyan-500/25 flex flex-col gap-1">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-cyan-400 font-bold">PRIMARY CLASSIFICATION</span>
                    <span className="text-amber-300 font-bold">
                      {(analysis.primary_classification.probability * 100).toFixed(0)}% Probability
                    </span>
                  </div>
                  <span className="text-sm font-mono text-cyan-100 font-semibold">
                    {analysis.primary_classification.label}
                  </span>
                  <p className="text-[11px] font-mono text-cyan-300/80 leading-relaxed mt-0.5">
                    {analysis.primary_classification.rationale}
                  </p>
                </div>

                {/* Dual Passport & Report Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <button
                    onClick={() => setPassportModalOpen(true)}
                    className="py-2.5 px-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 font-mono text-xs font-bold hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>📜</span>
                    <span>VIEW PASSPORT</span>
                  </button>
                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-black font-mono text-xs font-bold hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <span>📄</span>
                    <span>GENERATE REPORT</span>
                  </button>
                </div>
              </div>

              {/* 5-Dimensional Radar & False-Alarm Audit */}
              <RadarBreakdown analysis={analysis} />

              {/* Photometric Light Curve Viewer */}
              <LightCurveViewer
                objectId={selectedObjectId}
                epochs={activeRegion.epochs}
                analysis={analysis}
                selectedEpoch={selectedEpoch}
              />

              {/* 102-Band SPHEREx Spectral SED Viewer */}
              <SpectralSEDViewer sedProfile={analysis.sed_profile} />

              {/* Explainable AI Narrative & Why Interesting */}
              <div className="bg-[#050f19] border border-cyan-500/20 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <h4 className="text-xs font-mono tracking-wider uppercase text-cyan-200">
                    Why Is This Object Interesting?
                  </h4>
                </div>
                <ul className="space-y-2 text-xs font-mono text-cyan-100/90">
                  {analysis.why_interesting.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-black/30 p-2 rounded-xl border border-cyan-500/10">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2 border-t border-cyan-500/15">
                  <span className="text-[10px] font-mono uppercase text-amber-300 font-bold block mb-1">
                    Follow-Up Suggestions:
                  </span>
                  <ul className="space-y-1 text-[11px] font-mono text-cyan-300/80">
                    {analysis.follow_up_suggestions.map((rec, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="text-amber-400">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-center p-6 bg-[#050f19] border border-cyan-500/20 rounded-2xl">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-3" />
              <p className="text-xs font-mono text-cyan-300">Analyzing astronomical target across epochs...</p>
            </div>
          )}
        </aside>
      </main>

      {/* Modals */}
      <DiscoveryPassportModal
        passport={passport}
        isOpen={passportModalOpen}
        onClose={() => setPassportModalOpen(false)}
        onOpenReport={() => {
          setPassportModalOpen(false);
          setReportModalOpen(true);
        }}
      />

      <ReportModal
        passport={passport}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />

      <CalibrationStudioModal
        isOpen={calibrationModalOpen}
        onClose={() => setCalibrationModalOpen(false)}
        weights={weights}
        onApplyWeights={handleApplyWeights}
      />

      <AnomalyInjectorModal
        isOpen={injectorModalOpen}
        onClose={() => setInjectorModalOpen(false)}
        onInject={handleInjectAnomaly}
      />

      <DataIngestModal
        isOpen={ingestModalOpen}
        onClose={() => setIngestModalOpen(false)}
        onIngest={handleIngestDataset}
      />
    </div>
  );
}
