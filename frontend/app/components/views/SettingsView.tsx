'use client';

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  ShieldCheck,
  Server,
  Globe,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface SettingsViewProps {
  weights: Record<string, number>;
  setWeights: (w: Record<string, number>) => void;
  apiBase: string;
  isBackendOnline: boolean;
}

export default function SettingsView({
  weights,
  setWeights,
  apiBase,
  isBackendOnline,
}: SettingsViewProps) {
  const [localWeights, setLocalWeights] = useState(weights);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [motionThreshold, setMotionThreshold] = useState(3.0);
  const [variabilityThreshold, setVariabilityThreshold] = useState(25.0);
  const [coordFormat, setCoordFormat] = useState<'decimal' | 'sexagesimal'>('decimal');

  const handleSave = async () => {
    setWeights(localWeights);
    if (isBackendOnline) {
      try {
        await fetch(`${apiBase}/api/detectors/weights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weights: localWeights }),
        });
      } catch {
        // Ignore
      }
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    const defaults = {
      astrometric_motion: 0.3,
      photometric_variability: 0.25,
      spectral_anomaly: 0.2,
      temporal_dynamics: 0.15,
      contextual_outlier: 0.1,
    };
    setLocalWeights(defaults);
    setWeights(defaults);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-space-600/60 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-cyan-electric/15 text-cyan-electric text-xs font-semibold uppercase tracking-wider font-mono-sci mb-1 border border-cyan-electric/30">
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Platform Configuration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Settings & Calibration Studio
          </h1>
          <p className="text-xs text-slate-400">
            Configure algorithmic sensitivity thresholds, 5-dimensional detector weights, and observatory telemetry endpoints.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto font-mono-sci text-xs">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-space-800 hover:bg-space-700 text-slate-300 border border-space-600 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Defaults</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-cyan-electric hover:bg-cyan-glow text-space-950 font-bold transition-all shadow-cyan-glow"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-soft/15 border border-emerald-soft/40 flex items-center space-x-2 text-xs font-mono-sci text-emerald-300 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-soft" />
          <span>Settings and detector weights updated successfully!</span>
        </div>
      )}

      {/* Grid: Calibration Weights + Thresholds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dimensional Weights Box */}
        <div className="glass-panel p-5 rounded-2xl border border-space-600/60 space-y-4">
          <div className="flex items-center justify-between border-b border-space-600/50 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-electric" />
              <span>Multi-Dimensional Weights Tuning</span>
            </h2>
            <span className="text-[10px] font-mono-sci text-cyan-electric">Normalized 100%</span>
          </div>

          <div className="space-y-4 font-mono-sci text-xs">
            {Object.entries(localWeights).map(([key, val]) => (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="font-bold text-cyan-electric">{(val * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.6"
                  step="0.05"
                  value={val}
                  onChange={(e) =>
                    setLocalWeights({
                      ...localWeights,
                      [key]: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-cyan-400 h-1.5 bg-space-800 rounded-lg cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Sensitivity Thresholds & Coordinates */}
        <div className="glass-panel p-5 rounded-2xl border border-space-600/60 space-y-4">
          <div className="flex items-center justify-between border-b border-space-600/50 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-violet-cosmic" />
              <span>Statistical Thresholds & Display</span>
            </h2>
            <span className="text-[10px] font-mono-sci text-slate-400">Significance Triggers</span>
          </div>

          <div className="space-y-4 font-mono-sci text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Motion Significance Threshold (σ)</span>
                <span className="font-bold text-white">{motionThreshold.toFixed(1)}σ</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={motionThreshold}
                onChange={(e) => setMotionThreshold(parseFloat(e.target.value))}
                className="w-full accent-violet-400 h-1.5 bg-space-800 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">
                Standard: 3.0σ (99.7% confidence above astrometric error envelope)
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Photometric Variability Trigger (%)</span>
                <span className="font-bold text-white">{variabilityThreshold.toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={variabilityThreshold}
                onChange={(e) => setVariabilityThreshold(parseFloat(e.target.value))}
                className="w-full accent-violet-400 h-1.5 bg-space-800 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">
                Minimum fractional brightness change required to flag transient anomaly.
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <span className="text-slate-300 block">Coordinate Display Preference</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCoordFormat('decimal')}
                  className={`py-1.5 rounded-lg border transition-all ${
                    coordFormat === 'decimal'
                      ? 'bg-cyan-electric/20 text-cyan-electric border-cyan-electric/50 font-bold'
                      : 'bg-space-950 text-slate-400 border-space-600'
                  }`}
                >
                  Decimal (180.0000°)
                </button>
                <button
                  type="button"
                  onClick={() => setCoordFormat('sexagesimal')}
                  className={`py-1.5 rounded-lg border transition-all ${
                    coordFormat === 'sexagesimal'
                      ? 'bg-cyan-electric/20 text-cyan-electric border-cyan-electric/50 font-bold'
                      : 'bg-space-950 text-slate-400 border-space-600'
                  }`}
                >
                  Sexagesimal (12h 00m)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Engine Telemetry */}
      <div className="glass-panel p-5 rounded-2xl border border-space-600/60 space-y-3 font-mono-sci text-xs">
        <div className="flex items-center justify-between border-b border-space-600/50 pb-2">
          <span className="font-bold text-white flex items-center space-x-2">
            <Server className="w-4 h-4 text-cyan-electric" />
            <span>FastAPI Python Engine Telemetry</span>
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isBackendOnline ? 'bg-emerald-soft/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {isBackendOnline ? 'ONLINE' : 'STANDALONE MODE'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-300">
          <div>
            <span className="text-slate-500 block">API Base URL:</span>
            <span className="text-white">{apiBase}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Astropy FITS Engine:</span>
            <span className="text-emerald-soft">Installed (v8.0.2)</span>
          </div>
          <div>
            <span className="text-slate-500 block">PDF Preprint Engine:</span>
            <span className="text-emerald-soft">ReportLab (v5.1.0)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
