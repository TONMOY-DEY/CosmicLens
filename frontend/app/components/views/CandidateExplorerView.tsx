'use client';

import React, { useState } from 'react';
import { DiscoverySummary, Region, PageId } from '../../lib/types';
import {
  Sparkles,
  Filter,
  Grid,
  List,
  Compass,
  Activity,
  Layers,
  Clock,
  AlertTriangle,
  Award,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Eye,
  CheckCircle2,
} from 'lucide-react';

interface CandidateExplorerViewProps {
  discoveries: DiscoverySummary[];
  selectedObjectId: string;
  setSelectedObjectId: (id: string) => void;
  onNavigate: (page: PageId) => void;
}

export default function CandidateExplorerView({
  discoveries,
  selectedObjectId,
  setSelectedObjectId,
  onNavigate,
}: CandidateExplorerViewProps) {
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filter candidates
  const filteredCandidates = discoveries.filter((c) => {
    const matchesPriority =
      priorityFilter === 'ALL' || c.scientific_priority === priorityFilter;
    const matchesCategory =
      categoryFilter === 'ALL' ||
      c.dominant_dimension.toLowerCase().includes(categoryFilter.toLowerCase()) ||
      (c.primary_classification &&
        c.primary_classification.toLowerCase().includes(categoryFilter.toLowerCase()));
    return matchesPriority && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-space-600/60 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-cyan-electric/15 text-cyan-electric text-xs font-semibold uppercase tracking-wider font-mono-sci mb-1 border border-cyan-electric/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Candidate Investigation Workspace</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Scientific Discovery Candidate Triage
          </h1>
          <p className="text-xs text-slate-400">
            Evaluating interestingness against evidence confidence to separate genuine astrophysical candidates from artifacts.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2 self-start md:self-auto font-mono-sci text-xs">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg border transition-all ${
              viewMode === 'cards'
                ? 'bg-cyan-electric/20 text-cyan-electric border-cyan-electric/50'
                : 'bg-space-800 text-slate-400 border-space-600 hover:text-white'
            }`}
            title="Card Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg border transition-all ${
              viewMode === 'table'
                ? 'bg-cyan-electric/20 text-cyan-electric border-cyan-electric/50'
                : 'bg-space-800 text-slate-400 border-space-600 hover:text-white'
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bars */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Priority Filter */}
        <div className="flex items-center space-x-2 font-mono-sci text-xs">
          <span className="text-slate-400">Priority:</span>
          {['ALL', 'HIGH', 'MODERATE', 'LOW'].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all border ${
                priorityFilter === p
                  ? 'bg-cyan-electric/20 text-cyan-electric border-cyan-electric/50'
                  : 'bg-space-800 text-slate-400 border-space-600/60 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Category Dimension Filter */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono-sci text-xs">
          <span className="text-slate-400 mr-1">Category:</span>
          {['ALL', 'MOTION', 'PHOTO', 'SPECTR', 'TEMP', 'CONTEXT'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                categoryFilter === cat
                  ? 'bg-violet-cosmic/20 text-violet-cosmic border-violet-cosmic/50'
                  : 'bg-space-800/80 text-slate-400 border-space-600/50 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Scientific Principle Notice: Interestingness vs Confidence */}
      <div className="p-3.5 rounded-xl bg-space-950/80 border border-space-600/60 flex items-start space-x-3 text-xs text-slate-300">
        <ShieldCheck className="w-4 h-4 text-cyan-electric shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Scientific Separation Principle: </span>
          <span className="text-slate-300">
            <b>Scientific Interestingness</b> quantifies observational novelty and physical change, whereas <b>Evidence Confidence</b> measures instrumental measurement quality and multi-epoch repeatability. An anomaly with high interestingness does not automatically constitute a confirmed discovery without high confidence!
          </span>
        </div>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCandidates.map((cand) => {
            const isSelected = selectedObjectId === cand.object_id;

            return (
              <div
                key={cand.object_id}
                onClick={() => setSelectedObjectId(cand.object_id)}
                className={`glass-panel p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:translate-y-[-2px] ${
                  isSelected
                    ? 'border-cyan-electric/70 shadow-cyan-glow bg-space-800/90'
                    : 'border-space-600/60 hover:border-cyan-electric/40'
                }`}
              >
                <div>
                  {/* Top card bar: ID + Priority badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          cand.scientific_priority === 'HIGH'
                            ? 'bg-cyan-electric animate-pulse'
                            : 'bg-violet-cosmic'
                        }`}
                      />
                      <span className="text-sm font-bold text-white font-mono-sci tracking-wide">
                        {cand.object_id}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono-sci font-bold border ${
                        cand.scientific_priority === 'HIGH'
                          ? 'bg-cyan-electric/20 text-cyan-electric border-cyan-electric/40'
                          : 'bg-space-700/60 text-slate-300 border-space-600'
                      }`}
                    >
                      {cand.scientific_priority}
                    </span>
                  </div>

                  {/* Classification Title */}
                  <div className="text-xs font-semibold text-slate-200">
                    {cand.primary_classification}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {cand.why_interesting_summary}
                  </div>

                  {/* Dual Gauge: Interestingness vs Confidence */}
                  <div className="mt-4 p-3 rounded-xl bg-space-950/70 border border-space-600/40 space-y-2.5 font-mono-sci text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Scientific Interestingness:</span>
                        <span className="font-bold text-cyan-electric">
                          {cand.interestingness_score.toFixed(1)} / 100
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-space-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-electric to-violet-cosmic"
                          style={{ width: `${cand.interestingness_score}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Evidence Confidence:</span>
                        <span
                          className={`font-bold ${
                            cand.evidence_confidence_tier === 'HIGH'
                              ? 'text-emerald-soft'
                              : cand.evidence_confidence_tier === 'MODERATE'
                              ? 'text-amber-400'
                              : 'text-rose-soft'
                          }`}
                        >
                          {cand.evidence_confidence_tier} ({cand.evidence_confidence_numeric.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-space-800 overflow-hidden">
                        <div
                          className={`h-full ${
                            cand.evidence_confidence_tier === 'HIGH'
                              ? 'bg-emerald-soft'
                              : cand.evidence_confidence_tier === 'MODERATE'
                              ? 'bg-amber-400'
                              : 'bg-rose-soft'
                          }`}
                          style={{ width: `${cand.evidence_confidence_numeric}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Physical metrics pill */}
                  <div className="mt-3 flex items-center justify-between text-[11px] font-mono-sci text-slate-400">
                    <span>RA: {cand.ra_mean.toFixed(3)}°</span>
                    <span>Dec: {cand.dec_mean.toFixed(3)}°</span>
                    <span className="text-white font-bold">{cand.usable_epoch_count} epochs</span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-space-600/40 flex items-center justify-between">
                  <span className="text-[10px] font-mono-sci text-slate-400 truncate max-w-[150px]">
                    {cand.dominant_dimension}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedObjectId(cand.object_id);
                        onNavigate('change_analysis');
                      }}
                      className="px-2 py-1 rounded bg-space-800 hover:bg-space-700 text-slate-300 hover:text-white border border-space-600 text-[11px] font-mono-sci transition-colors"
                    >
                      Compare
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedObjectId(cand.object_id);
                        onNavigate('discovery_passport');
                      }}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded bg-cyan-electric/20 hover:bg-cyan-electric/30 text-cyan-electric hover:text-white border border-cyan-electric/40 text-[11px] font-mono-sci font-bold transition-all shadow-cyan-glow"
                    >
                      <span>Dossier</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="glass-panel rounded-xl border border-space-600/60 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-space-600/60 bg-space-950/60 text-slate-400 font-mono-sci text-[11px]">
                  <th className="py-3 px-3">Candidate ID</th>
                  <th className="py-3 px-3">Classification</th>
                  <th className="py-3 px-3">Interestingness</th>
                  <th className="py-3 px-3">Evidence Confidence</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Dominant Dimension</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-space-600/40">
                {filteredCandidates.map((cand) => (
                  <tr
                    key={cand.object_id}
                    onClick={() => setSelectedObjectId(cand.object_id)}
                    className="hover:bg-space-800/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-mono-sci font-bold text-white">
                      {cand.object_id}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {cand.primary_classification}
                    </td>
                    <td className="py-3 px-3 font-mono-sci font-bold text-cyan-electric">
                      {cand.interestingness_score.toFixed(1)} / 100
                    </td>
                    <td className="py-3 px-3 font-mono-sci font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] border ${
                          cand.evidence_confidence_tier === 'HIGH'
                            ? 'bg-emerald-soft/15 text-emerald-300 border-emerald-soft/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {cand.evidence_confidence_tier}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono-sci">
                      <span className="px-2 py-0.5 rounded bg-space-800 text-cyan-electric border border-space-600 font-bold text-[10px]">
                        {cand.scientific_priority}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono-sci text-slate-400">
                      {cand.dominant_dimension}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedObjectId(cand.object_id);
                          onNavigate('change_analysis');
                        }}
                        className="px-2 py-1 rounded bg-space-800 hover:bg-space-700 text-slate-300 hover:text-white border border-space-600 text-[11px] font-mono-sci"
                      >
                        Compare
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedObjectId(cand.object_id);
                          onNavigate('discovery_passport');
                        }}
                        className="px-2.5 py-1 rounded bg-cyan-electric/20 text-cyan-electric border border-cyan-electric/40 text-[11px] font-mono-sci font-bold"
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
      )}
    </div>
  );
}
