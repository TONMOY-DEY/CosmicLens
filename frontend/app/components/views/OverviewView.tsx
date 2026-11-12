'use client';

import React from 'react';
import { PageId, Region, DiscoverySummary } from '../../lib/types';
import {
  Sparkles,
  Compass,
  Database,
  GitCompare,
  AlertTriangle,
  Award,
  ShieldCheck,
  Activity,
  ArrowRight,
  TrendingUp,
  Flame,
  CheckCircle2,
  Clock,
  Eye,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface OverviewViewProps {
  activeRegion: Region;
  discoveries: DiscoverySummary[];
  onNavigate: (page: PageId) => void;
  onSelectCandidate: (candidateId: string) => void;
  totalDatasetsCount: number;
}

export default function OverviewView({
  activeRegion,
  discoveries,
  onNavigate,
  onSelectCandidate,
  totalDatasetsCount,
}: OverviewViewProps) {
  // Aggregate actual statistics
  const totalObjects = new Set(activeRegion?.epochs?.flatMap((ep) => ep.sources.map((s) => s.id)) || []).size;
  const totalObservations = activeRegion?.epochs?.reduce((acc, ep) => acc + ep.sources.length, 0) || 0;
  const highPriorityCandidates = discoveries.filter((d) => d.scientific_priority === 'HIGH');
  const anomaliesCount = discoveries.filter((d) => d.interestingness_score >= 50).length;

  // Anomaly distribution across 5 dimensions from real discoveries
  const dimensionCounts: Record<string, number> = {
    Motion: 0,
    Photometry: 0,
    Spectral: 0,
    Temporal: 0,
    Context: 0,
  };
  discoveries.forEach((d) => {
    const dim = d.dominant_dimension.toLowerCase();
    if (dim.includes('motion') || dim.includes('astrometric')) dimensionCounts.Motion += 1;
    else if (dim.includes('photo') || dim.includes('variab')) dimensionCounts.Photometry += 1;
    else if (dim.includes('spectr')) dimensionCounts.Spectral += 1;
    else if (dim.includes('temp') || dim.includes('dynam')) dimensionCounts.Temporal += 1;
    else dimensionCounts.Context += 1;
  });

  const anomalyChartData = Object.entries(dimensionCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // Observation activity by epoch
  const activityData = activeRegion?.epochs?.map((ep, idx) => ({
    epoch: `Epoch ${idx + 1}`,
    sources: ep.sources.length,
    timestamp: ep.timestamp.slice(0, 10),
  })) || [];

  // Priority distribution
  const priorityData = [
    { name: 'High Priority', value: highPriorityCandidates.length, color: '#36D9FF' },
    { name: 'Moderate', value: discoveries.filter((d) => d.scientific_priority === 'MODERATE').length, color: '#9274FF' },
    { name: 'Low / Quiescent', value: discoveries.filter((d) => d.scientific_priority === 'LOW').length, color: '#4B5563' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* 1. Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-8 border border-cyan-electric/30 shadow-glass">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-cyan-electric/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-violet-cosmic/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-electric/15 border border-cyan-electric/40 text-cyan-electric text-xs font-semibold uppercase tracking-wider font-mono-sci">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NASA SPHEREx Multi-Epoch Discovery Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              SKYTRACE <span className="text-cyan-electric">AI</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              An Explainable AI Scientific Discovery Engine for the Changing Infrared Sky.
              Compare multi-epoch SPHEREx infrared observations, trace proper motion, detect photometric variability, and validate authentic physical anomalies.
            </p>
            <div className="text-[11px] text-amber-300/90 font-mono-sci flex items-center space-x-1.5 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>SIMULATED DEMO DATA — NOT A REAL ASTRONOMICAL DISCOVERY</span>
            </div>
          </div>

          {/* Quick Action Launchpad */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => onNavigate('sky_explorer')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-electric/20 to-cyan-electric/10 hover:from-cyan-electric/30 hover:to-cyan-electric/20 border border-cyan-electric/40 text-cyan-electric text-xs font-semibold tracking-wide transition-all shadow-cyan-glow"
            >
              <Compass className="w-4 h-4" />
              <span>Sky Explorer</span>
            </button>
            <button
              onClick={() => onNavigate('data_center')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-space-800/90 hover:bg-space-700 border border-space-600/70 hover:border-cyan-electric/40 text-white text-xs font-semibold tracking-wide transition-all"
            >
              <Database className="w-4 h-4 text-cyan-electric" />
              <span>Data Center</span>
            </button>
            <button
              onClick={() => onNavigate('change_analysis')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-space-800/90 hover:bg-space-700 border border-space-600/70 hover:border-violet-cosmic/40 text-white text-xs font-semibold tracking-wide transition-all"
            >
              <GitCompare className="w-4 h-4 text-violet-cosmic" />
              <span>Change Analysis</span>
            </button>
            <button
              onClick={() => onNavigate('candidate_explorer')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-space-800/90 hover:bg-space-700 border border-space-600/70 hover:border-amber-400/40 text-white text-xs font-semibold tracking-wide transition-all"
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Candidates</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Scientific Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="glass-panel p-4 rounded-xl border border-space-600/50">
          <div className="text-[10px] text-slate-400 uppercase font-mono-sci">Imported Datasets</div>
          <div className="mt-1 text-2xl font-bold text-white font-mono-sci">{totalDatasetsCount}</div>
          <div className="text-[10px] text-cyan-electric flex items-center space-x-1 mt-0.5">
            <Database className="w-3 h-3" />
            <span>FITS / CSV Store</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-space-600/50">
          <div className="text-[10px] text-slate-400 uppercase font-mono-sci">Identified Sources</div>
          <div className="mt-1 text-2xl font-bold text-white font-mono-sci">{totalObjects}</div>
          <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
            <Compass className="w-3 h-3 text-cyan-electric" />
            <span>{activeRegion?.name || 'Active Field'}</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-space-600/50">
          <div className="text-[10px] text-slate-400 uppercase font-mono-sci">Total Observations</div>
          <div className="mt-1 text-2xl font-bold text-white font-mono-sci">{totalObservations}</div>
          <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
            <Clock className="w-3 h-3 text-violet-cosmic" />
            <span>{activeRegion?.epochs?.length || 4} Epochs</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-space-600/50">
          <div className="text-[10px] text-slate-400 uppercase font-mono-sci">Anomalies Detected</div>
          <div className="mt-1 text-2xl font-bold text-amber-400 font-mono-sci">{anomaliesCount}</div>
          <div className="text-[10px] text-amber-300/80 flex items-center space-x-1 mt-0.5">
            <AlertTriangle className="w-3 h-3" />
            <span>Score ≥ 50.0</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-space-600/50">
          <div className="text-[10px] text-slate-400 uppercase font-mono-sci">High Priority Triage</div>
          <div className="mt-1 text-2xl font-bold text-cyan-electric font-mono-sci">
            {highPriorityCandidates.length}
          </div>
          <div className="text-[10px] text-cyan-300/80 flex items-center space-x-1 mt-0.5">
            <Sparkles className="w-3 h-3" />
            <span>Requires Follow-Up</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-space-600/50">
          <div className="text-[10px] text-slate-400 uppercase font-mono-sci">Data Quality</div>
          <div className="mt-1 text-2xl font-bold text-emerald-soft font-mono-sci">96.8%</div>
          <div className="text-[10px] text-emerald-300/80 flex items-center space-x-1 mt-0.5">
            <ShieldCheck className="w-3 h-3" />
            <span>SNR &gt; 5 Confirmed</span>
          </div>
        </div>
      </div>

      {/* 3. Scientific Data Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart A: Anomaly Distribution Across 5 Dimensions */}
        <div className="glass-panel p-5 rounded-xl border border-space-600/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>5-Dimensional Anomaly Breakdown</span>
              </h3>
              <span className="text-[10px] font-mono-sci text-cyan-electric">SPHEREx AI</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Distribution of flagged candidates across independent physical analysis dimensions.
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={anomalyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1024',
                    border: '1px solid rgba(54, 217, 255, 0.3)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {anomalyChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? '#36D9FF' : index === 1 ? '#9274FF' : index === 2 ? '#38BDF8' : '#F59E0B'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Multi-Epoch Observation Cadence */}
        <div className="glass-panel p-5 rounded-xl border border-space-600/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-electric" />
                <span>Observation Cadence & Coverage</span>
              </h3>
              <span className="text-[10px] font-mono-sci text-slate-400">Time-Series</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Source counts across survey epochs in {activeRegion?.name || 'Survey Field'}.
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="epoch" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1024',
                    border: '1px solid rgba(146, 116, 255, 0.3)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="sources" fill="#36D9FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart C: Priority Triage Distribution */}
        <div className="glass-panel p-5 rounded-xl border border-space-600/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-soft" />
                <span>Triage Priority Distribution</span>
              </h3>
              <span className="text-[10px] font-mono-sci text-slate-400">Scientific Triage</span>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              Partitioning candidates by verification confidence and scientific urgency.
            </p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-p-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1024',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-around text-[11px] font-mono-sci pt-2 border-t border-space-600/40">
            <span className="text-cyan-electric">High: {highPriorityCandidates.length}</span>
            <span className="text-violet-cosmic">
              Mod: {discoveries.filter((d) => d.scientific_priority === 'MODERATE').length}
            </span>
            <span className="text-slate-400">
              Low: {discoveries.filter((d) => d.scientific_priority === 'LOW').length}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Top Interesting Candidates Table */}
      <div className="glass-panel rounded-xl border border-space-600/50 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-electric" />
              <span>Top Scientific Candidates Requiring Investigation</span>
            </h3>
            <p className="text-xs text-slate-400">
              Ranked by Scientific Interestingness score with separated Evidence Confidence rating.
            </p>
          </div>
          <button
            onClick={() => onNavigate('candidate_explorer')}
            className="flex items-center space-x-1.5 text-xs text-cyan-electric hover:text-cyan-glow font-medium transition-colors"
          >
            <span>View All Candidates ({discoveries.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-space-600/60 text-slate-400 font-mono-sci text-[11px]">
                <th className="py-2.5 px-3">Candidate ID</th>
                <th className="py-2.5 px-3">Coordinates (J2000)</th>
                <th className="py-2.5 px-3">Interestingness</th>
                <th className="py-2.5 px-3">Evidence Confidence</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Physical Signature</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-600/40">
              {discoveries.slice(0, 5).map((cand) => (
                <tr
                  key={cand.object_id}
                  className="hover:bg-space-800/60 transition-colors group"
                >
                  <td className="py-3 px-3 font-mono-sci font-bold text-white flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-electric" />
                    <span>{cand.object_id}</span>
                  </td>
                  <td className="py-3 px-3 font-mono-sci text-slate-300 text-[11px]">
                    RA: {cand.ra_mean.toFixed(4)}° • Dec: {cand.dec_mean.toFixed(4)}°
                  </td>
                  <td className="py-3 px-3 font-mono-sci">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-1.5 rounded-full bg-space-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-electric to-violet-cosmic"
                          style={{ width: `${cand.interestingness_score}%` }}
                        />
                      </div>
                      <span className="font-semibold text-white">
                        {cand.interestingness_score.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono-sci font-semibold border ${
                        cand.evidence_confidence_tier === 'HIGH'
                          ? 'bg-emerald-soft/15 text-emerald-300 border-emerald-soft/30'
                          : cand.evidence_confidence_tier === 'MODERATE'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-rose-soft/15 text-rose-300 border-rose-soft/30'
                      }`}
                    >
                      {cand.evidence_confidence_tier}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono-sci">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cand.scientific_priority === 'HIGH'
                          ? 'bg-cyan-electric/20 text-cyan-electric border border-cyan-electric/40'
                          : 'bg-space-700/60 text-slate-300 border border-space-600/50'
                      }`}
                    >
                      {cand.scientific_priority}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                    {cand.why_interesting_summary}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => {
                        onSelectCandidate(cand.object_id);
                        onNavigate('discovery_passport');
                      }}
                      className="px-2.5 py-1 rounded bg-space-800 hover:bg-cyan-electric/20 text-cyan-electric hover:text-white border border-space-600/70 hover:border-cyan-electric/50 text-[11px] font-mono-sci transition-colors"
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
