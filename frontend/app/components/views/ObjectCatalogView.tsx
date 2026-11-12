'use client';

import React, { useState, useMemo } from 'react';
import { Region, DiscoverySummary, PageId } from '../../lib/types';
import {
  Table as TableIcon,
  Search,
  ArrowUpDown,
  Filter,
  Eye,
  GitCompare,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface ObjectCatalogViewProps {
  activeRegion: Region;
  discoveries: DiscoverySummary[];
  selectedObjectId: string;
  setSelectedObjectId: (id: string) => void;
  onNavigate: (page: PageId) => void;
}

export default function ObjectCatalogView({
  activeRegion,
  discoveries,
  selectedObjectId,
  setSelectedObjectId,
  onNavigate,
}: ObjectCatalogViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'id' | 'ra' | 'dec' | 'flux' | 'score'>('score');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  // Collect all unique sources from region epochs
  const allCatalogSources = useMemo(() => {
    const map = new Map<string, any>();
    activeRegion.epochs.forEach((ep) => {
      ep.sources.forEach((s) => {
        if (!map.has(s.id)) {
          const disc = discoveries.find((d) => d.object_id === s.id);
          map.set(s.id, {
            id: s.id,
            ra: s.ra,
            dec: s.dec,
            fluxes: [s.flux],
            flux_errs: [s.flux_err],
            flags: [s.flag],
            type: s.type || 'astronomical_source',
            epoch_count: 1,
            interestingness_score: disc?.interestingness_score || 0,
            scientific_priority: disc?.scientific_priority || 'LOW',
            confidence_tier: disc?.evidence_confidence_tier || 'MODERATE',
            dominant_dimension: disc?.dominant_dimension || 'quiescent',
          });
        } else {
          const item = map.get(s.id)!;
          item.fluxes.push(s.flux);
          item.flux_errs.push(s.flux_err);
          item.flags.push(s.flag);
          item.epoch_count += 1;
        }
      });
    });

    return Array.from(map.values()).map((s) => ({
      ...s,
      mean_flux: s.fluxes.reduce((a: number, b: number) => a + b, 0) / s.fluxes.length,
      has_flag_caution: s.flags.some((f: string) => f !== 'good'),
    }));
  }, [activeRegion, discoveries]);

  // Filter & Search
  const filteredSources = useMemo(() => {
    return allCatalogSources.filter((s) => {
      const matchesSearch =
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority =
        priorityFilter === 'ALL' || s.scientific_priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [allCatalogSources, searchTerm, priorityFilter]);

  // Sort
  const sortedSources = useMemo(() => {
    return [...filteredSources].sort((a, b) => {
      let valA: any = a[sortField === 'score' ? 'interestingness_score' : sortField];
      let valB: any = b[sortField === 'score' ? 'interestingness_score' : sortField];
      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [filteredSources, sortField, sortAsc]);

  // Paginate
  const totalPages = Math.ceil(sortedSources.length / pageSize) || 1;
  const paginatedSources = sortedSources.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelectForCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((s) => s !== id));
    } else {
      if (selectedForCompare.length < 3) {
        setSelectedForCompare([...selectedForCompare, id]);
      }
    }
  };

  const handleSort = (field: 'id' | 'ra' | 'dec' | 'flux' | 'score') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-space-600/60 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-cyan-electric/15 text-cyan-electric text-xs font-semibold uppercase tracking-wider font-mono-sci mb-1 border border-cyan-electric/30">
            <TableIcon className="w-3.5 h-3.5" />
            <span>Astronomical Source Catalog</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Identified Sources & Observational History
          </h1>
          <p className="text-xs text-slate-400">
            Survey field: {activeRegion.name} • Total sources cataloged: {allCatalogSources.length}
          </p>
        </div>

        {/* Multi-Select Compare Action */}
        {selectedForCompare.length >= 2 && (
          <button
            onClick={() => {
              setSelectedObjectId(selectedForCompare[0]);
              onNavigate('change_analysis');
            }}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-violet-cosmic hover:bg-violet-cosmic/80 text-white text-xs font-bold font-mono-sci transition-all shadow-violet-glow animate-pulse"
          >
            <GitCompare className="w-4 h-4" />
            <span>Compare Selected ({selectedForCompare.length}) in Change Analysis</span>
          </button>
        )}
      </div>

      {/* Search, Priority Filter, and Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by ID or type (e.g. DEMO-001, asteroid)..."
              className="w-full pl-9 pr-3 py-1.5 bg-space-950 text-slate-200 placeholder-slate-500 text-xs rounded-lg border border-space-600/60 focus:border-cyan-electric/70 focus:outline-none font-mono-sci"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {['ALL', 'HIGH', 'MODERATE', 'LOW'].map((p) => (
            <button
              key={p}
              onClick={() => {
                setPriorityFilter(p);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono-sci font-semibold transition-all border ${
                priorityFilter === p
                  ? 'bg-cyan-electric/20 text-cyan-electric border-cyan-electric/50'
                  : 'bg-space-800 text-slate-400 border-space-600/60 hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="glass-panel rounded-xl border border-space-600/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-space-600/60 bg-space-950/60 text-slate-400 font-mono-sci text-[11px]">
                <th className="py-3 px-3 w-10 text-center">Compare</th>
                <th
                  onClick={() => handleSort('id')}
                  className="py-3 px-3 cursor-pointer hover:text-cyan-electric transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Object ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('ra')}
                  className="py-3 px-3 cursor-pointer hover:text-cyan-electric transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>RA (J2000)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('dec')}
                  className="py-3 px-3 cursor-pointer hover:text-cyan-electric transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Dec (J2000)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Observations</th>
                <th
                  onClick={() => handleSort('flux')}
                  className="py-3 px-3 cursor-pointer hover:text-cyan-electric transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Mean Flux</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('score')}
                  className="py-3 px-3 cursor-pointer hover:text-cyan-electric transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Interestingness</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Quality</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-600/40">
              {paginatedSources.map((src) => {
                const isSelected = selectedObjectId === src.id;
                const isCheckedForCompare = selectedForCompare.includes(src.id);

                return (
                  <tr
                    key={src.id}
                    onClick={() => setSelectedObjectId(src.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-electric/10 border-l-2 border-l-cyan-electric'
                        : 'hover:bg-space-800/50'
                    }`}
                  >
                    <td
                      className="py-3 px-3 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectForCompare(src.id);
                      }}
                    >
                      {isCheckedForCompare ? (
                        <CheckSquare className="w-4 h-4 text-violet-cosmic mx-auto" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 hover:text-slate-300 mx-auto" />
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono-sci font-bold text-white flex items-center space-x-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          src.scientific_priority === 'HIGH' ? 'bg-cyan-electric' : 'bg-slate-500'
                        }`}
                      />
                      <span>{src.id}</span>
                    </td>

                    <td className="py-3 px-3 font-mono-sci text-slate-300">
                      {src.ra.toFixed(5)}°
                    </td>

                    <td className="py-3 px-3 font-mono-sci text-slate-300">
                      {src.dec.toFixed(5)}°
                    </td>

                    <td className="py-3 px-3 font-mono-sci text-white">
                      {src.epoch_count} epochs
                    </td>

                    <td className="py-3 px-3 font-mono-sci text-slate-200">
                      {src.mean_flux.toFixed(1)} µJy
                    </td>

                    <td className="py-3 px-3 font-mono-sci">
                      <div className="flex items-center space-x-2">
                        <div className="w-14 h-1.5 rounded-full bg-space-800 overflow-hidden">
                          <div
                            className="h-full bg-cyan-electric"
                            style={{ width: `${Math.min(100, src.interestingness_score)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-white">
                          {src.interestingness_score.toFixed(1)}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono-sci">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          src.scientific_priority === 'HIGH'
                            ? 'bg-cyan-electric/20 text-cyan-electric border border-cyan-electric/40'
                            : 'bg-space-800 text-slate-400 border border-space-600'
                        }`}
                      >
                        {src.scientific_priority}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono-sci font-semibold ${
                          src.has_flag_caution
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-soft/15 text-emerald-300 border border-emerald-soft/30'
                        }`}
                      >
                        {src.has_flag_caution ? 'CAUTION' : 'PASS'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedObjectId(src.id);
                          onNavigate('change_analysis');
                        }}
                        className="px-2 py-1 rounded bg-space-800 hover:bg-space-700 text-slate-300 hover:text-cyan-electric border border-space-600 text-[11px] font-mono-sci"
                      >
                        Compare
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedObjectId(src.id);
                          onNavigate('discovery_passport');
                        }}
                        className="px-2 py-1 rounded bg-cyan-electric/20 hover:bg-cyan-electric/30 text-cyan-electric border border-cyan-electric/40 text-[11px] font-mono-sci"
                      >
                        Dossier
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-space-600/50 bg-space-950/40 flex items-center justify-between text-xs font-mono-sci text-slate-400">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, sortedSources.length)} of {sortedSources.length} sources
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="p-1 rounded bg-space-800 disabled:opacity-40 hover:bg-space-700 text-slate-300 border border-space-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="p-1 rounded bg-space-800 disabled:opacity-40 hover:bg-space-700 text-slate-300 border border-space-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
