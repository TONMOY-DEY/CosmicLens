'use client';

import React, { useState } from 'react';
import { Region, DiscoverySummary, PageId } from '../../lib/types';
import {
  AlertTriangle,
  Sliders,
  Sparkles,
  Compass,
  Activity,
  Layers,
  Clock,
  HelpCircle,
  Eye,
  GitCompare,
  Award,
  ShieldAlert,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

interface AnomalyDetectionViewProps {
  activeRegion: Region;
  discoveries: DiscoverySummary[];
  selectedObjectId: string;
  setSelectedObjectId: (id: string) => void;
  weights: Record<string, number>;
  setWeights: (weights: Record<string, number>) => void;
  onNavigate: (page: PageId) => void;
}

export default function AnomalyDetectionView({
  activeRegion,
  discoveries,
  selectedObjectId,
  setSelectedObjectId,
  weights,
  setWeights,
  onNavigate,
}: AnomalyDetectionViewProps) {
  const [activeDimensionFilter, setActiveDimensionFilter] = useState<string>('ALL');
  const [minScoreThreshold, setMinScoreThreshold] = useState<number>(40);

  // Five independent dimensions metadata
  const dimensionsMeta = [
    {
      id: 'astrometric_motion',
      key: 'motion',
      label: 'Motion Anomaly',
      icon: Compass,
      color: 'text-cyan-electric',
      border: 'border-cyan-electric/40',
      bg: 'bg-cyan-electric/10',
      method: 'Astropy Spherical Kinematics & 3.0σ Threshold',
      description: 'Detects significant celestial displacement relative to astrometric error envelope.',
    },
    {
      id: 'photometric_variability',
      key: 'photometry',
      label: 'Photometric Anomaly',
      icon: Activity,
      color: 'text-violet-cosmic',
      border: 'border-violet-cosmic/40',
      bg: 'bg-violet-cosmic/10',
      method: 'Median Absolute Deviation (MAD) & χ²_ν Variability Test',
      description: 'Flags significant brightness variations exceeding photometric noise floor.',
    },
    {
      id: 'spectral_anomaly',
      key: 'spectral',
      label: 'Spectral Anomaly',
      icon: Layers,
      color: 'text-cyan-electric',
      border: 'border-cyan-electric/40',
      bg: 'bg-cyan-electric/10',
      method: 'SPHEREx 102-Band Infrared Color Slope & Molecular Ice Filter',
      description: 'Identifies unusual infrared continuum gradients and 3.05µm/4.27µm ice absorption troughs.',
    },
    {
      id: 'temporal_dynamics',
      key: 'temporal',
      label: 'Temporal Anomaly',
      icon: Clock,
      color: 'text-amber-400',
      border: 'border-amber-500/40',
      bg: 'bg-amber-500/10',
      method: 'Multi-Epoch Time-Series Derivative & Outburst Rate Analysis',
      description: 'Evaluates rapid emergence, erratic flares, and non-periodic transient evolution.',
    },
    {
      id: 'contextual_outlier',
      key: 'context',
      label: 'Context Anomaly',
      icon: AlertTriangle,
      color: 'text-emerald-soft',
      border: 'border-emerald-soft/40',
      bg: 'bg-emerald-soft/10',
      method: 'Local Neighborhood Spatial Outlier / Isolation Forest',
      description: 'Detects isolated statistical outliers compared against the local stellar field population.',
    },
  ];

  // Filtered discoveries
  const filteredAnomalies = discoveries.filter((d) => {
    const matchesScore = d.interestingness_score >= minScoreThreshold;
    const matchesDim =
      activeDimensionFilter === 'ALL' ||
      d.dominant_dimension.toLowerCase().includes(activeDimensionFilter.toLowerCase());
    return matchesScore && matchesDim;
  });

  const handleWeightChange = (key: string, value: number) => {
    setWeights({
      ...weights,
      [key]: value,
    });
  };

  const resetWeights = () => {
    setWeights({
      astrometric_motion: 0.3,
      photometric_variability: 0.25,
      spectral_anomaly: 0.2,
      temporal_dynamics: 0.15,
      contextual_outlier: 0.1,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-space-600/60 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold uppercase tracking-wider font-mono-sci mb-1 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>AI-Powered Anomaly Detection</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Multi-Dimensional Physical Anomaly Engine
          </h1>
          <p className="text-xs text-slate-400">
            Evaluating 5 independent statistical dimensions across multi-epoch SPHEREx infrared surveys.
          </p>
        </div>

        {/* Dimension Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto font-mono-sci text-xs">
          {['ALL', 'MOTION', 'PHOTO', 'SPECTR', 'TEMP', 'CONTEXT'].map((dim) => (
            <button
              key={dim}
              onClick={() => setActiveDimensionFilter(dim)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all border ${
                activeDimensionFilter === dim
                  ? 'bg-cyan-electric/20 text-cyan-electric border-cyan-electric/40'
                  : 'bg-space-800 text-slate-400 border-space-600/60 hover:text-white'
              }`}
            >
              {dim}
            </button>
          ))}
        </div>
      </div>

      {/* 5-Dimensional Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {dimensionsMeta.map((dim) => {
          const Icon = dim.icon;
          const currentWeight = weights[dim.id] ?? 0.2;
          const matchingCount = discoveries.filter((d) =>
            d.dominant_dimension.toLowerCase().includes(dim.key)
          ).length;

          return (
            <div
              key={dim.id}
              className={`glass-panel p-4 rounded-xl border ${dim.border} flex flex-col justify-between space-y-3`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-lg ${dim.bg}`}>
                    <Icon className={`w-4 h-4 ${dim.color}`} />
                  </div>
                  <span className="text-[10px] font-mono-sci font-bold px-1.5 py-0.5 rounded bg-space-800 text-white border border-space-600">
                    {matchingCount} Flagged
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white tracking-wide">{dim.label}</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{dim.description}</p>
              </div>

              <div className="pt-2 border-t border-space-600/40 space-y-1.5 font-mono-sci text-[10px]">
                <div className="flex justify-between text-slate-300">
                  <span>Weight:</span>
                  <span className={dim.color}>{(currentWeight * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.6"
                  step="0.05"
                  value={currentWeight}
                  onChange={(e) => handleWeightChange(dim.id, parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-space-800 rounded-lg cursor-pointer"
                />
                <div className="text-[9px] text-slate-500 truncate mt-1">{dim.method}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Anomaly Candidates Audit Table */}
      <div className="glass-panel p-5 rounded-2xl border border-space-600/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-electric" />
              <span>Flagged Anomaly Audit Log ({filteredAnomalies.length})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Traceable statistical thresholds, detection methods, and supporting observational measurements.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono-sci">
            <span className="text-slate-400">Min Score:</span>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minScoreThreshold}
              onChange={(e) => setMinScoreThreshold(parseInt(e.target.value))}
              className="accent-cyan-400 h-1 bg-space-800 rounded-lg cursor-pointer w-24"
            />
            <span className="text-cyan-electric font-bold w-6">{minScoreThreshold}</span>
            <button
              onClick={resetWeights}
              className="p-1 rounded bg-space-800 text-slate-400 hover:text-white border border-space-600"
              title="Reset Weights to Defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-space-600/60 text-slate-400 font-mono-sci text-[11px]">
                <th className="py-2.5 px-3">Object ID</th>
                <th className="py-2.5 px-3">Dominant Dimension</th>
                <th className="py-2.5 px-3">Supporting Measurement</th>
                <th className="py-2.5 px-3">Detection Method</th>
                <th className="py-2.5 px-3">Applied Threshold</th>
                <th className="py-2.5 px-3">Anomaly Score</th>
                <th className="py-2.5 px-3">Evidence Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-600/40">
              {filteredAnomalies.map((anom) => (
                <tr
                  key={anom.object_id}
                  onClick={() => setSelectedObjectId(anom.object_id)}
                  className={`hover:bg-space-800/60 cursor-pointer transition-colors ${
                    selectedObjectId === anom.object_id ? 'bg-cyan-electric/10' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-mono-sci font-bold text-white flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{anom.object_id}</span>
                  </td>

                  <td className="py-3 px-3 font-mono-sci text-cyan-electric font-bold text-[11px]">
                    {anom.dominant_dimension.toUpperCase()}
                  </td>

                  <td className="py-3 px-3 font-mono-sci text-slate-200 text-[11px]">
                    {anom.dominant_dimension.includes('motion')
                      ? `Displacement: ${anom.motion_arcsec.toFixed(2)}"`
                      : anom.dominant_dimension.includes('photo')
                      ? `ΔFlux: ${anom.flux_variability_pct.toFixed(1)}%`
                      : anom.why_interesting_summary}
                  </td>

                  <td className="py-3 px-3 font-mono-sci text-slate-400 text-[10px]">
                    {anom.dominant_dimension.includes('motion')
                      ? 'Astropy Spherical'
                      : anom.dominant_dimension.includes('photo')
                      ? 'MAD & χ²_ν'
                      : 'Infrared SED Slope'}
                  </td>

                  <td className="py-3 px-3 font-mono-sci text-slate-300 text-[11px]">
                    {anom.dominant_dimension.includes('motion') ? 'Δθ ≥ 3.0σ' : 'Variability ≥ 25%'}
                  </td>

                  <td className="py-3 px-3 font-mono-sci">
                    <div className="flex items-center space-x-2">
                      <div className="w-14 h-1.5 rounded-full bg-space-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-rose-soft"
                          style={{ width: `${anom.interestingness_score}%` }}
                        />
                      </div>
                      <span className="font-bold text-white">
                        {anom.interestingness_score.toFixed(1)}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono-sci">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        anom.evidence_confidence_tier === 'HIGH'
                          ? 'bg-emerald-soft/15 text-emerald-300 border-emerald-soft/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {anom.evidence_confidence_tier}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedObjectId(anom.object_id);
                        onNavigate('change_analysis');
                      }}
                      className="px-2 py-1 rounded bg-space-800 hover:bg-space-700 text-slate-300 hover:text-cyan-electric border border-space-600 text-[11px] font-mono-sci"
                    >
                      Compare
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedObjectId(anom.object_id);
                        onNavigate('discovery_passport');
                      }}
                      className="px-2 py-1 rounded bg-cyan-electric/20 hover:bg-cyan-electric/30 text-cyan-electric border border-cyan-electric/40 text-[11px] font-mono-sci"
                    >
                      Dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
