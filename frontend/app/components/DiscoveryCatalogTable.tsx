'use client';

import React, { useState } from 'react';
import { DiscoverySummary } from '../lib/types';

interface DiscoveryCatalogTableProps {
  discoveries: DiscoverySummary[];
  selectedObjectId: string;
  onSelectObject: (objectId: string) => void;
  categoryFilter: string;
  onChangeCategoryFilter: (category: string) => void;
}

export default function DiscoveryCatalogTable({
  discoveries,
  selectedObjectId,
  onSelectObject,
  categoryFilter,
  onChangeCategoryFilter,
}: DiscoveryCatalogTableProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'interestingness_score' | 'evidence_confidence_numeric' | 'motion_arcsec' | 'flux_variability_pct'>('interestingness_score');
  const [sortAsc, setSortAsc] = useState(false);

  const categories = [
    { key: 'all', label: 'All Sources' },
    { key: 'HIGH_PRIORITY', label: '★ High Priority' },
    { key: 'NEO', label: 'Moving Objects' },
    { key: 'VARIABLE', label: 'Variable Stars' },
    { key: 'TRANSIENT', label: 'Transients' },
    { key: 'ICE', label: 'Ice Cores' },
    { key: 'ARTIFACT', label: 'Artifacts' },
  ];

  const filtered = discoveries.filter((d) => {
    if (search && !d.object_id.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    const vA = a[sortBy] || 0;
    const vB = b[sortBy] || 0;
    return sortAsc ? (vA > vB ? 1 : -1) : (vA < vB ? 1 : -1);
  });

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(false);
    }
  };

  return (
    <div className="bg-[#050f19] border border-cyan-500/20 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <h3 className="text-sm font-mono tracking-wider uppercase text-cyan-200">
            Astronomical Triage Catalog ({filtered.length} sources)
          </h3>
        </div>
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search candidate ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs font-mono text-cyan-200 placeholder-cyan-500/40 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onChangeCategoryFilter(cat.key)}
            className={`px-2.5 py-1 rounded-xl text-xs font-mono transition-all ${
              categoryFilter === cat.key
                ? 'bg-cyan-500 text-black font-bold shadow-md'
                : 'bg-cyan-950/40 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto max-h-64 overflow-y-auto rounded-xl border border-cyan-500/15">
        <table className="w-full text-left text-xs font-mono select-none">
          <thead className="bg-[#071726] sticky top-0 border-b border-cyan-500/20 text-cyan-400/80">
            <tr>
              <th className="p-2.5">Candidate ID</th>
              <th className="p-2.5">Classification</th>
              <th
                className="p-2.5 cursor-pointer hover:text-cyan-200"
                onClick={() => toggleSort('interestingness_score')}
              >
                Interestingness {sortBy === 'interestingness_score' && (sortAsc ? '▲' : '▼')}
              </th>
              <th
                className="p-2.5 cursor-pointer hover:text-cyan-200"
                onClick={() => toggleSort('evidence_confidence_numeric')}
              >
                Confidence {sortBy === 'evidence_confidence_numeric' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="p-2.5">Priority</th>
              <th
                className="p-2.5 cursor-pointer hover:text-cyan-200"
                onClick={() => toggleSort('motion_arcsec')}
              >
                Motion {sortBy === 'motion_arcsec' && (sortAsc ? '▲' : '▼')}
              </th>
              <th
                className="p-2.5 cursor-pointer hover:text-cyan-200"
                onClick={() => toggleSort('flux_variability_pct')}
              >
                Variability {sortBy === 'flux_variability_pct' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="p-2.5">Quality Caveat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-500/10">
            {filtered.map((item) => {
              const isSelected = item.object_id === selectedObjectId;
              const isHigh = item.scientific_priority === 'HIGH';
              return (
                <tr
                  key={item.object_id}
                  onClick={() => onSelectObject(item.object_id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/20 text-white font-semibold'
                      : 'hover:bg-cyan-500/10 text-cyan-200'
                  }`}
                >
                  <td className="p-2.5 font-bold flex items-center gap-1.5">
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    <span>{item.object_id}</span>
                  </td>
                  <td className="p-2.5 text-[11px] text-cyan-300">
                    {item.primary_classification}
                  </td>
                  <td className="p-2.5">
                    <span
                      className={`font-bold ${
                        item.interestingness_score >= 70
                          ? 'text-amber-400'
                          : item.interestingness_score >= 40
                          ? 'text-cyan-300'
                          : 'text-cyan-600'
                      }`}
                    >
                      {item.interestingness_score.toFixed(0)}
                    </span>
                  </td>
                  <td className="p-2.5 text-cyan-300">
                    {item.evidence_confidence_numeric.toFixed(0)}%{' '}
                    <span className="text-[10px] text-cyan-400/60">({item.evidence_confidence_tier})</span>
                  </td>
                  <td className="p-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        isHigh
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : item.scientific_priority === 'MODERATE'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.scientific_priority}
                    </span>
                  </td>
                  <td className="p-2.5 text-cyan-300">
                    {item.motion_arcsec.toFixed(2)}&quot;
                  </td>
                  <td className="p-2.5 text-cyan-300">
                    {item.flux_variability_pct.toFixed(1)}%
                  </td>
                  <td className="p-2.5 text-[10px] text-cyan-400/70 max-w-[120px] truncate">
                    {item.quality_caveat}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
